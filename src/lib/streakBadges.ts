// Seriya nishonlari: eng uzun seriya bo'yicha mijozda hisoblanadi (DB o'zgarmaydi).
export const STREAK_BADGES = [3, 7, 14, 30, 60, 100] as const;

export function earnedBadges(longest: number): number[] {
  return STREAK_BADGES.filter((b) => longest >= b);
}

/** Keyingi nishongacha qolgan kunlar (joriy seriya bo'yicha); hammasi olingan bo'lsa null. */
export function daysToNextBadge(current: number): number | null {
  const next = STREAK_BADGES.find((b) => b > current);
  return next == null ? null : next - current;
}

/** YYYY-MM-DD -> hafta kuni (0=yakshanba), vaqt zonasiga bog'liq emas. */
export function weekdayOf(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
