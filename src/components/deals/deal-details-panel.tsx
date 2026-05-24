"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Building2,
  User,
  Calendar,
  MoreHorizontal,
  TrendingUp,
  Brain,
  Sparkles,
  AlertTriangle,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials, cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { STAGE_LABEL, type DealStage } from "@/lib/deals/stages";
import { DealOwnerCard } from "./deal-owner-card";

interface OwnerSummary {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  title: string | null;
  workloadPct: number;
  operationalScore: number;
  departmentId?: string | null;
}

interface DealDetail {
  id: string;
  title: string;
  company: string | null;
  contactName: string | null;
  value: number;
  stage: DealStage;
  probability: number;
  aiProbability: number | null;
  aiAnalysis: string | null;
  nextBestAction: string | null;
  riskLevel: string | null;
  expectedClose: string | null;
  ownerName: string | null;
  updatedAt: string;
  owner?: OwnerSummary | null;
  assignedBy?: OwnerSummary | null;
  department?: { id: string; name: string; color: string; icon: string } | null;
  supportingDepartments?: { id: string; name: string; color: string; icon: string }[];
  assignmentType?: string;
  assignmentReason?: string | null;
  assignedAt?: string | null;
  operationalStatus?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatExpectedClose(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const days = Math.round((d.getTime() - Date.now()) / 86400000);
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  if (days === 0) return `${date} (today)`;
  if (days > 0) return `${date} (${days}d)`;
  return `${date} (${-days}d overdue)`;
}

const RISK_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

export function DealDetailsPanel() {
  const { selectedDealId } = useUiStore();
  const { data: deal, isLoading } = useQuery<DealDetail>({
    queryKey: ["deal-detail", selectedDealId],
    queryFn: async () => {
      if (selectedDealId) {
        const res = await fetch(`/api/deals/${selectedDealId}`);
        const json = await res.json();
        return json.deal || json;
      }
      const res = await fetch("/api/deals?limit=1");
      const json = await res.json();
      return json.deals?.[0] ?? null;
    },
  });

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!deal) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full min-h-[320px] items-center justify-center p-6">
          <p className="text-center text-sm text-slate-500">
            Select a deal from the pipeline or list to view AI-powered details.
          </p>
        </CardContent>
      </Card>
    );
  }

  const prob = Math.round(deal.aiProbability ?? deal.probability);
  const weighted = deal.value * (prob / 100);
  const confidence = Math.min(99, Math.max(50, prob));

  return (
    <Card className="h-full border-indigo-100/50">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Deal Details</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="ai-glow-pulse gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 live-pulse" />
            AI Win {prob}%
          </Badge>
          <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-50">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-purple-100 text-lg text-indigo-700">
              {getInitials(deal.company || deal.title)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-bold text-slate-900">{deal.title}</h2>
              {deal.stage === "CLOSED_WON" && (
                <Badge variant="success" className="gap-1">
                  <Trophy className="h-3 w-3" /> Won
                </Badge>
              )}
              {deal.riskLevel && (
                <Badge variant={RISK_VARIANT[deal.riskLevel] || "default"} className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {deal.riskLevel} risk
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
              {deal.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {deal.company}
                </span>
              )}
              {deal.contactName && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {deal.contactName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatExpectedClose(deal.expectedClose)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Deal value
            </p>
            <p className="text-sm font-semibold text-slate-800">{formatCurrency(deal.value)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Weighted
            </p>
            <p className="text-sm font-semibold text-emerald-700">
              {formatCurrency(weighted)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Stage
            </p>
            <p className="text-sm font-semibold text-slate-800">{STAGE_LABEL[deal.stage]}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Expected close
            </p>
            <p className="truncate text-sm font-semibold text-slate-800">
              {formatExpectedClose(deal.expectedClose)}
            </p>
          </div>
        </div>

        <DealOwnerCard
          dealId={deal.id}
          owner={deal.owner ?? null}
          assignedBy={deal.assignedBy ?? null}
          department={deal.department ?? null}
          supportingDepartments={deal.supportingDepartments ?? []}
          assignmentType={deal.assignmentType ?? "MANUAL"}
          assignmentReason={deal.assignmentReason ?? null}
          assignedAt={deal.assignedAt ?? null}
          operationalStatus={deal.operationalStatus ?? "NEW"}
          dealValue={deal.value}
          aiProbability={deal.aiProbability}
        />

        <div className="space-y-3 rounded-xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/20 p-4 ai-glow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                  AI Win Prediction
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {prob}% probability · {STAGE_LABEL[deal.stage]}
                </p>
              </div>
            </div>
            <Badge variant="purple" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {confidence}% confidence
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-100 bg-white/80 px-3 py-2">
              <p className="flex items-center gap-1 text-[10px] text-slate-400">
                <TrendingUp className="h-3 w-3" /> AI vs manual
              </p>
              <p className="text-sm font-bold text-slate-800">
                {prob}% / {Math.round(deal.probability)}%
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-white/80 px-3 py-2">
              <p className="flex items-center gap-1 text-[10px] text-slate-400">
                <AlertTriangle className="h-3 w-3" /> Risk
              </p>
              <p
                className={cn(
                  "text-sm font-bold capitalize",
                  deal.riskLevel === "low"
                    ? "text-emerald-600"
                    : deal.riskLevel === "high"
                      ? "text-red-600"
                      : "text-amber-600"
                )}
              >
                {deal.riskLevel || "—"}
              </p>
            </div>
          </div>

          {deal.aiAnalysis && (
            <p className="text-xs leading-relaxed text-slate-600">{deal.aiAnalysis}</p>
          )}

          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-500">Win probability</span>
              <span className="font-bold text-emerald-600">{prob}%</span>
            </div>
            <Progress
              value={prob}
              indicatorClassName="bg-gradient-to-r from-indigo-500 to-purple-500"
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-4"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
            Next Best Action
          </p>
          <p className="mt-1 font-semibold text-slate-900">{deal.nextBestAction || "—"}</p>
          <Button className="mt-3" size="sm">
            Take Action
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}
