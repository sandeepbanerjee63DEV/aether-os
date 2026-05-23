import { ModulePage } from "@/components/shared/module-page";

export default function OperationalIntelligencePage() {
  return (
    <ModulePage
      title="Operational Intelligence"
      subtitle="End-to-end operational health and SLA tracking."
      features={["SLA Dashboard", "Throughput Metrics", "Process KPIs", "Bottleneck Detection", "Incident Timeline", "Health Score"]}
    />
  );
}
