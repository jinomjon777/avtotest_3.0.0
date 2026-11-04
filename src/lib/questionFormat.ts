// Savol fayllarining 3 xil formatini bitta ko'rinishga keltiradi va savol manbasini yuklaydi.
// Avval bu mantiq TestInterfaceBase (2 marta) va TestInterfaceCombined ichida nusxalangan edi.
import { rawQuestionKey } from "./answerTracking";
import { fetchSample } from "./questionApi";

export type QuestionLang = "oz" | "uz" | "ru";

type Option3 = { id: number; text: string; is_correct: boolean };
type Content3 = { text: string; options: Option3[] };
type LangText = { oz?: string; uz?: string; ru?: string };

/**
 * Xom savol — 3 formatdan biri:
 *  1) eski bilet: {question: {oz,uz,ru} | string, answers:{status, answer:{oz:[],...}}, photo}
 *  2) bepul baza (700baza*.json): {question, choises:[{text, answer}], media:{exist,name}, description}
 *  3) premium / rus bepul baza: {content:{uz_lat,uz_cyr,ru}, media_url, izoh}
 */
export interface RawQuestion {
  question?: string | LangText;
  choises?: { text: string; answer: boolean }[];
  media?: { exist?: boolean; name?: string };
  image?: string | null;
  photo?: string | null;
  description?: string;
  answers?: { status?: number; answer?: { oz?: string[]; uz?: string[]; ru?: string[] } };
  media_url?: string;
  content?: { uz_lat?: Content3; uz_cyr?: Content3; ru?: Content3 };
  izoh?: { uz_lat?: string; uz_cyr?: string; ru?: string };
  [k: string]: unknown;
}

export interface NormalizedQuestion {
  id: number;
  text: string;
  image?: string;
  correctAnswer: number;
  answers: { id: number; text: string }[];
  qkey?: string;
  explanation?: string;
}

/** Brauzerga "premium Test ishlash" bazasi kerakligini bildiruvchi manba nomi (butun fayl EMAS). */
export const PREMIUM_SOURCE = "premium:barcha";

export function contentKey(lang: QuestionLang): "uz_lat" | "uz_cyr" | "ru" {
  return lang === "oz" ? "uz_lat" : lang === "uz" ? "uz_cyr" : "ru";
}

/** JSON javobidan savollar massivini ajratadi ({data:[]}, [], {questions:[]}). */
export function extractRawArray(json: unknown): RawQuestion[] {
  if (Array.isArray(json)) return json as RawQuestion[];
  const o = json as { data?: unknown; questions?: unknown } | null;
  if (o && Array.isArray(o.data)) return o.data as RawQuestion[];
  if (o && Array.isArray(o.questions)) return o.questions as RawQuestion[];
  return [];
}

export function normalizeQuestion(q: RawQuestion, idx: number, lang: QuestionLang, imagePrefix: string): NormalizedQuestion {
  // 3-format
  const c = q.content;
  if (c && (c.uz_lat || c.uz_cyr || c.ru)) {
    const ck = contentKey(lang);
    const lc = (c[ck] || c.uz_lat || c.uz_cyr || c.ru) as Content3;
    const correct = lc.options.find((o) => o.is_correct);
    const media = typeof q.media_url === "string" ? q.media_url.trim() : "";
    return {
      id: idx + 1,
      text: lc.text,
      image: media ? (media.startsWith("http") ? media : `${imagePrefix}${media}`) : undefined,
      correctAnswer: correct ? correct.id : 1,
      qkey: rawQuestionKey(q),
      answers: lc.options.map((o) => ({ id: o.id, text: o.text })),
      explanation: q.izoh?.[ck] || q.izoh?.uz_lat || undefined,
    };
  }

  // 2-format
  if (Array.isArray(q.choises)) {
    const correctIndex = q.choises.findIndex((ch) => ch.answer === true);
    let image: string | undefined;
    if (q.media?.exist && q.media?.name) image = `${imagePrefix}${q.media.name}.png`;
    else if (typeof q.image === "string" && q.image) image = `${imagePrefix}${q.image}`;
    return {
      id: idx + 1,
      text: typeof q.question === "string" ? q.question : "",
      image,
      correctAnswer: correctIndex + 1,
      qkey: rawQuestionKey(q),
      answers: q.choises.map((ch, i) => ({ id: i + 1, text: ch.text })),
      explanation: typeof q.description === "string" ? q.description : undefined,
    };
  }

  // 1-format
  const qo = q.question;
  const answers = q.answers?.answer?.[lang] || q.answers?.answer?.uz || q.answers?.answer?.oz || [];
  const text = typeof qo === "string" ? qo : (qo?.[lang] || qo?.uz || qo?.oz || "");
  const photo = q.photo || q.image;
  return {
    id: idx + 1,
    text,
    image: photo ? `${imagePrefix}${photo}` : undefined,
    correctAnswer: q.answers?.status || 1,
    answers: answers.map((t, i) => ({ id: i + 1, text: t })),
  };
}

export function shuffleArray<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Savollar manbasini yuklaydi.
 *  - PREMIUM_SOURCE — serverdan faqat kerakli miqdordagi tasodifiy savol (avval butun 1210 savollik,
 *    ~3.5 MB fayl har testda yuklanardi);
 *  - boshqa qiymat — public/ dagi bepul fayl yo'li.
 */
export async function loadRawQuestions(source: string, count: number): Promise<RawQuestion[]> {
  if (source === PREMIUM_SOURCE) {
    return (await fetchSample("barcha", count, "practice")) as RawQuestion[];
  }
  const res = await fetch(source);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return extractRawArray(await res.json());
}

/** Yuklaydi, (kerak bo'lsa) aralashtiradi, kesadi va normallashtiradi. */
export async function loadQuestions(
  sources: string[],
  count: number,
  opts: { randomize: boolean; lang: QuestionLang; imagePrefix: string },
): Promise<NormalizedQuestion[]> {
  const arrays = await Promise.all(sources.map((s) => loadRawQuestions(s, count)));
  const all = arrays.flat();
  const picked = (opts.randomize ? shuffleArray(all) : all).slice(0, count);
  return picked.map((q, i) => normalizeQuestion(q, i, opts.lang, opts.imagePrefix));
}
