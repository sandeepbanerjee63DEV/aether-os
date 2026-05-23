"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  Target,
  Headphones,
  Workflow,
  Megaphone,
  CreditCard,
  Users,
  Activity,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WorkloadIndicator } from "../shared/workload-indicator";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  name: string;
  avatar: string | null;
  title: string | null;
}
interface MemberMini {
  id: string;
  name: string;
  avatar: string | null;
}

export interface DepartmentCardData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
  capacity: number;
  healthScore: number;
  isActive: boolean;
  memberCount: number;
  activeCount: number;
  avgWorkload: number;
  avgOperationalScore: number;
  capacityUsed: number;
  lead: Lead | null;
  members: MemberMini[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase,
  target: Target,
  headphones: Headphones,
  workflow: Workflow,
  megaphone: Megaphone,
  "credit-card": CreditCard,
};

const GRAD_MAP: Record<string, { bg: string; ring: string; from: string; to: string; text: string }> = {
  indigo: { bg: "from-indigo-50 to-indigo-100/30", ring: "ring-indigo-100", from: "from-indigo-500", to: "to-indigo-600", text: "text-indigo-700" },
  purple: { bg: "from-purple-50 to-purple-100/30", ring: "ring-purple-100", from: "from-purple-500", to: "to-purple-600", text: "text-purple-700" },
  amber: { bg: "from-amber-50 to-amber-100/30", ring: "ring-amber-100", from: "from-amber-500", to: "to-amber-600", text: "text-amber-700" },
  blue: { bg: "from-blue-50 to-blue-100/30", ring: "ring-blue-100", from: "from-blue-500", to: "to-blue-600", text: "text-blue-700" },
  emerald: { bg: "from-emerald-50 to-emerald-100/30", ring: "ring-emerald-100", from: "from-emerald-500", to: "to-emerald-600", text: "text-emerald-700" },
  rose: { bg: "from-rose-50 to-rose-100/30", ring: "ring-rose-100", from: "from-rose-500", to: "to-rose-600", text: "text-rose-700" },
};

export function DepartmentCard({ dept }: { dept: DepartmentCardData }) {
  const Icon = ICON_MAP[dept.icon] ?? Briefcase;
  const c = GRAD_MAP[dept.color] ?? GRAD_MAP.indigo;
  const health =
    dept.healthScore >= 85 ? "emerald" : dept.healthScore >= 65 ? "amber" : "rose";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-card transition-shadow hover:shadow-card-hover"
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", c.from, c.to)} />
      <span className="data-flow-line absolute inset-x-0 top-1 h-[1px] opacity-30" />

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-inner",
                c.from,
                c.to
              )}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{dept.name}</h3>
              <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{dept.description ?? "—"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Health</p>
            <p
              className={cn(
                "text-xl font-bold tabular-nums",
                health === "emerald"
                  ? "text-emerald-600"
                  : health === "amber"
                    ? "text-amber-600"
                    : "text-rose-600"
              )}
            >
              {dept.healthScore}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Members</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">
              {dept.activeCount}
              <span className="ml-0.5 text-sm text-slate-400">/{dept.memberCount}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Capacity</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">{dept.capacityUsed}%</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ops Score</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">
              {dept.avgOperationalScore}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Avg workload
            </span>
            <span>{dept.avgWorkload}%</span>
          </div>
          <WorkloadIndicator value={dept.avgWorkload} size="sm" />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          {dept.lead ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={dept.lead.avatar || undefined} />
                <AvatarFallback className="text-[10px]">{dept.lead.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Lead</p>
                <p className="text-xs font-semibold text-slate-700">{dept.lead.name}</p>
              </div>
            </div>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-100">
              <Sparkles className="h-3 w-3" /> Needs lead
            </span>
          )}

          <div className="flex -space-x-2">
            {dept.members.slice(0, 5).map((m) => (
              <Avatar key={m.id} className="h-6 w-6 border-2 border-white">
                <AvatarImage src={m.avatar || undefined} />
                <AvatarFallback className="text-[9px]">{m.name[0]}</AvatarFallback>
              </Avatar>
            ))}
            {dept.members.length > 5 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[9px] font-semibold text-slate-500">
                +{dept.members.length - 5}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

void Users;
