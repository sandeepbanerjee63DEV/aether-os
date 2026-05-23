import { ModulePage } from "@/components/shared/module-page";

export default function NotificationsPage() {
  return (
    <ModulePage
      title="Notifications Center"
      subtitle="Unified inbox for system, AI, and team alerts."
      features={["Inbox", "AI-Triaged Alerts", "Push Channels", "Mute Rules", "Digest Settings", "Audit Trail"]}
    />
  );
}
