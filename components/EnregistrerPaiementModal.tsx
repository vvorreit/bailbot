'use client';

import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { creerPaiement, listerPaiements, type Bien } from '@/lib/db-local';

interface Props {
  biens: Bien[];
  moisDefaut: string;
  onClose: () => void;
  onSaved: () => void;
}

function getMoisLabel(mois: string): string {
  const [year, month] = mois.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
}

export default function EnregistrerPaiementModal({ biens, moisDefaut, onClose, onSaved }: Props) {
  const [bienId, setBienId] = useState(biens[0]?.id ?? '');
  const [mois, setMois] = useState(moisDefaut);
  const [locataireNom, setLocataireNom] = useState('');
  const [locatairePrenom, setLocatairePrenom] = useState('');
  const [locataireEmail, setLocataireEmail] = useState('');
  const [loyerCC, setLoyerCC] = useState('');
  const [statut, setStatut] = useState<'paye' | 'attendu' | 'partiel' | 'retard' | 'impaye'>('attendu');
  const [dateReelle, setDateReelle] = useState('');
  const [montantRecu, setMontantRecu] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [modeGenerer, setModeGenerer] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);

  const bienSelectionne = biens.find((b) => b.id === bienId);

  // Pré-remplir le loyer depuis le bien sélectionné
  const loyerAuto = bienSelectionne ? (bienSelectionne.loyer + bienSelectionne.charges) : null;

  const handleSave = async () => {
    if (!bienId || !locataireNom || !loyerCC) return;
    setLoading(true);
    try {
      const [year, month] = mois.split('-');
      const dateAttendue = new Date(parseInt(year), parseInt(month) - 1, 1).getTime();

      await creerPaiement({
        bienId,
        locataireNom,
        locatairePrenom,
        locataireEmail: locataireEmail || undefined,
        loyerCC: parseFloat(loyerCC),
        dateAttendue,
        dateReelle: dateReelle ? new Date(dateReelle).getTime() : undefined,
        statut,
        montantRecu: montantRecu ? parseFloat(montantRecu) : undefined,
        mois,
        notes: notes || undefined,
      });
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  const handleGenererMois = async () => {
    if (biens.length === 0) return;
    setLoading(true);
    setGenMsg(null);
    try {
      const [year, month] = mois.split('-');
      const dateAttendue = new Date(parseInt(year), parseInt(month) - 1, 1).getTime();

      // Vérifie les doublons existants pour ce mois
      const existants = await listerPaiements(undefined, mois);
      const existantsBienIds = new Set(existants.map((p) => p.bienId));

      const biensFiltres = biens.filter((b) => !existantsBienIds.has(b.id));
      if (biensFiltres.length === 0) {
        setGenMsg(`Les entrées de ${getMoisLabel(mois)} existent déjà pour tous les biens.`);
        return;
      }

      for (const bien of biensFiltres) {
        await creerPaiement({
          bienId: bien.id,
          locataireNom: 'Locataire',
          locatairePrenom: '',
          loyerCC: bien.loyer + bien.charges,
          dateAttendue,
          statut: 'attendu',
          mois,
        });
      }
      const skipped = biens.length - biensFiltres.length;
      if (skipped > 0) {
        setGenMsg(`${biensFiltres.length} entrée(s) créée(s). ${skipped} bien(s) déjà enregistré(s) ignoré(s).`);
        // Petit délai pour lire le message avant de fermer
        setTimeout(() => onSaved(), 1800);
      } else {
        onSaved();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Enregistrer un paiement</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Génération automatique */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Génération automatique du mois
            </p>
            <p className="text-xs text-emerald-700 mb-3">
              Crée une entrée "attendu" pour chaque bien actif ({biens.length} bien{biens.length > 1 ? 's' : ''}) pour le mois sélectionné.
            </p>
            <div className="flex items-center gap-3">
              <select
                value={mois}
                onChange={(e) => setMois(e.target.value)}
                className="flex-1 border border-emerald-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const now = new Date();
                  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                  const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                  return <option key={val} value={val}>{getMoisLabel(val)}</option>;
                })}
              </select>
              <button
                onClick={handleGenererMois}
                disabled={loading}
                className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Génération…' : 'Générer'}
              </button>
            </div>
            {genMsg && (
              <p className="text-xs text-amber-700 font-semibold mt-2">{genMsg}</p>
            )}
          </div>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="mx-3 text-xs text-slate-400 font-medium">ou manuellement</span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Bien */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Bien</label>
            <select
              value={bienId}
              onChange={(e) => setBienId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {biens.map((b) => (
                <option key={b.id} value={b.id}>{b.adresse}</option>
              ))}
            </select>
          </div>

          {/* Mois */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Mois concerné</label>
            <select
              value={mois}
              onChange={(e) => setMois(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const now = new Date();
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                return <option key={val} value={val}>{getMoisLabel(val)}</option>;
              })}
            </select>
          </div>

          {/* Locataire */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Prénom</label>
              <input
                type="text"
                value={locatairePrenom}
                onChange={(e) => setLocatairePrenom(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Jean"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Nom *</label>
              <input
                type="text"
                value={locataireNom}
                onChange={(e) => setLocataireNom(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Dupont"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Email locataire (optionnel)</label>
            <input
              type="email"
              value={locataireEmail}
              onChange={(e) => setLocataireEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="jean.dupont@email.com"
            />
          </div>

          {/* Loyer */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Loyer CC *
              {loyerAuto && (
                <button
                  type="button"
                  onClick={() => setLoyerCC(String(loyerAuto))}
                  className="ml-2 text-emerald-600 underline hover:text-emerald-800"
                >
                  Utiliser {loyerAuto}€
                </button>
              )}
            </label>
            <input
              type="number"
              value={loyerCC}
              onChange={(e) => setLoyerCC(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="1200"
              required
            />
          </div>

          {/* Statut */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Statut</label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value as typeof statut)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="attendu">Attendu</option>
              <option value="paye">Payé</option>
              <option value="partiel">Partiel</option>
              <option value="retard">En retard</option>
              <option value="impaye">Impayé</option>
            </select>
          </div>

          {/* Date paiement (si payé ou partiel) */}
          {(statut === 'paye' || statut === 'partiel') && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Date de paiement</label>
              <input
                type="date"
                value={dateReelle}
                onChange={(e) => setDateReelle(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          )}

          {/* Montant reçu (si partiel) */}
          {statut === 'partiel' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Montant reçu (€)</label>
              <input
                type="number"
                value={montantRecu}
                onChange={(e) => setMontantRecu(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="600"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              placeholder="Remarques, références…"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !bienId || !locataireNom || !loyerCC}
            className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-colors disabled:opacity-40"
          >
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
