export const dynamic = "force-dynamic";

import { FeatureGate } from "@/components/FeatureGate";

export default function CandidatsPage() {
  return (
    <FeatureGate feature="RELANCES_CANDIDAT">
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-black text-slate-900 mb-3">Relances candidats</h1>
        <p className="text-slate-500">Feature en cours de développement</p>
      </div>
    </FeatureGate>
  );
}
