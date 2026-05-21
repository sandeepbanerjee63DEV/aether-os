import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [totalLeads, wonLeads, openDeals, overdueTasks] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "WON" } }),
    prisma.deal.count({ where: { stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } } }),
    prisma.task.count({
      where: { dueDate: { lt: new Date() }, status: { not: "DONE" } },
    }),
  ]);

  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

  const metrics = [
    {
      id: "p1",
      label: "Lead Conversion",
      value: `${conversionRate.toFixed(1)}%`,
      confidence: totalLeads > 0 ? 75 : 0,
      trend: "stable" as const,
      forecast: totalLeads > 0 ? "Based on current pipeline" : "No data yet",
    },
    {
      id: "p2",
      label: "Open Deals",
      value: String(openDeals),
      confidence: openDeals > 0 ? 70 : 0,
      trend: "stable" as const,
      forecast: openDeals > 0 ? "Active pipeline" : "No open deals",
    },
    {
      id: "p3",
      label: "Overdue Tasks",
      value: String(overdueTasks),
      confidence: 85,
      trend: overdueTasks > 0 ? ("up" as const) : ("down" as const),
      risk: overdueTasks > 0,
      forecast: overdueTasks > 0 ? "Requires attention" : "On track",
    },
    {
      id: "p4",
      label: "Pipeline Health",
      value: totalLeads > 0 ? "Active" : "Empty",
      confidence: totalLeads > 0 ? 80 : 0,
      trend: "stable" as const,
      forecast: `${totalLeads} leads monitored`,
    },
  ];

  return NextResponse.json({ metrics });
}
