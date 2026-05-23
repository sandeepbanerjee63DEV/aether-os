import { NextRequest, NextResponse } from "next/server";
import { teamStore } from "@/lib/team/team-store";
import { recordAudit } from "@/lib/team/audit";
import { getSession } from "@/lib/auth/jwt";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const rec = await teamStore.resolveRecommendation(id);
  if (!rec) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await recordAudit({
    action: "UPDATE",
    actorId: session?.sub ?? null,
    targetId: null,
    entityType: "AI_RECOMMENDATION",
    entityId: id,
    summary: `Resolved AI recommendation: "${rec.title}"`,
  });
  return NextResponse.json({ recommendation: rec });
}
