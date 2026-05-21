"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConversionFunnel } from "@/components/charts/conversion-funnel";
import { ScoreDistributionChart } from "@/components/charts/analytics-donuts";
import { AiInsightsWidget } from "@/components/charts/ai-insights-widget";
import { AiOperationalFeed } from "@/components/intelligence/ai-operational-feed";
import { TrendingUp, Users, Handshake, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommandCenterPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetch("/api/analytics/dashboard").then((r) => r.json()),
  });

  const kpis = data?.kpis ?? [];

  return (
    <>
      <Navbar title="Command Center" subtitle="Your AI-powered business operations at a glance." />
      <div className="flex-1 space-y-5 px-4 pb-8 lg:px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
            : kpis.map((kpi: { label: string; value: string; change: string }, i: number) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500">{kpi.label}</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">{kpi.value}</p>
                      <p className="mt-0.5 text-xs font-medium text-slate-400">{kpi.change}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" /> Pipeline Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { icon: Users, label: "Total Leads", value: data?.totalLeads ?? 0 },
                  { icon: Handshake, label: "Conversion", value: `${(data?.conversionRate ?? 0).toFixed(1)}%` },
                  { icon: Sparkles, label: "AI Qualified", value: data?.funnel?.[1]?.value ?? 0 },
                  { icon: TrendingUp, label: "Won", value: data?.funnel?.[3]?.value ?? 0 },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-100 p-4">
                    <div className="inline-flex rounded-lg bg-indigo-50 p-2 text-indigo-600">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-2xl font-bold">{item.value}</p>
                    <p className="text-xs text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <AiOperationalFeed />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ConversionFunnel />
          <ScoreDistributionChart />
        </div>
        <AiInsightsWidget />
      </div>
    </>
  );
}
