import { ModulePage } from "@/components/shared/module-page";

export default function RiskIntelligencePage() {
  return (
    <ModulePage
      title="Risk Intelligence"
      subtitle="Identify and mitigate business risk in real time."
      features={["Risk Matrix", "Anomaly Detection", "Compliance Alerts", "Vendor Risk", "Financial Exposure", "Audit Hooks"]}
    />
  );
}
