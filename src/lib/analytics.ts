import { supabase } from "@/integrations/supabase/client";

export type TrackedEvent = "test_start" | "exam_start" | "practice_start";

/**
 * Test boshlanishini yozadi (admin analitikasi uchun). Faqat tizimga kirgan foydalanuvchilar uchun;
 * xato bo'lsa jim o'tadi va hech qachon testni to'xtatmaydi.
 */
export function trackEvent(name: TrackedEvent): void {
  void (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      await (supabase as any).rpc("track_event", { p_name: name });
    } catch {
      /* analitika xatosi foydalanuvchiga ta'sir qilmasin */
    }
  })();
}
