"use client";

import { EligibiliteVisale } from "@/lib/eligibilite-visale";
import { DossierLocataire } from "@/lib/parsers";

interface Props {
  result: EligibiliteVisale | null;
  /** true si les données minimales (CNI + bulletin) sont disponibles */
  hasData: boolean;
}

function ConditionRow({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="shrink-0 mt-0.5">{ok ? "✅" : "❌"}</span>
      <div>
        <span className="font-semibold text-slate-800">{label}</span>
        <span className="text-slate-500 ml-1">{detail}</span>
      </div>
    </div>
  );
}

export default function EligibiliteVisaleCard({ result, hasData }: Props) {
  // ── Carte vide si pas de données ─────────────────────────────────────────
  if (!hasData || !result) {
    return (
      <div className="bg-slate-100 border border-dashed border-slate-300 rounded-2xl p-5 space-y-2 text-center">
        <p className="text-2xl">🏠</p>
        <p className="text-sm font-bold text-slate-500">Éligibilité Visale</p>
        <p className="text-xs text-slate-400">
          Uploadez la CNI et un bulletin de paie, puis renseignez le loyer pour vérifier l&apos;éligibilité Visale.
        </p>
      </div>
    );
  }

  const { eligible, conditions, motifs_refus, alternatives } = result;

  return (
    <div
      className={`rounded-2xl border p-5 space-y-4 ${
        eligible
          ? "bg-emerald-50 border-emerald-200"
          : "bg-red-50 border-red-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏠</span>
          <h3 className="font-bold text-slate-800">Éligibilité Visale</h3>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-tight ${
            eligible
              ? "bg-emerald-600 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {eligible ? "✅ Éligible Visale" : "❌ Non éligible"}
        </span>
      </div>

      {/* Conditions */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Conditions vérifiées
        </p>
        <ConditionRow
          ok={conditions.age.ok}
          label={`Âge : ${conditions.age.valeur > 0 ? conditions.age.valeur + " ans" : "?"}`}
          detail={conditions.age.detail}
        />
        <ConditionRow
          ok={conditions.contrat.ok}
          label={`Contrat : ${conditions.contrat.valeur}`}
          detail={conditions.contrat.detail}
        />
        <ConditionRow
          ok={conditions.loyerRevenus.ok}
          label={`Loyer/Revenus : ${conditions.loyerRevenus.ratio}%`}
          detail={conditions.loyerRevenus.detail}
        />
        <ConditionRow
          ok={conditions.loyerPlafond.ok}
          label={`Loyer : ${conditions.loyerPlafond.valeur.toLocaleString("fr-FR")} €`}
          detail={conditions.loyerPlafond.detail}
        />
        <ConditionRow
          ok={conditions.nonProprietaire.ok}
          label="Non propriétaire"
          detail={conditions.nonProprietaire.detail}
        />
      </div>

      {/* Motifs de refus */}
      {!eligible && motifs_refus.length > 0 && (
        <div className="bg-red-100 border border-red-200 rounded-xl p-3 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-500">
            Motifs de refus
          </p>
          {motifs_refus.map((m, i) => (
            <p key={i} className="text-xs text-red-700">
              • {m}
            </p>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="pt-1">
        {eligible ? (
          <a
            href="https://www.visale.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
          >
            Faire la demande Visale →
          </a>
        ) : (
          alternatives.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Alternatives
              </p>
              <div className="flex flex-wrap gap-2">
                {alternatives.map((alt) => (
                  <span
                    key={alt}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600"
                  >
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
