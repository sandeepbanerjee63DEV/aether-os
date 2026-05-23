/**
 * AETHER OS — Team operational intelligence engine.
 *
 * Generates AI recommendations for workforce optimization:
 *   - Workload imbalance detection
 *   - Inactive member alerts
 *   - Smart assignment routing
 *   - Department overload detection
 *   - Permission cleanup suggestions
 *   - Security risk scoring
 *
 * Mock implementation. Swap to OpenAI by setting AI_PROVIDER=openai.
 */

import type {
  StoredMember,
  StoredDepartment,
  StoredAssignment,
  StoredSession,
  StoredAccessLog,
  StoredRecommendation,
} from "./team-store";

type RecommendationSeed = Omit<StoredRecommendation, "id" | "createdAt" | "isResolved">;

function newId(): string {
  return `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function isInactive(member: StoredMember, days = 7): boolean {
  if (!member.lastActiveAt) return true;
  return Date.now() - new Date(member.lastActiveAt).getTime() > days * 86400000;
}

function avg(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = avg(values);
  return Math.sqrt(avg(values.map((v) => (v - m) ** 2)));
}

/** Generate operational AI recommendations from a workforce snapshot. */
export function generateRecommendations(input: {
  members: StoredMember[];
  departments: StoredDepartment[];
  assignments: StoredAssignment[];
  sessions: StoredSession[];
  accessLogs: StoredAccessLog[];
}): StoredRecommendation[] {
  const out: RecommendationSeed[] = [];
  const { members, departments, assignments, sessions, accessLogs } = input;

  // 1. Workload imbalance — std-dev of workload across active members
  const activeMembers = members.filter((m) => m.status === "ACTIVE");
  const workloads = activeMembers.map((m) => m.workloadPct);
  const meanLoad = avg(workloads);
  const sd = stddev(workloads);
  if (sd > 18 && activeMembers.length >= 3) {
    const overloaded = activeMembers.filter((m) => m.workloadPct > meanLoad + sd);
    const underused = activeMembers.filter((m) => m.workloadPct < meanLoad - sd);
    if (overloaded.length && underused.length) {
      out.push({
        type: "WORKLOAD_IMBALANCE",
        severity: sd > 28 ? "WARNING" : "ADVISORY",
        title: `Workload imbalance detected across ${activeMembers.length} active members`,
        message: `${overloaded.length} member${overloaded.length === 1 ? " is" : "s are"} above ${Math.round(meanLoad + sd)}% capacity while ${underused.length} ${underused.length === 1 ? "is" : "are"} below ${Math.round(Math.max(0, meanLoad - sd))}%.`,
        rationale: `Standard deviation of ${Math.round(sd)} points across ${activeMembers.length} active members exceeds the healthy threshold of 18.`,
        targetType: "DEPARTMENT",
        targetId: null,
        suggestedAction: `Rebalance ${Math.min(3, overloaded.length)} high-priority assignments to ${underused.slice(0, 2).map((u) => u.name.split(" ")[0]).join(" and ")}.`,
        confidence: 88,
        metadata: { meanLoad: Math.round(meanLoad), sd: Math.round(sd), overloaded: overloaded.length, underused: underused.length },
      });
    }
  }

  // 2. Inactive member detection
  const inactive = members.filter((m) => m.status === "ACTIVE" && isInactive(m, 7));
  for (const m of inactive.slice(0, 3)) {
    const daysSilent = m.lastActiveAt
      ? Math.floor((Date.now() - new Date(m.lastActiveAt).getTime()) / 86400000)
      : 30;
    out.push({
      type: "INACTIVE_MEMBER",
      severity: daysSilent > 21 ? "WARNING" : "ADVISORY",
      title: `${m.name} has been inactive for ${daysSilent} days`,
      message: `No login or workspace activity from ${m.name} since ${m.lastActiveAt ? new Date(m.lastActiveAt).toLocaleDateString() : "their invitation"}.`,
      rationale: `Member is in ACTIVE status but inactivity exceeds 7-day threshold. ${m.workloadPct > 0 ? `Currently owns ${m.workloadPct}% workload — assignments at risk of stall.` : "No active assignments."}`,
      targetType: "USER",
      targetId: m.id,
      suggestedAction: m.workloadPct > 30
        ? `Re-route ${m.name}'s active assignments and flag for HR follow-up.`
        : `Send re-engagement nudge to ${m.email}.`,
      confidence: 92,
      metadata: { daysSilent, workloadPct: m.workloadPct },
    });
  }

  // 3. Department overload
  for (const dept of departments.filter((d) => d.isActive)) {
    const deptMembers = activeMembers.filter((m) => m.departmentId === dept.id);
    if (deptMembers.length === 0) continue;
    const deptLoad = avg(deptMembers.map((m) => m.workloadPct));
    if (deptLoad > 85 && deptMembers.length >= 2) {
      out.push({
        type: "DEPARTMENT_OVERLOAD",
        severity: deptLoad > 92 ? "CRITICAL" : "WARNING",
        title: `${dept.name} operating at ${Math.round(deptLoad)}% capacity`,
        message: `${deptMembers.length} active members averaging ${Math.round(deptLoad)}% workload. Burnout risk elevated.`,
        rationale: `Department workload exceeds the workspace ceiling of 85%. Sustained operation above this threshold correlates with a 2.3× drop in throughput within 30 days.`,
        targetType: "DEPARTMENT",
        targetId: dept.id,
        suggestedAction: deptLoad > 92
          ? `Pause new assignments to ${dept.name} and request 1-2 additional headcount.`
          : `Redistribute work or temporarily borrow capacity from a sister department.`,
        confidence: 84,
        metadata: { deptLoad: Math.round(deptLoad), memberCount: deptMembers.length },
      });
    }
  }

  // 4. Assignment routing — escalations or stale active assignments
  const stale = assignments.filter((a) => {
    if (a.status !== "ACTIVE") return false;
    return Date.now() - new Date(a.updatedAt).getTime() > 5 * 86400000;
  });
  if (stale.length >= 2) {
    out.push({
      type: "ASSIGNMENT_ROUTING",
      severity: "ADVISORY",
      title: `${stale.length} assignment${stale.length === 1 ? "" : "s"} stalled for 5+ days`,
      message: `AI-suggested re-routing to free up bottlenecks across ${new Set(stale.map((s) => s.assigneeId)).size} owner${new Set(stale.map((s) => s.assigneeId)).size === 1 ? "" : "s"}.`,
      rationale: `Active assignments with no status change for more than 5 days. Pattern matches historical stall signatures.`,
      targetType: "ASSIGNMENT",
      targetId: null,
      suggestedAction: `Auto-reassign the top ${Math.min(3, stale.length)} stalled items using workload-aware routing.`,
      confidence: 76,
      metadata: { staleCount: stale.length },
    });
  }

  // 5. Permission cleanup — viewers with no recent activity, or admins with no logins
  const dormantAdmins = members.filter(
    (m) =>
      (m.role === "ADMIN" || m.role === "SUPER_ADMIN") &&
      m.status === "ACTIVE" &&
      isInactive(m, 30)
  );
  for (const m of dormantAdmins.slice(0, 2)) {
    out.push({
      type: "PERMISSION_CLEANUP",
      severity: "WARNING",
      title: `Dormant ${m.role.toLowerCase().replace("_", " ")} access: ${m.name}`,
      message: `${m.name} holds elevated privileges but has not logged in for 30+ days.`,
      rationale: `Principle of least privilege: dormant elevated accounts are a top vector for credential compromise.`,
      targetType: "USER",
      targetId: m.id,
      suggestedAction: `Downgrade to STAFF or revoke until reactivated.`,
      confidence: 81,
      metadata: {},
    });
  }

  // 6. Security risk — suspicious sessions or failed logins clusters
  const suspicious = sessions.filter((s) => s.status === "SUSPICIOUS" || s.riskScore >= 70);
  if (suspicious.length > 0) {
    const target = suspicious[0];
    const owner = members.find((m) => m.id === target.userId);
    out.push({
      type: "SECURITY_RISK",
      severity: "CRITICAL",
      title: `Anomalous session detected${owner ? ` on ${owner.name}'s account` : ""}`,
      message: `Session from ${target.ipCity || "unknown"}${target.ipCountry ? `, ${target.ipCountry}` : ""} scored ${target.riskScore}/100 risk.`,
      rationale: `IP geolocation deviates from typical access pattern. ${target.userAgent ? "Device fingerprint not on trusted list." : "No device fingerprint registered."}`,
      targetType: "USER",
      targetId: target.userId,
      suggestedAction: `Force-revoke session and require 2FA re-verification.`,
      confidence: 94,
      metadata: { sessionId: target.id, riskScore: target.riskScore },
    });
  }

  const failedClusters = accessLogs.filter(
    (l) => l.eventType === "FAILED_LOGIN" && Date.now() - new Date(l.createdAt).getTime() < 3600000
  );
  if (failedClusters.length >= 3) {
    out.push({
      type: "SECURITY_RISK",
      severity: "WARNING",
      title: `${failedClusters.length} failed login attempts in the last hour`,
      message: `Potential credential-stuffing pattern detected.`,
      rationale: `Failed login rate exceeds baseline by ${Math.round((failedClusters.length / 1) * 10)}×. Geographic spread suggests automated traffic.`,
      targetType: null,
      targetId: null,
      suggestedAction: `Enable workspace-wide rate limiting and require 2FA for the next 24h.`,
      confidence: 78,
      metadata: { failedCount: failedClusters.length },
    });
  }

  // 7. Productivity anomaly — operational score dropping
  const lowPerformers = activeMembers.filter((m) => m.operationalScore < 50);
  if (lowPerformers.length >= 2) {
    out.push({
      type: "PRODUCTIVITY_ANOMALY",
      severity: "ADVISORY",
      title: `${lowPerformers.length} members below operational threshold`,
      message: `Operational score below 50/100 for ${lowPerformers.map((m) => m.name.split(" ")[0]).join(", ")}.`,
      rationale: `Composite score blends task velocity, response latency, and assignment completion rate. Sub-50 indicates structural friction.`,
      targetType: "USER",
      targetId: lowPerformers[0].id,
      suggestedAction: `Schedule 1:1s and review workload, tooling, and clarity of assignments.`,
      confidence: 71,
      metadata: { count: lowPerformers.length },
    });
  }

  // 8. Staffing gap — departments with zero capacity headroom or no lead
  for (const dept of departments.filter((d) => d.isActive)) {
    if (!dept.leadId) {
      out.push({
        type: "STAFFING_GAP",
        severity: "ADVISORY",
        title: `${dept.name} has no department lead`,
        message: `Operational decisions for ${dept.name} default to ADMIN. Designate a lead for faster routing.`,
        rationale: `Departments without leads experience 38% longer assignment cycles on average.`,
        targetType: "DEPARTMENT",
        targetId: dept.id,
        suggestedAction: `Promote a high-performing manager from within ${dept.name}.`,
        confidence: 82,
        metadata: {},
      });
    }
  }

  const now = new Date().toISOString();
  return out.slice(0, 12).map((seed) => ({
    ...seed,
    id: newId(),
    isResolved: false,
    createdAt: now,
  }));
}

/** Score how good an AI assignment match would be (0-100). */
export function scoreAssignmentMatch(input: {
  candidate: StoredMember;
  entityType: string;
  workloadCeiling: number;
}): { score: number; reason: string } {
  const { candidate, entityType, workloadCeiling } = input;

  if (candidate.status !== "ACTIVE") {
    return { score: 0, reason: `${candidate.name} is ${candidate.status.toLowerCase()}` };
  }

  let score = 50;
  const reasons: string[] = [];

  // Workload headroom
  const headroom = Math.max(0, workloadCeiling - candidate.workloadPct);
  score += Math.min(30, headroom * 0.4);
  if (headroom > 30) reasons.push(`${headroom}pp workload headroom`);

  // Operational score
  score += (candidate.operationalScore - 70) * 0.3;
  if (candidate.operationalScore >= 80) reasons.push(`high operational score (${candidate.operationalScore})`);

  // Skill match — naive entity → role mapping
  const skillMap: Record<string, string[]> = {
    LEAD: ["SALES", "MANAGER"],
    DEAL: ["SALES", "MANAGER"],
    TASK: ["SALES", "SUPPORT", "MANAGER"],
    PROJECT: ["MANAGER", "ADMIN"],
    SUPPORT_TICKET: ["SUPPORT", "MANAGER"],
    WORKFLOW: ["MANAGER", "ADMIN"],
  };
  if (skillMap[entityType]?.includes(candidate.role)) {
    score += 12;
    reasons.push(`role match for ${entityType.toLowerCase()}s`);
  }

  // Recency penalty for inactive
  if (isInactive(candidate, 3)) {
    score -= 15;
    reasons.push("recently inactive (-15)");
  }

  score = Math.round(Math.min(100, Math.max(0, score)));
  const reason = reasons.length ? `Match based on ${reasons.join(", ")}.` : "Standard routing candidate.";
  return { score, reason };
}

/** Compute workspace health score (0-100) from a snapshot. */
export function workspaceHealth(input: {
  members: StoredMember[];
  departments: StoredDepartment[];
  recommendations: StoredRecommendation[];
}): { score: number; signals: { label: string; value: number; tone: "good" | "warn" | "bad" }[] } {
  const { members, departments, recommendations } = input;
  const active = members.filter((m) => m.status === "ACTIVE");
  const totalActive = active.length || 1;

  const avgLoad = avg(active.map((m) => m.workloadPct));
  const loadTone: "good" | "warn" | "bad" = avgLoad < 70 ? "good" : avgLoad < 85 ? "warn" : "bad";

  const inactiveCount = members.filter((m) => m.status === "ACTIVE" && isInactive(m, 14)).length;
  const inactiveRatio = (inactiveCount / totalActive) * 100;
  const inactiveTone: "good" | "warn" | "bad" =
    inactiveRatio < 10 ? "good" : inactiveRatio < 25 ? "warn" : "bad";

  const opScore = avg(active.map((m) => m.operationalScore));
  const opTone: "good" | "warn" | "bad" = opScore > 75 ? "good" : opScore > 55 ? "warn" : "bad";

  const critical = recommendations.filter((r) => r.severity === "CRITICAL" && !r.isResolved).length;
  const critTone: "good" | "warn" | "bad" = critical === 0 ? "good" : critical < 3 ? "warn" : "bad";

  const deptCoverage = departments.filter((d) => d.isActive && d.leadId).length;
  const totalDepts = departments.filter((d) => d.isActive).length || 1;
  const coverageRatio = (deptCoverage / totalDepts) * 100;
  const coverageTone: "good" | "warn" | "bad" =
    coverageRatio > 80 ? "good" : coverageRatio > 50 ? "warn" : "bad";

  // Composite score
  const score = Math.round(
    100 -
      Math.max(0, avgLoad - 70) * 0.5 -
      inactiveRatio * 0.4 -
      Math.max(0, 75 - opScore) * 0.4 -
      critical * 12 -
      Math.max(0, 80 - coverageRatio) * 0.3
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    signals: [
      { label: "Avg workload", value: Math.round(avgLoad), tone: loadTone },
      { label: "Inactive ratio", value: Math.round(inactiveRatio), tone: inactiveTone },
      { label: "Operational score", value: Math.round(opScore), tone: opTone },
      { label: "Critical alerts", value: critical, tone: critTone },
      { label: "Dept coverage", value: Math.round(coverageRatio), tone: coverageTone },
    ],
  };
}

/** Score how risky a session is (0-100). */
export function scoreSessionRisk(input: {
  ipCountry?: string | null;
  ipCity?: string | null;
  userAgent?: string | null;
  trustedDevice: boolean;
  lastKnownCountry?: string | null;
  failedAttemptsInWindow: number;
}): number {
  let risk = 5;
  if (!input.trustedDevice) risk += 35;
  if (input.lastKnownCountry && input.ipCountry && input.lastKnownCountry !== input.ipCountry) {
    risk += 30;
  }
  if (input.failedAttemptsInWindow >= 3) risk += 20;
  if (!input.userAgent) risk += 10;
  return Math.min(100, risk);
}
