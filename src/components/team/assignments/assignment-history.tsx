"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { GitBranch, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";

interface HistoryItem {
  id: string;
  summary: string;
  action: string;
  actor: { id: string; name: string; avatar: string | null } | null;
  target: { id: string; name: string; avatar: string | null } | null;
  createdAt: string;
}

export function AssignmentHistory() {
  const { data, isLoading } = useQuery<{ items: HistoryItem[] }>({
    queryKey: ["team-assignment-history"],
    queryFn: async () => {
      const res = await fetch("/api/team/assignments/history?limit=20");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 60000,
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4 text-indigo-500" />
          Assignment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-50" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <EmptyState title="No history yet" description="Reassignments and escalations appear here." />
        ) : (
          <ol className="relative space-y-0">
            {data.items.map((item, i) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.2) }}
                className="relative flex gap-3 pb-4 last:pb-0"
              >
                {i < data.items.length - 1 && (
                  <span className="absolute left-[10px] top-7 h-full w-px bg-gradient-to-b from-indigo-200 via-slate-200 to-transparent" />
                )}
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 ring-4 ring-white">
                  <GitBranch className="h-2.5 w-2.5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-700">{item.summary}</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                    {item.actor && (
                      <>
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={item.actor.avatar || undefined} />
                          <AvatarFallback className="text-[7px]">{item.actor.name[0]}</AvatarFallback>
                        </Avatar>
                        <span>{item.actor.name}</span>
                        <span>·</span>
                      </>
                    )}
                    <span>{formatRelativeTime(item.createdAt)}</span>
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
