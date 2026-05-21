import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: { _count: { select: { leads: true } } },
  });

  const members = users.map((u) => {
    const activeLeads = u._count.leads;
    const workload = Math.min(100, activeLeads * 4);
    const status = workload > 85 ? "overloaded" : workload > 65 ? "loaded" : "optimal";
    const burnoutRisk = workload > 85 ? "high" : workload > 70 ? "medium" : "low";

    return {
      id: u.id,
      name: u.name,
      role: u.title || u.role,
      workload,
      burnoutRisk,
      productivity: Math.max(50, 100 - workload / 2),
      activeLeads,
      status,
    };
  });

  return NextResponse.json({ members, suggestion: members.length ? null : "Add team members to enable workload intelligence" });
}
