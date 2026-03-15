'use client';

import { TYPE_ALERTE_LABELS, TYPE_ALERTE_COLORS } from '@/lib/echeances-bail';
import { Bell, CheckCircle2 } from 'lucide-react';
import type { TypeAlerte } from '@prisma/client';

interface Alerte {
  id: string;
  bailId: string;
  type: TypeAlerte;
  dateEcheance: string;
  traitee: boolean;
}

interface BailMinimal {
  id: string;
  locataireNom: string;
  bienId: string;
}

interface Props {
  alertes: Alerte[];
  bails: BailMinimal[];
  bienLabels: Record<string, string>;
  onTraiter?: (alerteId: string) => void;
}

export default function AlertesEcheances({ alertes, bails, bienLabels, onTraiter }: Props) {
  const now = new Date();
  const bailMap = new Map(bails.map((b) => [b.id, b]));

  const alertesFiltrees = alertes
    .filter((a) => !a.traitee)
    .sort((a, b) => new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime());

  const groupes = {
    urgent: alertesFiltrees.filter((a) => {
      const d = new Date(a.dateEcheance);
      const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff <= 30;
    }),
    moyen: alertesFiltrees.filter((a) => {
      const d = new Date(a.dateEcheance);
      const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 30 && diff <= 60;
    }),
    loin: alertesFiltrees.filter((a) => {
      const d = new Date(a.dateEcheance);
      const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 60 && diff <= 90;
    }),
  };

  if (alertesFiltrees.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-emerald-700">Aucune échéance à venir</p>
        <p className="text-xs text-emerald-500 mt-1">Tous vos baux sont à jour</p>
      </div>
    );
  }

  const renderGroupe = (titre: string, alertes: Alerte[], colorBg: string) => {
    if (alertes.length === 0) return null;
    return (
      <div className="mb-4 last:mb-0">
        <p className={`text-xs font-black uppercase tracking-wider mb-2 ${
          colorBg === 'red' ? 'text-red-500' : colorBg === 'amber' ? 'text-amber-500' : 'text-slate-400'
        }`}>
          {titre} ({alertes.length})
        </p>
        <div className="space-y-2">
          {alertes.map((a) => {
            const bail = bailMap.get(a.bailId);
            const joursRestants = Math.ceil(
              (new Date(a.dateEcheance).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow"
              >
                <div className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold ${TYPE_ALERTE_COLORS[a.type]}`}>
                  {TYPE_ALERTE_LABELS[a.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {bail?.locataireNom || 'Locataire'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {bienLabels[bail?.bienId || ''] || bail?.bienId || ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xs font-bold ${joursRestants <= 0 ? 'text-red-600' : joursRestants <= 7 ? 'text-red-500' : joursRestants <= 30 ? 'text-amber-600' : 'text-slate-500'}`}>
                    {joursRestants <= 0 ? 'Dépassée' : `J-${joursRestants}`}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(a.dateEcheance).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                {onTraiter && (
                  <button
                    onClick={() => onTraiter(a.id)}
                    title="Marquer comme traitée"
                    className="shrink-0 p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-black text-slate-900">Prochaines échéances</h3>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
          {alertesFiltrees.length}
        </span>
      </div>
      {renderGroupe('Sous 30 jours', groupes.urgent, 'red')}
      {renderGroupe('30–60 jours', groupes.moyen, 'amber')}
      {renderGroupe('60–90 jours', groupes.loin, 'slate')}
    </div>
  );
}
