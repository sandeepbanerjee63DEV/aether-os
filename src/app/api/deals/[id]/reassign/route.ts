import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dealStore } from "@/lib/deals/deal-store";
import { reassignDeal } from "@/lib/assignment/deal-routing";
import { getSession } from "@/lib/auth/jwt";

interface ReassignBody {
  strategy?: "ai" | "manual" | "workload" | "round_robin";
  assigneeId?: string;
  reason?: string;
  excludeMemberIds?: string[];
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  let body: ReassignBody = {};
  try {
    body = (await req.json()) as ReassignBody;
  } catch {
    /* allow empty body — AI-reroute is the implicit default */
  }

  const deal = await dealStore.findById(id);
  if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

  const strategy = body.strategy ?? (body.assigneeId ? "manual" : "ai");

  const result = await reassignDeal({
    deal: deal as never,
    previousOwnerId: deal.ownerId,
    actorId: session?.sub ?? null,
    strategy,
    manualAssigneeId: body.assigneeId ?? null,
    reason: body.reason ?? null,
    excludeMemberIds: body.excludeMemberIds,
  });

  if (!result.routing.best) {
    return NextResponse.json(
      {
        error: "No eligible owner found",
        rationale: result.routing.rationale,
        consideredCount: result.routing.consideredCount,
      },
      { status: 422 },
    );
  }

  // Apply the patch — Prisma first, fall back to memory.
  try {
    await prisma.deal.update({
      where: { id },
      data: {
        ownerId: result.patch.ownerId ?? null,
        assignedById: result.patch.assignedById ?? null,
        assignmentType: result.patch.assignmentType as never,
        assignmentReason: result.patch.assignmentReason ?? null,
        assignedAt: result.patch.assignedAt ? new Date(result.patch.assignedAt) : null,
        departmentId: result.patch.departmentId ?? null,
        supportingDepartmentIds: result.patch.supportingDepartmentIds ?? [],
        operationalStatus: result.patch.operationalStatus as never,
        lastActivityAt: result.patch.lastActivityAt ? new Date(result.patch.lastActivityAt) : null,
      },
    });
  } catch {
    await dealStore.update(id, result.patch);
  }

  return NextResponse.json({
    deal: { ...deal, ...result.patch },
    routing: result.routing,
    assignment: result.assignment,
  });
}
