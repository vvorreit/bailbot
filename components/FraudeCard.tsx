"use client";

import { ResultatFraude, AlerteFraude } from "@/lib/fraude-detection";

interface Props {
  resultat: ResultatFraude | null;
}

const NIVEAU_CONFIG: Record<AlerteFraude["niveau"], { icon: string; bg: string; text: string; border: string }> = {
  INFO:      { icon: "ℹ️",  bg: "bg-sky-50",    text: "text-sky-700",    border: "border-sky-200" },
  ATTENTION: { icon: "⚠️",  bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  ANOMALIE:  { icon: "🔴",  bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200" },
};

export default function FraudeCard({ resultat }: Props) {
  if (!resultat) return null;

  const { score_confiance, alertes, synthese } = resultat;

  const barColor =
    score_confiance >= 80 ? "bg-emerald-400"
    : score_confiance >= 60 ? "bg-amber-400"
    : "bg-red-400";

  const labelColor =
    score_confiance >= 80 ? "text-emerald-700"
    : score_confiance >= 60 ? "text-amber-700"
    : "text-red-700";

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-50">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Analyse fraude</p>
        <p className="text-sm font-semibold text-slate-700">{synthese}</p>
      </div>

      <div className="p-5 space-y-4">
        {/* Score de confiance */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-600">Score de confiance</span>
            <span className={`text-xs font-black ${labelColor}`}>{score_confiance}/100</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${barColor} rounded-full transition-all duration-700`}
              style={{ width: `${score_confiance}%` }}
            />
          </div>
        </div>

        {/* Alertes */}
        {alertes.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
            <span>✅</span>
            <span>Aucune anomalie détectée</span>
          </div>
        ) : (
          <ul className="space-y-2">
            {alertes.map((alerte, i) => {
              const cfg = NIVEAU_CONFIG[alerte.niveau];
              return (
                <li
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}
                >
                  <span className="text-base shrink-0 mt-0.5">{cfg.icon}</span>
                  <div className="space-y-0.5">
                    <p className={`text-xs font-bold ${cfg.text}`}>{alerte.message}</p>
                    <p className="text-[11px] text-slate-500 leading-snug">{alerte.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
