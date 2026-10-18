import { cn } from "@/lib/utils";
import { Tone, toneBar } from "@/lib/learnTheme";

interface MeterBarProps {
  value: number | null | undefined;
  tone: Tone;
  className?: string;
  height?: "sm" | "md";
}

/** Gorizontal progress. Rang `tone` bo'yicha; gradientsiz. */
export function MeterBar({ value, tone, className, height = "md" }: MeterBarProps) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("w-full rounded-full bg-muted overflow-hidden", height === "sm" ? "h-1.5" : "h-2", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-300", toneBar[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
