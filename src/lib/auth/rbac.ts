import type { Role } from "@prisma/client";

const PERMISSIONS: Record<string, Role[]> = {
  "leads:read": ["SUPER_ADMIN", "ADMIN", "MANAGER", "SALES", "SUPPORT", "VIEWER"],
  "leads:write": ["SUPER_ADMIN", "ADMIN", "MANAGER", "SALES"],
  "leads:delete": ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  "deals:read": ["SUPER_ADMIN", "ADMIN", "MANAGER", "SALES", "VIEWER"],
  "deals:write": ["SUPER_ADMIN", "ADMIN", "MANAGER", "SALES"],
  "tasks:read": ["SUPER_ADMIN", "ADMIN", "MANAGER", "SALES", "SUPPORT", "VIEWER"],
  "tasks:write": ["SUPER_ADMIN", "ADMIN", "MANAGER", "SALES", "SUPPORT"],
  "team:manage": ["SUPER_ADMIN", "ADMIN"],
  "settings:manage": ["SUPER_ADMIN", "ADMIN"],
  "workflows:manage": ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  "ai:full": ["SUPER_ADMIN", "ADMIN", "MANAGER", "SALES"],
};

export function hasPermission(role: Role, permission: string): boolean {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

export function canAccessRoute(role: Role, route: string): boolean {
  const routePermissions: Record<string, string> = {
    "/team": "team:manage",
    "/settings": "settings:manage",
    "/workflow-builder": "workflows:manage",
  };
  const perm = routePermissions[route];
  if (!perm) return true;
  return hasPermission(role, perm);
}
