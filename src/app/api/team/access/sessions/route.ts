import { NextRequest, NextResponse } from "next/server";
import { teamStore, type SessionStatus } from "@/lib/team/team-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const status = searchParams.get("status") as SessionStatus | "ALL" | null;

  const sessions = await teamStore.listSessions({ userId, status: status ?? "ALL" });
  const snap = await teamStore.snapshot();
  const byId = new Map(snap.members.map((m) => [m.id, m]));
  const devices = await teamStore.listDevices();
  const deviceById = new Map(devices.map((d) => [d.id, d]));

  const items = sessions.map((s) => {
    const owner = byId.get(s.userId);
    const device = s.deviceId ? deviceById.get(s.deviceId) ?? null : null;
    return {
      ...s,
      user: owner ? { id: owner.id, name: owner.name, avatar: owner.avatar, role: owner.role } : null,
      device,
    };
  });

  const summary = {
    total: sessions.length,
    active: sessions.filter((s) => s.status === "ACTIVE").length,
    suspicious: sessions.filter((s) => s.status === "SUSPICIOUS").length,
    revoked: sessions.filter((s) => s.status === "REVOKED").length,
  };

  return NextResponse.json({ sessions: items, summary });
}
