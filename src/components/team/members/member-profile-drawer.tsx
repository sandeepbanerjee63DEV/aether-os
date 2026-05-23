"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "../shared/status-badge";
import { WorkloadIndicator } from "../shared/workload-indicator";
import { useTeamStore } from "@/stores/team-store";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  ShieldCheck,
  Activity,
  Briefcase,
  GitBranch,
  Trash2,
  UserX,
  UserCheck,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

interface MemberDetail {
  member: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
    title: string | null;
    phone: string | null;
    location: string | null;
    timezone: string;
    status: string;
    departmentId: string | null;
    workloadPct: number;
    operationalScore: number;
    twoFactorEnabled: boolean;
    lastActiveAt: string | null;
    createdAt: string;
  };
  department: { id: string; name: string; color: string } | null;
  sessions: { id: string; ipCity: string | null; ipCountry: string | null; status: string; lastActiveAt: string; riskScore: number }[];
  devices: { id: string; name: string; type: string; trusted: boolean; lastSeenAt: string }[];
  accessLogs: { id: string; eventType: string; success: boolean; location: string | null; createdAt: string }[];
  assignments: { id: string; entityType: string; entityLabel: string; status: string; priority: number; updatedAt: string }[];
}

export function MemberProfileDrawer() {
  const qc = useQueryClient();
  const { selectedMemberId, setSelectedMemberId } = useTeamStore();
  const open = !!selectedMemberId;

  const { data, isLoading } = useQuery<MemberDetail>({
    queryKey: ["team-member", selectedMemberId],
    queryFn: async () => {
      const res = await fetch(`/api/team/members/${selectedMemberId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: open,
  });

  const update = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await fetch(`/api/team/members/${selectedMemberId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-member"] });
      qc.invalidateQueries({ queryKey: ["team-members"] });
      qc.invalidateQueries({ queryKey: ["team-overview"] });
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/team/members/${selectedMemberId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      qc.invalidateQueries({ queryKey: ["team-overview"] });
      setSelectedMemberId(null);
    },
  });

  return (
    <Drawer open={open} onOpenChange={(o) => !o && setSelectedMemberId(null)}>
      <DrawerContent side="right" size="xl">
        {isLoading || !data ? (
          <div className="flex-1 animate-pulse space-y-4 p-6">
            <div className="h-16 rounded-2xl bg-slate-100" />
            <div className="h-32 rounded-2xl bg-slate-100" />
            <div className="h-48 rounded-2xl bg-slate-100" />
          </div>
        ) : (
          <>
            <DrawerHeader>
              <DrawerTitle className="sr-only">{data.member.name}</DrawerTitle>
              <div className="flex items-start gap-4 pr-8">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={data.member.avatar || undefined} />
                    <AvatarFallback className="text-lg">{data.member.name[0]}</AvatarFallback>
                  </Avatar>
                  {data.member.status === "ACTIVE" && (
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)] live-pulse" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-bold text-slate-900">{data.member.name}</h2>
                  <p className="text-sm text-slate-500">{data.member.title ?? "—"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={data.member.status} size="sm" />
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-100">
                      {data.member.role.replace("_", " ")}
                    </span>
                    {data.department && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {data.department.name}
                      </span>
                    )}
                    {data.member.twoFactorEnabled && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <ShieldCheck className="h-3 w-3" /> 2FA
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </DrawerHeader>

            <DrawerBody className="space-y-5">
              {/* Operational snapshot */}
              <section className="rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
                  Operational Snapshot
                </p>
                <div className="mt-3 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Workload</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{data.member.workloadPct}%</p>
                    <WorkloadIndicator value={data.member.workloadPct} size="sm" className="mt-1" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ops Score</p>
                    <p
                      className={cn(
                        "mt-1 text-xl font-bold tabular-nums",
                        data.member.operationalScore >= 80
                          ? "text-emerald-600"
                          : data.member.operationalScore >= 60
                            ? "text-amber-600"
                            : "text-rose-600"
                      )}
                    >
                      {data.member.operationalScore}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">/ 100</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Active Tasks</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {data.assignments.filter((a) => a.status === "ACTIVE").length}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">assignments</p>
                  </div>
                </div>
              </section>

              {/* Contact */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contact</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <a href={`mailto:${data.member.email}`} className="hover:text-indigo-600">
                      {data.member.email}
                    </a>
                  </li>
                  {data.member.phone && (
                    <li className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {data.member.phone}
                    </li>
                  )}
                  {data.member.location && (
                    <li className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {data.member.location}
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    {data.member.timezone}
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-500">
                    <Activity className="h-3.5 w-3.5 text-slate-400" />
                    Last active{" "}
                    {data.member.lastActiveAt ? formatRelativeTime(data.member.lastActiveAt) : "never"}
                  </li>
                </ul>
              </section>

              {/* Quick actions */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Permissions & Access
                </h3>
                <div className="mt-2 space-y-2 rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-slate-700">Base role</label>
                    <Select
                      size="sm"
                      className="w-40"
                      value={data.member.role}
                      onChange={(e) => update.mutate({ role: e.target.value })}
                    >
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="SALES">Sales</option>
                      <option value="SUPPORT">Support</option>
                      <option value="VIEWER">Viewer</option>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-slate-700">Status</label>
                    <Select
                      size="sm"
                      className="w-40"
                      value={data.member.status}
                      onChange={(e) => update.mutate({ status: e.target.value })}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="AWAY">Away</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="PENDING_INVITE">Pending</option>
                      <option value="INACTIVE">Inactive</option>
                    </Select>
                  </div>
                  <Switch
                    label="Two-factor authentication"
                    description="Require 2FA on next sign-in"
                    checked={data.member.twoFactorEnabled}
                    onCheckedChange={(v) => update.mutate({ twoFactorEnabled: v })}
                  />
                </div>
              </section>

              {/* Active assignments */}
              <section>
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <GitBranch className="h-3.5 w-3.5" />
                  Active Assignments ({data.assignments.filter((a) => a.status === "ACTIVE").length})
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {data.assignments
                    .filter((a) => a.status === "ACTIVE")
                    .slice(0, 5)
                    .map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-700">{a.entityLabel}</p>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">
                            {a.entityType} · priority {a.priority}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-500">{formatRelativeTime(a.updatedAt)}</span>
                      </li>
                    ))}
                  {data.assignments.filter((a) => a.status === "ACTIVE").length === 0 && (
                    <p className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
                      No active assignments.
                    </p>
                  )}
                </ul>
              </section>

              {/* Recent access */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recent Access</h3>
                <ul className="mt-2 space-y-1.5">
                  {data.accessLogs.slice(0, 5).map((l) => (
                    <li key={l.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-xs">
                      <div>
                        <p className="font-medium text-slate-700">{l.eventType.replace(/_/g, " ")}</p>
                        <p className="text-[10px] text-slate-400">{l.location ?? "Unknown location"}</p>
                      </div>
                      <span className={cn("text-[10px] font-semibold", l.success ? "text-emerald-600" : "text-rose-600")}>
                        {l.success ? "OK" : "FAILED"}
                      </span>
                    </li>
                  ))}
                  {data.accessLogs.length === 0 && (
                    <p className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">No access history.</p>
                  )}
                </ul>
              </section>
            </DrawerBody>

            <DrawerFooter>
              {data.member.status !== "SUSPENDED" ? (
                <Button
                  variant="secondary"
                  onClick={() => update.mutate({ status: "SUSPENDED" })}
                  disabled={update.isPending}
                >
                  <UserX className="h-4 w-4" />
                  Suspend
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => update.mutate({ status: "ACTIVE" })}
                  disabled={update.isPending}
                >
                  <UserCheck className="h-4 w-4" />
                  Restore
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm(`Remove ${data.member.name}? This cannot be undone.`)) remove.mutate();
                }}
                disabled={remove.isPending}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

// keep lucide imports referenced
void Briefcase;
