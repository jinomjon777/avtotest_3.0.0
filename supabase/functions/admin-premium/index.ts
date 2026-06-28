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

  // ── helper: amallar tarixini audit_log'ga yozish ─────────────────────
  async function logAction(action: string, details: Record<string, unknown> = {}) {
    try {
      await supabase.from("audit_log").insert({ user_id: user.id, action, details });
    } catch (_e) {
      // audit yozuvi muvaffaqiyatsiz bo'lsa ham asosiy amal davom etadi
    }
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
      await logAction("give_premium", { userId, days, endDate: endDate.toISOString() });
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
      await logAction("revoke_premium", { userId });
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
      await logAction("update_profile", { userId, full_name, username });
      return json({ success: true });
    }

    if (action === "delete_user") {
      if (!userId) return json({ error: "userId kerak" }, 400);

      const { data: delProfile } = await supabase.from("profiles").select("email, full_name").eq("id", userId).single();

      const { error: profileErr } = await supabase.from("profiles").delete().eq("id", userId);
      if (profileErr) throw profileErr;

      // haqiqiy auth.users hisobini ham o'chiramiz, aks holda
      // foydalanuvchi hali ham tizimga kira oladi.
      const { error: authDeleteErr } = await supabase.auth.admin.deleteUser(userId);
      if (authDeleteErr) throw authDeleteErr;

      await logAction("delete_user", { userId, email: delProfile?.email, full_name: delProfile?.full_name });
      return json({ success: true });
    }

    // ── CHEK (kvitansiyalar) boshqaruvi ──────────────────────────────

    if (action === "create_chek") {
      const { email, link, amount, tariff_days, processed } = body;
      if (!email || !link) return json({ error: "email va link kerak" }, 400);
      const { data, error } = await supabase
        .from("chek")
        .insert({
          email,
          link,
          amount: amount ?? null,
          tariff_days: tariff_days ?? null,
          processed: processed ?? false,
        })
        .select()
        .single();
      if (error) throw error;
      await logAction("create_chek", { email, amount, tariff_days });
      return json({ success: true, data });
    }

    if (action === "list_chek") {
      const { data, error } = await supabase.from("chek").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return json({ success: true, data });
    }

    if (action === "update_chek") {
      const { chekId, amount, tariff_days, processed } = body;
      if (!chekId) return json({ error: "chekId kerak" }, 400);
      const patch: Record<string, unknown> = {};
      if (amount !== undefined) patch.amount = amount;
      if (tariff_days !== undefined) patch.tariff_days = tariff_days;
      if (processed !== undefined) patch.processed = processed;
      const { error } = await supabase.from("chek").update(patch).eq("id", chekId);
      if (error) throw error;
      await logAction("update_chek", { chekId, ...patch });
      return json({ success: true });
    }

    if (action === "delete_chek") {
      const { chekId } = body;
      if (!chekId) return json({ error: "chekId kerak" }, 400);
      const { data: oldChek } = await supabase.from("chek").select("*").eq("id", chekId).single();
      const { error } = await supabase.from("chek").delete().eq("id", chekId);
      if (error) throw error;
      await logAction("delete_chek", oldChek ?? { chekId });
      return json({ success: true });
    }

    // ── TO'LOV TURLARI boshqaruvi ─────────────────────────────────────

    if (action === "list_payment_methods") {
      const { data, error } = await supabase.from("payment_methods").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return json({ success: true, data });
    }

    if (action === "add_payment_method") {
      const { name } = body;
      if (!name) return json({ error: "name kerak" }, 400);
      const { data, error } = await supabase.from("payment_methods").insert({ name }).select().single();
      if (error) throw error;
      await logAction("add_payment_method", { name });
      return json({ success: true, data });
    }

    if (action === "delete_payment_method") {
      const { methodId } = body;
      if (!methodId) return json({ error: "methodId kerak" }, 400);
      const { error } = await supabase.from("payment_methods").delete().eq("id", methodId);
      if (error) throw error;
      await logAction("delete_payment_method", { methodId });
      return json({ success: true });
    }

    // ── AUDIT LOG ──────────────────────────────────────────────────────

    if (action === "list_audit") {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return json({ success: true, data });
    }

    // ── ADMIN PROFIL / PAROL ─────────────────────────────────────────

    if (action === "change_admin_password") {
      const { newPassword } = body;
      if (!newPassword || newPassword.length < 6) return json({ error: "Parol kamida 6 belgi bo'lishi kerak" }, 400);
      const { error } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
      if (error) throw error;
      await logAction("change_admin_password", {});
      return json({ success: true });
    }

    return json({ error: "Noma'lum action" }, 400);

  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});