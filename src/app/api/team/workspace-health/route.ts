import { NextResponse } from "next/server";
import { teamStore } from "@/lib/team/team-store";
import { workspaceHealth } from "@/lib/team/ai";

export async function GET() {
  const snap = await teamStore.snapshot();
  const recs = await teamStore.listRecommendations();
  const health = workspaceHealth({
    members: snap.members,
    departments: snap.departments,
    recommendations: recs,
  });
  return NextResponse.json(health);
}
