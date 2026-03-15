'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Mail } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { genererQuittancePDF, type DonneesQuittance } from '@/lib/generateur-quittance';

interface Props {
  // Données optionnelles pré-remplies depuis le contexte appelant
  nomLocataire?: string;
  prenomLocataire?: string;
  adresseBien?: string;
  loyerHC?: number;
  charges?: number;
  onClose: () => void;
}

const STORAGE_KEY_BAILLEUR = 'bailbot_infos_bailleur';
const STORAGE_KEY_DOSSIER = 'bailbot_dossier_actif';

interface InfosBailleur {
  nomBailleur: string;
  adresseBailleur: string;
}

function loadInfosBailleur(): InfosBailleur {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_BAILLEUR);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        nomBailleur: parsed.nomBailleur || '',
        adresseBailleur: parsed.adresseBailleur || '',
      };
    }
  } catch {}
  return { nomBailleur: '', adresseBailleur: '' };
}

function saveInfosBailleur(infos: InfosBailleur) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_BAILLEUR) || '{}');
    localStorage.setItem(STORAGE_KEY_BAILLEUR, JSON.stringify({ ...existing, ...infos }));
  } catch {}
}

function getMoisCourant(): string {
  return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function getDateAujourdhui(): string {
  return new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getPeriodeMois(moisLabel: string): { debut: string; fin: string } {
  // moisLabel ex: "mars 2026"
  const moisFr: Record<string, number> = {
    janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
    juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
  };
  const parts = moisLabel.toLowerCase().split(' ');
  const moisNom = parts[0];
  const annee = parseInt(parts[1] || String(new Date().getFullYear()));
  const moisIndex = moisFr[moisNom] ?? new Date().getMonth();

  const debut = new Date(annee, moisIndex, 1);
  const fin = new Date(annee, moisIndex + 1, 0);

  const jourDebut = debut.getDate() === 1 ? '1er' : String(debut.getDate());
  const debutStr = `${jourDebut} ${moisNom} ${annee}`;
  const finStr = `${fin.getDate()} ${moisNom} ${annee}`;

  return { debut: debutStr, fin: finStr };
}

// Générer la liste des 12 derniers mois + mois courant
function getMoisDisponibles(): string[] {
  const mois: string[] = [];
  const now = new Date();
  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    mois.push(d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
  }
  return mois;
}

export default function QuittanceModal({
  nomLocataire = '',
  prenomLocataire = '',
  adresseBien = '',
  loyerHC = 0,
  charges = 0,
  onClose,
}: Props) {
  const [infos, setInfos] = useState<InfosBailleur>({ nomBailleur: '', adresseBailleur: '' });
  const [locNom, setLocNom] = useState(nomLocataire);
  const [locPrenom, setLocPrenom] = useState(prenomLocataire);
  const [adresse, setAdresse] = useState(adresseBien);
  const [loyerHCVal, setLoyerHCVal] = useState(loyerHC);
  const [chargesVal, setChargesVal] = useState(charges);
  const [moisSelectionne, setMoisSelectionne] = useState(getMoisCourant());
  const [dateReglement, setDateReglement] = useState(getDateAujourdhui());
  const [modePaiement, setModePaiement] = useState('virement bancaire');
  const [generating, setGenerating] = useState(false);

  const trapRef = useFocusTrap(true);
  const moisDisponibles = getMoisDisponibles();

  useEffect(() => {
    // Charger infos bailleur
    const bailleur = loadInfosBailleur();
    setInfos(bailleur);

    // Charger dossier actif depuis localStorage si pas de props
    try {
      const dossierRaw = localStorage.getItem(STORAGE_KEY_DOSSIER);
      if (dossierRaw) {
        const dossier = JSON.parse(dossierRaw);
        if (!nomLocataire && dossier.nom) setLocNom(dossier.nom);
        if (!prenomLocataire && dossier.prenom) setLocPrenom(dossier.prenom);
        if (!adresseBien && dossier.adresseBien) setAdresse(dossier.adresseBien);
        if (!loyerHC && dossier.loyerHC) setLoyerHCVal(dossier.loyerHC);
        if (!charges && dossier.charges) setChargesVal(dossier.charges);
      }
    } catch {}
  }, []);

  const buildDonnees = (): DonneesQuittance => {
    const periode = getPeriodeMois(moisSelectionne);
    return {
      nomBailleur: infos.nomBailleur,
      adresseBailleur: infos.adresseBailleur,
      nomLocataire: locNom,
      prenomLocataire: locPrenom,
      adresseBien: adresse,
      loyerHC: loyerHCVal,
      charges: chargesVal,
      mois: moisSelectionne,
      dateReglement,
      modePaiement,
      periodeDebut: periode.debut,
      periodeFin: periode.fin,
    };
  };

  const handleTelecharger = () => {
    setGenerating(true);
    try {
      saveInfosBailleur(infos);
      const blob = genererQuittancePDF(buildDonnees());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const moisSlug = moisSelectionne.replace(/\s+/g, '_');
      a.download = `quittance_${locNom || 'locataire'}_${moisSlug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la génération du PDF.');
    } finally {
      setGenerating(false);
    }
  };

  const handleEnvoyerEmail = () => {
    saveInfosBailleur(infos);
    try {
      const blob = genererQuittancePDF(buildDonnees());
      const reader = new FileReader();
      reader.onload = () => {
        const dataUri = reader.result as string;
        const sujet = encodeURIComponent(`Quittance de loyer — ${moisSelectionne}`);
        const corps = encodeURIComponent(
          `Bonjour,\n\nVeuillez trouver ci-joint votre quittance de loyer pour ${moisSelectionne}.\n\nCordialement,\n${infos.nomBailleur}`
        );
        // mailto avec data URI en pièce jointe (support limité selon client mail)
        window.location.href = `mailto:?subject=${sujet}&body=${corps}&attachment=${dataUri}`;
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la préparation de l\'email.');
    }
  };

  const isValid = infos.nomBailleur && locNom && adresse && loyerHCVal > 0;

  return (
    <div ref={trapRef} role="dialog" aria-modal="true" aria-labelledby="quittance-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 id="quittance-modal-title" className="text-lg font-black text-slate-900">🧾 Quittance de loyer</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Infos bailleur */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-black text-slate-700">👤 Bailleur</h3>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nom du bailleur *</label>
              <input
                type="text"
                value={infos.nomBailleur}
                onChange={(e) => setInfos((p) => ({ ...p, nomBailleur: e.target.value }))}
                placeholder="Jean Dupont"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Adresse bailleur</label>
              <input
                type="text"
                value={infos.adresseBailleur}
                onChange={(e) => setInfos((p) => ({ ...p, adresseBailleur: e.target.value }))}
                placeholder="5 rue des Lilas, Paris 75011"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Infos locataire */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-black text-slate-700">🏠 Locataire & bien</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Prénom locataire</label>
                <input
                  type="text"
                  value={locPrenom}
                  onChange={(e) => setLocPrenom(e.target.value)}
                  placeholder="Marie"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nom locataire *</label>
                <input
                  type="text"
                  value={locNom}
                  onChange={(e) => setLocNom(e.target.value)}
                  placeholder="Martin"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Adresse du bien *</label>
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="12 rue de la Paix, Paris 75002"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Loyer HC (€) *</label>
                <input
                  type="number"
                  value={loyerHCVal || ''}
                  onChange={(e) => setLoyerHCVal(parseFloat(e.target.value) || 0)}
                  placeholder="1000"
                  min="0"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Charges (€)</label>
                <input
                  type="number"
                  value={chargesVal || ''}
                  onChange={(e) => setChargesVal(parseFloat(e.target.value) || 0)}
                  placeholder="150"
                  min="0"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Paramètres quittance */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-black text-slate-700">📅 Paramètres</h3>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mois concerné</label>
              <select
                value={moisSelectionne}
                onChange={(e) => setMoisSelectionne(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {moisDisponibles.map((m) => (
                  <option key={m} value={m}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Date de règlement</label>
              <input
                type="text"
                value={dateReglement}
                onChange={(e) => setDateReglement(e.target.value)}
                placeholder="5 mars 2026"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mode de paiement</label>
              <select
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="virement bancaire">Virement bancaire</option>
                <option value="chèque">Chèque</option>
                <option value="espèces">Espèces</option>
                <option value="prélèvement automatique">Prélèvement automatique</option>
              </select>
            </div>
          </div>

          {/* Total */}
          {loyerHCVal > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
              <p className="text-sm text-emerald-700 font-black">
                Total : {(loyerHCVal + chargesVal).toLocaleString('fr-FR')} €
                <span className="text-xs font-normal ml-2">({loyerHCVal}€ HC + {chargesVal}€ charges)</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center gap-3 rounded-b-2xl flex-wrap">
          <button
            onClick={handleTelecharger}
            disabled={!isValid || generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <FileText aria-hidden="true" className="w-4 h-4" />
            {generating ? '⏳ Génération...' : '📄 Télécharger la quittance'}
          </button>
          <button
            onClick={handleEnvoyerEmail}
            disabled={!isValid}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Mail aria-hidden="true" className="w-4 h-4" />
            📧 Envoyer par email
          </button>
        </div>
      </div>
    </div>
  );
}
