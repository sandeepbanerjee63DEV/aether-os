import { ModulePage } from "@/components/shared/module-page";

export default function SystemStatusPage() {
  return (
    <ModulePage
      title="System Status"
      subtitle="Live status of every AETHER OS service."
      features={["Service Uptime", "API Latency", "AI Model Health", "Database Pool", "Background Jobs", "Incident History"]}
    />
  );
}
