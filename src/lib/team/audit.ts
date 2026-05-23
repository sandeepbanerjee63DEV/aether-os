/**
 * Audit-log helper. All write-side Team APIs should call `recordAudit()`
 * so changes show up in the Audit Logs UI and (when DB is configured)
 * stream into Prisma.
 */

import { teamStore, type AuditAction } from "./team-store";

export interface AuditEvent {
  action: AuditAction;
  actorId: string | null;
  targetId?: string | null;
  entityType: string;
  entityId?: string | null;
  summary: string;
  diff?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export async function recordAudit(event: AuditEvent): Promise<void> {
  try {
    await teamStore.appendAuditLog({
      action: event.action,
      actorId: event.actorId,
      targetId: event.targetId ?? null,
      entityType: event.entityType,
      entityId: event.entityId ?? null,
      summary: event.summary,
      diff: event.diff ?? null,
      metadata: event.metadata ?? null,
    });
  } catch {
    /* never let auditing break the primary action */
  }
}

/** Compute a JSON diff between two objects (returns only changed keys). */
export function diff(
  before: Record<string, unknown> | object,
  after: Record<string, unknown> | object
): Record<string, [unknown, unknown]> {
  const out: Record<string, [unknown, unknown]> = {};
  const b = before as Record<string, unknown>;
  const a = after as Record<string, unknown>;
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
  for (const k of keys) {
    if (JSON.stringify(b[k]) !== JSON.stringify(a[k])) {
      out[k] = [b[k], a[k]];
    }
  }
  return out;
}
