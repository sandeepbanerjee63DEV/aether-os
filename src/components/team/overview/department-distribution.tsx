"use client";

import { motion } from "framer-motion";
import { Building2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkloadIndicator } from "../shared/workload-indicator";
import { cn } from "@/lib/utils";

interface DeptItem {
  id: string;
  name: string;
  color: string;
  memberCount: number;
  activeCount: number;
  capacity: number;
  avgWorkload: number;
  healthScore: number;
}

const COLOR_BG: Record<string, string> = {
  indigo: "from-indigo-50 to-indigo-100/40 ring-indigo-100 text-indigo-700",
  purple: "from-purple-50 to-purple-100/40 ring-purple-100 text-purple-700",
  amber: "from-amber-50 to-amber-100/40 ring-amber-100 text-amber-700",
  blue: "from-blue-50 to-blue-100/40 ring-blue-100 text-blue-700",
  emerald: "from-emerald-50 to-emerald-100/40 ring-emerald-100 text-emerald-700",
  rose: "from-rose-50 to-rose-100/40 ring-rose-100 text-rose-700",
};

export function DepartmentDistribution({ departments }: { departments: DeptItem[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-500" />
            Department Distribution
          </CardTitle>
          <span className="text-[10px] font-medium text-slate-500">
            {departments.length} active units
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {departments.map((d, i) => {
            const c = COLOR_BG[d.color] ?? COLOR_BG.indigo;
            return (
              <motion.li
                key={d.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn("rounded-xl bg-gradient-to-br p-3 ring-1", c)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{d.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Users className="h-3 w-3" />
                      {d.activeCount}/{d.memberCount} active · capacity {d.capacity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Health</p>
                    <p className="text-base font-bold tabular-nums text-slate-900">{d.healthScore}</p>
                  </div>
                </div>
                <div className="mt-2.5">
                  <WorkloadIndicator value={d.avgWorkload} showLabel size="sm" />
                </div>
              </motion.li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
