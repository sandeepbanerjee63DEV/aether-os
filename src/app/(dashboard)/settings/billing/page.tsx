import { ModulePage } from "@/components/shared/module-page";

export default function BillingPage() {
  return (
    <ModulePage
      title="Billing"
      subtitle="Plan, usage, invoices, and seat management."
      features={["Plan & Seats", "Usage Metering", "Invoices", "Payment Methods", "Cost Center Reports", "Upgrade Path"]}
    />
  );
}
