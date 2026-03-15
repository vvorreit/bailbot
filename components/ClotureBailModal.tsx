'use client';

import { useState } from 'react';
import { X, FileX, Loader2 } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface Props {
  bailId: string;
  locataireNom: string;
  onClose: () => void;
  onClotured: () => void;
}

const MOTIFS = [
  'Fin de bail',
  'Congé locataire',
  'Congé bailleur',
  'Résiliation amiable',
  'Résiliation judiciaire',
  'Décès',
  'Autre',
];

export default function ClotureBailModal({ bailId, locataireNom, onClose, onClotured }: Props) {
  const trapRef = useFocusTrap(true);
  const [dateSortie, setDateSortie] = useState(new Date().toISOString().split('T')[0]);
  const [motifSortie, setMotifSortie] = useState('Fin de bail');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCloturer() {
    if (!dateSortie) {
      setError('Veuillez saisir la date de sortie');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { cloturerBail } = await import('@/app/actions/historique-locataires');
      await cloturerBail(bailId, { dateSortie, motifSortie });
      onClotured();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div ref={trapRef} role="dialog" aria-modal="true" className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <FileX className="w-5 h-5 text-red-500" />
            Clôturer le bail
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-500">
            Clôturer le bail de <strong>{locataireNom}</strong>. Cette action change le statut en &laquo;Terminé&raquo;.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Date de sortie *</label>
            <input
              type="date"
              value={dateSortie}
              onChange={(e) => setDateSortie(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Motif de sortie</label>
            <select
              value={motifSortie}
              onChange={(e) => setMotifSortie(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              {MOTIFS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleCloturer}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Clôturer le bail
          </button>
        </div>
      </div>
    </div>
  );
}
