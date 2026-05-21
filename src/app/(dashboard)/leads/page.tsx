"use client";

import { useRealtime } from "@/hooks/use-realtime";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { WorkflowPipeline } from "@/components/leads/workflow-pipeline";
import { ActiveLeadsList } from "@/components/leads/active-leads-list";
import { LeadDetailsPanel } from "@/components/leads/lead-details-panel";
import { FollowUpTimeline } from "@/components/leads/follow-up-timeline";
import { ConversionFunnel } from "@/components/charts/conversion-funnel";
import { ScoreDistributionChart, SourceDistributionChart } from "@/components/charts/analytics-donuts";
import { AiInsightsWidget } from "@/components/charts/ai-insights-widget";
import { AiOperationalFeed } from "@/components/intelligence/ai-operational-feed";
import { PredictiveOperationsPanel } from "@/components/intelligence/predictive-operations-panel";
import { AiBusinessMemory } from "@/components/intelligence/ai-business-memory";
import { TeamIntelligencePanel } from "@/components/intelligence/team-intelligence-panel";
import { AutomationVisibility } from "@/components/intelligence/automation-visibility";
import { Sparkles, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LeadsPage() {
  useRealtime("leads");

  const { data: ops } = useQuery({
    queryKey: ["operations-feed"],
    queryFn: () => fetch("/api/operations/feed").then((r) => r.json()),
  });

  return (
    <>
      <Navbar
        title="Lead to Client Workflow"
        subtitle="AI autonomously monitors, predicts, and optimizes your revenue operations in real time."
        badge="OPERATIONAL INTELLIGENCE"
        showAddLead
      />

      <div className="flex-1 space-y-5 px-4 pb-28 lg:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100/60 bg-gradient-to-r from-indigo-50/40 via-white to-purple-50/30 px-4 py-2.5 glass-card"
        >
          <Badge variant="purple" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 live-pulse" />
            AI OS Active
          </Badge>
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            Monitoring <strong className="text-slate-800">{ops?.signalsMonitored ?? 0}</strong> operational signals
          </span>
          <span className="hidden h-4 w-px bg-slate-200 sm:block" />
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            {(ops?.riskAlerts ?? 0) > 0
              ? `${ops.riskAlerts} risk alert${ops.riskAlerts > 1 ? "s" : ""}`
              : "No active risk alerts"}
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <WorkflowPipeline activeStep={5} />
        </motion.div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <motion.div className="lg:col-span-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <AiOperationalFeed />
          </motion.div>
          <motion.div className="lg:col-span-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <AutomationVisibility />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <motion.div className="xl:col-span-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <ActiveLeadsList />
          </motion.div>
          <motion.div className="xl:col-span-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <LeadDetailsPanel />
          </motion.div>
          <motion.div className="xl:col-span-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <FollowUpTimeline />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <PredictiveOperationsPanel />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <TeamIntelligencePanel />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
            <AiBusinessMemory />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <ConversionFunnel />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
            <ScoreDistributionChart />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <AiInsightsWidget />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
            <SourceDistributionChart />
          </motion.div>
        </div>
      </div>
    </>
  );
}
