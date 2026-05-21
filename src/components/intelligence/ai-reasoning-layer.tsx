"use client";

import { Brain, TrendingUp, Eye, Calendar, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AiReasoningLayerProps {
  aiScore: number;
  aiAnalysis?: string | null;
  convertProbability?: number;
  aiClassification?: string | null;
}

export function AiReasoningLayer({
  aiScore,
  aiAnalysis,
  convertProbability,
  aiClassification,
}: AiReasoningLayerProps) {
  const confidence = Math.min(99, Math.max(50, aiScore));
  const prob = Math.round(convertProbability ?? aiScore * 0.95);

  const signals = [
    {
      label: "AI Classification",
      delta: aiClassification || "—",
      detail: aiAnalysis || "Based on lead profile and engagement signals",
    },
    {
      label: "Intent",
      delta: aiScore >= 80 ? "High" : aiScore >= 60 ? "Medium" : "Low",
      detail: `Score derived from source, value, and behavioral inputs`,
    },
  ];

  return (
    <div className="space-y-3 rounded-xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/20 p-4 ai-glow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Explainable AI</p>
            <p className="text-sm font-semibold text-slate-800">Score {aiScore}</p>
          </div>
        </div>
        <Badge variant="purple" className="gap-1">
          <Activity className="h-3 w-3" />
          {confidence}% confidence
        </Badge>
      </div>

      <ul className="space-y-2">
        {signals.map((signal) => (
          <li
            key={signal.label}
            className="flex items-start gap-2 rounded-lg border border-slate-100/80 bg-white/80 px-3 py-2"
          >
            <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">{signal.label}</span>
                <span className="text-xs font-bold text-emerald-600">{signal.delta}</span>
              </div>
              <p className="text-[11px] text-slate-500">{signal.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-slate-100 bg-white/80 px-3 py-2">
          <p className="flex items-center gap-1 text-[10px] text-slate-400">
            <Eye className="h-3 w-3" /> Intent
          </p>
          <p className="text-sm font-bold text-slate-800">{aiClassification || "Pending"}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white/80 px-3 py-2">
          <p className="flex items-center gap-1 text-[10px] text-slate-400">
            <Calendar className="h-3 w-3" /> Convert probability
          </p>
          <p className="text-sm font-bold text-emerald-600">{prob}%</p>
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-[10px]">
          <span className="text-slate-500">AI model confidence</span>
          <span className="font-bold text-indigo-600">{confidence}%</span>
        </div>
        <Progress value={confidence} indicatorClassName="bg-gradient-to-r from-indigo-500 to-purple-500" />
      </div>
    </div>
  );
}
