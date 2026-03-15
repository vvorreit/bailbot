export const dynamic = "force-dynamic";

import { FeatureGate } from "@/components/FeatureGate";
import EspacesLocatairesClient from "./EspacesLocatairesClient";

export default function EspacesLocatairesPage() {
  return (
    <FeatureGate feature="ESPACE_LOCATAIRE">
      <EspacesLocatairesClient />
    </FeatureGate>
  );
}
