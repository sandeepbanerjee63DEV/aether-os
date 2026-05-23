import { ModulePage } from "@/components/shared/module-page";

export default function AiMemoryPage() {
  return (
    <ModulePage
      title="AI Memory"
      subtitle="Persistent, queryable memory powering every AETHER agent."
      features={["Memory Graph", "Recent Recalls", "Pinned Facts", "Forget Rules", "Source Citations", "Retention Policy"]}
    />
  );
}
