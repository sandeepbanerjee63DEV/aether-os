"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Filter, ChevronDown, Plus, Sparkles, UserCog, ArrowRightLeft, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { STAGE_LABEL, type DealStage } from "@/lib/deals/stages";

interface RowOwner {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
}

interface DealRow {
  id: string;
  title: string;
  company: string | null;
  contactName: string | null;
  value: number;
  stage: DealStage;
  probability: number;
  aiProbability: number | null;
  updatedAt: string;
  owner?: RowOwner | null;
  ownerName?: string | null;
  assignmentType?: string;
}

const ASSIGN_META: Record<string, { icon: typeof Sparkles; tone: string; title: string }> = {
  AI: { icon: Sparkles, tone: "bg-gradient-to-br from-indigo-500 to-purple-500", title: "AI-routed" },
  MANUAL: { icon: UserCog, tone: "bg-gradient-to-br from-slate-700 to-slate-900", title: "Manual" },
  ROUND_ROBIN: { icon: ArrowRightLeft, tone: "bg-gradient-to-br from-amber-500 to-orange-500", title: "Round-robin" },
  WORKLOAD: { icon: Wand2, tone: "bg-gradient-to-br from-emerald-500 to-teal-500", title: "Workload" },
  RULE: { icon: Wand2, tone: "bg-gradient-to-br from-blue-500 to-cyan-500", title: "Rule" },
  REASSIGNED: { icon: ArrowRightLeft, tone: "bg-gradient-to-br from-rose-500 to-pink-500", title: "Reassigned" },
};

const STAGE_VARIANT: Record<
  DealStage,
  "default" | "success" | "warning" | "info" | "purple" | "outline"
> = {
  QUALIFICATION: "purple",
  PROPOSAL: "info",
  NEGOTIATION: "warning",
  CLOSED_WON: "success",
  CLOSED_LOST: "outline",
};

function formatCurrency(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `$${value}`;
}

export function ActiveDealsList() {
  const { selectedDealId, setSelectedDealId, setAddDealDialogOpen } = useUiStore();
  const { data, isLoading } = useQuery<{ deals: DealRow[]; total: number }>({
    queryKey: ["deals", "list"],
    queryFn: async () => {
      const res = await fetch("/api/deals?limit=10");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const deals = data?.deals || [];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <CardTitle>Active Deals</CardTitle>
          <Badge variant="default">{data?.total ?? 0}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-50">
            All Stages <ChevronDown className="h-3 w-3" />
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setAddDealDialogOpen(true)}
            title="Add deal"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : deals.length === 0 ? (
          <EmptyState
            title="No active deals"
            description="Create your first deal to start the pipeline."
            action={
              <Button size="sm" onClick={() => setAddDealDialogOpen(true)}>
                <Plus className="mr-1 h-3 w-3" /> Add Deal
              </Button>
            }
          />
        ) : (
          <ul className="space-y-1">
            {deals.map((deal, i) => {
              const selected = selectedDealId === deal.id || (!selectedDealId && i === 0);
              const prob = Math.round(deal.aiProbability ?? deal.probability);
              return (
                <motion.li
                  key={deal.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <button
                    onClick={() => setSelectedDealId(deal.id)}
                    className={cn(
                      "flex w-full flex-col gap-1 rounded-xl px-3 py-2.5 text-left transition-all",
                      selected ? "bg-indigo-50 ring-1 ring-indigo-100" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {deal.title}
                      </p>
                      <span className="shrink-0 text-sm font-bold text-slate-900">
                        {formatCurrency(deal.value)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-slate-500">
                        {deal.company || deal.contactName || "—"}
                      </p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge variant={STAGE_VARIANT[deal.stage]} className="text-[9px]">
                          {STAGE_LABEL[deal.stage]}
                        </Badge>
                        <span
                          className={cn(
                            "text-xs font-bold",
                            prob >= 70
                              ? "text-emerald-600"
                              : prob >= 45
                                ? "text-amber-600"
                                : "text-slate-500"
                          )}
                        >
                          {prob}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] text-slate-400">
                        Updated {formatRelativeTime(deal.updatedAt)}
                      </p>
                      {(deal.owner || deal.ownerName) && (
                        <div className="flex items-center gap-1.5">
                          <div className="relative">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={deal.owner?.avatar || undefined} />
                              <AvatarFallback className="bg-indigo-50 text-[7px] font-bold text-indigo-700">
                                {getInitials(deal.owner?.name ?? deal.ownerName ?? "?")}
                              </AvatarFallback>
                            </Avatar>
                            {deal.assignmentType && ASSIGN_META[deal.assignmentType] && (() => {
                              const meta = ASSIGN_META[deal.assignmentType];
                              const Icon = meta.icon;
                              return (
                                <span
                                  title={meta.title}
                                  className={cn(
                                    "absolute -bottom-0.5 -right-0.5 flex h-2 w-2 items-center justify-center rounded-full text-white",
                                    meta.tone,
                                  )}
                                >
                                  <Icon className="h-1 w-1" />
                                </span>
                              );
                            })()}
                          </div>
                          <span className="max-w-[80px] truncate text-[10px] font-medium text-slate-600">
                            {deal.owner?.name?.split(" ")[0] ?? deal.ownerName?.split(" ")[0]}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
