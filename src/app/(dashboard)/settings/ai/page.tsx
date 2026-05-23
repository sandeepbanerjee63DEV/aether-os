import { ModulePage } from "@/components/shared/module-page";

export default function AiConfigurationPage() {
  return (
    <ModulePage
      title="AI Configuration"
      subtitle="Choose models, providers, and AI guardrails."
      features={["Provider", "Model Defaults", "Token Budget", "PII Redaction", "Tone & Style", "Safety Rules"]}
    />
  );
}
