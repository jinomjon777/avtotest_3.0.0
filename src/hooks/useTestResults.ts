import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';

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
   * Save test result via direct insert.
   * DB RLS enforces auth.uid() = user_id on insert.
   */
  const saveTestResult = async (
    variant: number,
    correctAnswers: number,
    totalQuestions: number,
    timeTakenSeconds: number,
    _sessionId: string | null = null,
    _isPremiumSession: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase.from('test_results').insert({
        user_id:            user.id,
        variant,
        correct_answers:    correctAnswers,
        total_questions:    totalQuestions,
        time_taken_seconds: timeTakenSeconds,
      });

      if (error) {
        console.error('Insert error:', error);
        return { success: false, error: error.message };
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
