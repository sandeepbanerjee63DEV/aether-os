"use client";

import { ModulePage } from "@/components/shared/module-page";

export default function DealsPage() {
  return (
    <ModulePage
      title="Deals Pipeline"
      subtitle="AI probability scoring, drag-drop Kanban, and revenue forecasting."
      features={[
        "Kanban Pipeline Board",
        "AI Deal Probability",
        "Revenue Forecasting",
        "Stage Analytics",
        "Win/Loss Tracking",
        "Team Collaboration",
      ]}
    />
  );
}
