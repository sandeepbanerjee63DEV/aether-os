import { ModulePage } from "@/components/shared/module-page";

export default function KnowledgeBasePage() {
  return (
    <ModulePage
      title="Knowledge Base"
      subtitle="Internal wiki powered by AETHER AI retrieval."
      features={["Articles", "AI Search", "Categories", "Collaborative Editing", "Public Portal", "Analytics"]}
    />
  );
}
