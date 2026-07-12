import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY")!;

// Xavfsizlik: faqat shu daqiqalar ichida yaratilgan hisoblarni avtomatik
// tasdiqlashga ruxsat beramiz — bu funksiyadan boshqa (eski/begona) hisoblarni
// tasdiqlash uchun foydalanib bo'lmasligini ta'minlaydi.
const MAX_ACCOUNT_AGE_MINUTES = 10;

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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { user_id } = await req.json();
    if (!user_id) return json({ error: "user_id kerak" }, 400);

    const { data: userData, error: fetchErr } = await supabase.auth.admin.getUserById(user_id);
    if (fetchErr || !userData?.user) return json({ error: "Foydalanuvchi topilmadi" }, 404);

    const user = userData.user;

    // Allaqachon tasdiqlangan bo'lsa — qayta ish qilmaymiz
    if (user.email_confirmed_at) {
      return json({ success: true, already_confirmed: true });
    }

    // Hisob yaqinda (bir necha daqiqa oldin) yaratilganini tekshiramiz
    const createdAt = new Date(user.created_at).getTime();
    const ageMinutes = (Date.now() - createdAt) / 60000;
    if (ageMinutes > MAX_ACCOUNT_AGE_MINUTES) {
      return json({ error: "Hisob juda eski, avtomatik tasdiqlab bo'lmaydi" }, 403);
    }

    const { error: updateErr } = await supabase.auth.admin.updateUserById(user_id, {
      email_confirm: true,
    });
    if (updateErr) throw updateErr;

    return json({ success: true });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});