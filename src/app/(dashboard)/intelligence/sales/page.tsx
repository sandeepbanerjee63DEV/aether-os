import { ModulePage } from "@/components/shared/module-page";

export default function SalesIntelligencePage() {
  return (
    <ModulePage
      title="Sales Intelligence"
      subtitle="Deep deal analytics and rep-level coaching insights."
      features={["Deal Quality Score", "Conversion Funnel", "Activity Heatmap", "Top Performers", "AI Coaching", "Quota Pace"]}
    />
  );
}
