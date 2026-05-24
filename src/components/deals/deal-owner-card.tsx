"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  ChevronDown,
  ArrowRightLeft,
  Loader2,
  AlertCircle,
  Wand2,
  UserCog,
  Building2,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";

interface OwnerSummary {
  id: string;
  name: string;
  email?: string;
  avatar: string | null;
  role: string;
  title?: string | null;
  workloadPct: number;
  operationalScore: number;
  departmentId?: string | null;
}

interface RoutingCandidate {
  memberId: string;
  memberName: string;
  memberAvatar: string | null;
  memberRole: string;
  workloadPct: number;
  operationalScore: number;
  score: number;
  reason: string;
}

interface OwnerSuggestionsResponse {
  dealId: string;
  currentOwner: OwnerSummary | null;
  strategy: string;
  rationale: string;
  consideredCount: number;
  best: RoutingCandidate | null;
  alternatives: RoutingCandidate[];
}

interface Department {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface DealOwnerCardProps {
  dealId: string;
  owner: OwnerSummary | null;
  assignedBy?: OwnerSummary | null;
  department?: Department | null;
  supportingDepartments?: Department[];
  assignmentType: string;
  assignmentReason: string | null;
  assignedAt: string | null;
  operationalStatus: string;
  dealValue: number;
  aiProbability: number | null;
}

const ASSIGNMENT_TYPE_META: Record<
  string,
  { label: string; tone: string; icon: typeof Sparkles; description: string }
> = {
  AI: {
    label: "AI Engine",
    tone: "from-indigo-500 to-purple-500 text-white",
    icon: Sparkles,
    description: "Routed by AI Assignment Engine",
  },
  MANUAL: {
    label: "Manual",
    tone: "from-slate-700 to-slate-900 text-white",
    icon: UserCog,
    description: "Manually assigned",
  },
  ROUND_ROBIN: {
    label: "Round-Robin",
    tone: "from-amber-500 to-orange-500 text-white",
    icon: ArrowRightLeft,
    description: "Routed via round-robin rotation",
  },
  WORKLOAD: {
    label: "Workload",
    tone: "from-emerald-500 to-teal-500 text-white",
    icon: Wand2,
    description: "Routed by workload balancer",
  },
  RULE: {
    label: "Rule",
    tone: "from-blue-500 to-cyan-500 text-white",
    icon: Wand2,
    description: "Routed by assignment rule",
  },
  REASSIGNED: {
    label: "Reassigned",
    tone: "from-rose-500 to-pink-500 text-white",
    icon: ArrowRightLeft,
    description: "Recently reassigned",
  },
};

const OP_STATUS_META: Record<string, { tone: string; label: string }> = {
  NEW: { tone: "bg-slate-100 text-slate-700", label: "New" },
  ACTIVE: { tone: "bg-emerald-100 text-emerald-700", label: "Active" },
  AT_RISK: { tone: "bg-rose-100 text-rose-700", label: "At risk" },
  STALLED: { tone: "bg-amber-100 text-amber-700", label: "Stalled" },
  CLOSED: { tone: "bg-slate-100 text-slate-500", label: "Closed" },
};

function formatTimeSince(iso: string | null): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days >= 1) return `${days}d ago`;
  const hours = Math.floor(diffMs / 3600000);
  if (hours >= 1) return `${hours}h ago`;
  const mins = Math.floor(diffMs / 60000);
  return `${Math.max(1, mins)}m ago`;
}

function formatCurrency(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `$${value}`;
}

export function DealOwnerCard({
  dealId,
  owner,
  assignedBy,
  department,
  supportingDepartments = [],
  assignmentType,
  assignmentReason,
  assignedAt,
  operationalStatus,
  dealValue,
  aiProbability,
}: DealOwnerCardProps) {
  const qc = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const meta = ASSIGNMENT_TYPE_META[assignmentType] ?? ASSIGNMENT_TYPE_META.MANUAL;
  const TypeIcon = meta.icon;
  const opStatus = OP_STATUS_META[operationalStatus] ?? OP_STATUS_META.NEW;

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const suggestionsQuery = useQuery<OwnerSuggestionsResponse>({
    queryKey: ["deal-owner-suggestions", dealId],
    queryFn: async () => {
      const res = await fetch(`/api/deals/${dealId}/owner-suggestions`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: menuOpen,
    staleTime: 30_000,
  });

  const reassignMutation = useMutation({
    mutationFn: async (body: { strategy: "ai" | "manual"; assigneeId?: string; reason?: string }) => {
      const res = await fetch(`/api/deals/${dealId}/reassign`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Reassignment failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deal-detail", dealId] });
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["deal-activity", dealId] });
      qc.invalidateQueries({ queryKey: ["deal-owner-suggestions", dealId] });
      qc.invalidateQueries({ queryKey: ["team-assignments"] });
      qc.invalidateQueries({ queryKey: ["team-members"] });
      qc.invalidateQueries({ queryKey: ["team-overview"] });
      setMenuOpen(false);
    },
  });

  if (!owner) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <AlertCircle className="h-5 w-5 text-slate-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700">Unassigned Deal</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {formatCurrency(dealValue)} of pipeline value with no execution owner yet.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => reassignMutation.mutate({ strategy: "ai" })}
            disabled={reassignMutation.isPending}
            className="gap-1.5"
          >
            {reassignMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Routing...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" /> AI assign
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  const weighted = aiProbability != null ? dealValue * (aiProbability / 100) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-white to-slate-50/50 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="h-12 w-12 ring-2 ring-white">
            <AvatarImage src={owner.avatar || undefined} alt={owner.name} />
            <AvatarFallback className="bg-indigo-50 text-xs font-semibold text-indigo-700">
              {getInitials(owner.name)}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br shadow-sm",
              meta.tone,
            )}
            title={meta.description}
          >
            <TypeIcon className="h-2.5 w-2.5" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                Deal Owner
              </p>
              <p className="truncate text-sm font-semibold text-slate-900">{owner.name}</p>
              <p className="truncate text-[11px] text-slate-500">
                {owner.title || owner.role.replace("_", " ")}
              </p>
            </div>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <RefreshCw className="h-3 w-3" /> Reassign
                <ChevronDown className="h-3 w-3" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.12 }}
                    role="menu"
                    className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl"
                  >
                    <div className="border-b border-slate-100 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                        AI Routing Suggestions
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Based on revenue, workload, and continuity signals
                      </p>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {suggestionsQuery.isLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        </div>
                      ) : suggestionsQuery.data?.best ? (
                        <>
                          <SuggestionRow
                            candidate={suggestionsQuery.data.best}
                            highlight
                            disabled={reassignMutation.isPending}
                            onPick={() =>
                              reassignMutation.mutate({
                                strategy: "manual",
                                assigneeId: suggestionsQuery.data!.best!.memberId,
                                reason: suggestionsQuery.data!.best!.reason,
                              })
                            }
                          />
                          {suggestionsQuery.data.alternatives.map((c) => (
                            <SuggestionRow
                              key={c.memberId}
                              candidate={c}
                              disabled={reassignMutation.isPending}
                              onPick={() =>
                                reassignMutation.mutate({
                                  strategy: "manual",
                                  assigneeId: c.memberId,
                                  reason: c.reason,
                                })
                              }
                            />
                          ))}
                        </>
                      ) : (
                        <div className="px-3 py-6 text-center text-[11px] text-slate-500">
                          {suggestionsQuery.data?.rationale ?? "No alternative owners available."}
                        </div>
                      )}
                    </div>
                    <div className="border-t border-slate-100 bg-slate-50/50 p-2.5">
                      <button
                        type="button"
                        onClick={() => reassignMutation.mutate({ strategy: "ai" })}
                        disabled={reassignMutation.isPending}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                      >
                        {reassignMutation.isPending ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" /> Routing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3" /> Auto-reroute via AI
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-semibold",
                meta.tone,
              )}
            >
              <TypeIcon className="h-2.5 w-2.5" />
              {meta.label}
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", opStatus.tone)}>
              {opStatus.label}
            </span>
            {department && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-100">
                <Building2 className="h-2.5 w-2.5" />
                {department.name}
              </span>
            )}
            <span className="text-[10px] text-slate-400">{formatTimeSince(assignedAt)}</span>
          </div>

          {assignmentReason && (
            <p className="mt-2 rounded-lg bg-indigo-50/50 px-2 py-1.5 text-[11px] leading-snug text-indigo-900/80">
              {assignmentReason}
            </p>
          )}

          {supportingDepartments.length > 0 && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-slate-100 bg-slate-50/40 px-2 py-1.5">
              <Users className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Supporting Teams
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {supportingDepartments.map((d) => (
                    <span
                      key={d.id}
                      className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 ring-1 ring-slate-100"
                    >
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              Workload
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  owner.workloadPct >= 85
                    ? "text-rose-600"
                    : owner.workloadPct >= 70
                      ? "text-amber-600"
                      : "text-emerald-600",
                )}
              >
                {owner.workloadPct}%
              </span>
            </span>
            <span className="flex items-center gap-1">
              Ops score
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  owner.operationalScore >= 80
                    ? "text-emerald-600"
                    : owner.operationalScore >= 60
                      ? "text-amber-600"
                      : "text-rose-600",
                )}
              >
                {owner.operationalScore}
              </span>
            </span>
            {weighted !== null && (
              <span className="flex items-center gap-1">
                Weighted{" "}
                <span className="font-semibold tabular-nums text-emerald-700">
                  {formatCurrency(weighted)}
                </span>
              </span>
            )}
            {assignedBy && (
              <span className="ml-auto flex items-center gap-1">
                By <span className="font-semibold text-slate-600">{assignedBy.name.split(" ")[0]}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {reassignMutation.isError && (
        <p className="mt-2 rounded-lg bg-rose-50 px-2 py-1 text-[11px] text-rose-700">
          {reassignMutation.error instanceof Error
            ? reassignMutation.error.message
            : "Reassignment failed."}
        </p>
      )}
    </motion.div>
  );
}

function SuggestionRow({
  candidate,
  highlight,
  disabled,
  onPick,
}: {
  candidate: RoutingCandidate;
  highlight?: boolean;
  disabled?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={cn(
        "flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 disabled:opacity-50",
        highlight && "bg-gradient-to-r from-indigo-50/60 to-transparent",
      )}
    >
      <Avatar className="h-9 w-9 ring-1 ring-slate-100">
        <AvatarImage src={candidate.memberAvatar || undefined} />
        <AvatarFallback className="bg-indigo-50 text-[10px] font-semibold text-indigo-700">
          {getInitials(candidate.memberName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">{candidate.memberName}</p>
          <Badge variant={highlight ? "success" : "default"} className="shrink-0 text-[10px]">
            {candidate.score}
          </Badge>
        </div>
        <p className="text-[10px] text-slate-500">{candidate.memberRole.replace("_", " ")}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-600">{candidate.reason}</p>
        <div className="mt-1 flex gap-2 text-[10px] text-slate-400">
          <span>
            Workload <span className="tabular-nums text-slate-600">{candidate.workloadPct}%</span>
          </span>
          <span>
            Ops <span className="tabular-nums text-slate-600">{candidate.operationalScore}</span>
          </span>
        </div>
      </div>
    </button>
  );
}
