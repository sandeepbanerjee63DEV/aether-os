"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, getInitials } from "@/lib/utils";
import type { TeamMemberIntel } from "@/types/operational-intelligence";

const STATUS_COLORS = {
  optimal: "bg-emerald-100 text-emerald-700",
  loaded: "bg-amber-100 text-amber-700",
  overloaded: "bg-red-100 text-red-700",
};

export function TeamIntelligencePanel() {
  const { data, isLoading } = useQuery<{ members: TeamMemberIntel[]; suggestion?: string | null }>({
    queryKey: ["team-intelligence"],
    queryFn: () => fetch("/api/intelligence/team").then((r) => r.json()),
  });

  const members = data?.members ?? [];
  const overloaded = members.filter((t) => t.status === "overloaded");

  return (
    <Card className="h-full intelligence-hover">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-indigo-500" />
            Team Intelligence
          </CardTitle>
          {overloaded.length > 0 && (
            <Badge variant="warning" className="gap-1 text-[10px]">
              <AlertTriangle className="h-3 w-3" />
              {overloaded.length} alert
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : members.length === 0 ? (
          <EmptyState
            title="No team data"
            description={data?.suggestion || "Add users to your organization to see workload insights."}
          />
        ) : (
          members.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-slate-100 p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-[10px]">{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_COLORS[member.status])}>
                      {member.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {member.role} · {member.activeLeads} leads
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-[10px] text-slate-400">Workload {member.workload}%</p>
                <Progress
                  value={member.workload}
                  className="mt-0.5 h-1.5"
                  indicatorClassName={member.workload > 85 ? "bg-red-500" : "bg-emerald-500"}
                />
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
