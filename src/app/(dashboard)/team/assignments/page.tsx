"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { GitBranch, BrainCircuit } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { AssignmentsTable } from "@/components/team/assignments/assignments-table";
import { AssignmentHistory } from "@/components/team/assignments/assignment-history";
import { AiRoutingCard } from "@/components/team/assignments/ai-routing-card";
import { useRealtime } from "@/hooks/use-realtime";

interface Candidate {
  id: string;
  name: string;
  avatar: string | null;
  score: number;
  reason: string;
}

interface AssignmentsResponse {
  aiCandidates: Record<string, Candidate[]>;
}

export default function TeamAssignmentsPage() {
  useRealtime("team");

  const { data } = useQuery<AssignmentsResponse>({
    queryKey: ["team-assignments-ai"],
    queryFn: async () => {
      const res = await fetch("/api/team/assignments");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const aiCandidates = data?.aiCandidates ?? {};
  const entityTypes = ["LEAD", "DEAL", "TASK", "SUPPORT_TICKET"];

  return (
    <>
      <Navbar
        title="Assignments"
        subtitle="Operational ownership management. AI routes work to the best-fit owner in real time."
        badge="AI ROUTING"
      />

      <div className="flex-1 space-y-5 px-4 pb-28 pt-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100/60 bg-gradient-to-r from-indigo-50/40 via-white to-purple-50/30 px-4 py-2.5 glass-card"
        >
          <Badge variant="purple" className="gap-1">
            <BrainCircuit className="h-3 w-3" />
            AI Routing Engine
          </Badge>
          <span className="text-xs text-slate-500">
            Workload-aware suggestions, escalation tracking, and round-robin balancing.
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {entityTypes.map((t) =>
              aiCandidates[t] && aiCandidates[t].length > 0 ? (
                <AiRoutingCard key={t} entityType={t} candidates={aiCandidates[t]} />
              ) : null
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <motion.div className="xl:col-span-8" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <AssignmentsTable />
          </motion.div>
          <motion.div className="xl:col-span-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <AssignmentHistory />
          </motion.div>
        </div>
      </div>
    </>
  );
}

void GitBranch;
