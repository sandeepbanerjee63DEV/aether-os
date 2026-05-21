import type { Lead } from "@prisma/client";

export interface AiClassificationResult {
  classification: string;
  score: number;
  analysis: string;
  nextBestAction: string;
  convertProbability: number;
  tags: string[];
}

/** Mock AI engine — swap with OpenAI/Anthropic via AI_PROVIDER env */
export async function classifyLead(lead: Partial<Lead>): Promise<AiClassificationResult> {
  const signals: string[] = [];
  let score = 50;

  if (lead.source === "Website") {
    score += 15;
    signals.push("organic website inquiry");
  }
  if (lead.source === "Referral") {
    score += 20;
    signals.push("trusted referral source");
  }
  if (lead.value === "High") {
    score += 15;
    signals.push("high deal value segment");
  }
  if (lead.leadType?.toLowerCase().includes("demo")) {
    score += 10;
    signals.push("requested product demo");
  }

  score = Math.min(100, Math.max(0, score + Math.floor(Math.random() * 10) - 5));

  const classification =
    score >= 80 ? "High Intent" : score >= 60 ? "Qualified" : score >= 40 ? "Nurture" : "Low Priority";

  const analysis =
    score >= 80
      ? `High intent lead. ${signals.join(". ")}. Strong engagement signals detected.`
      : score >= 60
        ? `Moderate intent. ${signals.join(". ") || "Standard lead profile"}. Recommend scheduled follow-up.`
        : `Early-stage lead. Continue nurturing with automated sequences.`;

  const nextBestAction =
    score >= 80
      ? "Schedule a demo call"
      : score >= 60
        ? "Send personalized follow-up email"
        : "Add to nurture campaign";

  return {
    classification,
    score,
    analysis,
    nextBestAction,
    convertProbability: score * 0.95,
    tags: score >= 80 ? ["hot", "priority"] : score >= 60 ? ["warm"] : ["nurture"],
  };
}

export async function generateEmailDraft(leadName: string, context: string): Promise<string> {
  return `Hi ${leadName},\n\nThank you for your interest in AETHER OS. ${context}\n\nI'd love to schedule a brief call to understand your goals and show how our AI-powered CRM can accelerate your pipeline.\n\nBest regards,\nAETHER OS Team`;
}

export async function explainAnalytics(metric: string, value: number): Promise<string> {
  return `Your ${metric} of ${value}% is ${value > 10 ? "above" : "below"} industry average. AI recommends focusing on follow-up velocity and high-intent lead prioritization to improve conversion.`;
}

export async function chatResponse(query: string, context?: string): Promise<string> {
  const q = query.toLowerCase();
  if (q.includes("lead") && q.includes("score"))
    return "Lead scores are calculated using engagement signals, source quality, deal value, and behavioral patterns. Scores 80+ are Hot leads requiring immediate action.";
  if (q.includes("conversion") || q.includes("funnel"))
    return "Current funnel shows 11% end-to-end conversion. The largest drop-off is between AI Qualified and Follow-ups — consider automating follow-up sequences.";
  return `Based on your CRM data: ${context || "I can help with leads, deals, analytics, and workflow automation."} What would you like to explore?`;
}
