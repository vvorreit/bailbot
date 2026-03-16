"use client";

import { useState } from "react";
import Link from "next/link";
import { Stethoscope, ChevronRight, Home, Filter, AlertTriangle } from "lucide-react";
import { STATUT_LABELS, STATUT_ICONS } from "@/lib/diagnostics-config";
import type { DiagnosticAvecStatut } from "@/app/actions/diagnostics-gestion";

interface BienDiagnostics {
  bienId: string;
  adresse: string;
  diagnostics: DiagnosticAvecStatut[];
}

interface Props {
  data: BienDiagnostics[];
}

type Filtre = "tous" | "expires" | "expire-bientot" | "manquants";

export default function DiagnosticsOverviewClient({ data }: Props) {
  const [filtre, setFiltre] = useState<Filtre>("tous");

  const allDiags = (data ?? []).flatMap((b) => b.diagnostics);
  const stats = {
    valides: allDiags.filter((d) => d.statut === "valide" || d.statut === "illimite").length,
    aRenouveler: allDiags.filter((d) => d.statut === "expire-bientot" || d.statut === "expire").length,
    manquants: allDiags.filter((d) => d.statut === "manquant").length,
  };

  const filteredData = data
    .map((bien) => ({
      ...bien,
      diagnostics: bien.diagnostics.filter((d) => {
        if (filtre === "tous") return true;
        if (filtre === "expires") return d.statut === "expire" || d.statut === "expire-bientot";
        if (filtre === "expire-bientot") return d.statut === "expire-bientot";
        if (filtre === "manquants") return d.statut === "manquant";
        return true;
      }),
    }))
    .filter((b) => b.diagnostics.length > 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
        <Link href="/dashboard" className="hover:text-slate-600">Tableau de bord</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-700 font-bold">Diagnostics</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Mes diagnostics</h1>
          <p className="text-sm text-slate-500">Suivi des diagnostics obligatoires par bien</p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800">
            Les diagnostics sont des documents OBLIGATOIRES pour la mise en location.
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Un bail signe sans les diagnostics requis peut etre annule par le locataire.
            Vous vous exposez a des amendes pouvant aller jusqu&apos;a 3 000 euros.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-700">{stats.valides}</p>
          <p className="text-xs font-bold text-emerald-600 uppercase">Valides</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-amber-700">{stats.aRenouveler}</p>
          <p className="text-xs font-bold text-amber-600 uppercase">A renouveler</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-red-700">{stats.manquants}</p>
          <p className="text-xs font-bold text-red-600 uppercase">Manquants</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-slate-400" />
        {([
          { key: "tous" as Filtre, label: "Tous" },
          { key: "expires" as Filtre, label: "Expires" },
          { key: "expire-bientot" as Filtre, label: "A renouveler dans 30j" },
          { key: "manquants" as Filtre, label: "Manquants" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltre(key)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              filtre === key
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Biens list */}
      {data.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
          <Home className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Aucun bien enregistre</p>
          <Link href="/dashboard" className="text-sm text-emerald-600 font-bold hover:underline mt-2 inline-block">
            Ajouter un bien
          </Link>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center">
          <p className="text-sm font-bold text-emerald-700">Aucun diagnostic ne correspond a ce filtre</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredData.map((bien) => (
            <div key={bien.bienId} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-slate-500" />
                  <h2 className="text-sm font-black text-slate-900">{bien.adresse}</h2>
                </div>
                <Link
                  href={`/dashboard/biens/${bien.bienId}/diagnostics`}
                  className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  Gerer <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 uppercase border-b border-slate-100">
                      <th className="text-left py-2 px-4">Diagnostic</th>
                      <th className="text-center py-2 px-4">Statut</th>
                      <th className="text-left py-2 px-4">Expiration</th>
                      <th className="text-left py-2 px-4">Validite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bien.diagnostics.map((d) => {
                      const statutCfg = STATUT_LABELS[d.statut] || STATUT_LABELS["manquant"];
                      const icon = STATUT_ICONS[d.statut] || "?";
                      return (
                        <tr key={d.type} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-2.5 px-4">
                            <p className="font-medium text-slate-700">{d.type}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[200px]">{d.nom}</p>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${statutCfg.bg} ${statutCfg.color}`}>
                              {icon} {statutCfg.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-slate-500">
                            {d.dateExpiration
                              ? new Date(d.dateExpiration).toLocaleDateString("fr-FR")
                              : d.statut === "illimite" || d.statut === "non-concerne" ? "—" : "Non renseigne"}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-slate-400">
                            {d.validiteLabel}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
