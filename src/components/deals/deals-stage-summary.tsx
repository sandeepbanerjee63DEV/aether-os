"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { STAGE_LABEL, type DealStage } from "@/lib/deals/stages";

interface AnalyticsResponse {
  totalPipeline: number;
  weightedPipeline: number;
  avgDealSize: number;
  winRate: number;
  openCount: number;
  wonCount: number;
  lostCount: number;
  byStage: { stage: DealStage; count: number; value: number }[];
}

const STAGE_THEME: Record<DealStage, { bar: string; chip: string }> = {
  QUALIFICATION: {
    bar: "from-purple-400 to-indigo-400",
    chip: "bg-purple-50 text-purple-700",
  },
  PROPOSAL: {
    bar: "from-blue-400 to-cyan-400",
    chip: "bg-blue-50 text-blue-700",
  },
  NEGOTIATION: {
    bar: "from-amber-400 to-orange-400",
    chip: "bg-amber-50 text-amber-700",
  },
  CLOSED_WON: {
    bar: "from-emerald-400 to-teal-400",
    chip: "bg-emerald-50 text-emerald-700",
  },
  CLOSED_LOST: {
    bar: "from-slate-300 to-slate-400",
    chip: "bg-slate-50 text-slate-500",
  },
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `$${value.toFixed(0)}`;
}

export function DealsStageSummary() {
  const { data, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: ["deal-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/deals/analytics");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  const maxValue = Math.max(...data.byStage.map((s) => s.value), 1);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
      {data.byStage.map((s, i) => {
        const theme = STAGE_THEME[s.stage];
        const pct = Math.max(8, Math.round((s.value / maxValue) * 100));
        return (
          <motion.div
            key={s.stage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-card"
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                  theme.chip
                )}
              >
                {STAGE_LABEL[s.stage]}
              </span>
              <span className="text-xs font-medium text-slate-400">{s.count}</span>
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {formatCurrency(s.value)}
            </p>
            <p className="text-[11px] text-slate-500">total value</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: i * 0.05 + 0.2, duration: 0.6 }}
                className={cn("h-full rounded-full bg-gradient-to-r", theme.bar)}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
