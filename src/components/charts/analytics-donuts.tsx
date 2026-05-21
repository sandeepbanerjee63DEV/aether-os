"use client";

import { useQuery } from "@tanstack/react-query";
import { DonutChartCard } from "./donut-chart-card";
import { Skeleton } from "@/components/ui/skeleton";

export function ScoreDistributionChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetch("/api/analytics/dashboard").then((r) => r.json()),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return (
    <DonutChartCard
      title="AI Lead Score Distribution"
      data={data?.scoreDistribution ?? []}
    />
  );
}

export function SourceDistributionChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetch("/api/analytics/dashboard").then((r) => r.json()),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  const total = data?.totalLeads ?? 0;

  return (
    <DonutChartCard
      title="Leads by Source"
      data={data?.sourceDistribution ?? []}
      centerValue={total > 0 ? String(total) : undefined}
      centerLabel={total > 0 ? "Total" : undefined}
    />
  );
}
