import { NextRequest, NextResponse } from "next/server";
import { leadStore } from "@/lib/leads/lead-store";
import { teamStore } from "@/lib/team/team-store";
import { routeLead } from "@/lib/assignment/engine";

/**
 * GET /api/leads/[id]/owner-suggestions?strategy=ai
 *
 * Returns the top candidates the Assignment Engine would route this lead to.
 * Used by the lead details panel "Reassign" picker for an AI-driven choice.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const strategy = (searchParams.get("strategy") as "ai" | "workload" | "round_robin" | null) ?? "ai";

  const lead = await leadStore.findById(id);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const snapshot = await teamStore.snapshot();
  const excludeMemberIds = lead.ownerId ? [lead.ownerId] : [];

  const result = routeLead({
    lead: lead as never,
    members: snapshot.members,
    assignments: snapshot.assignments,
    departments: snapshot.departments,
    settings: snapshot.settings,
    strategy,
    excludeMemberIds,
  });

  const currentOwner = lead.ownerId ? await teamStore.findMember(lead.ownerId) : null;

  return NextResponse.json({
    leadId: lead.id,
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
