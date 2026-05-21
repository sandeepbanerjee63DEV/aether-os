import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadStore } from "@/lib/leads/lead-store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const timeline = await prisma.timelineEvent.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ timeline });
  } catch {
    const timeline = await leadStore.getTimeline(id);
    return NextResponse.json({ timeline });
  }
}
