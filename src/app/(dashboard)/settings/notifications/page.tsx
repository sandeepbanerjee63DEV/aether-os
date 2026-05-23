import { ModulePage } from "@/components/shared/module-page";

export default function NotificationsSettingsPage() {
  return (
    <ModulePage
      title="Notifications Settings"
      subtitle="Per-channel preferences and quiet hours."
      features={["Channels", "Per-Event Rules", "Quiet Hours", "Digest Frequency", "Escalation Policy", "Mobile Push"]}
    />
  );
}
