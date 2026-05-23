"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface GrowthPoint {
  label: string;
  total: number;
  active: number;
}

export function GrowthChart({ data }: { data: GrowthPoint[] }) {
  const latest = data.at(-1);
  const earliest = data[0];
  const diff = latest && earliest ? latest.total - earliest.total : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            Workforce Growth
          </CardTitle>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">6-month change</p>
            <p className={`text-sm font-bold ${diff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {diff >= 0 ? "+" : ""}
              {diff} members
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E2E8F0",
                  fontSize: 12,
                  boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                }}
              />
              <Area type="monotone" dataKey="total" stroke="#6366F1" strokeWidth={2} fill="url(#totalGrad)" name="Total" />
              <Area type="monotone" dataKey="active" stroke="#A855F7" strokeWidth={2} fill="url(#activeGrad)" name="Active" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" /> Total
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-500" /> Active
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
