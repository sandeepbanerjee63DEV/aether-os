import { NextRequest, NextResponse } from "next/server";
import { teamStore, type BaseRole, type MemberStatus } from "@/lib/team/team-store";
import { recordAudit } from "@/lib/team/audit";
import { getSession } from "@/lib/auth/jwt";

type BulkAction = "SUSPEND" | "RESTORE" | "DELETE" | "CHANGE_ROLE" | "TRANSFER_DEPARTMENT";

interface BulkBody {
  ids: string[];
  action: BulkAction;
  payload?: { role?: BaseRole; departmentId?: string };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  let body: BulkBody;
  try {
    body = (await req.json()) as BulkBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!Array.isArray(body.ids) || !body.ids.length) {
    return NextResponse.json({ error: "No member ids provided" }, { status: 400 });
  }
  if (!body.action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  let affected = 0;
  const summaries: string[] = [];

  for (const id of body.ids) {
    const m = await teamStore.findMember(id);
    if (!m) continue;
    if (body.action === "SUSPEND") {
      await teamStore.updateMember(id, { status: "SUSPENDED" });
      summaries.push(`Suspended ${m.name}`);
      affected++;
    } else if (body.action === "RESTORE") {
      await teamStore.updateMember(id, { status: "ACTIVE" });
      summaries.push(`Restored ${m.name}`);
      affected++;
    } else if (body.action === "DELETE") {
      await teamStore.removeMember(id);
      summaries.push(`Removed ${m.name}`);
      affected++;
    } else if (body.action === "CHANGE_ROLE" && body.payload?.role) {
      await teamStore.updateMember(id, { role: body.payload.role });
      summaries.push(`Changed ${m.name}'s role to ${body.payload.role.replace("_", " ")}`);
      affected++;
    } else if (body.action === "TRANSFER_DEPARTMENT" && body.payload?.departmentId !== undefined) {
      await teamStore.updateMember(id, { departmentId: body.payload.departmentId || null });
      summaries.push(`Transferred ${m.name}`);
      affected++;
    }
  }

  await recordAudit({
    action: "BULK_OPERATION",
    actorId: session?.sub ?? null,
    targetId: null,
    entityType: "USER",
    entityId: null,
    summary: `Bulk ${body.action.toLowerCase().replace("_", " ")} affected ${affected} member${affected === 1 ? "" : "s"}`,
    metadata: { action: body.action, ids: body.ids, payload: body.payload, summaries },
  });

  return NextResponse.json({ affected });
}

const STATUS_KEYS: MemberStatus[] = ["ACTIVE", "AWAY", "SUSPENDED", "PENDING_INVITE", "INACTIVE"];
void STATUS_KEYS;
