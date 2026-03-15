export const dynamic = "force-dynamic";

import { FeatureGate } from "@/components/FeatureGate";

export default function BailsPage() {
  return (
    <FeatureGate feature="VIE_DU_BAIL">
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-black text-slate-900 mb-3">Mes baux</h1>
        <p className="text-slate-500">Feature en cours de développement</p>
      </div>
    </FeatureGate>
  );
}
