"use client";

import { Users, UserCheck, Mail, Building2, Activity, BrainCircuit } from "lucide-react";
import { AnalyticsCard } from "../shared/analytics-card";

interface Kpis {
  totalMembers: number;
  activeMembers: number;
  pendingInvites: number;
  departmentCount: number;
  avgWorkload: number;
  avgOperationalScore: number;
}

export function OverviewKpis({ kpis }: { kpis: Kpis }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      <AnalyticsCard
        label="Total Members"
        value={kpis.totalMembers}
        icon={Users}
        tone="indigo"
        hint="across all departments"
      />
      <AnalyticsCard
        label="Active Now"
        value={kpis.activeMembers}
        icon={UserCheck}
        tone="emerald"
        hint={`${Math.round((kpis.activeMembers / Math.max(1, kpis.totalMembers)) * 100)}% of workspace`}
        pulse
      />
      <AnalyticsCard
        label="Pending Invites"
        value={kpis.pendingInvites}
        icon={Mail}
        tone="purple"
        hint="awaiting acceptance"
      />
      <AnalyticsCard
        label="Departments"
        value={kpis.departmentCount}
        icon={Building2}
        tone="blue"
        hint="operational units"
      />
      <AnalyticsCard
        label="Avg Workload"
        value={`${kpis.avgWorkload}%`}
        icon={Activity}
        tone={kpis.avgWorkload > 85 ? "rose" : kpis.avgWorkload > 70 ? "amber" : "emerald"}
        hint={kpis.avgWorkload > 85 ? "above healthy ceiling" : "within healthy range"}
      />
      <AnalyticsCard
        label="Ops Score"
        value={`${kpis.avgOperationalScore}/100`}
        icon={BrainCircuit}
        tone="purple"
        ai
        hint="AI composite signal"
      />
    </div>
  );
}
