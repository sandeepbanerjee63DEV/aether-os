"use client";

import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "indigo" | "purple" | "emerald" | "blue" | "amber" | "rose";
  delta?: { value: string; positive: boolean };
  pulse?: boolean;
  ai?: boolean;
}

const TONE: Record<NonNullable<AnalyticsCardProps["tone"]>, { bg: string; ring: string; text: string }> = {
  indigo: { bg: "bg-indigo-50/70", ring: "ring-indigo-100", text: "text-indigo-600" },
  purple: { bg: "bg-purple-50/70", ring: "ring-purple-100", text: "text-purple-600" },
  emerald: { bg: "bg-emerald-50/70", ring: "ring-emerald-100", text: "text-emerald-600" },
  blue: { bg: "bg-blue-50/70", ring: "ring-blue-100", text: "text-blue-600" },
  amber: { bg: "bg-amber-50/70", ring: "ring-amber-100", text: "text-amber-600" },
  rose: { bg: "bg-rose-50/70", ring: "ring-rose-100", text: "text-rose-600" },
};

export function AnalyticsCard({ label, value, hint, icon: Icon, tone = "indigo", delta, pulse, ai }: AnalyticsCardProps) {
  const t = TONE[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-100/80 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover",
        ai && "ai-glow"
      )}
    >
      {ai && (
        <span className="data-flow-line absolute left-0 top-0 h-[1px] w-full opacity-60" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1", t.bg, t.ring)}>
          <Icon className={cn("h-5 w-5", t.text)} />
        </div>

        <div className="flex flex-col items-end gap-1">
          {pulse && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 live-pulse" />
              LIVE
            </span>
          )}
          {delta && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                delta.positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              )}
            >
              {delta.positive ? "↑" : "↓"} {delta.value}
            </span>
          )}
        </div>
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </motion.div>
  );
}
