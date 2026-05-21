import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dealStore, type DealStage } from "@/lib/deals/deal-store";

const VALID_STAGES: DealStage[] = [
  "QUALIFICATION",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { stage?: DealStage };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const stage = body.stage;
  if (!stage || !VALID_STAGES.includes(stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  try {
    const prevDeal = await prisma.deal.findUnique({ where: { id } });
    if (!prevDeal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const probability =
      stage === "CLOSED_WON" ? 100 : stage === "CLOSED_LOST" ? 0 : prevDeal.probability;

    const deal = await prisma.deal.update({
      where: { id },
      data: { stage, probability },
    });

    if (prevDeal.stage !== stage) {
      await prisma.dealActivity.create({
        data: {
          dealId: id,
          type: "stage",
          title: `Moved to ${stage}`,
          description: `From ${prevDeal.stage}`,
          icon: "trending-up",
          color: stage === "CLOSED_WON" ? "green" : stage === "CLOSED_LOST" ? "red" : "orange",
        },
      });
    }
    return NextResponse.json({ deal });
  } catch {
    const updated = await dealStore.update(id, {
      stage,
      ...(stage === "CLOSED_WON" ? { probability: 100 } : {}),
      ...(stage === "CLOSED_LOST" ? { probability: 0 } : {}),
    });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ deal: updated });
  }
}
