// Javoblarni serverga (submit_test) yuborish uchun yordamchilar.
// Savol kaliti: src/lib/questionKey.js (ehtiyot bo'ling: uni o'zgartirsangiz barcha statistika buziladi).
import { questionKey, questionKeyFromTask } from "./questionKey.js";

export interface AnswerPayload {
  question_key: string;
  topic_id: string | null;
  selected_option: number | null;
  is_correct: boolean;
}

interface TopicMap {
  keys: Record<string, string>;
  aliases: Record<string, string>;
}

/** Xom (JSON'dagi) savol obyektidan barqaror kalit. Yangi va eski bepul baza formatlari. */
export function rawQuestionKey(q: any): string | undefined {
  try {
    if (q?.content?.uz_lat) return questionKeyFromTask(q) ?? undefined;
    if (Array.isArray(q?.choises)) {
      return questionKey(q.question ?? "", q.choises.map((c: any) => c?.text ?? "")) ?? undefined;
    }
  } catch {
    /* kalit bo'lmasa ham test ishlayveradi */
  }
  return undefined;
}

let mapPromise: Promise<TopicMap | null> | null = null;
/** topic_map.json bir marta yuklanadi va keshlanadi. Xato bo'lsa null (mavzu 'other' bo'ladi). */
export function loadTopicMap(): Promise<TopicMap | null> {
  if (!mapPromise) {
    mapPromise = fetch("/data/topic_map.json")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return mapPromise;
}

interface QLike {
  qkey?: string;
  answers: { id: number; text: string }[];
}

/**
 * Javoblar ro'yxatini tayyorlaydi. Kalit topilmagan savol bo'lsa va ball mos kelmasa,
 * server "score_mismatch" qaytarmasligi uchun bo'sh ro'yxat qaytaradi (natija baribir saqlanadi).
 */
export async function buildAnswerPayload(
  questions: QLike[],
  selectedAnswers: Record<number, number>,
  correctAnswers: Record<number, boolean>,
  expectedCorrect: number,
): Promise<AnswerPayload[]> {
  const map = await loadTopicMap();
  const out: AnswerPayload[] = [];
  for (const [numStr, answerId] of Object.entries(selectedAnswers)) {
    const q = questions[Number(numStr) - 1];
    if (!q?.qkey) continue;
    const canon = map?.aliases?.[q.qkey] ?? q.qkey;
    const idx = q.answers.findIndex((a) => a.id === answerId);
    out.push({
      question_key: canon,
      topic_id: map?.keys?.[canon] ?? "other",
      selected_option: idx >= 0 && idx <= 9 ? idx : null,
      is_correct: !!correctAnswers[Number(numStr)],
    });
  }
  const okCount = out.filter((a) => a.is_correct).length;
  if (okCount !== expectedCorrect) return [];
  return out;
}
