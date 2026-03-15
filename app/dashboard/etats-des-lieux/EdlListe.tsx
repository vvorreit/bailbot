'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Loader2, ClipboardList } from 'lucide-react';

interface EdlRow {
  id: string;
  bienId: string;
  type: 'ENTREE' | 'SORTIE';
  date: string;
  pdfUrl: string | null;
  createdAt: string;
}

export default function EdlListe() {
  const [edls, setEdls] = useState<EdlRow[]>([]);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/edl');
      if (res.ok) {
        const data = await res.json();
        setEdls(data.edls ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">États des lieux</h1>
          <p className="text-sm text-slate-500 mt-1">
            Entrées et sorties conformes loi ALUR
          </p>
        </div>
        <button
          onClick={() => alert('Formulaire EDL — bientôt disponible')}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel EDL
        </button>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm">Chargement…</p>
        </div>
      ) : edls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <ClipboardList className="w-12 h-12 mb-4" />
          <p className="text-base font-semibold text-slate-600 mb-1">
            Aucun état des lieux
          </p>
          <p className="text-sm text-slate-400">
            Créez votre premier EDL d&apos;entrée ou de sortie
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
          {edls.map((edl) => (
            <div
              key={edl.id}
              className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    edl.type === 'ENTREE'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {edl.type === 'ENTREE' ? "État des lieux d'entrée" : 'État des lieux de sortie'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bien : {edl.bienId} — {new Date(edl.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  edl.type === 'ENTREE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {edl.type === 'ENTREE' ? 'Entrée' : 'Sortie'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
