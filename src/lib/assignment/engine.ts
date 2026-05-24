/**
 * AETHER OS — AI Assignment Engine.
 *
 * Cross-module router that turns an "opportunity" (currently leads, extensible to deals/
 * tasks/projects/support tickets) into an "execution owner" by evaluating workforce
 * signals from the Team module.
 *
 *   LEADS ─── Assignment Engine ─── TEAM
 *               (workload + dept + expertise + availability)
 *
 * Strategy modes (driven by TeamSettings.autoAssignmentStrategy):
 *   - "ai"          : multi-factor weighted scoring (recommended)
 *   - "workload"    : pick the active member with the most headroom
 *   - "round_robin" : rotate across eligible candidates by last-assigned timestamp
 *
 * Pure functions. No I/O. Callers pass in the snapshot.
 */

import type { StoredMember, StoredAssignment, StoredDepartment, StoredTeamSettings, AssignmentEntity } from "@/lib/team/team-store";
import { scoreAssignmentMatch } from "@/lib/team/ai";

export type AssignmentStrategy = "ai" | "workload" | "round_robin" | "manual";

export interface LeadLike {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  source: string;
  leadType: string | null;
  value: string;
  aiScore: number;
  tags: string[];
}

export interface RoutingCandidate {
  memberId: string;
  memberName: string;
  memberAvatar: string | null;
  memberRole: string;
  departmentId: string | null;
  workloadPct: number;
  operationalScore: number;
  score: number;
  reason: string;
  signals: Array<{ label: string; delta: number; tone: "positive" | "neutral" | "negative" }>;
}

export interface RoutingResult {
  strategy: AssignmentStrategy;
  best: RoutingCandidate | null;
  alternatives: RoutingCandidate[];
  rationale: string;
  consideredCount: number;
}

const VALUE_PRIORITY: Record<string, number> = {
  High: 90,
  Medium: 60,
  Low: 30,
};

const VALUE_WEIGHT: Record<string, number> = {
  High: 9,
  Medium: 5,
  Low: 3,
};

/**
 * Maps lead intent signals to the department most likely to own it.
 * Heuristic — overridable via TeamSettings.defaultDepartmentId.
 */
export function inferDepartmentForLead(lead: Pick<LeadLike, "leadType" | "source" | "tags" | "company">): string | null {
  const haystack = `${lead.leadType ?? ""} ${lead.source ?? ""} ${(lead.tags ?? []).join(" ")} ${lead.company ?? ""}`.toLowerCase();
  if (/support|ticket|help|issue|complaint|refund/.test(haystack)) return "dept-support";
  if (/marketing|campaign|webinar|newsletter|social/.test(haystack)) return "dept-marketing";
  if (/billing|invoice|payment|finance/.test(haystack)) return "dept-finance";
  if (/operations|workflow|process|integration/.test(haystack)) return "dept-ops";
  // Default to Sales for outbound/demo/website/referral
  return "dept-sales";
}

function inactivityDays(member: StoredMember): number {
  if (!member.lastActiveAt) return 999;
  return (Date.now() - new Date(member.lastActiveAt).getTime()) / 86400000;
}

function eligibleMembers(members: StoredMember[]): StoredMember[] {
  return members.filter(
    (m) =>
      m.status === "ACTIVE" &&
      m.role !== "VIEWER" &&
      m.workloadPct < 100,
  );
}

function buildSignals(input: {
  member: StoredMember;
  lead: LeadLike;
  preferredDeptId: string | null;
  workloadCeiling: number;
  recentAssignmentsCount: number;
}): { score: number; reason: string; signals: RoutingCandidate["signals"] } {
  const { member, lead, preferredDeptId, workloadCeiling, recentAssignmentsCount } = input;
  const signals: RoutingCandidate["signals"] = [];

  // Start from team-module base score for the LEAD entity (already factors role + workload + ops + recency).
  const base = scoreAssignmentMatch({ candidate: member, entityType: "LEAD", workloadCeiling });
  let score = base.score;

  // Department alignment
  if (preferredDeptId && member.departmentId === preferredDeptId) {
    score += 10;
    signals.push({ label: "Department match", delta: 10, tone: "positive" });
  } else if (preferredDeptId && member.departmentId && member.departmentId !== preferredDeptId) {
    score -= 4;
    signals.push({ label: "Different department", delta: -4, tone: "negative" });
  }

  // Lead value × workload — pushing a HIGH value lead onto a heavily loaded member hurts more
  const valueLoadInteraction = ((VALUE_PRIORITY[lead.value] ?? 50) / 100) * (member.workloadPct / 100);
  if (lead.value === "High" && member.workloadPct > 80) {
    score -= 8;
    signals.push({ label: "High-value lead on overloaded owner", delta: -8, tone: "negative" });
  } else if (lead.value === "High" && member.workloadPct < 60) {
    score += 6;
    signals.push({ label: "High-value lead with capacity", delta: 6, tone: "positive" });
  } else if (valueLoadInteraction > 0.6) {
    score -= 3;
  }

  // AI score signal — high-intent leads benefit from senior owners (MANAGER+)
  if (lead.aiScore >= 80 && (member.role === "MANAGER" || member.role === "ADMIN" || member.role === "SUPER_ADMIN")) {
    score += 5;
    signals.push({ label: "Senior owner for high-intent lead", delta: 5, tone: "positive" });
  }

  // Recency — penalize members who already received many leads recently (round-robin fairness)
  if (recentAssignmentsCount >= 3) {
    score -= 4;
    signals.push({ label: "Already received 3+ leads recently", delta: -4, tone: "negative" });
  }

  // Availability — light penalty for AWAY-bordering inactivity (< 24h not a problem, > 48h is)
  const idleHours = (Date.now() - (member.lastActiveAt ? new Date(member.lastActiveAt).getTime() : 0)) / 3600000;
  if (idleHours > 48 && idleHours < 24 * 7) {
    score -= 6;
    signals.push({ label: "Idle for 48+ hours", delta: -6, tone: "negative" });
  } else if (idleHours < 4) {
    signals.push({ label: "Active right now", delta: 0, tone: "positive" });
  }

  // Workload headroom (visible signal)
  const headroom = workloadCeiling - member.workloadPct;
  if (headroom >= 25) {
    signals.push({ label: `${headroom}pp workload headroom`, delta: 0, tone: "positive" });
  } else if (headroom <= 10) {
    signals.push({ label: `Only ${Math.max(0, headroom)}pp headroom`, delta: 0, tone: "negative" });
  }

  score = Math.round(Math.min(100, Math.max(0, score)));

  // Build the human-readable reason — pick the top 2 positive signals (or fall back to base reason).
  const positives = signals.filter((s) => s.tone === "positive" && s.delta >= 0).slice(0, 2);
  const reasonParts: string[] = [];
  if (positives.length) {
    reasonParts.push(positives.map((s) => s.label.toLowerCase()).join(" + "));
  }
  if (!positives.length) reasonParts.push(base.reason.replace(/\.$/, ""));

  // Always mention strategy hint for AI-routed leads
  const reason = `${reasonParts.join(", ")}.`;
  return { score, reason, signals };
}

function toCandidate(input: {
  member: StoredMember;
  score: number;
  reason: string;
  signals: RoutingCandidate["signals"];
}): RoutingCandidate {
  return {
    memberId: input.member.id,
    memberName: input.member.name,
    memberAvatar: input.member.avatar,
    memberRole: input.member.role,
    departmentId: input.member.departmentId,
    workloadPct: input.member.workloadPct,
    operationalScore: input.member.operationalScore,
    score: input.score,
    reason: input.reason,
    signals: input.signals,
  };
}

/**
 * Route a lead to the best execution owner.
 *
 * Returns the top candidate + up to 3 alternatives. The caller is responsible for
 * persisting the assignment (lead.ownerId + a team `Assignment` row + audit log).
 */
export function routeLead(input: {
  lead: LeadLike;
  members: StoredMember[];
  assignments: StoredAssignment[];
  departments: StoredDepartment[];
  settings: StoredTeamSettings;
  strategy?: AssignmentStrategy;
  excludeMemberIds?: string[];
}): RoutingResult {
  const strategy = input.strategy ?? input.settings.autoAssignmentStrategy ?? "ai";
  const workloadCeiling = input.settings.workloadCeiling || 90;
  const excluded = new Set(input.excludeMemberIds ?? []);
  const candidatesPool = eligibleMembers(input.members).filter((m) => !excluded.has(m.id));

  if (!candidatesPool.length) {
    return {
      strategy,
      best: null,
      alternatives: [],
      rationale: "No eligible members available — every active member is at capacity, inactive, or excluded.",
      consideredCount: 0,
    };
  }

  const preferredDeptId = inferDepartmentForLead(input.lead);

  // Recency map — number of LEAD assignments per member in the last 7 days (for round-robin fairness)
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const recentByMember = new Map<string, number>();
  for (const asg of input.assignments) {
    if (asg.entityType !== "LEAD") continue;
    if (new Date(asg.createdAt).getTime() < sevenDaysAgo) continue;
    recentByMember.set(asg.assigneeId, (recentByMember.get(asg.assigneeId) || 0) + 1);
  }

  // Build candidate scores
  const scored: RoutingCandidate[] = candidatesPool.map((member) => {
    const recent = recentByMember.get(member.id) || 0;

    if (strategy === "workload") {
      // Pure workload headroom
      const headroom = Math.max(0, workloadCeiling - member.workloadPct);
      return toCandidate({
        member,
        score: Math.round((headroom / workloadCeiling) * 100),
        reason: `Highest workload headroom (${headroom}pp under ceiling).`,
        signals: [{ label: `${headroom}pp headroom`, delta: headroom, tone: "positive" }],
      });
    }

    if (strategy === "round_robin") {
      // Inverse-recency, with dept tie-breaker
      const inverse = Math.max(0, 100 - recent * 15);
      const deptBonus = preferredDeptId && member.departmentId === preferredDeptId ? 8 : 0;
      const score = Math.min(100, inverse + deptBonus);
      return toCandidate({
        member,
        score,
        reason: recent === 0 ? "Next in round-robin rotation." : `${recent} lead${recent === 1 ? "" : "s"} this week — round-robin fairness.`,
        signals: [
          { label: `${recent} recent leads`, delta: -recent * 15, tone: recent === 0 ? "positive" : "neutral" },
          ...(deptBonus ? [{ label: "Department match", delta: deptBonus, tone: "positive" as const }] : []),
        ],
      });
    }

    // strategy === "ai" — full multi-factor
    const { score, reason, signals } = buildSignals({
      member,
      lead: input.lead,
      preferredDeptId,
      workloadCeiling,
      recentAssignmentsCount: recent,
    });
    return toCandidate({ member, score, reason, signals });
  });

  scored.sort((a, b) => b.score - a.score);

  const best = scored[0] ?? null;
  const alternatives = scored.slice(1, 4);

  let rationale: string;
  if (!best) {
    rationale = "No suitable owner found.";
  } else if (strategy === "ai") {
    const deptName = preferredDeptId
      ? input.departments.find((d) => d.id === preferredDeptId)?.name ?? null
      : null;
    rationale = `Picked ${best.memberName.split(" ")[0]} (${best.score}/100) — ${best.reason}${
      deptName ? ` Routed to ${deptName} based on lead signals.` : ""
    }`;
  } else if (strategy === "workload") {
    rationale = `Picked ${best.memberName.split(" ")[0]} via workload-balancing — ${best.workloadPct}% current vs ${workloadCeiling}% ceiling.`;
  } else {
    rationale = `Picked ${best.memberName.split(" ")[0]} via round-robin fairness.`;
  }

  return {
    strategy,
    best,
    alternatives,
    rationale,
    consideredCount: candidatesPool.length,
  };
}

/**
 * Compute the workload weight contribution of a lead, used when updating
 * member.workloadPct after assignment.
 *
 * High-value high-intent leads consume more capacity than nurture-stage leads.
 */
export function leadWorkloadWeight(lead: Pick<LeadLike, "value" | "aiScore">): number {
  const base = VALUE_WEIGHT[lead.value] ?? 5;
  const intentBoost = lead.aiScore >= 80 ? 2 : lead.aiScore >= 60 ? 1 : 0;
  return base + intentBoost;
}

/**
 * Compute the priority (0-100) of a lead-derived assignment.
 */
export function leadAssignmentPriority(lead: Pick<LeadLike, "value" | "aiScore">): number {
  const value = VALUE_PRIORITY[lead.value] ?? 50;
  const intent = lead.aiScore;
  return Math.round(value * 0.5 + intent * 0.5);
}
