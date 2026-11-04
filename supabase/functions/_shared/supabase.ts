// Umumiy Supabase klienti va autentifikatsiya yordamchilari.
import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2.49.4";

export const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// Avval funksiyalarda turli nomlar ishlatilgan (SB_SERVICE_ROLE_KEY / SUPABASE_SERVICE_ROLE_KEY) —
// endi ikkalasi ham qabul qilinadi, birinchisi ustun.
export const SERVICE_KEY =
  Deno.env.get("SB_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

let admin: SupabaseClient | null = null;
/** service_role klienti (RLS chetlab o'tiladi — chaqiruvchi tekshiruvini O'ZINGIZ qiling). */
export function adminClient(): SupabaseClient {
  if (!admin) {
    if (!SERVICE_KEY) throw new Error("SB_SERVICE_ROLE_KEY sozlanmagan");
    admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}

/** Authorization: Bearer <JWT> dan foydalanuvchini aniqlaydi. Yaroqsiz bo'lsa null. */
export async function getUser(req: Request): Promise<User | null> {
  const h = req.headers.get("Authorization") ?? "";
  if (!h.startsWith("Bearer ")) return null;
  const token = h.slice(7).trim();
  if (!token) return null;
  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

/** Yagona premium ta'rifi — bazadagi access_state() (server vaqti). */
export async function accessState(uid: string): Promise<{ state: string; is_premium: boolean; expires_at: string | null }> {
  const { data, error } = await adminClient().rpc("access_state", { p_uid: uid });
  if (error) throw error;
  return data;
}
