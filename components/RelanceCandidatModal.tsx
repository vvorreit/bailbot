'use client';

import { useState } from 'react';
import { X, Send, Eye, Loader2, Mail } from 'lucide-react';
import { getTemplate, type ParamsTemplate } from '@/lib/templates-relance-candidat';

interface DepotInfo {
  token: string;
  bienAdresse: string;
}

interface RelanceInfo {
  sequence: number;
  statut: string;
}

interface Props {
  depot: DepotInfo;
  email: string;
  telephone?: string;
  prenomNom?: string;
  docsManquants: string[];
  relance?: RelanceInfo | null;
  onClose: () => void;
  onSent: () => void;
}

export default function RelanceCandidatModal({
  depot,
  email,
  telephone,
  prenomNom,
  docsManquants,
  relance,
  onClose,
  onSent,
}: Props) {
  const nextSeq = relance
    ? Math.min((relance.sequence || 0) + 1, 3) as 1 | 2 | 3
    : 1 as 1 | 2 | 3;

  const [sequence, setSequence] = useState<1 | 2 | 3>(nextSeq);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const lienDepot = `${baseUrl}/depot/${depot.token}`;

  const templateParams: ParamsTemplate = {
    prenomNom,
    bienAdresse: depot.bienAdresse,
    lienDepot,
    docsManquants,
  };

  const tpl = getTemplate(sequence, templateParams);

  const handleSend = async () => {
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/relances/candidat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depotToken: depot.token,
          email,
          telephone,
          sequence,
          prenomNom,
          docsManquants,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }
      onSent();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const seqLabels = [
    { value: 1, label: 'J+1 — Rappel doux', color: 'bg-emerald-100 text-emerald-700' },
    { value: 2, label: 'J+3 — Relance urgente', color: 'bg-amber-100 text-amber-700' },
    { value: 3, label: 'J+7 — Dernière chance', color: 'bg-red-100 text-red-700' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              Relancer le candidat
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">Destinataire</p>
              <p className="text-sm font-semibold text-slate-800">{prenomNom || email}</p>
              <p className="text-xs text-slate-400">{email}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">Bien concerné</p>
              <p className="text-sm text-slate-700">{depot.bienAdresse}</p>
            </div>

            {docsManquants.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">Documents manquants ({docsManquants.length})</p>
                <div className="flex flex-wrap gap-1">
                  {docsManquants.map((d) => (
                    <span key={d} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">Niveau de relance</p>
              <div className="flex gap-2">
                {seqLabels.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSequence(s.value)}
                    className={`flex-1 text-[11px] font-bold px-2 py-2 rounded-xl transition-all ${
                      sequence === s.value
                        ? `${s.color} ring-2 ring-offset-1 ring-current`
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-slate-500">Sujet</p>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Eye className="w-3 h-3" />
                  {showPreview ? 'Masquer' : 'Prévisualiser'}
                </button>
              </div>
              <p className="text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">{tpl.sujet}</p>
            </div>

            {showPreview && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Aperçu email</p>
                </div>
                <div
                  className="p-4 text-sm max-h-64 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: tpl.corps }}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg font-medium">{error}</div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-colors disabled:opacity-40"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Envoyer la relance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
