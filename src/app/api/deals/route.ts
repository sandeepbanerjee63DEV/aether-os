import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const deals = await prisma.deal.findMany({
    include: { owner: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ deals });
}
