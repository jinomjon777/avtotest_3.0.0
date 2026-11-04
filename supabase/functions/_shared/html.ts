/** Telegram parse_mode=HTML uchun matnni xavfsiz qiladi (<, >, & belgilari xabarni buzmasligi uchun). */
export function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
