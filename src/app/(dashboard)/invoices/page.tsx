import { ModulePage } from "@/components/shared/module-page";
export default function Page() {
  return <ModulePage title="Invoices" subtitle="Billing and invoice management." features={["Invoice List", "Payment Tracking", "Recurring Billing", "Export PDF"]} />;
}
