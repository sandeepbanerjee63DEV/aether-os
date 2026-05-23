import { NextRequest, NextResponse } from "next/server";
import { teamStore, type BaseRole, type AccessLevel } from "@/lib/team/team-store";
import { recordAudit } from "@/lib/team/audit";
import { getSession } from "@/lib/auth/jwt";

const VALID_ROLES: BaseRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "SALES", "SUPPORT", "VIEWER"];

interface InviteBody {
  invitees?: { email: string; name?: string; role?: BaseRole; departmentId?: string; accessLevel?: AccessLevel }[];
  email?: string;
  name?: string;
  role?: BaseRole;
  departmentId?: string;
  accessLevel?: AccessLevel;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  let body: InviteBody;
  try {
    body = (await req.json()) as InviteBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const settings = await teamStore.getSettings();
  const invitees =
    body.invitees && Array.isArray(body.invitees)
      ? body.invitees
      : body.email
      ? [{ email: body.email, name: body.name, role: body.role, departmentId: body.departmentId, accessLevel: body.accessLevel }]
      : [];

  if (!invitees.length) {
    return NextResponse.json({ error: "No invitees provided" }, { status: 400 });
  }

  const created: { email: string; name: string; id: string }[] = [];
  const skipped: { email: string; reason: string }[] = [];

  for (const i of invitees) {
    const email = String(i.email || "").trim().toLowerCase();
    if (!email) {
      skipped.push({ email: String(i.email ?? ""), reason: "Missing email" });
      continue;
    }
    if (settings.emailDomainWhitelist.length) {
      const domain = email.split("@")[1];
      if (domain && !settings.emailDomainWhitelist.includes(domain)) {
        skipped.push({ email, reason: `Domain ${domain} not on whitelist` });
        continue;
      }
    }
    const existing = await teamStore.findMemberByEmail(email);
    if (existing) {
      skipped.push({ email, reason: "Already a member" });
      continue;
    }
    const role: BaseRole = VALID_ROLES.includes(i.role as BaseRole) ? (i.role as BaseRole) : "SALES";
    const name = (i.name && i.name.trim()) || email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const m = await teamStore.createMember({
      email,
      name,
      role,
      accessLevel: i.accessLevel ?? settings.defaultAccessLevel,
      title: null,
      departmentId: i.departmentId ?? settings.defaultDepartmentId,
      status: "PENDING_INVITE",
      invitedById: session?.sub ?? null,
    });
    created.push({ email, name, id: m.id });
    await recordAudit({
      action: "INVITE",
      actorId: session?.sub ?? null,
      targetId: m.id,
      entityType: "USER",
      entityId: m.id,
      summary: `Invited ${name} as ${role.replace("_", " ")}`,
      metadata: { email, viaBulk: invitees.length > 1 },
    });
  }

  return NextResponse.json({
    invited: created.length,
    skipped: skipped.length,
    details: { created, skipped },
    requiresApproval: settings.inviteRequiresApproval,
  });
}
