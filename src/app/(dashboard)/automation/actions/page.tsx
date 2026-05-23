import { ModulePage } from "@/components/shared/module-page";

export default function ActionCenterPage() {
  return (
    <ModulePage
      title="Action Center"
      subtitle="Library of reusable actions and side-effects."
      features={["Action Library", "Custom Actions", "Approval Gates", "Rate Limits", "Run Logs", "Idempotency"]}
    />
  );
}
