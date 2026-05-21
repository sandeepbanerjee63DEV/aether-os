import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dealStore } from "@/lib/deals/deal-store";

function shapeDeal(d: {
  id: string;
  title: string;
  company: string | null;
  contactName: string | null;
  value: number;
  stage: string;
  probability: number;
  aiProbability: number | null;
  aiAnalysis: string | null;
  nextBestAction: string | null;
  riskLevel: string | null;
  expectedClose: Date | null;
  leadId: string | null;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner?: { name: string } | null;
}) {
  return {
    id: d.id,
    title: d.title,
    company: d.company,
    contactName: d.contactName,
    value: d.value,
    stage: d.stage,
    probability: d.probability,
    aiProbability: d.aiProbability,
    aiAnalysis: d.aiAnalysis,
    nextBestAction: d.nextBestAction,
    riskLevel: d.riskLevel,
    expectedClose: d.expectedClose?.toISOString() ?? null,
    leadId: d.leadId,
    ownerId: d.ownerId,
    ownerName: d.owner?.name ?? null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { owner: { select: { name: true } } },
    });
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ deal: shapeDeal(deal) });
  } catch {
    const deal = await dealStore.findById(id);
    if (!deal) {
      const first = (await dealStore.list({ limit: 1 })).deals[0];
      if (!first) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ deal: first });
    }
    return NextResponse.json({ deal });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  try {
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.company !== undefined) data.company = body.company;
    if (body.contactName !== undefined) data.contactName = body.contactName;
    if (body.value !== undefined) data.value = Number(body.value);
    if (body.stage !== undefined) data.stage = body.stage;
    if (body.probability !== undefined) data.probability = Number(body.probability);
    if (body.expectedClose !== undefined) {
      data.expectedClose = body.expectedClose ? new Date(body.expectedClose) : null;
    }
    if (body.aiAnalysis !== undefined) data.aiAnalysis = body.aiAnalysis;
    if (body.nextBestAction !== undefined) data.nextBestAction = body.nextBestAction;
    if (body.riskLevel !== undefined) data.riskLevel = body.riskLevel;

    const prevDeal = await prisma.deal.findUnique({ where: { id } });
    const deal = await prisma.deal.update({
      where: { id },
      data,
      include: { owner: { select: { name: true } } },
    });
    if (body.stage && prevDeal && prevDeal.stage !== body.stage) {
      await prisma.dealActivity.create({
        data: {
          dealId: id,
          type: "stage",
          title: `Moved to ${body.stage}`,
          description: `From ${prevDeal.stage}`,
          icon: "trending-up",
          color: "orange",
        },
      });
    }
    return NextResponse.json({ deal: shapeDeal(deal) });
  } catch {
    const deal = await dealStore.update(id, body);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ deal });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.deal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    const ok = await dealStore.remove(id);
    return NextResponse.json({ success: ok });
  }
}
