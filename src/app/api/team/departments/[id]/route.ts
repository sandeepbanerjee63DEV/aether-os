import { NextRequest, NextResponse } from "next/server";
import { teamStore, type StoredDepartment } from "@/lib/team/team-store";
import { recordAudit } from "@/lib/team/audit";
import { getSession } from "@/lib/auth/jwt";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  let body: Partial<StoredDepartment>;
  try {
    body = (await req.json()) as Partial<StoredDepartment>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const dept = await teamStore.updateDepartment(id, body);
  if (!dept) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await recordAudit({
    action: "UPDATE",
    actorId: session?.sub ?? null,
    targetId: null,
    entityType: "DEPARTMENT",
    entityId: id,
    summary: `Updated department "${dept.name}"`,
  });
  return NextResponse.json({ department: dept });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const dept = await teamStore.findDepartment(id);
  if (!dept) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const ok = await teamStore.removeDepartment(id);
  if (!ok) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  await recordAudit({
    action: "DELETE",
    actorId: session?.sub ?? null,
    targetId: null,
    entityType: "DEPARTMENT",
    entityId: id,
    summary: `Deleted department "${dept.name}"`,
  });
  return NextResponse.json({ ok: true });
}
