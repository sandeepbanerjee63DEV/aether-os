import { ModulePage } from "@/components/shared/module-page";

export default function RevenueIntelligencePage() {
  return (
    <ModulePage
      title="Revenue Intelligence"
      subtitle="Pipeline, ARR, and revenue health in one view."
      features={["ARR Tracker", "Pipeline Velocity", "Win/Loss Analysis", "Cohort Revenue", "Churn Signals", "Forecast"]}
    />
  );
}
