"use client";

import { motion } from "framer-motion";
import { Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Signal {
  label: string;
  value: number;
  tone: "good" | "warn" | "bad";
}

export function WorkspaceHealthCard({ score, signals }: { score: number; signals: Signal[] }) {
  const tone = score >= 80 ? "emerald" : score >= 60 ? "amber" : "rose";
  const ring = tone === "emerald" ? "ring-emerald-100" : tone === "amber" ? "ring-amber-100" : "ring-rose-100";
  const text = tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "text-rose-600";
  const gradient =
    tone === "emerald"
      ? "from-emerald-400 to-emerald-500"
      : tone === "amber"
        ? "from-amber-400 to-amber-500"
        : "from-rose-400 to-rose-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-100/80 bg-white p-5 shadow-card ring-1 ai-glow",
        ring
      )}
    >
      <span className="data-flow-line absolute left-0 top-0 h-[1px] w-full opacity-60" />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br shadow-inner", gradient)}>
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Workspace Health Score
            </p>
            <p className="text-xs text-slate-500">Composite operational signal</p>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-indigo-50/70 px-2 py-1 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-100">
          <Sparkles className="h-3 w-3" />
          AI
        </span>
      </div>

      <div className="mt-5 flex items-end gap-4">
        <p className={cn("text-5xl font-bold tracking-tight tabular-nums", text)}>{score}</p>
        <p className="mb-2 text-xs text-slate-500">/ 100</p>
      </div>

      <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-[width] duration-700", gradient)}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-5">
        {signals.map((s) => {
          const toneClass =
            s.tone === "good" ? "text-emerald-600" : s.tone === "warn" ? "text-amber-600" : "text-rose-600";
          return (
            <div key={s.label} className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {s.label}
              </p>
              <p className={cn("mt-0.5 text-lg font-bold tabular-nums", toneClass)}>
                {s.value}
                {s.label.toLowerCase().includes("ratio") || s.label.toLowerCase().includes("workload") || s.label.toLowerCase().includes("coverage") ? "%" : ""}
              </p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
