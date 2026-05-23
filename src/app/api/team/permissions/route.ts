import { NextResponse } from "next/server";
import {
  PERMISSION_MODULES,
  PERMISSION_ACTIONS,
  ROLE_META,
  ROLE_RANK,
  permissionGrid,
  type BaseRole,
} from "@/lib/team/permissions";

export async function GET() {
  const roles: BaseRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "SALES", "SUPPORT", "VIEWER"];
  const matrix = roles.map((r) => ({
    role: r,
    meta: ROLE_META[r],
    rank: ROLE_RANK[r],
    grid: permissionGrid(r),
  }));

  return NextResponse.json({
    modules: PERMISSION_MODULES,
    actions: PERMISSION_ACTIONS,
    matrix,
  });
}
