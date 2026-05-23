import { ModulePage } from "@/components/shared/module-page";

export default function HelpPage() {
  return (
    <ModulePage
      title="Help & Support"
      subtitle="Docs, guides, and direct access to the AETHER team."
      features={["Documentation", "Live Chat", "Submit Ticket", "Changelog", "Video Tutorials", "Onboarding"]}
    />
  );
}
