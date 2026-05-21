"use client";
import { Navbar } from "@/components/layout/navbar";
import { AiInsightsWidget } from "@/components/charts/ai-insights-widget";
export default function Page() {
  return (
    <>
      <Navbar title="AI Insights" subtitle="Actionable intelligence from your CRM data." />
      <div className="grid gap-5 px-4 pb-8 md:grid-cols-2 lg:px-6 lg:grid-cols-3">
        <AiInsightsWidget />
        <AiInsightsWidget />
        <AiInsightsWidget />
      </div>
    </>
  );
}
