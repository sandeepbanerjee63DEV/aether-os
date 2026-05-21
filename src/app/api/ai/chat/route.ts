import { NextRequest, NextResponse } from "next/server";
import { chatResponse } from "@/lib/ai/engine";

export async function POST(req: NextRequest) {
  const { message, context } = await req.json();
  const reply = await chatResponse(message, context);
  return NextResponse.json({ reply });
}
