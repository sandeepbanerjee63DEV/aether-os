"use client";

import { cn } from "@/lib/utils";

interface WorkloadIndicatorProps {
  value: number;
  ceiling?: number;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function WorkloadIndicator({
  value,
  ceiling = 85,
  size = "md",
  showLabel = false,
  className,
}: WorkloadIndicatorProps) {
  const pct = Math.max(0, Math.min(100, value));
  const tone: "good" | "warn" | "bad" = pct >= 92 ? "bad" : pct >= ceiling ? "warn" : "good";

  const toneClass = {
    good: "from-emerald-400 to-emerald-500",
    warn: "from-amber-400 to-amber-500",
    bad: "from-rose-400 to-rose-500",
  }[tone];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100",
          size === "sm" ? "h-1" : "h-1.5"
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-[width] duration-500",
            toneClass
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            "shrink-0 font-semibold tabular-nums",
            size === "sm" ? "text-[10px]" : "text-xs",
            tone === "good" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : "text-rose-600"
          )}
        >
          {pct}%
        </span>
      )}
    </div>
  );
}
