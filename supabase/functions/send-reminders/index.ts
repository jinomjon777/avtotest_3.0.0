//
// Kunlik reja eslatmalari: Telegram xabari + push-bildirishnoma.
//   POST {action:"run"}   — pg_cron har 5 daqiqada chaqiradi (sarlavha x-cron-secret: REMINDER_CRON_SECRET).
//                           due_reminders() qaytargan har foydalanuvchiga yuboradi va mark_reminder_sent().
//   POST {action:"vapid"} — push obunasi uchun ochiq VAPID kalitini beradi (maxfiy emas).
//   POST {action:"test"}  — tizimga kirgan foydalanuvchining o'ziga sinov xabari (sozlamalarni tekshirish).
//
// Kerakli secret'lar: TELEGRAM_BOT_TOKEN, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, REMINDER_CRON_SECRET,
// ixtiyoriy: SITE_URL (standart https://smartavto.uz), VAPID_SUBJECT (standart mailto:admin@smartavto.uz).

import webpush from "npm:web-push@3.6.7";
import { jsonResponse, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/supabase.ts";
import { escapeHtml } from "../_shared/html.ts";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const CRON_SECRET = Deno.env.get("REMINDER_CRON_SECRET") ?? "";
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://smartavto.uz").replace(/\/$/, "");
const PLAN_URL = `${SITE_URL}/kunlik-reja`;

const pushReady = !!(VAPID_PUBLIC && VAPID_PRIVATE);
if (pushReady) {
  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@smartavto.uz", VAPID_PUBLIC, VAPID_PRIVATE);
}

/** Maxfiy kalitni vaqt bo'yicha sizdirmaydigan solishtirish */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Eslatma matni: birinchisi — "vaqt keldi", keyingilari — qolgan testlar soni bilan. */
export function reminderText(done: number, target: number, sentCount: number) {
  const left = Math.max(0, target - done);
  if (sentCount === 0) {
    return {
      title: "⏰ Test vaqti keldi!",
      body: `Bugungi reja: ${done}/${target}. ${left} ta test ishlang — har biri 20 ta savol.`,
    };
  }
  return {
    title: `📌 Bugungi reja: ${done}/${target}`,
    body: `Yana ${left} ta test qoldi. Hozir boshlang — rejani yakunlamaguningizcha eslatib turamiz.`,
  };
}

async function sendTelegram(chatId: number, title: string, body: string): Promise<"ok" | "blocked" | "error"> {
  if (!BOT_TOKEN) return "error";
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: `<b>${escapeHtml(title)}</b>\n${escapeHtml(body)}`,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "▶️ Testni boshlash", url: PLAN_URL }]] },
    }),
  }).catch(() => null);
  if (!res) return "error";
  if (res.status === 403) return "blocked"; // foydalanuvchi botni bloklagan
  return res.ok ? "ok" : "error";
}

async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, title: string, body: string): Promise<"ok" | "gone" | "error"> {
  if (!pushReady) return "error";
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title, body, url: PLAN_URL, tag: "daily-plan" }),
      { TTL: 1800, urgency: "high" },
    );
    return "ok";
  } catch (e) {
    const code = (e as { statusCode?: number })?.statusCode;
    return code === 404 || code === 410 ? "gone" : "error";
  }
}

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") return jsonResponse(req, { error: "method_not_allowed" }, 405);

  let body: { action?: string } = {};
  try { body = await req.json(); } catch { /* bo'sh */ }
  const supabase = adminClient();

  try {
    // ── Ochiq VAPID kaliti ──────────────────────────────────────────
    if (body.action === "vapid") {
      return jsonResponse(req, { ok: pushReady, publicKey: VAPID_PUBLIC || null }, 200, { "Cache-Control": "public, max-age=3600" });
    }

    // ── Sinov xabari: faqat o'ziga, 10 daqiqada ko'pi bilan 3 marta ──
    if (body.action === "test") {
      const user = await getUser(req);
      if (!user) return jsonResponse(req, { error: "not_authenticated" }, 401);
      const { data: okRate } = await supabase.rpc("check_rate_limit", {
        p_identifier: user.id, p_action: "reminder_test", p_max_hits: 3, p_window_min: 10,
      });
      if (okRate === false) return jsonResponse(req, { error: "rate_limited" }, 429);
      const [{ data: link }, { data: subs }] = await Promise.all([
        supabase.from("telegram_links").select("chat_id").eq("user_id", user.id).maybeSingle(),
        supabase.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", user.id),
      ]);
      const title = "✅ Sinov eslatmasi";
      const text = "Eslatmalar ishlayapti. Belgilangan vaqtda shu ko'rinishda xabar keladi.";
      const telegram = link?.chat_id ? await sendTelegram(link.chat_id, title, text) : "none";
      const push: string[] = [];
      for (const s of subs ?? []) {
        const r = await sendPush(s, title, text);
        if (r === "gone") await supabase.rpc("delete_push_endpoint", { p_endpoint: s.endpoint });
        push.push(r);
      }
      return jsonResponse(req, { ok: true, telegram, push });
    }

    // ── Rejali yuborish (pg_cron) ───────────────────────────────────
    if (body.action === "run") {
      if (!CRON_SECRET || !safeEqual(req.headers.get("x-cron-secret") ?? "", CRON_SECRET)) {
        return jsonResponse(req, { error: "forbidden" }, 403);
      }
      const { data: due, error } = await supabase.rpc("due_reminders");
      if (error) return jsonResponse(req, { error: "server_error" }, 500);

      const stats = { users: 0, telegram: 0, push: 0, failed: 0 };
      for (const r of due ?? []) {
        const { title, body: text } = reminderText(r.done, r.target, r.sent_count);
        let delivered = false;
        if (r.chat_id) {
          const t = await sendTelegram(r.chat_id, title, text);
          if (t === "ok") { delivered = true; stats.telegram++; }
          if (t === "blocked") await supabase.from("telegram_links").delete().eq("chat_id", r.chat_id);
        }
        for (const s of r.subscriptions ?? []) {
          const p = await sendPush(s, title, text);
          if (p === "ok") { delivered = true; stats.push++; }
          if (p === "gone") await supabase.rpc("delete_push_endpoint", { p_endpoint: s.endpoint });
        }
        // Kanal bo'lmasa ham belgilanadi — aks holda har 5 daqiqada qayta tekshirilaverardi
        await supabase.rpc("mark_reminder_sent", { p_uid: r.user_id });
        stats.users++;
        if (!delivered) stats.failed++;
      }
      return jsonResponse(req, { ok: true, ...stats });
    }

    return jsonResponse(req, { error: "bad_request" }, 400);
  } catch (e) {
    console.error("send-reminders:", e);
    return jsonResponse(req, { error: "server_error" }, 500);
  }
});

