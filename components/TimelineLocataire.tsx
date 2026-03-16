'use client';

import { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { getTimelineLocataire, type TimelineEvent } from '@/app/actions/timeline';

const TYPE_CONFIG: Record<TimelineEvent['type'], { icon: string; color: string; bg: string }> = {
  creation: { icon: '🏠', color: 'bg-emerald-500', bg: 'bg-emerald-50' },
  quittance: { icon: '📄', color: 'bg-blue-500', bg: 'bg-blue-50' },
  paiement_ok: { icon: '✅', color: 'bg-emerald-500', bg: 'bg-emerald-50' },
  paiement_retard: { icon: '🔴', color: 'bg-red-500', bg: 'bg-red-50' },
  demande: { icon: '💬', color: 'bg-purple-500', bg: 'bg-purple-50' },
  relance: { icon: '⚠️', color: 'bg-amber-500', bg: 'bg-amber-50' },
  edl: { icon: '📋', color: 'bg-indigo-500', bg: 'bg-indigo-50' },
  travaux: { icon: '🔧', color: 'bg-orange-500', bg: 'bg-orange-50' },
  fin: { icon: '🔑', color: 'bg-slate-700', bg: 'bg-slate-100' },
};

const TYPE_LABELS: Record<TimelineEvent['type'], string> = {
  creation: 'Entrée',
  quittance: 'Quittance',
  paiement_ok: 'Paiement',
  paiement_retard: 'Impayé',
  demande: 'Demande',
  relance: 'Relance',
  edl: 'EDL',
  travaux: 'Travaux',
  fin: 'Sortie',
};

interface Props {
  bailId: string;
  onClose: () => void;
  locataireNom: string;
}

export default function TimelineLocataire({ bailId, onClose, locataireNom }: Props) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    getTimelineLocataire(bailId)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [bailId]);

  const visible = events.slice(0, visibleCount);
  const hasMore = visibleCount < events.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-base font-black text-slate-900">Historique complet</h3>
            <p className="text-xs text-slate-500 mt-0.5">{locataireNom}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">Aucun événement pour ce bail</p>
          ) : (
            <div className="relative pl-8">
              {/* Vertical line */}
              <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" />

              {visible.map((evt, i) => {
                const cfg = TYPE_CONFIG[evt.type];
                return (
                  <div
                    key={`${evt.type}-${evt.date}-${i}`}
                    className="relative mb-5 last:mb-0 animate-list-item-in"
                    style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                  >
                    {/* Dot */}
                    <div className={`absolute -left-5 top-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${cfg.bg} border-2 border-white shadow-sm`}>
                      <span>{cfg.icon}</span>
                    </div>

                    {/* Content */}
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(evt.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${cfg.bg} ${cfg.color.replace('bg-', 'text-').replace('-500', '-700')}`}>
                          {TYPE_LABELS[evt.type]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium">{evt.description}</p>
                    </div>
                  </div>
                );
              })}

              {hasMore && (
                <button
                  onClick={() => setVisibleCount((c) => c + 20)}
                  className="ml-2 mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Voir plus ({events.length - visibleCount} restants)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
