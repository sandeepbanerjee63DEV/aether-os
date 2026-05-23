import { NextRequest, NextResponse } from "next/server";
import { teamStore, type StoredTeamSettings } from "@/lib/team/team-store";
import { recordAudit, diff } from "@/lib/team/audit";
import { getSession } from "@/lib/auth/jwt";

export async function GET() {
  const settings = await teamStore.getSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  let body: Partial<StoredTeamSettings>;
  try {
    body = (await req.json()) as Partial<StoredTeamSettings>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const before = await teamStore.getSettings();
  const after = await teamStore.updateSettings(body);

  const changes = diff(before, after);
  if (Object.keys(changes).length) {
    await recordAudit({
      action: "UPDATE",
      actorId: session?.sub ?? null,
      targetId: null,
      entityType: "SETTING",
      entityId: "team_settings",
      summary: `Updated team settings (${Object.keys(changes).join(", ")})`,
      diff: changes,
    });
  }

  return NextResponse.json({ settings: after });
}
