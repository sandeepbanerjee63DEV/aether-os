"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { STAGE_LABEL, type DealStage } from "@/lib/deals/stages";

interface AnalyticsResponse {
  totalPipeline: number;
  weightedPipeline: number;
  byStage: { stage: DealStage; count: number; value: number }[];
}

const STAGE_COLOR: Record<DealStage, string> = {
  QUALIFICATION: "#a78bfa",
  PROPOSAL: "#60a5fa",
  NEGOTIATION: "#f59e0b",
  CLOSED_WON: "#10b981",
  CLOSED_LOST: "#cbd5e1",
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}

export function DealsForecastCard() {
  const { data, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: ["deal-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/deals/analytics");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const chartData =
    data?.byStage.map((s) => ({
      stage: STAGE_LABEL[s.stage],
      value: s.value,
      fill: STAGE_COLOR[s.stage],
    })) ?? [];

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Pipeline Forecast</CardTitle>
        <Badge variant="purple" className="gap-1">
          <Sparkles className="h-3 w-3" />
          AI weighted
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading || !data ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-400">
                  <TrendingUp className="h-3 w-3" /> Open pipeline
                </p>
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency(data.totalPipeline)}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2">
                <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-emerald-600">
                  <Sparkles className="h-3 w-3" /> AI-weighted
                </p>
                <p className="text-lg font-bold text-emerald-700">
                  {formatCurrency(data.weightedPipeline)}
                </p>
              </div>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 6, right: 4, left: -16, bottom: 0 }}>
                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => formatCurrency(v)}
                  />
                  <Tooltip
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
