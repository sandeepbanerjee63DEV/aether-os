import { NextRequest, NextResponse } from "next/server";
import { teamStore } from "@/lib/team/team-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const logs = await teamStore.listAccessLogs({ userId, limit });
  const snap = await teamStore.snapshot();
  const byId = new Map(snap.members.map((m) => [m.id, m]));

  const items = logs.map((l) => ({
    ...l,
    user: l.userId ? byId.get(l.userId) ?? null : null,
  }));

  return NextResponse.json({ items });
}
