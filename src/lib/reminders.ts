// Kunlik reja eslatmalari: Telegram ulash, push-obuna, kalendar fayllari.
import { supabase } from "@/integrations/supabase/client";

export const BOT_USERNAME = "avtotestsPremium_bot";
export const PLAN_TARGET = 5;
/** Bepul foydalanuvchining "Kunlik reja" testlari shu variant raqami bilan saqlanadi (bazada 97 hisoblanadi). */
export const PLAN_FREE_VARIANT = 97;

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await (supabase as any).rpc(name, args ?? {});
  if (error) throw error;
  if (data && data.ok === false) throw new Error(data.error || "rpc_failed");
  return data as T;
}

export function saveReminder(enabled: boolean, time: string, telegram: boolean, push: boolean) {
  return rpc("set_reminder", { p_enabled: enabled, p_time: time, p_telegram: telegram, p_push: push });
}

/** Bot havolasini ochadi: foydalanuvchi "Start" bosgach hisob ulanadi. */
export async function telegramLinkUrl(): Promise<string> {
  const r = await rpc<{ token: string }>("create_telegram_link_token");
  return `https://t.me/${BOT_USERNAME}?start=link_${r.token}`;
}

export function unlinkTelegram() {
  return rpc("unlink_telegram");
}

export async function sendTestReminder(): Promise<{ telegram: string; push: string[] }> {
  const { data, error } = await supabase.functions.invoke("send-reminders", { body: { action: "test" } });
  if (error) throw error;
  return data;
}

// ── Push ─────────────────────────────────────────────────────────

export type PushSupport = "ok" | "unsupported" | "ios-needs-install" | "denied";

export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return ios && !standalone ? "ios-needs-install" : "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  return "ok";
}

function urlB64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Ruxsat so'raydi, obuna bo'ladi va serverga saqlaydi. */
export async function enablePush(): Promise<"ok" | "denied" | "unsupported" | "server"> {
  if (pushSupport() !== "ok") return pushSupport() === "denied" ? "denied" : "unsupported";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "denied";

  const { data: cfg } = await supabase.functions.invoke("send-reminders", { body: { action: "vapid" } });
  if (!cfg?.publicKey) return "server";

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(cfg.publicKey).buffer as ArrayBuffer });
  }
  const j = sub.toJSON();
  await rpc("save_push_subscription", { p_endpoint: j.endpoint, p_p256dh: j.keys?.p256dh, p_auth: j.keys?.auth });
  return "ok";
}

export async function disablePushOnThisDevice(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await rpc("delete_push_subscription", { p_endpoint: sub.endpoint }).catch(() => undefined);
    await sub.unsubscribe().catch(() => undefined);
  }
}

// ── Kalendar ─────────────────────────────────────────────────────

const EVENT_TITLE = "SmartAvto: 5 ta test ishlash";
const EVENT_DESC = "Bugungi reja — 5 ta test. Boshlash: https://smartavto.uz/kunlik-reja";

function pad(n: number) { return String(n).padStart(2, "0"); }

/** Bugungi (yoki vaqti o'tgan bo'lsa ertangi) sana, Toshkent vaqti bo'yicha "YYYYMMDD". */
function startDate(time: string): string {
  const now = new Date(Date.now() + 5 * 3600_000); // Asia/Tashkent = UTC+5 (yozgi vaqt yo'q)
  const [h, m] = time.split(":").map(Number);
  const passed = now.getUTCHours() * 60 + now.getUTCMinutes() >= h * 60 + m;
  const d = new Date(now.getTime() + (passed ? 86_400_000 : 0));
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

function endTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const t = Math.min(h * 60 + m + 30, 23 * 60 + 59);
  return `${pad(Math.floor(t / 60))}${pad(t % 60)}00`;
}

/** Har kuni takrorlanadigan, vaqtida ovoz bilan eslatadigan .ics fayl (iPhone, Samsung, Outlook). */
export function buildIcs(time: string): string {
  const day = startDate(time);
  const hhmm = time.replace(":", "") + "00";
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SmartAvto//Kunlik reja//UZ",
    "CALSCALE:GREGORIAN",
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Tashkent",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0500",
    "TZOFFSETTO:+0500",
    "TZNAME:+05",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:smartavto-kunlik-reja-${hhmm}@smartavto.uz`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Asia/Tashkent:${day}T${hhmm}`,
    `DTEND;TZID=Asia/Tashkent:${day}T${endTime(time)}`,
    "RRULE:FREQ=DAILY",
    `SUMMARY:${EVENT_TITLE}`,
    `DESCRIPTION:${EVENT_DESC}`,
    "URL:https://smartavto.uz/kunlik-reja",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${EVENT_TITLE}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "BEGIN:VALARM",
    "ACTION:AUDIO",
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function downloadIcs(time: string) {
  const blob = new Blob([buildIcs(time)], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "smartavto-kunlik-reja.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** Google Kalendar (Android) — har kuni takrorlanadigan tadbir oynasi. */
export function googleCalendarUrl(time: string): string {
  const day = startDate(time);
  const hhmm = time.replace(":", "") + "00";
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: EVENT_TITLE,
    details: EVENT_DESC,
    dates: `${day}T${hhmm}/${day}T${endTime(time)}`,
    ctz: "Asia/Tashkent",
    recur: "RRULE:FREQ=DAILY",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
