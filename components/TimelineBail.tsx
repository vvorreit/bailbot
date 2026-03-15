'use client';

import { TYPE_ALERTE_LABELS, TYPE_ALERTE_COLORS } from '@/lib/echeances-bail';
import type { TypeAlerte } from '@prisma/client';

interface Alerte {
  id: string;
  type: TypeAlerte;
  dateEcheance: string;
  traitee: boolean;
}

interface Bail {
  id: string;
  locataireNom: string;
  dateDebut: string;
  dateFin: string | null;
  dateProchRevision: string;
  alertes: Alerte[];
}

interface Props {
  bail: Bail;
}

export default function TimelineBail({ bail }: Props) {
  const now = new Date();
  const debut = new Date(bail.dateDebut);
  const fin = bail.dateFin ? new Date(bail.dateFin) : null;

  const events = [
    {
      date: debut,
      label: 'Début du bail',
      color: 'bg-emerald-500',
      passed: debut <= now,
    },
    ...bail.alertes.map((a) => ({
      date: new Date(a.dateEcheance),
      label: TYPE_ALERTE_LABELS[a.type],
      color: a.traitee ? 'bg-slate-300' : TYPE_ALERTE_COLORS[a.type].split(' ')[0].replace('bg-', 'bg-'),
      passed: new Date(a.dateEcheance) <= now,
      traitee: a.traitee,
      alerteType: a.type,
    })),
    ...(fin
      ? [{
          date: fin,
          label: 'Fin du bail',
          color: 'bg-slate-700',
          passed: fin <= now,
        }]
      : []),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="relative pl-6">
      <div className="absolute left-2.5 top-0 bottom-0 w-px bg-slate-200" />
      {events.map((evt, i) => {
        const isUpcoming = !evt.passed && (i === 0 || events[i - 1]?.passed);
        return (
          <div key={i} className="relative mb-4 last:mb-0">
            <div
              className={`absolute left-[-17px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                evt.passed ? 'bg-slate-300' : isUpcoming ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-200'
              }`}
            />
            <div className={`${evt.passed ? 'opacity-50' : ''}`}>
              <p className="text-xs font-bold text-slate-500">
                {evt.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className={`text-sm font-semibold ${evt.passed ? 'text-slate-400' : 'text-slate-800'}`}>
                {evt.label}
              </p>
              {'traitee' in evt && evt.traitee && (
                <span className="text-[10px] text-emerald-600 font-semibold">Traitée</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
