// Premium savollar (mavzuli testlar, variantlar) — faqat get-questions edge funksiyasi orqali.
// Ular public/ papkasida yo'q: to'g'ridan-to'g'ri URL bilan yuklab bo'lmaydi.
import { supabase } from "@/integrations/supabase/client";

export type QuestionApiError = "premium_required" | "daily_limit" | "not_authenticated" | "not_found" | "error";

export class QuestionAccessError extends Error {
  constructor(public code: QuestionApiError) {
    super(code);
  }
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("get-questions", { body });
  if (error) {
    // FunctionsHttpError: javob tanasidan kodni olamiz
    let code: QuestionApiError = "error";
    try {
      const ctx = (error as any).context;
      const j = ctx && typeof ctx.json === "function" ? await ctx.json() : null;
      if (j?.error) code = j.error;
    } catch {
      /* tana o'qilmadi */
    }
    throw new QuestionAccessError(code);
  }
  if (!data?.ok) throw new QuestionAccessError((data?.error as QuestionApiError) ?? "error");
  return data as T;
}

const fileCache = new Map<string, Promise<any[]>>();

/** Butun fayl ("m:12", "v:v5"). Faqat premium; sessiya davomida keshlanadi. */
export function fetchQuestionFile(id: string): Promise<any[]> {
  if (!fileCache.has(id)) {
    const p = call<{ items: any[] }>({ action: "file", file: id }).then((r) => r.items ?? []);
    p.catch(() => fileCache.delete(id));
    fileCache.set(id, p);
  }
  return fileCache.get(id)!;
}

/** Mavzu ("12") yoki hamma savollardan ("all") tasodifiy n ta. Bepul — kunlik limit bilan. */
export async function fetchSample(source: string, n: number, kind: "practice" | "topic" | "exam"): Promise<any[]> {
  const r = await call<{ items: any[] }>({ action: "sample", source, n, kind });
  return r.items ?? [];
}

/** Aniq savollar kalit bo'yicha. Bepul foydalanuvchiga faqat o'zi ko'rgan savollar qaytadi. */
export async function fetchByKeys(keys: string[]): Promise<Record<string, { kind: string; raw: any }>> {
  const out: Record<string, { kind: string; raw: any }> = {};
  for (let i = 0; i < keys.length; i += 300) {
    const r = await call<{ items: Record<string, { kind: string; raw: any }> }>({ action: "keys", keys: keys.slice(i, i + 300) });
    Object.assign(out, r.items ?? {});
  }
  return out;
}

/** Mavzu raqamidan fayl identifikatori. */
export function topicFileId(topicId: string): string {
  return topicId === "34" ? "m:34tengaxamiyatli" : `m:${topicId}`;
}
