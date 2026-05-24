/**
 * AETHER OS — Lead routing orchestrator.
 *
 * Bridges the Leads module and the Team module: takes a StoredLead, calls the
 * shared AI Assignment Engine, persists the team-side Assignment row + audit log,
 * updates owner workload, and returns the patch to apply back onto the lead.
 *
 * Pure side-effect coordinator — does not touch Prisma (the API route does that
 * when available). The team store is always memory-first so its writes are safe
 * to run alongside Prisma.
 */

import { teamStore } from "@/lib/team/team-store";
import { recordAudit } from "@/lib/team/audit";
import {
  routeLead,
  inferDepartmentForLead,
  leadAssignmentPriority,
  leadWorkloadWeight,
  type AssignmentStrategy,
  type LeadLike,
  type RoutingResult,
  type RoutingCandidate,
} from "./engine";
import type { StoredLead, LeadAssignmentType } from "@/lib/leads/lead-store";
import { leadStore } from "@/lib/leads/lead-store";

export interface RouteAndPersistOptions {
  lead: LeadLike;
  actorId?: string | null;
  strategy?: AssignmentStrategy;
  manualAssigneeId?: string | null;
  reason?: string | null;
  excludeMemberIds?: string[];
}

export interface RouteAndPersistResult {
  routing: RoutingResult;
  patch: Partial<StoredLead>;
  assignment: Awaited<ReturnType<typeof teamStore.createAssignment>> | null;
}

function strategyToType(strategy: AssignmentStrategy): LeadAssignmentType {
  switch (strategy) {
    case "ai":
      return "AI";
    case "workload":
      return "WORKLOAD";
    case "round_robin":
      return "ROUND_ROBIN";
    case "manual":
      return "MANUAL";
    default:
      return "MANUAL";
  }
}

/**
 * Compute the routing decision for a lead and persist all side-effects:
 *   1. Pick the best owner via the engine (or use manualAssigneeId override).
 *   2. Create a team `Assignment` row (entityType=LEAD).
 *   3. Record an audit log entry.
 *   4. Append a timeline event on the lead.
 *   5. Bump the owner's workload by the lead's workload weight.
 *   6. Return the patch to apply to the lead.
 */
export async function routeAndPersist(options: RouteAndPersistOptions): Promise<RouteAndPersistResult> {
  const snapshot = await teamStore.snapshot();
  const settings = snapshot.settings;

  let strategy: AssignmentStrategy = options.strategy ?? (settings.autoAssignmentEnabled ? settings.autoAssignmentStrategy : "manual");
  if (options.manualAssigneeId) strategy = "manual";

  let routing: RoutingResult;
  let best: RoutingCandidate | null;

  if (strategy === "manual" && options.manualAssigneeId) {
    const member = await teamStore.findMember(options.manualAssigneeId);
    if (!member) {
      routing = {
        strategy: "manual",
        best: null,
        alternatives: [],
        rationale: `Manual assignee ${options.manualAssigneeId} not found.`,
        consideredCount: 0,
      };
      best = null;
    } else {
      // Score for context even on manual selection
      const proxyResult = routeLead({
        lead: options.lead,
        members: snapshot.members,
        assignments: snapshot.assignments,
        departments: snapshot.departments,
        settings,
        strategy: "ai",
      });
      const scoredCandidate =
        proxyResult.alternatives.find((c) => c.memberId === member.id) ??
        (proxyResult.best && proxyResult.best.memberId === member.id ? proxyResult.best : null);
      best = scoredCandidate ?? {
        memberId: member.id,
        memberName: member.name,
        memberAvatar: member.avatar,
        memberRole: member.role,
        departmentId: member.departmentId,
        workloadPct: member.workloadPct,
        operationalScore: member.operationalScore,
        score: 50,
        reason: options.reason ?? "Manually assigned.",
        signals: [{ label: "Manual assignment", delta: 0, tone: "neutral" }],
      };
      routing = {
        strategy: "manual",
        best,
        alternatives: proxyResult.alternatives.filter((c) => c.memberId !== member.id).slice(0, 3),
        rationale: options.reason ?? `Manually assigned to ${member.name}.`,
        consideredCount: proxyResult.consideredCount,
      };
    }
  } else {
    routing = routeLead({
      lead: options.lead,
      members: snapshot.members,
      assignments: snapshot.assignments,
      departments: snapshot.departments,
      settings,
      strategy,
      excludeMemberIds: options.excludeMemberIds,
    });
    best = routing.best;
  }

  if (!best) {
    return {
      routing,
      patch: {
        ownerId: null,
        assignedById: options.actorId ?? null,
        assignmentType: "MANUAL",
        assignmentReason: routing.rationale,
        assignedAt: null,
        departmentId: inferDepartmentForLead(options.lead),
        followUpOwnerId: null,
        operationalStatus: "NEW",
      },
      assignment: null,
    };
  }

  const now = new Date().toISOString();
  const assignmentType: LeadAssignmentType = options.reason && strategy === "manual" ? "REASSIGNED" : strategyToType(strategy);
  const reason = options.reason ?? best.reason;
  const deptId = best.departmentId ?? inferDepartmentForLead(options.lead);

  // 1. Create the team-side Assignment row
  const assignment = await teamStore.createAssignment({
    entityType: "LEAD",
    entityId: options.lead.id,
    entityLabel: `${options.lead.company} — ${options.lead.firstName} ${options.lead.lastName}`,
    assigneeId: best.memberId,
    status: "ACTIVE",
    priority: leadAssignmentPriority(options.lead),
    workloadWeight: leadWorkloadWeight(options.lead),
    aiSuggested: strategy === "ai",
    aiReason: strategy === "ai" ? reason : null,
    notes: strategy === "manual" && options.reason ? options.reason : null,
  });

  // 2. Bump owner workload (capped at 100)
  const ownerBefore = await teamStore.findMember(best.memberId);
  if (ownerBefore) {
    const nextLoad = Math.min(100, ownerBefore.workloadPct + Math.round(leadWorkloadWeight(options.lead) / 2));
    await teamStore.updateMember(best.memberId, {
      workloadPct: nextLoad,
      lastActiveAt: ownerBefore.lastActiveAt,
    });
  }

  // 3. Append a timeline event
  try {
    await leadStore.addTimelineEvent(options.lead.id, {
      title: `Assigned to ${best.memberName}`,
      description: strategy === "ai" ? `AI Engine · ${reason}` : strategy === "manual" ? `Manual · ${reason}` : `${strategy.replace("_", " ")} · ${reason}`,
      icon: strategy === "ai" ? "sparkles" : "user",
      color: strategy === "ai" ? "purple" : "green",
    });
  } catch {
    /* timeline append is best-effort; assignment + lead patch are authoritative */
  }

  // 4. Record audit log
  await recordAudit({
    action: options.reason ? "ASSIGN" : "ASSIGN",
    actorId: options.actorId ?? null,
    targetId: best.memberId,
    entityType: "LEAD",
    entityId: options.lead.id,
    summary: `${strategy === "ai" ? "AI" : strategy === "manual" ? "Manually" : strategy.replace("_", " ")} assigned ${options.lead.company} (${options.lead.firstName} ${options.lead.lastName}) to ${best.memberName}`,
    metadata: {
      strategy,
      score: best.score,
      reason,
      leadValue: options.lead.value,
      leadAiScore: options.lead.aiScore,
      alternatives: routing.alternatives.map((a) => ({ memberId: a.memberId, score: a.score })),
    },
  });

  return {
    routing,
    patch: {
      ownerId: best.memberId,
      assignedById: options.actorId ?? null,
      assignmentType,
      assignmentReason: reason,
      assignedAt: now,
      departmentId: deptId,
      followUpOwnerId: best.memberId,
      operationalStatus: "NEW",
    },
    assignment,
  };
}

/**
 * Reassignment helper — closes the prior active assignment, opens a new one,
 * and decrements the prior owner's workload.
 */
export async function reassignLead(options: RouteAndPersistOptions & { previousOwnerId?: string | null }): Promise<RouteAndPersistResult> {
  // Find the active assignment for this lead and mark it REASSIGNED
  if (options.previousOwnerId) {
    const { assignments } = await teamStore.listAssignments({ assigneeId: options.previousOwnerId, status: "ACTIVE", limit: 50 });
    const priorAssignment = assignments.find((a) => a.entityType === "LEAD" && a.entityId === options.lead.id);
    if (priorAssignment) {
      await teamStore.updateAssignment(priorAssignment.id, {
        status: "REASSIGNED",
        reassignedById: options.actorId ?? null,
      });
    }

    // Decrement prior owner workload
    const prior = await teamStore.findMember(options.previousOwnerId);
    if (prior) {
      const weight = leadWorkloadWeight(options.lead);
      await teamStore.updateMember(options.previousOwnerId, {
        workloadPct: Math.max(0, prior.workloadPct - Math.round(weight / 2)),
      });
    }
  }

  // Auto-exclude the previous owner so AI-driven reroutes always pick a different
  // member. Callers can still override by passing manualAssigneeId or a custom
  // excludeMemberIds list.
  const excludeMemberIds = Array.from(
    new Set([...(options.excludeMemberIds ?? []), ...(options.previousOwnerId ? [options.previousOwnerId] : [])]),
  );

  const result = await routeAndPersist({
    ...options,
    strategy: options.strategy ?? "ai",
    excludeMemberIds,
  });

  // Tag this assignment as REASSIGNED in the lead patch
  if (result.patch.assignmentType !== "MANUAL") {
    result.patch.assignmentType = "REASSIGNED";
  }

  // Link the new Assignment row back to the prior one for audit trail
  if (result.assignment && options.previousOwnerId) {
    const { assignments } = await teamStore.listAssignments({ assigneeId: options.previousOwnerId, status: "REASSIGNED", limit: 5 });
    const priorAssignment = assignments.find((a) => a.entityType === "LEAD" && a.entityId === options.lead.id);
    if (priorAssignment) {
      await teamStore.updateAssignment(result.assignment.id, {
        reassignedFromId: priorAssignment.id,
        reassignedById: options.actorId ?? null,
      });
    }
  }

  return result;
}
