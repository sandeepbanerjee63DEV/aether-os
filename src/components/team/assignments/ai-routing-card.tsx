"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, BrainCircuit } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Candidate {
  id: string;
  name: string;
  avatar: string | null;
  score: number;
  reason: string;
}

interface AiRoutingCardProps {
  entityType: string;
  candidates: Candidate[];
}

const LABEL_MAP: Record<string, string> = {
  LEAD: "Leads",
  DEAL: "Deals",
  TASK: "Tasks",
  PROJECT: "Projects",
  WORKFLOW: "Workflows",
  SUPPORT_TICKET: "Support tickets",
};

export function AiRoutingCard({ entityType, candidates }: AiRoutingCardProps) {
  const top = candidates[0];
  if (!top) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 p-4 shadow-card ai-glow"
    >
      <span className="data-flow-line absolute left-0 top-0 h-[1px] w-full opacity-60" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
            <BrainCircuit className="h-3.5 w-3.5 text-white" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
            AI Routing · {LABEL_MAP[entityType] ?? entityType}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
          {top.score}/100
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Avatar className="h-9 w-9 ring-2 ring-indigo-200">
          <AvatarImage src={top.avatar || undefined} />
          <AvatarFallback>{top.name[0]}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">{top.name}</p>
          <p className="line-clamp-2 text-[11px] text-slate-500">{top.reason}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
        <Sparkles className="h-3 w-3 text-indigo-500" />
        Backup: {candidates.slice(1, 3).map((c) => c.name.split(" ")[0]).join(", ") || "—"}
      </div>

      <button
        type="button"
        className={cn(
          "mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-2 text-xs font-semibold text-white shadow-md transition-shadow hover:shadow-lg"
        )}
      >
        Route to {top.name.split(" ")[0]}
        <ArrowRight className="h-3 w-3" />
      </button>
    </motion.div>
  );
}
