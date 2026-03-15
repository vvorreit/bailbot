export const dynamic = "force-dynamic";

import { FeatureGate } from "@/components/FeatureGate";
import EdlListe from "./EdlListe";

export default function EtatsDesLieuxPage() {
  return (
    <FeatureGate feature="ETAT_DES_LIEUX">
      <EdlListe />
    </FeatureGate>
  );
}
