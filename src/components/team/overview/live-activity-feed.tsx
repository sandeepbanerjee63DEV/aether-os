"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Activity, UserPlus, Edit3, Trash2, GitBranch, KeyRound, Network, Mail, UserX, UserCheck, Layers, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "user-plus": UserPlus,
  edit: Edit3,
  trash: Trash2,
  "git-branch": GitBranch,
  "key-round": KeyRound,
  network: Network,
  mail: Mail,
  "user-x": UserX,
  "user-check": UserCheck,
  layers: Layers,
};

const COLOR_BG: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  red: "bg-rose-50 text-rose-600 ring-rose-100",
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  purple: "bg-purple-50 text-purple-600 ring-purple-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  slate: "bg-slate-50 text-slate-600 ring-slate-100",
};

interface FeedItem {
  id: string;
  action: string;
  icon: string;
  color: string;
  summary: string;
  actor: { id: string; name: string; avatar: string | null } | null;
  createdAt: string;
}

export function LiveActivityFeed({ limit = 12 }: { limit?: number }) {
  const { data, isLoading } = useQuery<{ items: FeedItem[] }>({
    queryKey: ["team-activity", limit],
    queryFn: async () => {
      const res = await fetch(`/api/team/activity?limit=${limit}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            Live Activity Feed
          </CardTitle>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 live-pulse" />
            LIVE
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-50" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <EmptyState title="Quiet workspace" description="Audit events will appear here as teams act." />
        ) : (
          <ul className="space-y-0.5">
            <AnimatePresence initial={false}>
              {data.items.map((item) => {
                const Icon = ICON_MAP[item.icon] ?? Circle;
                const c = COLOR_BG[item.color] ?? COLOR_BG.slate;
                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ${c}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-700">
                        {item.actor && (
                          <span className="font-semibold text-slate-900">{item.actor.name} </span>
                        )}
                        <span>{item.summary}</span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {formatRelativeTime(item.createdAt)}
                      </p>
                    </div>
                    {item.actor && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={item.actor.avatar || undefined} />
                        <AvatarFallback className="text-[10px]">{item.actor.name[0]}</AvatarFallback>
                      </Avatar>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
