import { promises as fs } from "fs";
import os from "os";
import path from "path";

/**
 * Memory-first lead store with best-effort disk persistence.
 *
 * - Local dev: persists to `<project>/.data/` so leads survive `npm run dev` restarts
 * - Vercel / read-only FS: silently falls back to `os.tmpdir()`, and if even that
 *   fails, lives entirely in module memory (persists across requests within the
 *   same warm Lambda instance, ephemeral across cold starts).
 *
 * Swap with Prisma in production by setting DATABASE_URL.
 */

export type LeadAssignmentType = "MANUAL" | "AI" | "ROUND_ROBIN" | "WORKLOAD" | "RULE" | "REASSIGNED";
export type LeadOperationalStatus = "NEW" | "CONTACTED" | "ENGAGED" | "STALE" | "AT_RISK" | "CLOSED";

export interface StoredLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string;
  website: string | null;
  source: string;
  leadType: string | null;
  value: string;
  location: string | null;
  status: string;
  stage: string;
  aiScore: number;
  aiClassification: string | null;
  aiAnalysis: string | null;
  nextBestAction: string | null;
  convertProbability: number;
  tags: string[];
  // ---------- Assignment Engine (LEAD ↔ TEAM) ----------
  ownerId: string | null;
  assignedById: string | null;
  assignmentType: LeadAssignmentType;
  assignmentReason: string | null;
  assignedAt: string | null;
  departmentId: string | null;
  followUpOwnerId: string | null;
  operationalStatus: LeadOperationalStatus;
  lastContactedAt: string | null;
  // -----------------------------------------------------
  createdAt: string;
  updatedAt: string;
}

export interface StoredTimelineEvent {
  id: string;
  leadId: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  createdAt: string;
}

const SEED_LEADS: Omit<StoredLead, "createdAt">[] = [
  {
    id: "lead-1",
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
    ownerId: "mem-raj",
    assignedById: "mem-arjun",
    assignmentType: "AI",
    assignmentReason: "High-intent enterprise lead — Raj's segment; senior Sales coverage.",
    assignedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    departmentId: "dept-sales",
    followUpOwnerId: "mem-raj",
    operationalStatus: "ENGAGED",
    lastContactedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: "lead-2",
    firstName: "Priya",
    lastName: "Nair",
    email: "priya@innovate.com",
    phone: null,
    company: "Innovate Labs",
    website: null,
    source: "Referral",
    leadType: null,
    value: "Medium",
    location: null,
    status: "FOLLOW_UP",
    stage: "FOLLOW_UP",
    aiScore: 72,
    aiClassification: "Qualified",
    aiAnalysis: null,
    nextBestAction: "Send personalized follow-up email",
    convertProbability: 62,
    tags: ["warm"],
    ownerId: "mem-karan",
    assignedById: "mem-raj",
    assignmentType: "MANUAL",
    assignmentReason: "Routed manually by Raj — warm referral, Karan owns referral funnel.",
    assignedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    departmentId: "dept-sales",
    followUpOwnerId: "mem-karan",
    operationalStatus: "CONTACTED",
    lastContactedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "lead-3",
    firstName: "Amit",
    lastName: "Verma",
    email: "amit@cloudnine.io",
    phone: null,
    company: "CloudNine Systems",
    website: null,
    source: "LinkedIn",
    leadType: null,
    value: "Medium",
    location: null,
    status: "ASSIGNED",
    stage: "ASSIGNED",
    aiScore: 68,
    aiClassification: "Qualified",
    aiAnalysis: null,
    nextBestAction: null,
    convertProbability: 55,
    tags: ["warm"],
    ownerId: null,
    assignedById: null,
    assignmentType: "MANUAL",
    assignmentReason: null,
    assignedAt: null,
    departmentId: "dept-sales",
    followUpOwnerId: null,
    operationalStatus: "NEW",
    lastContactedAt: null,
    updatedAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: "lead-4",
    firstName: "Sneha",
    lastName: "Kapoor",
    email: "sneha@dataflow.com",
    phone: null,
    company: "DataFlow Analytics",
    website: null,
    source: "Campaign",
    leadType: null,
    value: "High",
    location: null,
    status: "AI_CLASSIFIED",
    stage: "AI_CLASSIFICATION",
    aiScore: 91,
    aiClassification: "High Intent",
    aiAnalysis: null,
    nextBestAction: "Schedule a demo call",
    convertProbability: 78,
    tags: ["hot"],
    ownerId: "mem-sneha",
    assignedById: null,
    assignmentType: "AI",
    assignmentReason: "Workload headroom + segment match — operations expansion deal.",
    assignedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    departmentId: "dept-ops",
    followUpOwnerId: "mem-sneha",
    operationalStatus: "NEW",
    lastContactedAt: null,
    updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "lead-5",
    firstName: "Vikram",
    lastName: "Reddy",
    email: "vikram@nexgen.com",
    phone: null,
    company: "NexGen AI",
    website: null,
    source: "Website",
    leadType: null,
    value: "Medium",
    location: null,
    status: "NURTURING",
    stage: "NURTURING",
    aiScore: 58,
    aiClassification: "Nurture",
    aiAnalysis: null,
    nextBestAction: "Add to nurture campaign",
    convertProbability: 42,
    tags: ["nurture"],
    ownerId: "mem-tanvi",
    assignedById: null,
    assignmentType: "ROUND_ROBIN",
    assignmentReason: "Round-robin rotation — Tanvi up next in the Sales queue.",
    assignedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    departmentId: "dept-sales",
    followUpOwnerId: "mem-tanvi",
    operationalStatus: "STALE",
    lastContactedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
];

const SEED_TIMELINE: Omit<StoredTimelineEvent, "id">[] = [
  { leadId: "lead-1", title: "Lead captured via Website", description: null, icon: "globe", color: "purple", createdAt: "2025-05-10T09:00:00Z" },
  { leadId: "lead-1", title: "AI classified as High Intent", description: null, icon: "brain", color: "blue", createdAt: "2025-05-10T10:30:00Z" },
  { leadId: "lead-1", title: "Assigned to Raj Mehta", description: null, icon: "user", color: "green", createdAt: "2025-05-11T09:00:00Z" },
  { leadId: "lead-1", title: "Follow-up email sent", description: null, icon: "mail", color: "yellow", createdAt: "2025-05-12T11:00:00Z" },
  { leadId: "lead-1", title: "Call scheduled", description: null, icon: "phone", color: "orange", createdAt: "2025-05-12T14:00:00Z" },
  { leadId: "lead-1", title: "Demo Pending", description: "Awaiting confirmation", icon: "calendar", color: "purple", createdAt: "2025-05-13T09:00:00Z" },
];

function pickDataDir(): string {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isServerless) return path.join(os.tmpdir(), "aether-os");
  return path.join(process.cwd(), ".data");
}

const DATA_DIR = pickDataDir();
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const TIMELINE_FILE = path.join(DATA_DIR, "timeline.json");

const cache: { leads: StoredLead[]; timeline: StoredTimelineEvent[]; loaded: boolean } = {
  leads: [],
  timeline: [],
  loaded: false,
};

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
    /* read-only filesystem (e.g. Vercel) — in-memory cache is still authoritative */
  }
}

let loadingPromise: Promise<void> | null = null;

async function ensureLoaded(): Promise<void> {
  if (cache.loaded) return;
  if (loadingPromise) {
    await loadingPromise;
    return;
  }
  loadingPromise = doLoad().finally(() => {
    loadingPromise = null;
  });
  await loadingPromise;
}

async function doLoad(): Promise<void> {
  if (cache.loaded) return;

  const leadsFromDisk = await safeReadJson<Partial<StoredLead>[]>(LEADS_FILE);
  if (leadsFromDisk?.length) {
    // Backfill assignment fields on legacy disk records so older .data/leads.json
    // dumps work seamlessly after the LEAD ↔ TEAM integration.
    cache.leads = leadsFromDisk.map((l) => ({
      id: l.id ?? newId("lead"),
      firstName: l.firstName ?? "",
      lastName: l.lastName ?? "",
      email: l.email ?? "",
      phone: l.phone ?? null,
      company: l.company ?? "",
      website: l.website ?? null,
      source: l.source ?? "Website",
      leadType: l.leadType ?? null,
      value: l.value ?? "Medium",
      location: l.location ?? null,
      status: l.status ?? "NEW",
      stage: l.stage ?? "LEAD_ENTERED",
      aiScore: l.aiScore ?? 0,
      aiClassification: l.aiClassification ?? null,
      aiAnalysis: l.aiAnalysis ?? null,
      nextBestAction: l.nextBestAction ?? null,
      convertProbability: l.convertProbability ?? 0,
      tags: l.tags ?? [],
      ownerId: l.ownerId ?? null,
      assignedById: l.assignedById ?? null,
      assignmentType: l.assignmentType ?? "MANUAL",
      assignmentReason: l.assignmentReason ?? null,
      assignedAt: l.assignedAt ?? null,
      departmentId: l.departmentId ?? null,
      followUpOwnerId: l.followUpOwnerId ?? null,
      operationalStatus: l.operationalStatus ?? "NEW",
      lastContactedAt: l.lastContactedAt ?? null,
      createdAt: l.createdAt ?? new Date().toISOString(),
      updatedAt: l.updatedAt ?? new Date().toISOString(),
    }));
  } else {
    const now = new Date().toISOString();
    cache.leads = SEED_LEADS.map((l) => ({ ...l, createdAt: now }));
    await safeWriteJson(LEADS_FILE, cache.leads);
  }

  const timelineFromDisk = await safeReadJson<StoredTimelineEvent[]>(TIMELINE_FILE);
  if (timelineFromDisk?.length) {
    cache.timeline = timelineFromDisk;
  } else {
    cache.timeline = SEED_TIMELINE.map((t, i) => ({ ...t, id: `tl_seed_${i}` }));
    await safeWriteJson(TIMELINE_FILE, cache.timeline);
  }

  cache.loaded = true;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const leadStore = {
  async list(params: { limit?: number; status?: string | null; search?: string | null } = {}): Promise<{ leads: StoredLead[]; total: number }> {
    await ensureLoaded();
    let leads = [...cache.leads];
    if (params.status) leads = leads.filter((l) => l.status === params.status);
    if (params.search) {
      const q = params.search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.firstName.toLowerCase().includes(q) ||
          l.lastName.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q)
      );
    }
    leads.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const total = leads.length;
    if (params.limit) leads = leads.slice(0, params.limit);
    return { leads, total };
  },

  async findById(id: string): Promise<StoredLead | null> {
    await ensureLoaded();
    return cache.leads.find((l) => l.id === id) || null;
  },

  async create(
    input: Omit<
      StoredLead,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "ownerId"
      | "assignedById"
      | "assignmentType"
      | "assignmentReason"
      | "assignedAt"
      | "departmentId"
      | "followUpOwnerId"
      | "operationalStatus"
      | "lastContactedAt"
    > &
      Partial<
        Pick<
          StoredLead,
          | "ownerId"
          | "assignedById"
          | "assignmentType"
          | "assignmentReason"
          | "assignedAt"
          | "departmentId"
          | "followUpOwnerId"
          | "operationalStatus"
          | "lastContactedAt"
        >
      >,
  ): Promise<StoredLead> {
    await ensureLoaded();
    const now = new Date().toISOString();
    const lead: StoredLead = {
      ...input,
      ownerId: input.ownerId ?? null,
      assignedById: input.assignedById ?? null,
      assignmentType: input.assignmentType ?? "MANUAL",
      assignmentReason: input.assignmentReason ?? null,
      assignedAt: input.assignedAt ?? null,
      departmentId: input.departmentId ?? null,
      followUpOwnerId: input.followUpOwnerId ?? null,
      operationalStatus: input.operationalStatus ?? "NEW",
      lastContactedAt: input.lastContactedAt ?? null,
      id: newId("lead"),
      createdAt: now,
      updatedAt: now,
    };
    cache.leads.unshift(lead);
    cache.timeline.push(
      {
        id: newId("tl"),
        leadId: lead.id,
        title: `Lead captured via ${lead.source}`,
        description: null,
        icon: "globe",
        color: "purple",
        createdAt: now,
      },
      {
        id: newId("tl"),
        leadId: lead.id,
        title: "AI classified and scored",
        description: lead.aiClassification ? `Classified as ${lead.aiClassification}` : null,
        icon: "brain",
        color: "blue",
        createdAt: now,
      }
    );
    await safeWriteJson(LEADS_FILE, cache.leads);
    await safeWriteJson(TIMELINE_FILE, cache.timeline);
    return lead;
  },

  async update(id: string, patch: Partial<StoredLead>): Promise<StoredLead | null> {
    await ensureLoaded();
    const idx = cache.leads.findIndex((l) => l.id === id);
    if (idx < 0) return null;
    cache.leads[idx] = { ...cache.leads[idx], ...patch, id, updatedAt: new Date().toISOString() };
    await safeWriteJson(LEADS_FILE, cache.leads);
    return cache.leads[idx];
  },

  async remove(id: string): Promise<boolean> {
    await ensureLoaded();
    const before = cache.leads.length;
    cache.leads = cache.leads.filter((l) => l.id !== id);
    if (cache.leads.length === before) return false;
    cache.timeline = cache.timeline.filter((t) => t.leadId !== id);
    await safeWriteJson(LEADS_FILE, cache.leads);
    await safeWriteJson(TIMELINE_FILE, cache.timeline);
    return true;
  },

  async getTimeline(leadId: string): Promise<StoredTimelineEvent[]> {
    await ensureLoaded();
    const items = cache.timeline.filter((t) => t.leadId === leadId);
    if (items.length > 0) {
      return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return [...cache.timeline].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async addTimelineEvent(
    leadId: string,
    event: { title: string; description?: string | null; icon?: string; color?: string }
  ): Promise<StoredTimelineEvent> {
    await ensureLoaded();
    const created: StoredTimelineEvent = {
      id: newId("tl"),
      leadId,
      title: event.title,
      description: event.description ?? null,
      icon: event.icon || "circle",
      color: event.color || "purple",
      createdAt: new Date().toISOString(),
    };
    cache.timeline.push(created);
    await safeWriteJson(TIMELINE_FILE, cache.timeline);
    return created;
  },
};
