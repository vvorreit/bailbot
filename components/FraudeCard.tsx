"use client";

import { useState } from "react";
import { ResultatFraude, AlerteFraude } from "@/lib/fraude-detection";

interface Props {
  resultat: ResultatFraude | null;
}

const NIVEAU_CONFIG: Record<
  AlerteFraude["niveau"],
  { icon: string; bg: string; text: string; border: string; label: string }
> = {
  INFO: {
    icon: "ℹ️",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    label: "Info",
  },
  ATTENTION: {
    icon: "⚠️",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "Attention",
  },
  ANOMALIE: {
    icon: "🔴",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    label: "Anomalie",
  },
  CRITIQUE: {
    icon: "🚨",
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-300",
    label: "Critique",
  },
};

const VERDICT_CONFIG: Record<
  ResultatFraude["verdict"],
  { badge: string; bg: string; text: string; footer: string }
> = {
  CONFORME: {
    badge: "✅ CONFORME",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    footer:
      "Ce dossier ne présente aucune incohérence significative. Vous pouvez poursuivre l'instruction normalement.",
  },
  SUSPECT: {
    badge: "⚠️ SUSPECT",
    bg: "bg-amber-50",
    text: "text-amber-700",
    footer:
      "Ce dossier présente des points d'attention. Nous vous recommandons de vérifier les éléments signalés avant de poursuivre.",
  },
  FRAUDE_PROBABLE: {
    badge: "🔶 FRAUDE PROBABLE",
    bg: "bg-orange-50",
    text: "text-orange-700",
    footer:
      "Ce dossier présente des anomalies significatives. Nous vous recommandons de demander des justificatifs complémentaires et de vérifier manuellement chaque document.",
  },
  FRAUDE_AVEREE: {
    badge: "🔴 FRAUDE AVÉRÉE",
    bg: "bg-red-50",
    text: "text-red-800",
    footer:
      "Ce dossier présente des incohérences majeures. Nous vous recommandons de demander des justificatifs originaux et de refuser la candidature.",
  },
};

const DOC_ICONS: Record<string, string> = {
  "Bulletin de paie": "📄",
  "Avis imposition": "📊",
  CNI: "🪪",
  RIB: "🏦",
  "Justificatif domicile": "🏠",
};

function scoreColor(score: number) {
  if (score >= 90) return { bar: "bg-emerald-400", text: "text-emerald-700" };
  if (score >= 70) return { bar: "bg-amber-400", text: "text-amber-700" };
  if (score >= 40) return { bar: "bg-orange-400", text: "text-orange-700" };
  return { bar: "bg-red-400", text: "text-red-700" };
}

export default function FraudeCard({ resultat }: Props) {
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  if (!resultat) return null;

  const { score_confiance, alertes, synthese, verdict, parDocument } = resultat;
  const vCfg = VERDICT_CONFIG[verdict];
  const sc = scoreColor(score_confiance);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* ─── Header ─── */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              Analyse fraude
            </p>
            <span
              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${vCfg.bg} ${vCfg.text}`}
            >
              {vCfg.badge}
            </span>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-black ${sc.text}`}>
              {score_confiance}%
            </p>
            <p className="text-[10px] text-slate-400 font-medium">conformité</p>
          </div>
        </div>

        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${sc.bar} rounded-full transition-all duration-700`}
            style={{ width: `${score_confiance}%` }}
          />
        </div>

        <p className="text-sm text-slate-600 mt-2">{synthese}</p>
      </div>

      <div className="p-5 space-y-4">
        {/* ─── Score par document ─── */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
            Score par document
          </p>
          <div className="space-y-1.5">
            {parDocument.map((pd) => {
              const dsc = scoreColor(pd.score);
              const isExpanded = expandedDoc === pd.document;
              const nbAlertes = pd.alertes.length;

              return (
                <div key={pd.document}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                    onClick={() =>
                      setExpandedDoc(isExpanded ? null : pd.document)
                    }
                  >
                    <span className="text-base shrink-0">
                      {DOC_ICONS[pd.document] ?? "📋"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700 truncate">
                          {pd.document}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {nbAlertes > 0 && (
                            <span className="text-[10px] text-slate-400">
                              {nbAlertes} alerte{nbAlertes > 1 ? "s" : ""}
                            </span>
                          )}
                          <span
                            className={`text-xs font-bold ${dsc.text}`}
                          >
                            {pd.score}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${dsc.bar} rounded-full transition-all duration-500`}
                          style={{ width: `${pd.score}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-slate-300 text-xs shrink-0">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </button>

                  {/* Détail alertes du document */}
                  {isExpanded && nbAlertes > 0 && (
                    <div className="ml-9 mt-1 mb-2 space-y-1.5">
                      {pd.alertes.map((alerte, i) => {
                        const cfg = NIVEAU_CONFIG[alerte.niveau];
                        return (
                          <div
                            key={i}
                            className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${cfg.bg} ${cfg.border}`}
                          >
                            <span className="text-sm shrink-0 mt-0.5">
                              {cfg.icon}
                            </span>
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold uppercase ${cfg.text}`}
                                >
                                  {cfg.label}
                                </span>
                              </div>
                              <p
                                className={`text-xs font-semibold ${cfg.text}`}
                              >
                                {alerte.message}
                              </p>
                              <p className="text-[11px] text-slate-500 leading-snug">
                                {alerte.detail}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isExpanded && nbAlertes === 0 && (
                    <p className="ml-9 mt-1 mb-2 text-xs text-emerald-600 font-medium">
                      ✅ Aucune anomalie sur ce document
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Toutes les alertes (résumé) ─── */}
        {alertes.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
            <span>✅</span>
            <span>Aucune anomalie détectée</span>
          </div>
        ) : (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Toutes les alertes ({alertes.length})
            </p>
            <ul className="space-y-1.5">
              {alertes.map((alerte, i) => {
                const cfg = NIVEAU_CONFIG[alerte.niveau];
                return (
                  <li
                    key={i}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}
                  >
                    <span className="text-base shrink-0 mt-0.5">
                      {cfg.icon}
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase ${cfg.text}`}
                        >
                          {cfg.label}
                        </span>
                        {alerte.document && (
                          <span className="text-[10px] text-slate-400">
                            {alerte.document}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs font-bold ${cfg.text}`}>
                        {alerte.message}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {alerte.detail}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* ─── Footer ─── */}
      <div className={`px-5 py-3 border-t border-slate-100 ${vCfg.bg}`}>
        <p className={`text-xs ${vCfg.text}`}>{vCfg.footer}</p>
      </div>
    </div>
  );
}
