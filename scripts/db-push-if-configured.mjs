#!/usr/bin/env node
/**
 * Build-time helper that conditionally:
 *   1. Runs `prisma db push` when DATABASE_URL is configured (Vercel Postgres etc.)
 *   2. Seeds 5 demo leads + timeline events when the leads table is empty
 *
 * Skips both steps when DATABASE_URL is missing so local builds without a DB
 * still succeed and the app uses the in-memory fallback store.
 */

import { spawnSync } from "node:child_process";

// Normalize Vercel / Neon integration env vars to the names Prisma expects.
if (!process.env.DATABASE_URL && process.env.POSTGRES_PRISMA_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
}
if (!process.env.DIRECT_DATABASE_URL) {
  process.env.DIRECT_DATABASE_URL =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL;
}

const url = process.env.DATABASE_URL;

if (!url) {
  console.log("[db-setup] DATABASE_URL not set — skipping schema sync. App will use in-memory fallback.");
  process.exit(0);
}

console.log("[db-setup] DATABASE_URL detected — syncing schema...");
console.log(`[db-setup] Using directUrl: ${process.env.DIRECT_DATABASE_URL ? "yes (separate)" : "no (falls back to DATABASE_URL)"}`);

const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
const push = spawnSync(npxCmd, ["prisma", "db", "push", "--accept-data-loss", "--skip-generate"], {
  stdio: "inherit",
  env: process.env,
});

if (push.status !== 0) {
  console.warn("[db-setup] prisma db push failed — continuing build with fallback store enabled.");
  process.exit(0);
}

console.log("[db-setup] Schema synced. Checking if seed is needed...");

try {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const leadCount = await prisma.lead.count();

  const now = new Date();
  const minutes = (n) => new Date(now.getTime() - n * 60000);
  const hours = (n) => new Date(now.getTime() - n * 3600000);

  let createdLeads = [];

  if (leadCount > 0) {
    console.log(`[db-setup] ${leadCount} leads already present — skipping lead seed.`);
    createdLeads = await prisma.lead.findMany();
  } else {
    console.log("[db-setup] Empty leads table — seeding demo leads...");

  const seedLeads = [
    {
      firstName: "Rohan",
      lastName: "Sharma",
      email: "rohan@techcorp.io",
      phone: "+91 98765 43210",
      company: "TechCorp Solutions",
      website: "techcorp.io",
      source: "Website",
      leadType: "Product Demo",
      value: "High",
      location: "Bangalore",
      status: "NURTURING",
      stage: "NURTURING",
      aiScore: 85,
      aiClassification: "High Intent",
      aiAnalysis: "High intent lead. Visited pricing page 3 times in last 48 hours. Downloaded product brochure.",
      nextBestAction: "Schedule a demo call",
      convertProbability: 85,
      tags: ["hot", "priority"],
      updatedAt: minutes(2),
    },
    {
      firstName: "Priya",
      lastName: "Nair",
      email: "priya@innovate.com",
      company: "Innovate Labs",
      source: "Referral",
      status: "FOLLOW_UP",
      stage: "FOLLOW_UP",
      aiScore: 72,
      aiClassification: "Qualified",
      nextBestAction: "Send personalized follow-up email",
      convertProbability: 62,
      tags: ["warm"],
      value: "Medium",
      updatedAt: minutes(15),
    },
    {
      firstName: "Amit",
      lastName: "Verma",
      email: "amit@cloudnine.io",
      company: "CloudNine Systems",
      source: "LinkedIn",
      status: "ASSIGNED",
      stage: "ASSIGNED",
      aiScore: 68,
      aiClassification: "Qualified",
      convertProbability: 55,
      tags: ["warm"],
      value: "Medium",
      updatedAt: minutes(45),
    },
    {
      firstName: "Sneha",
      lastName: "Kapoor",
      email: "sneha@dataflow.com",
      company: "DataFlow Analytics",
      source: "Campaign",
      status: "AI_CLASSIFIED",
      stage: "AI_CLASSIFICATION",
      aiScore: 91,
      aiClassification: "High Intent",
      nextBestAction: "Schedule a demo call",
      convertProbability: 78,
      tags: ["hot"],
      value: "High",
      updatedAt: hours(2),
    },
    {
      firstName: "Vikram",
      lastName: "Reddy",
      email: "vikram@nexgen.com",
      company: "NexGen AI",
      source: "Website",
      status: "NURTURING",
      stage: "NURTURING",
      aiScore: 58,
      aiClassification: "Nurture",
      nextBestAction: "Add to nurture campaign",
      convertProbability: 42,
      tags: ["nurture"],
      value: "Medium",
      updatedAt: hours(5),
    },
  ];

    for (const lead of seedLeads) {
      const created = await prisma.lead.create({ data: lead });
      createdLeads.push(created);
    }

    const rohan = createdLeads[0];
    await prisma.timelineEvent.createMany({
      data: [
        { leadId: rohan.id, title: "Lead captured via Website", icon: "globe", color: "purple", createdAt: new Date("2025-05-10T09:00:00Z") },
        { leadId: rohan.id, title: "AI classified as High Intent", icon: "brain", color: "blue", createdAt: new Date("2025-05-10T10:30:00Z") },
        { leadId: rohan.id, title: "Assigned to Raj Mehta", icon: "user", color: "green", createdAt: new Date("2025-05-11T09:00:00Z") },
        { leadId: rohan.id, title: "Follow-up email sent", icon: "mail", color: "yellow", createdAt: new Date("2025-05-12T11:00:00Z") },
        { leadId: rohan.id, title: "Call scheduled", icon: "phone", color: "orange", createdAt: new Date("2025-05-12T14:00:00Z") },
        { leadId: rohan.id, title: "Demo Pending", description: "Awaiting confirmation", icon: "calendar", color: "purple", createdAt: new Date("2025-05-13T09:00:00Z") },
      ],
    });

    console.log(`[db-setup] Seeded ${createdLeads.length} leads + timeline events.`);
  }

  // ---------- DEALS ----------
  const existingDealCount = await prisma.deal.count();
  if (existingDealCount === 0) {
    console.log("[db-setup] Seeding demo deals + activity...");

    // Ensure a system user exists so deals have a friendly owner name.
    const systemEmail = "system@aetheros.com";
    let systemUser = await prisma.user.findUnique({ where: { email: systemEmail } });
    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: systemEmail,
          name: "Raj Mehta",
          role: "SALES",
          title: "Account Executive",
        },
      });
    }

    const days = (n) => new Date(now.getTime() + n * 86400000);
    const ago = (n) => new Date(now.getTime() - n * 86400000);

    const leadByEmail = Object.fromEntries(createdLeads.map((l) => [l.email, l]));

    const seedDeals = [
      {
        title: "TechCorp — Enterprise CRM",
        company: "TechCorp Solutions",
        contactName: "Rohan Sharma",
        value: 48000,
        stage: "NEGOTIATION",
        probability: 75,
        aiProbability: 82,
        aiAnalysis:
          "Strong engagement signals. Pricing aligned with budget. Decision-maker actively participating in technical evaluation.",
        nextBestAction: "Send revised proposal with annual discount",
        riskLevel: "low",
        expectedClose: days(9),
        leadId: leadByEmail["rohan@techcorp.io"]?.id ?? null,
        ownerId: systemUser.id,
      },
      {
        title: "Innovate Labs — Workflow Automation",
        company: "Innovate Labs",
        contactName: "Priya Nair",
        value: 22500,
        stage: "PROPOSAL",
        probability: 55,
        aiProbability: 61,
        aiAnalysis:
          "Mid-funnel deal. Champion identified but pricing still under internal review.",
        nextBestAction: "Schedule executive alignment call",
        riskLevel: "medium",
        expectedClose: days(18),
        leadId: leadByEmail["priya@innovate.com"]?.id ?? null,
        ownerId: systemUser.id,
      },
      {
        title: "CloudNine — Pilot Engagement",
        company: "CloudNine Systems",
        contactName: "Amit Verma",
        value: 14000,
        stage: "QUALIFICATION",
        probability: 30,
        aiProbability: 38,
        aiAnalysis:
          "Early-stage qualification. Needs deeper discovery on integration requirements.",
        nextBestAction: "Run discovery workshop",
        riskLevel: "medium",
        expectedClose: days(35),
        leadId: leadByEmail["amit@cloudnine.io"]?.id ?? null,
        ownerId: systemUser.id,
      },
      {
        title: "DataFlow — Analytics Suite",
        company: "DataFlow Analytics",
        contactName: "Sneha Kapoor",
        value: 86000,
        stage: "NEGOTIATION",
        probability: 80,
        aiProbability: 88,
        aiAnalysis:
          "Hot deal. Strong product-market fit signals, multiple stakeholders engaged, MSA review in progress.",
        nextBestAction: "Finalize MSA and procurement timeline",
        riskLevel: "low",
        expectedClose: days(7),
        leadId: leadByEmail["sneha@dataflow.com"]?.id ?? null,
        ownerId: systemUser.id,
      },
      {
        title: "NexGen AI — Pilot to Production",
        company: "NexGen AI",
        contactName: "Vikram Reddy",
        value: 31500,
        stage: "PROPOSAL",
        probability: 45,
        aiProbability: 52,
        aiAnalysis:
          "Pilot expansion deal. Technical buyer engaged but exec sponsor lukewarm — risk of stall.",
        nextBestAction: "Get exec sponsor alignment",
        riskLevel: "medium",
        expectedClose: days(21),
        leadId: leadByEmail["vikram@nexgen.com"]?.id ?? null,
        ownerId: systemUser.id,
      },
      {
        title: "Helios Retail — Loyalty Platform",
        company: "Helios Retail",
        contactName: "Ananya Iyer",
        value: 64000,
        stage: "CLOSED_WON",
        probability: 100,
        aiProbability: 100,
        aiAnalysis:
          "Closed-won. 6-month rollout. Strong reference candidate for retail vertical.",
        nextBestAction: "Schedule kick-off and reference-call request",
        riskLevel: "low",
        expectedClose: ago(5),
        ownerId: systemUser.id,
      },
    ];

    const createdDeals = [];
    for (const deal of seedDeals) {
      // leadId is unique on Deal — skip linkage if it's already used.
      if (deal.leadId) {
        const existing = await prisma.deal.findUnique({ where: { leadId: deal.leadId } });
        if (existing) deal.leadId = null;
      }
      const created = await prisma.deal.create({ data: deal });
      createdDeals.push(created);
    }

    const techCorpDeal = createdDeals[0];
    const dataFlowDeal = createdDeals[3];
    await prisma.dealActivity.createMany({
      data: [
        {
          dealId: techCorpDeal.id,
          type: "stage",
          title: "Moved to Negotiation",
          description: "Pricing aligned, MSA review starting",
          icon: "trending-up",
          color: "orange",
          createdAt: ago(2),
        },
        {
          dealId: techCorpDeal.id,
          type: "note",
          title: "AI revised win probability to 82%",
          icon: "brain",
          color: "blue",
          createdAt: ago(1),
        },
        {
          dealId: techCorpDeal.id,
          type: "meeting",
          title: "Demo with VP Engineering",
          description: "Positive feedback on real-time AI insights",
          icon: "calendar",
          color: "purple",
          createdAt: new Date(now.getTime() - 0.5 * 86400000),
        },
        {
          dealId: dataFlowDeal.id,
          type: "stage",
          title: "Moved to Negotiation",
          description: "Final commercial terms under review",
          icon: "trending-up",
          color: "orange",
          createdAt: ago(3),
        },
        {
          dealId: dataFlowDeal.id,
          type: "email",
          title: "Sent MSA redline",
          description: "Legal turnaround expected in 48h",
          icon: "mail",
          color: "yellow",
          createdAt: ago(1),
        },
      ],
    });

    console.log(`[db-setup] Seeded ${createdDeals.length} deals + activity events.`);
  } else {
    console.log(`[db-setup] ${existingDealCount} deals already present — skipping deal seed.`);
  }

  // ---------- TEAM MODULE ----------
  try {
    const existingDeptCount = await prisma.department.count();
    if (existingDeptCount === 0) {
      console.log("[db-setup] Seeding team module: departments, roles, settings...");

      const departments = [
        { name: "Sales", slug: "sales", description: "Pipeline ownership, deal closure, account expansion.", color: "indigo", icon: "target", capacity: 12, healthScore: 88 },
        { name: "Operations", slug: "operations", description: "Workflow execution, process automation, operational uptime.", color: "purple", icon: "workflow", capacity: 10, healthScore: 81 },
        { name: "Support", slug: "support", description: "Customer success, ticket resolution, retention.", color: "amber", icon: "headphones", capacity: 8, healthScore: 76 },
        { name: "Marketing", slug: "marketing", description: "Demand generation, brand, content, lifecycle.", color: "blue", icon: "megaphone", capacity: 6, healthScore: 72 },
        { name: "Finance", slug: "finance", description: "Revenue ops, billing, compliance, audit.", color: "emerald", icon: "credit-card", capacity: 4, healthScore: 91 },
      ];

      for (const d of departments) {
        await prisma.department.create({ data: d });
      }
      console.log(`[db-setup] Seeded ${departments.length} departments.`);

      const roleDefs = [
        { key: "super_admin", name: "Super Admin", description: "Workspace owner. All privileges.", baseRole: "SUPER_ADMIN", color: "purple", icon: "crown", isSystem: true, rank: 100, permissions: [] },
        { key: "admin", name: "Admin", description: "Manages workspace, RBAC, integrations, and billing.", baseRole: "ADMIN", color: "indigo", icon: "shield", isSystem: true, rank: 80, permissions: [] },
        { key: "sales_manager", name: "Sales Manager", description: "Oversees pipeline, assignments, forecasts.", baseRole: "MANAGER", color: "blue", icon: "trending-up", isSystem: true, rank: 65, permissions: [] },
        { key: "ops_lead", name: "Operations Lead", description: "Workflow + assignment routing.", baseRole: "MANAGER", color: "purple", icon: "workflow", isSystem: true, rank: 65, permissions: [] },
        { key: "support_manager", name: "Support Manager", description: "Customer success.", baseRole: "MANAGER", color: "amber", icon: "headphones", isSystem: true, rank: 60, permissions: [] },
        { key: "finance_viewer", name: "Finance Viewer", description: "Read-only audit access.", baseRole: "VIEWER", color: "emerald", icon: "credit-card", isSystem: true, rank: 25, permissions: [] },
      ];
      for (const r of roleDefs) {
        await prisma.roleDefinition.create({ data: r });
      }
      console.log(`[db-setup] Seeded ${roleDefs.length} role definitions.`);

      const existingSettings = await prisma.teamSettings.findUnique({ where: { id: "singleton" } });
      if (!existingSettings) {
        await prisma.teamSettings.create({
          data: {
            id: "singleton",
            inviteRequiresApproval: true,
            defaultAccessLevel: "STAFF",
            allowSelfInvite: false,
            emailDomainWhitelist: ["aetheros.com"],
            autoAssignmentEnabled: true,
            autoAssignmentStrategy: "ai",
            workloadCeiling: 85,
            notifyOnInvite: true,
            notifyOnSuspiciousLogin: true,
            notifyOnWorkloadAlert: true,
            visibilityMode: "department",
            sessionTimeoutMinutes: 60,
            twoFactorRequired: false,
          },
        });
        console.log("[db-setup] Seeded workspace team settings.");
      }
    } else {
      console.log(`[db-setup] ${existingDeptCount} departments already present — skipping team seed.`);
    }
  } catch (teamErr) {
    console.warn("[db-setup] Team seed failed (continuing):", teamErr?.message || teamErr);
  }

  await prisma.$disconnect();
} catch (err) {
  console.warn("[db-setup] Seeding failed (continuing build):", err?.message || err);
}
