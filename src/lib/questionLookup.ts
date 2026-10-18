// Savol kaliti bo'yicha savolning o'zini (matn, variantlar, rasm, izoh) topish.
// Savollar bazada emas, statik JSON'larda — shuning uchun public/data/question_locator.json
// har kalit uchun "tur:fayl:indeks" beradi. Fayl bir marta yuklanadi va keshlanadi.
import { rawQuestionKey } from "./answerTracking";

export type QLang = "oz" | "uz" | "ru";

export interface ResolvedQuestion {
  key: string;
  text: string;
  image?: string;
  options: { id: number; text: string }[];
  correctId: number;
  explanation?: string;
}

type Locator = Record<string, string>;
let locatorPromise: Promise<Locator | null> | null = null;
export function loadLocator(): Promise<Locator | null> {
  if (!locatorPromise) {
    locatorPromise = fetch("/data/question_locator.json")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return locatorPromise;
}

const fileCache = new Map<string, Promise<any[] | null>>();
function filePath(kind: string, stem: string): string {
  if (kind === "m") return `/mavzuli2/${stem}.json`;
  if (kind === "v") return `/data/variants/${stem}.json`;
  return `/${stem}.json`; // f: bepul baza (700baza2.json)
}
function loadFile(kind: string, stem: string): Promise<any[] | null> {
  const path = filePath(kind, stem);
  if (!fileCache.has(path)) {
    fileCache.set(
      path,
      fetch(path)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => (Array.isArray(j) ? j : j?.data ?? j?.questions ?? null))
        .catch(() => null),
    );
  }
  return fileCache.get(path)!;
}

function contentKey(lang: QLang) {
  return lang === "oz" ? "uz_lat" : lang === "uz" ? "uz_cyr" : "ru";
}

function imageFor(kind: string, raw: any): string | undefined {
  if (raw?.media_url && String(raw.media_url).trim()) {
    const u = String(raw.media_url).trim();
    if (u.startsWith("http")) return u;
    const p = u.replace(/^\//, "");
    // variantlar: rasmlar .webp; mavzuli fayllarda media_url o'z nomi bilan
    return "/images/" + (kind === "v" ? (p.endsWith(".webp") ? p : p.replace(/\.[^.]+$/, "") + ".webp") : p);
  }
  if (raw?.media?.exist && raw.media.name) return `/images/${raw.media.name}.png`;
  if (raw?.image) return `/images/${raw.image}`;
  return undefined;
}

function toResolved(key: string, kind: string, raw: any, lang: QLang): ResolvedQuestion | null {
  if (raw?.content) {
    const ck = contentKey(lang);
    const c = raw.content[ck] || raw.content.uz_lat || raw.content.uz_cyr || raw.content.ru;
    if (!c?.options?.length) return null;
    const correct = c.options.find((o: any) => o.is_correct);
    return {
      key,
      text: c.text || "",
      image: imageFor(kind, raw),
      options: c.options.map((o: any) => ({ id: o.id, text: o.text })),
      correctId: correct ? correct.id : c.options[0].id,
      explanation: raw.izoh?.[ck] || raw.izoh?.uz_lat || raw.izoh?.uz_cyr || raw.izoh?.ru || undefined,
    };
  }
  if (Array.isArray(raw?.choises)) {
    const ci = raw.choises.findIndex((c: any) => c.answer === true);
    return {
      key,
      text: raw.question || "",
      image: imageFor(kind, raw),
      options: raw.choises.map((c: any, i: number) => ({ id: i + 1, text: c.text })),
      correctId: ci >= 0 ? ci + 1 : 1,
      explanation: raw.description || undefined,
    };
  }
  return null;
}

/** Berilgan kalitlar uchun savollarni qaytaradi (topilmaganlari natijada bo'lmaydi). */
export async function resolveQuestions(keys: string[], lang: QLang): Promise<Map<string, ResolvedQuestion>> {
  const out = new Map<string, ResolvedQuestion>();
  const loc = await loadLocator();
  if (!loc) return out;

  // fayl bo'yicha guruhlash — har fayl bir marta yuklanadi
  const groups = new Map<string, { kind: string; stem: string; items: { key: string; idx: number }[] }>();
  for (const key of new Set(keys)) {
    const spec = loc[key];
    if (!spec) continue;
    const [kind, stem, idxStr] = spec.split(":");
    const gk = `${kind}:${stem}`;
    if (!groups.has(gk)) groups.set(gk, { kind, stem, items: [] });
    groups.get(gk)!.items.push({ key, idx: Number(idxStr) });
  }

  await Promise.all(
    [...groups.values()].map(async (g) => {
      const arr = await loadFile(g.kind, g.stem);
      if (!arr) return;
      for (const it of g.items) {
        let raw = arr[it.idx];
        // Indeks eskirgan bo'lishi mumkin (fayl yangilangan) — kalit mos kelmasa, fayldan qidiramiz
        if (!raw || rawQuestionKey(raw) !== it.key) {
          raw = arr.find((q) => rawQuestionKey(q) === it.key);
        }
        if (!raw) continue;
        const r = toResolved(it.key, g.kind, raw, lang);
        if (r) out.set(it.key, r);
      }
    }),
  );
  return out;
}

/** Mavzu fayli (public/mavzuli2) dagi barcha savollar kalitlari bilan — mashq tanlash uchun. */
export async function loadTopicPool(topicId: string, lang: QLang): Promise<ResolvedQuestion[]> {
  const stem = topicId === "34" ? "34tengaxamiyatli" : topicId;
  const arr = await loadFile("m", stem);
  if (!arr) return [];
  const map = await import("./answerTracking").then((m) => m.loadTopicMap());
  const res: ResolvedQuestion[] = [];
  for (const raw of arr) {
    const own = rawQuestionKey(raw);
    if (!own) continue;
    const key = map?.aliases?.[own] ?? own;
    const r = toResolved(key, "m", raw, lang);
    if (r) res.push(r);
  }
  return res;
}

/** Hamma savollar to'plami (bugungi mashq zaxirasi): "Barcha savollar" fayli. */
export async function loadAllPool(lang: QLang): Promise<ResolvedQuestion[]> {
  return loadTopicPool("31", lang);
}

export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
