/**
 * AETHER OS — Operational Ownership aggregator.
 *
 * Computes the LEAD + DEAL performance fingerprint of a team member.
 * Consumed by:
 *   - /api/team/members/[id] (drawer profile)
 *   - /api/team/members (column on the directory)
 *   - Leads page → owner sidebar
 *   - Deals page → owner sidebar
 *
 * Pure function over the leadStore + dealStore + teamStore snapshots. No I/O.
 */

import type { StoredLead } from "@/lib/leads/lead-store";
import type { StoredDeal } from "@/lib/deals/deal-store";
import type { StoredAssignment, StoredMember } from "@/lib/team/team-store";

export interface OwnedLeadSummary {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  value: string;
  aiScore: number;
  convertProbability: number;
  status: string;
  operationalStatus: string;
  assignmentType: string;
  assignmentReason: string | null;
  assignedAt: string | null;
  lastContactedAt: string | null;
  updatedAt: string;
}

export interface OwnedDealSummary {
  id: string;
  title: string;
  company: string | null;
  value: number;
  stage: string;
  probability: number;
  aiProbability: number | null;
  riskLevel: string | null;
  operationalStatus: string;
  assignmentType: string;
  assignmentReason: string | null;
  assignedAt: string | null;
  expectedClose: string | null;
  lastActivityAt: string | null;
  supportingDepartmentIds: string[];
  updatedAt: string;
}

export interface DealOwnership {
  totalAssignedDeals: number;
  activeDeals: number;
  atRiskDeals: number;
  stalledDeals: number;
  wonDealsCount: number;
  totalRevenueResponsibility: number;
  weightedRevenueResponsibility: number;
  avgDealVelocityDays: number | null;
  dealWorkloadPct: number;
  winRate: number;
  pendingApprovals: number;
  recentDeals: OwnedDealSummary[];
}

export interface OperationalOwnership {
  ownerId: string;
  totalAssignedLeads: number;
  activeLeads: number;
  pendingFollowUps: number;
  staleLeads: number;
  hotLeads: number;
  leadWorkloadPct: number;
  avgResponseHours: number | null;
  conversionRate: number;
  expectedRevenueScore: number;
  recentLeads: OwnedLeadSummary[];
  performanceSignals: Array<{ label: string; value: string; tone: "good" | "warn" | "bad" | "neutral" }>;
  // Deal-side ownership (DEAL ↔ TEAM connection)
  deals: DealOwnership;
}

const PENDING_STATUSES = new Set(["NEW", "AI_CLASSIFIED", "ASSIGNED", "FOLLOW_UP", "HOT", "WARM"]);
const STALE_OP_STATUSES = new Set(["STALE", "AT_RISK"]);
const VALUE_REVENUE: Record<string, number> = { High: 100, Medium: 50, Low: 20 };
const DEAL_AT_RISK = new Set(["AT_RISK", "STALLED"]);
const DEAL_OPEN_STAGES = new Set(["QUALIFICATION", "PROPOSAL", "NEGOTIATION"]);

function computeDealOwnership(input: {
  member: StoredMember;
  deals: StoredDeal[];
  assignments: StoredAssignment[];
}): DealOwnership {
  const { member, deals, assignments } = input;
  const owned = deals.filter((d) => d.ownerId === member.id);
  const activeDeals = owned.filter((d) => DEAL_OPEN_STAGES.has(d.stage));
  const wonDeals = owned.filter((d) => d.stage === "CLOSED_WON");
  const lostDeals = owned.filter((d) => d.stage === "CLOSED_LOST");
  const atRiskDeals = owned.filter(
    (d) => d.operationalStatus === "AT_RISK" && DEAL_OPEN_STAGES.has(d.stage),
  );
  const stalledDeals = owned.filter(
    (d) => d.operationalStatus === "STALLED" && DEAL_OPEN_STAGES.has(d.stage),
  );

  const totalRevenueResponsibility = activeDeals.reduce((s, d) => s + d.value, 0);
  const weightedRevenueResponsibility = activeDeals.reduce(
    (s, d) => s + d.value * ((d.aiProbability ?? d.probability ?? 0) / 100),
    0,
  );

  // Avg velocity — days between assignedAt and lastActivityAt for active deals
  const velocities: number[] = [];
  for (const d of activeDeals) {
    if (d.assignedAt && d.lastActivityAt) {
      const gap = (new Date(d.lastActivityAt).getTime() - new Date(d.assignedAt).getTime()) / 86400000;
      if (gap >= 0 && gap < 365) velocities.push(gap);
    }
  }
  const avgDealVelocityDays = velocities.length
    ? Math.round((velocities.reduce((s, v) => s + v, 0) / velocities.length) * 10) / 10
    : null;

  const dealAssignments = assignments.filter(
    (a) => a.assigneeId === member.id && a.entityType === "DEAL" && a.status === "ACTIVE",
  );
  const dealWorkloadPct = Math.round(dealAssignments.reduce((sum, a) => sum + a.workloadWeight, 0));

  const closedTotal = wonDeals.length + lostDeals.length;
  const winRate = closedTotal > 0 ? Math.round((wonDeals.length / closedTotal) * 100) : 0;

  // Pending approvals — proxy: late-stage deals where ops decisions are pending.
  // In a future Tasks module this would map to actual approval items; for now we
  // treat NEGOTIATION-stage deals with AT_RISK status as awaiting an approval.
  const pendingApprovals = owned.filter(
    (d) => d.stage === "NEGOTIATION" && (d.operationalStatus === "AT_RISK" || d.riskLevel === "high"),
  ).length;

  const recentDeals: OwnedDealSummary[] = [...owned]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
    .map((d) => ({
      id: d.id,
      title: d.title,
      company: d.company,
      value: d.value,
      stage: d.stage,
      probability: d.probability,
      aiProbability: d.aiProbability,
      riskLevel: d.riskLevel,
      operationalStatus: d.operationalStatus,
      assignmentType: d.assignmentType,
      assignmentReason: d.assignmentReason,
      assignedAt: d.assignedAt,
      expectedClose: d.expectedClose,
      lastActivityAt: d.lastActivityAt,
      supportingDepartmentIds: d.supportingDepartmentIds,
      updatedAt: d.updatedAt,
    }));

  return {
    totalAssignedDeals: owned.length,
    activeDeals: activeDeals.length,
    atRiskDeals: atRiskDeals.length,
    stalledDeals: stalledDeals.length,
    wonDealsCount: wonDeals.length,
    totalRevenueResponsibility,
    weightedRevenueResponsibility,
    avgDealVelocityDays,
    dealWorkloadPct,
    winRate,
    pendingApprovals,
    recentDeals,
  };
}

export function computeOperationalOwnership(input: {
  member: StoredMember;
  leads: StoredLead[];
  assignments: StoredAssignment[];
  deals?: StoredDeal[];
}): OperationalOwnership {
  const { member, leads, assignments } = input;
  const deals = input.deals ?? [];
  const owned = leads.filter((l) => l.ownerId === member.id);
  const activeLeads = owned.filter((l) => l.status !== "WON" && l.status !== "LOST" && l.status !== "CLOSED");
  const pendingFollowUps = owned.filter((l) => PENDING_STATUSES.has(l.status));
  const staleLeads = owned.filter((l) => STALE_OP_STATUSES.has(l.operationalStatus));
  const hotLeads = owned.filter((l) => l.aiScore >= 80 || l.status === "HOT");

  // Average response time: gap between assignedAt and lastContactedAt
  const responseHours: number[] = [];
  for (const l of owned) {
    if (l.assignedAt && l.lastContactedAt) {
      const gap = (new Date(l.lastContactedAt).getTime() - new Date(l.assignedAt).getTime()) / 3600000;
      if (gap >= 0 && gap < 24 * 30) responseHours.push(gap);
    }
  }
  const avgResponseHours = responseHours.length
    ? Math.round((responseHours.reduce((s, v) => s + v, 0) / responseHours.length) * 10) / 10
    : null;

  // Conversion proxy: closed-won + high-intent ratio over total assigned
  const wonCount = owned.filter((l) => l.status === "WON").length;
  const closedCount = owned.filter((l) => l.status === "WON" || l.status === "LOST").length;
  const conversionRate = closedCount > 0
    ? Math.round((wonCount / closedCount) * 100)
    : owned.length > 0
      ? Math.round(
          (owned.reduce((s, l) => s + l.convertProbability, 0) / owned.length),
        )
      : 0;

  // Composite expected revenue score: sum of value * (convertProbability/100)
  const expectedRevenueScore = Math.round(
    owned.reduce((sum, l) => sum + (VALUE_REVENUE[l.value] ?? 50) * (l.convertProbability / 100), 0),
  );

  // Lead-derived workload weight (portion of the member's total workload that comes from leads)
  const leadAssignments = assignments.filter(
    (a) => a.assigneeId === member.id && a.entityType === "LEAD" && a.status === "ACTIVE",
  );
  const leadWorkloadPct = Math.round(
    leadAssignments.reduce((sum, a) => sum + a.workloadWeight, 0),
  );

  const recentLeads: OwnedLeadSummary[] = [...owned]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
    .map((l) => ({
      id: l.id,
      firstName: l.firstName,
      lastName: l.lastName,
      company: l.company,
      value: l.value,
      aiScore: l.aiScore,
      convertProbability: l.convertProbability,
      status: l.status,
      operationalStatus: l.operationalStatus,
      assignmentType: l.assignmentType,
      assignmentReason: l.assignmentReason,
      assignedAt: l.assignedAt,
      lastContactedAt: l.lastContactedAt,
      updatedAt: l.updatedAt,
    }));

  // Deal-side ownership (DEAL ↔ TEAM connection)
  const dealOwnership = computeDealOwnership({ member, deals, assignments });

  const performanceSignals: OperationalOwnership["performanceSignals"] = [];
  if (avgResponseHours !== null) {
    performanceSignals.push({
      label: "Avg first-touch",
      value: `${avgResponseHours}h`,
      tone: avgResponseHours <= 8 ? "good" : avgResponseHours <= 24 ? "neutral" : avgResponseHours <= 48 ? "warn" : "bad",
    });
  }
  if (owned.length > 0) {
    performanceSignals.push({
      label: "Conversion confidence",
      value: `${conversionRate}%`,
      tone: conversionRate >= 70 ? "good" : conversionRate >= 50 ? "neutral" : conversionRate >= 30 ? "warn" : "bad",
    });
  }
  if (staleLeads.length > 0) {
    performanceSignals.push({
      label: "Stale leads",
      value: `${staleLeads.length}`,
      tone: staleLeads.length === 1 ? "warn" : "bad",
    });
  }
  if (hotLeads.length > 0) {
    performanceSignals.push({
      label: "Hot in pipe",
      value: `${hotLeads.length}`,
      tone: "good",
    });
  }
  // Deal-derived signals
  if (dealOwnership.activeDeals > 0) {
    performanceSignals.push({
      label: "Active deals",
      value: `${dealOwnership.activeDeals}`,
      tone: "neutral",
    });
  }
  if (dealOwnership.atRiskDeals > 0 || dealOwnership.stalledDeals > 0) {
    const total = dealOwnership.atRiskDeals + dealOwnership.stalledDeals;
    performanceSignals.push({
      label: "Deals at risk",
      value: `${total}`,
      tone: total >= 2 ? "bad" : "warn",
    });
  }
  if (dealOwnership.winRate > 0) {
    performanceSignals.push({
      label: "Win rate",
      value: `${dealOwnership.winRate}%`,
      tone: dealOwnership.winRate >= 60 ? "good" : dealOwnership.winRate >= 40 ? "neutral" : "warn",
    });
  }

  return {
    ownerId: member.id,
    totalAssignedLeads: owned.length,
    activeLeads: activeLeads.length,
    pendingFollowUps: pendingFollowUps.length,
    staleLeads: staleLeads.length,
    hotLeads: hotLeads.length,
    leadWorkloadPct,
    avgResponseHours,
    conversionRate,
    expectedRevenueScore,
    recentLeads,
    performanceSignals,
    deals: dealOwnership,
  };
}
