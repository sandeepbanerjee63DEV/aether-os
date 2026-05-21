import { NextResponse } from "next/server";
import { buildOperationalFeed } from "@/lib/analytics";

export async function GET() {
  try {
    const data = await buildOperationalFeed();
    return NextResponse.json({ ...data, status: "live" });
  } catch (error) {
    console.error("Operations feed error:", error);
    return NextResponse.json({
      feed: [],
      status: "idle",
      signalsMonitored: 0,
      queuedActions: 0,
      riskAlerts: 0,
    });
  }
}
