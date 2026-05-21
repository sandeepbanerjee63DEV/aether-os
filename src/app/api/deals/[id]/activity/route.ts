import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dealStore } from "@/lib/deals/deal-store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const activity = await prisma.dealActivity.findMany({
      where: { dealId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({
      activity: activity.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch {
    const activity = await dealStore.getActivity(id);
    return NextResponse.json({ activity });
  }
}
