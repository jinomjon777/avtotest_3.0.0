import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AccessState =
  | 'guest'
  | 'free_logged_in'
  | 'active_trial'
  | 'expired_trial'
  | 'active_pro'
  | 'expired_pro';

export interface AccessInfo {
  state: AccessState;
  isPremium: boolean;
  expiresAt: Date | null;
  loading: boolean;
  backendConfirmed: boolean;
}

const CACHE_TTL_MS = 60_000;
let cache: { result: AccessInfo; ts: number; uid: string } | null = null;

export const useAccessState = (): AccessInfo & { refresh: () => Promise<void> } => {
  const { user, isLoading: authLoading } = useAuth();
  const [info, setInfo] = useState<AccessInfo>({
    state: 'guest',
    isPremium: false,
    expiresAt: null,
    loading: true,
    backendConfirmed: false,
  });

  const fetchAccess = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      cache = null;
      setInfo({ state: 'guest', isPremium: false, expiresAt: null, loading: false, backendConfirmed: true });
      return;
    }

    // Cache hali yangi bo'lsa qayta so'rov yuborma
    if (cache && cache.uid === user.id && Date.now() - cache.ts < CACHE_TTL_MS) {
      setInfo(cache.result);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('tariff_days, tariff_end_date, is_trial_used, trial_end_date')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        const result: AccessInfo = { state: 'free_logged_in', isPremium: false, expiresAt: null, loading: false, backendConfirmed: true };
        cache = { result, ts: Date.now(), uid: user.id };
        setInfo(result);
        return;
      }

      const now = Date.now();
      const tariffDays = Number(profile.tariff_days ?? 0);
      let result: AccessInfo;

      if (tariffDays > 0 && profile.tariff_end_date) {
        const end = new Date(profile.tariff_end_date).getTime();
        if (end > now) {
          result = { state: 'active_pro', isPremium: true, expiresAt: new Date(end), loading: false, backendConfirmed: true };
        } else {
          result = { state: 'expired_pro', isPremium: false, expiresAt: new Date(end), loading: false, backendConfirmed: true };
        }
      } else if (profile.is_trial_used && profile.trial_end_date) {
        const trialEnd = new Date(profile.trial_end_date).getTime();
        if (trialEnd > now) {
          result = { state: 'active_trial', isPremium: true, expiresAt: new Date(trialEnd), loading: false, backendConfirmed: true };
        } else {
          result = { state: 'expired_trial', isPremium: false, expiresAt: new Date(trialEnd), loading: false, backendConfirmed: true };
        }
      } else {
        result = { state: 'free_logged_in', isPremium: false, expiresAt: null, loading: false, backendConfirmed: true };
      }

      cache = { result, ts: Date.now(), uid: user.id };
      setInfo(result);

    } catch {
      const result: AccessInfo = { state: 'free_logged_in', isPremium: false, expiresAt: null, loading: false, backendConfirmed: true };
      setInfo(result);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchAccess();
    const interval = setInterval(fetchAccess, CACHE_TTL_MS);
    return () => clearInterval(interval);
  }, [fetchAccess]);

  return { ...info, refresh: fetchAccess };
};
