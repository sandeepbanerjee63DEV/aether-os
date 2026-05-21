import { ModulePage } from "@/components/shared/module-page";

export default function TasksPage() {
  return (
    <ModulePage
      title="Tasks & Approvals"
      subtitle="Team tasks with AI prioritization and approval workflows."
      features={["Task Board", "Approval Queue", "AI Prioritization", "Deadline Tracking", "Team Assignments", "Audit Trail"]}
    />
  );
}
