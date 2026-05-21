"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Trophy, XCircle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsResponse {
  winRate: number;
  openCount: number;
  wonCount: number;
  lostCount: number;
  avgDealSize: number;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}

export function DealsWinRateCard() {
  const { data, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: ["deal-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/deals/analytics");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const winRate = Math.round(data?.winRate ?? 0);
  const lossRate = 100 - winRate;

  const pieData = [
    { name: "Won", value: data?.wonCount ?? 0, fill: "#10b981" },
    { name: "Lost", value: data?.lostCount ?? 0, fill: "#cbd5e1" },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Win Rate</CardTitle>
        <Badge variant="success" className="gap-1">
          <Activity className="h-3 w-3" />
          {winRate}%
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="flex items-center gap-4">
            <div className="relative h-36 w-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={45}
                    outerRadius={64}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-slate-900">{winRate}%</p>
                <p className="text-[10px] uppercase text-slate-400">win rate</p>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-medium text-slate-600">Won</span>
                </div>
                <span className="text-sm font-bold text-emerald-700">{data.wonCount}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">Lost</span>
                </div>
                <span className="text-sm font-bold text-slate-700">{data.lostCount}</span>
              </div>
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 px-3 py-2">
                <p className="text-[10px] uppercase text-indigo-500">Avg deal size</p>
                <p className="text-sm font-bold text-slate-900">
                  {formatCurrency(data.avgDealSize)}
                </p>
              </div>
              <p className="text-[11px] text-slate-400">
                Loss rate {lossRate}% · {data.openCount} open in pipeline
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
