// Supabase Edge Function (Deno): admin panel amallari.
// Har so'rovda: haqiqiy Supabase Auth JWT + has_role(admin). Barcha amallar audit_log'ga yoziladi.
// Premium faqat bazadagi grant_premium() orqali beriladi (atomar, faol tarifni uzaytiradi,
// chek bilan berilsa — bir chek ikki marta ishlatilmaydi).

import { jsonResponse, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/supabase.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE = 1000;

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function notifyTelegramUser(chatId: number | null | undefined, text: string) {
  if (!TELEGRAM_BOT_TOKEN || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch (e) {
    console.error("Telegram xabar yuborilmadi:", e);
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("uz-UZ", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", year: "numeric" });
}

/** chek_link → receipts bucket ichidagi yo'l (eski ommaviy URL yoki yangi "receipts/<yo'l>" formati). */
function receiptPath(link: string | null): string | null {
  if (!link) return null;
  if (link.startsWith("receipts/")) return link.slice("receipts/".length);
  const m = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/receipts\/([^?]+)/.exec(link);
  return m ? decodeURIComponent(m[1]) : null;
}

function reqUuid(v: unknown, name: string): string {
  if (typeof v !== "string" || !UUID_RE.test(v)) throw new HttpError(400, `${name} noto'g'ri`);
  return v;
}
function reqDays(v: unknown): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 3650) throw new HttpError(400, "Kun 1..3650 oralig'ida butun son bo'lishi kerak");
  return n;
}
function optAmount(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 100_000_000) throw new HttpError(400, "Summa noto'g'ri");
  return n;
}

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") return jsonResponse(req, { error: "method_not_allowed" }, 405);

  const sb = adminClient();
  const user = await getUser(req);
  if (!user) return jsonResponse(req, { error: "Ruxsat yo'q" }, 401);

  const { data: isAdmin, error: roleError } = await sb.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (roleError || !isAdmin) return jsonResponse(req, { error: "Admin huquqi yo'q" }, 403);

  async function logAction(action: string, details: Record<string, unknown> = {}) {
    const { error } = await sb.from("audit_log").insert({ user_id: user!.id, action, details });
    if (error) console.error("audit_log:", error.message);
  }

  async function grant(userId: string, days: number, chekId: string | null) {
    const { data, error } = await sb.rpc("grant_premium", { p_user: userId, p_days: days, p_chek: chekId });
    if (error) {
      if (/profile_not_found/.test(error.message)) throw new HttpError(404, "Foydalanuvchi profili topilmadi");
      throw error;
    }
    if (!data?.ok) {
      if (data?.error === "already_processed") throw new HttpError(409, "already_processed");
      throw new HttpError(400, data?.error ?? "grant_failed");
    }
    return data.end_date as string;
  }

  async function telegramChatFor(userId: string): Promise<number | null> {
    const { data } = await sb.from("telegram_links").select("chat_id").eq("user_id", userId).maybeSingle();
    return data?.chat_id ?? null;
  }

  try {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { throw new HttpError(400, "bad_request"); }
    const action = String(body.action ?? "");

    // ── PREMIUM ─────────────────────────────────────────────────────
    if (action === "give_premium") {
      const userId = reqUuid(body.userId, "userId");
      const days = reqDays(body.days);
      const endDate = await grant(userId, days, null);
      const chatId = body.telegramChatId ? Number(body.telegramChatId) : await telegramChatFor(userId);
      await notifyTelegramUser(chatId,
        `✅ Sizda Premium obuna faollashtirildi!\n\nMuddat: <b>${days} kun</b> (${fmtDate(endDate)} gacha).\n\nSmartavto.uz'dan foydalanganingiz uchun rahmat! 🎉`);
      await logAction("give_premium", { userId, days, endDate });
      return jsonResponse(req, { success: true, endDate });
    }

    if (action === "approve_chek") {
      const chekId = reqUuid(body.chekId, "chekId");
      const { data: chek, error } = await sb.from("chek").select("*").eq("id", chekId).maybeSingle();
      if (error) throw error;
      if (!chek) throw new HttpError(404, "Chek topilmadi");
      let userId: string | null = typeof body.userId === "string" ? reqUuid(body.userId, "userId") : chek.user_id;
      if (!userId && chek.email) {
        const { data: p } = await sb.from("profiles").select("id").eq("email", String(chek.email).toLowerCase()).maybeSingle();
        userId = p?.id ?? null;
      }
      if (!userId) throw new HttpError(404, "Bu chek uchun foydalanuvchi topilmadi");
      const days = reqDays(body.days ?? chek.tariff_days);
      const endDate = await grant(userId, days, chekId);
      const chatId = chek.telegram_chat_id ?? await telegramChatFor(userId);
      await notifyTelegramUser(chatId,
        `✅ To'lovingiz tasdiqlandi va Premium faollashtirildi!\n\nMuddat: <b>${days} kun</b> (${fmtDate(endDate)} gacha).\n\nRahmat! 🎉`);
      await logAction("approve_chek", { chekId, userId, days, endDate });
      return jsonResponse(req, { success: true, endDate });
    }

    if (action === "reject_chek") {
      const chekId = reqUuid(body.chekId, "chekId");
      const { data, error } = await sb.from("chek")
        .update({ status: "rejected", processed: true, reviewed_at: new Date().toISOString() })
        .eq("id", chekId).eq("status", "pending").select("telegram_chat_id").maybeSingle();
      if (error) throw error;
      if (!data) throw new HttpError(409, "already_processed");
      await notifyTelegramUser(data.telegram_chat_id,
        "❌ Kechirasiz, yuborgan chekingiz tasdiqlanmadi. To'lovni tekshirib, botga qaytadan yuboring yoki adminga yozing.");
      await logAction("reject_chek", { chekId });
      return jsonResponse(req, { success: true });
    }

    if (action === "revoke_premium") {
      const userId = reqUuid(body.userId, "userId");
      const { error } = await sb.from("profiles")
        .update({ tariff_days: 0, tariff_end_date: null, tariff_start_date: null })
        .eq("id", userId);
      if (error) throw error;
      await logAction("revoke_premium", { userId });
      return jsonResponse(req, { success: true });
    }

    // ── FOYDALANUVCHILAR ────────────────────────────────────────────
    if (action === "update_profile") {
      const userId = reqUuid(body.userId, "userId");
      const full_name = typeof body.full_name === "string" ? body.full_name.trim().slice(0, 120) || null : null;
      const username = typeof body.username === "string" ? body.username.trim().slice(0, 60) || null : null;
      const { error } = await sb.from("profiles").update({ full_name, username }).eq("id", userId);
      if (error) throw error;
      await logAction("update_profile", { userId, full_name, username });
      return jsonResponse(req, { success: true });
    }

    if (action === "delete_user") {
      const userId = reqUuid(body.userId, "userId");
      if (userId === user.id) throw new HttpError(400, "O'zingizni o'chira olmaysiz");
      const { data: delProfile } = await sb.from("profiles").select("email, full_name").eq("id", userId).maybeSingle();
      // Avval auth hisob (profil va bog'liq jadvallar ON DELETE CASCADE bilan o'chadi).
      const { error: authDeleteErr } = await sb.auth.admin.deleteUser(userId);
      if (authDeleteErr && !/not.?found/i.test(authDeleteErr.message)) throw authDeleteErr;
      await sb.from("profiles").delete().eq("id", userId); // auth'da yo'q "yetim" profil bo'lsa
      await logAction("delete_user", { userId, email: delProfile?.email, full_name: delProfile?.full_name });
      return jsonResponse(req, { success: true });
    }

    if (action === "create_user") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Email noto'g'ri");
      if (password.length < 8) throw new HttpError(400, "Parol kamida 8 belgi bo'lishi kerak");
      const full_name = typeof body.full_name === "string" ? body.full_name.trim().slice(0, 120) || null : null;
      const username = typeof body.username === "string" ? body.username.trim().slice(0, 60) || null : null;
      const { data: created, error } = await sb.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name, username },
      });
      if (error) {
        if (/already|registered|exists/i.test(error.message)) throw new HttpError(409, "Bu email allaqachon ro'yxatdan o'tgan");
        throw error;
      }
      const userId = created.user.id;
      // handle_new_user() trigger profilni yaratadi; ism/username'ni kafolatlaymiz
      await sb.from("profiles").update({ full_name, username }).eq("id", userId);
      let endDate: string | null = null;
      if (body.days !== undefined && body.days !== null && body.days !== 0) endDate = await grant(userId, reqDays(body.days), null);
      await logAction("create_user", { userId, email, days: body.days ?? null });
      return jsonResponse(req, { success: true, id: userId, endDate });
    }

    if (action === "list_user_activity") {
      const activity: { id: string; last_sign_in_at: string | null }[] = [];
      for (let page = 1; page <= 200; page++) {
        const { data, error } = await sb.auth.admin.listUsers({ page, perPage: PAGE });
        if (error) throw error;
        const users = data?.users ?? [];
        for (const u of users) activity.push({ id: u.id, last_sign_in_at: u.last_sign_in_at ?? null });
        if (users.length < PAGE) break;
      }
      return jsonResponse(req, { success: true, data: activity });
    }

    // ── CHEKLAR ─────────────────────────────────────────────────────
    if (action === "create_chek") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const link = typeof body.link === "string" ? body.link.trim() : "";
      if (!email || !link) throw new HttpError(400, "email va link kerak");
      if (!/^https:\/\/(www\.)?(ofd\.)?soliq\.uz\//i.test(link)) throw new HttpError(400, "Havola soliq.uz domenidan bo'lishi kerak");
      const tariff_days = body.tariff_days == null ? null : reqDays(body.tariff_days);
      const { data: p } = await sb.from("profiles").select("id").eq("email", email).maybeSingle();
      const { data, error } = await sb.from("chek").insert({
        email,
        chek_link: link,
        amount: optAmount(body.amount),
        tariff_days,
        user_id: p?.id ?? null,
        status: "pending",
        processed: false,
        source: "web",
      }).select().single();
      if (error) throw error;
      await logAction("create_chek", { chekId: data.id, email, amount: data.amount, tariff_days });
      return jsonResponse(req, { success: true, data });
    }

    if (action === "list_chek") {
      const rows: Record<string, unknown>[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await sb.from("chek").select("*")
          .order("created_at", { ascending: false }).range(from, from + PAGE - 1);
        if (error) throw error;
        rows.push(...(data ?? []));
        if (!data || data.length < PAGE) break;
      }
      return jsonResponse(req, { success: true, data: rows });
    }

    if (action === "update_chek") {
      const chekId = reqUuid(body.chekId, "chekId");
      const patch: Record<string, unknown> = {};
      if (body.amount !== undefined) patch.amount = optAmount(body.amount);
      if (body.tariff_days !== undefined) patch.tariff_days = body.tariff_days === null ? null : reqDays(body.tariff_days);
      if (Object.keys(patch).length === 0) throw new HttpError(400, "O'zgarish yo'q");
      const { error } = await sb.from("chek").update(patch).eq("id", chekId);
      if (error) throw error;
      await logAction("update_chek", { chekId, ...patch });
      return jsonResponse(req, { success: true });
    }

    if (action === "delete_chek") {
      const chekId = reqUuid(body.chekId, "chekId");
      const { data: oldChek } = await sb.from("chek").select("*").eq("id", chekId).maybeSingle();
      const { error } = await sb.from("chek").delete().eq("id", chekId);
      if (error) throw error;
      const path = receiptPath(oldChek?.chek_link ?? null);
      if (path) await sb.storage.from("receipts").remove([path]);
      await logAction("delete_chek", oldChek ?? { chekId });
      return jsonResponse(req, { success: true });
    }

    if (action === "sign_receipt") {
      const chekId = reqUuid(body.chekId, "chekId");
      const { data: chek, error } = await sb.from("chek").select("chek_link").eq("id", chekId).maybeSingle();
      if (error) throw error;
      if (!chek?.chek_link) throw new HttpError(404, "Chek havolasi yo'q");
      const path = receiptPath(chek.chek_link);
      if (!path) return jsonResponse(req, { success: true, url: chek.chek_link }); // tashqi (soliq.uz) havola
      const { data: signed, error: sErr } = await sb.storage.from("receipts").createSignedUrl(path, 600);
      if (sErr) throw sErr;
      return jsonResponse(req, { success: true, url: signed.signedUrl });
    }

    // ── TARIFLAR (narxlar — sayt, bot va moliya uchun yagona manba) ─
    if (action === "list_plans") {
      const { data, error } = await sb.from("plans").select("*").order("sort");
      if (error) throw error;
      return jsonResponse(req, { success: true, data });
    }

    if (action === "update_plan") {
      const id = String(body.id ?? "");
      if (!/^[a-z0-9_]{1,32}$/.test(id)) throw new HttpError(400, "id noto'g'ri");
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.amount !== undefined) patch.amount = optAmount(body.amount) ?? 0;
      if (body.days !== undefined) patch.days = reqDays(body.days);
      if (typeof body.label === "string" && body.label.trim()) patch.label = body.label.trim().slice(0, 40);
      if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
      const { error } = await sb.from("plans").update(patch).eq("id", id);
      if (error) throw error;
      await logAction("update_plan", { id, ...patch });
      return jsonResponse(req, { success: true });
    }

    // ── TO'LOV TURLARI ──────────────────────────────────────────────
    if (action === "list_payment_methods") {
      const { data, error } = await sb.from("payment_methods").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return jsonResponse(req, { success: true, data });
    }

    if (action === "add_payment_method") {
      const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
      if (!name) throw new HttpError(400, "name kerak");
      const { data, error } = await sb.from("payment_methods").insert({ name }).select().single();
      if (error) throw error;
      await logAction("add_payment_method", { name });
      return jsonResponse(req, { success: true, data });
    }

    if (action === "delete_payment_method") {
      const methodId = reqUuid(body.methodId, "methodId");
      const { error } = await sb.from("payment_methods").delete().eq("id", methodId);
      if (error) throw error;
      await logAction("delete_payment_method", { methodId });
      return jsonResponse(req, { success: true });
    }

    // ── AUDIT / ADMIN ───────────────────────────────────────────────
    if (action === "list_audit") {
      const { data, error } = await sb.from("audit_log").select("*").order("created_at", { ascending: false }).limit(300);
      if (error) throw error;
      return jsonResponse(req, { success: true, data });
    }

    if (action === "change_admin_password") {
      const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
      if (newPassword.length < 10) throw new HttpError(400, "Parol kamida 10 belgi bo'lishi kerak");
      const { error } = await sb.auth.admin.updateUserById(user.id, { password: newPassword });
      if (error) throw error;
      await logAction("change_admin_password", {});
      return jsonResponse(req, { success: true });
    }

    throw new HttpError(400, "Noma'lum action");
  } catch (e) {
    if (e instanceof HttpError) return jsonResponse(req, { error: e.message }, e.status);
    console.error("admin-premium:", e);
    return jsonResponse(req, { error: e instanceof Error ? e.message : "Server xatosi" }, 500);
  }
});

