"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Zap, Brain, Bell, UserPlus, AlertTriangle, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AutomationNode } from "@/types/operational-intelligence";

const NODE_ICONS = {
  trigger: Play,
  ai: Brain,
  action: Zap,
  notify: Bell,
  assign: UserPlus,
  escalate: AlertTriangle,
};

const NODE_COLORS = {
  trigger: "border-purple-200 bg-purple-50 text-purple-600",
  ai: "border-indigo-200 bg-indigo-50 text-indigo-600 ai-glow-pulse",
  action: "border-blue-200 bg-blue-50 text-blue-600",
  notify: "border-amber-200 bg-amber-50 text-amber-600",
  assign: "border-emerald-200 bg-emerald-50 text-emerald-600",
  escalate: "border-red-200 bg-red-50 text-red-600",
};

export function AutomationVisibility() {
  const { data, isLoading } = useQuery<{ nodes: AutomationNode[]; running: boolean; workflowName?: string }>({
    queryKey: ["automation"],
    queryFn: () => fetch("/api/intelligence/automation").then((r) => r.json()),
  });

  const nodes = data?.nodes ?? [];

  return (
    <Card className="h-full intelligence-hover overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-amber-500" />
          Live Automation
        </CardTitle>
        <Badge variant={data?.running ? "success" : "outline"} className="gap-1 text-[10px]">
          {data?.running ? "Running" : "Idle"}
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : nodes.length === 0 ? (
          <EmptyState title="No active workflow" description="Create a workflow in Workflow Builder." />
        ) : (
          <>
            {data?.workflowName && (
              <p className="mb-2 text-xs font-medium text-slate-600">{data.workflowName}</p>
            )}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin">
              {nodes.map((node, i) => {
                const Icon = NODE_ICONS[node.type];
                return (
                  <div key={node.id} className="flex items-center shrink-0">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08 }}
                      className={cn(
                        "relative flex flex-col items-center rounded-xl border-2 px-3 py-2 min-w-[88px]",
                        NODE_COLORS[node.type],
                        node.status === "active" && "ring-2 ring-indigo-300 ai-glow-pulse"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <p className="mt-1 text-[10px] font-semibold text-center">{node.label}</p>
                    </motion.div>
                    {i < nodes.length - 1 && <div className="mx-0.5 h-px w-4 data-flow-line opacity-60" />}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
