import { ModulePage } from "@/components/shared/module-page";

export default function ApiConnectionsPage() {
  return (
    <ModulePage
      title="API Connections"
      subtitle="External services wired into your operating system."
      features={["Connections", "Webhooks", "Outbound Calls", "Rate Limits", "Auth Tokens", "Request Logs"]}
    />
  );
}
