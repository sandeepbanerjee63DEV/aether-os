import { ModulePage } from "@/components/shared/module-page";

export default function BrandingPage() {
  return (
    <ModulePage
      title="Branding"
      subtitle="Match the workspace to your visual identity."
      features={["Logo", "Color Palette", "Email Templates", "Custom Domain", "Favicon", "Login Page"]}
    />
  );
}
