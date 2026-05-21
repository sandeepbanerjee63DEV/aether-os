import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dealStore, STAGE_ORDER, type DealStage } from "@/lib/deals/deal-store";

export async function GET() {
  try {
    const deals = await prisma.deal.findMany({
      select: { stage: true, value: true, probability: true },
    });
    const open = deals.filter(
      (d) => d.stage !== "CLOSED_WON" && d.stage !== "CLOSED_LOST"
    );
    const won = deals.filter((d) => d.stage === "CLOSED_WON");
    const lost = deals.filter((d) => d.stage === "CLOSED_LOST");
    const totalPipeline = open.reduce((sum, d) => sum + d.value, 0);
    const weightedPipeline = open.reduce(
      (sum, d) => sum + d.value * (d.probability / 100),
      0
    );
    const closed = won.length + lost.length;
    const winRate = closed > 0 ? (won.length / closed) * 100 : 0;
    const avgDealSize =
      deals.length > 0 ? deals.reduce((s, d) => s + d.value, 0) / deals.length : 0;
    const byStage = STAGE_ORDER.map((stage) => {
      const items = deals.filter((d) => d.stage === stage);
      return {
        stage: stage as DealStage,
        count: items.length,
        value: items.reduce((s, d) => s + d.value, 0),
      };
    });
    return NextResponse.json({
      totalPipeline,
      weightedPipeline,
      avgDealSize,
      winRate,
      openCount: open.length,
      wonCount: won.length,
      lostCount: lost.length,
      byStage,
    });
  } catch {
    const analytics = await dealStore.analytics();
    return NextResponse.json(analytics);
  }
}
