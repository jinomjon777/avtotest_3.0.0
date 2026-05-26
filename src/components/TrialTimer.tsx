import { useTrialStatus, formatTimeRemaining } from '@/hooks/useTrialStatus';
import { Clock } from 'lucide-react';

export const TrialTimer = () => {
  const { isTrialActive, timeRemaining, isPro } = useTrialStatus();

  if (!isTrialActive || isPro) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/30 rounded-md">
      <Clock className="w-3.5 h-3.5 text-red-600" />
      <span className="text-xs font-semibold text-red-600">
        {formatTimeRemaining(timeRemaining)}
      </span>
    </div>
  );
};
