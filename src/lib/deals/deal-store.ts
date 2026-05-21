import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { STAGE_ORDER, STAGE_LABEL, type DealStage } from "./stages";

/**
 * Memory-first deal store with best-effort disk persistence.
 *
 * Mirrors the lead-store pattern: works without a database, persists to
 * `<project>/.data/` locally and `os.tmpdir()` on serverless, and falls
 * back to in-memory if both disk paths are read-only.
 *
 * Swap with Prisma in production by setting DATABASE_URL.
 *
 * NOTE: This module imports Node's `fs` and `path`. Client components must
 * import stage constants from `./stages` instead.
 */

export { STAGE_ORDER, STAGE_LABEL };
export type { DealStage };

export interface StoredDeal {
  id: string;
  title: string;
  company: string | null;
  contactName: string | null;
  value: number;
  stage: DealStage;
  probability: number;
  aiProbability: number | null;
  aiAnalysis: string | null;
  nextBestAction: string | null;
  riskLevel: string | null;
  expectedClose: string | null;
  leadId: string | null;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoredDealActivity {
  id: string;
  dealId: string;
  type: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  createdAt: string;
}

const SEED_DEALS: Omit<StoredDeal, "createdAt" | "updatedAt">[] = [
  {
    id: "deal-1",
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
    expectedClose: new Date(Date.now() + 9 * 86400000).toISOString(),
    leadId: "lead-1",
    ownerId: null,
    ownerName: "Raj Mehta",
  },
  {
    id: "deal-2",
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
    expectedClose: new Date(Date.now() + 18 * 86400000).toISOString(),
    leadId: "lead-2",
    ownerId: null,
    ownerName: "Aisha Khan",
  },
  {
    id: "deal-3",
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
    expectedClose: new Date(Date.now() + 35 * 86400000).toISOString(),
    leadId: "lead-3",
    ownerId: null,
    ownerName: "Karan Singh",
  },
  {
    id: "deal-4",
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
    expectedClose: new Date(Date.now() + 7 * 86400000).toISOString(),
    leadId: "lead-4",
    ownerId: null,
    ownerName: "Raj Mehta",
  },
  {
    id: "deal-5",
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
    expectedClose: new Date(Date.now() + 21 * 86400000).toISOString(),
    leadId: "lead-5",
    ownerId: null,
    ownerName: "Aisha Khan",
  },
  {
    id: "deal-6",
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
    expectedClose: new Date(Date.now() - 5 * 86400000).toISOString(),
    leadId: null,
    ownerId: null,
    ownerName: "Karan Singh",
  },
];

const SEED_ACTIVITY: Omit<StoredDealActivity, "id">[] = [
  {
    dealId: "deal-1",
    type: "stage",
    title: "Moved to Negotiation",
    description: "Pricing aligned, MSA review starting",
    icon: "trending-up",
    color: "orange",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    dealId: "deal-1",
    type: "note",
    title: "AI revised win probability to 82%",
    description: null,
    icon: "brain",
    color: "blue",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    dealId: "deal-1",
    type: "meeting",
    title: "Demo with VP Engineering",
    description: "Positive feedback on real-time AI insights",
    icon: "calendar",
    color: "purple",
    createdAt: new Date(Date.now() - 0.5 * 86400000).toISOString(),
  },
  {
    dealId: "deal-4",
    type: "stage",
    title: "Moved to Negotiation",
    description: "Final commercial terms under review",
    icon: "trending-up",
    color: "orange",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    dealId: "deal-4",
    type: "email",
    title: "Sent MSA redline",
    description: "Legal turnaround expected in 48h",
    icon: "mail",
    color: "yellow",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

function pickDataDir(): string {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isServerless) return path.join(os.tmpdir(), "aether-os");
  return path.join(process.cwd(), ".data");
}

const DATA_DIR = pickDataDir();
const DEALS_FILE = path.join(DATA_DIR, "deals.json");
const ACTIVITY_FILE = path.join(DATA_DIR, "deal-activity.json");

const cache: {
  deals: StoredDeal[];
  activity: StoredDealActivity[];
  loaded: boolean;
} = { deals: [], activity: [], loaded: false };

async function safeReadJson<T>(file: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function safeWriteJson(file: string, data: unknown): Promise<void> {
  try {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    /* read-only filesystem (e.g. Vercel) — memory cache remains authoritative */
  }
}

async function ensureLoaded(): Promise<void> {
  if (cache.loaded) return;
  cache.loaded = true;

  const dealsFromDisk = await safeReadJson<StoredDeal[]>(DEALS_FILE);
  if (dealsFromDisk?.length) {
    cache.deals = dealsFromDisk;
  } else {
    const now = new Date().toISOString();
    cache.deals = SEED_DEALS.map((d) => ({ ...d, createdAt: now, updatedAt: now }));
    await safeWriteJson(DEALS_FILE, cache.deals);
  }

  const activityFromDisk = await safeReadJson<StoredDealActivity[]>(ACTIVITY_FILE);
  if (activityFromDisk?.length) {
    cache.activity = activityFromDisk;
  } else {
    cache.activity = SEED_ACTIVITY.map((a, i) => ({ ...a, id: `da_seed_${i}` }));
    await safeWriteJson(ACTIVITY_FILE, cache.activity);
  }
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const dealStore = {
  async list(
    params: { stage?: DealStage | null; search?: string | null; limit?: number } = {}
  ): Promise<{ deals: StoredDeal[]; total: number }> {
    await ensureLoaded();
    let deals = [...cache.deals];
    if (params.stage) deals = deals.filter((d) => d.stage === params.stage);
    if (params.search) {
      const q = params.search.toLowerCase();
      deals = deals.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.company ?? "").toLowerCase().includes(q) ||
          (d.contactName ?? "").toLowerCase().includes(q)
      );
    }
    deals.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const total = deals.length;
    if (params.limit) deals = deals.slice(0, params.limit);
    return { deals, total };
  },

  async findById(id: string): Promise<StoredDeal | null> {
    await ensureLoaded();
    return cache.deals.find((d) => d.id === id) || null;
  },

  async create(
    input: Omit<StoredDeal, "id" | "createdAt" | "updatedAt">
  ): Promise<StoredDeal> {
    await ensureLoaded();
    const now = new Date().toISOString();
    const deal: StoredDeal = {
      ...input,
      id: newId("deal"),
      createdAt: now,
      updatedAt: now,
    };
    cache.deals.unshift(deal);
    cache.activity.push({
      id: newId("da"),
      dealId: deal.id,
      type: "create",
      title: `Deal created · ${deal.title}`,
      description: deal.aiAnalysis,
      icon: "sparkles",
      color: "purple",
      createdAt: now,
    });
    await safeWriteJson(DEALS_FILE, cache.deals);
    await safeWriteJson(ACTIVITY_FILE, cache.activity);
    return deal;
  },

  async update(id: string, patch: Partial<StoredDeal>): Promise<StoredDeal | null> {
    await ensureLoaded();
    const idx = cache.deals.findIndex((d) => d.id === id);
    if (idx < 0) return null;
    const prev = cache.deals[idx];
    const next = { ...prev, ...patch, id, updatedAt: new Date().toISOString() };
    cache.deals[idx] = next;
    if (patch.stage && patch.stage !== prev.stage) {
      cache.activity.push({
        id: newId("da"),
        dealId: id,
        type: "stage",
        title: `Moved to ${STAGE_LABEL[next.stage]}`,
        description: `From ${STAGE_LABEL[prev.stage]}`,
        icon: "trending-up",
        color: "orange",
        createdAt: new Date().toISOString(),
      });
      await safeWriteJson(ACTIVITY_FILE, cache.activity);
    }
    await safeWriteJson(DEALS_FILE, cache.deals);
    return next;
  },

  async remove(id: string): Promise<boolean> {
    await ensureLoaded();
    const before = cache.deals.length;
    cache.deals = cache.deals.filter((d) => d.id !== id);
    if (cache.deals.length === before) return false;
    cache.activity = cache.activity.filter((a) => a.dealId !== id);
    await safeWriteJson(DEALS_FILE, cache.deals);
    await safeWriteJson(ACTIVITY_FILE, cache.activity);
    return true;
  },

  async getActivity(dealId: string): Promise<StoredDealActivity[]> {
    await ensureLoaded();
    return cache.activity
      .filter((a) => a.dealId === dealId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async analytics(): Promise<{
    totalPipeline: number;
    weightedPipeline: number;
    avgDealSize: number;
    winRate: number;
    openCount: number;
    wonCount: number;
    lostCount: number;
    byStage: { stage: DealStage; count: number; value: number }[];
  }> {
    await ensureLoaded();
    const deals = cache.deals;
    const open = deals.filter((d) => d.stage !== "CLOSED_WON" && d.stage !== "CLOSED_LOST");
    const won = deals.filter((d) => d.stage === "CLOSED_WON");
    const lost = deals.filter((d) => d.stage === "CLOSED_LOST");
    const totalPipeline = open.reduce((sum, d) => sum + d.value, 0);
    const weightedPipeline = open.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);
    const closed = won.length + lost.length;
    const winRate = closed > 0 ? (won.length / closed) * 100 : 0;
    const avgDealSize = deals.length > 0 ? deals.reduce((s, d) => s + d.value, 0) / deals.length : 0;
    const byStage = STAGE_ORDER.map((stage) => {
      const items = deals.filter((d) => d.stage === stage);
      return {
        stage,
        count: items.length,
        value: items.reduce((s, d) => s + d.value, 0),
      };
    });
    return {
      totalPipeline,
      weightedPipeline,
      avgDealSize,
      winRate,
      openCount: open.length,
      wonCount: won.length,
      lostCount: lost.length,
      byStage,
    };
  },
};
