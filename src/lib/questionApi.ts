// Premium savollar (mavzuli testlar, variantlar, "barcha") — faqat get-questions edge funksiyasi orqali.
// Ular public/ papkasida yo'q: to'g'ridan-to'g'ri URL bilan yuklab bo'lmaydi.
import { callEdge, EdgeError } from "./edge";
import type { RawQuestion } from "./questionFormat";

export type QuestionApiError =
  | "premium_required" | "daily_limit" | "not_authenticated" | "not_found"
  | "device_required" | "device_revoked" | "error";

export class QuestionAccessError extends Error {
  constructor(public code: QuestionApiError) {
    super(code);
  }
}

const KNOWN = new Set<QuestionApiError>(["premium_required", "daily_limit", "not_authenticated", "not_found", "device_required", "device_revoked"]);

async function call<T>(body: Record<string, unknown>): Promise<T> {
  try {
    return await callEdge<T>("get-questions", body);
  } catch (e) {
    const code = e instanceof EdgeError && KNOWN.has(e.code as QuestionApiError) ? (e.code as QuestionApiError) : "error";
    throw new QuestionAccessError(code);
  }
}

type RawItem = RawQuestion;

const fileCache = new Map<string, Promise<RawItem[]>>();

/** Butun fayl ("m:12", "v:v5"). Faqat premium; sessiya davomida keshlanadi. */
export function fetchQuestionFile(id: string): Promise<RawItem[]> {
  let p = fileCache.get(id);
  if (!p) {
    p = call<{ items: RawItem[] }>({ action: "file", file: id }).then((r) => r.items ?? []);
    p.catch(() => fileCache.delete(id));
    fileCache.set(id, p);
  }
  return p;
}

/** Mavzu ("12"), hamma savollar ("all") yoki premium "barcha" bazasidan tasodifiy n ta. Bepul — kunlik limit bilan. */
export async function fetchSample(source: string, n: number, kind: "practice" | "topic" | "exam"): Promise<RawItem[]> {
  const r = await call<{ items: RawItem[] }>({ action: "sample", source, n, kind });
  return r.items ?? [];
}

/** Aniq savollar kalit bo'yicha. Bepul foydalanuvchiga faqat server ilgari bergan savollar qaytadi. */
export async function fetchByKeys(keys: string[]): Promise<Record<string, { kind: string; raw: RawItem }>> {
  const out: Record<string, { kind: string; raw: RawItem }> = {};
  for (let i = 0; i < keys.length; i += 300) {
    const r = await call<{ items: Record<string, { kind: string; raw: RawItem }> }>({ action: "keys", keys: keys.slice(i, i + 300) });
    Object.assign(out, r.items ?? {});
  }
  return out;
}

/** Mavzu raqamidan fayl identifikatori. */
export function topicFileId(topicId: string): string {
  return topicId === "34" ? "m:34tengaxamiyatli" : `m:${topicId}`;
}
