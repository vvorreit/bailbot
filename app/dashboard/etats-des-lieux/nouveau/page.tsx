export const dynamic = "force-dynamic";

import { FeatureGate } from "@/components/FeatureGate";
import EdlWizard from "../EdlWizard";

export default function NouvelEdlPage() {
  return (
    <FeatureGate feature="ETAT_DES_LIEUX">
      <EdlWizard />
    </FeatureGate>
  );
}
