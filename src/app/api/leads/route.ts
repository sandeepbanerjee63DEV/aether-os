import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyLead } from "@/lib/ai/engine";
import { leadStore } from "@/lib/leads/lead-store";

interface CreateLeadBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  phone?: string;
  website?: string;
  source?: string;
  leadType?: string;
  value?: string;
  location?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  try {
    const leads = await prisma.lead.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { company: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    const total = await prisma.lead.count();
    return NextResponse.json({ leads, total });
  } catch {
    const { leads, total } = await leadStore.list({ limit, status, search });
    return NextResponse.json({ leads, total });
  }
}

export async function POST(req: NextRequest) {
  let body: CreateLeadBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.firstName || !body.lastName || !body.email || !body.company) {
    return NextResponse.json(
      { error: "First name, last name, email, and company are required" },
      { status: 400 }
    );
  }

  const ai = await classifyLead(body);
  const status = ai.score >= 80 ? "HOT" : "AI_CLASSIFIED";

  try {
    const lead = await prisma.lead.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || null,
        company: body.company,
        website: body.website || null,
        source: body.source || "Website",
        leadType: body.leadType || null,
        value: body.value || "Medium",
        location: body.location || null,
        aiScore: ai.score,
        aiClassification: ai.classification,
        aiAnalysis: ai.analysis,
        nextBestAction: ai.nextBestAction,
        convertProbability: ai.convertProbability,
        tags: ai.tags,
        status: status as never,
        stage: "AI_CLASSIFICATION",
      },
    });
    await prisma.timelineEvent.createMany({
      data: [
        { leadId: lead.id, title: `Lead captured via ${lead.source}`, icon: "globe", color: "purple" },
        { leadId: lead.id, title: "AI classified and scored", icon: "brain", color: "blue" },
      ],
    });
    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    console.warn("Prisma unavailable for lead create, using file store:", (err as Error).message);
    try {
      const lead = await leadStore.create({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || null,
        company: body.company,
        website: body.website || null,
        source: body.source || "Website",
        leadType: body.leadType || null,
        value: body.value || "Medium",
        location: body.location || null,
        status,
        stage: "AI_CLASSIFICATION",
        aiScore: ai.score,
        aiClassification: ai.classification,
        aiAnalysis: ai.analysis,
        nextBestAction: ai.nextBestAction,
        convertProbability: ai.convertProbability,
        tags: ai.tags,
      });
      return NextResponse.json({ lead }, { status: 201 });
    } catch (fallbackErr) {
      console.error("Lead create fallback failed:", fallbackErr);
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
    }
  }
}
