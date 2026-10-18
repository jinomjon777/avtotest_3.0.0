import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import type { AnswerPayload } from '@/lib/answerTracking';

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
   * RPC hali bazada yo'q bo'lsa (migratsiya qo'llanmagan), eski usulga qaytadi.
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

    try {
      const { data, error } = await (supabase as any).rpc('submit_test', {
        p_session_id:   sessionId,
        p_variant:      variant,
        p_correct:      correctAnswers,
        p_total:        totalQuestions,
        p_time_seconds: timeTakenSeconds,
        p_answers:      answers,
      });

      if (error) {
        const missingRpc = error.code === 'PGRST202' || error.code === '42883' || /submit_test/.test(error.message || '');
        if (!missingRpc) {
          console.error('submit_test error:', error);
          return { success: false, error: error.message };
        }
        // Zaxira yo'l: migratsiya qo'llanguncha eski to'g'ridan-to'g'ri insert
        const { error: insErr } = await supabase.from('test_results').insert({
          user_id:            user.id,
          variant,
          correct_answers:    correctAnswers,
          total_questions:    totalQuestions,
          time_taken_seconds: timeTakenSeconds,
        });
        if (insErr) return { success: false, error: insErr.message };
      } else if (data && data.ok === false && sessionId && (data.error === 'session_not_found' || data.error === 'session_already_completed')) {
        // Eskirgan sessiya (localStorage'dan): natijani sessiyasiz saqlaymiz
        const retry = await (supabase as any).rpc('submit_test', {
          p_session_id: null, p_variant: variant, p_correct: correctAnswers,
          p_total: totalQuestions, p_time_seconds: timeTakenSeconds, p_answers: answers,
        });
        if (retry.error || retry.data?.ok === false) {
          return { success: false, error: retry.error?.message || retry.data?.error };
        }
      } else if (data && data.ok === false) {
        console.error('submit_test rejected:', data.error);
        return { success: false, error: data.error };
      }

      await fetchVariantResults();
      return { success: true };
    } catch (err: any) {
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
