/**
 * useAccessState — server-authoritative access state.
 *
 * XAVFSIZLIK O'ZGARISHI:
 * Endi to'g'ridan-to'g'ri Supabase jadvalini o'qish o'rniga
 * Edge Function'ga murojaat qilinadi. Barcha mantiq serverda.
 *
 * Eski: frontend → profiles jadval → tariff_days hisoblash (CLIENT SIDE ❌)
 * Yangi: frontend → Edge Function → server hisoblaydi → javob (SERVER SIDE ✅)
 */
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

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-access`;

// Cache: server'ga har 60 soniyada so'rov
const CACHE_TTL_MS = 60_000;
let cache: { result: AccessInfo; ts: number } | null = null;

export const useAccessState = (): AccessInfo & { refresh: () => Promise<void> } => {
  const { user, session, isLoading: authLoading } = useAuth();
  const [info, setInfo] = useState<AccessInfo>({
    state: 'guest',
    isPremium: false,
    expiresAt: null,
    loading: true,
    backendConfirmed: false,
  });

  const fetchAccess = useCallback(async () => {
    if (authLoading) return;

    // Guest user
    if (!user || !session) {
      cache = null;
      setInfo({ state: 'guest', isPremium: false, expiresAt: null, loading: false, backendConfirmed: true });
      return;
    }

    // Cache hali yangi bo'lsa qayta so'rov yuborma
    if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
      setInfo(cache.result);
      return;
    }

    try {
      // ── Edge Function'ga JWT bilan so'rov ───────────────────────────────
      const response = await fetch(EDGE_FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey':        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Edge Function error: ${response.status}`);
      }

      const data = await response.json();

      const result: AccessInfo = {
        state:            data.state as AccessState,
        isPremium:        data.isPremium ?? false,
        expiresAt:        data.expiresAt ? new Date(data.expiresAt) : null,
        loading:          false,
        backendConfirmed: true,
      };

      // Cache'ga saqla
      cache = { result, ts: Date.now() };
      setInfo(result);

    } catch (err) {
      console.error('useAccessState: Edge Function xatosi, profile fallback:', err);

      // ── FALLBACK: Edge Function ishlamasa profile'dan o'qi ──────────────
      // Bu faqat server muammosi bo'lganda ishlaydi.
      // MUHIM: backendConfirmed=false — useProAccess bu holda kirishga ruxsat bermaydi.
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tariff_days, tariff_end_date, is_trial_used, trial_end_date, created_at')
          .eq('id', user.id)
          .single();

        if (!profile) {
          setInfo({ state: 'free_logged_in', isPremium: false, expiresAt: null, loading: false, backendConfirmed: false });
          return;
        }

        const now = Date.now();
        const tariffDays = Number(profile.tariff_days ?? 0);

        if (tariffDays > 0 && profile.tariff_end_date) {
          const end = new Date(profile.tariff_end_date).getTime();
          if (end > now) {
            setInfo({ state: 'active_pro', isPremium: true, expiresAt: new Date(end), loading: false, backendConfirmed: false });
            return;
          }
        }

        if (profile.is_trial_used && profile.trial_end_date) {
          const trialEnd = new Date(profile.trial_end_date).getTime();
          if (trialEnd > now) {
            setInfo({ state: 'active_trial', isPremium: true, expiresAt: new Date(trialEnd), loading: false, backendConfirmed: false });
            return;
          }
        }

        setInfo({ state: 'free_logged_in', isPremium: false, expiresAt: null, loading: false, backendConfirmed: false });
      } catch {
        setInfo({ state: 'free_logged_in', isPremium: false, expiresAt: null, loading: false, backendConfirmed: false });
      }
    }
  }, [user, session, authLoading]);

  useEffect(() => {
    fetchAccess();
    const interval = setInterval(fetchAccess, CACHE_TTL_MS);
    return () => clearInterval(interval);
  }, [fetchAccess]);

  return { ...info, refresh: fetchAccess };
};
