import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tone, toneText } from "@/lib/learnTheme";

interface ProgressRingProps {
  /** 0–100; null/undefined — ma'lumot yo'q (bo'sh halqa) */
  value: number | null | undefined;
  tone: Tone;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  className?: string;
  label?: string;
}

/** Doiraviy ko'rsatkich. Rang `tone` orqali (currentColor), animatsiyasiz. */
export function ProgressRing({ value, tone, size = 144, stroke = 12, children, className, label }: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? (value == null ? "—" : `${Math.round(pct)}%`)}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className={cn("stroke-current", toneText[tone])}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
