// Supabase Edge Function (Deno): Telegram bot — Premium sotish + kunlik reja eslatmalarini ulash.
//
// Oqim: /start → tarif → hisob bormi → karta → sayt emaili → chek rasmi → admin ✅/❌
//
// Muhim qoidalar (audit natijasi):
//  * Chek rasmi kelganda DARHOL `chek` qatori yaratiladi (status='pending') — tarif, summa, email,
//    foydalanuvchi shu paytda MUHRLANADI. Admin tugmasi `approve_<chek_id>` shu qatorga ishora qiladi.
//    Avval tugma foydalanuvchining HOZIRGI sessiyasini o'qirdi: chek 15 000 so'mlik bo'lsa ham,
//    keyin 90 kunlik tarif tanlansa, 90 kun yozilardi.
//  * ✅ — bazadagi grant_premium() orqali premiumni DARHOL beradi (ikki marta bosish = bir marta).
//  * Telegram'dan kelgan har qanday matn (ism, username, email) HTML-escape qilinadi — aks holda
//    ismida "<" bo'lgan foydalanuvchining cheki adminga umuman yetib bormasdi.
//  * Chek rasmlari yopiq bucket'da; adminga Telegram file_id orqali yuboriladi.
//  * Narxlar `plans` jadvalidan (sayt va admin panel bilan bir xil manba).

import { adminClient } from "../_shared/supabase.ts";
import { escapeHtml } from "../_shared/html.ts";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
// Faqat vaqtincha o'tish uchun (tavsiya etilmaydi): TELEGRAM_ALLOW_NO_SECRET=1
const ALLOW_NO_SECRET = Deno.env.get("TELEGRAM_ALLOW_NO_SECRET") === "1";
const CARD_NUMBER = Deno.env.get("TELEGRAM_CARD_NUMBER") || "8600 XXXX XXXX XXXX";
const CARD_HOLDER = Deno.env.get("TELEGRAM_CARD_HOLDER") || "ISM FAMILIYA";
const ADMIN_CHAT_ID = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://smartavto.uz").replace(/\/$/, "");
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const EMAIL_ATTEMPTS_PER_HOUR = 8;
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sb = adminClient();

type Plan = { id: string; days: number; amount: number; label: string };
const FALLBACK_PLANS: Plan[] = [
  { id: "plan_7", days: 7, amount: 15000, label: "Haftalik" },
  { id: "plan_30", days: 30, amount: 33000, label: "Oylik" },
  { id: "plan_90", days: 90, amount: 83000, label: "3 Oylik" },
];

async function getPlans(): Promise<Plan[]> {
  const { data, error } = await sb.from("plans").select("id, days, amount, label").eq("is_active", true).order("sort");
  if (error || !data?.length) return FALLBACK_PLANS;
  return data as Plan[];
}

function fmtSom(n: number) {
  return n.toLocaleString("uz-UZ").replace(/,/g, " ") + " so'm";
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("uz-UZ", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Telegram Bot API ──────────────────────────────────────────────────
async function tg(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${TG_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!j?.ok) console.error(`telegram ${method}:`, j?.description ?? res.status);
  return j;
}
const sendMessage = (chatId: number | string, text: string, replyMarkup?: unknown) =>
  tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", reply_markup: replyMarkup, disable_web_page_preview: true });
const sendPhoto = (chatId: number | string, photo: string, caption: string, replyMarkup?: unknown) =>
  tg("sendPhoto", { chat_id: chatId, photo, caption, parse_mode: "HTML", reply_markup: replyMarkup });
const editCaption = (chatId: number, messageId: number, caption: string) =>
  tg("editMessageCaption", { chat_id: chatId, message_id: messageId, caption, parse_mode: "HTML" });
const answerCallback = (id: string, text?: string, alert = false) =>
  tg("answerCallbackQuery", { callback_query_id: id, text, show_alert: alert });

// ── Telegram update turlari (faqat ishlatiladigan maydonlar) ───────────
interface TgUser { id: number; username?: string; first_name?: string }
interface TgChat { id: number; type: string }
interface TgPhoto { file_id: string; file_size?: number }
interface TgMessage { message_id: number; chat: TgChat; from?: TgUser; text?: string; caption?: string; photo?: TgPhoto[] }
interface TgCallback { id: string; from: TgUser; data?: string; message: TgMessage }
interface TgUpdate { message?: TgMessage; callback_query?: TgCallback }

// ── Suhbat holati ─────────────────────────────────────────────────────
interface Session {
  chat_id: number;
  username: string | null;
  first_name: string | null;
  step: string;
  plan_days: number | null;
  plan_amount: number | null;
  site_email: string | null;
  pending_chek_id: string | null;
  email_attempts: number;
  email_window: string | null;
}

async function getSession(chatId: number): Promise<Session> {
  const { data } = await sb.from("telegram_bot_sessions").select("*").eq("chat_id", chatId).maybeSingle();
  return (data as Session) ?? {
    chat_id: chatId, username: null, first_name: null, step: "idle", plan_days: null, plan_amount: null,
    site_email: null, pending_chek_id: null, email_attempts: 0, email_window: null,
  };
}

async function saveSession(s: Partial<Session> & { chat_id: number }) {
  const { error } = await sb.from("telegram_bot_sessions").upsert({ ...s, updated_at: new Date().toISOString() });
  if (error) console.error("session save:", error.message);
}

const resetFields = { step: "idle", plan_days: null, plan_amount: null, site_email: null };

function originalCaption(msg: { caption?: string } | undefined) {
  return escapeHtml(msg?.caption ?? "");
}

// ── Admin: tasdiqlash / rad etish ────────────────────────────────────
async function handleAdminDecision(cq: TgCallback, data: string) {
  const isAdmin = ADMIN_CHAT_ID && String(cq.from.id) === String(ADMIN_CHAT_ID);
  if (!isAdmin) {
    await answerCallback(cq.id, "Faqat admin uchun", true);
    return;
  }
  const adminChat: number = cq.message.chat.id;
  const msgId: number = cq.message.message_id;
  const approve = data.startsWith("approve_");
  const chekId = data.slice(approve ? 8 : 7);

  if (!UUID_RE.test(chekId)) {
    // Eski formatdagi tugma (approve_<chat_id>) — ishonchli ma'lumot yo'q, qo'lda ko'rib chiqiladi
    await answerCallback(cq.id, "Eski formatdagi chek. Admin paneldagi 'To'lovlar' bo'limidan ko'rib chiqing.", true);
    return;
  }

  const { data: chek } = await sb.from("chek").select("*").eq("id", chekId).maybeSingle();
  if (!chek) {
    await answerCallback(cq.id, "Chek topilmadi (o'chirilgan bo'lishi mumkin)", true);
    return;
  }
  if (chek.status !== "pending") {
    await answerCallback(cq.id, `Bu chek allaqachon ko'rib chiqilgan: ${chek.status}`, true);
    return;
  }

  if (!approve) {
    const { data: upd } = await sb.from("chek")
      .update({ status: "rejected", processed: true, reviewed_at: new Date().toISOString() })
      .eq("id", chekId).eq("status", "pending").select("id").maybeSingle();
    if (!upd) { await answerCallback(cq.id, "Allaqachon ko'rib chiqilgan", true); return; }
    await answerCallback(cq.id, "Rad etildi");
    if (chek.telegram_chat_id) {
      await sendMessage(chek.telegram_chat_id,
        "❌ Kechirasiz, yuborgan chekingiz tasdiqlanmadi.\n\nIltimos, to'lovni tekshirib, chekning aniq skrinshotini qaytadan yuboring 📷\n\n" +
        "<i>Soxta yoki tahrirlangan chek yubormang — bunday urinishlar darhol aniqlanadi.</i>");
      await saveSession({ chat_id: chek.telegram_chat_id, step: "awaiting_receipt", pending_chek_id: null,
        plan_days: chek.tariff_days, plan_amount: chek.amount, site_email: chek.email });
    }
    await editCaption(adminChat, msgId, `${originalCaption(cq.message)}\n\n❌ <b>RAD ETILDI</b>`);
    await sb.from("audit_log").insert({ action: "telegram_reject_chek", details: { chekId, admin_chat: cq.from.id } });
    return;
  }

  if (!chek.user_id) {
    await answerCallback(cq.id, "Foydalanuvchi topilmadi — admin paneldan qo'lda bog'lang.", true);
    return;
  }
  const { data: res, error } = await sb.rpc("grant_premium", { p_user: chek.user_id, p_days: chek.tariff_days, p_chek: chekId });
  if (error || !res?.ok) {
    const reason = error?.message ?? res?.error ?? "noma'lum";
    await answerCallback(cq.id, reason === "already_processed" ? "Allaqachon tasdiqlangan" : `Xatolik: ${reason}`, true);
    if (reason !== "already_processed") {
      await editCaption(adminChat, msgId, `${originalCaption(cq.message)}\n\n⚠️ <b>XATOLIK:</b> ${escapeHtml(reason)}`);
    }
    return;
  }

  await answerCallback(cq.id, "Premium berildi ✅");
  if (chek.telegram_chat_id) {
    await sendMessage(chek.telegram_chat_id,
      `✅ To'lovingiz tasdiqlandi va <b>Premium faollashtirildi!</b>\n\n` +
      `Muddat: <b>${chek.tariff_days} kun</b> (${fmtDate(res.end_date)} gacha).\n\n` +
      `Saytga kiring: ${SITE_URL}\nRahmat! 🎉`);
    await saveSession({ chat_id: chek.telegram_chat_id, ...resetFields, pending_chek_id: null });
  }
  await editCaption(adminChat, msgId,
    `${originalCaption(cq.message)}\n\n✅ <b>TASDIQLANDI</b> — premium ${fmtDate(res.end_date)} gacha`);
  await sb.from("audit_log").insert({ action: "telegram_approve_chek", details: { chekId, user_id: chek.user_id, days: chek.tariff_days, admin_chat: cq.from.id } });
}

// ── Asosiy webhook ───────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");

  if (WEBHOOK_SECRET) {
    if (req.headers.get("X-Telegram-Bot-Api-Secret-Token") !== WEBHOOK_SECRET) {
      return new Response("forbidden", { status: 403 });
    }
  } else if (!ALLOW_NO_SECRET) {
    console.error("TELEGRAM_WEBHOOK_SECRET sozlanmagan — so'rov rad etildi");
    return new Response("webhook secret not configured", { status: 503 });
  }

  let update: TgUpdate;
  try { update = await req.json(); } catch { return new Response("ok"); }

  try {
    // ── 1. Inline tugmalar ─────────────────────────────────────────
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId: number = cq.message?.chat?.id;
      const data: string = String(cq.data ?? "");

      if (data.startsWith("approve_") || data.startsWith("reject_")) {
        await handleAdminDecision(cq, data);
        return new Response("ok");
      }

      await answerCallback(cq.id);
      if (!chatId || cq.message.chat.type !== "private") return new Response("ok");
      const session = await getSession(chatId);
      session.username = cq.from.username ?? session.username;
      session.first_name = cq.from.first_name ?? session.first_name;

      if (session.step === "awaiting_admin_review" && data !== "new_purchase") {
        await sendMessage(chatId, "⏳ Chekingiz adminlar tomonidan ko'rib chiqilmoqda. Natija shu yerga keladi.",
          { inline_keyboard: [[{ text: "🆕 Yangi xarid", callback_data: "new_purchase" }]] });
        return new Response("ok");
      }

      if (data === "want_premium" || data === "new_purchase") {
        const plans = await getPlans();
        const lines = plans.map((p) => `• <b>${escapeHtml(p.label)}</b> (${p.days} kun) — ${fmtSom(p.amount)}`).join("\n");
        await sendMessage(chatId, `💎 <b>Premium tariflar</b>\n\n${lines}\n\nQaysi tarifni tanlaysiz?`, {
          inline_keyboard: plans.map((p) => [{ text: `${p.label} — ${fmtSom(p.amount)}`, callback_data: `plan:${p.id}` }]),
        });
        await saveSession({ ...session, ...resetFields, step: "choosing_plan", pending_chek_id: null });
        return new Response("ok");
      }

      if (data.startsWith("plan:") || /^plan_\d+$/.test(data)) {
        const id = data.startsWith("plan:") ? data.slice(5) : data;
        const plan = (await getPlans()).find((p) => p.id === id);
        if (!plan) { await sendMessage(chatId, "Bu tarif endi mavjud emas. /start"); return new Response("ok"); }
        await sendMessage(chatId,
          `✅ Siz <b>${escapeHtml(plan.label)}</b> (${plan.days} kun) — <b>${fmtSom(plan.amount)}</b> tarifini tanladingiz.\n\n` +
          `Davom etishdan oldin — sizda <b>smartavto.uz</b> saytida ro'yxatdan o'tgan hisobingiz bormi?`,
          { inline_keyboard: [
            [{ text: "✅ Ha, hisobim bor", callback_data: "acct_yes" }],
            [{ text: "🆕 Yo'q, ro'yxatdan o'taman", callback_data: "acct_no" }],
          ] });
        await saveSession({ ...session, step: "confirming_account", plan_days: plan.days, plan_amount: plan.amount });
        return new Response("ok");
      }

      if (data === "acct_no") {
        await sendMessage(chatId,
          `Muammo emas! Avval ro'yxatdan o'ting:\n👉 ${SITE_URL}/auth\n\nRo'yxatdan o'tib bo'lgach, pastdagi tugmani bosing 👇`,
          { inline_keyboard: [[{ text: "✅ Ro'yxatdan o'tdim, davom etish", callback_data: "acct_yes" }]] });
        return new Response("ok");
      }

      if (data === "acct_yes") {
        if (!session.plan_days) {
          await sendMessage(chatId, "Avval tarifni tanlang 👇", { inline_keyboard: [[{ text: "💎 Tariflar", callback_data: "want_premium" }]] });
          return new Response("ok");
        }
        await sendMessage(chatId,
          `To'lovni quyidagi kartaga o'tkazing:\n\n💳 <code>${escapeHtml(CARD_NUMBER)}</code>\n👤 ${escapeHtml(CARD_HOLDER)}\n` +
          `💰 Summa: <b>${fmtSom(session.plan_amount ?? 0)}</b>\n\n` +
          `To'lovni amalga oshirgach, <b>smartavto.uz saytidagi hisobingiz email manzilini</b> shu yerga yozib yuboring 👇`);
        await saveSession({ ...session, step: "awaiting_email" });
        return new Response("ok");
      }

      return new Response("ok");
    }

    // ── 2. Oddiy xabar ─────────────────────────────────────────────
    if (update.message) {
      const msg = update.message;
      const chatId: number = msg.chat.id;
      if (msg.chat.type !== "private") return new Response("ok");
      const text: string = typeof msg.text === "string" ? msg.text.trim() : "";
      const session = await getSession(chatId);
      session.username = msg.from?.username ?? session.username;
      session.first_name = msg.from?.first_name ?? session.first_name;

      // Saytdagi "Telegram'ni ulash" (kunlik reja eslatmalari): /start link_<token>
      const linkMatch = /^\/start link_([0-9a-f]{32})$/.exec(text);
      if (linkMatch) {
        const { data: res } = await sb.rpc("link_telegram", { p_token: linkMatch[1], p_chat_id: chatId });
        if (res?.ok) {
          await sendMessage(chatId,
            `✅ Hisobingiz ulandi!\n\n` +
            (res.reminder
              ? `Har kuni soat <b>${escapeHtml(res.reminder)}</b> da test ishlash haqida eslatma yuboraman. Bugungi 5 ta test bajarilmaguncha har 30 daqiqada eslatib turaman.`
              : `Endi saytda eslatma vaqtini tanlang — shu vaqtda har kuni xabar yuboraman.`) +
            `\n\nEslatmalarni to'xtatish: /stop`);
        } else {
          await sendMessage(chatId, "⚠️ Havola eskirgan yoki allaqachon ishlatilgan. Saytdagi \"Kunlik reja\" sahifasidan qaytadan \"Telegram'ni ulash\" ni bosing.");
        }
        return new Response("ok");
      }

      if (text === "/stop") {
        const { data: n } = await sb.rpc("stop_telegram_reminders", { p_chat_id: chatId });
        await sendMessage(chatId, n
          ? "🔕 Telegram eslatmalari o'chirildi. Qayta yoqish: saytdagi \"Kunlik reja\" sahifasi."
          : "Bu chatga ulangan eslatmalar topilmadi.");
        return new Response("ok");
      }

      // Saytdagi Premium sahifasidan: /start plan_30 — to'g'ridan-to'g'ri shu tarif
      const planStart = /^\/start (plan_[a-z0-9_]{1,24})$/.exec(text);
      if (planStart && session.step !== "awaiting_admin_review") {
        const plan = (await getPlans()).find((p) => p.id === planStart[1]);
        if (plan) {
          await sendMessage(chatId,
            `Salom, ${escapeHtml(session.first_name || "do'stim")}! 👋\n\n` +
            `Siz <b>${escapeHtml(plan.label)}</b> (${plan.days} kun) — <b>${fmtSom(plan.amount)}</b> tarifini tanladingiz.\n\n` +
            `Sizda <b>smartavto.uz</b> saytida ro'yxatdan o'tgan hisobingiz bormi?`,
            { inline_keyboard: [
              [{ text: "✅ Ha, hisobim bor", callback_data: "acct_yes" }],
              [{ text: "🆕 Yo'q, ro'yxatdan o'taman", callback_data: "acct_no" }],
              [{ text: "↩️ Boshqa tarif", callback_data: "want_premium" }],
            ] });
          await saveSession({ ...session, ...resetFields, step: "confirming_account", plan_days: plan.days, plan_amount: plan.amount, pending_chek_id: null });
          return new Response("ok");
        }
      }

      if (text === "/start" || /^\/start\s/.test(text)) {
        if (session.step === "awaiting_admin_review") {
          await sendMessage(chatId, "⏳ Oldingi chekingiz ko'rib chiqilmoqda. Natija shu yerga keladi.",
            { inline_keyboard: [[{ text: "🆕 Yangi xarid", callback_data: "new_purchase" }]] });
          return new Response("ok");
        }
        await saveSession({ ...session, ...resetFields });
        await sendMessage(chatId,
          `Salom, ${escapeHtml(session.first_name || "do'stim")}! 👋\n\n` +
          `<b>Avtotest Premium</b> botiga xush kelibsiz. Bu yerda Premium obunani sotib olishingiz mumkin.`,
          { inline_keyboard: [[{ text: "💎 Premium olmoqchiman", callback_data: "want_premium" }]] });
        return new Response("ok");
      }

      // ── Email kutilmoqda ──
      if (session.step === "awaiting_email") {
        const email = text.toLowerCase();
        if (!/^[^\s@<>&"']+@[^\s@<>&"']+\.[a-z]{2,}$/i.test(email) || email.length > 254) {
          await sendMessage(chatId, "Iltimos, to'g'ri email manzil yuboring (masalan: <code>ism@gmail.com</code>).");
          return new Response("ok");
        }
        // Email tekshirish urinishlari cheklangan (boshqalarning emailini "terib ko'rish"ga qarshi)
        const windowStart = session.email_window ? new Date(session.email_window).getTime() : 0;
        const fresh = Date.now() - windowStart > 3_600_000;
        const attempts = fresh ? 0 : session.email_attempts;
        if (attempts >= EMAIL_ATTEMPTS_PER_HOUR) {
          await sendMessage(chatId, "⚠️ Juda ko'p urinish. Iltimos, bir soatdan keyin qayta urinib ko'ring.");
          return new Response("ok");
        }
        await saveSession({ chat_id: chatId, email_attempts: attempts + 1, email_window: fresh ? new Date().toISOString() : session.email_window });

        const { data: profile } = await sb.from("profiles").select("id").eq("email", email).maybeSingle();
        if (!profile) {
          await sendMessage(chatId,
            `⚠️ Bu email (<code>${escapeHtml(email)}</code>) bilan ro'yxatdan o'tilgan hisob topilmadi.\n\n` +
            `Avval saytda ro'yxatdan o'ting:\n👉 ${SITE_URL}/auth\n\nKeyin hisobingiz emailini shu yerga qaytadan yuboring 👇`);
          return new Response("ok");
        }
        await saveSession({ ...session, step: "awaiting_receipt", site_email: email, email_attempts: attempts + 1 });
        await sendMessage(chatId,
          `Rahmat! Endi to'lov chekingizning (bank ilovasidan) <b>skrinshotini rasm shaklida</b> yuboring 📷\n\n` +
          `⚠️ <i>Soxta yoki tahrirlangan chek yubormang — bunday urinishlar darhol aniqlanadi va tasdiqdan o'tmaydi.</i>`);
        return new Response("ok");
      }

      // ── Chek rasmi kutilmoqda ──
      if (session.step === "awaiting_receipt") {
        const photos = msg.photo;
        if (!Array.isArray(photos) || photos.length === 0) {
          await sendMessage(chatId, "Iltimos, to'lov chekining rasmini (skrinshot) yuboring 📷");
          return new Response("ok");
        }
        if (!session.plan_days || !session.plan_amount || !session.site_email) {
          await saveSession({ ...session, ...resetFields });
          await sendMessage(chatId, "Sessiya eskirgan. Iltimos, qaytadan boshlang: /start");
          return new Response("ok");
        }

        const best = photos[photos.length - 1];
        const fileId: string = best.file_id;
        if (best.file_size && best.file_size > MAX_RECEIPT_BYTES) {
          await sendMessage(chatId, "Rasm juda katta. Iltimos, oddiy skrinshot yuboring.");
          return new Response("ok");
        }

        const { data: profile } = await sb.from("profiles").select("id").eq("email", session.site_email).maybeSingle();

        // Rasm yopiq bucket'ga (admin panel imzolangan havola bilan ochadi)
        let chekLink = "";
        const fileInfo = await tg("getFile", { file_id: fileId });
        const filePath = fileInfo?.result?.file_path;
        if (filePath) {
          const fileRes = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`);
          if (fileRes.ok) {
            const bytes = new Uint8Array(await fileRes.arrayBuffer());
            const storagePath = `${chatId}/${Date.now()}.jpg`;
            const { error: upErr } = await sb.storage.from("receipts").upload(storagePath, bytes, { contentType: "image/jpeg", upsert: false });
            if (!upErr) chekLink = `receipts/${storagePath}`;
            else console.error("receipt upload:", upErr.message);
          }
        }

        // Shu paytdagi tarif/summa/email MUHRLANADI
        const { data: chek, error: insErr } = await sb.from("chek").insert({
          email: session.site_email,
          user_id: profile?.id ?? null,
          chek_link: chekLink || `telegram:${fileId}`,
          amount: session.plan_amount,
          tariff_days: session.plan_days,
          status: "pending",
          processed: false,
          source: "telegram",
          telegram_chat_id: chatId,
          telegram_username: session.username,
        }).select("id").single();
        if (insErr || !chek) {
          console.error("chek insert:", insErr?.message);
          await sendMessage(chatId, "⚠️ Texnik xatolik. Iltimos, birozdan keyin chekni qayta yuboring.");
          return new Response("ok");
        }

        await saveSession({ ...session, step: "awaiting_admin_review", pending_chek_id: chek.id });
        await sendMessage(chatId,
          `✅ Rahmat! Chekingiz qabul qilindi.\n\nAdminlarimiz tez orada ko'rib chiqadi — tasdiqlangach Premium avtomatik faollashadi va shu yerga xabar keladi. 🎉`);

        if (ADMIN_CHAT_ID) {
          const who = `${escapeHtml(session.first_name || "—")} (@${escapeHtml(session.username || "—")})`;
          await sendPhoto(ADMIN_CHAT_ID, fileId,
            `🧾 <b>Yangi to'lov cheki</b>\n\n` +
            `👤 ${who}\n` +
            `📧 ${escapeHtml(session.site_email)}${profile ? "" : " ⚠️ <i>hisob topilmadi</i>"}\n` +
            `💳 Tarif: ${session.plan_days} kun — ${fmtSom(session.plan_amount)}\n` +
            `🆔 <code>${chek.id}</code>`,
            { inline_keyboard: [[
              { text: "✅ Tasdiqlash", callback_data: `approve_${chek.id}` },
              { text: "❌ Rad etish", callback_data: `reject_${chek.id}` },
            ]] });
        }
        return new Response("ok");
      }

      if (session.step === "awaiting_admin_review") {
        await sendMessage(chatId, "⏳ Chekingiz ko'rib chiqilmoqda. Natija shu yerga keladi.",
          { inline_keyboard: [[{ text: "🆕 Yangi xarid", callback_data: "new_purchase" }]] });
        return new Response("ok");
      }

      await sendMessage(chatId,
        `Salom${session.first_name ? ", " + escapeHtml(session.first_name) : ""}! Premium obuna sotib olish uchun quyidagi tugmani bosing 👇`,
        { inline_keyboard: [[{ text: "💎 Premium olmoqchiman", callback_data: "want_premium" }]] });
      return new Response("ok");
    }

    return new Response("ok");
  } catch (e) {
    console.error("telegram-bot error:", e);
    return new Response("ok"); // Telegram'ga har doim 200 — aks holda qayta-qayta yuboradi
  }
});
