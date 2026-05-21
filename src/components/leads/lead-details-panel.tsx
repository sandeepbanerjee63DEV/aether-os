"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Flame, MoreHorizontal, Globe, Mail, Phone, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/utils";
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

export function LeadDetailsPanel() {
  const { selectedLeadId } = useUiStore();
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

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
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
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>
              {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
              {lead.website && (
                <a href={`https://${lead.website}`} className="flex items-center gap-1 text-indigo-600 hover:underline">
                  <ExternalLink className="h-3 w-3" />{lead.website}
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
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{item.label}</p>
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
          className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-4"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">Next Best Action</p>
          <p className="mt-1 font-semibold text-slate-900">{lead.nextBestAction || "—"}</p>
          <Button className="mt-3" size="sm">Take Action</Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}
