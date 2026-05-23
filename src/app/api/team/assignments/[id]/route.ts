import { NextRequest, NextResponse } from "next/server";
import { teamStore, type StoredAssignment } from "@/lib/team/team-store";
import { recordAudit } from "@/lib/team/audit";
import { getSession } from "@/lib/auth/jwt";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  let body: Partial<StoredAssignment>;
  try {
    body = (await req.json()) as Partial<StoredAssignment>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { assignments } = await teamStore.listAssignments({ limit: 1000 });
  const before = assignments.find((a) => a.id === id);
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.assigneeId && body.assigneeId !== before.assigneeId) {
    body.reassignedFromId = before.assigneeId;
    body.reassignedById = session?.sub ?? null;
    body.status = "REASSIGNED";
  }

  const next = await teamStore.updateAssignment(id, body);
  if (!next) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  if (body.assigneeId && body.assigneeId !== before.assigneeId) {
    const newOwner = await teamStore.findMember(body.assigneeId);
    const oldOwner = await teamStore.findMember(before.assigneeId);
    await recordAudit({
      action: "ASSIGN",
      actorId: session?.sub ?? null,
      targetId: body.assigneeId,
      entityType: "ASSIGNMENT",
      entityId: id,
      summary: `Reassigned "${before.entityLabel}" from ${oldOwner?.name ?? "previous owner"} to ${newOwner?.name ?? "new owner"}`,
      metadata: { from: before.assigneeId, to: body.assigneeId },
    });
  } else if (body.status && body.status !== before.status) {
    await recordAudit({
      action: "UPDATE",
      actorId: session?.sub ?? null,
      targetId: null,
      entityType: "ASSIGNMENT",
      entityId: id,
      summary: `Marked "${before.entityLabel}" as ${body.status}`,
    });
  }

  return NextResponse.json({ assignment: next });
}
