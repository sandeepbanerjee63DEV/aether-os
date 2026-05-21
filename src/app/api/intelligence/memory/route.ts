import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const insights = await prisma.aiInsight.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const memory = insights.map((i) => ({
    id: i.id,
    insight: i.title,
    context: i.message,
    confidence: 80,
    similarPattern: undefined,
  }));

  return NextResponse.json({ memory });
}
