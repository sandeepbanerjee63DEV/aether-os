"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Activity, Sparkles, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { OverviewKpis } from "@/components/team/overview/overview-kpis";
import { WorkspaceHealthCard } from "@/components/team/overview/workspace-health-card";
import { DepartmentDistribution } from "@/components/team/overview/department-distribution";
import { GrowthChart } from "@/components/team/overview/growth-chart";
import { AiRecommendationsPanel } from "@/components/team/overview/ai-recommendations-panel";
import { LiveActivityFeed } from "@/components/team/overview/live-activity-feed";
import type { Recommendation } from "@/components/team/shared/ai-recommendation-card";
import type { GrowthPoint } from "@/components/team/overview/growth-chart";
import { useRealtime } from "@/hooks/use-realtime";

interface OverviewResponse {
  kpis: {
    totalMembers: number;
    activeMembers: number;
    pendingInvites: number;
    awayMembers: number;
    suspendedMembers: number;
    inactiveMembers: number;
    departmentCount: number;
    avgWorkload: number;
    avgOperationalScore: number;
  };
  health: { score: number; signals: { label: string; value: number; tone: "good" | "warn" | "bad" }[] };
  departments: {
    id: string;
    name: string;
    color: string;
    icon: string;
    memberCount: number;
    activeCount: number;
    capacity: number;
    avgWorkload: number;
    healthScore: number;
    leadId: string | null;
  }[];
  growth: GrowthPoint[];
  recommendations: Recommendation[];
}

export default function TeamOverviewPage() {
  useRealtime("team");

  const { data, isLoading } = useQuery<OverviewResponse>({
    queryKey: ["team-overview"],
    queryFn: async () => {
      const res = await fetch("/api/team/overview");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 60000,
  });

  return (
    <>
      <Navbar
        title="Team & Workforce"
        subtitle="AI-powered workforce intelligence, assignment routing, and operational governance."
        badge="OPERATIONAL INTELLIGENCE"
      />

      <div className="flex-1 space-y-5 px-4 pb-28 pt-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100/60 bg-gradient-to-r from-indigo-50/40 via-white to-purple-50/30 px-4 py-2.5 glass-card"
        >
          <Badge variant="purple" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 live-pulse" />
            AI Workforce Engine
          </Badge>
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            {isLoading ? "—" : data?.kpis.activeMembers} active members
          </span>
          <span className="hidden h-4 w-px bg-slate-200 sm:block" />
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            Workload avg{" "}
            <strong className="text-slate-800">
              {isLoading ? "—" : `${data?.kpis.avgWorkload}%`}
            </strong>
          </span>
          <span className="hidden h-4 w-px bg-slate-200 sm:block" />
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Workspace health{" "}
            <strong className="text-emerald-700">{isLoading ? "—" : `${data?.health.score}/100`}</strong>
          </span>
        </motion.div>

        {data && (
          <>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <OverviewKpis kpis={data.kpis} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <WorkspaceHealthCard score={data.health.score} signals={data.health.signals} />
            </motion.div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
              <motion.div className="xl:col-span-7" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <GrowthChart data={data.growth} />
              </motion.div>
              <motion.div className="xl:col-span-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <DepartmentDistribution departments={data.departments} />
              </motion.div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
              <motion.div className="xl:col-span-7" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <AiRecommendationsPanel recommendations={data.recommendations} />
              </motion.div>
              <motion.div className="xl:col-span-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <LiveActivityFeed />
              </motion.div>
            </div>
          </>
        )}

        {isLoading && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-white shadow-card" />
              ))}
            </div>
            <div className="h-48 animate-pulse rounded-2xl bg-white shadow-card" />
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
              <div className="h-72 animate-pulse rounded-2xl bg-white shadow-card xl:col-span-7" />
              <div className="h-72 animate-pulse rounded-2xl bg-white shadow-card xl:col-span-5" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
