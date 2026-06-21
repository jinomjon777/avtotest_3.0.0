// @ts-nocheck
// Bu fayl Supabase Edge Function (Deno runtime) — VSCode'ning oddiy
// TypeScript serveri "Deno" global obyektini va URL import'larni
// tanimaydi, shuning uchun bu yerda soxta xatolar ko'rsatadi.
// Bu faylga tegishli emas — deploy qilinganda Deno muhitida to'g'ri
// ishlaydi. @ts-nocheck shu ko'rinish xatolarini o'chiradi.
//
// MAQSAD: premium savollar banki (barcha.json) endi public/ papkasida
// EMAS — bu yerda, faqat shu funksiya orqali, faqat HAQIQIY premium
// (pro yoki trial) foydalanuvchiga beriladi. Server vaqti ishlatiladi,
// mijoz soati yoki frontend flag'iga ishonilmaydi.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import premiumQuestions from "./barcha.json" with { type: "json" };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ── 1. JWT tekshiruvi ────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Ruxsat yo'q" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return json({ error: "Token yaroqsiz" }, 401);
  }

  // ── 2. Profil holatini SERVER vaqti bilan tekshiramiz ────────────────
  //    (get-user-access funksiyasi bilan bir xil mantiq — mijoz soatiga
  //    umuman ishonilmaydi.)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tariff_days, tariff_end_date, tariff_start_date, is_trial_used, trial_end_date, created_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return json({ error: "Premium huquqi yo'q" }, 403);
  }

  const now = Date.now();
  let isPremium = false;

  const tariffDays = Number(profile.tariff_days ?? 0);
  if (tariffDays > 0) {
    const endMs = profile.tariff_end_date
      ? new Date(profile.tariff_end_date).getTime()
      : profile.tariff_start_date
        ? new Date(profile.tariff_start_date).getTime() + tariffDays * 86_400_000
        : null;
    if (endMs && endMs > now) isPremium = true;
  }

  if (!isPremium && profile.is_trial_used) {
    const trialEnd = profile.trial_end_date
      ? new Date(profile.trial_end_date).getTime()
      : new Date(profile.created_at).getTime() + 3_600_000;
    if (trialEnd > now) isPremium = true;
  }

  if (!isPremium) {
    return json({ error: "Premium huquqi yo'q yoki muddati tugagan" }, 403);
  }

  // ── 3. Premium tasdiqlandi — savollar bankini qaytaramiz ─────────────
  return json(premiumQuestions);
});