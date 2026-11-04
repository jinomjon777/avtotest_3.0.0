// Premium video darslar: muddatli havola faqat get-video-url funksiyasidan.
import { callEdge, EdgeError } from "./edge";

const cache = new Map<string, { url: string; until: number }>();

export async function getVideoUrl(key: string): Promise<string> {
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.url;
  const r = await callEdge<{ url: string; expires_in: number }>("get-video-url", { key });
  // Muddati tugashidan 5 daqiqa oldin yangisini so'raymiz
  cache.set(key, { url: r.url, until: Date.now() + Math.max(60, r.expires_in - 300) * 1000 });
  return r.url;
}

export function videoErrorMessage(e: unknown): string {
  const code = e instanceof EdgeError ? e.code : "error";
  switch (code) {
    case "premium_required": return "Video darslar faqat Premium foydalanuvchilar uchun.";
    case "not_authenticated": return "Videoni ko'rish uchun tizimga kiring.";
    case "device_revoked": return "Bu qurilma hisobdan chiqarilgan. Qaytadan kiring.";
    case "not_configured": return "Video xizmati vaqtincha sozlanmoqda. Birozdan keyin urinib ko'ring.";
    default: return "Videoni yuklab bo'lmadi. Internetni tekshirib, qayta urinib ko'ring.";
  }
}
