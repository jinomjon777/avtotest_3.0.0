import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  // service_role client — barcha DB amallari shu orqali (RLS bypass,
  // shuning uchun quyidagi admin tekshiruvi MAJBURIY).
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ── 1. Foydalanuvchining haqiqiy Supabase Auth JWT'sini tekshiramiz ──
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Ruxsat yo'q" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return json({ error: "Token yaroqsiz" }, 401);
  }

  // ── 2. has_role() RPC orqali ushbu foydalanuvchi admin ekanini ──────
  //    tekshiramiz. has_role() SECURITY DEFINER funksiya, user_roles
  //    jadvali esa profiles'dan ALOHIDA — frontend buni hech qachon
  //    o'zgartira olmaydi (faqat service_role yoki to'g'ridan-to'g'ri
  //    SQL orqali yoziladi).
  const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });

  if (roleError || !isAdmin) {
    return json({ error: "Admin huquqi yo'q" }, 403);
  }

  // ── 3. So'rovni qayta ishlaymiz ──────────────────────────────────────
  try {
    const body = await req.json();
    const { action, userId, days } = body;

    if (action === "give_premium") {
      if (!userId || !days) {
        return json({ error: "userId va days kerak" }, 400);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("tariff_days, tariff_end_date")
        .eq("id", userId)
        .single();

      let endDate: Date;
      const now = new Date();
      if (
        profile?.tariff_days > 0 &&
        profile?.tariff_end_date &&
        new Date(profile.tariff_end_date) > now
      ) {
        endDate = new Date(new Date(profile.tariff_end_date).getTime() + days * 86400000);
      } else {
        endDate = new Date(now.getTime() + days * 86400000);
      }

      const { error } = await supabase.from("profiles").update({
        tariff_days: days,
        tariff_start_date: now.toISOString(),
        tariff_end_date: endDate.toISOString(),
      }).eq("id", userId);

      if (error) throw error;
      return json({ success: true, endDate: endDate.toISOString() });
    }

    if (action === "revoke_premium") {
      if (!userId) return json({ error: "userId kerak" }, 400);

      const { error } = await supabase.from("profiles").update({
        tariff_days: 0,
        tariff_end_date: null,
        tariff_start_date: null,
      }).eq("id", userId);

      if (error) throw error;
      return json({ success: true });
    }

    if (action === "update_profile") {
      if (!userId) return json({ error: "userId kerak" }, 400);
      const { full_name, username } = body;
      const { error } = await supabase.from("profiles").update({
        full_name: full_name || null,
        username: username || null,
      }).eq("id", userId);

      if (error) throw error;
      return json({ success: true });
    }

    if (action === "delete_user") {
      if (!userId) return json({ error: "userId kerak" }, 400);

      const { error: profileErr } = await supabase.from("profiles").delete().eq("id", userId);
      if (profileErr) throw profileErr;

      // haqiqiy auth.users hisobini ham o'chiramiz, aks holda
      // foydalanuvchi hali ham tizimga kira oladi.
      // "User not found" xatosi bo'lsa ham davom etamiz —
      // auth user RPC orqali allaqachon o'chirilgan bo'lishi mumkin.
      const { error: authDeleteErr } = await supabase.auth.admin.deleteUser(userId);
      if (authDeleteErr && !authDeleteErr.message.toLowerCase().includes("not found")) {
        throw authDeleteErr;
      }

      return json({ success: true });
    }

    return json({ error: "Noma'lum action" }, 400);

  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});