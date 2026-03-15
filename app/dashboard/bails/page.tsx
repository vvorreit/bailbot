export const dynamic = "force-dynamic";

import { FeatureGate } from "@/components/FeatureGate";
import BailsClient from "./BailsClient";

export default function BailsPage() {
  return (
    <FeatureGate feature="VIE_DU_BAIL">
      <BailsClient />
    </FeatureGate>
  );
}
