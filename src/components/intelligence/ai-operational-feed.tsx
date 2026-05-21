"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  AlertTriangle,
  Users,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Zap,
  Shield,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { OperationalFeedItem, FeedSeverity } from "@/types/operational-intelligence";

const SEVERITY_STYLES: Record<FeedSeverity, { icon: typeof AlertTriangle; badge: "danger" | "warning" | "info" | "success" | "purple"; dot: string }> = {
  critical: { icon: AlertTriangle, badge: "danger", dot: "bg-red-500" },
  warning: { icon: TrendingDown, badge: "warning", dot: "bg-amber-500" },
  info: { icon: Users, badge: "info", dot: "bg-blue-500" },
  success: { icon: TrendingUp, badge: "success", dot: "bg-emerald-500" },
  ai: { icon: Sparkles, badge: "purple", dot: "bg-purple-500" },
};

function FeedItem({ item, index }: { item: OperationalFeedItem; index: number }) {
  const style = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.info;
  const Icon = style.icon;

  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group relative rounded-xl border border-slate-100/80 bg-white/60 p-3 transition-all hover:border-indigo-100 hover:bg-white hover:shadow-sm intelligence-hover"
    >
      <div className="flex gap-3">
        <div className="relative shrink-0">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50", item.aiGenerated && "ai-glow")}>
            <Icon className="h-4 w-4 text-indigo-600" />
          </div>
          <span className={cn("absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full live-pulse", style.dot)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800">{item.message}</p>
            {item.metric && (
              <span className="text-xs font-bold text-slate-600">{item.metric.value}</span>
            )}
          </div>
          {item.summary && <p className="mt-0.5 text-xs text-slate-500">{item.summary}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {item.aiGenerated && (
              <Badge variant="purple" className="gap-1 text-[10px]">
                <Sparkles className="h-2.5 w-2.5" /> AI
              </Badge>
            )}
            {item.recommendation && (
              <Badge variant="outline" className="text-[10px]">
                <Zap className="mr-1 h-2.5 w-2.5" />
                {item.recommendation}
              </Badge>
            )}
            <span className="text-[10px] text-slate-400">{formatRelativeTime(item.timestamp)}</span>
          </div>
        </div>
      </div>
    </motion.li>
  );
}

export function AiOperationalFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ["operations-feed"],
    queryFn: () => fetch("/api/operations/feed").then((r) => r.json()),
  });

  const items: OperationalFeedItem[] = data?.feed ?? [];
  const summary = items[0]?.summary;

  return (
    <Card className="flex h-full flex-col overflow-hidden border-indigo-100/50 glass-card ai-glow">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-50 pb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
            <Radio className="h-4 w-4 text-white" />
            {items.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400 live-pulse" />
            )}
          </div>
          <div>
            <CardTitle className="text-base">AI Operational Feed</CardTitle>
            <p className="text-[10px] text-slate-500">
              {data?.signalsMonitored ?? 0} signals monitored
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={items.length ? "success" : "outline"} className="gap-1 text-[10px]">
            {items.length ? "LIVE" : "IDLE"}
          </Badge>
          {(data?.riskAlerts ?? 0) > 0 && (
            <Badge variant="warning" className="text-[10px]">
              {data.riskAlerts} alerts
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        <div className="h-1 w-full data-flow-line opacity-40" />
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No operational signals"
            description="Add leads and activity to activate AI monitoring."
            className="py-12"
          />
        ) : (
          <>
            <ul className="max-h-[320px] space-y-2 overflow-y-auto p-4 scrollbar-thin xl:max-h-[280px]">
              <AnimatePresence mode="popLayout">
                {items.map((item, i) => (
                  <FeedItem key={item.id} item={item} index={i} />
                ))}
              </AnimatePresence>
            </ul>
            {summary && (
              <div className="border-t border-indigo-50 bg-gradient-to-r from-indigo-50/50 to-purple-50/30 px-4 py-2.5">
                <p className="flex items-center gap-2 text-xs text-indigo-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="font-medium">Latest:</span>
                  {summary}
                  <ChevronRight className="ml-auto h-3.5 w-3.5" />
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
