import topics from "@/data/topics.json";

type L = "uz_lat" | "uz_cyr" | "ru";
const byId = new Map<string, Record<L, string>>((topics as { id: string; name: Record<L, string> }[]).map((t) => [String(t.id), t.name]));

/** Mavzu nomi. 'other' yoki noma'lum id uchun — "Boshqa". */
export function topicName(id: string | null | undefined, lang: L): string {
  if (!id || id === "other") return { uz_lat: "Boshqa", uz_cyr: "Бошқа", ru: "Другое" }[lang];
  return byId.get(String(id))?.[lang] ?? String(id);
}
