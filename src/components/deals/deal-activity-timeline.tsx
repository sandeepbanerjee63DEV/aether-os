"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Brain,
  Calendar,
  Mail,
  Phone,
  TrendingUp,
  Circle,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  brain: Brain,
  calendar: Calendar,
  mail: Mail,
  phone: Phone,
  "trending-up": TrendingUp,
  circle: Circle,
  "file-text": FileText,
  "check-circle": CheckCircle2,
};

const COLOR_MAP: Record<string, string> = {
  purple: "bg-purple-100 text-purple-600",
  blue: "bg-blue-100 text-blue-600",
  green: "bg-emerald-100 text-emerald-600",
  yellow: "bg-amber-100 text-amber-600",
  orange: "bg-orange-100 text-orange-600",
  red: "bg-red-100 text-red-600",
};

interface ActivityItem {
  id: string;
  title: string;
  description?: string | null;
  icon: string;
  color: string;
  createdAt: string;
}

export function DealActivityTimeline() {
  const { selectedDealId } = useUiStore();
  const { data, isLoading } = useQuery<{ activity: ActivityItem[] }>({
    queryKey: ["deal-activity", selectedDealId],
    queryFn: async () => {
      if (!selectedDealId) return { activity: [] };
      const res = await fetch(`/api/deals/${selectedDealId}/activity`);
      return res.json();
    },
    enabled: !!selectedDealId,
  });

  const events = data?.activity || [];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Deal Activity</CardTitle>
        <span className="text-xs font-medium text-slate-400">
          {events.length} event{events.length === 1 ? "" : "s"}
        </span>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !selectedDealId ? (
          <EmptyState
            title="No deal selected"
            description="Select a deal from the pipeline to view its activity."
          />
        ) : events.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Stage moves, notes, and meetings will appear here."
          />
        ) : (
          <ul className="relative space-y-0">
            {events.map((event, i) => {
              const Icon = ICON_MAP[event.icon] || Circle;
              return (
                <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < events.length - 1 && (
                    <span className="absolute left-[17px] top-9 h-full w-px bg-slate-200" />
                  )}
                  <div
                    className={cn(
                      "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      COLOR_MAP[event.color] || COLOR_MAP.purple
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-medium text-slate-800">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-slate-500">{event.description}</p>
                    )}
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {new Date(event.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                      {" · "}
                      {new Date(event.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
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
