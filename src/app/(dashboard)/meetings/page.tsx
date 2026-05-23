import { ModulePage } from "@/components/shared/module-page";

export default function MeetingsPage() {
  return (
    <ModulePage
      title="Meetings"
      subtitle="Schedule, transcribe, and summarize every conversation."
      features={["Calendar", "AI Notes", "Action Items", "Recordings", "Round-Robin Scheduling", "Reminders"]}
    />
  );
}
