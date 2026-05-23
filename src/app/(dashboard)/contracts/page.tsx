import { ModulePage } from "@/components/shared/module-page";

export default function ContractsPage() {
  return (
    <ModulePage
      title="Contracts"
      subtitle="Legal agreements with AI-extracted clauses and reminders."
      features={["Active Contracts", "E-Signature", "Clause Library", "Renewal Alerts", "AI Risk Review", "Version History"]}
    />
  );
}
