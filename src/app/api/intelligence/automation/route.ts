import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const workflow = await prisma.workflow.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!workflow) {
    return NextResponse.json({ nodes: [], running: false });
  }

  const nodes = [
    { id: "n1", type: "trigger", label: workflow.trigger, status: "complete" },
    { id: "n2", type: "ai", label: "AI analysis", status: "complete" },
    { id: "n3", type: "action", label: workflow.name, status: "active" },
    { id: "n4", type: "assign", label: "Assign owner", status: "pending" },
    { id: "n5", type: "notify", label: "Notify team", status: "pending" },
    { id: "n6", type: "escalate", label: "Escalate if stalled", status: "pending" },
  ];

  return NextResponse.json({ nodes, running: true, workflowName: workflow.name });
}
