import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreDeal } from "@/lib/ai/engine";
import { dealStore, type DealStage, type StoredDeal } from "@/lib/deals/deal-store";
import { leadStore } from "@/lib/leads/lead-store";
import { teamStore, type StoredMember, type StoredDepartment } from "@/lib/team/team-store";
import { routeAndPersistDeal } from "@/lib/assignment/deal-routing";
import { getSession } from "@/lib/auth/jwt";

interface CreateDealBody {
  title?: string;
  company?: string;
  contactName?: string;
  value?: number;
  stage?: DealStage;
  probability?: number;
  expectedClose?: string;
  leadId?: string | null;
  // Override the auto-routing flow if the operator manually picks an owner.
  ownerId?: string;
  strategy?: "ai" | "workload" | "round_robin" | "manual";
}

const VALID_STAGES: DealStage[] = [
  "QUALIFICATION",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
];

// ----- Owner enrichment helpers -----------------------------------------

interface EnrichedOwner {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  title: string | null;
  workloadPct: number;
  operationalScore: number;
}

interface EnrichedDepartment {
  id: string;
  name: string;
  color: string;
  icon: string;
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
  };
}

function enrichDepartment(dept: StoredDepartment | null): EnrichedDepartment | null {
  if (!dept) return null;
  return { id: dept.id, name: dept.name, color: dept.color, icon: dept.icon };
}

async function attachOwners<
  T extends {
    ownerId?: string | null;
    assignedById?: string | null;
    departmentId?: string | null;
    supportingDepartmentIds?: string[];
  },
>(
  deals: T[],
): Promise<
  (T & {
    owner: EnrichedOwner | null;
    assignedBy: EnrichedOwner | null;
    department: EnrichedDepartment | null;
    supportingDepartments: EnrichedDepartment[];
  })[]
> {
  if (!deals.length) return [] as never;
  const memberIds = new Set<string>();
  const deptIds = new Set<string>();
  for (const d of deals) {
    if (d.ownerId) memberIds.add(d.ownerId);
    if (d.assignedById) memberIds.add(d.assignedById);
    if (d.departmentId) deptIds.add(d.departmentId);
    for (const id of d.supportingDepartmentIds ?? []) deptIds.add(id);
  }
  const memberMap = new Map<string, StoredMember>();
  await Promise.all(
    Array.from(memberIds).map(async (id) => {
      const m = await teamStore.findMember(id);
      if (m) memberMap.set(id, m);
    }),
  );
  const departments = await teamStore.listDepartments();
  const deptMap = new Map<string, StoredDepartment>(departments.map((d) => [d.id, d]));

  return deals.map((d) => ({
    ...d,
    owner: enrichOwner(d.ownerId ? memberMap.get(d.ownerId) ?? null : null),
    assignedBy: enrichOwner(d.assignedById ? memberMap.get(d.assignedById) ?? null : null),
    department: enrichDepartment(d.departmentId ? deptMap.get(d.departmentId) ?? null : null),
    supportingDepartments: (d.supportingDepartmentIds ?? [])
      .map((id) => deptMap.get(id) ?? null)
      .filter((dept): dept is StoredDepartment => !!dept)
      .map((dept) => enrichDepartment(dept)!)
      .filter(Boolean),
  }));
}

// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const stage = searchParams.get("stage");
  const search = searchParams.get("search");
  const ownerId = searchParams.get("ownerId");

  const stageFilter =
    stage && VALID_STAGES.includes(stage as DealStage) ? (stage as DealStage) : null;

  try {
    const deals = await prisma.deal.findMany({
      where: {
        ...(stageFilter ? { stage: stageFilter } : {}),
        ...(ownerId ? { ownerId } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { company: { contains: search, mode: "insensitive" } },
                { contactName: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { owner: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    const total = await prisma.deal.count();
    const shaped: StoredDeal[] = deals.map((d) => ({
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
    }));
    const enriched = await attachOwners(shaped);
    return NextResponse.json({ deals: enriched, total });
  } catch {
    const { deals, total } = await dealStore.list({
      stage: stageFilter,
      search,
      limit,
    });
    let filtered = deals;
    if (ownerId) filtered = filtered.filter((d) => d.ownerId === ownerId);
    const enriched = await attachOwners(filtered);
    return NextResponse.json({ deals: enriched, total });
  }
}

export async function POST(req: NextRequest) {
  let body: CreateDealBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const session = await getSession();
  const actorId = session?.sub ?? null;

  const stage: DealStage =
    body.stage && VALID_STAGES.includes(body.stage) ? body.stage : "QUALIFICATION";

  const ai = await scoreDeal({
    title: body.title,
    value: body.value,
    stage,
    probability: body.probability,
    expectedClose: body.expectedClose,
    company: body.company,
  });

  // If the deal is being converted from a lead, the lead's owner becomes the
  // continuity-bias for the deal routing engine.
  let continuityOwnerId: string | null = null;
  if (body.leadId) {
    try {
      const lead = await leadStore.findById(body.leadId);
      if (lead?.ownerId) continuityOwnerId = lead.ownerId;
    } catch {
      /* lead lookup is advisory — never block deal creation */
    }
  }

  // Build the deal record (Prisma path first, fall back to memory store).
  let deal: StoredDeal | null = null;
  try {
    const created = await prisma.deal.create({
      data: {
        title: body.title,
        company: body.company || null,
        contactName: body.contactName || null,
        value: body.value ?? 0,
        stage,
        probability: body.probability ?? ai.aiProbability,
        aiProbability: ai.aiProbability,
        aiAnalysis: ai.aiAnalysis,
        nextBestAction: ai.nextBestAction,
        riskLevel: ai.riskLevel,
        expectedClose: body.expectedClose ? new Date(body.expectedClose) : null,
        leadId: body.leadId ?? null,
      },
      include: { owner: { select: { name: true } } },
    });
    await prisma.dealActivity.create({
      data: {
        dealId: created.id,
        type: "create",
        title: `Deal created · ${created.title}`,
        description: ai.aiAnalysis,
        icon: "sparkles",
        color: "purple",
      },
    });
    deal = {
      id: created.id,
      title: created.title,
      company: created.company,
      contactName: created.contactName,
      value: created.value,
      stage: created.stage as DealStage,
      probability: created.probability,
      aiProbability: created.aiProbability,
      aiAnalysis: created.aiAnalysis,
      nextBestAction: created.nextBestAction,
      riskLevel: created.riskLevel,
      expectedClose: created.expectedClose?.toISOString() ?? null,
      leadId: created.leadId,
      ownerId: created.ownerId,
      ownerName: created.owner?.name ?? null,
      assignedById: created.assignedById,
      assignmentType: created.assignmentType as StoredDeal["assignmentType"],
      assignmentReason: created.assignmentReason,
      assignedAt: created.assignedAt?.toISOString() ?? null,
      departmentId: created.departmentId,
      supportingDepartmentIds: created.supportingDepartmentIds ?? [],
      operationalStatus: created.operationalStatus as StoredDeal["operationalStatus"],
      lastActivityAt: created.lastActivityAt?.toISOString() ?? null,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  } catch (err) {
    console.warn("Prisma unavailable for deal create, using file store:", (err as Error).message);
    try {
      deal = await dealStore.create({
        title: body.title,
        company: body.company || null,
        contactName: body.contactName || null,
        value: body.value ?? 0,
        stage,
        probability: body.probability ?? ai.aiProbability,
        aiProbability: ai.aiProbability,
        aiAnalysis: ai.aiAnalysis,
        nextBestAction: ai.nextBestAction,
        riskLevel: ai.riskLevel,
        expectedClose: body.expectedClose ?? null,
        leadId: body.leadId ?? null,
        ownerId: null,
        ownerName: null,
      });
    } catch (fallbackErr) {
      console.error("Deal create fallback failed:", fallbackErr);
      return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
    }
  }

  if (!deal) {
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
  }

  // -------------------------------------------------------------------------
  // ASSIGNMENT ENGINE — route the new deal to an execution owner.
  // -------------------------------------------------------------------------
  const settings = await teamStore.getSettings();
  const wantsManual = body.strategy === "manual" || !!body.ownerId;
  let routingResult: Awaited<ReturnType<typeof routeAndPersistDeal>> | null = null;

  if (wantsManual && body.ownerId) {
    routingResult = await routeAndPersistDeal({
      deal: deal as never,
      actorId,
      strategy: "manual",
      manualAssigneeId: body.ownerId,
      continuityOwnerId,
    });
  } else if (settings.autoAssignmentEnabled) {
    routingResult = await routeAndPersistDeal({
      deal: deal as never,
      actorId,
      strategy: body.strategy ?? settings.autoAssignmentStrategy,
      continuityOwnerId,
    });
  }

  // Apply the routing patch back to the deal (both Prisma and memory paths).
  if (routingResult && Object.keys(routingResult.patch).length) {
    try {
      const updated = await prisma.deal.update({
        where: { id: deal.id },
        data: {
          ownerId: routingResult.patch.ownerId ?? null,
          assignedById: routingResult.patch.assignedById ?? null,
          assignmentType: routingResult.patch.assignmentType as never,
          assignmentReason: routingResult.patch.assignmentReason ?? null,
          assignedAt: routingResult.patch.assignedAt
            ? new Date(routingResult.patch.assignedAt)
            : null,
          departmentId: routingResult.patch.departmentId ?? null,
          supportingDepartmentIds: routingResult.patch.supportingDepartmentIds ?? [],
          operationalStatus: routingResult.patch.operationalStatus as never,
          lastActivityAt: routingResult.patch.lastActivityAt
            ? new Date(routingResult.patch.lastActivityAt)
            : null,
        },
        include: { owner: { select: { name: true } } },
      });
      deal = {
        ...deal,
        ownerId: updated.ownerId,
        ownerName: updated.owner?.name ?? routingResult.patch.ownerName ?? null,
        assignedById: updated.assignedById,
        assignmentType: updated.assignmentType as StoredDeal["assignmentType"],
        assignmentReason: updated.assignmentReason,
        assignedAt: updated.assignedAt?.toISOString() ?? null,
        departmentId: updated.departmentId,
        supportingDepartmentIds: updated.supportingDepartmentIds ?? [],
        operationalStatus: updated.operationalStatus as StoredDeal["operationalStatus"],
        lastActivityAt: updated.lastActivityAt?.toISOString() ?? null,
        updatedAt: updated.updatedAt.toISOString(),
      };
    } catch {
      const memoryUpdated = await dealStore.update(deal.id, routingResult.patch);
      if (memoryUpdated) deal = memoryUpdated;
    }
  }

  const [enriched] = await attachOwners([deal]);

  return NextResponse.json(
    {
      deal: enriched,
      routing: routingResult
        ? {
            strategy: routingResult.routing.strategy,
            best: routingResult.routing.best,
            alternatives: routingResult.routing.alternatives,
            rationale: routingResult.routing.rationale,
            consideredCount: routingResult.routing.consideredCount,
          }
        : null,
    },
    { status: 201 },
  );
}
