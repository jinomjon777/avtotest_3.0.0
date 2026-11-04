// Qurilma cheklovi (hisob ulashishga qarshi). Premium kontent beruvchi funksiyalar (get-questions,
// get-video-url) so'rovdagi `x-device-id` shu foydalanuvchi uchun ro'yxatdan o'tganini tekshiradi.
// Ro'yxatdan o'tkazish / boshqa qurilmani chiqarish — check-device funksiyasida.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.4";

export const MAX_DEVICES = Number(Deno.env.get("MAX_DEVICES") ?? "2");
/** Shuncha kun ko'rinmagan qurilma avtomatik bo'shaydi (brauzer tozalanganda hisob qulflanib qolmasin). */
export const STALE_DAYS = 30;
const DEVICE_RE = /^[A-Za-z0-9-]{16,64}$/;

export type DeviceCheck = "ok" | "device_required" | "device_revoked";

export function readDeviceId(req: Request): string | null {
  const id = (req.headers.get("x-device-id") ?? "").trim();
  return DEVICE_RE.test(id) ? id : null;
}

export function isValidDeviceId(id: unknown): id is string {
  return typeof id === "string" && DEVICE_RE.test(id);
}

export async function checkDevice(sb: SupabaseClient, uid: string, req: Request): Promise<DeviceCheck> {
  const deviceId = readDeviceId(req);
  if (!deviceId) return "device_required";
  const { data, error } = await sb
    .from("user_sessions")
    .select("id, last_seen")
    .eq("user_id", uid)
    .eq("device_id", deviceId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return "device_revoked";
  // last_seen'ni ko'pi bilan 10 daqiqada bir yangilaymiz
  if (Date.now() - new Date(data.last_seen).getTime() > 10 * 60_000) {
    await sb.from("user_sessions").update({ last_seen: new Date().toISOString() }).eq("id", data.id);
  }
  return "ok";
}
