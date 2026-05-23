"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Mail,
  Shield,
  Bell,
  GitBranch,
  EyeOff,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface TeamSettings {
  inviteRequiresApproval: boolean;
  defaultAccessLevel: "ADMIN" | "MANAGER" | "STAFF" | "VIEWER";
  allowSelfInvite: boolean;
  emailDomainWhitelist: string[];
  autoAssignmentEnabled: boolean;
  autoAssignmentStrategy: "round_robin" | "workload" | "ai";
  workloadCeiling: number;
  notifyOnInvite: boolean;
  notifyOnSuspiciousLogin: boolean;
  notifyOnWorkloadAlert: boolean;
  visibilityMode: "global" | "department" | "private";
  sessionTimeoutMinutes: number;
  twoFactorRequired: boolean;
}

export default function TeamSettingsPage() {
  const qc = useQueryClient();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const { data, isLoading } = useQuery<{ settings: TeamSettings }>({
    queryKey: ["team-settings"],
    queryFn: async () => {
      const res = await fetch("/api/team/settings");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<TeamSettings>) => {
      const res = await fetch("/api/team/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-settings"] });
      qc.invalidateQueries({ queryKey: ["team-activity"] });
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    },
  });

  const settings = data?.settings;

  return (
    <>
      <Navbar
        title="Team Settings"
        subtitle="Workspace governance — invite policies, auto-assignment, notifications, and visibility."
        badge="GOVERNANCE"
      />

      <div className="flex-1 space-y-5 px-4 pb-28 pt-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100/60 bg-gradient-to-r from-indigo-50/40 via-white to-purple-50/30 px-4 py-2.5 glass-card"
        >
          <div className="flex items-center gap-3">
            <Badge variant="purple" className="gap-1">
              <SettingsIcon className="h-3 w-3" />
              Workspace Governance
            </Badge>
            <span className="hidden text-xs text-slate-500 sm:inline">
              Changes audit automatically and apply across the workspace.
            </span>
          </div>
          {savedAt && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100"
            >
              <CheckCircle2 className="h-3 w-3" />
              Saved
            </motion.span>
          )}
        </motion.div>

        {isLoading || !settings ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-white shadow-card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Invite Policies */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-indigo-500" />
                    Invite Policies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Switch
                    label="Invitations require admin approval"
                    description="Pending invites must be approved before they're sent."
                    checked={settings.inviteRequiresApproval}
                    onCheckedChange={(v) => update.mutate({ inviteRequiresApproval: v })}
                  />
                  <Switch
                    label="Allow self-invite"
                    description="Members can invite peers without admin approval."
                    checked={settings.allowSelfInvite}
                    onCheckedChange={(v) => update.mutate({ allowSelfInvite: v })}
                  />
                  <div>
                    <Label className="text-sm">Default access level</Label>
                    <Select
                      size="sm"
                      className="mt-1.5"
                      value={settings.defaultAccessLevel}
                      onChange={(e) => update.mutate({ defaultAccessLevel: e.target.value as TeamSettings["defaultAccessLevel"] })}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="STAFF">Staff</option>
                      <option value="VIEWER">Viewer</option>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Email domain whitelist</Label>
                    <EmailWhitelistEditor
                      value={settings.emailDomainWhitelist}
                      onChange={(v) => update.mutate({ emailDomainWhitelist: v })}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Auto-Assignment */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="h-full ai-glow border-indigo-100/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-purple-500" />
                    AI Auto-Assignment
                    <span className="rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700 ring-1 ring-indigo-100">
                      AI
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Switch
                    label="Auto-assignment enabled"
                    description="Route new leads/deals/tickets without manual triage."
                    checked={settings.autoAssignmentEnabled}
                    onCheckedChange={(v) => update.mutate({ autoAssignmentEnabled: v })}
                  />
                  <div>
                    <Label className="text-sm">Strategy</Label>
                    <Select
                      size="sm"
                      className="mt-1.5"
                      value={settings.autoAssignmentStrategy}
                      onChange={(e) =>
                        update.mutate({ autoAssignmentStrategy: e.target.value as TeamSettings["autoAssignmentStrategy"] })
                      }
                      disabled={!settings.autoAssignmentEnabled}
                    >
                      <option value="ai">AI Operational Intelligence</option>
                      <option value="workload">Workload-balanced</option>
                      <option value="round_robin">Round-robin</option>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Workload ceiling (%)</Label>
                    <div className="mt-1.5 flex items-center gap-3">
                      <input
                        type="range"
                        min={50}
                        max={100}
                        value={settings.workloadCeiling}
                        onChange={(e) => update.mutate({ workloadCeiling: parseInt(e.target.value, 10) })}
                        className="flex-1 accent-indigo-500"
                      />
                      <span className="w-10 rounded-lg bg-slate-100 px-2 py-1 text-center text-xs font-bold tabular-nums text-slate-700">
                        {settings.workloadCeiling}
                      </span>
                    </div>
                    <p className="mt-1 flex items-start gap-1 text-[11px] text-slate-500">
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-indigo-400" />
                      AI will skip members above this load when routing new work.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notifications */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-500" />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Switch
                    label="New invite accepted"
                    description="Notify admins when a member accepts."
                    checked={settings.notifyOnInvite}
                    onCheckedChange={(v) => update.mutate({ notifyOnInvite: v })}
                  />
                  <Switch
                    label="Suspicious login"
                    description="Alert on geo-anomalies or device mismatches."
                    checked={settings.notifyOnSuspiciousLogin}
                    onCheckedChange={(v) => update.mutate({ notifyOnSuspiciousLogin: v })}
                  />
                  <Switch
                    label="Workload alert"
                    description="Notify when a member crosses the workload ceiling."
                    checked={settings.notifyOnWorkloadAlert}
                    onCheckedChange={(v) => update.mutate({ notifyOnWorkloadAlert: v })}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Security */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    Security & Visibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Switch
                    label="Require 2FA for all members"
                    description="Enforce two-factor authentication on next sign-in."
                    checked={settings.twoFactorRequired}
                    onCheckedChange={(v) => update.mutate({ twoFactorRequired: v })}
                  />
                  <div>
                    <Label className="text-sm">Session timeout (minutes)</Label>
                    <div className="mt-1.5 flex items-center gap-3">
                      <input
                        type="range"
                        min={15}
                        max={480}
                        step={15}
                        value={settings.sessionTimeoutMinutes}
                        onChange={(e) => update.mutate({ sessionTimeoutMinutes: parseInt(e.target.value, 10) })}
                        className="flex-1 accent-indigo-500"
                      />
                      <span className="w-12 rounded-lg bg-slate-100 px-2 py-1 text-center text-xs font-bold tabular-nums text-slate-700">
                        {settings.sessionTimeoutMinutes}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm flex items-center gap-1.5">
                      <EyeOff className="h-3.5 w-3.5" />
                      Team visibility
                    </Label>
                    <Select
                      size="sm"
                      className="mt-1.5"
                      value={settings.visibilityMode}
                      onChange={(e) => update.mutate({ visibilityMode: e.target.value as TeamSettings["visibilityMode"] })}
                    >
                      <option value="global">Global — everyone sees everyone</option>
                      <option value="department">Department — peers within unit</option>
                      <option value="private">Private — leads & admins only</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}

function EmailWhitelistEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="mt-1.5 space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="example.com"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const v = draft.trim().toLowerCase();
              if (v && !value.includes(v)) onChange([...value, v]);
              setDraft("");
            }
          }}
          className="h-9"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const v = draft.trim().toLowerCase();
            if (v && !value.includes(v)) onChange([...value, v]);
            setDraft("");
          }}
        >
          Add
        </Button>
      </div>
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-100"
            >
              {d}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== d))}
                className="text-indigo-400 transition-colors hover:text-rose-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-slate-500">No domains whitelisted — any email can be invited.</p>
      )}
    </div>
  );
}
