/**
 * AETHER OS — Unified Team memory-first store with disk persistence.
 *
 * Owns: members, departments, role definitions, assignments + history,
 * sessions, devices, access logs, audit logs, AI recommendations, and
 * workspace settings.
 *
 * Mirrors the deal-store pattern: writes to `<cwd>/.data/team-*.json`
 * locally, `os.tmpdir()/aether-os/` on serverless, and falls back to
 * pure in-memory when both are read-only.
 *
 * API routes try Prisma first and fall back to this store. The store is
 * authoritative when DATABASE_URL is not set.
 */

import { promises as fs } from "fs";
import os from "os";
import path from "path";
import type { PermissionKey } from "./permissions";

// ---------------- Types ----------------

export type MemberStatus = "ACTIVE" | "AWAY" | "SUSPENDED" | "PENDING_INVITE" | "INACTIVE";
export type AccessLevel = "ADMIN" | "MANAGER" | "STAFF" | "VIEWER";
export type BaseRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "SALES" | "SUPPORT" | "VIEWER";
export type AssignmentEntity =
  | "LEAD"
  | "DEAL"
  | "TASK"
  | "PROJECT"
  | "WORKFLOW"
  | "SUPPORT_TICKET";
export type AssignmentStatus =
  | "ACTIVE"
  | "REASSIGNED"
  | "COMPLETED"
  | "ESCALATED"
  | "CANCELLED";
export type SessionStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "SUSPICIOUS";
export type AccessEventType =
  | "LOGIN"
  | "LOGOUT"
  | "FAILED_LOGIN"
  | "PASSWORD_CHANGE"
  | "TWO_FACTOR_ENABLED"
  | "TWO_FACTOR_DISABLED"
  | "PERMISSION_GRANTED"
  | "PERMISSION_REVOKED"
  | "SESSION_REVOKED"
  | "SUSPICIOUS_ACTIVITY";
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "ASSIGN"
  | "ROLE_CHANGE"
  | "DEPARTMENT_CHANGE"
  | "INVITE"
  | "SUSPEND"
  | "RESTORE"
  | "BULK_OPERATION";
export type RecommendationType =
  | "WORKLOAD_IMBALANCE"
  | "INACTIVE_MEMBER"
  | "ASSIGNMENT_ROUTING"
  | "DEPARTMENT_OVERLOAD"
  | "PERMISSION_CLEANUP"
  | "SECURITY_RISK"
  | "PRODUCTIVITY_ANOMALY"
  | "STAFFING_GAP";
export type RecommendationSeverity = "INFO" | "ADVISORY" | "WARNING" | "CRITICAL";

export interface StoredMember {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: BaseRole;
  accessLevel: AccessLevel;
  title: string | null;
  phone: string | null;
  location: string | null;
  timezone: string;
  status: MemberStatus;
  departmentId: string | null;
  customRoleId: string | null;
  workloadPct: number;
  operationalScore: number;
  twoFactorEnabled: boolean;
  invitedById: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoredDepartment {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
  leadId: string | null;
  parentId: string | null;
  capacity: number;
  healthScore: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredRoleDefinition {
  id: string;
  key: string;
  name: string;
  description: string | null;
  baseRole: BaseRole;
  color: string;
  icon: string;
  isSystem: boolean;
  rank: number;
  permissions: PermissionKey[];
  denies: PermissionKey[];
  createdAt: string;
  updatedAt: string;
}

export interface StoredAssignment {
  id: string;
  entityType: AssignmentEntity;
  entityId: string;
  entityLabel: string;
  assigneeId: string;
  status: AssignmentStatus;
  priority: number;
  workloadWeight: number;
  aiSuggested: boolean;
  aiReason: string | null;
  reassignedById: string | null;
  reassignedFromId: string | null;
  notes: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoredSession {
  id: string;
  userId: string;
  status: SessionStatus;
  ipAddress: string | null;
  ipCountry: string | null;
  ipCity: string | null;
  userAgent: string | null;
  browser: string | null;
  os: string | null;
  deviceId: string | null;
  lastActiveAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  riskScore: number;
  createdAt: string;
}

export interface StoredDevice {
  id: string;
  userId: string;
  name: string;
  fingerprint: string;
  type: "desktop" | "mobile" | "tablet";
  os: string | null;
  browser: string | null;
  trusted: boolean;
  lastSeenAt: string;
  createdAt: string;
}

export interface StoredAccessLog {
  id: string;
  userId: string | null;
  eventType: AccessEventType;
  ipAddress: string | null;
  userAgent: string | null;
  location: string | null;
  success: boolean;
  riskScore: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface StoredAuditLog {
  id: string;
  action: AuditAction;
  actorId: string | null;
  targetId: string | null;
  entityType: string;
  entityId: string | null;
  summary: string;
  diff: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface StoredRecommendation {
  id: string;
  type: RecommendationType;
  severity: RecommendationSeverity;
  title: string;
  message: string;
  rationale: string | null;
  targetType: string | null;
  targetId: string | null;
  suggestedAction: string | null;
  confidence: number;
  isResolved: boolean;
  resolvedAt?: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface StoredTeamSettings {
  inviteRequiresApproval: boolean;
  defaultAccessLevel: AccessLevel;
  defaultDepartmentId: string | null;
  allowSelfInvite: boolean;
  emailDomainWhitelist: string[];
  autoAssignmentEnabled: boolean;
  autoAssignmentStrategy: "round_robin" | "workload" | "ai";
  workloadCeiling: number;
  notifyOnInvite: boolean;
  notifyOnSuspiciousLogin: boolean;
  notifyOnWorkloadAlert: boolean;
  visibilityMode: "global" | "department" | "private";
  sessionTimeoutMinutes: number;
  twoFactorRequired: boolean;
  updatedAt: string;
}

// ---------------- Seed data ----------------

const NOW = () => new Date().toISOString();
const HOURS = (n: number) => new Date(Date.now() - n * 3600000).toISOString();
const DAYS = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

const SEED_DEPARTMENTS: Omit<StoredDepartment, "createdAt" | "updatedAt">[] = [
  { id: "dept-sales", name: "Sales", slug: "sales", description: "Pipeline ownership, deal closure, account expansion.", color: "indigo", icon: "target", leadId: "mem-raj", parentId: null, capacity: 12, healthScore: 88, isActive: true },
  { id: "dept-ops", name: "Operations", slug: "operations", description: "Workflow execution, process automation, operational uptime.", color: "purple", icon: "workflow", leadId: "mem-priya", parentId: null, capacity: 10, healthScore: 81, isActive: true },
  { id: "dept-support", name: "Support", slug: "support", description: "Customer success, ticket resolution, retention.", color: "amber", icon: "headphones", leadId: "mem-aisha", parentId: null, capacity: 8, healthScore: 76, isActive: true },
  { id: "dept-marketing", name: "Marketing", slug: "marketing", description: "Demand generation, brand, content, lifecycle.", color: "blue", icon: "megaphone", leadId: null, parentId: null, capacity: 6, healthScore: 72, isActive: true },
  { id: "dept-finance", name: "Finance", slug: "finance", description: "Revenue ops, billing, compliance, audit.", color: "emerald", icon: "credit-card", leadId: "mem-ananya", parentId: null, capacity: 4, healthScore: 91, isActive: true },
];

const SEED_MEMBERS: Omit<StoredMember, "createdAt" | "updatedAt">[] = [
  {
    id: "mem-arjun",
    email: "arjun@aetheros.com",
    name: "Arjun Patel",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=arjun",
    role: "SUPER_ADMIN",
    accessLevel: "ADMIN",
    title: "Founder & CEO",
    phone: "+91 98100 12345",
    location: "Bangalore, IN",
    timezone: "Asia/Kolkata",
    status: "ACTIVE",
    departmentId: null,
    customRoleId: null,
    workloadPct: 62,
    operationalScore: 94,
    twoFactorEnabled: true,
    invitedById: null,
    lastActiveAt: HOURS(0.2),
  },
  {
    id: "mem-raj",
    email: "raj@aetheros.com",
    name: "Raj Mehta",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=raj",
    role: "MANAGER",
    accessLevel: "MANAGER",
    title: "Head of Sales",
    phone: "+91 98765 11111",
    location: "Bangalore, IN",
    timezone: "Asia/Kolkata",
    status: "ACTIVE",
    departmentId: "dept-sales",
    customRoleId: null,
    workloadPct: 81,
    operationalScore: 88,
    twoFactorEnabled: true,
    invitedById: "mem-arjun",
    lastActiveAt: HOURS(1),
  },
  {
    id: "mem-aisha",
    email: "aisha@aetheros.com",
    name: "Aisha Khan",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=aisha",
    role: "MANAGER",
    accessLevel: "MANAGER",
    title: "Head of Customer Success",
    phone: "+91 98765 22222",
    location: "Mumbai, IN",
    timezone: "Asia/Kolkata",
    status: "ACTIVE",
    departmentId: "dept-support",
    customRoleId: null,
    workloadPct: 73,
    operationalScore: 85,
    twoFactorEnabled: true,
    invitedById: "mem-arjun",
    lastActiveAt: HOURS(3),
  },
  {
    id: "mem-priya",
    email: "priya@aetheros.com",
    name: "Priya Nair",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya-team",
    role: "MANAGER",
    accessLevel: "MANAGER",
    title: "Operations Lead",
    phone: "+91 98765 33333",
    location: "Bangalore, IN",
    timezone: "Asia/Kolkata",
    status: "ACTIVE",
    departmentId: "dept-ops",
    customRoleId: null,
    workloadPct: 92,
    operationalScore: 79,
    twoFactorEnabled: false,
    invitedById: "mem-arjun",
    lastActiveAt: HOURS(2),
  },
  {
    id: "mem-karan",
    email: "karan@aetheros.com",
    name: "Karan Singh",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=karan",
    role: "SALES",
    accessLevel: "STAFF",
    title: "Senior Account Executive",
    phone: "+91 98765 44444",
    location: "Delhi, IN",
    timezone: "Asia/Kolkata",
    status: "ACTIVE",
    departmentId: "dept-sales",
    customRoleId: null,
    workloadPct: 78,
    operationalScore: 82,
    twoFactorEnabled: true,
    invitedById: "mem-raj",
    lastActiveAt: HOURS(4),
  },
  {
    id: "mem-sneha",
    email: "sneha@aetheros.com",
    name: "Sneha Kapoor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sneha-team",
    role: "SALES",
    accessLevel: "STAFF",
    title: "Account Executive",
    phone: "+91 98765 55555",
    location: "Pune, IN",
    timezone: "Asia/Kolkata",
    status: "ACTIVE",
    departmentId: "dept-sales",
    customRoleId: null,
    workloadPct: 45,
    operationalScore: 76,
    twoFactorEnabled: false,
    invitedById: "mem-raj",
    lastActiveAt: HOURS(6),
  },
  {
    id: "mem-vikram",
    email: "vikram@aetheros.com",
    name: "Vikram Reddy",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=vikram-team",
    role: "SALES",
    accessLevel: "STAFF",
    title: "BDR",
    phone: "+91 98765 66666",
    location: "Hyderabad, IN",
    timezone: "Asia/Kolkata",
    status: "AWAY",
    departmentId: "dept-sales",
    customRoleId: null,
    workloadPct: 28,
    operationalScore: 71,
    twoFactorEnabled: false,
    invitedById: "mem-raj",
    lastActiveAt: DAYS(2),
  },
  {
    id: "mem-meera",
    email: "meera@aetheros.com",
    name: "Meera Iyer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=meera",
    role: "SUPPORT",
    accessLevel: "STAFF",
    title: "Customer Success Manager",
    phone: "+91 98765 77777",
    location: "Chennai, IN",
    timezone: "Asia/Kolkata",
    status: "ACTIVE",
    departmentId: "dept-support",
    customRoleId: null,
    workloadPct: 67,
    operationalScore: 84,
    twoFactorEnabled: true,
    invitedById: "mem-aisha",
    lastActiveAt: HOURS(8),
  },
  {
    id: "mem-rahul",
    email: "rahul@aetheros.com",
    name: "Rahul Joshi",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rahul",
    role: "SUPPORT",
    accessLevel: "STAFF",
    title: "Support Engineer",
    phone: "+91 98765 88888",
    location: "Bangalore, IN",
    timezone: "Asia/Kolkata",
    status: "ACTIVE",
    departmentId: "dept-support",
    customRoleId: null,
    workloadPct: 54,
    operationalScore: 73,
    twoFactorEnabled: false,
    invitedById: "mem-aisha",
    lastActiveAt: HOURS(12),
  },
  {
    id: "mem-tanvi",
    email: "tanvi@aetheros.com",
    name: "Tanvi Desai",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=tanvi",
    role: "MANAGER",
    accessLevel: "MANAGER",
    title: "Ops Coordinator",
    phone: "+91 98765 99999",
    location: "Bangalore, IN",
    timezone: "Asia/Kolkata",
    status: "ACTIVE",
    departmentId: "dept-ops",
    customRoleId: null,
    workloadPct: 88,
    operationalScore: 77,
    twoFactorEnabled: true,
    invitedById: "mem-priya",
    lastActiveAt: HOURS(5),
  },
  {
    id: "mem-ananya",
    email: "ananya@aetheros.com",
    name: "Ananya Iyer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ananya-team",
    role: "VIEWER",
    accessLevel: "VIEWER",
    title: "Finance Lead",
    phone: "+91 98765 10101",
    location: "Mumbai, IN",
    timezone: "Asia/Kolkata",
    status: "ACTIVE",
    departmentId: "dept-finance",
    customRoleId: null,
    workloadPct: 41,
    operationalScore: 90,
    twoFactorEnabled: true,
    invitedById: "mem-arjun",
    lastActiveAt: HOURS(10),
  },
  {
    id: "mem-deepak",
    email: "deepak@aetheros.com",
    name: "Deepak Rao",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=deepak",
    role: "SALES",
    accessLevel: "STAFF",
    title: "Account Executive",
    phone: "+91 98765 20202",
    location: "Bangalore, IN",
    timezone: "Asia/Kolkata",
    status: "INACTIVE",
    departmentId: "dept-sales",
    customRoleId: null,
    workloadPct: 0,
    operationalScore: 48,
    twoFactorEnabled: false,
    invitedById: "mem-raj",
    lastActiveAt: DAYS(35),
  },
  {
    id: "mem-zoe",
    email: "zoe@partner.io",
    name: "Zoe Park",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=zoe",
    role: "VIEWER",
    accessLevel: "VIEWER",
    title: "External Auditor",
    phone: null,
    location: "Singapore",
    timezone: "Asia/Singapore",
    status: "PENDING_INVITE",
    departmentId: null,
    customRoleId: null,
    workloadPct: 0,
    operationalScore: 70,
    twoFactorEnabled: false,
    invitedById: "mem-arjun",
    lastActiveAt: null,
  },
  {
    id: "mem-ishaan",
    email: "ishaan@aetheros.com",
    name: "Ishaan Malhotra",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ishaan",
    role: "ADMIN",
    accessLevel: "ADMIN",
    title: "Engineering Admin",
    phone: "+91 98765 30303",
    location: "Bangalore, IN",
    timezone: "Asia/Kolkata",
    status: "ACTIVE",
    departmentId: "dept-ops",
    customRoleId: null,
    workloadPct: 59,
    operationalScore: 87,
    twoFactorEnabled: true,
    invitedById: "mem-arjun",
    lastActiveAt: HOURS(7),
  },
];

const SEED_ROLES: Omit<StoredRoleDefinition, "createdAt" | "updatedAt">[] = [
  { id: "role-super", key: "super_admin", name: "Super Admin", description: "Workspace owner. All privileges, governance, and billing.", baseRole: "SUPER_ADMIN", color: "purple", icon: "crown", isSystem: true, rank: 100, permissions: [], denies: [] },
  { id: "role-admin", key: "admin", name: "Admin", description: "Manages workspace, RBAC, integrations, and billing.", baseRole: "ADMIN", color: "indigo", icon: "shield", isSystem: true, rank: 80, permissions: [], denies: [] },
  { id: "role-sales-mgr", key: "sales_manager", name: "Sales Manager", description: "Oversees sales pipeline, assignments, and forecasts.", baseRole: "MANAGER", color: "blue", icon: "trending-up", isSystem: true, rank: 65, permissions: [], denies: [] },
  { id: "role-ops-lead", key: "ops_lead", name: "Operations Lead", description: "Owns operational workflows, automations, and routing.", baseRole: "MANAGER", color: "purple", icon: "workflow", isSystem: true, rank: 65, permissions: [], denies: [] },
  { id: "role-support-mgr", key: "support_manager", name: "Support Manager", description: "Oversees tickets, customer success, and knowledge base.", baseRole: "MANAGER", color: "amber", icon: "headphones", isSystem: true, rank: 60, permissions: [], denies: [] },
  { id: "role-finance-viewer", key: "finance_viewer", name: "Finance Viewer", description: "Read-only audit access for finance and compliance.", baseRole: "VIEWER", color: "emerald", icon: "credit-card", isSystem: true, rank: 25, permissions: [], denies: [] },
];

const SEED_ASSIGNMENTS: Omit<StoredAssignment, "createdAt" | "updatedAt">[] = [
  { id: "asg-1", entityType: "LEAD", entityId: "lead-1", entityLabel: "TechCorp Solutions — Rohan Sharma", assigneeId: "mem-raj", status: "ACTIVE", priority: 90, workloadWeight: 8, aiSuggested: true, aiReason: "High-intent enterprise lead — Raj's segment.", reassignedById: null, reassignedFromId: null, notes: "Pricing decision expected this week.", closedAt: null },
  { id: "asg-2", entityType: "LEAD", entityId: "lead-2", entityLabel: "Innovate Labs — Priya Nair", assigneeId: "mem-karan", status: "ACTIVE", priority: 70, workloadWeight: 6, aiSuggested: false, aiReason: null, reassignedById: null, reassignedFromId: null, notes: null, closedAt: null },
  { id: "asg-3", entityType: "DEAL", entityId: "deal-1", entityLabel: "TechCorp — Enterprise CRM ($48k)", assigneeId: "mem-raj", status: "ACTIVE", priority: 95, workloadWeight: 10, aiSuggested: true, aiReason: "Owner continuity with linked lead.", reassignedById: null, reassignedFromId: null, notes: null, closedAt: null },
  { id: "asg-4", entityType: "DEAL", entityId: "deal-4", entityLabel: "DataFlow — Analytics Suite ($86k)", assigneeId: "mem-raj", status: "ACTIVE", priority: 88, workloadWeight: 9, aiSuggested: false, aiReason: null, reassignedById: null, reassignedFromId: null, notes: "MSA in legal review.", closedAt: null },
  { id: "asg-5", entityType: "TASK", entityId: "task-1", entityLabel: "Q3 pipeline review prep", assigneeId: "mem-priya", status: "ACTIVE", priority: 60, workloadWeight: 4, aiSuggested: false, aiReason: null, reassignedById: null, reassignedFromId: null, notes: null, closedAt: null },
  { id: "asg-6", entityType: "PROJECT", entityId: "proj-1", entityLabel: "Helios Retail rollout", assigneeId: "mem-tanvi", status: "ACTIVE", priority: 75, workloadWeight: 8, aiSuggested: false, aiReason: null, reassignedById: null, reassignedFromId: null, notes: "6-month phased rollout.", closedAt: null },
  { id: "asg-7", entityType: "SUPPORT_TICKET", entityId: "tkt-1", entityLabel: "TechCorp — onboarding issue", assigneeId: "mem-meera", status: "ACTIVE", priority: 80, workloadWeight: 5, aiSuggested: true, aiReason: "Meera owns the TechCorp account.", reassignedById: null, reassignedFromId: null, notes: null, closedAt: null },
  { id: "asg-8", entityType: "WORKFLOW", entityId: "wf-1", entityLabel: "Lead nurture automation v3", assigneeId: "mem-ishaan", status: "ACTIVE", priority: 55, workloadWeight: 3, aiSuggested: false, aiReason: null, reassignedById: null, reassignedFromId: null, notes: null, closedAt: null },
  { id: "asg-9", entityType: "LEAD", entityId: "lead-4", entityLabel: "DataFlow Analytics — Sneha Kapoor", assigneeId: "mem-sneha", status: "ACTIVE", priority: 85, workloadWeight: 6, aiSuggested: true, aiReason: "Workload headroom + segment match.", reassignedById: null, reassignedFromId: null, notes: null, closedAt: null },
  { id: "asg-10", entityType: "TASK", entityId: "task-2", entityLabel: "Customer health-score model refresh", assigneeId: "mem-aisha", status: "COMPLETED", priority: 50, workloadWeight: 4, aiSuggested: false, aiReason: null, reassignedById: null, reassignedFromId: null, notes: "Shipped to production.", closedAt: DAYS(2) },
  { id: "asg-11", entityType: "DEAL", entityId: "deal-2", entityLabel: "Innovate Labs ($22k)", assigneeId: "mem-vikram", status: "ESCALATED", priority: 65, workloadWeight: 5, aiSuggested: false, aiReason: null, reassignedById: "mem-raj", reassignedFromId: "mem-karan", notes: "Escalated after 7 days without response.", closedAt: null },
];

const SEED_SESSIONS: Omit<StoredSession, "createdAt">[] = [
  { id: "ses-1", userId: "mem-arjun", status: "ACTIVE", ipAddress: "203.0.113.42", ipCountry: "IN", ipCity: "Bangalore", userAgent: "Chrome 134 on macOS", browser: "Chrome", os: "macOS 15", deviceId: "dev-arjun-mbp", lastActiveAt: HOURS(0.1), expiresAt: HOURS(-48), revokedAt: null, riskScore: 4 },
  { id: "ses-2", userId: "mem-raj", status: "ACTIVE", ipAddress: "203.0.113.55", ipCountry: "IN", ipCity: "Bangalore", userAgent: "Chrome 134 on Windows", browser: "Chrome", os: "Windows 11", deviceId: "dev-raj-laptop", lastActiveAt: HOURS(0.5), expiresAt: HOURS(-72), revokedAt: null, riskScore: 6 },
  { id: "ses-3", userId: "mem-priya", status: "ACTIVE", ipAddress: "203.0.113.68", ipCountry: "IN", ipCity: "Bangalore", userAgent: "Safari 18 on iOS", browser: "Safari", os: "iOS 18", deviceId: "dev-priya-iphone", lastActiveAt: HOURS(2), expiresAt: HOURS(-24), revokedAt: null, riskScore: 12 },
  { id: "ses-4", userId: "mem-aisha", status: "ACTIVE", ipAddress: "203.0.113.92", ipCountry: "IN", ipCity: "Mumbai", userAgent: "Firefox 131 on Linux", browser: "Firefox", os: "Ubuntu", deviceId: "dev-aisha-linux", lastActiveAt: HOURS(3), expiresAt: HOURS(-12), revokedAt: null, riskScore: 8 },
  { id: "ses-5", userId: "mem-vikram", status: "SUSPICIOUS", ipAddress: "185.220.101.45", ipCountry: "DE", ipCity: "Berlin", userAgent: "Chrome 121 on Windows", browser: "Chrome", os: "Windows 10", deviceId: null, lastActiveAt: HOURS(0.3), expiresAt: HOURS(-23), revokedAt: null, riskScore: 87 },
  { id: "ses-6", userId: "mem-karan", status: "ACTIVE", ipAddress: "203.0.113.110", ipCountry: "IN", ipCity: "Delhi", userAgent: "Edge 134 on Windows", browser: "Edge", os: "Windows 11", deviceId: "dev-karan-laptop", lastActiveAt: HOURS(4), expiresAt: HOURS(-8), revokedAt: null, riskScore: 9 },
  { id: "ses-7", userId: "mem-deepak", status: "EXPIRED", ipAddress: "203.0.113.150", ipCountry: "IN", ipCity: "Bangalore", userAgent: "Chrome 128 on Windows", browser: "Chrome", os: "Windows 10", deviceId: null, lastActiveAt: DAYS(35), expiresAt: DAYS(28), revokedAt: null, riskScore: 0 },
];

const SEED_DEVICES: Omit<StoredDevice, "createdAt">[] = [
  { id: "dev-arjun-mbp", userId: "mem-arjun", name: "Arjun's MacBook Pro", fingerprint: "fp_arjun_001", type: "desktop", os: "macOS 15", browser: "Chrome", trusted: true, lastSeenAt: HOURS(0.1) },
  { id: "dev-arjun-iphone", userId: "mem-arjun", name: "Arjun's iPhone 16", fingerprint: "fp_arjun_002", type: "mobile", os: "iOS 18", browser: "Safari", trusted: true, lastSeenAt: HOURS(1.5) },
  { id: "dev-raj-laptop", userId: "mem-raj", name: "Raj's Dell XPS", fingerprint: "fp_raj_001", type: "desktop", os: "Windows 11", browser: "Chrome", trusted: true, lastSeenAt: HOURS(0.5) },
  { id: "dev-aisha-linux", userId: "mem-aisha", name: "Aisha's ThinkPad", fingerprint: "fp_aisha_001", type: "desktop", os: "Ubuntu 24.04", browser: "Firefox", trusted: true, lastSeenAt: HOURS(3) },
  { id: "dev-priya-iphone", userId: "mem-priya", name: "Priya's iPhone 15", fingerprint: "fp_priya_001", type: "mobile", os: "iOS 18", browser: "Safari", trusted: true, lastSeenAt: HOURS(2) },
  { id: "dev-karan-laptop", userId: "mem-karan", name: "Karan's Surface", fingerprint: "fp_karan_001", type: "desktop", os: "Windows 11", browser: "Edge", trusted: true, lastSeenAt: HOURS(4) },
];

const SEED_ACCESS_LOGS: Omit<StoredAccessLog, "id" | "createdAt">[] = [
  { userId: "mem-arjun", eventType: "LOGIN", ipAddress: "203.0.113.42", userAgent: "Chrome 134 on macOS", location: "Bangalore, IN", success: true, riskScore: 4, metadata: {} },
  { userId: "mem-raj", eventType: "LOGIN", ipAddress: "203.0.113.55", userAgent: "Chrome 134 on Windows", location: "Bangalore, IN", success: true, riskScore: 6, metadata: {} },
  { userId: "mem-vikram", eventType: "FAILED_LOGIN", ipAddress: "185.220.101.45", userAgent: "Chrome 121 on Windows", location: "Berlin, DE", success: false, riskScore: 78, metadata: { attempts: 3 } },
  { userId: "mem-vikram", eventType: "FAILED_LOGIN", ipAddress: "185.220.101.45", userAgent: "Chrome 121 on Windows", location: "Berlin, DE", success: false, riskScore: 82, metadata: { attempts: 4 } },
  { userId: "mem-vikram", eventType: "SUSPICIOUS_ACTIVITY", ipAddress: "185.220.101.45", userAgent: "Chrome 121 on Windows", location: "Berlin, DE", success: false, riskScore: 87, metadata: { reason: "Geo-anomaly + new device" } },
  { userId: "mem-aisha", eventType: "LOGIN", ipAddress: "203.0.113.92", userAgent: "Firefox 131 on Linux", location: "Mumbai, IN", success: true, riskScore: 8, metadata: {} },
  { userId: "mem-priya", eventType: "TWO_FACTOR_DISABLED", ipAddress: "203.0.113.68", userAgent: "Safari 18 on iOS", location: "Bangalore, IN", success: true, riskScore: 35, metadata: { triggeredBy: "self" } },
  { userId: "mem-deepak", eventType: "LOGOUT", ipAddress: "203.0.113.150", userAgent: "Chrome 128 on Windows", location: "Bangalore, IN", success: true, riskScore: 0, metadata: {} },
];

const SEED_AUDIT_LOGS: Omit<StoredAuditLog, "id" | "createdAt">[] = [
  { action: "INVITE", actorId: "mem-arjun", targetId: "mem-zoe", entityType: "USER", entityId: "mem-zoe", summary: "Invited Zoe Park as External Auditor (Viewer)", diff: { role: ["—", "VIEWER"] }, metadata: { reason: "Q3 audit engagement" } },
  { action: "ROLE_CHANGE", actorId: "mem-arjun", targetId: "mem-ishaan", entityType: "USER", entityId: "mem-ishaan", summary: "Promoted Ishaan Malhotra to Admin", diff: { role: ["MANAGER", "ADMIN"] }, metadata: {} },
  { action: "ASSIGN", actorId: "mem-raj", targetId: "mem-vikram", entityType: "ASSIGNMENT", entityId: "asg-11", summary: "Escalated Innovate Labs deal to Vikram (reassigned from Karan)", diff: null, metadata: { from: "mem-karan", to: "mem-vikram" } },
  { action: "DEPARTMENT_CHANGE", actorId: "mem-arjun", targetId: "mem-tanvi", entityType: "USER", entityId: "mem-tanvi", summary: "Moved Tanvi Desai to Operations", diff: { department: ["dept-sales", "dept-ops"] }, metadata: {} },
  { action: "SUSPEND", actorId: "mem-arjun", targetId: "mem-deepak", entityType: "USER", entityId: "mem-deepak", summary: "Marked Deepak Rao as INACTIVE after 35 days of silence", diff: { status: ["ACTIVE", "INACTIVE"] }, metadata: {} },
  { action: "UPDATE", actorId: "mem-arjun", targetId: null, entityType: "SETTING", entityId: "team_settings", summary: "Enabled AI-powered auto-assignment", diff: { autoAssignmentEnabled: [false, true] }, metadata: {} },
];

const SEED_RECOMMENDATIONS: Omit<StoredRecommendation, "id" | "createdAt">[] = [
  // Initially empty — recommendations are regenerated on-demand by `regenerateRecommendations()`.
];

const DEFAULT_SETTINGS: StoredTeamSettings = {
  inviteRequiresApproval: true,
  defaultAccessLevel: "STAFF",
  defaultDepartmentId: null,
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
  updatedAt: NOW(),
};

// ---------------- Disk persistence ----------------

function pickDataDir(): string {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isServerless) return path.join(os.tmpdir(), "aether-os");
  return path.join(process.cwd(), ".data");
}

const DATA_DIR = pickDataDir();
const FILES = {
  members: path.join(DATA_DIR, "team-members.json"),
  departments: path.join(DATA_DIR, "team-departments.json"),
  roles: path.join(DATA_DIR, "team-roles.json"),
  assignments: path.join(DATA_DIR, "team-assignments.json"),
  sessions: path.join(DATA_DIR, "team-sessions.json"),
  devices: path.join(DATA_DIR, "team-devices.json"),
  accessLogs: path.join(DATA_DIR, "team-access-logs.json"),
  auditLogs: path.join(DATA_DIR, "team-audit-logs.json"),
  recommendations: path.join(DATA_DIR, "team-recommendations.json"),
  settings: path.join(DATA_DIR, "team-settings.json"),
};

interface Cache {
  loaded: boolean;
  members: StoredMember[];
  departments: StoredDepartment[];
  roles: StoredRoleDefinition[];
  assignments: StoredAssignment[];
  sessions: StoredSession[];
  devices: StoredDevice[];
  accessLogs: StoredAccessLog[];
  auditLogs: StoredAuditLog[];
  recommendations: StoredRecommendation[];
  settings: StoredTeamSettings;
}

const cache: Cache = {
  loaded: false,
  members: [],
  departments: [],
  roles: [],
  assignments: [],
  sessions: [],
  devices: [],
  accessLogs: [],
  auditLogs: [],
  recommendations: [],
  settings: { ...DEFAULT_SETTINGS },
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
    /* read-only filesystem — memory cache remains authoritative */
  }
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureLoaded(): Promise<void> {
  if (cache.loaded) return;
  cache.loaded = true;
  const now = NOW();

  const departments = await safeReadJson<StoredDepartment[]>(FILES.departments);
  cache.departments = departments?.length
    ? departments
    : SEED_DEPARTMENTS.map((d) => ({ ...d, createdAt: now, updatedAt: now }));
  if (!departments?.length) await safeWriteJson(FILES.departments, cache.departments);

  const members = await safeReadJson<StoredMember[]>(FILES.members);
  cache.members = members?.length
    ? members
    : SEED_MEMBERS.map((m) => ({ ...m, createdAt: now, updatedAt: now }));
  if (!members?.length) await safeWriteJson(FILES.members, cache.members);

  const roles = await safeReadJson<StoredRoleDefinition[]>(FILES.roles);
  cache.roles = roles?.length
    ? roles
    : SEED_ROLES.map((r) => ({ ...r, createdAt: now, updatedAt: now }));
  if (!roles?.length) await safeWriteJson(FILES.roles, cache.roles);

  const assignments = await safeReadJson<StoredAssignment[]>(FILES.assignments);
  cache.assignments = assignments?.length
    ? assignments
    : SEED_ASSIGNMENTS.map((a) => ({ ...a, createdAt: now, updatedAt: now }));
  if (!assignments?.length) await safeWriteJson(FILES.assignments, cache.assignments);

  const sessions = await safeReadJson<StoredSession[]>(FILES.sessions);
  cache.sessions = sessions?.length
    ? sessions
    : SEED_SESSIONS.map((s) => ({ ...s, createdAt: HOURS(24) }));
  if (!sessions?.length) await safeWriteJson(FILES.sessions, cache.sessions);

  const devices = await safeReadJson<StoredDevice[]>(FILES.devices);
  cache.devices = devices?.length
    ? devices
    : SEED_DEVICES.map((d) => ({ ...d, createdAt: DAYS(20) }));
  if (!devices?.length) await safeWriteJson(FILES.devices, cache.devices);

  const accessLogs = await safeReadJson<StoredAccessLog[]>(FILES.accessLogs);
  cache.accessLogs = accessLogs?.length
    ? accessLogs
    : SEED_ACCESS_LOGS.map((l, i) => ({
        ...l,
        id: `log_seed_${i}`,
        createdAt: HOURS(i * 2 + 0.5),
      }));
  if (!accessLogs?.length) await safeWriteJson(FILES.accessLogs, cache.accessLogs);

  const auditLogs = await safeReadJson<StoredAuditLog[]>(FILES.auditLogs);
  cache.auditLogs = auditLogs?.length
    ? auditLogs
    : SEED_AUDIT_LOGS.map((l, i) => ({
        ...l,
        id: `audit_seed_${i}`,
        createdAt: HOURS(i * 6 + 1),
      }));
  if (!auditLogs?.length) await safeWriteJson(FILES.auditLogs, cache.auditLogs);

  const recommendations = await safeReadJson<StoredRecommendation[]>(FILES.recommendations);
  cache.recommendations = recommendations?.length
    ? recommendations
    : SEED_RECOMMENDATIONS.map((r, i) => ({ ...r, id: `rec_seed_${i}`, createdAt: now }));

  const settings = await safeReadJson<StoredTeamSettings>(FILES.settings);
  cache.settings = settings ?? DEFAULT_SETTINGS;
  if (!settings) await safeWriteJson(FILES.settings, cache.settings);
}

// ---------------- Public API ----------------

export const teamStore = {
  // ----- Members -----
  async listMembers(params: {
    search?: string | null;
    status?: MemberStatus | "ALL" | null;
    role?: BaseRole | "ALL" | null;
    departmentId?: string | null;
    sort?: "recent" | "name" | "workload" | "score";
    limit?: number;
    cursor?: number;
  } = {}): Promise<{ members: StoredMember[]; total: number }> {
    await ensureLoaded();
    let m = [...cache.members];
    if (params.search) {
      const q = params.search.toLowerCase();
      m = m.filter(
        (x) =>
          x.name.toLowerCase().includes(q) ||
          x.email.toLowerCase().includes(q) ||
          (x.title ?? "").toLowerCase().includes(q)
      );
    }
    if (params.status && params.status !== "ALL") m = m.filter((x) => x.status === params.status);
    if (params.role && params.role !== "ALL") m = m.filter((x) => x.role === params.role);
    if (params.departmentId) m = m.filter((x) => x.departmentId === params.departmentId);
    const total = m.length;
    switch (params.sort) {
      case "name":
        m.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "workload":
        m.sort((a, b) => b.workloadPct - a.workloadPct);
        break;
      case "score":
        m.sort((a, b) => b.operationalScore - a.operationalScore);
        break;
      default:
        m.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    const cursor = params.cursor ?? 0;
    if (params.limit) m = m.slice(cursor, cursor + params.limit);
    return { members: m, total };
  },

  async findMember(id: string): Promise<StoredMember | null> {
    await ensureLoaded();
    return cache.members.find((m) => m.id === id) ?? null;
  },

  async findMemberByEmail(email: string): Promise<StoredMember | null> {
    await ensureLoaded();
    const e = email.toLowerCase().trim();
    return cache.members.find((m) => m.email.toLowerCase() === e) ?? null;
  },

  async createMember(input: Partial<StoredMember> & { email: string; name: string }): Promise<StoredMember> {
    await ensureLoaded();
    const now = NOW();
    const member: StoredMember = {
      id: newId("mem"),
      email: input.email.toLowerCase().trim(),
      name: input.name,
      avatar: input.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(input.email)}`,
      role: input.role ?? "SALES",
      accessLevel: input.accessLevel ?? "STAFF",
      title: input.title ?? null,
      phone: input.phone ?? null,
      location: input.location ?? null,
      timezone: input.timezone ?? "Asia/Kolkata",
      status: input.status ?? "PENDING_INVITE",
      departmentId: input.departmentId ?? null,
      customRoleId: input.customRoleId ?? null,
      workloadPct: input.workloadPct ?? 0,
      operationalScore: input.operationalScore ?? 70,
      twoFactorEnabled: input.twoFactorEnabled ?? false,
      invitedById: input.invitedById ?? null,
      lastActiveAt: input.lastActiveAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    cache.members.unshift(member);
    await safeWriteJson(FILES.members, cache.members);
    return member;
  },

  async updateMember(id: string, patch: Partial<StoredMember>): Promise<StoredMember | null> {
    await ensureLoaded();
    const idx = cache.members.findIndex((m) => m.id === id);
    if (idx < 0) return null;
    const next: StoredMember = {
      ...cache.members[idx],
      ...patch,
      id,
      updatedAt: NOW(),
    };
    cache.members[idx] = next;
    await safeWriteJson(FILES.members, cache.members);
    return next;
  },

  async removeMember(id: string): Promise<boolean> {
    await ensureLoaded();
    const before = cache.members.length;
    cache.members = cache.members.filter((m) => m.id !== id);
    if (cache.members.length === before) return false;
    cache.assignments = cache.assignments.filter((a) => a.assigneeId !== id);
    await safeWriteJson(FILES.members, cache.members);
    await safeWriteJson(FILES.assignments, cache.assignments);
    return true;
  },

  // ----- Departments -----
  async listDepartments(): Promise<StoredDepartment[]> {
    await ensureLoaded();
    return [...cache.departments].sort((a, b) => a.name.localeCompare(b.name));
  },

  async findDepartment(id: string): Promise<StoredDepartment | null> {
    await ensureLoaded();
    return cache.departments.find((d) => d.id === id) ?? null;
  },

  async createDepartment(input: Partial<StoredDepartment> & { name: string }): Promise<StoredDepartment> {
    await ensureLoaded();
    const now = NOW();
    const dept: StoredDepartment = {
      id: newId("dept"),
      name: input.name,
      slug: input.slug ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: input.description ?? null,
      color: input.color ?? "indigo",
      icon: input.icon ?? "briefcase",
      leadId: input.leadId ?? null,
      parentId: input.parentId ?? null,
      capacity: input.capacity ?? 10,
      healthScore: input.healthScore ?? 80,
      isActive: input.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    cache.departments.push(dept);
    await safeWriteJson(FILES.departments, cache.departments);
    return dept;
  },

  async updateDepartment(id: string, patch: Partial<StoredDepartment>): Promise<StoredDepartment | null> {
    await ensureLoaded();
    const idx = cache.departments.findIndex((d) => d.id === id);
    if (idx < 0) return null;
    cache.departments[idx] = { ...cache.departments[idx], ...patch, id, updatedAt: NOW() };
    await safeWriteJson(FILES.departments, cache.departments);
    return cache.departments[idx];
  },

  async removeDepartment(id: string): Promise<boolean> {
    await ensureLoaded();
    const before = cache.departments.length;
    cache.departments = cache.departments.filter((d) => d.id !== id);
    cache.members = cache.members.map((m) => (m.departmentId === id ? { ...m, departmentId: null } : m));
    if (cache.departments.length === before) return false;
    await safeWriteJson(FILES.departments, cache.departments);
    await safeWriteJson(FILES.members, cache.members);
    return true;
  },

  // ----- Roles -----
  async listRoles(): Promise<StoredRoleDefinition[]> {
    await ensureLoaded();
    return [...cache.roles].sort((a, b) => b.rank - a.rank);
  },

  async findRole(id: string): Promise<StoredRoleDefinition | null> {
    await ensureLoaded();
    return cache.roles.find((r) => r.id === id) ?? null;
  },

  async createRole(input: Partial<StoredRoleDefinition> & { name: string; key: string }): Promise<StoredRoleDefinition> {
    await ensureLoaded();
    const now = NOW();
    const role: StoredRoleDefinition = {
      id: newId("role"),
      key: input.key,
      name: input.name,
      description: input.description ?? null,
      baseRole: input.baseRole ?? "SALES",
      color: input.color ?? "indigo",
      icon: input.icon ?? "shield",
      isSystem: false,
      rank: input.rank ?? 50,
      permissions: input.permissions ?? [],
      denies: input.denies ?? [],
      createdAt: now,
      updatedAt: now,
    };
    cache.roles.push(role);
    await safeWriteJson(FILES.roles, cache.roles);
    return role;
  },

  async updateRole(id: string, patch: Partial<StoredRoleDefinition>): Promise<StoredRoleDefinition | null> {
    await ensureLoaded();
    const idx = cache.roles.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    if (cache.roles[idx].isSystem && patch.isSystem === false) {
      patch.isSystem = true;
    }
    cache.roles[idx] = { ...cache.roles[idx], ...patch, id, updatedAt: NOW() };
    await safeWriteJson(FILES.roles, cache.roles);
    return cache.roles[idx];
  },

  async removeRole(id: string): Promise<boolean> {
    await ensureLoaded();
    const target = cache.roles.find((r) => r.id === id);
    if (!target || target.isSystem) return false;
    cache.roles = cache.roles.filter((r) => r.id !== id);
    cache.members = cache.members.map((m) => (m.customRoleId === id ? { ...m, customRoleId: null } : m));
    await safeWriteJson(FILES.roles, cache.roles);
    await safeWriteJson(FILES.members, cache.members);
    return true;
  },

  // ----- Assignments -----
  async listAssignments(params: {
    status?: AssignmentStatus | "ALL" | null;
    entityType?: AssignmentEntity | "ALL" | null;
    assigneeId?: string | null;
    limit?: number;
  } = {}): Promise<{ assignments: StoredAssignment[]; total: number }> {
    await ensureLoaded();
    let a = [...cache.assignments];
    if (params.status && params.status !== "ALL") a = a.filter((x) => x.status === params.status);
    if (params.entityType && params.entityType !== "ALL") a = a.filter((x) => x.entityType === params.entityType);
    if (params.assigneeId) a = a.filter((x) => x.assigneeId === params.assigneeId);
    a.sort((a, b) => b.priority - a.priority || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const total = a.length;
    if (params.limit) a = a.slice(0, params.limit);
    return { assignments: a, total };
  },

  async createAssignment(input: Partial<StoredAssignment> & { entityType: AssignmentEntity; entityId: string; entityLabel: string; assigneeId: string }): Promise<StoredAssignment> {
    await ensureLoaded();
    const now = NOW();
    const a: StoredAssignment = {
      id: newId("asg"),
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel: input.entityLabel,
      assigneeId: input.assigneeId,
      status: input.status ?? "ACTIVE",
      priority: input.priority ?? 50,
      workloadWeight: input.workloadWeight ?? 5,
      aiSuggested: input.aiSuggested ?? false,
      aiReason: input.aiReason ?? null,
      reassignedById: input.reassignedById ?? null,
      reassignedFromId: input.reassignedFromId ?? null,
      notes: input.notes ?? null,
      closedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    cache.assignments.unshift(a);
    await safeWriteJson(FILES.assignments, cache.assignments);
    return a;
  },

  async updateAssignment(id: string, patch: Partial<StoredAssignment>): Promise<StoredAssignment | null> {
    await ensureLoaded();
    const idx = cache.assignments.findIndex((a) => a.id === id);
    if (idx < 0) return null;
    cache.assignments[idx] = { ...cache.assignments[idx], ...patch, id, updatedAt: NOW() };
    await safeWriteJson(FILES.assignments, cache.assignments);
    return cache.assignments[idx];
  },

  // ----- Sessions -----
  async listSessions(params: { userId?: string | null; status?: SessionStatus | "ALL" | null } = {}): Promise<StoredSession[]> {
    await ensureLoaded();
    let s = [...cache.sessions];
    if (params.userId) s = s.filter((x) => x.userId === params.userId);
    if (params.status && params.status !== "ALL") s = s.filter((x) => x.status === params.status);
    s.sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());
    return s;
  },

  async revokeSession(id: string): Promise<StoredSession | null> {
    await ensureLoaded();
    const idx = cache.sessions.findIndex((s) => s.id === id);
    if (idx < 0) return null;
    cache.sessions[idx] = { ...cache.sessions[idx], status: "REVOKED", revokedAt: NOW() };
    await safeWriteJson(FILES.sessions, cache.sessions);
    return cache.sessions[idx];
  },

  // ----- Devices -----
  async listDevices(userId?: string | null): Promise<StoredDevice[]> {
    await ensureLoaded();
    const d = userId ? cache.devices.filter((x) => x.userId === userId) : [...cache.devices];
    return d.sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
  },

  async setDeviceTrust(id: string, trusted: boolean): Promise<StoredDevice | null> {
    await ensureLoaded();
    const idx = cache.devices.findIndex((d) => d.id === id);
    if (idx < 0) return null;
    cache.devices[idx] = { ...cache.devices[idx], trusted };
    await safeWriteJson(FILES.devices, cache.devices);
    return cache.devices[idx];
  },

  // ----- Access logs -----
  async listAccessLogs(params: { userId?: string | null; limit?: number } = {}): Promise<StoredAccessLog[]> {
    await ensureLoaded();
    let l = [...cache.accessLogs];
    if (params.userId) l = l.filter((x) => x.userId === params.userId);
    l.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (params.limit) l = l.slice(0, params.limit);
    return l;
  },

  async appendAccessLog(input: Omit<StoredAccessLog, "id" | "createdAt">): Promise<StoredAccessLog> {
    await ensureLoaded();
    const log: StoredAccessLog = { ...input, id: newId("log"), createdAt: NOW() };
    cache.accessLogs.unshift(log);
    if (cache.accessLogs.length > 1000) cache.accessLogs = cache.accessLogs.slice(0, 1000);
    await safeWriteJson(FILES.accessLogs, cache.accessLogs);
    return log;
  },

  // ----- Audit logs -----
  async listAuditLogs(params: { limit?: number; entityType?: string | null } = {}): Promise<StoredAuditLog[]> {
    await ensureLoaded();
    let l = [...cache.auditLogs];
    if (params.entityType) l = l.filter((x) => x.entityType === params.entityType);
    l.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (params.limit) l = l.slice(0, params.limit);
    return l;
  },

  async appendAuditLog(input: Omit<StoredAuditLog, "id" | "createdAt">): Promise<StoredAuditLog> {
    await ensureLoaded();
    const log: StoredAuditLog = { ...input, id: newId("audit"), createdAt: NOW() };
    cache.auditLogs.unshift(log);
    if (cache.auditLogs.length > 1000) cache.auditLogs = cache.auditLogs.slice(0, 1000);
    await safeWriteJson(FILES.auditLogs, cache.auditLogs);
    return log;
  },

  // ----- Recommendations -----
  async listRecommendations(params: { includeResolved?: boolean } = {}): Promise<StoredRecommendation[]> {
    await ensureLoaded();
    let r = [...cache.recommendations];
    if (!params.includeResolved) r = r.filter((x) => !x.isResolved);
    const severityRank: Record<RecommendationSeverity, number> = { CRITICAL: 4, WARNING: 3, ADVISORY: 2, INFO: 1 };
    r.sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || b.confidence - a.confidence);
    return r;
  },

  async setRecommendations(next: StoredRecommendation[]): Promise<void> {
    await ensureLoaded();
    cache.recommendations = next;
    await safeWriteJson(FILES.recommendations, cache.recommendations);
  },

  async resolveRecommendation(id: string): Promise<StoredRecommendation | null> {
    await ensureLoaded();
    const idx = cache.recommendations.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    cache.recommendations[idx] = {
      ...cache.recommendations[idx],
      isResolved: true,
      resolvedAt: NOW(),
    };
    await safeWriteJson(FILES.recommendations, cache.recommendations);
    return cache.recommendations[idx];
  },

  // ----- Settings -----
  async getSettings(): Promise<StoredTeamSettings> {
    await ensureLoaded();
    return { ...cache.settings };
  },

  async updateSettings(patch: Partial<StoredTeamSettings>): Promise<StoredTeamSettings> {
    await ensureLoaded();
    cache.settings = { ...cache.settings, ...patch, updatedAt: NOW() };
    await safeWriteJson(FILES.settings, cache.settings);
    return cache.settings;
  },

  // ----- Snapshot for AI -----
  async snapshot() {
    await ensureLoaded();
    return {
      members: [...cache.members],
      departments: [...cache.departments],
      assignments: [...cache.assignments],
      sessions: [...cache.sessions],
      accessLogs: [...cache.accessLogs],
      recommendations: [...cache.recommendations],
      settings: { ...cache.settings },
    };
  },
};
