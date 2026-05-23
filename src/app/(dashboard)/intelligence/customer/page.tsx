import { ModulePage } from "@/components/shared/module-page";

export default function CustomerIntelligencePage() {
  return (
    <ModulePage
      title="Customer Intelligence"
      subtitle="360° view of every customer with AI-derived signals."
      features={["Health Score", "Sentiment", "Usage Patterns", "Expansion Signals", "Churn Risk", "NPS"]}
    />
  );
}
