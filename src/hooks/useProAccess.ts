import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessState } from './useAccessState';
import { toast } from 'sonner';

/**
 * Route guard backed by get_user_access_state() RPC.
 *
 * Redirect rules:
 * - loading=true  → wait, no redirect
 * - backendConfirmed=false → backend unavailable; show error, do NOT grant OR deny
 *   premium access; stay on current page (user sees loading/error)
 * - state=active_pro / active_trial → allow
 * - anything else → redirect to /pro
 */
export const useProAccess = (redirectPath: string = '/pro', allowTrial: boolean = true) => {
  const { user, isLoading: authLoading } = useAuth();
  const { state, loading: accessLoading, backendConfirmed } = useAccessState();
  const navigate = useNavigate();

  const loading = authLoading || accessLoading;

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/auth', { state: { returnTo: window.location.pathname } });
      return;
    }

    // Backend RPC unavailable — fail safely: do not grant AND do not falsely deny
    // The page will show a "backend unavailable" state via hasAccess=false + loading=false
    if (!backendConfirmed) return;

    const allowed =
      state === 'active_pro' ||
      (allowTrial && state === 'active_trial');

    if (!allowed) {
      if (state === 'expired_trial' || state === 'expired_pro') {
        toast.error('Muddati tugagan. PREMIUM obunani yangilang.');
      } else {
        toast.error("Bu bo'limga kirish uchun PREMIUM obuna talab qilinadi.");
      }
      navigate(redirectPath);
    }
  }, [user, state, loading, backendConfirmed, navigate, redirectPath, allowTrial]);

  return {
    hasAccess: !loading && backendConfirmed && !!user &&
      (state === 'active_pro' || (allowTrial && state === 'active_trial')),
    loading: loading || (!!user && !backendConfirmed),
  };
};
