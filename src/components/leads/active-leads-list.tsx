"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Filter, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatRelativeTime, getInitials, getScoreColor } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

interface LeadRow {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  status: string;
  aiScore: number;
  updatedAt: string;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "info" | "hot" | "default"> = {
  NURTURING: "warning",
  FOLLOW_UP: "info",
  ASSIGNED: "success",
  AI_CLASSIFIED: "info",
  HOT: "hot",
  WARM: "warning",
};

export function ActiveLeadsList() {
  const { selectedLeadId, setSelectedLeadId, setAddLeadDialogOpen } = useUiStore();
  const { data, isLoading } = useQuery<{ leads: LeadRow[]; total: number }>({
    queryKey: ["leads", "active"],
    queryFn: async () => {
      const res = await fetch("/api/leads?limit=8");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const leads = data?.leads || [];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <CardTitle>Active Leads</CardTitle>
          <Badge variant="default">{data?.total ?? 0}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-50">
            All Leads <ChevronDown className="h-3 w-3" />
          </button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAddLeadDialogOpen(true)} title="Add lead">
            <Plus className="h-4 w-4" />
          </Button>
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            title="No active leads"
            description="Add your first lead to start the AI pipeline."
            action={
              <Button size="sm" onClick={() => setAddLeadDialogOpen(true)}>
                <Plus className="mr-1 h-3 w-3" /> Add Lead
              </Button>
            }
          />
        ) : (
          <ul className="space-y-1">
            {leads.map((lead, i) => {
              const name = `${lead.firstName} ${lead.lastName}`;
              const selected = selectedLeadId === lead.id || (!selectedLeadId && i === 0);
              return (
                <motion.li
                  key={lead.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <button
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
                      selected ? "bg-indigo-50 ring-1 ring-indigo-100" : "hover:bg-slate-50"
                    )}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-[10px]">{getInitials(name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{name}</p>
                      <p className="truncate text-xs text-slate-500">{lead.company}</p>
                    </div>
                    <Badge variant={STATUS_VARIANT[lead.status] || "default"} className="shrink-0 text-[10px]">
                      {lead.status.replace(/_/g, " ")}
                    </Badge>
                    <span className={cn("shrink-0 text-sm font-bold", getScoreColor(lead.aiScore))}>
                      {lead.aiScore}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-400">
                      {formatRelativeTime(lead.updatedAt)}
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
        <Link
          href="/leads"
          className="mt-4 block text-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          View All Leads →
        </Link>
      </CardContent>
    </Card>
  );
}
