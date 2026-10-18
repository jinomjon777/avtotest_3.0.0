#!/usr/bin/env node
// Savollar uchun barqaror kalit va mavzu xaritasini quradi.
//
//   node scripts/build-question-index.mjs [--samples]
//
// Natija (public/data/ ichida):
//   topic_map.json      { keys: {kalit: mavzu_id}, aliases: {kalit: asosiy_kalit}, ... }
//   free_bank_keys.json { "<700baza id>": kalit }
//   question_locator.json { kalit: "m|v|f:<fayl>:<indeks>" }  (savol matnini klientda topish uchun)
//
// Savollar JSON'lari yangilanganda (yangi izoh, yangi savol) shu skriptni qayta ishga tushiring.
// Natija deterministik: bir xil kirish -> bir xil chiqish.
//
// MAVZU QOIDASI: savol mavzusi FAQAT (a) mavzuli fayllarda aniq topilsa yoki (b) imlo xatosi
// darajasida teng bo'lsa beriladi. O'xshashlik bo'yicha mavzu TAXMIN QILINMAYDI: o'lchov
// (leave-one-out) aniqligi atigi ~60–70% chiqdi. Aniqlanmagan savol — "other".

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { questionKey, canonicalQuestionString } from "../src/lib/questionKey.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const P = (...a) => path.join(root, ...a);
const MAVZULI_DIR = "supabase/functions/get-questions/data/m";   // premium: faqat get-questions funksiyasi orqali
const VARIANTS_DIR = "supabase/functions/get-questions/data/v";  // premium: faqat get-questions funksiyasi orqali
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const FUZZY_ALIAS = 0.92;   // bir xil savol deb hisoblash chegarasi (Dice) — so'z tekshiruvi bilan birga
const AGGREGATE = new Set(["31", "35a", "35b"]); // "Barcha savollar", "Yangi savollar" — mavzu emas
const FILE_OVERRIDE = { "34": "34tengaxamiyatli.json" };

const topics = readJson(P("src/data/topics.json"));
const primary = topics.filter((t) => !AGGREGATE.has(t.id));

// Yangi format: {content:{uz_lat:{text, options:[{text}]}}}
const newFmt = (q) => ({ stem: q?.content?.uz_lat?.text ?? "", opts: (q?.content?.uz_lat?.options ?? []).map((o) => o.text) });
// Eski bepul baza (700baza2.json): {question, choises:[{text}]}
const oldFmt = (q) => ({ stem: q?.question ?? "", opts: (q?.choises ?? []).map((o) => o.text) });

// ---- Himoyalar: raqamlar va inkor shakllari bir xil bo'lishi SHART ----
const digits = (s) => (s.match(/\d+/g) ?? []).join(",");
const negations = (s) => (s.match(/\b(emas|\w*maydi|\w*mas)\b/g) ?? []).length;
const guardsOk = (a, b) => digits(a) === digits(b) && negations(a) === negations(b);

// ---- So'z darajasidagi tekshiruv: faqat IMLO XATOSI darajasidagi farqqa ruxsat ----
// Dice uzun matnda bitta so'z farqini (birinchi/uchinchi, chap/o'ng) ko'rmaydi. Shuning uchun
// ikki satr faqat shunda "bir xil savol" hisoblanadiki, farqlanuvchi so'zlar juft-juft
// o'xshash bo'lsa (1–2 harf farq, kamida 4 harfli so'zlarda).
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
const toks = (s) => s.split(/[\s|]+/).filter(Boolean);
function typoEquivalent(sa, sb, pairs) {
  const A = toks(sa), B = toks(sb);
  if (Math.abs(A.length - B.length) > 1) return false;
  const m = A.length, n = B.length;
  const L = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const ua = [], ub = []; let i = 0, j = 0;
  while (i < m && j < n) {
    if (A[i] === B[j]) { i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) ua.push(A[i++]); else ub.push(B[j++]);
  }
  while (i < m) ua.push(A[i++]); while (j < n) ub.push(B[j++]);
  if (ua.length !== ub.length) return false;
  for (let k = 0; k < ua.length; k++) {
    const x = ua[k], y = ub[k]; const d = lev(x, y);
    if (Math.min(x.length, y.length) < 4 || d > 2 || d / Math.max(x.length, y.length) > 0.25) return false;
  }
  if (pairs) for (let k = 0; k < ua.length; k++) pairs.push([ua[k], ub[k]]);
  return true;
}

// ---- 1) Asosiy mavzular: kalit -> mavzu ----
const canon = new Map();        // kalit -> { topic, str }
let conflicts = 0, emptyText = 0;
for (const t of primary) {
  const file = P(MAVZULI_DIR, FILE_OVERRIDE[t.id] ?? `${t.id}.json`);
  if (!fs.existsSync(file)) { console.warn(`! fayl yo'q: ${file}`); continue; }
  for (const q of readJson(file)) {
    const { stem, opts } = newFmt(q);
    const k = questionKey(stem, opts);
    if (!k) { emptyText++; continue; }
    if (canon.has(k)) { if (canon.get(k).topic !== t.id) conflicts++; continue; } // birinchi mavzu yutadi
    canon.set(k, { topic: t.id, str: canonicalQuestionString(stem, opts) });
  }
}

// ---- 2) Fuzzy qidiruv: Dice nomzodlarni saralaydi, qaror so'z tekshiruvida ----
const bigrams = (s) => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); m.set(g, (m.get(g) ?? 0) + 1); } return m; };
const canonList = [...canon.entries()].map(([k, v]) => ({ k, str: v.str, bg: bigrams(v.str), len: v.str.length }));
function bestMatch(str) {
  const bg = bigrams(str); const cands = [];
  for (const c of canonList) {
    if (Math.abs(c.len - str.length) > Math.max(20, str.length * 0.4)) continue;
    let inter = 0; for (const [g, n] of bg) { const m = c.bg.get(g); if (m) inter += Math.min(n, m); }
    const score = (2 * inter) / (Math.max(str.length - 1, 0) + Math.max(c.len - 1, 0) || 1);
    if (score >= 0.85) cands.push({ k: c.k, score, str: c.str });
  }
  cands.sort((a, b) => b.score - a.score);
  for (const c of cands) {
    if (!guardsOk(str, c.str)) continue;
    const pairs = []; if (typoEquivalent(str, c.str, pairs)) return { ...c, pairs };
  }
  return { k: null, score: 0 };
}

// ---- 3) Boshqa banklardagi savollarni kanonik kalitga bog'lash ----
const keys = {};                // kanonik kalit -> mavzu
for (const [k, v] of canon) keys[k] = v.topic;
const aliases = {};             // boshqa kalit -> kanonik kalit
const stats = { canonical: canon.size, banks: {} };
const pairCount = new Map();
const cacheA = new Map();

function resolve({ stem, opts }) {
  const own = questionKey(stem, opts);
  if (!own) return { key: null };
  if (canon.has(own)) return { key: own, how: "exact" };
  const str = canonicalQuestionString(stem, opts);
  if (!cacheA.has(str)) cacheA.set(str, bestMatch(str));
  const a = cacheA.get(str);
  if (a.k && a.score >= FUZZY_ALIAS) {
    aliases[own] = a.k;
    for (const p of a.pairs ?? []) pairCount.set(p.join(" ≈ "), (pairCount.get(p.join(" ≈ ")) ?? 0) + 1);
    return { key: a.k, how: "alias" };
  }
  keys[own] = "other"; return { key: own, how: "other" };
}
function runBank(name, items) {
  const s = { total: 0, exact: 0, alias: 0, other: 0, empty: 0 };
  const out = [];
  for (const it of items) { s.total++; const r = resolve(it); if (!r.key) { s.empty++; out.push(null); } else { s[r.how]++; out.push(r.key); } }
  stats.banks[name] = s; return out;
}

// variantlar
const variantItems = [];
for (const f of fs.readdirSync(P(VARIANTS_DIR)).sort()) for (const q of readJson(P(VARIANTS_DIR, f))) variantItems.push(newFmt(q));
runBank("variants", variantItems);

// mavzuli aggregatlar (31, 35a, 35b)
const aggItems = [];
for (const id of AGGREGATE) { const f = P(MAVZULI_DIR, `${id}.json`); if (fs.existsSync(f)) for (const q of readJson(f)) aggItems.push(newFmt(q)); }
runBank("mavzuli-aggregate", aggItems);

// premium baza (barcha.json) — repoda bo'lsa
const barchaPath = P("supabase/functions/get-premium-questions/barcha.json");
if (fs.existsSync(barchaPath)) runBank("barcha(premium)", readJson(barchaPath).map(newFmt));

// bepul baza: 700baza2.json (lotin). id -> kalit
const freeKeys = {};
const freePath = P("public/700baza2.json");
if (fs.existsSync(freePath)) {
  const free = readJson(freePath);
  const ks = runBank("free(700baza2)", free.map(oldFmt));
  free.forEach((q, i) => { if (ks[i]) freeKeys[String(q.id)] = ks[i]; });
}

// ---- 3b) Savol joylashuvi: kalit -> qaysi faylning nechanchi savoli ----
// "Mening xatolarim" kabi sahifalar savol MATNINI klientda ko'rsatishi kerak (savollar bazada emas).
// Format: "<tur>:<fayl>:<indeks>", tur: m = public/mavzuli2/<fayl>.json, v = public/data/variants/<fayl>.json,
// f = public/<fayl>.json (bepul baza). Klient faylni yuklab, kalit mosligini tekshiradi (indeks eskirsa,
// fayldan qidiradi), shuning uchun bu fayl yangilanmay qolsa ham xato bo'lmaydi — faqat sekinroq.
const locator = {};
const effKey = (own) => (canon.has(own) ? own : (aliases[own] ?? own));
function locate(kind, stem, items) {
  items.forEach((it, i) => {
    const own = questionKey(it.stem, it.opts);
    if (!own) return;
    const k = effKey(own);
    if (!(k in locator)) locator[k] = `${kind}:${stem}:${i}`;
  });
}
for (const t of primary) {
  const fname = FILE_OVERRIDE[t.id] ?? `${t.id}.json`;
  const file = P(MAVZULI_DIR, fname);
  if (fs.existsSync(file)) locate("m", fname.replace(/\.json$/, ""), readJson(file).map(newFmt));
}
for (const f of fs.readdirSync(P(VARIANTS_DIR)).sort()) locate("v", f.replace(/\.json$/, ""), readJson(P(VARIANTS_DIR, f)).map(newFmt));
for (const id of AGGREGATE) { const f = P(MAVZULI_DIR, `${id}.json`); if (fs.existsSync(f)) locate("m", id, readJson(f).map(newFmt)); }
if (fs.existsSync(freePath)) locate("f", "700baza2", readJson(freePath).map(oldFmt));

// ---- 4) Yozish (kalitlar tartiblangan: deterministik fayl) ----
const sortObj = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : 1)));
fs.writeFileSync(P("public/data/topic_map.json"), JSON.stringify({
  version: 3,
  topics: primary.map((t) => t.id),
  keys: sortObj(keys),
  aliases: sortObj(aliases),
}));
fs.writeFileSync(P("public/data/free_bank_keys.json"), JSON.stringify(sortObj(freeKeys)));
fs.writeFileSync(P("public/data/question_locator.json"), JSON.stringify(sortObj(locator)));

console.log("Kanonik savollar (mavzuli 1–34):", stats.canonical, "| boshqa mavzuga tushgan takrorlar:", conflicts, "| bo'sh matn:", emptyText);
console.table(stats.banks);
console.log("question_locator.json: joylashuvi ma'lum kalitlar", Object.keys(locator).length, "/", Object.keys(keys).length);
console.log("topic_map.json: kalitlar", Object.keys(keys).length, "| aliaslar", Object.keys(aliases).length);
const dist = {}; for (const t of Object.values(keys)) dist[t] = (dist[t] ?? 0) + 1;
console.log("'other' (mavzusi aniqlanmagan):", dist.other ?? 0);
if (process.argv.includes("--samples")) { console.log("Birlashtirilgan so'z juftliklari (tekshiring):"); console.log([...pairCount.entries()].sort((a, b) => b[1] - a[1]).map(([p, n]) => `${n}x  ${p}`).join("\n")); }

// ---- 5) get-questions edge funksiyasi uchun: server lokatori va fayl yuklovchilari ----
// Premium fayllar public/ da EMAS — faqat funksiya ichida. Funksiya kalit -> fayl:indeks ni shu fayldan oladi.
{
  const FN = "supabase/functions/get-questions";
  const serverLoc = Object.fromEntries(Object.entries(sortObj(locator)).filter(([, v]) => !v.startsWith("f:")));
  fs.writeFileSync(P(FN, "data/locator.json"), JSON.stringify(serverLoc));
  // STATIK importlar: Docker'siz deploy (API orqali paketlash) faqat statik importlarni yuklaydi —
  // dinamik import() dagi fayllar serverga chiqmay qoladi.
  const imports = [], entries = [];
  let n = 0;
  for (const [kind, dir] of [["m", MAVZULI_DIR], ["v", VARIANTS_DIR]]) {
    for (const f of fs.readdirSync(P(dir)).filter((x) => x.endsWith(".json")).sort()) {
      const v = `f${n++}`;
      imports.push(`import ${v} from "./data/${kind}/${f}" with { type: "json" };`);
      entries.push(`  "${kind}:${f.replace(/\.json$/, "")}": ${v} as unknown[],`);
    }
  }
  const lines = ["// AVTOMATIK YARATILGAN: node scripts/build-question-index.mjs — qo'lda tahrirlamang.",
    "// Statik importlar shart: Docker'siz deploy faqat statik import qilingan fayllarni serverga yuklaydi.",
    ...imports, "",
    "const files: Record<string, unknown[]> = {", ...entries, "};", "",
    "export const loaders: Record<string, () => Promise<{ default: unknown[] }>> = Object.fromEntries(",
    "  Object.entries(files).map(([k, v]) => [k, () => Promise.resolve({ default: v })]),",
    ");", ""];
  fs.writeFileSync(P(FN, "loaders.ts"), lines.join("\n"));
  console.log(`get-questions: server lokatori ${Object.keys(serverLoc).length} kalit, yuklovchilar yozildi`);
}
