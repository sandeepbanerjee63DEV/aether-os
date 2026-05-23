import { ModulePage } from "@/components/shared/module-page";

export default function AiAgentsPage() {
  return (
    <ModulePage
      title="AI Agents"
      subtitle="Autonomous agents that operate workflows on your behalf."
      features={["Agent Roster", "Mission Designer", "Tool Permissions", "Run History", "Cost & Token Usage", "Guardrails"]}
    />
  );
}
