import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import type { AnswerPayload } from '@/lib/answerTracking';
import type { Json } from '@/integrations/supabase/types';

interface VariantResult {
  variant: number;
  bestScore: number;
  totalQuestions: number;
}

export const useTestResults = () => {
  const { user } = useAuth();
  const [variantResults, setVariantResults] = useState<Record<number, VariantResult>>({});
  const [loading, setLoading] = useState(true);

  const fetchVariantResults = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('variant, correct_answers, total_questions')
        .eq('user_id', user.id)
        .order('correct_answers', { ascending: false });

      if (error) throw error;

      const results: Record<number, VariantResult> = {};
      data?.forEach((result) => {
        if (!results[result.variant] || results[result.variant].bestScore < result.correct_answers) {
          results[result.variant] = {
            variant: result.variant,
            bestScore: result.correct_answers,
            totalQuestions: result.total_questions,
          };
        }
      });
      setVariantResults(results);
    } catch (err) {
      console.error('Error fetching variant results:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchVariantResults();
    } else {
      setLoading(false);
    }
  }, [user, fetchVariantResults]);

  /**
   * Natijani serverdagi submit_test RPC orqali saqlaydi (javoblar bilan birga).
   * test_results jadvaliga to'g'ridan-to'g'ri yozish bazada yopilgan — boshqa yo'l yo'q.
   */
  const saveTestResult = async (
    variant: number,
    correctAnswers: number,
    totalQuestions: number,
    timeTakenSeconds: number,
    sessionId: string | null = null,
    _isPremiumSession: boolean = false,
    answers: AnswerPayload[] = []
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    const submit = (sid: string | null) => supabase.rpc('submit_test', {
      p_session_id:   sid as string,
      p_variant:      variant,
      p_correct:      correctAnswers,
      p_total:        totalQuestions,
      p_time_seconds: Math.max(0, Math.round(timeTakenSeconds)),
      p_answers:      answers as unknown as Json,
    });

    try {
      let { data, error } = await submit(sessionId);
      const res = data as { ok?: boolean; error?: string } | null;
      // Eskirgan sessiya (localStorage'dan): natijani sessiyasiz saqlaymiz
      if (!error && res?.ok === false && sessionId && (res.error === 'session_not_found' || res.error === 'session_already_completed')) {
        ({ data, error } = await submit(null));
      }
      if (error) {
        console.error('submit_test error:', error.message);
        return { success: false, error: error.message };
      }
      const final = data as { ok?: boolean; error?: string } | null;
      if (final?.ok === false) {
        console.error('submit_test rejected:', final.error);
        return { success: false, error: final.error };
      }
      await fetchVariantResults();
      return { success: true };
    } catch (err) {
      console.error('Save test result error:', err);
      return { success: false, error: 'Failed to save result' };
    }
  };

  const getVariantStatus = (variant: number) => {
    const result = variantResults[variant];
    if (!result) return 'default';
    return (result.bestScore / result.totalQuestions) * 100 >= 90 ? 'success' : 'failed';
  };

  return { saveTestResult, variantResults, getVariantStatus, loading };
};
