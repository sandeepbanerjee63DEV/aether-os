import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const insights = await prisma.aiInsight.findMany({
    where: { isActive: true },
    orderBy: { priority: "asc" },
  });
  return NextResponse.json({
    insights: insights.map((i) => ({
      id: i.id,
      title: i.title,
      message: i.message,
      icon: i.icon,
      color: i.color,
    })),
  });
}
