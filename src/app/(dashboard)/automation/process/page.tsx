import { ModulePage } from "@/components/shared/module-page";

export default function ProcessAutomationPage() {
  return (
    <ModulePage
      title="Process Automation"
      subtitle="Multi-step business processes orchestrated end to end."
      features={["Process Catalog", "Step Designer", "SLA Tracking", "Human-in-the-loop", "Versioning", "Analytics"]}
    />
  );
}
