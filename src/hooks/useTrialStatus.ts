/**
 * useTrialStatus — thin wrapper around useAccessState for backward compatibility.
 *
 * New code should use useAccessState directly.
 * This shim keeps existing consumers working without changes.
 */
import { useAccessState } from './useAccessState';

interface TrialStatus {
  isTrialActive: boolean;
  isTrialUsed: boolean;
  timeRemaining: number;
  isPro: boolean;
  loading: boolean;
}

export const useTrialStatus = (): TrialStatus => {
  const { state, expiresAt, loading } = useAccessState();

  const isTrialActive = state === 'active_trial';
  const isTrialUsed   = state === 'active_trial' || state === 'expired_trial';
  const isPro         = state === 'active_pro';

  // Compute remaining seconds from server-provided expiry
  const timeRemaining = isTrialActive && expiresAt
    ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
    : 0;

  return { isTrialActive, isTrialUsed, timeRemaining, isPro, loading };
};

export const formatTimeRemaining = (seconds: number): string => {
  const hours   = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};
