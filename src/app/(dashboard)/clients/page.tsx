import { ModulePage } from "@/components/shared/module-page";

export default function ClientsPage() {
  return (
    <ModulePage
      title="Clients"
      subtitle="Active customer accounts with lifetime intelligence."
      features={["Client Directory", "Health Score", "Renewal Pipeline", "Engagement Timeline", "Contacts", "Documents"]}
    />
  );
}
