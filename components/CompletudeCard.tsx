"use client";

import { useState } from "react";
import { CompletudeDossier } from "@/lib/completude-dossier";

interface Props {
  completude: CompletudeDossier | null;
}

export default function CompletudeCard({ completude }: Props) {
  const [copied, setCopied] = useState(false);

  if (!completude) return null;

  const { pourcentage, complet, documents, manquants, messageEmail } = completude;

  const barColor =
    pourcentage >= 90 ? "bg-emerald-400"
    : pourcentage >= 60 ? "bg-amber-400"
    : "bg-red-400";

  const labelColor =
    pourcentage >= 90 ? "text-emerald-700"
    : pourcentage >= 60 ? "text-amber-700"
    : "text-red-700";

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(messageEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-50">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Complétude du dossier</p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-600">
                {complet ? "Dossier complet ✅" : `${manquants.length} document${manquants.length > 1 ? "s" : ""} manquant${manquants.length > 1 ? "s" : ""}`}
              </span>
              <span className={`text-xs font-black ${labelColor}`}>{pourcentage}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pourcentage} aria-valuemin={0} aria-valuemax={100} aria-label={`Complétude du dossier : ${pourcentage}%`}>
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-700`}
                style={{ width: `${pourcentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Liste documents */}
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-start gap-2.5">
              <span className="shrink-0 mt-0.5">{doc.present ? "✅" : doc.obligatoire ? "❌" : "○"}</span>
              <div>
                <span className={`text-xs font-semibold ${doc.present ? "text-slate-700" : doc.obligatoire ? "text-red-600" : "text-slate-400"}`}>
                  {doc.nom}
                </span>
                {!doc.present && doc.obligatoire && (
                  <span className="ml-1.5 text-[10px] font-bold uppercase tracking-tight text-red-400">obligatoire</span>
                )}
                {!doc.present && !doc.obligatoire && (
                  <span className="ml-1.5 text-[10px] font-semibold text-slate-400">optionnel</span>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Bouton copier email */}
        {manquants.length > 0 && (
          <button
            onClick={handleCopyEmail}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border
              ${copied
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
          >
            {copied ? "✅ Email copié !" : "📧 Copier l'email de relance"}
          </button>
        )}
      </div>
    </div>
  );
}
