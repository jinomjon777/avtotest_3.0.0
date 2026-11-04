// Supabase Edge Function (Deno): premium video darslar uchun MUDDATLI havola.
//
// Avval 209 ta video havolasi (pub-….r2.dev) sayt JS paketida ochiq turardi — istalgan odam
// barcha premium videolarni yuklab olishi mumkin edi. Endi:
//   * bucket yopiq (r2.dev ommaviy kirish o'chiriladi);
//   * sayt faqat video KALITINI biladi ("Bo'lim/5.1.mp4");
//   * bu funksiya JWT + qurilma + premium holatini tekshirib, R2 (S3 API) uchun imzolangan,
//     VIDEO_URL_TTL soniyadan keyin eskiradigan havola qaytaradi.
//
// Secret'lar: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
// O'tish davri uchun (R2 kalitlari hali sozlanmagan bo'lsa): LEGACY_VIDEO_BASE_URL — eski ommaviy
// manzil; premium tekshiruvi baribir ishlaydi. R2 sozlangach bu o'zgaruvchini o'chiring.

import { AwsClient } from "npm:aws4fetch@1.0.20";
import { jsonResponse, preflight } from "../_shared/cors.ts";
import { accessState, adminClient, getUser } from "../_shared/supabase.ts";
import { checkDevice } from "../_shared/device.ts";

const ACCOUNT = Deno.env.get("R2_ACCOUNT_ID") ?? "";
const ACCESS_KEY = Deno.env.get("R2_ACCESS_KEY_ID") ?? "";
const SECRET_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") ?? "";
const BUCKET = Deno.env.get("R2_BUCKET") ?? "";
const LEGACY_BASE = (Deno.env.get("LEGACY_VIDEO_BASE_URL") ?? "").replace(/\/$/, "");
const TTL = Math.min(Math.max(Number(Deno.env.get("VIDEO_URL_TTL") ?? "10800"), 300), 43200);

const r2 = ACCOUNT && ACCESS_KEY && SECRET_KEY && BUCKET
  ? new AwsClient({ accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY, service: "s3", region: "auto" })
  : null;

// "Bo'lim nomi/fayl.mp4": harflar, raqamlar, bo'shliq, . , ' ( ) - _ ; ".." va boshqa yo'llar taqiqlangan
const KEY_RE = /^[\p{L}\p{N} .,'()_-]{1,120}\/[\p{L}\p{N} .,'()_-]{1,120}\.mp4$/u;

// RFC 3986: S3 imzosi kanonik yo'lni shunday kodlaydi (' ( ) ! * ham kodlanadi)
function encodePath(key: string): string {
  return key.split("/")
    .map((seg) => encodeURIComponent(seg).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()))
    .join("/");
}

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") return jsonResponse(req, { error: "method_not_allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return jsonResponse(req, { error: "not_authenticated" }, 401);

    const device = await checkDevice(adminClient(), user.id, req);
    if (device !== "ok") return jsonResponse(req, { error: device }, 403);

    let body: { key?: unknown };
    try { body = await req.json(); } catch { return jsonResponse(req, { error: "bad_request" }, 400); }
    const key = typeof body.key === "string" ? body.key.normalize("NFC") : "";
    if (!KEY_RE.test(key) || key.includes("..")) return jsonResponse(req, { error: "bad_key" }, 400);

    if (!(await accessState(user.id)).is_premium) return jsonResponse(req, { error: "premium_required" }, 403);

    if (r2) {
      const url = new URL(`https://${ACCOUNT}.r2.cloudflarestorage.com/${BUCKET}/${encodePath(key)}`);
      url.searchParams.set("X-Amz-Expires", String(TTL));
      const signed = await r2.sign(new Request(url, { method: "GET" }), { aws: { signQuery: true } });
      return jsonResponse(req, { ok: true, url: signed.url, expires_in: TTL });
    }
    if (LEGACY_BASE) {
      return jsonResponse(req, { ok: true, url: `${LEGACY_BASE}/${encodePath(key)}`, expires_in: TTL });
    }
    console.error("get-video-url: R2_* secret'lari sozlanmagan");
    return jsonResponse(req, { error: "not_configured" }, 503);
  } catch (e) {
    console.error("get-video-url:", e);
    return jsonResponse(req, { error: "server_error" }, 500);
  }
});
