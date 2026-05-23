import { NextRequest, NextResponse } from "next/server";
import {
  teamStore,
  type AssignmentEntity,
  type AssignmentStatus,
} from "@/lib/team/team-store";
import { scoreAssignmentMatch } from "@/lib/team/ai";
import { recordAudit } from "@/lib/team/audit";
import { getSession } from "@/lib/auth/jwt";

const VALID_ENTITY: AssignmentEntity[] = ["LEAD", "DEAL", "TASK", "PROJECT", "WORKFLOW", "SUPPORT_TICKET"];
const VALID_STATUS: AssignmentStatus[] = ["ACTIVE", "REASSIGNED", "COMPLETED", "ESCALATED", "CANCELLED"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as AssignmentStatus | "ALL" | null;
  const entityType = searchParams.get("entityType") as AssignmentEntity | "ALL" | null;
  const assigneeId = searchParams.get("assigneeId");
  const limit = parseInt(searchParams.get("limit") || "200", 10);

  const { assignments, total } = await teamStore.listAssignments({
    status: status ?? undefined,
    entityType: entityType ?? undefined,
    assigneeId,
    limit,
  });

  const snap = await teamStore.snapshot();
  const byId = new Map(snap.members.map((m) => [m.id, m]));

  const enriched = assignments.map((a) => {
    const m = byId.get(a.assigneeId);
    return {
      ...a,
      assignee: m
        ? { id: m.id, name: m.name, avatar: m.avatar, role: m.role, workloadPct: m.workloadPct }
        : null,
    };
  });

  // AI suggestions: top 3 candidates per entity type
  const settings = await teamStore.getSettings();
  const aiCandidates: Record<string, { id: string; name: string; avatar: string | null; score: number; reason: string }[]> = {};
  for (const entityType of VALID_ENTITY) {
    aiCandidates[entityType] = snap.members
      .filter((m) => m.status === "ACTIVE")
      .map((m) => {
        const r = scoreAssignmentMatch({ candidate: m, entityType, workloadCeiling: settings.workloadCeiling });
        return { id: m.id, name: m.name, avatar: m.avatar, score: r.score, reason: r.reason };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  return NextResponse.json({ assignments: enriched, total, aiCandidates });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const entityType = VALID_ENTITY.includes(body.entityType as AssignmentEntity)
    ? (body.entityType as AssignmentEntity)
    : null;
  const entityId = String(body.entityId || "").trim();
  const entityLabel = String(body.entityLabel || "").trim();
  const assigneeId = String(body.assigneeId || "").trim();

  if (!entityType || !entityId || !entityLabel || !assigneeId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const member = await teamStore.findMember(assigneeId);
  if (!member) return NextResponse.json({ error: "Assignee not found" }, { status: 404 });

  const settings = await teamStore.getSettings();
  const ai = scoreAssignmentMatch({ candidate: member, entityType, workloadCeiling: settings.workloadCeiling });

  const assignment = await teamStore.createAssignment({
    entityType,
    entityId,
    entityLabel,
    assigneeId,
    priority: typeof body.priority === "number" ? (body.priority as number) : 50,
    workloadWeight: typeof body.workloadWeight === "number" ? (body.workloadWeight as number) : 5,
    aiSuggested: Boolean(body.aiSuggested),
    aiReason: (body.aiReason as string) || ai.reason,
    notes: (body.notes as string) || null,
  });

  await recordAudit({
    action: "ASSIGN",
    actorId: session?.sub ?? null,
    targetId: assigneeId,
    entityType: "ASSIGNMENT",
    entityId: assignment.id,
    summary: `Assigned "${entityLabel}" to ${member.name}`,
    metadata: { entityType, aiScore: ai.score },
  });

  return NextResponse.json({ assignment, aiScore: ai.score, aiReason: ai.reason }, { status: 201 });
}

// Silence unused
void VALID_STATUS;
