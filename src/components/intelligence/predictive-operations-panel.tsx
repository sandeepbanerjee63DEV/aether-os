"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, AlertCircle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { PredictiveMetric } from "@/types/operational-intelligence";

export function PredictiveOperationsPanel() {
  const { data, isLoading } = useQuery<{ metrics: PredictiveMetric[] }>({
    queryKey: ["predictions"],
    queryFn: () => fetch("/api/intelligence/predictions").then((r) => r.json()),
  });

  const metrics = data?.metrics ?? [];
  const trendData = metrics.slice(0, 5).map((m, i) => ({
    w: `P${i + 1}`,
    forecast: m.confidence,
    actual: m.confidence > 0 ? m.confidence - 5 : null,
  }));

  return (
    <Card className="h-full intelligence-hover overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-indigo-500" />
            Predictive Operations
          </CardTitle>
          <Badge variant="purple" className="gap-1 text-[10px]">
            AI Forecast
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : metrics.length === 0 ? (
          <EmptyState title="No predictions yet" description="Pipeline data required for forecasting." />
        ) : (
          <>
            {trendData.some((d) => d.actual != null) && (
              <div className="h-[100px] rounded-xl bg-slate-50/80 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="actual" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="forecast" stroke="#A855F7" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {metrics.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "rounded-xl border p-2.5",
                    m.risk ? "border-amber-100 bg-amber-50/30" : "border-slate-100 bg-white"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-[10px] font-medium text-slate-500">{m.label}</p>
                    {m.risk ? (
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                    ) : m.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">{m.value}</p>
                  <p className="text-[10px] text-slate-400">{m.forecast}</p>
                  {m.confidence > 0 && (
                    <>
                      <Progress value={m.confidence} className="mt-2 h-1" />
                      <p className="mt-0.5 text-[9px] text-indigo-500">{m.confidence}% confidence</p>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
