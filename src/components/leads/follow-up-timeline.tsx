"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Globe, Brain, User, Mail, Phone, Calendar, CheckCircle2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  globe: Globe,
  brain: Brain,
  user: User,
  mail: Mail,
  phone: Phone,
  calendar: Calendar,
  check: CheckCircle2,
  sparkles: Sparkles,
};

const COLOR_MAP: Record<string, string> = {
  purple: "bg-purple-100 text-purple-600",
  blue: "bg-blue-100 text-blue-600",
  green: "bg-emerald-100 text-emerald-600",
  yellow: "bg-amber-100 text-amber-600",
  orange: "bg-orange-100 text-orange-600",
};

interface TimelineItem {
  id: string;
  title: string;
  description?: string | null;
  icon: string;
  color: string;
  createdAt: string;
}

export function FollowUpTimeline() {
  const { selectedLeadId } = useUiStore();
  const { data, isLoading } = useQuery<{ timeline: TimelineItem[] }>({
    queryKey: ["timeline", selectedLeadId],
    queryFn: async () => {
      if (!selectedLeadId) return { timeline: [] };
      const res = await fetch(`/api/leads/${selectedLeadId}/timeline`);
      return res.json();
    },
    enabled: !!selectedLeadId,
  });

  const events = data?.timeline || [];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Follow-up Timeline</CardTitle>
        <Link href="/leads" className="text-xs font-medium text-indigo-600 hover:underline">
          View All →
        </Link>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !selectedLeadId ? (
          <EmptyState title="No lead selected" description="Select a lead to view its timeline." />
        ) : events.length === 0 ? (
          <EmptyState title="No timeline events" description="Activity will appear as the lead progresses." />
        ) : (
          <ul className="relative space-y-0">
            {events.map((event, i) => {
              const Icon = ICON_MAP[event.icon] || Globe;
              return (
                <li key={event.id} className="relative flex gap-3 pb-6 last:pb-0">
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
