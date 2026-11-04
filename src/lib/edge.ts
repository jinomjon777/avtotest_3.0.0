// Edge funksiyalarni chaqirish: JWT + qurilma ID sarlavhasi, yagona xato kodlari.
// Qurilma ro'yxatdan chiqarilgan bo'lsa (boshqa qurilmadan "chiqarilgan") — hodisa yuboriladi,
// AuthContext foydalanuvchini tizimdan chiqaradi.
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId, registerDevice } from "./device";

export class EdgeError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
  }
}

export const DEVICE_REVOKED_EVENT = "smartavto:device-revoked";

async function rawCall(name: string, body: unknown): Promise<{ status: number; data: Record<string, unknown> }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new EdgeError("not_authenticated", 401);
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
      "x-device-id": getDeviceId(),
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, data };
}

/** Premium kontent funksiyalari uchun. "device_required" bo'lsa qurilmani ro'yxatdan o'tkazib, bir marta qayta urinadi. */
export async function callEdge<T = Record<string, unknown>>(name: string, body: unknown): Promise<T> {
  let r = await rawCall(name, body);
  if (r.status === 403 && r.data.error === "device_required") {
    const reg = await registerDevice();
    if (reg.status === "ok") r = await rawCall(name, body);
  }
  if (r.status === 403 && r.data.error === "device_revoked") {
    window.dispatchEvent(new CustomEvent(DEVICE_REVOKED_EVENT));
  }
  if (r.status >= 400 || r.data.ok === false || r.data.error) {
    throw new EdgeError(String(r.data.error ?? "error"), r.status);
  }
  return r.data as T;
}
