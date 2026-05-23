import { NextRequest, NextResponse } from "next/server";
import { teamStore } from "@/lib/team/team-store";
import { recordAudit } from "@/lib/team/audit";
import { getSession } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  const session = await getSession();
  let body: { userId?: string; enabled?: boolean };
  try {
    body = (await req.json()) as { userId?: string; enabled?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  const enabled = body.enabled !== false;
  const member = await teamStore.updateMember(body.userId, { twoFactorEnabled: enabled });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  await teamStore.appendAccessLog({
    userId: member.id,
    eventType: enabled ? "TWO_FACTOR_ENABLED" : "TWO_FACTOR_DISABLED",
    ipAddress: null,
    userAgent: null,
    location: null,
    success: true,
    riskScore: enabled ? 0 : 30,
    metadata: { triggeredBy: session?.sub ?? null },
  });

  await recordAudit({
    action: "UPDATE",
    actorId: session?.sub ?? null,
    targetId: member.id,
    entityType: "USER",
    entityId: member.id,
    summary: `${enabled ? "Enabled" : "Disabled"} 2FA for ${member.name}`,
  });

  return NextResponse.json({ member });
}
