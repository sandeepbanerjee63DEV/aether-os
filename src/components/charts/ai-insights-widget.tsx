"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof AlertTriangle> = {
  "alert-triangle": AlertTriangle,
  alert: AlertTriangle,
  clock: Clock,
  "trending-up": TrendingUp,
  trending: TrendingUp,
};

const COLORS: Record<string, string> = {
  orange: "bg-orange-100 text-orange-600",
  blue: "bg-blue-100 text-blue-600",
  green: "bg-emerald-100 text-emerald-600",
  purple: "bg-purple-100 text-purple-600",
};

export function AiInsightsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["insights"],
    queryFn: () => fetch("/api/insights").then((r) => r.json()),
  });

  const insights = data?.insights ?? [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>AI Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <EmptyState title="No insights" description="Insights appear from AI analysis of your data." />
        ) : (
          <ul className="space-y-3">
            {insights.map((insight: { id: string; title: string; message: string; icon: string; color: string }) => {
              const Icon = ICONS[insight.icon] || TrendingUp;
              return (
                <li
                  key={insight.id}
                  className="flex gap-3 rounded-xl border border-slate-50 bg-slate-50/50 p-3"
                >
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", COLORS[insight.color] || COLORS.blue)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{insight.title}</p>
                    <p className="text-xs text-slate-500">{insight.message}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
