import { NextResponse } from "next/server";
import { teamStore } from "@/lib/team/team-store";

export async function GET() {
  const snap = await teamStore.snapshot();

  const active = snap.members.filter((m) => m.status === "ACTIVE");

  const roleDist = ["SUPER_ADMIN", "ADMIN", "MANAGER", "SALES", "SUPPORT", "VIEWER"].map((role) => ({
    role,
    count: snap.members.filter((m) => m.role === role).length,
  }));

  const statusDist = ["ACTIVE", "AWAY", "SUSPENDED", "PENDING_INVITE", "INACTIVE"].map((status) => ({
    status,
    count: snap.members.filter((m) => m.status === status).length,
  }));

  const utilization = active.map((m) => ({
    id: m.id,
    name: m.name,
    avatar: m.avatar,
    workloadPct: m.workloadPct,
    operationalScore: m.operationalScore,
    departmentId: m.departmentId,
    activeAssignments: snap.assignments.filter(
      (a) => a.assigneeId === m.id && a.status === "ACTIVE"
    ).length,
  }));

  // Top performers by operational score (active only)
  const top = [...active]
    .sort((a, b) => b.operationalScore - a.operationalScore)
    .slice(0, 5)
    .map((m) => ({
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      title: m.title,
      operationalScore: m.operationalScore,
      workloadPct: m.workloadPct,
    }));

  return NextResponse.json({
    roleDistribution: roleDist,
    statusDistribution: statusDist,
    utilization,
    topPerformers: top,
  });
}
