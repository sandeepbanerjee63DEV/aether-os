"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  ChevronDown,
  Plus,
  Search,
  X,
  Check,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  cn,
  formatRelativeTime,
  getInitials,
  getScoreColor,
} from "@/lib/utils";
import {
  useUiStore,
  type LeadSort,
  type LeadStatusFilter,
} from "@/stores/ui-store";
import { Sparkles, UserCog } from "lucide-react";

interface LeadRow {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  company: string;
  status: string;
  aiScore: number;
  convertProbability?: number;
  updatedAt: string;
  ownerId?: string | null;
  owner?: { id: string; name: string; avatar: string | null; role: string } | null;
  assignmentType?: string;
  operationalStatus?: string;
}

const STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "info" | "hot" | "default"
> = {
  NURTURING: "warning",
  FOLLOW_UP: "info",
  ASSIGNED: "success",
  AI_CLASSIFIED: "info",
  HOT: "hot",
  WARM: "warning",
};

const STATUS_FILTERS: { id: LeadStatusFilter; label: string }[] = [
  { id: "ALL", label: "All Leads" },
  { id: "HOT", label: "Hot" },
  { id: "WARM", label: "Warm" },
  { id: "AI_CLASSIFIED", label: "AI Classified" },
  { id: "ASSIGNED", label: "Assigned" },
  { id: "FOLLOW_UP", label: "Follow-up" },
  { id: "NURTURING", label: "Nurturing" },
];

const SORT_OPTIONS: { id: LeadSort; label: string }[] = [
  { id: "recent", label: "Most recent" },
  { id: "score", label: "Highest AI score" },
  { id: "probability", label: "Highest probability" },
  { id: "name", label: "Name A → Z" },
];

export function ActiveLeadsList() {
  const {
    selectedLeadId,
    setSelectedLeadId,
    setAddLeadDialogOpen,
    leadStatusFilter,
    setLeadStatusFilter,
    leadSearch,
    setLeadSearch,
    leadSort,
    setLeadSort,
    leadMinScore,
    setLeadMinScore,
    resetLeadFilters,
  } = useUiStore();

  const { data, isLoading } = useQuery<{ leads: LeadRow[]; total: number }>({
    queryKey: ["leads", "active"],
    queryFn: async () => {
      const res = await fetch("/api/leads?limit=50");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const [statusOpen, setStatusOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statusOpen && !filterOpen) return;
    function handleClick(e: MouseEvent) {
      if (statusOpen && statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
      if (filterOpen && filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [statusOpen, filterOpen]);

  const allLeads = useMemo(() => data?.leads ?? [], [data?.leads]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: allLeads.length };
    for (const l of allLeads) {
      map[l.status] = (map[l.status] || 0) + 1;
    }
    return map;
  }, [allLeads]);

  const visibleLeads = useMemo(() => {
    let next = [...allLeads];
    if (leadStatusFilter !== "ALL") {
      next = next.filter((l) => l.status === leadStatusFilter);
    }
    if (leadMinScore > 0) {
      next = next.filter((l) => l.aiScore >= leadMinScore);
    }
    if (leadSearch.trim()) {
      const q = leadSearch.trim().toLowerCase();
      next = next.filter(
        (l) =>
          `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          (l.email || "").toLowerCase().includes(q)
      );
    }
    switch (leadSort) {
      case "score":
        next.sort((a, b) => b.aiScore - a.aiScore);
        break;
      case "probability":
        next.sort(
          (a, b) =>
            (b.convertProbability ?? b.aiScore * 0.95) -
            (a.convertProbability ?? a.aiScore * 0.95)
        );
        break;
      case "name":
        next.sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        );
        break;
      case "recent":
      default:
        next.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    }
    return next;
  }, [allLeads, leadStatusFilter, leadMinScore, leadSearch, leadSort]);

  const activeStatus =
    STATUS_FILTERS.find((s) => s.id === leadStatusFilter) ?? STATUS_FILTERS[0];

  const hasActiveFilters =
    leadStatusFilter !== "ALL" ||
    leadSearch.trim() !== "" ||
    leadMinScore > 0 ||
    leadSort !== "recent";

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <CardTitle>Active Leads</CardTitle>
          <Badge variant="default">{visibleLeads.length}</Badge>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetLeadFilters}
              className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 hover:bg-indigo-100"
              title="Clear all filters"
            >
              <X className="h-2.5 w-2.5" /> Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="relative" ref={statusRef}>
            <button
              type="button"
              onClick={() => {
                setStatusOpen((o) => !o);
                setFilterOpen(false);
              }}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors",
                leadStatusFilter !== "ALL"
                  ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  : "text-slate-500 hover:bg-slate-50"
              )}
              aria-haspopup="menu"
              aria-expanded={statusOpen}
            >
              {activeStatus.label}
              <ChevronDown className="h-3 w-3" />
            </button>

            <AnimatePresence>
              {statusOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  role="menu"
                  className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl"
                >
                  <ul className="py-1">
                    {STATUS_FILTERS.map((opt) => {
                      const active = leadStatusFilter === opt.id;
                      const count = counts[opt.id] ?? 0;
                      return (
                        <li key={opt.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setLeadStatusFilter(opt.id);
                              setStatusOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors",
                              active
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-slate-700 hover:bg-slate-50"
                            )}
                            role="menuitemradio"
                            aria-checked={active}
                          >
                            <span className="flex items-center gap-2">
                              {active ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <span className="h-3.5 w-3.5" />
                              )}
                              {opt.label}
                            </span>
                            <span className="text-[11px] text-slate-400">{count}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setAddLeadDialogOpen(true)}
            title="Add lead"
          >
            <Plus className="h-4 w-4" />
          </Button>

          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => {
                setFilterOpen((o) => !o);
                setStatusOpen(false);
              }}
              className={cn(
                "rounded-lg p-1.5 transition-colors",
                hasActiveFilters
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-400 hover:bg-slate-50"
              )}
              title="Filter & sort"
              aria-haspopup="menu"
              aria-expanded={filterOpen}
            >
              <Filter className="h-4 w-4" />
            </button>

            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  role="menu"
                  className="absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-xl"
                >
                  <div className="space-y-3">
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Search
                      </p>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={leadSearch}
                          onChange={(e) => setLeadSearch(e.target.value)}
                          placeholder="Name, company, email"
                          className="h-9 pl-8 text-sm"
                        />
                        {leadSearch && (
                          <button
                            type="button"
                            onClick={() => setLeadSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100"
                            aria-label="Clear search"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <ArrowUpDown className="h-3 w-3" /> Sort by
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {SORT_OPTIONS.map((opt) => {
                          const active = leadSort === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setLeadSort(opt.id)}
                              className={cn(
                                "rounded-lg border px-2 py-1.5 text-left text-xs transition-colors",
                                active
                                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                                  : "border-slate-100 bg-white text-slate-600 hover:bg-slate-50"
                              )}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-[11px]">
                        <p className="font-semibold uppercase tracking-wide text-slate-500">
                          Min AI score
                        </p>
                        <span className="font-bold text-indigo-600">
                          {leadMinScore}+
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={leadMinScore}
                        onChange={(e) => setLeadMinScore(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>

                    <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
                      <button
                        type="button"
                        onClick={resetLeadFilters}
                        className="text-xs font-medium text-slate-500 hover:text-slate-700"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterOpen(false)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : allLeads.length === 0 ? (
          <EmptyState
            title="No active leads"
            description="Add your first lead to start the AI pipeline."
            action={
              <Button size="sm" onClick={() => setAddLeadDialogOpen(true)}>
                <Plus className="mr-1 h-3 w-3" /> Add Lead
              </Button>
            }
          />
        ) : visibleLeads.length === 0 ? (
          <EmptyState
            title="No leads match your filters"
            description="Try clearing filters or broadening your search."
            action={
              <Button size="sm" variant="secondary" onClick={resetLeadFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <ul className="space-y-1">
            {visibleLeads.map((lead, i) => {
              const name = `${lead.firstName} ${lead.lastName}`;
              const selected =
                selectedLeadId === lead.id || (!selectedLeadId && i === 0);
              return (
                <motion.li
                  key={lead.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i, 6) * 0.04 }}
                >
                  <button
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
                      selected
                        ? "bg-indigo-50 ring-1 ring-indigo-100"
                        : "hover:bg-slate-50"
                    )}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-[10px]">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {name}
                      </p>
                      <p className="truncate text-xs text-slate-500">{lead.company}</p>
                    </div>
                    {lead.owner ? (
                      <div
                        className="relative flex shrink-0 items-center"
                        title={`Owned by ${lead.owner.name}${lead.assignmentType ? ` · ${lead.assignmentType === "AI" ? "AI Engine" : lead.assignmentType === "REASSIGNED" ? "Reassigned" : lead.assignmentType.replace(/_/g, " ")}` : ""}`}
                      >
                        <Avatar className="h-6 w-6 ring-2 ring-white">
                          <AvatarImage src={lead.owner.avatar || undefined} />
                          <AvatarFallback className="text-[9px]">
                            {getInitials(lead.owner.name)}
                          </AvatarFallback>
                        </Avatar>
                        {lead.assignmentType === "AI" && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 ring-1 ring-white">
                            <Sparkles className="h-1.5 w-1.5 text-white" />
                          </span>
                        )}
                        {lead.assignmentType === "MANUAL" && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-slate-700 ring-1 ring-white">
                            <UserCog className="h-1.5 w-1.5 text-white" />
                          </span>
                        )}
                      </div>
                    ) : (
                      <span
                        className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-amber-600"
                        title="Unassigned"
                      >
                        unassigned
                      </span>
                    )}
                    <Badge
                      variant={STATUS_VARIANT[lead.status] || "default"}
                      className="shrink-0 text-[10px]"
                    >
                      {lead.status.replace(/_/g, " ")}
                    </Badge>
                    <span
                      className={cn(
                        "shrink-0 text-sm font-bold",
                        getScoreColor(lead.aiScore)
                      )}
                    >
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
