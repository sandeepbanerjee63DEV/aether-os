"use client";

import { Brain, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AiRecommendationCard, type Recommendation } from "../shared/ai-recommendation-card";

interface AiRecommendationsPanelProps {
  recommendations: Recommendation[];
  limit?: number;
}

export function AiRecommendationsPanel({ recommendations, limit = 5 }: AiRecommendationsPanelProps) {
  const items = recommendations.slice(0, limit);
  return (
    <Card className="h-full ai-glow border-indigo-100/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-indigo-500" />
            AI Operational Intelligence
          </CardTitle>
          <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-100">
            <Sparkles className="h-3 w-3" />
            {recommendations.length} signal{recommendations.length === 1 ? "" : "s"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            title="No active recommendations"
            description="AI continuously monitors workforce signals. Recommendations appear here when actionable patterns emerge."
          />
        ) : (
          <div className="space-y-2.5">
            {items.map((r) => (
              <AiRecommendationCard key={r.id} rec={r} compact />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
