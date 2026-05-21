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

const url = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;

if (!url) {
  console.log("[db-setup] DATABASE_URL not set — skipping schema sync. App will use in-memory fallback.");
  process.exit(0);
}

console.log("[db-setup] DATABASE_URL detected — syncing schema...");

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
  const count = await prisma.lead.count();

  if (count > 0) {
    console.log(`[db-setup] ${count} leads already present — skipping seed.`);
    await prisma.$disconnect();
    process.exit(0);
  }

  console.log("[db-setup] Empty database detected — seeding demo data...");

  const now = new Date();
  const minutes = (n) => new Date(now.getTime() - n * 60000);
  const hours = (n) => new Date(now.getTime() - n * 3600000);

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

  const createdLeads = [];
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
  await prisma.$disconnect();
} catch (err) {
  console.warn("[db-setup] Seeding failed (continuing build):", err?.message || err);
}
