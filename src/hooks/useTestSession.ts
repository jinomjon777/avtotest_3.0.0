/**
 * useTestSession — manages test session access.
 * Uses profile-based access check (tariff_end_date / trial).
 */
import { useState, useCallback } from 'react';
import { useAccessState } from './useAccessState';

export interface TestSession {
  sessionId: string | null;
  accessType: string;
  isPremium: boolean;
  expiresAt: Date | null;
}

interface StartSessionParams {
  variant: number;
  questionSource: string;
  isPremium: boolean;
}

export const useTestSession = () => {
  const [session, setSession] = useState<TestSession | null>(null);
  const [starting, setStarting] = useState(false);
  const accessState = useAccessState();

  const startSession = useCallback(async (
    params: StartSessionParams
  ): Promise<{ ok: boolean; error?: string; session?: TestSession }> => {
    setStarting(true);
    try {
      if (params.isPremium) {
        if (!accessState.backendConfirmed || !accessState.isPremium) {
          return { ok: false, error: 'no_premium_access' };
        }
      }

      const sess: TestSession = {
        sessionId: null,
        accessType: params.isPremium ? 'pro' : 'free',
        isPremium: params.isPremium,
        expiresAt: accessState.expiresAt,
      };
      setSession(sess);
      return { ok: true, session: sess };
    } finally {
      setStarting(false);
    }
  }, [accessState.backendConfirmed, accessState.isPremium, accessState.expiresAt]);

  return { session, starting, startSession };
};
