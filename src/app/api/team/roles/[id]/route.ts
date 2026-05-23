import { NextRequest, NextResponse } from "next/server";
import { teamStore, type StoredRoleDefinition } from "@/lib/team/team-store";
import { recordAudit } from "@/lib/team/audit";
import { getSession } from "@/lib/auth/jwt";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  let body: Partial<StoredRoleDefinition>;
  try {
    body = (await req.json()) as Partial<StoredRoleDefinition>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const role = await teamStore.updateRole(id, body);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await recordAudit({
    action: "UPDATE",
    actorId: session?.sub ?? null,
    targetId: null,
    entityType: "ROLE",
    entityId: id,
    summary: `Updated role "${role.name}"`,
  });

  return NextResponse.json({ role });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const role = await teamStore.findRole(id);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role.isSystem) {
    return NextResponse.json({ error: "System roles cannot be deleted" }, { status: 400 });
  }
  const ok = await teamStore.removeRole(id);
  if (!ok) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  await recordAudit({
    action: "DELETE",
    actorId: session?.sub ?? null,
    targetId: null,
    entityType: "ROLE",
    entityId: id,
    summary: `Deleted role "${role.name}"`,
  });
  return NextResponse.json({ ok: true });
}
