import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const integrations = await prisma.integration.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ integrations });
}
