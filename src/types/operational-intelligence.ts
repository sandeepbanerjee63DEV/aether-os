export type FeedSeverity = "critical" | "warning" | "info" | "success" | "ai";

export interface OperationalFeedItem {
  id: string;
  message: string;
  summary?: string;
  severity: FeedSeverity;
  category: string;
  timestamp: string;
  aiGenerated?: boolean;
  recommendation?: string;
  metric?: { label: string; value: string; trend?: "up" | "down" };
}

export interface PredictiveMetric {
  id: string;
  label: string;
  value: string;
  confidence: number;
  trend: "up" | "down" | "stable";
  risk?: boolean;
  forecast?: string;
}

export interface BusinessMemoryItem {
  id: string;
  insight: string;
  context: string;
  confidence: number;
  similarPattern?: string;
}

export interface TeamMemberIntel {
  id: string;
  name: string;
  role: string;
  workload: number;
  burnoutRisk: "low" | "medium" | "high";
  productivity: number;
  activeLeads: number;
  status: "optimal" | "loaded" | "overloaded";
}

export interface AutomationNode {
  id: string;
  type: "trigger" | "ai" | "action" | "notify" | "assign" | "escalate";
  label: string;
  status: "active" | "pending" | "complete";
}

export const WORKFLOW_INTELLIGENCE = [
  { step: 1, signal: "live", automation: "Webhook ingest", aiIntervention: false, branch: null, prediction: "Capture rate" },
  { step: 2, signal: "ai-active", automation: "AI classify", aiIntervention: true, branch: "High / Low intent", prediction: "Auto score" },
  { step: 3, signal: "active", automation: "Owner assignment", aiIntervention: true, branch: "Skill-based route", prediction: "Optimal match" },
  { step: 4, signal: "scheduled", automation: "Follow-up sequence", aiIntervention: true, branch: "Email / Call path", prediction: "Best window" },
  { step: 5, signal: "monitoring", automation: "Engagement tracker", aiIntervention: true, branch: "Re-engage if cold", prediction: "Nurture uplift" },
  { step: 6, signal: "forecast", automation: "Win notification", aiIntervention: false, branch: "Client onboarding", prediction: "Funnel close" },
];
