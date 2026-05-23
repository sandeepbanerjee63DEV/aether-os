import { ModulePage } from "@/components/shared/module-page";

export default function TeamIntelligencePage() {
  return (
    <ModulePage
      title="Team Intelligence"
      subtitle="Performance and collaboration analytics across the team."
      features={["Performance Heatmap", "Collaboration Graph", "Skills Matrix", "Workload Balance", "AI Coaching", "Goals"]}
    />
  );
}
