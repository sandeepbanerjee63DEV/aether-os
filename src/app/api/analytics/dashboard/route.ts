import { NextResponse } from "next/server";
import { getDashboardAnalytics } from "@/lib/analytics";

export async function GET() {
  try {
    const data = await getDashboardAnalytics();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({
      kpis: [],
      funnel: [],
      scoreDistribution: [],
      sourceDistribution: [],
      conversionRate: 0,
      totalLeads: 0,
    });
  }
}
