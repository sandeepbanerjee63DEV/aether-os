import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadStore } from "@/lib/leads/lead-store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { timeline: { orderBy: { createdAt: "asc" } }, owner: { select: { name: true, email: true } } },
    });
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ lead });
  } catch {
    const lead = await leadStore.findById(id);
    if (!lead) {
      const first = (await leadStore.list({ limit: 1 })).leads[0];
      if (!first) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ lead: first });
    }
    return NextResponse.json({ lead });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  try {
    const lead = await prisma.lead.update({ where: { id }, data: body });
    return NextResponse.json({ lead });
  } catch {
    const lead = await leadStore.update(id, body);
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ lead });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    const ok = await leadStore.remove(id);
    return NextResponse.json({ success: ok });
  }
}
