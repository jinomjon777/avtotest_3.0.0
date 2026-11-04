// Supabase Edge Function (Deno).
//
// Premium savollar (mavzuli testlar, variantlar, "barcha savollar") faqat shu funksiya orqali beriladi:
//
//   action "file"   {file:"m:31"|"v:v12"}             — butun fayl. FAQAT premium.
//   action "sample" {source:"all"|"barcha"|"<mavzu>", n, kind} — tasodifiy n ta savol (bepul n<=40, premium n<=60).
//                    premium — cheksiz; bepul — bugun shu tur uchun claim_free_session olingan
//                    bo'lsa, ko'pi bilan 3 ta to'plam (consume_free_sample).
//   action "keys"   {keys:[...]}                      — aniq savollar (Xatolarim, saqlanganlar).
//                    premium — istalgan; bepul — faqat SERVER ILGARI BERGAN savollar (served_questions).
//
// Bepul foydalanuvchiga berilgan har bir savol kaliti served_questions'ga yoziladi. Avval egalik
// "saqlangan/javob berilgan" savollar bo'yicha aniqlanardi va bu ochiq question_locator.json'dagi
// kalitlar bilan butun premium bazani olishga imkon berardi.
//
// Har so'rovda: JWT, qurilma (x-device-id) va premium holati (bazadagi access_state()) tekshiriladi.
// Paket (data/*.json) `node scripts/build-question-index.mjs` bilan yaratiladi.

import locator from "./data/locator.json" with { type: "json" };
import bankPacked from "./data/bank.gz.json" with { type: "json" };
import fileIndex from "./data/files.json" with { type: "json" };
import bankKeysJson from "./data/bank_keys.json" with { type: "json" };
import { jsonResponse, preflight } from "../_shared/cors.ts";
import { accessState, adminClient, getUser } from "../_shared/supabase.ts";
import { checkDevice } from "../_shared/device.ts";

type Raw = Record<string, unknown>;
type Item = { raw: Raw; key: string | null };

const KEY_RE = /^[0-9a-f]{16}$/;
const MAX_KEYS = 300;
const MAX_SAMPLE_FREE = 40;
const MAX_SAMPLE_PREMIUM = 60; // "Test ishlash" 50 talik rejimi
const FREE_KINDS = new Set(["practice", "topic", "exam"]);

// files.json: { "m:31": [[bankIndeks, task_info?], ...] } — asl fayl tartibi saqlanadi
const files = fileIndex as unknown as Record<string, [number, unknown?][]>;
const bankKeys = bankKeysJson as unknown as (string | null)[];
const loc = locator as unknown as Record<string, string>;

function hasFile(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(files, id);
}

// bank.gz.json: { gz: base64(gzip(JSON)) } — deploy hajmi uchun siqilgan; birinchi so'rovda bir marta ochiladi
let bankPromise: Promise<Raw[]> | null = null;
function getBank(): Promise<Raw[]> {
  if (!bankPromise) {
    bankPromise = (async () => {
      const bin = Uint8Array.from(atob((bankPacked as { gz: string }).gz), (c) => c.charCodeAt(0));
      const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
      return JSON.parse(await new Response(stream).text()) as Raw[];
    })();
  }
  return bankPromise;
}

const fileCache = new Map<string, Item[]>();
async function loadFile(id: string): Promise<Item[] | null> {
  const hit = fileCache.get(id);
  if (hit) return hit;
  if (!hasFile(id)) return null;
  const bank = await getBank();
  const arr: Item[] = files[id].map(([i, ti]) => ({
    raw: ti === undefined ? bank[i] : { task_info: ti, ...bank[i] },
    key: bankKeys[i] ?? null,
  }));
  fileCache.set(id, arr);
  return arr;
}

// "all" = barcha mavzu fayllari birlashmasi (31.json "Barcha savollar" EMAS: unda izohlar yo'q).
// Bir xil savol (kalit) bir nechta faylda bo'lsa, bir marta olinadi.
let allPool: Item[] | null = null;
async function loadAll(): Promise<Item[]> {
  if (allPool) return allPool;
  const seen = new Set<string>();
  const out: Item[] = [];
  for (const id of Object.keys(files).filter((k) => k.startsWith("m:") && k !== "m:31").sort()) {
    for (const it of (await loadFile(id)) ?? []) {
      const sig = it.key ?? JSON.stringify(it.raw);
      if (seen.has(sig)) continue;
      seen.add(sig);
      out.push(it);
    }
  }
  allPool = out;
  return out;
}

function topicFileId(source: string): string | null {
  if (source === "all") return "all";
  if (source === "barcha") return hasFile("b:barcha") ? "b:barcha" : null;
  if (!/^[0-9a-z]{1,12}$/.test(source)) return null;
  const id = source === "34" ? "m:34tengaxamiyatli" : `m:${source}`;
  return hasFile(id) ? id : null;
}

function sample<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

async function recordServed(uid: string, items: Item[]): Promise<void> {
  const keys = [...new Set(items.map((i) => i.key).filter((k): k is string => !!k && KEY_RE.test(k)))];
  if (keys.length === 0) return;
  const { error } = await adminClient().rpc("record_served_questions", { p_uid: uid, p_keys: keys });
  if (error) throw error;
}

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") return jsonResponse(req, { error: "method_not_allowed" }, 405);

  try {
    // ── 1. Foydalanuvchi va qurilma ────────────────────────────────────
    const user = await getUser(req);
    if (!user) return jsonResponse(req, { error: "not_authenticated" }, 401);

    const sb = adminClient();
    const device = await checkDevice(sb, user.id, req);
    if (device !== "ok") return jsonResponse(req, { error: device }, 403);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse(req, { error: "bad_request" }, 400);
    }
    const action = body?.action;

    // ── 2. Premium holati (server vaqti, yagona ta'rif) ────────────────
    const premium = (await accessState(user.id)).is_premium;

    // ── 3. Butun fayl: faqat premium ───────────────────────────────────
    if (action === "file") {
      const id = String(body.file ?? "");
      if (!hasFile(id)) return jsonResponse(req, { error: "not_found" }, 404);
      if (!premium) return jsonResponse(req, { error: "premium_required" }, 403);
      const items = (await loadFile(id)) ?? [];
      await recordServed(user.id, items);
      return jsonResponse(req, { ok: true, items: items.map((i) => i.raw) });
    }

    // ── 4. Tasodifiy to'plam: premium yoki bugungi bepul limit ─────────
    if (action === "sample") {
      const id = topicFileId(String(body.source ?? ""));
      if (!id) return jsonResponse(req, { error: "not_found" }, 404);
      const n = Math.min(Math.max(Math.floor(Number(body.n)) || 20, 1), premium ? MAX_SAMPLE_PREMIUM : MAX_SAMPLE_FREE);
      if (!premium) {
        const kind = String(body.kind ?? "");
        if (!FREE_KINDS.has(kind)) return jsonResponse(req, { error: "premium_required" }, 403);
        const { data: allowed, error } = await sb.rpc("consume_free_sample", { p_uid: user.id, p_kind: kind });
        if (error) throw error;
        if (!allowed) return jsonResponse(req, { error: "daily_limit" }, 429);
      }
      const pool = id === "all" ? await loadAll() : ((await loadFile(id)) ?? []);
      const picked = sample(pool, n);
      await recordServed(user.id, picked);
      return jsonResponse(req, { ok: true, items: picked.map((i) => i.raw) });
    }

    // ── 5. Aniq savollar: premium — hammasi; bepul — faqat ilgari berilganlari ──
    if (action === "keys") {
      const keys: string[] = Array.isArray(body.keys)
        ? [...new Set((body.keys as unknown[]).filter((k): k is string => typeof k === "string" && KEY_RE.test(k)))].slice(0, MAX_KEYS)
        : [];
      if (keys.length === 0) return jsonResponse(req, { ok: true, items: {} });

      let allowed = keys;
      if (!premium) {
        const { data, error } = await sb.rpc("owned_question_keys", { p_uid: user.id, p_keys: keys });
        if (error) throw error;
        allowed = Array.isArray(data) ? data : [];
      }

      const items: Record<string, { kind: string; raw: Raw }> = {};
      for (const key of allowed) {
        const spec = loc[key];
        if (!spec) continue;
        const [kind, stem, idx] = spec.split(":");
        const arr = await loadFile(`${kind}:${stem}`);
        const it = arr?.[Number(idx)];
        if (it) items[key] = { kind, raw: it.raw };
      }
      if (premium) await recordServed(user.id, Object.keys(items).map((key) => ({ key, raw: {} })));
      return jsonResponse(req, { ok: true, items });
    }

    return jsonResponse(req, { error: "bad_request" }, 400);
  } catch (e) {
    console.error("get-questions:", e);
    return jsonResponse(req, { error: "server_error" }, 500);
  }
});
