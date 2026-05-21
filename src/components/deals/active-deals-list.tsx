"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Filter, ChevronDown, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { STAGE_LABEL, type DealStage } from "@/lib/deals/stages";

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
}

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
                    <p className="text-[10px] text-slate-400">
                      Updated {formatRelativeTime(deal.updatedAt)}
                    </p>
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
