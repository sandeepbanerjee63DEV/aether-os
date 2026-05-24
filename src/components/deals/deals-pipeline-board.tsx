"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  GripVertical,
  Calendar,
  Flame,
  AlertTriangle,
  Trophy,
  XCircle,
  Plus,
  UserCog,
  ArrowRightLeft,
  Wand2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { STAGE_ORDER, STAGE_LABEL, type DealStage } from "@/lib/deals/stages";

interface BoardOwner {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
}

interface BoardDeal {
  id: string;
  title: string;
  company: string | null;
  contactName: string | null;
  value: number;
  stage: DealStage;
  probability: number;
  aiProbability: number | null;
  riskLevel: string | null;
  expectedClose: string | null;
  ownerName: string | null;
  owner?: BoardOwner | null;
  assignmentType?: string;
  operationalStatus?: string;
}

const ASSIGN_TYPE_ICON: Record<string, { icon: typeof Sparkles; tone: string; title: string }> = {
  AI: { icon: Sparkles, tone: "bg-gradient-to-br from-indigo-500 to-purple-500", title: "AI-routed" },
  MANUAL: { icon: UserCog, tone: "bg-gradient-to-br from-slate-700 to-slate-900", title: "Manually assigned" },
  ROUND_ROBIN: { icon: ArrowRightLeft, tone: "bg-gradient-to-br from-amber-500 to-orange-500", title: "Round-robin" },
  WORKLOAD: { icon: Wand2, tone: "bg-gradient-to-br from-emerald-500 to-teal-500", title: "Workload-balanced" },
  RULE: { icon: Wand2, tone: "bg-gradient-to-br from-blue-500 to-cyan-500", title: "Rule-based" },
  REASSIGNED: { icon: ArrowRightLeft, tone: "bg-gradient-to-br from-rose-500 to-pink-500", title: "Reassigned" },
};

const OP_STATUS_DOT: Record<string, string> = {
  AT_RISK: "bg-rose-500",
  STALLED: "bg-amber-500",
  ACTIVE: "bg-emerald-500",
  NEW: "bg-slate-400",
  CLOSED: "bg-slate-300",
};

const STAGE_THEME: Record<
  DealStage,
  { ring: string; bar: string; chip: string; label: string }
> = {
  QUALIFICATION: {
    ring: "ring-purple-100",
    bar: "from-purple-400 to-indigo-400",
    chip: "bg-purple-50 text-purple-600 border-purple-100",
    label: "Qualification",
  },
  PROPOSAL: {
    ring: "ring-blue-100",
    bar: "from-blue-400 to-cyan-400",
    chip: "bg-blue-50 text-blue-600 border-blue-100",
    label: "Proposal",
  },
  NEGOTIATION: {
    ring: "ring-amber-100",
    bar: "from-amber-400 to-orange-400",
    chip: "bg-amber-50 text-amber-700 border-amber-100",
    label: "Negotiation",
  },
  CLOSED_WON: {
    ring: "ring-emerald-100",
    bar: "from-emerald-400 to-teal-400",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-100",
    label: "Won",
  },
  CLOSED_LOST: {
    ring: "ring-slate-200",
    bar: "from-slate-300 to-slate-400",
    chip: "bg-slate-50 text-slate-500 border-slate-200",
    label: "Lost",
  },
};

function formatCurrency(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `$${value}`;
}

function formatExpectedClose(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const days = Math.round((d.getTime() - Date.now()) / 86400000);
  if (days === 0) return "Today";
  if (days > 0 && days < 30) return `${days}d`;
  if (days < 0 && days > -30) return `${-days}d overdue`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function DealCard({ deal, isDragging }: { deal: BoardDeal; isDragging?: boolean }) {
  const { selectedDealId, setSelectedDealId } = useUiStore();
  const selected = selectedDealId === deal.id;
  const prob = deal.aiProbability ?? deal.probability;
  const theme = STAGE_THEME[deal.stage];
  const isHot = (deal.aiProbability ?? 0) >= 75;
  const isRisk = deal.riskLevel === "high" || ((deal.aiProbability ?? 100) < 40 && deal.stage !== "CLOSED_LOST");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedDealId(deal.id);
      }}
      className={cn(
        "group cursor-pointer overflow-hidden rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:shadow-md",
        selected && "ring-2 ring-indigo-200",
        isDragging && "rotate-2 scale-105 shadow-2xl ring-2 ring-indigo-300"
      )}
    >
      <div className={cn("-mx-3 -mt-3 mb-2 h-1 bg-gradient-to-r", theme.bar)} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{deal.title}</p>
          {deal.company && (
            <p className="truncate text-xs text-slate-500">{deal.company}</p>
          )}
        </div>
        <GripVertical className="h-4 w-4 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Value</p>
          <p className="text-base font-bold text-slate-900">{formatCurrency(deal.value)}</p>
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-wide text-slate-400">
            <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
            AI win
          </p>
          <p
            className={cn(
              "text-base font-bold",
              prob >= 70 ? "text-emerald-600" : prob >= 45 ? "text-amber-600" : "text-slate-500"
            )}
          >
            {Math.round(prob)}%
          </p>
        </div>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-all", theme.bar)}
          style={{ width: `${Math.round(prob)}%` }}
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {isHot && (
          <Badge variant="hot" className="gap-0.5 text-[9px]">
            <Flame className="h-2.5 w-2.5" />
            Hot
          </Badge>
        )}
        {isRisk && (
          <Badge variant="danger" className="gap-0.5 text-[9px]">
            <AlertTriangle className="h-2.5 w-2.5" />
            Risk
          </Badge>
        )}
        {deal.stage === "CLOSED_WON" && (
          <Badge variant="success" className="gap-0.5 text-[9px]">
            <Trophy className="h-2.5 w-2.5" />
            Won
          </Badge>
        )}
        {deal.stage === "CLOSED_LOST" && (
          <Badge variant="outline" className="gap-0.5 text-[9px]">
            <XCircle className="h-2.5 w-2.5" />
            Lost
          </Badge>
        )}
        <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
          <Calendar className="h-3 w-3" />
          {formatExpectedClose(deal.expectedClose)}
        </span>
      </div>

      {(deal.owner || deal.ownerName) && (
        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Avatar className="h-5 w-5 ring-1 ring-white">
                <AvatarImage src={deal.owner?.avatar || undefined} />
                <AvatarFallback className="bg-indigo-50 text-[8px] font-bold text-indigo-700">
                  {getInitials(deal.owner?.name ?? deal.ownerName ?? "?")}
                </AvatarFallback>
              </Avatar>
              {deal.assignmentType && ASSIGN_TYPE_ICON[deal.assignmentType] && (() => {
                const meta = ASSIGN_TYPE_ICON[deal.assignmentType];
                const Icon = meta.icon;
                return (
                  <span
                    title={meta.title}
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full text-white shadow",
                      meta.tone,
                    )}
                  >
                    <Icon className="h-1.5 w-1.5" />
                  </span>
                );
              })()}
            </div>
            <span className="truncate text-[10px] font-medium text-slate-600">
              {deal.owner?.name?.split(" ")[0] ?? deal.ownerName?.split(" ")[0] ?? "Unassigned"}
            </span>
          </div>
          {deal.operationalStatus && OP_STATUS_DOT[deal.operationalStatus] && (
            <span
              title={`Status: ${deal.operationalStatus.replace("_", " ")}`}
              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", OP_STATUS_DOT[deal.operationalStatus])}
            />
          )}
        </div>
      )}
    </motion.div>
  );
}

function DraggableDeal({ deal }: { deal: BoardDeal }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn(isDragging && "opacity-30")}>
      <DealCard deal={deal} />
    </div>
  );
}

function StageColumn({
  stage,
  deals,
  isDropTarget,
}: {
  stage: DealStage;
  deals: BoardDeal[];
  isDropTarget: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const theme = STAGE_THEME[stage];
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const { setAddDealDialogOpen } = useUiStore();

  return (
    <div className="flex h-full min-h-[440px] w-[280px] shrink-0 flex-col">
      <div
        className={cn(
          "rounded-t-xl border border-b-0 border-slate-100 bg-white px-3 py-2.5",
          isDropTarget && "ring-2 ring-indigo-200"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex h-2 w-2 rounded-full bg-gradient-to-br",
                theme.bar
              )}
            />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              {STAGE_LABEL[stage]}
            </p>
            <Badge variant="outline" className="text-[10px]">
              {deals.length}
            </Badge>
          </div>
          {stage === "QUALIFICATION" && (
            <button
              onClick={() => setAddDealDialogOpen(true)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-indigo-600"
              title="Add deal"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="mt-0.5 text-[11px] font-medium text-slate-500">
          {formatCurrency(totalValue)} pipeline
        </p>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 rounded-b-xl border border-t-0 border-slate-100 bg-slate-50/40 p-2 transition-colors",
          isOver && "bg-indigo-50/60 ring-2 ring-indigo-200"
        )}
      >
        {deals.length === 0 ? (
          <div className="flex h-full min-h-[120px] items-center justify-center rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center">
            <p className="text-[11px] text-slate-400">Drop deals here</p>
          </div>
        ) : (
          deals.map((deal) => <DraggableDeal key={deal.id} deal={deal} />)
        )}
      </div>
    </div>
  );
}

export function DealsPipelineBoard() {
  const queryClient = useQueryClient();
  const { setAddDealDialogOpen } = useUiStore();
  const { data, isLoading } = useQuery<{ deals: BoardDeal[]; total: number }>({
    queryKey: ["deals", "board"],
    queryFn: async () => {
      const res = await fetch("/api/deals?limit=200");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<DealStage | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const mutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: DealStage }) => {
      const res = await fetch(`/api/deals/${id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error("Failed to update stage");
      return res.json();
    },
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ["deals", "board"] });
      const prev = queryClient.getQueryData<{ deals: BoardDeal[]; total: number }>([
        "deals",
        "board",
      ]);
      if (prev) {
        queryClient.setQueryData(["deals", "board"], {
          ...prev,
          deals: prev.deals.map((d) => (d.id === id ? { ...d, stage } : d)),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["deals", "board"], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["deal-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["deal-detail"] });
      queryClient.invalidateQueries({ queryKey: ["deal-activity"] });
    },
  });

  const grouped = useMemo(() => {
    const byStage = Object.fromEntries(
      STAGE_ORDER.map((s) => [s, [] as BoardDeal[]])
    ) as Record<DealStage, BoardDeal[]>;
    (data?.deals ?? []).forEach((d) => {
      if (byStage[d.stage]) byStage[d.stage].push(d);
    });
    return byStage;
  }, [data]);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragOver(e: { over: { id: string | number } | null }) {
    if (!e.over) {
      setOverStage(null);
      return;
    }
    const id = String(e.over.id);
    if (STAGE_ORDER.includes(id as DealStage)) {
      setOverStage(id as DealStage);
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    setOverStage(null);
    if (!e.over) return;
    const dealId = String(e.active.id);
    const targetStage = String(e.over.id) as DealStage;
    if (!STAGE_ORDER.includes(targetStage)) return;
    const deal = data?.deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === targetStage) return;
    mutation.mutate({ id: dealId, stage: targetStage });
  }

  const activeDeal = activeId ? data?.deals.find((d) => d.id === activeId) : null;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <Badge variant="pipeline" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Deals Pipeline
          </Badge>
          <span className="text-[11px] text-slate-500">
            Drag any card across stages — AI re-scores automatically
          </span>
        </div>
        <Button size="sm" onClick={() => setAddDealDialogOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Deal
        </Button>
      </div>

      <div className="overflow-x-auto p-4 scrollbar-thin">
        {isLoading ? (
          <div className="flex gap-3">
            {STAGE_ORDER.map((s) => (
              <Skeleton key={s} className="h-[440px] w-[280px] shrink-0 rounded-xl" />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => {
              setActiveId(null);
              setOverStage(null);
            }}
          >
            <div className="flex gap-3 pb-2">
              {STAGE_ORDER.map((stage) => (
                <StageColumn
                  key={stage}
                  stage={stage}
                  deals={grouped[stage]}
                  isDropTarget={overStage === stage}
                />
              ))}
            </div>
            <DragOverlay>
              {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </Card>
  );
}
