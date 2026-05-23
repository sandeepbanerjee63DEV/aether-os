import { ModulePage } from "@/components/shared/module-page";

export default function AuditLogsPage() {
  return (
    <ModulePage
      title="Audit Logs"
      subtitle="Immutable record of every workspace action."
      features={["Activity Log", "Search & Filter", "Export to SIEM", "Retention Policy", "Tamper Proof", "Forensic View"]}
    />
  );
}
