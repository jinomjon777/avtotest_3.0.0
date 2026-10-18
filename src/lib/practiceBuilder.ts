// Mashq to'plamini tanlash algoritmi.
//   mistakes — hal qilinmagan xatolar (eng ko'p xato qilinganlari oldin)
//   topic    — tanlangan mavzu: avval shu mavzudagi xatolar, keyin hali ko'rilmagan savollar, keyin qolganlari
//   today    — bugungi mashq: xatolardan ~8 ta + eng zaif mavzudan ko'rilmagan savollar
// Savol matnlari statik JSON'dan olinadi (questionLookup.ts); foydalanuvchi tarixi serverdan.
import { fetchAnsweredKeys, fetchMistakes, fetchWeakTopicsNow, MistakeItem } from "@/hooks/useLearning";
import { loadAllPool, loadTopicPool, QLang, resolveQuestions, ResolvedQuestion, shuffle } from "./questionLookup";

export type PracticeMode = "mistakes" | "topic" | "today";
export const PRACTICE_SIZE = 20;

async function unresolvedMistakes(): Promise<MistakeItem[]> {
  const { items } = await fetchMistakes(200, 0, true);
  // ko'p xato qilinganlari oldin, teng bo'lsa — yaqinda xato qilinganlari
  return [...items].sort(
    (a, b) => b.wrong_count - a.wrong_count || +new Date(b.last_wrong_at) - +new Date(a.last_wrong_at),
  );
}

function dedupe(list: ResolvedQuestion[]): ResolvedQuestion[] {
  const seen = new Set<string>();
  return list.filter((q) => (seen.has(q.key) ? false : (seen.add(q.key), true)));
}

async function fromMistakes(keys: string[], lang: QLang): Promise<ResolvedQuestion[]> {
  const map = await resolveQuestions(keys, lang);
  return keys.map((k) => map.get(k)).filter((q): q is ResolvedQuestion => !!q);
}

async function topicSet(topicId: string, lang: QLang, size: number, first?: string): Promise<ResolvedQuestion[]> {
  const [pool, mistakes, answered] = await Promise.all([
    loadTopicPool(topicId, lang),
    unresolvedMistakes().catch(() => [] as MistakeItem[]),
    fetchAnsweredKeys(topicId).catch(() => new Set<string>()),
  ]);
  const mistakeKeys = new Set(mistakes.filter((m) => m.topic_id === topicId).map((m) => m.question_key));
  const wrongFirst = pool.filter((q) => mistakeKeys.has(q.key));
  const unseen = pool.filter((q) => !mistakeKeys.has(q.key) && !answered.has(q.key));
  const rest = pool.filter((q) => !mistakeKeys.has(q.key) && answered.has(q.key));
  let out = dedupe([...shuffle(wrongFirst), ...shuffle(unseen), ...shuffle(rest)]).slice(0, size);
  if (first) {
    const f = pool.find((q) => q.key === first);
    if (f) out = dedupe([f, ...out]).slice(0, size);
  }
  return out;
}

export async function buildPractice(
  mode: PracticeMode,
  lang: QLang,
  opts: { topic?: string | null; first?: string | null; size?: number } = {},
): Promise<ResolvedQuestion[]> {
  const size = opts.size ?? PRACTICE_SIZE;

  if (mode === "topic" && opts.topic) {
    return topicSet(opts.topic, lang, size, opts.first ?? undefined);
  }

  if (mode === "mistakes") {
    const m = await unresolvedMistakes();
    let keys = m.map((x) => x.question_key);
    if (opts.first) keys = [opts.first, ...keys.filter((k) => k !== opts.first)];
    // bitta xatodan boshlanganda qisqa mashq (5 ta), umumiy rejimda to'liq to'plam
    const take = opts.first ? Math.min(5, size) : size;
    return dedupe(await fromMistakes(keys.slice(0, take * 2), lang)).slice(0, take);
  }

  // today
  const [mistakes, weak] = await Promise.all([
    unresolvedMistakes().catch(() => [] as MistakeItem[]),
    fetchWeakTopicsNow().catch(() => null),
  ]);
  const mistakePart = await fromMistakes(
    mistakes.slice(0, 16).map((x) => x.question_key),
    lang,
  );
  const picked = shuffle(mistakePart).slice(0, Math.min(8, size));

  const weakest = weak?.topics.find((t) => t.enough_data) ?? weak?.topics[0];
  let extra: ResolvedQuestion[] = [];
  if (weakest) extra = await topicSet(weakest.topic_id, lang, size, undefined);
  if (extra.length < size) extra = [...extra, ...shuffle(await loadAllPool(lang))];

  const have = new Set(picked.map((q) => q.key));
  const rest = extra.filter((q) => !have.has(q.key));
  return shuffle(dedupe([...picked, ...rest]).slice(0, size));
}
