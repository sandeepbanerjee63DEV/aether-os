import { ModulePage } from "@/components/shared/module-page";

export default function ApiKeysPage() {
  return (
    <ModulePage
      title="API Keys"
      subtitle="Manage programmatic access to AETHER OS."
      features={["Active Keys", "Scopes", "Rotation Schedule", "Usage Logs", "IP Pinning", "Webhook Secrets"]}
    />
  );
}
