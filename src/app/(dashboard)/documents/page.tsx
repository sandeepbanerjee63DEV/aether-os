import { ModulePage } from "@/components/shared/module-page";

export default function DocumentsPage() {
  return (
    <ModulePage
      title="Documents"
      subtitle="Centralized document library with semantic search."
      features={["File Vault", "Semantic Search", "Version Control", "Permissions", "AI Tagging", "Sharing Links"]}
    />
  );
}
