import { NextResponse } from "next/server";
import { teamStore } from "@/lib/team/team-store";
import { generateRecommendations, workspaceHealth } from "@/lib/team/ai";
import { leadStore } from "@/lib/leads/lead-store";
import { dealStore } from "@/lib/deals/deal-store";

export async function GET() {
  const snap = await teamStore.snapshot();
  const { leads } = await leadStore.list({});
  const { deals } = await dealStore.list({});

  const recs = generateRecommendations({
    members: snap.members,
    departments: snap.departments,
    assignments: snap.assignments,
    sessions: snap.sessions,
    accessLogs: snap.accessLogs,
    leads,
    deals,
  });
  await teamStore.setRecommendations(recs);

  const health = workspaceHealth({
    members: snap.members,
    departments: snap.departments,
    recommendations: recs,
  });

  const active = snap.members.filter((m) => m.status === "ACTIVE");
  const pending = snap.members.filter((m) => m.status === "PENDING_INVITE");
  const away = snap.members.filter((m) => m.status === "AWAY");
  const suspended = snap.members.filter((m) => m.status === "SUSPENDED");
  const inactive = snap.members.filter((m) => m.status === "INACTIVE");

  const byDept = snap.departments
    .filter((d) => d.isActive)
    .map((d) => {
      const members = snap.members.filter((m) => m.departmentId === d.id);
      const activeM = members.filter((m) => m.status === "ACTIVE");
      const avgLoad = activeM.length
        ? activeM.reduce((s, m) => s + m.workloadPct, 0) / activeM.length
        : 0;
      return {
        id: d.id,
        name: d.name,
        color: d.color,
        icon: d.icon,
        memberCount: members.length,
        activeCount: activeM.length,
        capacity: d.capacity,
        avgWorkload: Math.round(avgLoad),
        healthScore: d.healthScore,
        leadId: d.leadId,
      };
    });

  // Growth: 6-month synthetic curve derived from createdAt
  const months: { label: string; total: number; active: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const ts = Date.now() - i * 30 * 86400000;
    const label = new Date(ts).toLocaleDateString("en-IN", { month: "short" });
    const totalAt = snap.members.filter((m) => new Date(m.createdAt).getTime() <= ts).length;
    const activeAt = snap.members.filter(
      (m) => new Date(m.createdAt).getTime() <= ts && m.status !== "INACTIVE"
    ).length;
    months.push({ label, total: totalAt || snap.members.length - i, active: activeAt || active.length - Math.floor(i / 2) });
  }

  return NextResponse.json({
    kpis: {
      totalMembers: snap.members.length,
      activeMembers: active.length,
      pendingInvites: pending.length,
      awayMembers: away.length,
      suspendedMembers: suspended.length,
      inactiveMembers: inactive.length,
      departmentCount: snap.departments.filter((d) => d.isActive).length,
      avgWorkload: active.length
        ? Math.round(active.reduce((s, m) => s + m.workloadPct, 0) / active.length)
        : 0,
      avgOperationalScore: active.length
        ? Math.round(active.reduce((s, m) => s + m.operationalScore, 0) / active.length)
        : 0,
    },
    health,
    departments: byDept,
    growth: months,
    recommendations: recs,
  });
}
