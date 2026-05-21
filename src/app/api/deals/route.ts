import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreDeal } from "@/lib/ai/engine";
import { dealStore, type DealStage } from "@/lib/deals/deal-store";

interface CreateDealBody {
  title?: string;
  company?: string;
  contactName?: string;
  value?: number;
  stage?: DealStage;
  probability?: number;
  expectedClose?: string;
  leadId?: string | null;
}

const VALID_STAGES: DealStage[] = [
  "QUALIFICATION",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const stage = searchParams.get("stage");
  const search = searchParams.get("search");

  const stageFilter =
    stage && VALID_STAGES.includes(stage as DealStage) ? (stage as DealStage) : null;

  try {
    const deals = await prisma.deal.findMany({
      where: {
        ...(stageFilter ? { stage: stageFilter } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { company: { contains: search, mode: "insensitive" } },
                { contactName: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { owner: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    const total = await prisma.deal.count();
    const shaped = deals.map((d) => ({
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
    }));
    return NextResponse.json({ deals: shaped, total });
  } catch {
    const { deals, total } = await dealStore.list({
      stage: stageFilter,
      search,
      limit,
    });
    return NextResponse.json({ deals, total });
  }
}

export async function POST(req: NextRequest) {
  let body: CreateDealBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const stage: DealStage =
    body.stage && VALID_STAGES.includes(body.stage) ? body.stage : "QUALIFICATION";

  const ai = await scoreDeal({
    title: body.title,
    value: body.value,
    stage,
    probability: body.probability,
    expectedClose: body.expectedClose,
    company: body.company,
  });

  try {
    const owner = await prisma.user.findFirst({ select: { id: true, name: true } });
    const deal = await prisma.deal.create({
      data: {
        title: body.title,
        company: body.company || null,
        contactName: body.contactName || null,
        value: body.value ?? 0,
        stage,
        probability: body.probability ?? ai.aiProbability,
        aiProbability: ai.aiProbability,
        aiAnalysis: ai.aiAnalysis,
        nextBestAction: ai.nextBestAction,
        riskLevel: ai.riskLevel,
        expectedClose: body.expectedClose ? new Date(body.expectedClose) : null,
        leadId: body.leadId ?? null,
        ownerId: owner?.id ?? null,
      },
      include: { owner: { select: { name: true } } },
    });
    await prisma.dealActivity.create({
      data: {
        dealId: deal.id,
        type: "create",
        title: `Deal created · ${deal.title}`,
        description: ai.aiAnalysis,
        icon: "sparkles",
        color: "purple",
      },
    });
    return NextResponse.json(
      {
        deal: {
          id: deal.id,
          title: deal.title,
          company: deal.company,
          contactName: deal.contactName,
          value: deal.value,
          stage: deal.stage,
          probability: deal.probability,
          aiProbability: deal.aiProbability,
          aiAnalysis: deal.aiAnalysis,
          nextBestAction: deal.nextBestAction,
          riskLevel: deal.riskLevel,
          expectedClose: deal.expectedClose?.toISOString() ?? null,
          leadId: deal.leadId,
          ownerId: deal.ownerId,
          ownerName: deal.owner?.name ?? null,
          createdAt: deal.createdAt.toISOString(),
          updatedAt: deal.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.warn("Prisma unavailable for deal create, using file store:", (err as Error).message);
    try {
      const deal = await dealStore.create({
        title: body.title,
        company: body.company || null,
        contactName: body.contactName || null,
        value: body.value ?? 0,
        stage,
        probability: body.probability ?? ai.aiProbability,
        aiProbability: ai.aiProbability,
        aiAnalysis: ai.aiAnalysis,
        nextBestAction: ai.nextBestAction,
        riskLevel: ai.riskLevel,
        expectedClose: body.expectedClose ?? null,
        leadId: body.leadId ?? null,
        ownerId: null,
        ownerName: null,
      });
      return NextResponse.json({ deal }, { status: 201 });
    } catch (fallbackErr) {
      console.error("Deal create fallback failed:", fallbackErr);
      return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
    }
  }
}
