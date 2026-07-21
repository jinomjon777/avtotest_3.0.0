import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET"); // ixtiyoriy, lekin tavsiya etiladi

// Karta ma'lumotlari — Supabase Secrets orqali sozlanadi, shuning uchun
// kodni qayta deploy qilmasdan o'zgartirish mumkin.
const CARD_NUMBER = Deno.env.get("TELEGRAM_CARD_NUMBER") || "8600 XXXX XXXX XXXX";
const CARD_HOLDER = Deno.env.get("TELEGRAM_CARD_HOLDER") || "ISM FAMILIYA";

// Sizning shaxsiy Telegram chat ID'ingiz — cheklarni shu yerga yuboradi.
// Olish uchun: @userinfobot ga /start yozing, u sizga ID raqamini beradi.
const ADMIN_CHAT_ID = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");

const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const PLANS: Record<string, { days: number; amount: number; label: string }> = {
  plan_7:  { days: 7,  amount: 15000, label: "Haftalik" },
  plan_30: { days: 30, amount: 33000, label: "Oylik" },
  plan_90: { days: 90, amount: 83000, label: "3 Oylik" },
};

function fmtSom(n: number) {
  return n.toLocaleString("uz-UZ") + " so'm";
}

// ── Telegram Bot API yordamchilari ──────────────────────────────────

async function tg(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${TG_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

function sendMessage(chatId: number, text: string, replyMarkup?: unknown) {
  return tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: replyMarkup,
  });
}

function sendPhoto(chatId: number, photoFileId: string, caption: string, replyMarkup?: unknown) {
  return tg("sendPhoto", {
    chat_id: chatId,
    photo: photoFileId,
    caption,
    parse_mode: "HTML",
    reply_markup: replyMarkup,
  });
}

function editMessageCaption(chatId: number, messageId: number, caption: string) {
  return tg("editMessageCaption", {
    chat_id: chatId,
    message_id: messageId,
    caption,
    parse_mode: "HTML",
  });
}

function answerCallback(callbackQueryId: string, text?: string) {
  return tg("answerCallbackQuery", { callback_query_id: callbackQueryId, text });
}

// ── Supabase ──────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface Session {
  chat_id: number;
  username: string | null;
  first_name: string | null;
  step: string;
  plan_days: number | null;
  plan_amount: number | null;
  site_email: string | null;
  receipt_file_id: string | null;
  receipt_url: string | null;
}

async function getSession(chatId: number): Promise<Session> {
  const { data } = await supabase
    .from("telegram_bot_sessions")
    .select("*")
    .eq("chat_id", chatId)
    .maybeSingle();

  if (data) return data as Session;

  const fresh: Session = {
    chat_id: chatId, username: null, first_name: null,
    step: "idle", plan_days: null, plan_amount: null, site_email: null,
    receipt_file_id: null, receipt_url: null,
  };
  return fresh;
}

async function saveSession(session: Partial<Session> & { chat_id: number }) {
  await supabase.from("telegram_bot_sessions").upsert({
    ...session,
    updated_at: new Date().toISOString(),
  });
}

// ── Asosiy webhook handler ──────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");

  // Ixtiyoriy: Telegram'dan kelayotganini tasdiqlash (soxta so'rovlarni bloklaydi)
  if (WEBHOOK_SECRET) {
    const secretHeader = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (secretHeader !== WEBHOOK_SECRET) {
      return new Response("forbidden", { status: 403 });
    }
  }

  let update: any;
  try {
    update = await req.json();
  } catch {
    return new Response("ok");
  }

  try {
    // ── 1. Inline tugma bosilganda (callback_query) ──────────────────
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId: number = cq.message.chat.id;
      const data: string = cq.data;
      await answerCallback(cq.id);

      const session = await getSession(chatId);
      session.username = cq.from.username ?? session.username;
      session.first_name = cq.from.first_name ?? session.first_name;

      if (data === "want_premium") {
        const lines = Object.values(PLANS)
          .map(p => `• <b>${p.label}</b> (${p.days} kun) — ${fmtSom(p.amount)}`)
          .join("\n");

        await sendMessage(
          chatId,
          `💎 <b>Premium tariflar</b>\n\n${lines}\n\nQaysi tarifni tanlaysiz?`,
          {
            inline_keyboard: Object.entries(PLANS).map(([key, p]) => ([
              { text: `${p.label} — ${fmtSom(p.amount)}`, callback_data: key },
            ])),
          },
        );
        await saveSession({ ...session, step: "choosing_plan" });
        return new Response("ok");
      }

      if (PLANS[data]) {
        const plan = PLANS[data];
        await sendMessage(
          chatId,
          `✅ Siz <b>${plan.label}</b> (${plan.days} kun) — <b>${fmtSom(plan.amount)}</b> tarifini tanladingiz.\n\n` +
          `To'lovni quyidagi kartaga o'tkazing:\n\n` +
          `💳 <code>${CARD_NUMBER}</code>\n👤 ${CARD_HOLDER}\n\n` +
          `To'lovni amalga oshirgach, <b>smartavto.uz saytidagi hisobingiz email manzilini</b> shu yerga yozib yuboring 👇`,
        );
        await saveSession({
          ...session, step: "awaiting_email",
          plan_days: plan.days, plan_amount: plan.amount,
        });
        return new Response("ok");
      }

      // ── Admin cheklarni tasdiqlash/rad etish tugmalari ────────────────
      if (data.startsWith("approve_") || data.startsWith("reject_")) {
        const isAdmin = ADMIN_CHAT_ID && String(cq.from.id) === String(ADMIN_CHAT_ID);
        if (!isAdmin) {
          return new Response("ok"); // faqat admin bosishi mumkin
        }

        const targetChatId = Number(data.split("_")[1]);
        const targetSession = await getSession(targetChatId);

        if (data.startsWith("approve_")) {
          const email = targetSession.site_email;
          const url = targetSession.receipt_url;
          const days = targetSession.plan_days;

          if (url && email) {
            await supabase.from("chek").insert({
              email,
              link: url,
              amount: targetSession.plan_amount,
              tariff_days: days,
              processed: true,
              source: "telegram",
              telegram_chat_id: targetChatId,
              telegram_username: targetSession.username,
            });

            await sendMessage(
              targetChatId,
              `✅ To'lovingiz tasdiqlandi!\n\nAdminlarimiz tez orada Premium obunangizni qo'shadi. Rahmat! 🎉`,
            );
          }
          await saveSession({
            chat_id: targetChatId, username: targetSession.username, first_name: targetSession.first_name,
            step: "idle", plan_days: null, plan_amount: null, site_email: null,
            receipt_file_id: null, receipt_url: null,
          });
          await editMessageCaption(chatId, cq.message.message_id, `${cq.message.caption}\n\n✅ <b>TASDIQLANDI</b>`);
        } else {
          await sendMessage(
            targetChatId,
            `❌ Kechirasiz, yuborgan chekingiz tasdiqlanmadi.\n\nIltimos, to'lovni tekshirib, chekning aniq skrinshotini qaytadan yuboring 📷`,
          );
          await saveSession({ ...targetSession, step: "awaiting_receipt" });
          await editMessageCaption(chatId, cq.message.message_id, `${cq.message.caption}\n\n❌ <b>RAD ETILDI</b>`);
        }
        return new Response("ok");
      }

      return new Response("ok");
    }

    // ── 2. Oddiy xabar (matn yoki rasm) ───────────────────────────────
    if (update.message) {
      const msg = update.message;
      const chatId: number = msg.chat.id;
      const session = await getSession(chatId);
      session.username = msg.from?.username ?? session.username;
      session.first_name = msg.from?.first_name ?? session.first_name;

      // /start yoki har qanday holatda qayta boshlash
      if (msg.text === "/start") {
        await saveSession({ ...session, step: "idle", plan_days: null, plan_amount: null, site_email: null });
        await sendMessage(
          chatId,
          `Salom, ${session.first_name || "do'stim"}! 👋\n\n` +
          `<b>Avtotest Premium</b> botiga xush kelibsiz. Bu yerda Premium obunani sotib olishingiz mumkin.`,
          { inline_keyboard: [[{ text: "💎 Premium olmoqchiman", callback_data: "want_premium" }]] },
        );
        return new Response("ok");
      }

      // ── Email kutilmoqda ──────────────────────────────────────────
      if (session.step === "awaiting_email") {
        const text = (msg.text || "").trim();
        const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

        if (!looksLikeEmail) {
          await sendMessage(chatId, "Iltimos, to'g'ri email manzil yuboring (masalan: <code>ism@gmail.com</code>).");
          return new Response("ok");
        }

        await saveSession({ ...session, step: "awaiting_receipt", site_email: text });
        await sendMessage(
          chatId,
          `Rahmat! Endi to'lov chekingizning (bank ilovasidan) <b>skrinshotini rasm shaklida</b> yuboring 📷`,
        );
        return new Response("ok");
      }

      // ── Chek rasmi kutilmoqda ──────────────────────────────────────
      if (session.step === "awaiting_receipt") {
        const photos = msg.photo;
        if (!photos || photos.length === 0) {
          await sendMessage(chatId, "Iltimos, to'lov chekining rasmini (skrinshot) yuboring 📷");
          return new Response("ok");
        }

        // Eng yuqori sifatli versiyasi — massivning oxirgi elementi
        const fileId = photos[photos.length - 1].file_id;

        const fileInfo = await tg("getFile", { file_id: fileId });
        const filePath = fileInfo?.result?.file_path;
        if (!filePath) throw new Error("Telegram fayl ma'lumotini olib bo'lmadi");

        const fileRes = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`);
        const fileBytes = new Uint8Array(await fileRes.arrayBuffer());

        const storagePath = `${chatId}_${Date.now()}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from("receipts")
          .upload(storagePath, fileBytes, { contentType: "image/jpeg", upsert: false });
        if (uploadErr) throw uploadErr;

        const { data: pub } = supabase.storage.from("receipts").getPublicUrl(storagePath);

        await saveSession({
          ...session, step: "awaiting_admin_review",
          receipt_file_id: fileId, receipt_url: pub.publicUrl,
        });

        await sendMessage(
          chatId,
          `✅ Rahmat! Chekingiz qabul qilindi.\n\n` +
          `Tez orada adminlarimiz ko'rib chiqib, Premium obunangizni faollashtiradi. 🎉`,
        );

        // Adminga (sizga) tekshirish uchun yuboramiz
        if (ADMIN_CHAT_ID) {
          const plan = session.plan_days ? `${session.plan_days} kun — ${fmtSom(session.plan_amount || 0)}` : "noma'lum";
          await sendPhoto(
            Number(ADMIN_CHAT_ID),
            fileId,
            `🧾 <b>Yangi to'lov cheki</b>\n\n` +
            `👤 ${session.first_name || "—"} (@${session.username || "—"})\n` +
            `📧 ${session.site_email}\n` +
            `💳 Tarif: ${plan}`,
            {
              inline_keyboard: [[
                { text: "✅ Tasdiqlash", callback_data: `approve_${chatId}` },
                { text: "❌ Rad etish", callback_data: `reject_${chatId}` },
              ]],
            },
          );
        }
        return new Response("ok");
      }

      // ── Boshqa har qanday holat — tugmani qayta ko'rsatamiz ─────────
      await sendMessage(
        chatId,
        `Salom${session.first_name ? ", " + session.first_name : ""}! Premium obuna sotib olish uchun quyidagi tugmani bosing 👇`,
        { inline_keyboard: [[{ text: "💎 Premium olmoqchiman", callback_data: "want_premium" }]] },
      );
      return new Response("ok");
    }

    return new Response("ok");
  } catch (e) {
    console.error("telegram-bot error:", e);
    return new Response("ok"); // Telegram'ga har doim 200 qaytaramiz, aks holda qayta-qayta urinadi
  }
});