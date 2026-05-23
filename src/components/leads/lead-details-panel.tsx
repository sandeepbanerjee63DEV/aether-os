"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Flame,
  MoreHorizontal,
  Globe,
  Mail,
  Phone,
  ExternalLink,
  Calendar,
  Sprout,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getInitials } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { AiReasoningLayer } from "@/components/intelligence/ai-reasoning-layer";

interface LeadDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  company: string;
  website?: string | null;
  source: string;
  leadType?: string | null;
  value: string;
  location?: string | null;
  aiScore: number;
  aiAnalysis?: string | null;
  nextBestAction?: string | null;
  convertProbability: number;
  aiClassification?: string | null;
}

type ActionType = "EMAIL" | "CALL" | "DEMO" | "NURTURE" | "DONE" | "REGENERATE";

interface ActionOption {
  id: Exclude<ActionType, "REGENERATE">;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}

const ACTION_OPTIONS: ActionOption[] = [
  {
    id: "EMAIL",
    label: "Send follow-up email",
    description: "Trigger a personalized outreach",
    icon: Mail,
    tone: "text-amber-600",
  },
  {
    id: "CALL",
    label: "Schedule discovery call",
    description: "Book a qualification call",
    icon: Phone,
    tone: "text-orange-600",
  },
  {
    id: "DEMO",
    label: "Schedule product demo",
    description: "Send a demo invitation",
    icon: Calendar,
    tone: "text-purple-600",
  },
  {
    id: "NURTURE",
    label: "Add to nurture campaign",
    description: "Route to long-cycle sequence",
    icon: Sprout,
    tone: "text-blue-600",
  },
  {
    id: "DONE",
    label: "Mark action complete",
    description: "Log as done and refresh",
    icon: CheckCircle2,
    tone: "text-emerald-600",
  },
];

interface RecentAction {
  type: Exclude<ActionType, "REGENERATE">;
  label: string;
  at: number;
}

export function LeadDetailsPanel() {
  const { selectedLeadId } = useUiStore();
  const queryClient = useQueryClient();

  const { data: lead, isLoading } = useQuery<LeadDetail>({
    queryKey: ["lead-detail", selectedLeadId],
    queryFn: async () => {
      if (selectedLeadId) {
        const res = await fetch(`/api/leads/${selectedLeadId}`);
        const json = await res.json();
        return json.lead || json;
      }
      const res = await fetch("/api/leads?limit=1");
      const json = await res.json();
      return json.leads[0];
    },
  });

  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [recentAction, setRecentAction] = useState<RecentAction | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!actionMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [actionMenuOpen]);

  useEffect(() => {
    setRecentAction(null);
  }, [selectedLeadId]);

  const actionMutation = useMutation({
    mutationFn: async (action: ActionType) => {
      if (!lead) throw new Error("No lead selected");
      const res = await fetch(`/api/leads/${lead.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Action failed");
      }
      return { action, payload: await res.json() };
    },
    onSuccess: ({ action }) => {
      queryClient.invalidateQueries({ queryKey: ["lead-detail", selectedLeadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["timeline", selectedLeadId] });
      if (action !== "REGENERATE") {
        const opt = ACTION_OPTIONS.find((o) => o.id === action);
        if (opt) {
          setRecentAction({ type: opt.id, label: opt.label, at: Date.now() });
        }
      }
      setPendingAction(null);
      setActionMenuOpen(false);
    },
    onError: () => {
      setPendingAction(null);
    },
  });

  const runAction = (action: ActionType) => {
    if (actionMutation.isPending) return;
    setPendingAction(action);
    actionMutation.mutate(action);
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!lead) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full min-h-[320px] items-center justify-center p-6">
          <p className="text-center text-sm text-slate-500">
            Select a lead or add one to view AI-powered details.
          </p>
        </CardContent>
      </Card>
    );
  }

  const name = `${lead.firstName} ${lead.lastName}`;
  const prob = Math.round(lead.convertProbability || lead.aiScore * 0.95);
  const isRegenerating = actionMutation.isPending && pendingAction === "REGENERATE";

  return (
    <Card className="h-full border-indigo-100/50">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Lead Details</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="ai-glow-pulse gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 live-pulse" />
            AI Score {lead.aiScore}
          </Badge>
          <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-50">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{name}</h2>
              <Badge variant="hot" className="gap-1">
                <Flame className="h-3 w-3" /> Hot Lead
              </Badge>
            </div>
            <p className="text-sm text-slate-600">{lead.company}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {lead.email}
              </span>
              {lead.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </span>
              )}
              {lead.website && (
                <a
                  href={`https://${lead.website}`}
                  className="flex items-center gap-1 text-indigo-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {lead.website}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Source", value: lead.source },
            { label: "Lead Type", value: lead.leadType || "—" },
            { label: "Value", value: lead.value },
            { label: "Location", value: lead.location || "—" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                {item.label}
              </p>
              <p className="text-sm font-semibold text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>

        <AiReasoningLayer
          aiScore={lead.aiScore}
          aiAnalysis={lead.aiAnalysis}
          convertProbability={lead.convertProbability}
          aiClassification={lead.aiClassification}
        />

        {lead.aiAnalysis && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Globe className="h-3.5 w-3.5 text-indigo-500" /> Behavioral summary
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{lead.aiAnalysis}</p>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-500">Probability to convert</span>
                <span className="font-bold text-emerald-600">{prob}%</span>
              </div>
              <Progress value={prob} />
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-indigo-600">
                <Sparkles className="h-3 w-3" /> Next Best Action
              </p>
              <p className="mt-1 break-words font-semibold text-slate-900">
                {lead.nextBestAction || "No suggestion yet — regenerate to get one"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => runAction("REGENERATE")}
              disabled={actionMutation.isPending}
              className="shrink-0 rounded-lg p-1.5 text-indigo-500 hover:bg-white/70 disabled:opacity-50"
              title="Regenerate AI suggestion"
              aria-label="Regenerate AI suggestion"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isRegenerating && "animate-spin")}
              />
            </button>
          </div>

          <AnimatePresence>
            {recentAction && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {recentAction.label.toLowerCase().startsWith("mark")
                  ? "Action marked complete · AI refreshed"
                  : `Done — ${recentAction.label.toLowerCase()}`}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative mt-3" ref={menuRef}>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setActionMenuOpen((o) => !o)}
                disabled={actionMutation.isPending}
                aria-haspopup="menu"
                aria-expanded={actionMenuOpen}
              >
                {actionMutation.isPending && pendingAction !== "REGENERATE" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Working...
                  </>
                ) : (
                  <>
                    Take Action
                    <ChevronDown className="h-3 w-3 opacity-80" />
                  </>
                )}
              </Button>
              {actionMutation.isError && (
                <span className="text-xs text-red-600">
                  {actionMutation.error instanceof Error
                    ? actionMutation.error.message
                    : "Action failed"}
                </span>
              )}
            </div>

            <AnimatePresence>
              {actionMenuOpen && !actionMutation.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  role="menu"
                  className="absolute left-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl"
                >
                  <ul className="py-1">
                    {ACTION_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <li key={opt.id}>
                          <button
                            type="button"
                            onClick={() => runAction(opt.id)}
                            className="flex w-full items-start gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                            role="menuitem"
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50",
                                opt.tone
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="min-w-0">
                              <p className="text-sm font-medium text-slate-800">
                                {opt.label}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {opt.description}
                              </p>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
