import { ModulePage } from "@/components/shared/module-page";

export default function OrganizationPage() {
  return (
    <ModulePage
      title="Organization"
      subtitle="Company profile, structure, and global preferences."
      features={["Company Profile", "Org Chart", "Locale & Currency", "Working Hours", "Holidays", "Compliance Region"]}
    />
  );
}
