// Yagona rang qoidasi (dizayn tizimi): foiz -> ton.
// Barcha o'quv sahifalari (kabinet, xatolar, zaif mavzular) shu funksiyadan foydalanadi,
// shunda "yaxshi / o'rtacha / zaif" har joyda bir xil rangda ko'rinadi.
export type Tone = "success" | "warning" | "destructive" | "muted";

/** >=85% yaxshi, 70–84% o'rtacha, <70% zaif. Ma'lumot yo'q -> muted. */
export function toneFor(percent: number | null | undefined): Tone {
  if (percent == null || Number.isNaN(percent)) return "muted";
  if (percent >= 85) return "success";
  if (percent >= 70) return "warning";
  return "destructive";
}

export const toneText: Record<Tone, string> = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
};

export const toneBar: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  muted: "bg-muted-foreground/40",
};

export const toneSoft: Record<Tone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

/** Mashq sessiyalari test_results'ga shu "variant" raqami bilan yoziladi (1–63 variantlar bilan aralashmaydi). */
export const PRACTICE_VARIANT = 99;

/** Test vaqtini mm:ss ko'rinishida. */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds < 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
