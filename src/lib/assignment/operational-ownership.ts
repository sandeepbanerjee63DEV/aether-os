/**
 * AETHER OS — Operational Ownership aggregator.
 *
 * Computes the lead-related performance fingerprint of a team member.
 * Consumed by:
 *   - /api/team/members/[id] (drawer profile)
 *   - /api/team/members (column on the directory)
 *   - Future leads.page → owner sidebar
 *
 * Pure function over the leadStore + teamStore snapshots. No I/O.
 */

import type { StoredLead } from "@/lib/leads/lead-store";
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
}

const PENDING_STATUSES = new Set(["NEW", "AI_CLASSIFIED", "ASSIGNED", "FOLLOW_UP", "HOT", "WARM"]);
const STALE_OP_STATUSES = new Set(["STALE", "AT_RISK"]);
const VALUE_REVENUE: Record<string, number> = { High: 100, Medium: 50, Low: 20 };

export function computeOperationalOwnership(input: {
  member: StoredMember;
  leads: StoredLead[];
  assignments: StoredAssignment[];
}): OperationalOwnership {
  const { member, leads, assignments } = input;
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
  };
}
