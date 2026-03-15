export const dynamic = "force-dynamic";

import { FeatureGate } from "@/components/FeatureGate";
import EdlMobileWizard from "./EdlMobileWizard";

export default function NouvelEdlPage() {
  return (
    <FeatureGate feature="EDL_MOBILE">
      <EdlMobileWizard />
    </FeatureGate>
  );
}
