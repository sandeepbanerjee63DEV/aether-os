import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadStore, type StoredLead } from "@/lib/leads/lead-store";
import { teamStore, type StoredMember, type StoredDepartment } from "@/lib/team/team-store";
import { recordAudit, diff } from "@/lib/team/audit";
import { reassignLead } from "@/lib/assignment/lead-routing";
import { getSession } from "@/lib/auth/jwt";

interface EnrichedOwner {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  title: string | null;
  workloadPct: number;
  operationalScore: number;
  departmentId: string | null;
}

function enrichOwner(member: StoredMember | null): EnrichedOwner | null {
  if (!member) return null;
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    avatar: member.avatar,
    role: member.role,
    title: member.title,
    workloadPct: member.workloadPct,
    operationalScore: member.operationalScore,
    departmentId: member.departmentId,
  };
}

async function enrichLead(lead: StoredLead) {
  const ids = [lead.ownerId, lead.followUpOwnerId, lead.assignedById].filter(
    (x): x is string => !!x,
  );
  const members = await Promise.all(ids.map((id) => teamStore.findMember(id)));
  const map = new Map<string, StoredMember>();
  for (const m of members) if (m) map.set(m.id, m);

  let department: StoredDepartment | null = null;
  if (lead.departmentId) {
    department = await teamStore.findDepartment(lead.departmentId);
  }

  // Assignment trail — pull the most recent LEAD assignment row for this lead.
  const { assignments } = await teamStore.listAssignments({
    entityType: "LEAD",
    limit: 100,
  });
  const trail = assignments
    .filter((a) => a.entityId === lead.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const activeAssignment = trail.find((a) => a.status === "ACTIVE") ?? null;

  return {
    ...lead,
    owner: enrichOwner(lead.ownerId ? map.get(lead.ownerId) ?? null : null),
    followUpOwner: enrichOwner(lead.followUpOwnerId ? map.get(lead.followUpOwnerId) ?? null : null),
    assignedBy: enrichOwner(lead.assignedById ? map.get(lead.assignedById) ?? null : null),
    department: department
      ? { id: department.id, name: department.name, color: department.color, icon: department.icon }
      : null,
    activeAssignment,
    assignmentTrail: trail.slice(0, 10),
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        timeline: { orderBy: { createdAt: "asc" } },
        owner: { select: { id: true, name: true, email: true, avatar: true, role: true, title: true, workloadPct: true, operationalScore: true, departmentId: true } },
      },
    });
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const enriched = await enrichLead(lead as unknown as StoredLead);
    return NextResponse.json({ lead: enriched });
  } catch {
    const lead = await leadStore.findById(id);
    if (!lead) {
      const first = (await leadStore.list({ limit: 1 })).leads[0];
      if (!first) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const enriched = await enrichLead(first);
      return NextResponse.json({ lead: enriched });
    }
    const enriched = await enrichLead(lead);
    return NextResponse.json({ lead: enriched });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const body = (await req.json()) as Partial<StoredLead>;

  // Look up the current state so we can detect ownership changes.
  const before = await leadStore.findById(id);

  // If the caller is changing ownerId via this PATCH endpoint, treat it as a manual reassignment
  // (separate from the explicit /reassign endpoint).
  if (body.ownerId !== undefined && before && body.ownerId !== before.ownerId) {
    const result = await reassignLead({
      lead: before as never,
      previousOwnerId: before.ownerId,
      actorId: session?.sub ?? null,
      strategy: "manual",
      manualAssigneeId: body.ownerId,
      reason: typeof body.assignmentReason === "string" ? body.assignmentReason : "Manual reassignment via PATCH.",
    });
    Object.assign(body, result.patch);
  }

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: body as never,
    });
    return NextResponse.json({ lead });
  } catch {
    const lead = await leadStore.update(id, body);
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Record an audit log for any non-trivial field change.
    if (before) {
      const changes = diff(before, lead);
      const interesting = Object.keys(changes).filter((k) =>
        ["ownerId", "operationalStatus", "stage", "status", "departmentId", "followUpOwnerId"].includes(k),
      );
      if (interesting.length) {
        await recordAudit({
          action: "UPDATE",
          actorId: session?.sub ?? null,
          targetId: lead.ownerId,
          entityType: "LEAD",
          entityId: lead.id,
          summary: `Updated ${lead.company} — ${lead.firstName} ${lead.lastName}`,
          diff: changes,
        });
      }
    }

    return NextResponse.json({ lead });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    const ok = await leadStore.remove(id);
    return NextResponse.json({ success: ok });
  }
}
