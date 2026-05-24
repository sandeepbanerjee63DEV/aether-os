import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyLead } from "@/lib/ai/engine";
import { leadStore, type StoredLead } from "@/lib/leads/lead-store";
import { teamStore, type StoredMember } from "@/lib/team/team-store";
import { routeAndPersist } from "@/lib/assignment/lead-routing";
import { getSession } from "@/lib/auth/jwt";

interface CreateLeadBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  phone?: string;
  website?: string;
  source?: string;
  leadType?: string;
  value?: string;
  location?: string;
  // Override the auto-routing flow if the operator manually picks an owner.
  ownerId?: string;
  strategy?: "ai" | "workload" | "round_robin" | "manual";
}

// ----- Owner enrichment helpers ------------------------------------------

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

async function attachOwners<T extends { ownerId?: string | null; followUpOwnerId?: string | null; assignedById?: string | null }>(
  leads: T[],
): Promise<(T & { owner: EnrichedOwner | null; followUpOwner: EnrichedOwner | null; assignedBy: EnrichedOwner | null })[]> {
  if (!leads.length) return [] as never;
  const memberIds = new Set<string>();
  for (const l of leads) {
    if (l.ownerId) memberIds.add(l.ownerId);
    if (l.followUpOwnerId) memberIds.add(l.followUpOwnerId);
    if (l.assignedById) memberIds.add(l.assignedById);
  }
  const memberMap = new Map<string, StoredMember>();
  await Promise.all(
    Array.from(memberIds).map(async (id) => {
      const m = await teamStore.findMember(id);
      if (m) memberMap.set(id, m);
    }),
  );
  return leads.map((l) => ({
    ...l,
    owner: enrichOwner(l.ownerId ? memberMap.get(l.ownerId) ?? null : null),
    followUpOwner: enrichOwner(l.followUpOwnerId ? memberMap.get(l.followUpOwnerId) ?? null : null),
    assignedBy: enrichOwner(l.assignedById ? memberMap.get(l.assignedById) ?? null : null),
  }));
}

// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const ownerId = searchParams.get("ownerId");

  try {
    const leads = await prisma.lead.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(ownerId ? { ownerId } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { company: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    const total = await prisma.lead.count();
    const enriched = await attachOwners(leads as unknown as StoredLead[]);
    return NextResponse.json({ leads: enriched, total });
  } catch {
    const { leads, total } = await leadStore.list({ limit, status, search });
    let filtered = leads;
    if (ownerId) filtered = filtered.filter((l) => l.ownerId === ownerId);
    const enriched = await attachOwners(filtered);
    return NextResponse.json({ leads: enriched, total });
  }
}

export async function POST(req: NextRequest) {
  let body: CreateLeadBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.firstName || !body.lastName || !body.email || !body.company) {
    return NextResponse.json(
      { error: "First name, last name, email, and company are required" },
      { status: 400 },
    );
  }

  const session = await getSession();
  const actorId = session?.sub ?? null;

  const ai = await classifyLead(body);
  const status = ai.score >= 80 ? "HOT" : "AI_CLASSIFIED";

  // Build the lead record (Prisma path first, fall back to memory store).
  let lead: StoredLead | null = null;
  try {
    const created = await prisma.lead.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || null,
        company: body.company,
        website: body.website || null,
        source: body.source || "Website",
        leadType: body.leadType || null,
        value: body.value || "Medium",
        location: body.location || null,
        aiScore: ai.score,
        aiClassification: ai.classification,
        aiAnalysis: ai.analysis,
        nextBestAction: ai.nextBestAction,
        convertProbability: ai.convertProbability,
        tags: ai.tags,
        status: status as never,
        stage: "AI_CLASSIFICATION",
      },
    });
    await prisma.timelineEvent.createMany({
      data: [
        { leadId: created.id, title: `Lead captured via ${created.source}`, icon: "globe", color: "purple" },
        { leadId: created.id, title: "AI classified and scored", icon: "brain", color: "blue" },
      ],
    });
    lead = created as unknown as StoredLead;
  } catch (err) {
    console.warn("Prisma unavailable for lead create, using file store:", (err as Error).message);
    try {
      lead = await leadStore.create({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || null,
        company: body.company,
        website: body.website || null,
        source: body.source || "Website",
        leadType: body.leadType || null,
        value: body.value || "Medium",
        location: body.location || null,
        status,
        stage: "AI_CLASSIFICATION",
        aiScore: ai.score,
        aiClassification: ai.classification,
        aiAnalysis: ai.analysis,
        nextBestAction: ai.nextBestAction,
        convertProbability: ai.convertProbability,
        tags: ai.tags,
      });
    } catch (fallbackErr) {
      console.error("Lead create fallback failed:", fallbackErr);
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
    }
  }

  if (!lead) {
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }

  // -------------------------------------------------------------------------
  // ASSIGNMENT ENGINE — route the new lead to an execution owner.
  // -------------------------------------------------------------------------
  const settings = await teamStore.getSettings();
  const wantsManual = body.strategy === "manual" || !!body.ownerId;
  let routingResult: Awaited<ReturnType<typeof routeAndPersist>> | null = null;

  if (wantsManual && body.ownerId) {
    routingResult = await routeAndPersist({
      lead: lead as never,
      actorId,
      strategy: "manual",
      manualAssigneeId: body.ownerId,
    });
  } else if (settings.autoAssignmentEnabled) {
    routingResult = await routeAndPersist({
      lead: lead as never,
      actorId,
      strategy: body.strategy ?? settings.autoAssignmentStrategy,
    });
  }

  // Apply the routing patch back to the lead (both Prisma and memory paths).
  if (routingResult && Object.keys(routingResult.patch).length) {
    try {
      const updated = await prisma.lead.update({
        where: { id: lead.id },
        data: {
          ownerId: routingResult.patch.ownerId ?? null,
          assignedById: routingResult.patch.assignedById ?? null,
          assignmentType: routingResult.patch.assignmentType as never,
          assignmentReason: routingResult.patch.assignmentReason ?? null,
          assignedAt: routingResult.patch.assignedAt ? new Date(routingResult.patch.assignedAt) : null,
          departmentId: routingResult.patch.departmentId ?? null,
          followUpOwnerId: routingResult.patch.followUpOwnerId ?? null,
          operationalStatus: routingResult.patch.operationalStatus as never,
          stage: "ASSIGNED",
          status: "ASSIGNED" as never,
        },
      });
      lead = updated as unknown as StoredLead;
    } catch {
      const memoryUpdated = await leadStore.update(lead.id, {
        ...routingResult.patch,
        stage: "ASSIGNED",
        status: "ASSIGNED",
      });
      if (memoryUpdated) lead = memoryUpdated;
    }
  }

  const [enriched] = await attachOwners([lead]);

  return NextResponse.json(
    {
      lead: enriched,
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
