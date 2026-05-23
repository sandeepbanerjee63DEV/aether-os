import { NextRequest, NextResponse } from "next/server";
import { teamStore, type BaseRole } from "@/lib/team/team-store";
import { recordAudit } from "@/lib/team/audit";
import { getSession } from "@/lib/auth/jwt";
import { listPermissionsForRole, permissionGrid, type PermissionKey } from "@/lib/team/permissions";

const VALID_BASE: BaseRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "SALES", "SUPPORT", "VIEWER"];

export async function GET() {
  const roles = await teamStore.listRoles();
  const members = (await teamStore.snapshot()).members;

  const enriched = roles.map((r) => ({
    ...r,
    memberCount: members.filter((m) => m.role === r.baseRole || m.customRoleId === r.id).length,
    effectivePermissions: r.permissions.length ? r.permissions : listPermissionsForRole(r.baseRole),
    grid: permissionGrid(r.baseRole),
  }));

  return NextResponse.json({ roles: enriched });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const key = String(body.key || name.toLowerCase().replace(/[^a-z0-9]+/g, "_")).trim();
  if (!name || !key) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const baseRole: BaseRole = VALID_BASE.includes(body.baseRole as BaseRole)
    ? (body.baseRole as BaseRole)
    : "SALES";

  const role = await teamStore.createRole({
    name,
    key,
    description: (body.description as string) || null,
    baseRole,
    color: (body.color as string) || "indigo",
    icon: (body.icon as string) || "shield",
    rank: typeof body.rank === "number" ? (body.rank as number) : 50,
    permissions: Array.isArray(body.permissions) ? (body.permissions as PermissionKey[]) : [],
    denies: Array.isArray(body.denies) ? (body.denies as PermissionKey[]) : [],
  });

  await recordAudit({
    action: "CREATE",
    actorId: session?.sub ?? null,
    targetId: null,
    entityType: "ROLE",
    entityId: role.id,
    summary: `Created custom role "${role.name}" (base ${role.baseRole.replace("_", " ")})`,
  });

  return NextResponse.json({ role }, { status: 201 });
}
