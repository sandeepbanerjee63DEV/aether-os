import { ModulePage } from "@/components/shared/module-page";

export default function FeedbackPage() {
  return (
    <ModulePage
      title="Feedback Center"
      subtitle="Tell us what to build next \u2014 voting, ideas, roadmap."
      features={["Submit Idea", "Public Roadmap", "Vote Board", "Recent Releases", "Beta Programs", "Direct Feedback"]}
    />
  );
}
