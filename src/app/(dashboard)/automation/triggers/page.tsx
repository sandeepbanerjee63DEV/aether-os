import { ModulePage } from "@/components/shared/module-page";

export default function TriggerEnginePage() {
  return (
    <ModulePage
      title="Trigger Engine"
      subtitle="Event-driven triggers wiring your operating system together."
      features={["Trigger Catalog", "Schedule Triggers", "Webhook Triggers", "Conditional Logic", "Backfills", "Failure Replay"]}
    />
  );
}
