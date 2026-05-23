import { ModulePage } from "@/components/shared/module-page";

export default function WorkforceIntelligencePage() {
  return (
    <ModulePage
      title="Workforce Intelligence"
      subtitle="Capacity planning and workforce optimization."
      features={["Capacity Planner", "Utilization", "Skill Gaps", "Hiring Signals", "Retention Risk", "Productivity Trends"]}
    />
  );
}
