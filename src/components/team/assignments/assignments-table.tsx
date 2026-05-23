"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { WorkloadIndicator } from "../shared/workload-indicator";
import { useTeamStore } from "@/stores/team-store";
import {
  Sparkles,
  GitBranch,
  Flame,
  Target,
  CheckSquare,
  FolderKanban,
  Headphones,
  Workflow as WorkflowIcon,
  Handshake,
  Circle,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Assignment {
  id: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  status: string;
  priority: number;
  workloadWeight: number;
  aiSuggested: boolean;
  aiReason: string | null;
  notes: string | null;
  updatedAt: string;
  assignee: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
    workloadPct: number;
  } | null;
}

interface AssignmentsResponse {
  assignments: Assignment[];
  total: number;
}

const ENTITY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  LEAD: Target,
  DEAL: Handshake,
  TASK: CheckSquare,
  PROJECT: FolderKanban,
  WORKFLOW: WorkflowIcon,
  SUPPORT_TICKET: Headphones,
};

const STATUS_TONE: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  REASSIGNED: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  COMPLETED: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  ESCALATED: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  CANCELLED: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
};

export function AssignmentsTable() {
  const { assignmentStatusFilter, assignmentEntityFilter, setAssignmentStatusFilter, setAssignmentEntityFilter } =
    useTeamStore();

  const { data, isLoading } = useQuery<AssignmentsResponse>({
    queryKey: ["team-assignments", { assignmentStatusFilter, assignmentEntityFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (assignmentStatusFilter !== "ALL") params.set("status", assignmentStatusFilter);
      if (assignmentEntityFilter !== "ALL") params.set("entityType", assignmentEntityFilter);
      const res = await fetch(`/api/team/assignments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 60000,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-indigo-500" />
            Active Assignments
          </CardTitle>
          <div className="flex gap-2">
            <Select
              size="sm"
              className="h-8 w-36"
              value={assignmentEntityFilter}
              onChange={(e) => setAssignmentEntityFilter(e.target.value as typeof assignmentEntityFilter)}
            >
              <option value="ALL">All types</option>
              <option value="LEAD">Leads</option>
              <option value="DEAL">Deals</option>
              <option value="TASK">Tasks</option>
              <option value="PROJECT">Projects</option>
              <option value="SUPPORT_TICKET">Support</option>
              <option value="WORKFLOW">Workflows</option>
            </Select>
            <Select
              size="sm"
              className="h-8 w-32"
              value={assignmentStatusFilter}
              onChange={(e) => setAssignmentStatusFilter(e.target.value as typeof assignmentStatusFilter)}
            >
              <option value="ALL">All status</option>
              <option value="ACTIVE">Active</option>
              <option value="REASSIGNED">Reassigned</option>
              <option value="COMPLETED">Completed</option>
              <option value="ESCALATED">Escalated</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-50" />
            ))}
          </div>
        ) : !data?.assignments.length ? (
          <EmptyState
            title="No assignments yet"
            description="Assignments appear here when leads, deals, or tasks are routed."
          />
        ) : (
          <ul className="divide-y divide-slate-50">
            {data.assignments.map((a, i) => {
              const EIcon = ENTITY_ICON[a.entityType] ?? Circle;
              const st = STATUS_TONE[a.status] ?? STATUS_TONE.ACTIVE;
              return (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.2) }}
                  className="group flex items-center gap-3 px-2 py-3 transition-colors hover:bg-slate-50/60"
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      a.aiSuggested
                        ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    <EIcon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{a.entityLabel}</p>
                      {a.aiSuggested && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700 ring-1 ring-indigo-100">
                          <Sparkles className="h-2.5 w-2.5" />
                          AI
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="font-medium uppercase tracking-wider">{a.entityType}</span>
                      {a.priority >= 80 && (
                        <span className="inline-flex items-center gap-0.5 text-rose-600">
                          <Flame className="h-2.5 w-2.5" />
                          High priority
                        </span>
                      )}
                      <span>·</span>
                      <span>{formatRelativeTime(a.updatedAt)}</span>
                    </div>
                    {a.aiReason && <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">{a.aiReason}</p>}
                  </div>

                  <div className="hidden min-w-[140px] flex-col gap-1 sm:flex">
                    <span
                      className={cn(
                        "inline-flex w-fit items-center gap-1.5 self-end rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        st.bg,
                        st.text
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", st.dot, a.status === "ACTIVE" && "live-pulse")} />
                      {a.status}
                    </span>
                  </div>

                  {a.assignee && (
                    <div className="hidden min-w-[180px] items-center gap-2 sm:flex">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={a.assignee.avatar || undefined} />
                        <AvatarFallback className="text-[10px]">{a.assignee.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-700">{a.assignee.name}</p>
                        <WorkloadIndicator value={a.assignee.workloadPct} size="sm" />
                      </div>
                    </div>
                  )}
                </motion.li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
