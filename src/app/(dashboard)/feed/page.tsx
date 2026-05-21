"use client";

import { Navbar } from "@/components/layout/navbar";
import { AiOperationalFeed } from "@/components/intelligence/ai-operational-feed";
import { PredictiveOperationsPanel } from "@/components/intelligence/predictive-operations-panel";
import { TeamIntelligencePanel } from "@/components/intelligence/team-intelligence-panel";
import { AutomationVisibility } from "@/components/intelligence/automation-visibility";
import { AiBusinessMemory } from "@/components/intelligence/ai-business-memory";

export default function FeedPage() {
  return (
    <>
      <Navbar
        title="Operational Feed"
        subtitle="Real-time AI intelligence stream across your business operations."
        badge="LIVE MONITORING"
      />
      <div className="grid flex-1 gap-5 px-4 pb-8 lg:grid-cols-12 lg:px-6">
        <div className="lg:col-span-8">
          <AiOperationalFeed />
        </div>
        <div className="space-y-5 lg:col-span-4">
          <AutomationVisibility />
          <PredictiveOperationsPanel />
        </div>
        <div className="lg:col-span-6">
          <TeamIntelligencePanel />
        </div>
        <div className="lg:col-span-6">
          <AiBusinessMemory />
        </div>
      </div>
    </>
  );
}
