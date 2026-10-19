import { useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { learnDict, LearnLang } from "@/locales/learn";

const MAP: Record<string, LearnLang> = { "uz-lat": "uz_lat", uz: "uz_cyr", ru: "ru" };

/** Kabinet / xatolar / zaif mavzular / mashq uchun alohida tarjima. {n} kabi o'rinbosarlar qo'llab-quvvatlanadi. */
export function useLearnT() {
  const { language } = useLanguage();
  const lang = MAP[language as string] ?? "uz_lat";
  return useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let s = learnDict[lang][key] ?? learnDict.uz_lat[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      return s;
    },
    [lang],
  );
}
