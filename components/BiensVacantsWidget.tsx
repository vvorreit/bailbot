'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Clock, Plus, ChevronRight, Loader2 } from 'lucide-react';
import { getBiensVacants, type BienVacant } from '@/app/actions/biens-vacants';

function badgeVacance(jours: number): { bg: string; text: string; label: string } {
  if (jours <= 30) return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: `${jours}j` };
  if (jours <= 90) return { bg: 'bg-amber-100', text: 'text-amber-700', label: `${jours}j` };
  return { bg: 'bg-red-100', text: 'text-red-600', label: `${jours}j` };
}

export default function BiensVacantsWidget() {
  const [vacants, setVacants] = useState<BienVacant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBiensVacants()
      .then(setVacants)
      .catch(() => setVacants([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (vacants.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">
        <Building2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-emerald-700">Aucun bien vacant</p>
        <p className="text-xs text-emerald-500 mt-1">Tous vos biens sont loués</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-red-500" />
        <h3 className="text-sm font-black text-slate-900">Biens vacants</h3>
        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
          {vacants.length}
        </span>
      </div>

      <div className="space-y-2">
        {vacants.map((bien) => {
          const badge = badgeVacance(bien.dureeVacanceJours);
          return (
            <div
              key={bien.id}
              className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {bien.adresse}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">
                    {bien.loyer.toLocaleString('fr-FR')} €/mois
                  </span>
                  {bien.dateFinDernierBail && (
                    <span className="text-xs text-slate-400">
                      Fin bail : {new Date(bien.dateFinDernierBail).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${badge.bg} ${badge.text}`}>
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] font-bold">{badge.label}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/dashboard/depot?bienAdresse=${encodeURIComponent(bien.adresse)}`}
                  className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                  title="Créer un lien de dépôt"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/dashboard/logements`}
                  className="p-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Voir la fiche"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
