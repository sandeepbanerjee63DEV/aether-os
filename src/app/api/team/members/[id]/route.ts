import { NextRequest, NextResponse } from "next/server";
import { teamStore, type StoredMember } from "@/lib/team/team-store";
import { recordAudit, diff } from "@/lib/team/audit";
import { getSession } from "@/lib/auth/jwt";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await teamStore.findMember(id);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const departments = await teamStore.listDepartments();
  const department = member.departmentId ? departments.find((d) => d.id === member.departmentId) ?? null : null;

  const sessions = await teamStore.listSessions({ userId: id });
  const devices = await teamStore.listDevices(id);
  const accessLogs = await teamStore.listAccessLogs({ userId: id, limit: 10 });
  const { assignments } = await teamStore.listAssignments({ assigneeId: id, limit: 20 });

  return NextResponse.json({
    member,
    department,
    sessions,
    devices,
    accessLogs,
    assignments,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  let body: Partial<StoredMember>;
  try {
    body = (await req.json()) as Partial<StoredMember>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const before = await teamStore.findMember(id);
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const after = await teamStore.updateMember(id, body);
  if (!after) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  const changes = diff(before, after);
  const interestingKeys = ["role", "status", "departmentId", "accessLevel", "title", "name", "twoFactorEnabled"];
  const interesting = Object.keys(changes).filter((k) => interestingKeys.includes(k));

  if (interesting.length) {
    let action: "ROLE_CHANGE" | "DEPARTMENT_CHANGE" | "SUSPEND" | "RESTORE" | "UPDATE" = "UPDATE";
    let summary = `Updated ${after.name}`;
    if (changes.role) {
      action = "ROLE_CHANGE";
      summary = `Changed ${after.name}'s role to ${after.role.replace("_", " ")}`;
    } else if (changes.departmentId) {
      action = "DEPARTMENT_CHANGE";
      summary = `Moved ${after.name} to a new department`;
    } else if (changes.status) {
      if (after.status === "SUSPENDED" || after.status === "INACTIVE") {
        action = "SUSPEND";
        summary = `Set ${after.name} to ${after.status}`;
      } else if (before.status === "SUSPENDED" && after.status === "ACTIVE") {
        action = "RESTORE";
        summary = `Restored ${after.name} to ACTIVE`;
      } else {
        summary = `Updated ${after.name}'s status to ${after.status}`;
      }
    }
    await recordAudit({
      action,
      actorId: session?.sub ?? null,
      targetId: id,
      entityType: "USER",
      entityId: id,
      summary,
      diff: changes,
    });
  }

  return NextResponse.json({ member: after });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const member = await teamStore.findMember(id);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await teamStore.removeMember(id);
  if (!ok) return NextResponse.json({ error: "Delete failed" }, { status: 500 });

  await recordAudit({
    action: "DELETE",
    actorId: session?.sub ?? null,
    targetId: id,
    entityType: "USER",
    entityId: id,
    summary: `Removed ${member.name} from the workspace`,
  });

  return NextResponse.json({ ok: true });
}
