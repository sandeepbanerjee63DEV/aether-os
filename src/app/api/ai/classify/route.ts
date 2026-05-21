import { NextRequest, NextResponse } from "next/server";
import { classifyLead } from "@/lib/ai/engine";

export async function POST(req: NextRequest) {
  const lead = await req.json();
  const result = await classifyLead(lead);
  return NextResponse.json(result);
}
