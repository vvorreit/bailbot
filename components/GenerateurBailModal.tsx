'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Save, AlertCircle, CheckSquare } from 'lucide-react';
import type { DossierLocataire } from '@/lib/parsers';
import { genererBailPDF, calculerDateFin, type DonneesBail } from '@/lib/generateur-bail';
import ChecklistAlur from './ChecklistAlur';

interface Props {
  dossier: Partial<DossierLocataire>;
  loyerHC?: number;
  charges?: number;
  depot?: number;
  onClose: () => void;
}

const STORAGE_KEY = 'bailbot_infos_bailleur';

interface InfosBailleur {
  nomBailleur: string;
  adresseBailleur: string;
  ibanBailleur: string;
  villeSignature: string;
}

function loadInfosBailleur(): InfosBailleur {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { nomBailleur: '', adresseBailleur: '', ibanBailleur: '', villeSignature: '' };
}

function saveInfosBailleur(infos: InfosBailleur) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(infos));
  } catch {}
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-red-500 font-semibold mt-0.5 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" /> {msg}
    </p>
  );
}

export default function GenerateurBailModal({ dossier, loyerHC: loyerHCProp, charges: chargesProp, depot: depotProp, onClose }: Props) {
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'bail' | 'conformite'>('bail');
  const [errors, setErrors] = useState<Partial<Record<keyof DonneesBail, string>>>({});

  // ─── Infos bailleur (localStorage) ────────────────────────────────────────
  const [nomBailleur, setNomBailleur] = useState('');
  const [adresseBailleur, setAdresseBailleur] = useState('');
  const [ibanBailleur, setIbanBailleur] = useState('');
  const [villeSignature, setVilleSignature] = useState('');

  // ─── Infos bien ───────────────────────────────────────────────────────────
  const [adresseBien, setAdresseBien] = useState('');
  const [surface, setSurface] = useState('');
  const [typeBien, setTypeBien] = useState<'appartement' | 'maison'>('appartement');

  // ─── Conditions financières ───────────────────────────────────────────────
  const [loyerHC, setLoyerHC] = useState(loyerHCProp ? String(loyerHCProp) : '');
  const [charges, setCharges] = useState(chargesProp ? String(chargesProp) : '');
  const [depot, setDepot] = useState(depotProp ? String(depotProp) : '');

  // ─── Durée ────────────────────────────────────────────────────────────────
  const [dateEffet, setDateEffet] = useState('');
  const [duree, setDuree] = useState('12');
  const [jourPaiement, setJourPaiement] = useState('1');

  // ─── Options ──────────────────────────────────────────────────────────────
  const [zoneTendue, setZoneTendue] = useState(false);
  const [clauseResolutoire, setClauseResolutoire] = useState(true);
  const [dateSignature, setDateSignature] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  });

  // Charger infos bailleur depuis localStorage
  useEffect(() => {
    const infos = loadInfosBailleur();
    setNomBailleur(infos.nomBailleur);
    setAdresseBailleur(infos.adresseBailleur);
    setIbanBailleur(infos.ibanBailleur);
    setVilleSignature(infos.villeSignature);
  }, []);

  // Pré-remplir IBAN bailleur depuis RIB si disponible
  useEffect(() => {
    if (dossier.iban && !ibanBailleur) {
      // On ne pré-remplit pas l'IBAN bailleur depuis le locataire — différent !
    }
  }, [dossier.iban]);

  const dateFin = dateEffet && duree ? calculerDateFin(dateEffet, parseInt(duree) || 0) : '';
  const loyerCC = (parseFloat(loyerHC) || 0) + (parseFloat(charges) || 0);

  const nomCompletLocataire = [dossier.prenom, dossier.nom].filter(Boolean).join(' ') || '';

  const validate = (): boolean => {
    const errs: Partial<Record<keyof DonneesBail, string>> = {};
    if (!nomBailleur) errs.nomBailleur = 'Requis';
    if (!adresseBailleur) errs.adresseBailleur = 'Requis';
    if (!adresseBien) errs.adresseBien = 'Requis';
    if (!surface || parseFloat(surface) <= 0) errs.surface = 'Surface invalide';
    if (!loyerHC || parseFloat(loyerHC) <= 0) errs.loyerHC = 'Loyer invalide';
    if (!depot || parseFloat(depot) < 0) errs.depot = 'Dépôt invalide';
    if (!dateEffet) errs.dateEffet = 'Date requise';
    if (!duree || parseInt(duree) <= 0) errs.duree = 'Durée invalide';
    if (!jourPaiement || parseInt(jourPaiement) < 1 || parseInt(jourPaiement) > 28) errs.jourPaiement = 'Entre 1 et 28';
    if (!villeSignature) errs.villeSignature = 'Requis';
    if (!dateSignature) errs.dateSignature = 'Requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveInfosBailleur = () => {
    saveInfosBailleur({ nomBailleur, adresseBailleur, ibanBailleur, villeSignature });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGenerer = async () => {
    if (!validate()) return;
    setGenerating(true);
    try {
      const donnees: DonneesBail = {
        nomBailleur,
        adresseBailleur,
        nomLocataire: dossier.nom || '',
        prenomLocataire: dossier.prenom || '',
        dateNaissanceLocataire: dossier.dateNaissance || '',
        adresseActuelle: dossier.adresseActuelle || dossier.adresseDomicile || '',
        adresseBien,
        typeBien,
        surface: parseFloat(surface),
        loyerHC: parseFloat(loyerHC),
        charges: parseFloat(charges) || 0,
        depot: parseFloat(depot),
        dateEffet,
        duree: parseInt(duree),
        jourPaiement: parseInt(jourPaiement),
        zoneTendue,
        clauseResolutoire,
        villeSignature,
        dateSignature,
        ibanBailleur: ibanBailleur || undefined,
        garant: dossier.garant
          ? {
              nom: dossier.garant.nom,
              prenom: dossier.garant.prenom,
              adresse: dossier.garant.adresse || '',
            }
          : undefined,
      };

      const blob = genererBailPDF(donnees);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const nomFichier = `bail_${(dossier.nom || 'locataire').toUpperCase()}_${(dossier.prenom || '').toUpperCase()}.pdf`;
      a.download = nomFichier;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur génération bail:', err);
      alert('Erreur lors de la génération du bail. Vérifiez les données saisies.');
    } finally {
      setGenerating(false);
    }
  };

  const inputClass = (field: keyof DonneesBail) =>
    `w-full border rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white transition-colors ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-200'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Générer le bail</h2>
              <p className="text-xs text-slate-500">Contrat conforme loi ALUR</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 flex gap-2 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('bail')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-t-xl border-b-2 transition-colors ${
              activeTab === 'bail'
                ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Bail
          </button>
          <button
            onClick={() => setActiveTab('conformite')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-t-xl border-b-2 transition-colors ${
              activeTab === 'conformite'
                ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Conformité ALUR
          </button>
        </div>

        {activeTab === 'conformite' && (
          <div className="p-6">
            <ChecklistAlur />
          </div>
        )}

        {activeTab === 'bail' && <div className="p-6 space-y-6">
          {/* Récap locataire */}
          {nomCompletLocataire && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <p className="text-xs font-black text-emerald-800 mb-1">Données pré-remplies depuis le dossier</p>
              <p className="text-sm font-bold text-emerald-900">👤 {nomCompletLocataire}</p>
              {dossier.dateNaissance && <p className="text-xs text-emerald-700">Né(e) le {dossier.dateNaissance}</p>}
              {(dossier.adresseActuelle || dossier.adresseDomicile) && (
                <p className="text-xs text-emerald-700">📍 {dossier.adresseActuelle || dossier.adresseDomicile}</p>
              )}
            </div>
          )}

          {/* Infos bailleur */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800">🏢 Bailleur</h3>
              <button
                onClick={handleSaveInfosBailleur}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  saved ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Save className="w-3 h-3" />
                {saved ? '✓ Sauvegardé !' : 'Sauvegarder infos bailleur'}
              </button>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Nom complet du bailleur *</label>
              <input
                type="text"
                placeholder="Jean Dupont"
                value={nomBailleur}
                onChange={(e) => setNomBailleur(e.target.value)}
                className={inputClass('nomBailleur')}
              />
              <FieldError msg={errors.nomBailleur} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Adresse du bailleur *</label>
              <input
                type="text"
                placeholder="12 rue de la Paix, 75001 Paris"
                value={adresseBailleur}
                onChange={(e) => setAdresseBailleur(e.target.value)}
                className={inputClass('adresseBailleur')}
              />
              <FieldError msg={errors.adresseBailleur} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">IBAN bailleur (pour virement)</label>
              <input
                type="text"
                placeholder="FR76 3000 6000 0112 3456 7890 189"
                value={ibanBailleur}
                onChange={(e) => setIbanBailleur(e.target.value)}
                className={inputClass('ibanBailleur')}
              />
            </div>
          </div>

          {/* Infos bien */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-800">🏠 Bien loué</h3>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Adresse complète du bien *</label>
              <input
                type="text"
                placeholder="24 avenue des Fleurs, 69003 Lyon"
                value={adresseBien}
                onChange={(e) => setAdresseBien(e.target.value)}
                className={inputClass('adresseBien')}
              />
              <FieldError msg={errors.adresseBien} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Type de bien *</label>
                <select
                  value={typeBien}
                  onChange={(e) => setTypeBien(e.target.value as 'appartement' | 'maison')}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                >
                  <option value="appartement">Appartement</option>
                  <option value="maison">Maison</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Surface (m²) *</label>
                <input
                  type="number"
                  placeholder="50"
                  min={1}
                  value={surface}
                  onChange={(e) => setSurface(e.target.value)}
                  className={inputClass('surface')}
                />
                <FieldError msg={errors.surface} />
              </div>
            </div>
          </div>

          {/* Conditions financières */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-800">💶 Conditions financières</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Loyer HC (€) *</label>
                <input
                  type="number"
                  placeholder="750"
                  min={0}
                  value={loyerHC}
                  onChange={(e) => setLoyerHC(e.target.value)}
                  className={inputClass('loyerHC')}
                />
                <FieldError msg={errors.loyerHC} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Charges (€)</label>
                <input
                  type="number"
                  placeholder="80"
                  min={0}
                  value={charges}
                  onChange={(e) => setCharges(e.target.value)}
                  className={inputClass('charges')}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Dépôt garantie (€) *</label>
                <input
                  type="number"
                  placeholder="750"
                  min={0}
                  value={depot}
                  onChange={(e) => setDepot(e.target.value)}
                  className={inputClass('depot')}
                />
                <FieldError msg={errors.depot} />
              </div>
            </div>
            {loyerCC > 0 && (
              <div className="bg-slate-50 rounded-xl px-4 py-2 text-xs font-bold text-slate-700">
                Loyer charges comprises : <span className="text-emerald-600">{loyerCC.toLocaleString('fr-FR')} €</span>
              </div>
            )}
          </div>

          {/* Durée */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-800">📅 Durée du bail</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Date d'entrée (JJ/MM/AAAA) *</label>
                <input
                  type="text"
                  placeholder="01/07/2025"
                  value={dateEffet}
                  onChange={(e) => setDateEffet(e.target.value)}
                  className={inputClass('dateEffet')}
                />
                <FieldError msg={errors.dateEffet} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Durée (mois) *</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={duree}
                  onChange={(e) => setDuree(e.target.value)}
                  className={inputClass('duree')}
                />
                <FieldError msg={errors.duree} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Jour de paiement *</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={jourPaiement}
                  onChange={(e) => setJourPaiement(e.target.value)}
                  className={inputClass('jourPaiement')}
                />
                <FieldError msg={errors.jourPaiement} />
              </div>
            </div>
            {dateFin && (
              <div className="bg-slate-50 rounded-xl px-4 py-2 text-xs font-bold text-slate-700">
                Date de fin de bail : <span className="text-emerald-600">{dateFin}</span>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-800">⚙️ Options</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={zoneTendue}
                  onChange={(e) => setZoneTendue(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Zone tendue</p>
                  <p className="text-xs text-slate-500">Préavis locataire : 1 mois (au lieu de 3)</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clauseResolutoire}
                  onChange={(e) => setClauseResolutoire(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Clause résolutoire</p>
                  <p className="text-xs text-slate-500">En cas de non-paiement du loyer (art. 24 loi 89)</p>
                </div>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Ville de signature *</label>
                <input
                  type="text"
                  placeholder="Lyon"
                  value={villeSignature}
                  onChange={(e) => setVilleSignature(e.target.value)}
                  className={inputClass('villeSignature')}
                />
                <FieldError msg={errors.villeSignature} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Date de signature *</label>
                <input
                  type="text"
                  placeholder="15/06/2025"
                  value={dateSignature}
                  onChange={(e) => setDateSignature(e.target.value)}
                  className={inputClass('dateSignature')}
                />
                <FieldError msg={errors.dateSignature} />
              </div>
            </div>
          </div>

          {/* Garant info */}
          {dossier.garant && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-xs font-black text-blue-800 mb-1">🛡 Garant détecté</p>
              <p className="text-sm font-bold text-blue-900">
                {dossier.garant.prenom} {dossier.garant.nom}
              </p>
              {dossier.garant.adresse && (
                <p className="text-xs text-blue-700">📍 {dossier.garant.adresse}</p>
              )}
              <p className="text-xs text-blue-600 mt-1">Le garant sera inclus dans le contrat.</p>
            </div>
          )}
        </div>}

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center gap-3 rounded-b-2xl">
          <button
            onClick={handleGenerer}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 transition-colors disabled:opacity-60 shadow-sm"
          >
            <FileText className="w-4 h-4" />
            {generating ? '⏳ Génération...' : '📄 Générer le PDF'}
          </button>
          <button
            onClick={handleSaveInfosBailleur}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              saved ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Save className="w-4 h-4" />
            {saved ? '✓ Sauvegardé' : '💾 Sauvegarder infos bailleur'}
          </button>
          <button
            onClick={onClose}
            className="ml-auto text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
