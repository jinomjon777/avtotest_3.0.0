// O'quv ma'lumotlari: serverdagi RPC'lar (get_dashboard_stats, get_my_mistakes, get_weak_topics, ...)
// uchun React Query o'ramalari. Migratsiya qo'llanmagan bo'lsa, `isSetupMissing(error)` true bo'ladi.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await (supabase as any).rpc(name, args ?? {});
  if (error) throw error;
  if (data && data.ok === false) throw new Error(data.error || "rpc_failed");
  return data as T;
}

/** RPC bazada yo'q (migratsiya qo'llanmagan) bo'lsa true. */
export function isSetupMissing(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  return !!e && (e.code === "PGRST202" || e.code === "42883" || /Could not find the function|does not exist/i.test(e.message || ""));
}

export interface LastResult {
  id: string;
  variant: number;
  correct: number;
  total: number;
  percent: number;
  time_seconds: number | null;
  completed_at: string;
}

export interface DashboardStats {
  total_tests: number;
  avg_percent: number | null;
  best_percent: number | null;
  avg_time_seconds: number | null;
  answered_total: number;
  correct_total: number;
  wrong_total: number;
  accuracy_percent: number | null;
  readiness_percent: number | null;
  current_streak: number;
  longest_streak: number;
  today_done: boolean;
  today_answers: number;
  daily_goal: number;
  exam_date: string | null;
  days_to_exam: number | null;
  saved_count: number;
  last_results: LastResult[];
}

export interface MistakeItem {
  question_key: string;
  topic_id: string | null;
  attempts: number;
  wrong_count: number;
  last_wrong_at: string;
  last_wrong_option: number | null;
  resolved: boolean;
}

export interface WeakTopic {
  topic_id: string;
  answered: number;
  correct: number;
  accuracy_percent: number;
  enough_data: boolean;
}

export interface WeakTopicsResult {
  topics: WeakTopic[];
  classified_answers: number;
  unclassified_answers: number;
  coverage_percent: number | null;
}

export interface ActivityDay {
  day: string; // YYYY-MM-DD (Asia/Tashkent)
  tests: number;
  answers: number;
}

const STALE = 30_000;

export function useDashboardStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["learn", "dashboard", user?.id],
    queryFn: () => rpc<DashboardStats>("get_dashboard_stats"),
    enabled: !!user,
    staleTime: STALE,
    retry: false,
  });
}

export function useRecentActivity(days = 7) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["learn", "activity", user?.id, days],
    queryFn: async () => (await rpc<{ days: ActivityDay[] }>("get_recent_activity", { p_days: days })).days,
    enabled: !!user,
    staleTime: STALE,
    retry: false,
  });
}

export function useWeakTopics() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["learn", "weak", user?.id],
    queryFn: () => rpc<WeakTopicsResult>("get_weak_topics", { p_days: 120, p_min_answers: 5 }),
    enabled: !!user,
    staleTime: STALE,
    retry: false,
  });
}

export function fetchMistakes(limit: number, offset: number, onlyUnresolved: boolean) {
  return rpc<{ total: number; items: MistakeItem[] }>("get_my_mistakes", {
    p_limit: limit,
    p_offset: offset,
    p_only_unresolved: onlyUnresolved,
  });
}

export function useMistakeCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["learn", "mistake-count", user?.id],
    queryFn: async () => (await fetchMistakes(1, 0, true)).total,
    enabled: !!user,
    staleTime: STALE,
    retry: false,
  });
}

/** Saqlangan savollar kalitlari (RLS: faqat o'zinikini ko'radi). */
export function useSavedKeys() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["learn", "saved", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("saved_questions")
        .select("question_key, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as { question_key: string; created_at: string }[];
    },
    enabled: !!user,
    staleTime: STALE,
    retry: false,
  });
}

export function useToggleSaved() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return async (key: string): Promise<{ saved: boolean; count: number }> => {
    const r = await rpc<{ saved: boolean; count: number }>("toggle_saved_question", { p_key: key });
    qc.invalidateQueries({ queryKey: ["learn", "saved", user?.id] });
    qc.invalidateQueries({ queryKey: ["learn", "dashboard", user?.id] });
    return r;
  };
}

/** Imtihon sanasi va kunlik maqsadni saqlash (profiles; tarif maydonlariga tegmaydi). */
export function useSaveGoals() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return async (values: { exam_date: string | null; daily_goal: number }) => {
    if (!user) throw new Error("not_authenticated");
    const { error } = await (supabase as any).from("profiles").update(values).eq("id", user.id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["learn", "dashboard", user.id] });
  };
}

/** Berilgan mavzudagi savollardan foydalanuvchi ilgari javob bergan kalitlar. */
export async function fetchAnsweredKeys(topicId: string): Promise<Set<string>> {
  const { data, error } = await (supabase as any)
    .from("user_answers")
    .select("question_key")
    .eq("topic_id", topicId)
    .limit(5000);
  if (error) throw error;
  return new Set((data ?? []).map((r: { question_key: string }) => r.question_key));
}

export async function fetchWeakTopicsNow() {
  return rpc<WeakTopicsResult>("get_weak_topics", { p_days: 120, p_min_answers: 5 });
}
