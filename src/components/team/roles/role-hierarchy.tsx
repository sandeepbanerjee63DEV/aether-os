"use client";

import { motion } from "framer-motion";
import { Crown, Shield, Compass, Target, Headphones, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleRow {
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
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  crown: Crown,
  shield: Shield,
  compass: Compass,
  target: Target,
  headphones: Headphones,
  eye: Eye,
  "trending-up": Target,
  workflow: Compass,
  "credit-card": Eye,
};

const COLOR_GRAD: Record<string, string> = {
  purple: "from-purple-500 to-purple-600",
  indigo: "from-indigo-500 to-indigo-600",
  blue: "from-blue-500 to-blue-600",
  emerald: "from-emerald-500 to-emerald-600",
  amber: "from-amber-500 to-amber-600",
  slate: "from-slate-500 to-slate-600",
};

export function RoleHierarchy({ roles }: { roles: RoleRow[] }) {
  return (
    <div className="space-y-3">
      {roles.map((r, i) => {
        const Icon = ICON_MAP[r.icon] ?? Shield;
        const grad = COLOR_GRAD[r.color] ?? COLOR_GRAD.indigo;
        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group relative flex items-center gap-4 rounded-2xl border border-slate-100/80 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <div
              className={cn(
                "absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b",
                grad
              )}
            />
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-inner",
                grad
              )}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{r.name}</h3>
                {r.isSystem && (
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                    SYSTEM
                  </span>
                )}
                <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700">
                  R{r.rank}
                </span>
              </div>
              {r.description && (
                <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{r.description}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Members</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">{r.memberCount}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
