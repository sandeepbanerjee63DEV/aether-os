"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Database, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { BusinessMemoryItem } from "@/types/operational-intelligence";

export function AiBusinessMemory() {
  const { data, isLoading } = useQuery<{ memory: BusinessMemoryItem[] }>({
    queryKey: ["business-memory"],
    queryFn: () => fetch("/api/intelligence/memory").then((r) => r.json()),
  });

  const memory = data?.memory ?? [];

  return (
    <Card className="h-full intelligence-hover">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4 text-purple-500" />
          AI Business Memory
        </CardTitle>
        <p className="text-[10px] text-slate-500">Patterns from your operational history</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : memory.length === 0 ? (
          <EmptyState title="No memory records" description="Insights will accumulate as you use the platform." />
        ) : (
          memory.map((mem, i) => (
            <motion.div
              key={mem.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-purple-100/60 bg-gradient-to-r from-purple-50/40 to-indigo-50/20 p-3"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{mem.insight}</p>
                  <p className="mt-1 text-xs text-slate-500">{mem.context}</p>
                  <Badge variant="purple" className="mt-2 text-[9px]">
                    {mem.confidence}% confidence
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
