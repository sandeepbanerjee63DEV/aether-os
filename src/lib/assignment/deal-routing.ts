/**
 * AETHER OS — Deal routing orchestrator.
 *
 * Bridges the Deals module and the Team module: takes a StoredDeal, calls the
 * shared AI Assignment Engine, persists the team-side Assignment row + audit log,
 * updates owner workload, and returns the patch to apply back onto the deal.
 *
 * Mirrors src/lib/assignment/lead-routing.ts. Pure side-effect coordinator —
 * does not touch Prisma directly (the API route does that when available).
 */

import { teamStore } from "@/lib/team/team-store";
import { recordAudit } from "@/lib/team/audit";
import {
  routeDeal,
  inferDepartmentForDeal,
  inferSupportingDepartments,
  dealAssignmentPriority,
  dealWorkloadWeight,
  type AssignmentStrategy,
  type DealLike,
  type RoutingResult,
  type RoutingCandidate,
} from "./engine";
import { dealStore, type StoredDeal, type DealAssignmentType } from "@/lib/deals/deal-store";

export interface RouteAndPersistDealOptions {
  deal: DealLike;
  actorId?: string | null;
  strategy?: AssignmentStrategy;
  manualAssigneeId?: string | null;
  reason?: string | null;
  excludeMemberIds?: string[];
  continuityOwnerId?: string | null;
}

export interface RouteAndPersistDealResult {
  routing: RoutingResult;
  patch: Partial<StoredDeal>;
  assignment: Awaited<ReturnType<typeof teamStore.createAssignment>> | null;
}

function strategyToType(strategy: AssignmentStrategy): DealAssignmentType {
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

function formatCurrency(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `$${value}`;
}

/**
 * Compute the routing decision for a deal and persist all side-effects:
 *   1. Pick the best owner via the engine (or use manualAssigneeId override).
 *   2. Create a team `Assignment` row (entityType=DEAL).
 *   3. Record an audit log entry.
 *   4. Append a deal activity event.
 *   5. Bump the owner's workload by the deal's workload weight.
 *   6. Return the patch to apply to the deal.
 */
export async function routeAndPersistDeal(
  options: RouteAndPersistDealOptions,
): Promise<RouteAndPersistDealResult> {
  const snapshot = await teamStore.snapshot();
  const settings = snapshot.settings;

  let strategy: AssignmentStrategy =
    options.strategy ?? (settings.autoAssignmentEnabled ? settings.autoAssignmentStrategy : "manual");
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
      // Score for context even on manual selection so we can surface alternatives.
      const proxyResult = routeDeal({
        deal: options.deal,
        members: snapshot.members,
        assignments: snapshot.assignments,
        departments: snapshot.departments,
        settings,
        strategy: "ai",
        continuityOwnerId: options.continuityOwnerId ?? null,
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
    routing = routeDeal({
      deal: options.deal,
      members: snapshot.members,
      assignments: snapshot.assignments,
      departments: snapshot.departments,
      settings,
      strategy,
      excludeMemberIds: options.excludeMemberIds,
      continuityOwnerId: options.continuityOwnerId ?? null,
    });
    best = routing.best;
  }

  const primaryDeptId = inferDepartmentForDeal(options.deal);
  const supportingDepartmentIds = inferSupportingDepartments(options.deal, primaryDeptId);

  if (!best) {
    return {
      routing,
      patch: {
        ownerId: null,
        ownerName: null,
        assignedById: options.actorId ?? null,
        assignmentType: "MANUAL",
        assignmentReason: routing.rationale,
        assignedAt: null,
        departmentId: primaryDeptId,
        supportingDepartmentIds,
        operationalStatus: "NEW",
      },
      assignment: null,
    };
  }

  const now = new Date().toISOString();
  const assignmentType: DealAssignmentType =
    options.reason && strategy === "manual" ? "REASSIGNED" : strategyToType(strategy);
  const reason = options.reason ?? best.reason;
  const deptId = best.departmentId ?? primaryDeptId;

  // 1. Create the team-side Assignment row
  const assignment = await teamStore.createAssignment({
    entityType: "DEAL",
    entityId: options.deal.id,
    entityLabel: `${options.deal.title} (${formatCurrency(options.deal.value)})`,
    assigneeId: best.memberId,
    status: "ACTIVE",
    priority: dealAssignmentPriority(options.deal),
    workloadWeight: dealWorkloadWeight(options.deal),
    aiSuggested: strategy === "ai",
    aiReason: strategy === "ai" ? reason : null,
    notes: strategy === "manual" && options.reason ? options.reason : null,
  });

  // 2. Bump owner workload (capped at 100)
  const ownerBefore = await teamStore.findMember(best.memberId);
  if (ownerBefore) {
    const nextLoad = Math.min(
      100,
      ownerBefore.workloadPct + Math.round(dealWorkloadWeight(options.deal) / 2),
    );
    await teamStore.updateMember(best.memberId, {
      workloadPct: nextLoad,
      lastActiveAt: ownerBefore.lastActiveAt,
    });
  }

  // 3. Append a deal activity event
  try {
    await dealStore.addActivity(options.deal.id, {
      type: "assignment",
      title: `Assigned to ${best.memberName}`,
      description:
        strategy === "ai"
          ? `AI Engine · ${reason}`
          : strategy === "manual"
            ? `Manual · ${reason}`
            : `${strategy.replace("_", " ")} · ${reason}`,
      icon: strategy === "ai" ? "sparkles" : "user",
      color: strategy === "ai" ? "purple" : "green",
    });
  } catch {
    /* activity append is best-effort; assignment + deal patch are authoritative */
  }

  // 4. Record audit log
  await recordAudit({
    action: "ASSIGN",
    actorId: options.actorId ?? null,
    targetId: best.memberId,
    entityType: "DEAL",
    entityId: options.deal.id,
    summary: `${
      strategy === "ai" ? "AI" : strategy === "manual" ? "Manually" : strategy.replace("_", " ")
    } assigned ${options.deal.title} (${formatCurrency(options.deal.value)}) to ${best.memberName}`,
    metadata: {
      strategy,
      score: best.score,
      reason,
      dealValue: options.deal.value,
      dealStage: options.deal.stage,
      aiProbability: options.deal.aiProbability,
      supportingDepartmentIds,
      alternatives: routing.alternatives.map((a) => ({ memberId: a.memberId, score: a.score })),
    },
  });

  return {
    routing,
    patch: {
      ownerId: best.memberId,
      ownerName: best.memberName,
      assignedById: options.actorId ?? null,
      assignmentType,
      assignmentReason: reason,
      assignedAt: now,
      departmentId: deptId,
      supportingDepartmentIds,
      operationalStatus: "ACTIVE",
      lastActivityAt: now,
    },
    assignment,
  };
}

/**
 * Reassignment helper — closes the prior active assignment, opens a new one,
 * and decrements the prior owner's workload. Mirrors `reassignLead`.
 */
export async function reassignDeal(
  options: RouteAndPersistDealOptions & { previousOwnerId?: string | null },
): Promise<RouteAndPersistDealResult> {
  // Find the active assignment for this deal and mark it REASSIGNED
  if (options.previousOwnerId) {
    const { assignments } = await teamStore.listAssignments({
      assigneeId: options.previousOwnerId,
      status: "ACTIVE",
      limit: 50,
    });
    const priorAssignment = assignments.find(
      (a) => a.entityType === "DEAL" && a.entityId === options.deal.id,
    );
    if (priorAssignment) {
      await teamStore.updateAssignment(priorAssignment.id, {
        status: "REASSIGNED",
        reassignedById: options.actorId ?? null,
      });
    }

    // Decrement prior owner workload
    const prior = await teamStore.findMember(options.previousOwnerId);
    if (prior) {
      const weight = dealWorkloadWeight(options.deal);
      await teamStore.updateMember(options.previousOwnerId, {
        workloadPct: Math.max(0, prior.workloadPct - Math.round(weight / 2)),
      });
    }
  }

  // Auto-exclude the previous owner so AI-driven reroutes always pick a different
  // member. Callers can still override by passing manualAssigneeId.
  const excludeMemberIds = Array.from(
    new Set([
      ...(options.excludeMemberIds ?? []),
      ...(options.previousOwnerId ? [options.previousOwnerId] : []),
    ]),
  );

  const result = await routeAndPersistDeal({
    ...options,
    strategy: options.strategy ?? "ai",
    excludeMemberIds,
  });

  // Tag the new assignment row as REASSIGNED in the deal patch
  if (result.patch.assignmentType !== "MANUAL") {
    result.patch.assignmentType = "REASSIGNED";
  }

  // Link the new Assignment row back to the prior one for audit trail
  if (result.assignment && options.previousOwnerId) {
    const { assignments } = await teamStore.listAssignments({
      assigneeId: options.previousOwnerId,
      status: "REASSIGNED",
      limit: 5,
    });
    const priorAssignment = assignments.find(
      (a) => a.entityType === "DEAL" && a.entityId === options.deal.id,
    );
    if (priorAssignment) {
      await teamStore.updateAssignment(result.assignment.id, {
        reassignedFromId: priorAssignment.id,
        reassignedById: options.actorId ?? null,
      });
    }
  }

  return result;
}
