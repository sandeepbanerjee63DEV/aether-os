import { ModulePage } from "@/components/shared/module-page";

export default function DepartmentsPage() {
  return (
    <ModulePage
      title="Departments"
      subtitle="Organize teams, ownership, and reporting lines."
      features={["Department Tree", "Member Routing", "Approval Chains", "Cost Centers", "KPIs", "Visibility Rules"]}
    />
  );
}
