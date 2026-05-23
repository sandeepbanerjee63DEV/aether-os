import { NextRequest, NextResponse } from "next/server";
import { teamStore, type BaseRole, type MemberStatus, type AccessLevel } from "@/lib/team/team-store";
import { recordAudit } from "@/lib/team/audit";
import { getSession } from "@/lib/auth/jwt";

const VALID_ROLES: BaseRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "SALES", "SUPPORT", "VIEWER"];
const VALID_STATUSES: MemberStatus[] = ["ACTIVE", "AWAY", "SUSPENDED", "PENDING_INVITE", "INACTIVE"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const status = (searchParams.get("status") || "ALL") as MemberStatus | "ALL";
  const role = (searchParams.get("role") || "ALL") as BaseRole | "ALL";
  const departmentId = searchParams.get("departmentId");
  const sort = (searchParams.get("sort") || "recent") as "recent" | "name" | "workload" | "score";
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const cursor = parseInt(searchParams.get("cursor") || "0", 10);

  const { members, total } = await teamStore.listMembers({
    search,
    status,
    role,
    departmentId,
    sort,
    limit,
    cursor,
  });

  const departments = await teamStore.listDepartments();
  const deptById = new Map(departments.map((d) => [d.id, d]));

  const shaped = members.map((m) => ({
    ...m,
    department: m.departmentId
      ? deptById.get(m.departmentId)
        ? { id: m.departmentId, name: deptById.get(m.departmentId)!.name, color: deptById.get(m.departmentId)!.color }
        : null
      : null,
    activeAssignments: 0, // filled by client when needed
  }));

  return NextResponse.json({ members: shaped, total });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim();
  if (!email || !name) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const existing = await teamStore.findMemberByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "A member with this email already exists" }, { status: 409 });
  }

  const role: BaseRole = VALID_ROLES.includes(body.role as BaseRole) ? (body.role as BaseRole) : "SALES";
  const accessLevel: AccessLevel = ["ADMIN", "MANAGER", "STAFF", "VIEWER"].includes(body.accessLevel as string)
    ? (body.accessLevel as AccessLevel)
    : "STAFF";

  const member = await teamStore.createMember({
    email,
    name,
    role,
    accessLevel,
    title: (body.title as string) || null,
    departmentId: (body.departmentId as string) || null,
    status: "PENDING_INVITE",
    invitedById: session?.sub ?? null,
  });

  await recordAudit({
    action: "INVITE",
    actorId: session?.sub ?? null,
    targetId: member.id,
    entityType: "USER",
    entityId: member.id,
    summary: `Invited ${member.name} as ${role.replace("_", " ")}`,
    diff: null,
    metadata: { email: member.email, accessLevel },
  });

  return NextResponse.json({ member }, { status: 201 });
}
