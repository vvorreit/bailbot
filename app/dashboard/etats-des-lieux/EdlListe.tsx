'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  FileText,
  Loader2,
  ClipboardList,
  Download,
  Copy,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import {
  listerEdls,
  dupliquerEdl,
  supprimerEdl,
  type EdlLocal,
} from '@/lib/db-local';
import { genererEdlPDF, type DonneesEDL } from '@/lib/generateur-edl';

export default function EdlListe() {
  const router = useRouter();
  const [edls, setEdls] = useState<EdlLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listerEdls();
      setEdls(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const handleExportPDF = (edl: EdlLocal) => {
    const donnees: DonneesEDL = {
      type: edl.type,
      date: edl.date,
      adresseBien: edl.adresseBien,
      nomBailleur: edl.nomBailleur,
      nomLocataire: edl.nomLocataire,
      pieces: edl.pieces,
      compteurs: {
        eau: edl.compteurs.eau
          ? `Froide: ${edl.compteurs.eau}${edl.compteurs.eauChaude ? ` / Chaude: ${edl.compteurs.eauChaude}` : ''}`
          : '',
        gaz: edl.compteurs.gaz,
        electricite: edl.compteurs.electricite,
      },
      cles: edl.cles,
      signatureLocataire: edl.signatureLocataire,
      signatureBailleur: edl.signatureBailleur,
    };
    const blob = genererEdlPDF(donnees);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EDL_${edl.type}_${edl.date}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(null);
  };

  const handleDuplicate = async (id: string) => {
    await dupliquerEdl(id);
    await charger();
    setMenuOpen(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet état des lieux ?')) return;
    await supprimerEdl(id);
    await charger();
    setMenuOpen(null);
  };

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
          onClick={() => router.push('/dashboard/etats-des-lieux/nouveau')}
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
          <p className="text-sm text-slate-400 mb-6">
            Créez votre premier EDL d&apos;entrée ou de sortie
          </p>
          <button
            onClick={() => router.push('/dashboard/etats-des-lieux/nouveau')}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer un EDL
          </button>
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
                    {edl.type === 'ENTREE'
                      ? "État des lieux d'entrée"
                      : 'État des lieux de sortie'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {edl.adresseBien || 'Adresse non renseignée'} — {edl.nomLocataire} —{' '}
                    {new Date(edl.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    edl.type === 'ENTREE'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {edl.type === 'ENTREE' ? 'Entrée' : 'Sortie'}
                </span>

                {/* Actions menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === edl.id ? null : edl.id)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {menuOpen === edl.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpen(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-slate-200 shadow-lg py-1 w-44">
                        <button
                          onClick={() => handleExportPDF(edl)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger PDF
                        </button>
                        <button
                          onClick={() => handleDuplicate(edl.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          Dupliquer
                        </button>
                        <button
                          onClick={() => handleDelete(edl.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
