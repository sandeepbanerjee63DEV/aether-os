import { NextRequest, NextResponse } from "next/server";
import { teamStore } from "@/lib/team/team-store";
import { recordAudit } from "@/lib/team/audit";
import { getSession } from "@/lib/auth/jwt";

export async function GET() {
  const departments = await teamStore.listDepartments();
  const snap = await teamStore.snapshot();

  const enriched = departments.map((d) => {
    const members = snap.members.filter((m) => m.departmentId === d.id);
    const active = members.filter((m) => m.status === "ACTIVE");
    const avgLoad = active.length ? active.reduce((s, m) => s + m.workloadPct, 0) / active.length : 0;
    const avgScore = active.length ? active.reduce((s, m) => s + m.operationalScore, 0) / active.length : 0;
    const lead = d.leadId ? snap.members.find((m) => m.id === d.leadId) ?? null : null;
    return {
      ...d,
      memberCount: members.length,
      activeCount: active.length,
      avgWorkload: Math.round(avgLoad),
      avgOperationalScore: Math.round(avgScore),
      capacityUsed: Math.round((members.length / Math.max(1, d.capacity)) * 100),
      lead: lead ? { id: lead.id, name: lead.name, avatar: lead.avatar, title: lead.title } : null,
      members: active.slice(0, 8).map((m) => ({ id: m.id, name: m.name, avatar: m.avatar })),
    };
  });

  return NextResponse.json({ departments: enriched });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const dept = await teamStore.createDepartment({
    name,
    description: (body.description as string) || null,
    color: (body.color as string) || "indigo",
    icon: (body.icon as string) || "briefcase",
    leadId: (body.leadId as string) || null,
    capacity: typeof body.capacity === "number" ? (body.capacity as number) : 10,
  });

  await recordAudit({
    action: "CREATE",
    actorId: session?.sub ?? null,
    targetId: null,
    entityType: "DEPARTMENT",
    entityId: dept.id,
    summary: `Created department "${dept.name}"`,
  });

  return NextResponse.json({ department: dept }, { status: 201 });
}
