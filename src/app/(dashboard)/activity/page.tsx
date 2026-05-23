import { ModulePage } from "@/components/shared/module-page";

export default function ActivityStreamPage() {
  return (
    <ModulePage
      title="Activity Stream"
      subtitle="Real-time event firehose across the entire workspace."
      features={["Live Stream", "User Actions", "System Events", "AI Decisions", "Filters & Pinning", "Export"]}
    />
  );
}
