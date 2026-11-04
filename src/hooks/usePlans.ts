// Tarif narxlari — yagona manba: bazadagi public.plans (admin "Sozlamalar → Tariflar"da o'zgartiradi).
// Server javob bermasa, quyidagi zaxira qiymatlar ko'rsatiladi.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlanInfo { id: string; days: number; amount: number; label: string }

export const FALLBACK_PLANS: PlanInfo[] = [
  { id: "plan_7", days: 7, amount: 15000, label: "Haftalik" },
  { id: "plan_30", days: 30, amount: 33000, label: "Oylik" },
  { id: "plan_90", days: 90, amount: 83000, label: "3 Oylik" },
];

export function usePlans(): PlanInfo[] {
  const { data } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("id, days, amount, label").eq("is_active", true).order("sort");
      if (error) throw error;
      return (data ?? []) as PlanInfo[];
    },
    staleTime: 10 * 60_000,
    retry: 1,
  });
  return data && data.length ? data : FALLBACK_PLANS;
}

export function formatSom(n: number): string {
  return n.toLocaleString("ru-RU").replace(/\u00a0/g, " ");
}
