import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadStore } from "@/lib/leads/lead-store";
import { classifyLead } from "@/lib/ai/engine";

export type LeadActionType =
  | "EMAIL"
  | "CALL"
  | "DEMO"
  | "NURTURE"
  | "DONE"
  | "REGENERATE";

interface ActionBody {
  action?: LeadActionType;
  note?: string;
}

interface ActionPlan {
  timeline: {
    title: string;
    description?: string | null;
    icon: string;
    color: string;
  } | null;
  patch: {
    nextBestAction?: string;
    status?: string;
    stage?: string;
    aiClassification?: string;
    aiAnalysis?: string;
    aiScore?: number;
    convertProbability?: number;
    tags?: string[];
  };
}

interface LeadLike {
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  nextBestAction?: string | null;
  source?: string | null;
  leadType?: string | null;
  value?: string | null;
  email?: string | null;
}

function buildPlan(action: LeadActionType, lead: LeadLike, note?: string): ActionPlan {
  const name = `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "lead";
  const prevNba = lead.nextBestAction || "next best action";

  switch (action) {
    case "EMAIL":
      return {
        timeline: {
          title: `Follow-up email sent to ${name}`,
          description: note || `Personalized email triggered from Next Best Action.`,
          icon: "mail",
          color: "yellow",
        },
        patch: {
          nextBestAction: "Schedule a call to confirm interest",
          status: "FOLLOW_UP",
          stage: "FOLLOW_UP",
        },
      };
    case "CALL":
      return {
        timeline: {
          title: `Discovery call scheduled with ${name}`,
          description: note || `Call queued from Next Best Action.`,
          icon: "phone",
          color: "orange",
        },
        patch: {
          nextBestAction: "Run discovery call and qualify budget",
          status: "ASSIGNED",
          stage: "ASSIGNED",
        },
      };
    case "DEMO":
      return {
        timeline: {
          title: `Product demo scheduled with ${name}`,
          description: note || `Demo invitation sent from Next Best Action.`,
          icon: "calendar",
          color: "purple",
        },
        patch: {
          nextBestAction: "Send tailored proposal after demo",
          status: "HOT",
          stage: "FOLLOW_UP",
        },
      };
    case "NURTURE":
      return {
        timeline: {
          title: `Added to nurture campaign`,
          description: note || `Lead routed to long-cycle nurture sequence.`,
          icon: "globe",
          color: "blue",
        },
        patch: {
          nextBestAction: "Monitor engagement and follow up in 14 days",
          status: "NURTURING",
          stage: "NURTURING",
        },
      };
    case "DONE":
      return {
        timeline: {
          title: `Action completed: ${prevNba}`,
          description: note || `Marked as completed by the rep.`,
          icon: "check",
          color: "green",
        },
        patch: {},
      };
    case "REGENERATE":
    default:
      return { timeline: null, patch: {} };
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: ActionBody = {};
  try {
    body = await req.json();
  } catch {
    /* allow empty */
  }
  const action = body.action;
  if (!action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  try {
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) throw new Error("not-found-via-prisma");

    const plan = buildPlan(action, existing, body.note);

    if (action === "REGENERATE" || action === "DONE") {
      const ai = await classifyLead({
        source: existing.source,
        leadType: existing.leadType,
        value: existing.value,
      });
      plan.patch.nextBestAction = ai.nextBestAction;
      plan.patch.aiClassification = ai.classification;
      plan.patch.aiAnalysis = ai.analysis;
      plan.patch.aiScore = ai.score;
      plan.patch.convertProbability = ai.convertProbability;
      plan.patch.tags = ai.tags;
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: plan.patch as never,
    });

    let timelineEvent = null;
    if (plan.timeline) {
      timelineEvent = await prisma.timelineEvent.create({
        data: {
          leadId: id,
          title: plan.timeline.title,
          description: plan.timeline.description ?? null,
          icon: plan.timeline.icon,
          color: plan.timeline.color,
        },
      });
    }
    return NextResponse.json({ lead, timelineEvent });
  } catch {
    const existing = await leadStore.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const plan = buildPlan(action, existing, body.note);

    if (action === "REGENERATE" || action === "DONE") {
      const ai = await classifyLead({
        source: existing.source,
        leadType: existing.leadType,
        value: existing.value,
      });
      plan.patch.nextBestAction = ai.nextBestAction;
      plan.patch.aiClassification = ai.classification;
      plan.patch.aiAnalysis = ai.analysis;
      plan.patch.aiScore = ai.score;
      plan.patch.convertProbability = ai.convertProbability;
      plan.patch.tags = ai.tags;
    }

    const lead = await leadStore.update(id, plan.patch);
    let timelineEvent = null;
    if (plan.timeline) {
      timelineEvent = await leadStore.addTimelineEvent(id, plan.timeline);
    }
    return NextResponse.json({ lead, timelineEvent });
  }
}
