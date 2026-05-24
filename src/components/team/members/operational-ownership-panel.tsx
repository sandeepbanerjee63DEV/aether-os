"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  Flame,
  AlertTriangle,
  ArrowUpRight,
  ListChecks,
  Activity,
  TrendingUp,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OwnedLeadSummary {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  value: string;
  aiScore: number;
  convertProbability: number;
  status: string;
  operationalStatus: string;
  assignmentType: string;
  assignmentReason: string | null;
  assignedAt: string | null;
  lastContactedAt: string | null;
  updatedAt: string;
}

interface OperationalOwnership {
  ownerId: string;
  totalAssignedLeads: number;
  activeLeads: number;
  pendingFollowUps: number;
  staleLeads: number;
  hotLeads: number;
  leadWorkloadPct: number;
  avgResponseHours: number | null;
  conversionRate: number;
  expectedRevenueScore: number;
  recentLeads: OwnedLeadSummary[];
  performanceSignals: Array<{ label: string; value: string; tone: "good" | "warn" | "bad" | "neutral" }>;
}

interface OperationalOwnershipPanelProps {
  data: OperationalOwnership;
  memberName: string;
  onSelectLead?: (leadId: string) => void;
}

const SIGNAL_TONE: Record<string, string> = {
  good: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  warn: "bg-amber-50 text-amber-700 ring-amber-100",
  bad: "bg-rose-50 text-rose-700 ring-rose-100",
  neutral: "bg-slate-50 text-slate-700 ring-slate-100",
};

const OP_STATUS_TONE: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-blue-100 text-blue-700",
  ENGAGED: "bg-emerald-100 text-emerald-700",
  STALE: "bg-amber-100 text-amber-700",
  AT_RISK: "bg-rose-100 text-rose-700",
  CLOSED: "bg-slate-100 text-slate-500",
};

const ASSIGNMENT_TYPE_LABEL: Record<string, string> = {
  AI: "AI",
  MANUAL: "Manual",
  ROUND_ROBIN: "Round-robin",
  WORKLOAD: "Workload",
  RULE: "Rule",
  REASSIGNED: "Reassigned",
};

function formatTimeSince(iso: string | null): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days >= 1) return `${days}d`;
  const hours = Math.floor(diffMs / 3600000);
  if (hours >= 1) return `${hours}h`;
  return `${Math.max(1, Math.floor(diffMs / 60000))}m`;
}

export function OperationalOwnershipPanel({ data, memberName, onSelectLead }: OperationalOwnershipPanelProps) {
  if (data.totalAssignedLeads === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Operational Ownership</p>
        <p className="mt-1.5 text-sm text-slate-600">
          {memberName.split(" ")[0]} doesn&apos;t own any leads yet.
        </p>
        <Link
          href="/leads"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          Browse leads <ArrowUpRight className="h-3 w-3" />
        </Link>
      </section>
    );
  }

  const kpiCells = [
    {
      icon: ListChecks,
      label: "Assigned",
      value: data.totalAssignedLeads,
      sub: `${data.activeLeads} active`,
      tone: "text-indigo-700",
      bg: "from-indigo-50/80 via-white to-purple-50/30",
    },
    {
      icon: Activity,
      label: "Follow-ups",
      value: data.pendingFollowUps,
      sub: data.staleLeads > 0 ? `${data.staleLeads} stale` : "no backlog",
      tone: data.staleLeads > 0 ? "text-amber-700" : "text-emerald-700",
      bg: data.staleLeads > 0 ? "from-amber-50/80 via-white to-orange-50/30" : "from-emerald-50/80 via-white to-teal-50/30",
    },
    {
      icon: Flame,
      label: "Hot pipe",
      value: data.hotLeads,
      sub: `${data.leadWorkloadPct}pp load`,
      tone: "text-rose-700",
      bg: "from-rose-50/80 via-white to-pink-50/30",
    },
    {
      icon: TrendingUp,
      label: "Convert",
      value: `${data.conversionRate}%`,
      sub: `score ${data.expectedRevenueScore}`,
      tone: data.conversionRate >= 60 ? "text-emerald-700" : "text-slate-700",
      bg: "from-slate-50/80 via-white to-slate-100/30",
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Sparkles className="h-3 w-3 text-indigo-500" />
          Operational Ownership
        </h3>
        {data.avgResponseHours !== null && (
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
            <Clock className="h-3 w-3" /> Avg first-touch{" "}
            <span className="font-semibold text-slate-700">{data.avgResponseHours}h</span>
          </span>
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {kpiCells.map((cell, i) => {
          const Icon = cell.icon;
          return (
            <motion.div
              key={cell.label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn("rounded-2xl border border-slate-100 bg-gradient-to-br p-3", cell.bg)}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {cell.label}
                </p>
                <Icon className={cn("h-3.5 w-3.5", cell.tone)} />
              </div>
              <p className={cn("mt-1 text-2xl font-bold tabular-nums", cell.tone)}>{cell.value}</p>
              <p className="text-[10px] text-slate-500">{cell.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {data.performanceSignals.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.performanceSignals.map((sig) => (
            <span
              key={sig.label}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                SIGNAL_TONE[sig.tone] ?? SIGNAL_TONE.neutral,
              )}
            >
              {sig.label}: {sig.value}
            </span>
          ))}
        </div>
      )}

      {data.recentLeads.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Recent leads
          </p>
          <ul className="mt-2 space-y-1.5">
            {data.recentLeads.map((lead) => (
              <li key={lead.id}>
                <button
                  type="button"
                  onClick={() => onSelectLead?.(lead.id)}
                  className="group flex w-full items-start gap-2 rounded-xl border border-slate-100 bg-white p-2.5 text-left transition-all hover:border-indigo-100 hover:bg-indigo-50/30"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 text-[10px] font-bold text-indigo-700">
                    {lead.firstName[0]}
                    {lead.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-slate-900">
                        {lead.firstName} {lead.lastName}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 text-[10px] font-bold tabular-nums",
                          lead.aiScore >= 80
                            ? "text-emerald-600"
                            : lead.aiScore >= 60
                              ? "text-amber-600"
                              : "text-slate-500",
                        )}
                      >
                        {lead.aiScore}
                      </span>
                    </div>
                    <p className="truncate text-[10px] text-slate-500">{lead.company}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                          OP_STATUS_TONE[lead.operationalStatus] ?? OP_STATUS_TONE.NEW,
                        )}
                      >
                        {lead.operationalStatus.replace("_", " ")}
                      </span>
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
                        {ASSIGNMENT_TYPE_LABEL[lead.assignmentType] ?? lead.assignmentType}
                      </span>
                      {lead.value === "High" && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700">
                          <Flame className="h-2 w-2" /> High
                        </span>
                      )}
                      {lead.operationalStatus === "STALE" && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                          <AlertTriangle className="h-2 w-2" /> Action needed
                        </span>
                      )}
                      <span className="ml-auto text-[9px] text-slate-400">
                        {formatTimeSince(lead.lastContactedAt ?? lead.updatedAt)}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <Link
            href="/leads"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all {memberName.split(" ")[0]}&apos;s leads in Leads
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </section>
  );
}
