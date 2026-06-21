import { supabase } from "@/integrations/supabase/client";

// Premium savollar banki (barcha.json) endi public/ papkasida emas —
// faqat shu Edge Function orqali, faqat server tomonida tasdiqlangan
// premium foydalanuvchiga beriladi (server vaqti bilan tekshiriladi).
export const PREMIUM_QUESTIONS_URL =
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-premium-questions`;

/**
 * Bepul savollar fayllari hali ham /public statik fayl — oddiy fetch.
 * Premium URL bo'lsa, joriy foydalanuvchi sessiyasining JWT'sini
 * Authorization header orqali qo'shib yuboramiz — edge function buni
 * server tomonida tekshiradi.
 */
export async function fetchQuestionSource(url: string): Promise<Response> {
  if (url === PREMIUM_QUESTIONS_URL) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Premium so'rovni autentifikatsiyasiz yuborish ma'nosiz —
      // edge function baribir 401 qaytaradi, lekin shart emas tekshirib o'tiramiz.
      throw new Error("not_authenticated");
    }
    return fetch(url, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
  }
  return fetch(url);
}