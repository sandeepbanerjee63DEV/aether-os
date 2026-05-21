"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Activity, Sparkles, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { DealsStageSummary } from "@/components/deals/deals-stage-summary";
import { DealsPipelineBoard } from "@/components/deals/deals-pipeline-board";
import { ActiveDealsList } from "@/components/deals/active-deals-list";
import { DealDetailsPanel } from "@/components/deals/deal-details-panel";
import { DealActivityTimeline } from "@/components/deals/deal-activity-timeline";
import { DealsForecastCard } from "@/components/deals/deals-forecast-card";
import { DealsWinRateCard } from "@/components/deals/deals-win-rate-card";
import { useRealtime } from "@/hooks/use-realtime";

interface AnalyticsResponse {
  totalPipeline: number;
  weightedPipeline: number;
  winRate: number;
  openCount: number;
  wonCount: number;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}

export default function DealsPage() {
  useRealtime("deals");

  const { data: analytics } = useQuery<AnalyticsResponse>({
    queryKey: ["deal-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/deals/analytics");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  return (
    <>
      <Navbar
        title="Deals Pipeline"
        subtitle="AI win prediction, drag-drop Kanban, and weighted revenue forecasting in real time."
        badge="REVENUE INTELLIGENCE"
        showAddDeal
      />

      <div className="flex-1 space-y-5 px-4 pb-28 lg:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100/60 bg-gradient-to-r from-indigo-50/40 via-white to-purple-50/30 px-4 py-2.5 glass-card"
        >
          <Badge variant="purple" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 live-pulse" />
            AI Deal Engine
          </Badge>
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            Pipeline value{" "}
            <strong className="text-slate-800">
              {formatCurrency(analytics?.totalPipeline ?? 0)}
            </strong>
          </span>
          <span className="hidden h-4 w-px bg-slate-200 sm:block" />
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            AI-weighted{" "}
            <strong className="text-emerald-700">
              {formatCurrency(analytics?.weightedPipeline ?? 0)}
            </strong>
          </span>
          <span className="hidden h-4 w-px bg-slate-200 sm:block" />
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
            {analytics?.openCount ?? 0} open · {analytics?.wonCount ?? 0} won ·{" "}
            {Math.round(analytics?.winRate ?? 0)}% win rate
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <DealsStageSummary />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DealsPipelineBoard />
        </motion.div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <motion.div
            className="xl:col-span-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <ActiveDealsList />
          </motion.div>
          <motion.div
            className="xl:col-span-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DealDetailsPanel />
          </motion.div>
          <motion.div
            className="xl:col-span-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <DealActivityTimeline />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <DealsForecastCard />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <DealsWinRateCard />
          </motion.div>
        </div>
      </div>
    </>
  );
}
