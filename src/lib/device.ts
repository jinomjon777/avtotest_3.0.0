// Qurilma identifikatori va check-device funksiyasi bilan ishlash.
// Server tomoni: supabase/functions/check-device (ro'yxat) + get-questions/get-video-url (tekshiruv).
import { supabase } from "@/integrations/supabase/client";

const KEY = "avtotest_device_id";
let memoryId: string | null = null;

function randomId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  const b = new Uint8Array(16);
  if (c) c.getRandomValues(b);
  else for (let i = 0; i < b.length; i++) b[i] = Math.floor(Math.random() * 256);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

/** Shu brauzerning barqaror qurilma ID'si (localStorage bo'lmasa — sahifa davomida xotirada). */
export function getDeviceId(): string {
  if (memoryId) return memoryId;
  try {
    let id = localStorage.getItem(KEY);
    if (!id || !/^[A-Za-z0-9-]{16,64}$/.test(id)) {
      id = randomId();
      localStorage.setItem(KEY, id);
    }
    memoryId = id;
  } catch {
    memoryId = randomId();
  }
  return memoryId;
}

export function deviceInfo(): string {
  return typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 160) : "";
}

export interface DeviceRow {
  device_id: string;
  device_info: string | null;
  last_seen: string;
  created_at: string;
  current: boolean;
}

export type RegisterResult =
  | { status: "ok" }
  | { status: "limit"; devices: DeviceRow[]; maxDevices: number }
  | { status: "error"; message: string };

async function call(body: Record<string, unknown>): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, status: 401, data: { error: "not_authenticated" } };
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-device`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    },
    body: JSON.stringify({ device_id: getDeviceId(), ...body }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

/** Kirishda / sessiya tiklanganda chaqiriladi (email, Google — barcha usullar). */
export async function registerDevice(): Promise<RegisterResult> {
  try {
    const r = await call({ action: "register_device", device_info: deviceInfo() });
    if (r.ok) return { status: "ok" };
    if (r.status === 409 && r.data.code === "DEVICE_LIMIT_EXCEEDED") {
      return { status: "limit", devices: (r.data.devices as DeviceRow[]) ?? [], maxDevices: Number(r.data.max_devices ?? 2) };
    }
    return { status: "error", message: String(r.data.error ?? `HTTP ${r.status}`) };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "network" };
  }
}

export async function listDevices(): Promise<{ devices: DeviceRow[]; maxDevices: number }> {
  const r = await call({ action: "list_devices" });
  if (!r.ok) throw new Error(String(r.data.error ?? "Qurilmalar ro'yxati olinmadi"));
  return { devices: (r.data.devices as DeviceRow[]) ?? [], maxDevices: Number(r.data.max_devices ?? 2) };
}

/** Boshqa qurilmani hisobdan chiqarish (haftasiga cheklangan). */
export async function revokeDevice(targetDeviceId: string): Promise<void> {
  const r = await call({ action: "revoke_device", target_device_id: targetDeviceId });
  if (!r.ok) throw new Error(String(r.data.error ?? "Qurilmani chiqarib bo'lmadi"));
}

/** Shu qurilmadan chiqishda. */
export async function removeCurrentDevice(): Promise<void> {
  try { await call({ action: "remove_device" }); } catch { /* chiqish baribir davom etadi */ }
}

/** Qurilma ma'lumotidan qisqa nom ("Chrome · Android"). */
export function describeDevice(ua: string | null): string {
  if (!ua) return "Noma'lum qurilma";
  const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad|iOS/i.test(ua) ? "iOS" : /Windows/i.test(ua) ? "Windows"
    : /Mac OS/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : "";
  const br = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /YaBrowser/.test(ua) ? "Yandex" : /Chrome\//.test(ua) ? "Chrome"
    : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Brauzer";
  return os ? `${br} · ${os}` : br;
}
