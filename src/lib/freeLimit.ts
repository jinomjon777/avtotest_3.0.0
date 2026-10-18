// Bepul foydalanuvchilar uchun kunlik limit (server: claim_free_session).
// Premium — cheksiz; bepul — har turdan kuniga 1 marta. Limit sessiya boshlanganda olinadi.
import { supabase } from "@/integrations/supabase/client";
import { isSetupMissing } from "@/hooks/useLearning";

export type FreeKind = "practice" | "topic" | "mistakes" | "exam";
export type ClaimResult = "ok" | "ok_free" | "limit" | "error";

/**
 * @param clientPremium  useAccessState().isPremium — faqat server funksiyasi hali bazada
 *                       bo'lmagan holatda ishlatiladi (premium ruxsat, bepul — limit).
 */
export async function claimFreeSession(kind: FreeKind, clientPremium: boolean): Promise<ClaimResult> {
  try {
    const { data, error } = await (supabase as any).rpc("claim_free_session", { p_kind: kind });
    if (error) {
      if (isSetupMissing(error)) return clientPremium ? "ok" : "limit";
      return "error";
    }
    if (data?.ok) return data.premium ? "ok" : "ok_free";
    if (data?.error === "daily_limit") return "limit";
    return "error";
  } catch {
    return "error";
  }
}
