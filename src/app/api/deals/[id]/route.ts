import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dealStore, type DealStage, type StoredDeal } from "@/lib/deals/deal-store";
import {
  teamStore,
  type StoredMember,
  type StoredDepartment,
} from "@/lib/team/team-store";
import { recordAudit, diff } from "@/lib/team/audit";
import { reassignDeal } from "@/lib/assignment/deal-routing";
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

function enrichDept(d: StoredDepartment | null) {
  if (!d) return null;
  return { id: d.id, name: d.name, color: d.color, icon: d.icon };
}

async function enrichDeal(deal: StoredDeal) {
  const ids = [deal.ownerId, deal.assignedById].filter((x): x is string => !!x);
  const members = await Promise.all(ids.map((id) => teamStore.findMember(id)));
  const map = new Map<string, StoredMember>();
  for (const m of members) if (m) map.set(m.id, m);

  const departments = await teamStore.listDepartments();
  const deptMap = new Map(departments.map((d) => [d.id, d]));
  const department = deal.departmentId ? deptMap.get(deal.departmentId) ?? null : null;
  const supportingDepartments = (deal.supportingDepartmentIds ?? [])
    .map((id) => deptMap.get(id) ?? null)
    .filter((d): d is StoredDepartment => !!d);

  // Assignment trail — pull the most recent DEAL assignment row for this deal.
  const { assignments } = await teamStore.listAssignments({
    entityType: "DEAL",
    limit: 100,
  });
  const trail = assignments
    .filter((a) => a.entityId === deal.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const activeAssignment = trail.find((a) => a.status === "ACTIVE") ?? null;

  return {
    ...deal,
    owner: enrichOwner(deal.ownerId ? map.get(deal.ownerId) ?? null : null),
    assignedBy: enrichOwner(deal.assignedById ? map.get(deal.assignedById) ?? null : null),
    department: enrichDept(department),
    supportingDepartments: supportingDepartments.map((d) => enrichDept(d)!).filter(Boolean),
    activeAssignment,
    assignmentTrail: trail.slice(0, 10),
  };
}

function shapeDeal(d: {
  id: string;
  title: string;
  company: string | null;
  contactName: string | null;
  value: number;
  stage: string;
  probability: number;
  aiProbability: number | null;
  aiAnalysis: string | null;
  nextBestAction: string | null;
  riskLevel: string | null;
  expectedClose: Date | null;
  leadId: string | null;
  ownerId: string | null;
  assignedById: string | null;
  assignmentType: string;
  assignmentReason: string | null;
  assignedAt: Date | null;
  departmentId: string | null;
  supportingDepartmentIds: string[];
  operationalStatus: string;
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  owner?: { name: string } | null;
}): StoredDeal {
  return {
    id: d.id,
    title: d.title,
    company: d.company,
    contactName: d.contactName,
    value: d.value,
    stage: d.stage as DealStage,
    probability: d.probability,
    aiProbability: d.aiProbability,
    aiAnalysis: d.aiAnalysis,
    nextBestAction: d.nextBestAction,
    riskLevel: d.riskLevel,
    expectedClose: d.expectedClose?.toISOString() ?? null,
    leadId: d.leadId,
    ownerId: d.ownerId,
    ownerName: d.owner?.name ?? null,
    assignedById: d.assignedById,
    assignmentType: d.assignmentType as StoredDeal["assignmentType"],
    assignmentReason: d.assignmentReason,
    assignedAt: d.assignedAt?.toISOString() ?? null,
    departmentId: d.departmentId,
    supportingDepartmentIds: d.supportingDepartmentIds ?? [],
    operationalStatus: d.operationalStatus as StoredDeal["operationalStatus"],
    lastActivityAt: d.lastActivityAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { owner: { select: { name: true } } },
    });
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const enriched = await enrichDeal(shapeDeal(deal));
    return NextResponse.json({ deal: enriched });
  } catch {
    const deal = await dealStore.findById(id);
    if (!deal) {
      const first = (await dealStore.list({ limit: 1 })).deals[0];
      if (!first) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const enriched = await enrichDeal(first);
      return NextResponse.json({ deal: enriched });
    }
    const enriched = await enrichDeal(deal);
    return NextResponse.json({ deal: enriched });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const body = (await req.json()) as Partial<StoredDeal>;

  // Look up the current state so we can detect ownership changes.
  const before = await dealStore.findById(id);

  // If the caller is changing ownerId via this PATCH endpoint, treat it as a
  // manual reassignment (separate from the explicit /reassign endpoint).
  if (body.ownerId !== undefined && before && body.ownerId !== before.ownerId) {
    const result = await reassignDeal({
      deal: before as never,
      previousOwnerId: before.ownerId,
      actorId: session?.sub ?? null,
      strategy: "manual",
      manualAssigneeId: body.ownerId,
      reason:
        typeof body.assignmentReason === "string"
          ? body.assignmentReason
          : "Manual reassignment via PATCH.",
    });
    Object.assign(body, result.patch);
  }

  try {
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.company !== undefined) data.company = body.company;
    if (body.contactName !== undefined) data.contactName = body.contactName;
    if (body.value !== undefined) data.value = Number(body.value);
    if (body.stage !== undefined) data.stage = body.stage;
    if (body.probability !== undefined) data.probability = Number(body.probability);
    if (body.expectedClose !== undefined) {
      data.expectedClose = body.expectedClose ? new Date(body.expectedClose) : null;
    }
    if (body.aiAnalysis !== undefined) data.aiAnalysis = body.aiAnalysis;
    if (body.nextBestAction !== undefined) data.nextBestAction = body.nextBestAction;
    if (body.riskLevel !== undefined) data.riskLevel = body.riskLevel;
    if (body.ownerId !== undefined) data.ownerId = body.ownerId;
    if (body.assignedById !== undefined) data.assignedById = body.assignedById;
    if (body.assignmentType !== undefined) data.assignmentType = body.assignmentType;
    if (body.assignmentReason !== undefined) data.assignmentReason = body.assignmentReason;
    if (body.assignedAt !== undefined) {
      data.assignedAt = body.assignedAt ? new Date(body.assignedAt) : null;
    }
    if (body.departmentId !== undefined) data.departmentId = body.departmentId;
    if (body.supportingDepartmentIds !== undefined) {
      data.supportingDepartmentIds = body.supportingDepartmentIds;
    }
    if (body.operationalStatus !== undefined) data.operationalStatus = body.operationalStatus;
    if (body.lastActivityAt !== undefined) {
      data.lastActivityAt = body.lastActivityAt ? new Date(body.lastActivityAt) : null;
    }

    const prevDeal = await prisma.deal.findUnique({ where: { id } });
    const deal = await prisma.deal.update({
      where: { id },
      data,
      include: { owner: { select: { name: true } } },
    });
    if (body.stage && prevDeal && prevDeal.stage !== body.stage) {
      await prisma.dealActivity.create({
        data: {
          dealId: id,
          type: "stage",
          title: `Moved to ${body.stage}`,
          description: `From ${prevDeal.stage}`,
          icon: "trending-up",
          color: "orange",
        },
      });
    }
    return NextResponse.json({ deal: shapeDeal(deal) });
  } catch {
    const deal = await dealStore.update(id, body);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Record an audit log for any non-trivial field change.
    if (before) {
      const changes = diff(before, deal);
      const interesting = Object.keys(changes).filter((k) =>
        ["ownerId", "operationalStatus", "stage", "departmentId", "supportingDepartmentIds"].includes(
          k,
        ),
      );
      if (interesting.length) {
        await recordAudit({
          action: "UPDATE",
          actorId: session?.sub ?? null,
          targetId: deal.ownerId,
          entityType: "DEAL",
          entityId: deal.id,
          summary: `Updated ${deal.title}`,
          diff: changes,
        });
      }
    }

    return NextResponse.json({ deal });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.deal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    const ok = await dealStore.remove(id);
    return NextResponse.json({ success: ok });
  }
}
