import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
const MAX_DEVICES = 2;

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

  // JWT tekshirish
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Ruxsat yo'q" }, 401);

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json({ error: "Token yaroqsiz" }, 401);

  try {
    const { action, device_id, device_info } = await req.json();

    // ── Qurilmani ro'yxatdan o'tkazish (login paytida) ──
    if (action === "register_device") {
      if (!device_id) return json({ error: "device_id kerak" }, 400);

      // Mavjud qurilmalar sonini sanash (bu qurilmadan tashqari)
      const { data: sessions, error: fetchErr } = await supabase
        .from("user_sessions")
        .select("device_id, last_seen")
        .eq("user_id", user.id)
        .neq("device_id", device_id)
        .order("last_seen", { ascending: false });

      if (fetchErr) throw fetchErr;

      // Bu qurilma allaqachon ro'yxatda bormi?
      const { data: existing } = await supabase
        .from("user_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("device_id", device_id)
        .maybeSingle();

      if (!existing) {
        // Yangi qurilma — limit tekshirish
        if (sessions && sessions.length >= MAX_DEVICES) {
          return json({
            error: `Bu akkaunt allaqachon ${MAX_DEVICES} ta qurilmada ochiq. Boshqa qurilmadan chiqib, qayta kirging.`,
            code: "DEVICE_LIMIT_EXCEEDED",
            active_devices: sessions.length,
          }, 403);
        }
      }

      // Qurilmani qo'sh yoki yangilab qo'y
      const { error: upsertErr } = await supabase
        .from("user_sessions")
        .upsert({
          user_id: user.id,
          device_id,
          device_info: device_info || null,
          last_seen: new Date().toISOString(),
        }, { onConflict: "user_id,device_id" });

      if (upsertErr) throw upsertErr;

      return json({ success: true, message: "Qurilma ro'yxatga olindi" });
    }

    // ── Qurilmani o'chirish (chiqish paytida) ──
    if (action === "remove_device") {
      if (!device_id) return json({ error: "device_id kerak" }, 400);

      await supabase
        .from("user_sessions")
        .delete()
        .eq("user_id", user.id)
        .eq("device_id", device_id);

      return json({ success: true });
    }

    // ── Faol qurilmalar ro'yxati ──
    if (action === "list_devices") {
      const { data: sessions, error } = await supabase
        .from("user_sessions")
        .select("device_id, device_info, last_seen, created_at")
        .eq("user_id", user.id)
        .order("last_seen", { ascending: false });

      if (error) throw error;
      return json({ success: true, devices: sessions });
    }

    return json({ error: "Noma'lum action" }, 400);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});