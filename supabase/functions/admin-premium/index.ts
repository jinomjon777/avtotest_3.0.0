import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Admin autentifikatsiya tekshiruvi
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: "Ruxsat yo'q" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action, userId, days } = body;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    if (action === "give_premium") {
      if (!userId || !days) {
        return new Response(JSON.stringify({ error: "userId va days kerak" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mavjud premium ni tekshirish (uzaytirish uchun)
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
        // Mavjud premiumga qo'shish
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
      return new Response(JSON.stringify({ success: true, endDate: endDate.toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "revoke_premium") {
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId kerak" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await supabase.from("profiles").update({
        tariff_days: 0,
        tariff_end_date: null,
        tariff_start_date: null,
      }).eq("id", userId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_profile") {
      const { full_name, username } = body;
      const { error } = await supabase.from("profiles").update({
        full_name: full_name || null,
        username: username || null,
      }).eq("id", userId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_user") {
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Noma'lum action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});