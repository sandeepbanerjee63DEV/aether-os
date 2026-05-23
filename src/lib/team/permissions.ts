/**
 * AETHER OS — Enterprise RBAC engine.
 *
 * Permission keys are namespaced as `module:action`. Roles have a base role
 * (one of the canonical Prisma `Role` enum values) AND an optional custom
 * role definition that overrides the matrix on a per-key basis.
 *
 * The matrix below is the source of truth for which BASE role can perform
 * which action. Custom roles created via the Roles & Permissions UI store
 * their grants in `RoleDefinition.permissions` (string[]).
 */

export type PermissionAction = "view" | "edit" | "delete" | "export" | "assign" | "manage";

export const PERMISSION_MODULES = [
  { key: "leads", label: "Leads", icon: "users" },
  { key: "deals", label: "Deals", icon: "handshake" },
  { key: "tasks", label: "Tasks", icon: "check-square" },
  { key: "projects", label: "Projects", icon: "folder-kanban" },
  { key: "support", label: "Support", icon: "headphones" },
  { key: "reports", label: "Reports", icon: "bar-chart-3" },
  { key: "insights", label: "AI Insights", icon: "sparkles" },
  { key: "automations", label: "Automations", icon: "zap" },
  { key: "billing", label: "Billing", icon: "credit-card" },
  { key: "team", label: "Team & RBAC", icon: "users-round" },
  { key: "settings", label: "Workspace Settings", icon: "settings" },
] as const;

export type PermissionModuleKey = (typeof PERMISSION_MODULES)[number]["key"];

export const PERMISSION_ACTIONS: { key: PermissionAction; label: string; tone: string }[] = [
  { key: "view", label: "View", tone: "slate" },
  { key: "edit", label: "Edit", tone: "blue" },
  { key: "delete", label: "Delete", tone: "red" },
  { key: "export", label: "Export", tone: "emerald" },
  { key: "assign", label: "Assign", tone: "indigo" },
  { key: "manage", label: "Manage", tone: "purple" },
];

/** Canonical base role keys used as Prisma enum values. */
export type BaseRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "SALES" | "SUPPORT" | "VIEWER";

export const ROLE_RANK: Record<BaseRole, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  MANAGER: 60,
  SALES: 40,
  SUPPORT: 40,
  VIEWER: 20,
};

export const ROLE_META: Record<
  BaseRole,
  { label: string; description: string; color: string; icon: string }
> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    description: "Full operational sovereignty. Owns workspace governance.",
    color: "purple",
    icon: "crown",
  },
  ADMIN: {
    label: "Admin",
    description: "Workspace administration, RBAC, billing, and integrations.",
    color: "indigo",
    icon: "shield",
  },
  MANAGER: {
    label: "Operations Lead",
    description: "Department-level oversight, assignment routing, and reporting.",
    color: "blue",
    icon: "compass",
  },
  SALES: {
    label: "Sales / Staff",
    description: "Owns leads, deals, and customer-facing workflows.",
    color: "emerald",
    icon: "target",
  },
  SUPPORT: {
    label: "Support",
    description: "Tickets, knowledge base, and customer success workflows.",
    color: "amber",
    icon: "headphones",
  },
  VIEWER: {
    label: "Finance / Viewer",
    description: "Read-only access for finance, audit, and compliance.",
    color: "slate",
    icon: "eye",
  },
};

export type PermissionKey = `${PermissionModuleKey}:${PermissionAction}`;

/**
 * The default permission matrix. A role gets a permission if it's listed.
 * Higher-rank roles inherit lower-rank role permissions through `hasPermission`.
 */
const BASE_MATRIX: Record<BaseRole, Set<PermissionKey>> = {
  SUPER_ADMIN: new Set<PermissionKey>([
    // Super admin: everything
    ...PERMISSION_MODULES.flatMap((m) =>
      PERMISSION_ACTIONS.map((a) => `${m.key}:${a.key}` as PermissionKey)
    ),
  ]),
  ADMIN: new Set<PermissionKey>([
    "leads:view", "leads:edit", "leads:delete", "leads:export", "leads:assign", "leads:manage",
    "deals:view", "deals:edit", "deals:delete", "deals:export", "deals:assign", "deals:manage",
    "tasks:view", "tasks:edit", "tasks:delete", "tasks:export", "tasks:assign", "tasks:manage",
    "projects:view", "projects:edit", "projects:delete", "projects:export", "projects:assign", "projects:manage",
    "support:view", "support:edit", "support:assign", "support:manage",
    "reports:view", "reports:export",
    "insights:view",
    "automations:view", "automations:edit", "automations:manage",
    "billing:view", "billing:edit",
    "team:view", "team:edit", "team:assign", "team:manage",
    "settings:view", "settings:edit", "settings:manage",
  ]),
  MANAGER: new Set<PermissionKey>([
    "leads:view", "leads:edit", "leads:export", "leads:assign",
    "deals:view", "deals:edit", "deals:export", "deals:assign",
    "tasks:view", "tasks:edit", "tasks:assign",
    "projects:view", "projects:edit", "projects:assign",
    "support:view", "support:edit", "support:assign",
    "reports:view", "reports:export",
    "insights:view",
    "automations:view", "automations:edit",
    "team:view", "team:assign",
    "settings:view",
  ]),
  SALES: new Set<PermissionKey>([
    "leads:view", "leads:edit",
    "deals:view", "deals:edit",
    "tasks:view", "tasks:edit",
    "projects:view",
    "reports:view",
    "insights:view",
    "team:view",
  ]),
  SUPPORT: new Set<PermissionKey>([
    "leads:view",
    "tasks:view", "tasks:edit",
    "support:view", "support:edit",
    "reports:view",
    "insights:view",
    "team:view",
  ]),
  VIEWER: new Set<PermissionKey>([
    "leads:view",
    "deals:view",
    "tasks:view",
    "projects:view",
    "reports:view", "reports:export",
    "billing:view",
    "team:view",
  ]),
};

export interface PermissionContext {
  baseRole: BaseRole;
  /** Custom role's allowed permission keys, or null if none. */
  customGrants?: PermissionKey[] | null;
  /** Custom role's explicitly denied permission keys (overrides allow). */
  customDenies?: PermissionKey[] | null;
}

export function hasPermission(ctx: PermissionContext, key: PermissionKey): boolean {
  if (ctx.customDenies?.includes(key)) return false;
  if (ctx.customGrants?.includes(key)) return true;
  return BASE_MATRIX[ctx.baseRole]?.has(key) ?? false;
}

export function listPermissionsForRole(role: BaseRole): PermissionKey[] {
  return Array.from(BASE_MATRIX[role] ?? []);
}

export function allPermissionKeys(): PermissionKey[] {
  const out: PermissionKey[] = [];
  for (const m of PERMISSION_MODULES) {
    for (const a of PERMISSION_ACTIONS) {
      out.push(`${m.key}:${a.key}` as PermissionKey);
    }
  }
  return out;
}

/**
 * Returns a 2D grid view: rows = modules, cols = actions, cell = boolean.
 * Useful for the Permission Matrix UI.
 */
export function permissionGrid(role: BaseRole): Record<PermissionModuleKey, Record<PermissionAction, boolean>> {
  const grid = {} as Record<PermissionModuleKey, Record<PermissionAction, boolean>>;
  for (const m of PERMISSION_MODULES) {
    grid[m.key] = {} as Record<PermissionAction, boolean>;
    for (const a of PERMISSION_ACTIONS) {
      grid[m.key][a.key] = hasPermission({ baseRole: role }, `${m.key}:${a.key}` as PermissionKey);
    }
  }
  return grid;
}

export function roleRank(role: BaseRole): number {
  return ROLE_RANK[role] ?? 0;
}

/** Returns true if `actor` can manage (edit/suspend/role-change) `target`. */
export function canManageUser(actorRole: BaseRole, targetRole: BaseRole): boolean {
  if (actorRole === "SUPER_ADMIN") return true;
  return roleRank(actorRole) > roleRank(targetRole);
}
