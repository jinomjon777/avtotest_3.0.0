// @ts-nocheck
// Supabase Edge Function (Deno). VSCode'dagi "Deno topilmadi" kabi xatolar shu sababli — e'tibor bermang.
//
// Kunlik reja eslatmalari: Telegram xabari + push-bildirishnoma.
//   POST {action:"run"}   — pg_cron har 5 daqiqada chaqiradi (sarlavha x-cron-secret: REMINDER_CRON_SECRET).
//                           due_reminders() qaytargan har foydalanuvchiga yuboradi va mark_reminder_sent().
//   POST {action:"vapid"} — push obunasi uchun ochiq VAPID kalitini beradi (maxfiy emas).
//   POST {action:"test"}  — tizimga kirgan foydalanuvchining o'ziga sinov xabari (sozlamalarni tekshirish).
//
// Kerakli secret'lar: TELEGRAM_BOT_TOKEN, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, REMINDER_CRON_SECRET,
// ixtiyoriy: SITE_URL (standart https://smartavto.uz), VAPID_SUBJECT (standart mailto:admin@smartavto.uz).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

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
      text: `<b>${title}</b>\n${body}`,
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
    const code = e?.statusCode;
    return code === 404 || code === 410 ? "gone" : "error";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: any = {};
  try { body = await req.json(); } catch { /* bo'sh */ }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // ── Ochiq VAPID kaliti ──────────────────────────────────────────
  if (body.action === "vapid") {
    return json({ ok: pushReady, publicKey: VAPID_PUBLIC || null });
  }

  // ── Sinov xabari: faqat o'ziga ──────────────────────────────────
  if (body.action === "test") {
    const auth = req.headers.get("Authorization") ?? "";
    const { data: { user } } = await supabase.auth.getUser(auth.replace(/^Bearer /, ""));
    if (!user) return json({ error: "not_authenticated" }, 401);
    const [{ data: link }, { data: subs }] = await Promise.all([
      supabase.from("telegram_links").select("chat_id").eq("user_id", user.id).maybeSingle(),
      supabase.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", user.id),
    ]);
    const title = "✅ Sinov eslatmasi";
    const text = "Eslatmalar ishlayapti. Belgilangan vaqtda shu ko'rinishda xabar keladi.";
    const telegram = link?.chat_id ? await sendTelegram(link.chat_id, title, text) : "none";
    const push = [];
    for (const s of subs ?? []) {
      const r = await sendPush(s, title, text);
      if (r === "gone") await supabase.rpc("delete_push_endpoint", { p_endpoint: s.endpoint });
      push.push(r);
    }
    return json({ ok: true, telegram, push });
  }

  // ── Rejali yuborish (pg_cron) ───────────────────────────────────
  if (body.action === "run") {
    if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
      return json({ error: "forbidden" }, 403);
    }
    const { data: due, error } = await supabase.rpc("due_reminders");
    if (error) return json({ error: "server_error", detail: error.message }, 500);

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
    return json({ ok: true, ...stats });
  }

  return json({ error: "bad_request" }, 400);
});
