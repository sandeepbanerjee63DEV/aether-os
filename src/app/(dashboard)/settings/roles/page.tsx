import { ModulePage } from "@/components/shared/module-page";

export default function RolesPage() {
  return (
    <ModulePage
      title="Roles & Permissions"
      subtitle="Fine-grained RBAC across every module."
      features={["Role Catalog", "Permission Matrix", "Custom Roles", "Audit Diffs", "Scopes", "User Assignments"]}
    />
  );
}
