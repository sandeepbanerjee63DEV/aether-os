import { ModulePage } from "@/components/shared/module-page";

export default function SecurityPage() {
  return (
    <ModulePage
      title="Security Center"
      subtitle="Posture, sessions, and threat surface in one place."
      features={["SSO & MFA", "Session Manager", "IP Allowlist", "Data Residency", "Encryption", "Threat Feed"]}
    />
  );
}
