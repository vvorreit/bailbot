export const dynamic = "force-dynamic";

import { FeatureGate } from "@/components/FeatureGate";
import ComparaisonPage from "./ComparaisonPage";

export default function Page({ params }: { params: { bienId: string } }) {
  return (
    <FeatureGate feature="EDL_COMPARAISON">
      <ComparaisonPage bienId={params.bienId} />
    </FeatureGate>
  );
}
