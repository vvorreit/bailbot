'use client';

import { useState } from 'react';
import { X, TrendingUp, FileText, Copy, Check, AlertCircle, Info } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import {
  calculerRevisionLoyer,
  genererTexteCourrierRevision,
  genererPDFCourrierRevision,
  IRL_DERNIERE_MAJ,
  type ResultatRevisionLoyer,
} from '@/lib/revision-loyer';
import { FeatureGate } from './FeatureGate';
import { UpgradePrompt } from './UpgradePrompt';

const STORAGE_KEY = 'bailbot_infos_bailleur';

function loadInfosBailleur() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { nomBailleur: '', villeSignature: '' };
}

interface Props {
  onClose: () => void;
}

export default function RevisionLoyerModal({ onClose }: Props) {
  const trapRef = useFocusTrap(true);

  // Infos bailleur
  const [nomBailleur, setNomBailleur] = useState(() => loadInfosBailleur().nomBailleur || '');
  const [nomLocataire, setNomLocataire] = useState('');
  const [villeSignature, setVilleSignature] = useState(() => loadInfosBailleur().villeSignature || '');

  // Infos bail
  const [loyerActuel, setLoyerActuel] = useState('');
  const [charges, setCharges] = useState('0');
  const [dateSignature, setDateSignature] = useState('');
  const [dateRevision, setDateRevision] = useState('');

  // Résultat
  const [resultat, setResultat] = useState<ResultatRevisionLoyer | null>(null);
  const [erreur, setErreur] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCalculer = () => {
    setErreur('');
    setResultat(null);

    const loyer = parseFloat(loyerActuel);
    if (!loyer || loyer <= 0) {
      setErreur('Veuillez saisir un loyer actuel valide.');
      return;
    }

    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateSignature || !dateRegex.test(dateSignature)) {
      setErreur('Veuillez saisir la date de signature au format JJ/MM/AAAA.');
      return;
    }

    if (dateRevision && !dateRegex.test(dateRevision)) {
      setErreur('Date de révision invalide (format JJ/MM/AAAA).');
      return;
    }

    try {
      const res = calculerRevisionLoyer(loyer, dateSignature, dateRevision || undefined);
      setResultat(res);
    } catch (err: any) {
      setErreur(err.message || 'Erreur de calcul. Vérifiez les données.');
    }
  };

  const buildInfosCourrier = () => ({
    nomBailleur: nomBailleur || 'Le Bailleur',
    nomLocataire: nomLocataire || 'Le Locataire',
    villeSignature: villeSignature || 'Paris',
    dateSignature,
    loyerActuel: parseFloat(loyerActuel),
    charges: parseFloat(charges) || 0,
    resultat: resultat!,
  });

  const handleCopier = async () => {
    if (!resultat) return;
    const texte = genererTexteCourrierRevision(buildInfosCourrier());
    await navigator.clipboard.writeText(texte);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePDF = () => {
    if (!resultat) return;
    const blob = genererPDFCourrierRevision(buildInfosCourrier());
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revision_loyer_${new Date().getFullYear()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const inputClass = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div ref={trapRef} role="dialog" aria-modal="true" className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
              <TrendingUp className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Révision IRL</h2>
              <p className="text-xs text-slate-500">Calcul de révision annuelle du loyer</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info IRL */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>Données IRL INSEE à jour jusqu'au <strong>{IRL_DERNIERE_MAJ}</strong>. Actualiser si nécessaire.</span>
          </div>

          {/* Infos bail */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-800">📋 Informations du bail</h3>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Loyer actuel hors charges (€) *</label>
              <input
                type="number"
                placeholder="750"
                value={loyerActuel}
                onChange={(e) => setLoyerActuel(e.target.value)}
                className={inputClass}
                min={0}
                step={0.01}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Charges (€)</label>
              <input
                type="number"
                placeholder="80"
                value={charges}
                onChange={(e) => setCharges(e.target.value)}
                className={inputClass}
                min={0}
                step={0.01}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Date de signature du bail *</label>
              <input
                type="text"
                placeholder="JJ/MM/AAAA"
                value={dateSignature}
                onChange={(e) => setDateSignature(e.target.value)}
                className={inputClass}
                maxLength={10}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Date de révision (optionnel — défaut : anniversaire)</label>
              <input
                type="text"
                placeholder="JJ/MM/AAAA"
                value={dateRevision}
                onChange={(e) => setDateRevision(e.target.value)}
                className={inputClass}
                maxLength={10}
              />
            </div>
          </div>

          {/* Infos pour le courrier */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-800">✉️ Pour le courrier (optionnel)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Bailleur</label>
                <input
                  type="text"
                  placeholder="Jean Dupont"
                  value={nomBailleur}
                  onChange={(e) => setNomBailleur(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Locataire</label>
                <input
                  type="text"
                  placeholder="Marie Martin"
                  value={nomLocataire}
                  onChange={(e) => setNomLocataire(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Ville (signature)</label>
              <input
                type="text"
                placeholder="Paris"
                value={villeSignature}
                onChange={(e) => setVilleSignature(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Erreur */}
          {erreur && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              {erreur}
            </div>
          )}

          {/* ILC / ILAT — indices pro */}
          <FeatureGate feature="REVISION_ILC_ILAT" fallback={
            <UpgradePrompt feature="REVISION_ILC_ILAT" className="py-3" />
          }>
            <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                <strong>Indices ILC / ILAT disponibles</strong> — pour les baux commerciaux et professionnels.
                Sélectionnez l&apos;indice adapté dans les paramètres du bail.
              </span>
            </div>
          </FeatureGate>

          {/* Bouton calculer */}
          <button
            onClick={handleCalculer}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black py-3 rounded-xl transition-colors"
          >
            Calculer la révision
          </button>

          {/* Résultat */}
          {resultat && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-black text-emerald-900">✅ Résultat de la révision</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-emerald-100">
                    <p className="text-xs text-emerald-700 font-semibold mb-1">IRL référence ({resultat.trimestreReference})</p>
                    <p className="text-lg font-black text-slate-900">{resultat.irlReference}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-emerald-100">
                    <p className="text-xs text-emerald-700 font-semibold mb-1">IRL nouveau ({resultat.trimestreNouveau})</p>
                    <p className="text-lg font-black text-slate-900">{resultat.irlNouveau}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-600">Nouveau loyer HC</span>
                    <span className="text-2xl font-black text-emerald-700">{resultat.nouveauLoyer.toFixed(2)} €</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Variation</span>
                    <span className={`text-sm font-bold ${resultat.variation >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {resultat.variation >= 0 ? '+' : ''}{resultat.variation.toFixed(2)}% ({resultat.augmentation >= 0 ? '+' : ''}{resultat.augmentation.toFixed(2)} €)
                    </span>
                  </div>
                  {parseFloat(charges) > 0 && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <span className="text-xs text-slate-500">Loyer CC (avec charges)</span>
                      <span className="text-sm font-bold text-slate-700">{(resultat.nouveauLoyer + (parseFloat(charges) || 0)).toFixed(2)} €</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-2">Applicable à compter du {resultat.dateApplication}</p>
                </div>
              </div>

              {/* Actions courrier */}
              <div className="flex gap-3">
                <button
                  onClick={handleCopier}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                  {copied ? 'Copié !' : 'Copier le courrier'}
                </button>
                <button
                  onClick={handlePDF}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-colors"
                >
                  <FileText className="w-4 h-4" aria-hidden="true" />
                  PDF courrier
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
