import { ModulePage } from "@/components/shared/module-page";

export default function BehavioralAnalyticsPage() {
  return (
    <ModulePage
      title="Behavioral Analytics"
      subtitle="How users and customers interact with your product."
      features={["Session Replay", "Funnel Analytics", "Cohort Behavior", "Feature Adoption", "Drop-off Maps", "Predictive Scoring"]}
    />
  );
}
