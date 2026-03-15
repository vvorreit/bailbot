"use client";

import { useMemo } from "react";
import { OffreGLI, calculerOffresGLI } from "@/lib/comparateur-gli";
import { DossierLocataire } from "@/lib/parsers";
import { ExternalLink } from "lucide-react";

interface Props {
  dossier: Partial<DossierLocataire>;
  loyerCC: number;
  villeEstParis?: boolean;
}

function Etoiles({ n, max = 5 }: { n: number; max?: number }) {
  return (
    <span className="text-sm">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < n ? "text-amber-400" : "text-slate-200"}>
          ★
        </span>
      ))}
    </span>
  );
}

function PrixBadge({ offre }: { offre: OffreGLI }) {
  if (offre.gratuit) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
        GRATUIT
      </span>
    );
  }
  return (
    <span className="text-sm font-bold text-slate-800">
      {offre.prixMensuel.toFixed(0)}€<span className="text-slate-400 font-normal text-xs">/mois</span>
    </span>
  );
}

function EligibleBadge({ offre }: { offre: OffreGLI }) {
  if (offre.eligible) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        ✅ OUI
      </span>
    );
  }
  const short = offre.raisonNonEligible
    ? offre.raisonNonEligible.split(" ").slice(0, 3).join(" ")
    : "NON";
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200"
      title={offre.raisonNonEligible}
    >
      ❌ {short}
    </span>
  );
}

export default function ComparateurGLI({ dossier, loyerCC, villeEstParis = false }: Props) {
  const offres = useMemo(
    () => calculerOffresGLI(dossier, loyerCC, villeEstParis),
    [dossier, loyerCC, villeEstParis]
  );

  const nbEligibles = offres.filter((o) => o.eligible).length;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-slate-50">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              🏆 Comparateur Garantie Loyer Impayé
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {nbEligibles} offre{nbEligibles > 1 ? "s" : ""} éligible{nbEligibles > 1 ? "s" : ""} · Loyer CC : {loyerCC.toLocaleString("fr-FR")}€/mois
            </p>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="px-4 py-2 text-left">Assureur</th>
              <th className="px-4 py-2 text-left">Prix/mois</th>
              <th className="px-4 py-2 text-left hidden sm:table-cell">Couverture</th>
              <th className="px-4 py-2 text-left">Éligible</th>
              <th className="px-4 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {offres.map((offre, i) => {
              const isVisale = offre.gratuit && offre.nom.includes("Visale");
              const isFirst = i === 0 && offre.eligible;
              return (
                <tr
                  key={offre.nom}
                  className={`transition-colors ${
                    offre.eligible
                      ? isVisale
                        ? "bg-emerald-50/60 hover:bg-emerald-50"
                        : "hover:bg-slate-50/80"
                      : "opacity-60 hover:opacity-80"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg leading-none">{offre.logo}</span>
                      <div>
                        <p className={`font-bold text-sm leading-tight ${isVisale && offre.eligible ? "text-emerald-700" : "text-slate-800"}`}>
                          {offre.nom}
                        </p>
                        {isFirst && offre.eligible && (
                          <span className="text-[10px] font-black uppercase tracking-wide text-emerald-600">
                            ⭐ Recommandé
                          </span>
                        )}
                        {isVisale && offre.eligible && !isFirst && (
                          <span className="text-[10px] font-black uppercase tracking-wide text-emerald-600">
                            GRATUIT
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PrixBadge offre={offre} />
                    {!offre.gratuit && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {offre.tauxMensuel}% du loyer
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Etoiles n={offre.nbEtoiles} />
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                      {offre.couverture.slice(0, 2).join(", ")}
                      {offre.couverture.length > 2 && ` +${offre.couverture.length - 2}`}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <EligibleBadge offre={offre} />
                    {!offre.eligible && offre.raisonNonEligible && (
                      <p className="text-[10px] text-red-400 mt-0.5 max-w-[140px] leading-tight">
                        {offre.raisonNonEligible}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {offre.eligible && (
                      <a
                        href={offre.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          isVisale
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Faire la demande
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          💡 Prix indicatifs basés sur un loyer CC de {loyerCC.toLocaleString("fr-FR")}€. Les prix réels peuvent varier selon le profil du locataire. Confirmez auprès de chaque assureur.
        </p>
      </div>
    </div>
  );
}
