import { prisma } from "@/lib/prisma";

const CHART_COLORS = ["#6366F1", "#818CF8", "#A78BFA", "#10B981", "#F59E0B", "#94A3B8"];

export async function getDashboardAnalytics() {
  const [totalLeads, wonLeads, qualifiedLeads, followUpLeads, deals, dealSum] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "WON" } }),
    prisma.lead.count({ where: { aiScore: { gte: 60 } } }),
    prisma.lead.count({ where: { status: { in: ["FOLLOW_UP", "NURTURING"] } } }),
    prisma.deal.count(),
    prisma.deal.aggregate({ _sum: { value: true } }),
  ]);

  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

  const funnel = [
    { name: "Leads Entered", value: totalLeads, fill: CHART_COLORS[0] },
    { name: "AI Qualified", value: qualifiedLeads, fill: CHART_COLORS[1] },
    { name: "Follow-ups", value: followUpLeads, fill: CHART_COLORS[2] },
    { name: "Won / Clients", value: wonLeads, fill: CHART_COLORS[3] },
  ];

  const leads = await prisma.lead.findMany({ select: { aiScore: true, source: true } });

  const scoreBuckets = { hot: 0, warm: 0, cold: 0, unqualified: 0 };
  const sourceCounts: Record<string, number> = {};

  for (const lead of leads) {
    if (lead.aiScore >= 80) scoreBuckets.hot++;
    else if (lead.aiScore >= 60) scoreBuckets.warm++;
    else if (lead.aiScore >= 40) scoreBuckets.cold++;
    else scoreBuckets.unqualified++;

    const src = lead.source || "Other";
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  }

  const total = leads.length || 1;
  const scoreDistribution = [
    { name: "80-100 (Hot)", value: Math.round((scoreBuckets.hot / total) * 100), fill: "#10B981" },
    { name: "60-80 (Warm)", value: Math.round((scoreBuckets.warm / total) * 100), fill: "#6366F1" },
    { name: "40-60 (Cold)", value: Math.round((scoreBuckets.cold / total) * 100), fill: "#F59E0B" },
    { name: "0-40 (Unqualified)", value: Math.round((scoreBuckets.unqualified / total) * 100), fill: "#94A3B8" },
  ];

  const sourceDistribution = Object.entries(sourceCounts).map(([name, count], i) => ({
    name,
    value: Math.round((count / total) * 100),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const avgScore =
    leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.aiScore, 0) / leads.length) : 0;

  const revenue = dealSum._sum.value ?? 0;

  const kpis = [
    { label: "Total Leads", value: String(totalLeads), change: "—", trend: "up" as const },
    { label: "AI Qualified", value: String(qualifiedLeads), change: "—", trend: "up" as const },
    { label: "Active Deals", value: String(deals), change: "—", trend: "up" as const },
    { label: "Revenue (Pipeline)", value: revenue > 0 ? `₹${(revenue / 100000).toFixed(1)}L` : "₹0", change: "—", trend: "up" as const },
    { label: "Conversion Rate", value: `${conversionRate.toFixed(1)}%`, change: "—", trend: "up" as const },
    { label: "AI Score Avg", value: String(avgScore), change: "—", trend: "up" as const },
  ];

  return {
    kpis,
    funnel,
    scoreDistribution,
    sourceDistribution,
    conversionRate,
    totalLeads,
  };
}

export async function buildOperationalFeed() {
  const staleThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const [staleHighValue, totalLeads, unreadNotifications, insights] = await Promise.all([
    prisma.lead.count({
      where: {
        updatedAt: { lt: staleThreshold },
        value: "High",
        status: { notIn: ["WON", "LOST"] },
      },
    }),
    prisma.lead.count(),
    prisma.notification.count({ where: { read: false } }),
    prisma.aiInsight.findMany({ where: { isActive: true }, orderBy: { priority: "asc" }, take: 5 }),
  ]);

  const feed: import("@/types/operational-intelligence").OperationalFeedItem[] = [];

  if (staleHighValue > 0) {
    feed.push({
      id: "stale-leads",
      message: `${staleHighValue} high-value lead${staleHighValue > 1 ? "s" : ""} stalled for 48+ hours`,
      summary: "AI detected engagement decay on priority accounts",
      severity: "critical",
      category: "leads",
      timestamp: new Date().toISOString(),
      aiGenerated: true,
      recommendation: "Review and re-engage",
    });
  }

  if (totalLeads === 0) {
    feed.push({
      id: "empty-pipeline",
      message: "No leads in pipeline",
      summary: "Add your first lead to begin AI operational monitoring",
      severity: "info",
      category: "leads",
      timestamp: new Date().toISOString(),
    });
  }

  if (unreadNotifications > 0) {
    feed.push({
      id: "notifications",
      message: `${unreadNotifications} unread notification${unreadNotifications > 1 ? "s" : ""}`,
      severity: "info",
      category: "system",
      timestamp: new Date().toISOString(),
    });
  }

  for (const insight of insights) {
    feed.push({
      id: insight.id,
      message: insight.title,
      summary: insight.message,
      severity: insight.color === "orange" ? "warning" : insight.color === "green" ? "success" : "ai",
      category: "automation",
      timestamp: insight.createdAt.toISOString(),
      aiGenerated: true,
    });
  }

  return {
    feed,
    signalsMonitored: totalLeads,
    queuedActions: 0,
    riskAlerts: staleHighValue,
  };
}
