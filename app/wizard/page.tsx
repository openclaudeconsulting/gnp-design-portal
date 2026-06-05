import { WizardLayout } from "@/components/wizard/WizardLayout";
import { WizardProvider } from "@/components/wizard/WizardProvider";

export default function WizardPage() {
  return (
    <WizardProvider>
      <WizardLayout />
    </WizardProvider>
  );
}
