"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export function ConversionFunnel() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetch("/api/analytics/dashboard").then((r) => r.json()),
  });

  const funnel = data?.funnel ?? [];
  const max = funnel[0]?.value || 1;
  const conversionRate = data?.conversionRate ?? 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : funnel.length === 0 || max === 0 ? (
          <EmptyState title="No funnel data" description="Add leads to see conversion analytics." />
        ) : (
          <>
            <div className="space-y-2">
              {funnel.map((stage: { name: string; value: number; fill: string }, i: number) => {
                const width = max > 0 ? (stage.value / max) * 100 : 0;
                return (
                  <motion.div
                    key={stage.name}
                    initial={{ opacity: 0, scaleX: 0.8 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-28 shrink-0 text-right">
                      <p className="text-[10px] text-slate-500">{stage.name}</p>
                      <p className="text-sm font-bold text-slate-800">{stage.value.toLocaleString()}</p>
                    </div>
                    <div className="flex-1">
                      <div
                        className="h-8 rounded-r-lg"
                        style={{
                          width: `${Math.max(width, stage.value > 0 ? 8 : 0)}%`,
                          background: `linear-gradient(90deg, ${stage.fill} 0%, ${stage.fill}99 100%)`,
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">Conversion Rate</p>
              <p className="text-3xl font-bold gradient-text">{conversionRate.toFixed(1)}%</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
