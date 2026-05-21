import { ModulePage } from "@/components/shared/module-page";
export default function Page() {
  return <ModulePage title="Team Management" subtitle="Roles, permissions, and activity logs." features={["Team Members", "Role Assignment", "Permission Matrix", "Activity Logs", "Invite Users"]} />;
}
