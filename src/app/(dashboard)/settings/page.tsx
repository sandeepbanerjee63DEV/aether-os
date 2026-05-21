import { ModulePage } from "@/components/shared/module-page";
export default function Page() {
  return <ModulePage title="Settings" subtitle="Organization and account configuration." features={["Profile Settings", "Organization", "Billing", "API Keys", "Security", "Notifications"]} />;
}
