"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, ShieldCheck, Mail, Phone, UserCheck, UserX, Trash2, KeyRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "../shared/status-badge";
import { WorkloadIndicator } from "../shared/workload-indicator";
import { useTeamStore } from "@/stores/team-store";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  title: string | null;
  status: string;
  workloadPct: number;
  operationalScore: number;
  twoFactorEnabled: boolean;
  lastActiveAt: string | null;
  departmentId: string | null;
  department: { id: string; name: string; color: string } | null;
}

const ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-indigo-100 text-indigo-700",
  MANAGER: "bg-blue-100 text-blue-700",
  SALES: "bg-emerald-100 text-emerald-700",
  SUPPORT: "bg-amber-100 text-amber-700",
  VIEWER: "bg-slate-100 text-slate-600",
};

export function MembersTable() {
  const qc = useQueryClient();
  const {
    memberSearch,
    memberStatusFilter,
    memberRoleFilter,
    memberDepartmentFilter,
    memberSort,
    selectedMemberIds,
    toggleMemberSelected,
    clearMemberSelection,
    setSelectedMemberId,
  } = useTeamStore();

  const { data, isLoading } = useQuery<{ members: Member[]; total: number }>({
    queryKey: [
      "team-members",
      { memberSearch, memberStatusFilter, memberRoleFilter, memberDepartmentFilter, memberSort },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (memberSearch) params.set("search", memberSearch);
      if (memberStatusFilter !== "ALL") params.set("status", memberStatusFilter);
      if (memberRoleFilter !== "ALL") params.set("role", memberRoleFilter);
      if (memberDepartmentFilter !== "ALL") params.set("departmentId", memberDepartmentFilter);
      params.set("sort", memberSort);
      const res = await fetch(`/api/team/members?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 60000,
  });

  const bulk = useMutation({
    mutationFn: async ({ action, payload }: { action: string; payload?: Record<string, unknown> }) => {
      const res = await fetch("/api/team/members/bulk-action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: selectedMemberIds, action, payload }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      qc.invalidateQueries({ queryKey: ["team-overview"] });
      clearMemberSelection();
    },
  });

  const members = data?.members ?? [];
  const allSelected = members.length > 0 && members.every((m) => selectedMemberIds.includes(m.id));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-card">
      {selectedMemberIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 px-4 py-2.5"
        >
          <span className="text-xs font-semibold text-indigo-700">
            {selectedMemberIds.length} selected
          </span>
          <span className="h-3 w-px bg-indigo-200" />
          <BulkActionButton
            icon={UserX}
            label="Suspend"
            onClick={() => bulk.mutate({ action: "SUSPEND" })}
            disabled={bulk.isPending}
          />
          <BulkActionButton
            icon={UserCheck}
            label="Restore"
            onClick={() => bulk.mutate({ action: "RESTORE" })}
            disabled={bulk.isPending}
          />
          <BulkActionButton
            icon={Trash2}
            label="Remove"
            tone="danger"
            onClick={() => {
              if (confirm(`Remove ${selectedMemberIds.length} member${selectedMemberIds.length === 1 ? "" : "s"}?`))
                bulk.mutate({ action: "DELETE" });
            }}
            disabled={bulk.isPending}
          />
          <button
            type="button"
            onClick={clearMemberSelection}
            className="ml-auto text-[11px] font-medium text-slate-500 hover:text-slate-700"
          >
            Clear selection
          </button>
        </motion.div>
      )}

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 cursor-pointer accent-indigo-500"
                  checked={allSelected}
                  onChange={() => {
                    if (allSelected) clearMemberSelection();
                    else members.forEach((m) => !selectedMemberIds.includes(m.id) && toggleMemberSelected(m.id));
                  }}
                />
              </th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Workload</th>
              <th className="px-4 py-3 text-right">Ops Score</th>
              <th className="px-4 py-3">Last Active</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="px-4 py-3">
                      <div className="h-12 animate-pulse rounded-xl bg-slate-50" />
                    </td>
                  </tr>
                ))
              : members.length === 0
                ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12">
                      <EmptyState title="No matching members" description="Adjust filters or invite a new member to get started." />
                    </td>
                  </tr>
                )
                : members.map((m) => {
                    const checked = selectedMemberIds.includes(m.id);
                    return (
                      <tr
                        key={m.id}
                        className={cn(
                          "group cursor-pointer transition-colors hover:bg-slate-50/60",
                          checked && "bg-indigo-50/30"
                        )}
                        onClick={() => setSelectedMemberId(m.id)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 cursor-pointer accent-indigo-500"
                            checked={checked}
                            onChange={() => toggleMemberSelected(m.id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={m.avatar || undefined} />
                              <AvatarFallback>{m.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                                {m.name}
                                {m.twoFactorEnabled && (
                                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                )}
                              </p>
                              <p className="truncate text-xs text-slate-500">{m.title ?? m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              ROLE_COLOR[m.role] ?? "bg-slate-100 text-slate-600"
                            )}
                          >
                            {m.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {m.department?.name ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={m.status} size="sm" />
                        </td>
                        <td className="px-4 py-3 min-w-[110px]">
                          <WorkloadIndicator value={m.workloadPct} showLabel size="sm" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center justify-end rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                              m.operationalScore >= 80
                                ? "bg-emerald-50 text-emerald-700"
                                : m.operationalScore >= 60
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-rose-50 text-rose-700"
                            )}
                          >
                            {m.operationalScore}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {m.lastActiveAt ? formatRelativeTime(m.lastActiveAt) : "—"}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="rounded-lg p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            onClick={() => setSelectedMemberId(m.id)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
          </tbody>
        </table>
      </div>

      {!isLoading && (
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 px-4 py-2.5 text-[11px] text-slate-500">
          <span>
            Showing <strong className="text-slate-700">{members.length}</strong> of {data?.total ?? 0} members
          </span>
          <ContactBar members={members.slice(0, 3)} />
        </div>
      )}
    </div>
  );
}

interface BulkActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone?: "default" | "danger";
  onClick: () => void;
  disabled?: boolean;
}

function BulkActionButton({ icon: Icon, label, tone = "default", onClick, disabled }: BulkActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50",
        tone === "danger"
          ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

function ContactBar({ members }: { members: Member[] }) {
  if (!members.length) return null;
  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span className="text-slate-400">Quick contact:</span>
      {members.map((m) => (
        <a
          key={m.id}
          href={`mailto:${m.email}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
        >
          <Mail className="h-3 w-3" />
          {m.name.split(" ")[0]}
        </a>
      ))}
    </div>
  );
}

// Silence unused import (kept for icon set parity)
void Phone;
void KeyRound;
