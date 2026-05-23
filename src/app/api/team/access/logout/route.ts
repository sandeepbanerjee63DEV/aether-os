import { NextRequest, NextResponse } from "next/server";
import { teamStore } from "@/lib/team/team-store";
import { recordAudit } from "@/lib/team/audit";
import { getSession } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  const session = await getSession();
  let body: { sessionId?: string };
  try {
    body = (await req.json()) as { sessionId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }
  const revoked = await teamStore.revokeSession(body.sessionId);
  if (!revoked) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  await teamStore.appendAccessLog({
    userId: revoked.userId,
    eventType: "SESSION_REVOKED",
    ipAddress: revoked.ipAddress,
    userAgent: revoked.userAgent,
    location: revoked.ipCity ? `${revoked.ipCity}, ${revoked.ipCountry ?? ""}` : revoked.ipCountry,
    success: true,
    riskScore: revoked.riskScore,
    metadata: { revokedBy: session?.sub ?? null, sessionId: revoked.id },
  });

  await recordAudit({
    action: "UPDATE",
    actorId: session?.sub ?? null,
    targetId: revoked.userId,
    entityType: "SESSION",
    entityId: revoked.id,
    summary: `Force-revoked session for ${revoked.ipCity ?? "unknown location"}`,
  });

  return NextResponse.json({ session: revoked });
}
