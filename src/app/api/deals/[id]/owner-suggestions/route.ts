import { NextRequest, NextResponse } from "next/server";
import { dealStore } from "@/lib/deals/deal-store";
import { leadStore } from "@/lib/leads/lead-store";
import { teamStore } from "@/lib/team/team-store";
import { routeDeal } from "@/lib/assignment/engine";

/**
 * GET /api/deals/[id]/owner-suggestions?strategy=ai
 *
 * Returns the top candidates the Assignment Engine would route this deal to.
 * Used by the deal details panel "Reassign" picker for an AI-driven choice.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const strategy =
    (searchParams.get("strategy") as "ai" | "workload" | "round_robin" | null) ?? "ai";

  const deal = await dealStore.findById(id);
  if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

  // Pull continuity hint from the linked lead's owner (if any)
  let continuityOwnerId: string | null = null;
  if (deal.leadId) {
    try {
      const lead = await leadStore.findById(deal.leadId);
      if (lead?.ownerId && lead.ownerId !== deal.ownerId) continuityOwnerId = lead.ownerId;
    } catch {
      /* ignore */
    }
  }

  const snapshot = await teamStore.snapshot();
  const excludeMemberIds = deal.ownerId ? [deal.ownerId] : [];

  const result = routeDeal({
    deal: deal as never,
    members: snapshot.members,
    assignments: snapshot.assignments,
    departments: snapshot.departments,
    settings: snapshot.settings,
    strategy,
    excludeMemberIds,
    continuityOwnerId,
  });

  const currentOwner = deal.ownerId ? await teamStore.findMember(deal.ownerId) : null;

  return NextResponse.json({
    dealId: deal.id,
    currentOwner: currentOwner
      ? {
          id: currentOwner.id,
          name: currentOwner.name,
          avatar: currentOwner.avatar,
          role: currentOwner.role,
          workloadPct: currentOwner.workloadPct,
          operationalScore: currentOwner.operationalScore,
        }
      : null,
    strategy: result.strategy,
    rationale: result.rationale,
    consideredCount: result.consideredCount,
    best: result.best,
    alternatives: result.alternatives,
  });
}
