import { NextRequest, NextResponse } from "next/server";
import { teamStore } from "@/lib/team/team-store";

const ACTION_META: Record<string, { icon: string; color: string }> = {
  CREATE: { icon: "user-plus", color: "emerald" },
  UPDATE: { icon: "edit", color: "blue" },
  DELETE: { icon: "trash", color: "red" },
  ASSIGN: { icon: "git-branch", color: "indigo" },
  ROLE_CHANGE: { icon: "key-round", color: "purple" },
  DEPARTMENT_CHANGE: { icon: "network", color: "blue" },
  INVITE: { icon: "mail", color: "indigo" },
  SUSPEND: { icon: "user-x", color: "red" },
  RESTORE: { icon: "user-check", color: "emerald" },
  BULK_OPERATION: { icon: "layers", color: "purple" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "30", 10);

  const audit = await teamStore.listAuditLogs({ limit });
  const members = (await teamStore.snapshot()).members;
  const byId = new Map(members.map((m) => [m.id, m]));

  const items = audit.map((a) => {
    const actor = a.actorId ? byId.get(a.actorId) : null;
    const target = a.targetId ? byId.get(a.targetId) : null;
    const meta = ACTION_META[a.action] ?? { icon: "circle", color: "slate" };
    return {
      id: a.id,
      action: a.action,
      icon: meta.icon,
      color: meta.color,
      summary: a.summary,
      actor: actor ? { id: actor.id, name: actor.name, avatar: actor.avatar } : null,
      target: target ? { id: target.id, name: target.name, avatar: target.avatar } : null,
      entityType: a.entityType,
      diff: a.diff,
      metadata: a.metadata,
      createdAt: a.createdAt,
    };
  });

  return NextResponse.json({ items });
}
