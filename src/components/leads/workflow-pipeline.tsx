"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Brain, UserCheck, Calendar, TrendingUp, CheckCircle2, Zap, GitBranch, Sparkles } from "lucide-react";
import { WORKFLOW_STEPS } from "@/data/dashboard-config";
import { WORKFLOW_INTELLIGENCE } from "@/types/operational-intelligence";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ICONS = [UserPlus, Brain, UserCheck, Calendar, TrendingUp, CheckCircle2];
const COLORS: Record<string, string> = {
  purple: "bg-purple-100 text-purple-600 ring-purple-200",
  blue: "bg-blue-100 text-blue-600 ring-blue-200",
  green: "bg-emerald-100 text-emerald-600 ring-emerald-200",
  yellow: "bg-amber-100 text-amber-600 ring-amber-200",
  orange: "bg-orange-100 text-orange-600 ring-orange-200",
};

const SIGNAL_STYLES: Record<string, string> = {
  live: "bg-emerald-500",
  "ai-active": "bg-purple-500 live-pulse",
  active: "bg-indigo-500 live-pulse",
  scheduled: "bg-amber-500",
  monitoring: "bg-blue-500 live-pulse",
  forecast: "bg-emerald-400",
};

export function WorkflowPipeline({ activeStep = 5 }: { activeStep?: number }) {
  const [pulseStep, setPulseStep] = useState(activeStep);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseStep((s) => (s >= 6 ? 2 : s + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card intelligence-hover">
      <div className="flex items-center justify-between border-b border-slate-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <Badge variant="pipeline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Adaptive AI Workflow
          </Badge>
          <span className="text-[10px] text-slate-400">Live · {WORKFLOW_INTELLIGENCE.filter((w) => w.aiIntervention).length} AI intervention points</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 live-pulse" />
          <span className="text-[10px] font-medium text-emerald-600">Autonomous monitoring</span>
        </div>
      </div>

      <div className="overflow-x-auto p-5 scrollbar-thin">
        <div className="flex min-w-[900px] items-start justify-between gap-1">
          {WORKFLOW_STEPS.map((step, i) => {
            const Icon = ICONS[i];
            const intel = WORKFLOW_INTELLIGENCE[i];
            const isActive = i + 1 <= activeStep;
            const isPulsing = i + 1 === pulseStep;

            return (
              <div key={step.key} className="flex flex-1 items-start">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative flex w-full flex-col items-center text-center"
                >
                  {intel.aiIntervention && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute -top-1 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-primary"
                    >
                      <Brain className="h-2.5 w-2.5 text-white" />
                    </motion.div>
                  )}

                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl ring-2 transition-all duration-500",
                      COLORS[step.color],
                      !isActive && "opacity-50 grayscale",
                      isPulsing && "ai-glow ai-glow-pulse scale-105"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="mt-1.5 flex items-center gap-1">
                    <span className={cn("h-1.5 w-1.5 rounded-full", SIGNAL_STYLES[intel.signal])} />
                    <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                      {intel.signal.replace("-", " ")}
                    </span>
                  </div>

                  <span className="mt-1 text-[10px] font-medium text-slate-400">
                    {String(step.id).padStart(2, "0")}
                  </span>
                  <p className="mt-0.5 text-xs font-semibold text-slate-800">{step.label}</p>
                  <p className="mt-0.5 max-w-[110px] text-[10px] text-slate-500">{step.subtitle}</p>

                  <div className="mt-2 w-full max-w-[130px] space-y-1 rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1.5 text-left">
                    <p className="flex items-center gap-1 text-[9px] text-slate-500">
                      <Zap className="h-2.5 w-2.5 text-amber-500" />
                      {intel.automation}
                    </p>
                    {intel.branch && (
                      <p className="flex items-center gap-1 text-[9px] text-indigo-600">
                        <GitBranch className="h-2.5 w-2.5" />
                        {intel.branch}
                      </p>
                    )}
                    <p className="text-[9px] font-medium text-emerald-600">{intel.prediction}</p>
                  </div>
                </motion.div>

                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className="mt-6 flex flex-1 flex-col items-center px-0.5 min-w-[24px]">
                    <div className="h-px w-full border-t-2 border-dashed border-indigo-200" />
                    <motion.div
                      className="mt-1 h-0.5 w-full rounded-full data-flow-line opacity-50"
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
