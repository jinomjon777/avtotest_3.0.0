// supabase/functions/get-user-access/index.ts
// Deploy: supabase functions deploy get-user-access
//
// Bu Edge Function client-side access check'ni server-side'ga ko'chiradi.
// Barcha muhim mantiq shu yerda — frontend faqat natijani ko'radi.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin":  Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // ── 1. Auth token ni tekshir ─────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    // ── 2. Supabase admin client (service_role) ──────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // ── 3. JWT dan user ID ni olish ──────────────────────────────────────────
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return json({ error: "Invalid token" }, 401);
    }

    // ── 4. Profile ni server'da o'qish (RLS bypass) ─────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tariff_days, tariff_start_date, tariff_end_date, is_trial_used, trial_start_date, trial_end_date, created_at")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return json({ state: "free_logged_in", isPremium: false, expiresAt: null }, 200);
    }

    const now = Date.now();

    // ── 5. PRO tariff tekshiruvi (SERVER vaqti ishlatiladi!) ─────────────────
    const tariffDays = Number(profile.tariff_days ?? 0);

    if (tariffDays > 0) {
      // tariff_end_date ustuniga ustunlik bering; aks holda hisoblab chiqing
      let endMs: number | null = profile.tariff_end_date
        ? new Date(profile.tariff_end_date).getTime()
        : profile.tariff_start_date
          ? new Date(profile.tariff_start_date).getTime() + tariffDays * 86_400_000
          : null;

      if (endMs && endMs > now) {
        // tariff_end_date ni bir marta yozib qo'yamiz (agar yo'q bo'lsa)
        if (!profile.tariff_end_date) {
          await supabase
            .from("profiles")
            .update({ tariff_end_date: new Date(endMs).toISOString() })
            .eq("id", user.id);
        }
        return json({ state: "active_pro", isPremium: true, expiresAt: new Date(endMs).toISOString() }, 200);
      }

      // muddati o'tgan — tariff_days ni nolga tushir
      await supabase
        .from("profiles")
        .update({ tariff_days: 0 })
        .eq("id", user.id);

      return json({ state: "expired_pro", isPremium: false, expiresAt: null }, 200);
    }

    // ── 6. Trial tekshiruvi ──────────────────────────────────────────────────
    if (profile.is_trial_used) {
      const trialEnd = profile.trial_end_date
        ? new Date(profile.trial_end_date).getTime()
        : new Date(profile.created_at).getTime() + 3_600_000; // 1 soat

      if (trialEnd > now) {
        return json({ state: "active_trial", isPremium: true, expiresAt: new Date(trialEnd).toISOString() }, 200);
      }
      return json({ state: "expired_trial", isPremium: false, expiresAt: null }, 200);
    }

    // ── 7. Oddiy foydalanuvchi ───────────────────────────────────────────────
    return json({ state: "free_logged_in", isPremium: false, expiresAt: null }, 200);

  } catch (err) {
    console.error("get-user-access error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
