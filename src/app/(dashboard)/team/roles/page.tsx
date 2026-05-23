"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PermissionMatrix } from "@/components/team/roles/permission-matrix";
import { RoleHierarchy } from "@/components/team/roles/role-hierarchy";

interface PermissionsResponse {
  modules: { key: string; label: string; icon: string }[];
  actions: { key: string; label: string; tone: string }[];
  matrix: {
    role: string;
    meta: { label: string; description: string; color: string; icon: string };
    rank: number;
    grid: Record<string, Record<string, boolean>>;
  }[];
}

interface RolesResponse {
  roles: {
    id: string;
    key: string;
    name: string;
    description: string | null;
    baseRole: string;
    color: string;
    icon: string;
    isSystem: boolean;
    rank: number;
    memberCount: number;
  }[];
}

export default function TeamRolesPage() {
  const { data: permData } = useQuery<PermissionsResponse>({
    queryKey: ["team-permissions"],
    queryFn: async () => {
      const res = await fetch("/api/team/permissions");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: roleData } = useQuery<RolesResponse>({
    queryKey: ["team-roles"],
    queryFn: async () => {
      const res = await fetch("/api/team/roles");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  return (
    <>
      <Navbar
        title="Roles & Permissions"
        subtitle="Enterprise RBAC engine — base role matrix, custom role builder, and hierarchy."
        badge="RBAC"
      />

      <div className="flex-1 space-y-5 px-4 pb-28 pt-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100/60 bg-gradient-to-r from-indigo-50/40 via-white to-purple-50/30 px-4 py-2.5 glass-card"
        >
          <Badge variant="purple" className="gap-1">
            <ShieldCheck className="h-3 w-3" />
            RBAC Engine
          </Badge>
          <span className="text-xs text-slate-500">
            Permissions inherit by rank. Custom roles override the matrix per-key.
          </span>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <motion.div
            className="xl:col-span-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-indigo-500" />
                  Permission Matrix
                </CardTitle>
              </CardHeader>
              <CardContent>
                {permData ? (
                  <PermissionMatrix modules={permData.modules.map((m) => ({ ...m }))} actions={permData.actions} matrix={permData.matrix} />
                ) : (
                  <div className="h-72 animate-pulse rounded-2xl bg-slate-50" />
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="xl:col-span-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-500" />
                  Role Hierarchy
                </CardTitle>
              </CardHeader>
              <CardContent>
                {roleData ? (
                  <RoleHierarchy roles={roleData.roles} />
                ) : (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-50" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
