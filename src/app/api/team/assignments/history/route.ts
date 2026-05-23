import { NextRequest, NextResponse } from "next/server";
import { teamStore } from "@/lib/team/team-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const logs = await teamStore.listAuditLogs({ limit, entityType: "ASSIGNMENT" });
  const snap = await teamStore.snapshot();
  const byId = new Map(snap.members.map((m) => [m.id, m]));

  const items = logs.map((l) => ({
    id: l.id,
    summary: l.summary,
    action: l.action,
    actor: l.actorId ? byId.get(l.actorId) ?? null : null,
    target: l.targetId ? byId.get(l.targetId) ?? null : null,
    metadata: l.metadata,
    createdAt: l.createdAt,
  }));

  return NextResponse.json({ items });
}
