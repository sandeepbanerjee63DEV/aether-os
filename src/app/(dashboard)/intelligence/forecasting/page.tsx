import { ModulePage } from "@/components/shared/module-page";

export default function ForecastingPage() {
  return (
    <ModulePage
      title="Forecasting Center"
      subtitle="Predictive forecasts across revenue, capacity, and demand."
      features={["Revenue Forecast", "Demand Planning", "Scenario Modeling", "Confidence Intervals", "AI Adjustments", "Snapshot History"]}
    />
  );
}
