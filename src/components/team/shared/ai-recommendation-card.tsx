"use client";

import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Activity,
  CheckCircle2,
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Recommendation {
  id: string;
  type: string;
  severity: "INFO" | "ADVISORY" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  rationale: string | null;
  suggestedAction: string | null;
  confidence: number;
  isResolved: boolean;
  targetType: string | null;
  targetId: string | null;
}

const SEVERITY: Record<
  Recommendation["severity"],
  { label: string; ring: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  INFO: { label: "Info", ring: "ring-slate-100", bg: "bg-slate-50", text: "text-slate-600", icon: Activity },
  ADVISORY: { label: "Advisory", ring: "ring-indigo-100", bg: "bg-indigo-50/60", text: "text-indigo-700", icon: Sparkles },
  WARNING: { label: "Warning", ring: "ring-amber-100", bg: "bg-amber-50/60", text: "text-amber-700", icon: AlertTriangle },
  CRITICAL: { label: "Critical", ring: "ring-rose-100", bg: "bg-rose-50/60", text: "text-rose-700", icon: ShieldAlert },
};

export function AiRecommendationCard({ rec, compact }: { rec: Recommendation; compact?: boolean }) {
  const qc = useQueryClient();
  const sev = SEVERITY[rec.severity];
  const SevIcon = sev.icon;

  const resolve = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/team/recommendations/${rec.id}/resolve`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-overview"] });
      qc.invalidateQueries({ queryKey: ["team-recommendations"] });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white p-4 shadow-card ring-1 transition-shadow hover:shadow-card-hover",
        sev.ring,
        rec.isResolved && "opacity-60"
      )}
    >
      <span className="data-flow-line absolute left-0 top-0 h-[1px] w-full opacity-50" />

      <div className="flex items-start gap-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", sev.bg)}>
          <SevIcon className={cn("h-4 w-4", sev.text)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", sev.bg, sev.text)}>
                  {sev.label}
                </span>
                <span className="text-[10px] font-medium text-slate-500">
                  AI · {rec.confidence}% confidence
                </span>
              </div>
              <h4 className="mt-1.5 truncate text-sm font-semibold text-slate-900">{rec.title}</h4>
            </div>

            {!rec.isResolved && (
              <button
                type="button"
                onClick={() => resolve.mutate()}
                className="rounded-lg p-1 text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-500"
                title="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {rec.isResolved && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          </div>

          <p className={cn("mt-1.5 text-xs leading-relaxed text-slate-600", compact && "line-clamp-2")}>
            {rec.message}
          </p>

          {!compact && rec.rationale && (
            <p className="mt-2 rounded-lg bg-slate-50/80 px-2.5 py-1.5 text-[11px] leading-relaxed text-slate-500">
              <Sparkles className="mr-1 inline h-3 w-3 text-indigo-400" />
              {rec.rationale}
            </p>
          )}

          {rec.suggestedAction && (
            <button
              type="button"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-100 transition-all hover:from-indigo-100 hover:to-purple-100"
            >
              {rec.suggestedAction}
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
