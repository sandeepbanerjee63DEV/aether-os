"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Network, Building2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DepartmentCard, type DepartmentCardData } from "@/components/team/departments/department-card";
import { AiRecommendationsPanel } from "@/components/team/overview/ai-recommendations-panel";
import type { Recommendation } from "@/components/team/shared/ai-recommendation-card";

const COLOR_MAP: Record<string, string> = {
  indigo: "#6366F1",
  purple: "#A855F7",
  amber: "#F59E0B",
  blue: "#3B82F6",
  emerald: "#10B981",
  rose: "#F43F5E",
};

export default function TeamDepartmentsPage() {
  const { data, isLoading } = useQuery<{ departments: DepartmentCardData[] }>({
    queryKey: ["team-departments"],
    queryFn: async () => {
      const res = await fetch("/api/team/departments");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 60000,
  });

  const { data: overview } = useQuery<{ recommendations: Recommendation[] }>({
    queryKey: ["team-overview"],
    queryFn: async () => {
      const res = await fetch("/api/team/overview");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const chartData = (data?.departments ?? []).map((d) => ({
    name: d.name,
    workload: d.avgWorkload,
    members: d.activeCount,
    color: COLOR_MAP[d.color] ?? COLOR_MAP.indigo,
  }));

  const deptRecs = (overview?.recommendations ?? []).filter(
    (r) => r.type === "DEPARTMENT_OVERLOAD" || r.type === "STAFFING_GAP"
  );

  return (
    <>
      <Navbar
        title="Departments"
        subtitle="Operational organization, workload distribution, and AI-staffed recommendations."
        badge="ORGANIZATION"
      />

      <div className="flex-1 space-y-5 px-4 pb-28 pt-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100/60 bg-gradient-to-r from-indigo-50/40 via-white to-purple-50/30 px-4 py-2.5 glass-card"
        >
          <Badge variant="purple" className="gap-1">
            <Network className="h-3 w-3" />
            Operational Organization
          </Badge>
          <span className="text-xs text-slate-500">
            Auto-balanced departments. AI flags overload and staffing gaps in real time.
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-500" />
                Workload by Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #E2E8F0",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="workload" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-white shadow-card" />
              ))
            : data?.departments.map((d) => <DepartmentCard key={d.id} dept={d} />)}
        </div>

        {deptRecs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <AiRecommendationsPanel recommendations={deptRecs} limit={6} />
          </motion.div>
        )}
      </div>
    </>
  );
}
