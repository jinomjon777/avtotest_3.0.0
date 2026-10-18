// @ts-nocheck
// Supabase Edge Function (Deno). VSCode'dagi "Deno topilmadi" kabi xatolar shu sababli — e'tibor bermang.
//
// MAQSAD: premium savollar (mavzuli testlar va variantlar) endi public/ papkasida EMAS.
// Ular shu funksiya ichida turadi va faqat quyidagi qoidalar bilan beriladi:
//
//   action "file"   {file:"m:31"|"v:v12"}             — butun fayl. FAQAT premium.
//   action "sample" {source:"all"|"<mavzu>", n, kind} — tasodifiy n ta savol (n<=40).
//                    premium — cheksiz; bepul — bugun shu tur uchun claim_free_session olingan
//                    bo'lsa, kuniga ko'pi bilan 5 ta to'plam (consume_free_sample).
//   action "keys"   {keys:[...]}                      — aniq savollar (Xatolarim, saqlanganlar).
//                    premium — istalgan; bepul — faqat o'zi javob bergan/saqlagan savollar.
//
// Premium ta'rifi bazadagi is_premium_now() bilan bir xil (faol tarif yoki faol sinov).
// Fayllar va lokator `node scripts/build-question-index.mjs` bilan yangilanadi.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import locator from "./data/locator.json" with { type: "json" };
import { loaders } from "./loaders.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "private, no-store" },
  });
}

const KEY_RE = /^[0-9a-f]{16}$/;
const MAX_KEYS = 300;
const MAX_SAMPLE = 40;
const FREE_KINDS = new Set(["practice", "topic", "exam"]);

const fileCache = new Map<string, unknown[]>();
async function loadFile(id: string): Promise<unknown[] | null> {
  if (fileCache.has(id)) return fileCache.get(id)!;
  const load = loaders[id];
  if (!load) return null;
  const mod = await load();
  const arr = Array.isArray(mod.default) ? mod.default : [];
  fileCache.set(id, arr);
  return arr;
}

function topicFileId(source: string): string | null {
  if (source === "all") return "m:31";
  if (!/^[0-9a-z]{1,12}$/.test(source)) return null;
  const id = source === "34" ? "m:34tengaxamiyatli" : `m:${source}`;
  return loaders[id] ? id : null;
}

function sample<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ── 1. Foydalanuvchi ──────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "not_authenticated" }, 401);
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7));
  if (authError || !user) return json({ error: "not_authenticated" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  const action = body?.action;

  // ── 2. Premium holati (server vaqti bilan) ─────────────────────────
  const { data: premium, error: premErr } = await supabase.rpc("is_premium_now", { p_uid: user.id });
  if (premErr) return json({ error: "server_error" }, 500);

  // ── 3. Butun fayl: faqat premium ───────────────────────────────────
  if (action === "file") {
    const id = String(body.file ?? "");
    if (!loaders[id]) return json({ error: "not_found" }, 404);
    if (!premium) return json({ error: "premium_required" }, 403);
    return json({ ok: true, items: await loadFile(id) });
  }

  // ── 4. Tasodifiy to'plam: premium yoki bugungi bepul limit ─────────
  if (action === "sample") {
    const id = topicFileId(String(body.source ?? ""));
    if (!id) return json({ error: "not_found" }, 404);
    const n = Math.min(Math.max(Number(body.n) || 20, 1), MAX_SAMPLE);
    if (!premium) {
      const kind = String(body.kind ?? "");
      if (!FREE_KINDS.has(kind)) return json({ error: "premium_required" }, 403);
      const { data: allowed, error } = await supabase.rpc("consume_free_sample", { p_uid: user.id, p_kind: kind });
      if (error) return json({ error: "server_error" }, 500);
      if (!allowed) return json({ error: "daily_limit" }, 429);
    }
    const arr = (await loadFile(id)) ?? [];
    return json({ ok: true, items: sample(arr, n) });
  }

  // ── 5. Aniq savollar: premium — hammasi; bepul — faqat ko'rganlari ──
  if (action === "keys") {
    const keys: string[] = Array.isArray(body.keys)
      ? [...new Set(body.keys.filter((k: unknown) => typeof k === "string" && KEY_RE.test(k)))].slice(0, MAX_KEYS)
      : [];
    if (keys.length === 0) return json({ ok: true, items: {} });

    let allowed = keys;
    if (!premium) {
      const { data, error } = await supabase.rpc("owned_question_keys", { p_uid: user.id, p_keys: keys });
      if (error) return json({ error: "server_error" }, 500);
      allowed = Array.isArray(data) ? data : [];
    }

    const items: Record<string, { kind: string; raw: unknown }> = {};
    for (const key of allowed) {
      const spec: string | undefined = (locator as Record<string, string>)[key];
      if (!spec) continue;
      const [kind, stem, idx] = spec.split(":");
      const arr = await loadFile(`${kind}:${stem}`);
      const raw = arr?.[Number(idx)];
      if (raw) items[key] = { kind, raw };
    }
    return json({ ok: true, items });
  }

  return json({ error: "bad_request" }, 400);
});
