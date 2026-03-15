'use client';

import { useState, useEffect } from 'react';
import { X, FileSignature, Loader2, Info, Calculator } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { Bien, TypeBail } from '@/lib/db-local';
import {
  detecterVilleEncadrement,
  calculerPlafondLoyer,
  VILLES_ENCADREMENT,
  EPOQUE_LABELS,
  type TypeLocation,
  type EpoqueConstruction,
  type NbPieces,
  type ResultatPlafond,
} from '@/lib/encadrement-loyers';

interface Props {
  biens: Bien[];
  onClose: () => void;
  onCreated: () => void;
}

// ─── Zones tendues (préavis 1 mois) ──────────────────────────────────────────
// Source : décret annuel zones tendues
const VILLES_ZONES_TENDUES = [
  'paris', 'lyon', 'marseille', 'bordeaux', 'toulouse', 'nice', 'nantes',
  'strasbourg', 'grenoble', 'montpellier', 'rennes', 'lille', 'nancy',
  'metz', 'tours', 'angers', 'dijon', 'reims', 'saint-etienne', 'le havre',
  'brest', 'rouen', 'toulon', 'aix-en-provence', 'clermont-ferrand',
  'villeurbanne', 'caen', 'limoges', 'nimes', 'saint-denis', 'argenteuil',
  'montreuil', 'versailles', 'cergy', 'massy', 'vincennes', 'boulogne-billancourt',
  'levallois-perret', 'neuilly-sur-seine', 'courbevoie', 'nanterre',
  'issy-les-moulineaux', 'saint-germain-en-laye', 'pontoise',
];

function isZoneTendue(adresse: string): boolean {
  const lower = adresse.toLowerCase();
  return VILLES_ZONES_TENDUES.some((v) => lower.includes(v));
}

// ─── Calcul préavis légal ─────────────────────────────────────────────────────
function getPreavisLegal(typeBail: TypeBail, adresse: string): { mois: number; raison: string } {
  if (typeBail === 'HABITATION_MEUBLE') {
    return { mois: 1, raison: 'Meublé — préavis légal : 1 mois' };
  }
  if (typeBail === 'PROFESSIONNEL') {
    return { mois: 6, raison: 'Bail professionnel — préavis légal : 6 mois' };
  }
  // HABITATION_VIDE
  if (isZoneTendue(adresse)) {
    return { mois: 1, raison: 'Zone tendue — préavis réduit légalement à 1 mois' };
  }
  return { mois: 3, raison: 'Habitation vide hors zone tendue — préavis légal : 3 mois' };
}

// ─── Calcul date révision IRL ──────────────────────────────────────────────────
function getDateRevisionIRL(dateDebut: string): string {
  if (!dateDebut) return '';
  const d = new Date(dateDebut);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

export default function CreerBailActifModal({ biens, onClose, onCreated }: Props) {
  const trapRef = useFocusTrap(true);
  const bienInitial = biens[0];

  const [form, setForm] = useState({
    bienId: bienInitial?.id || '',
    adresseBien: bienInitial?.adresse || '',
    typeBailBien: (bienInitial?.typeBail || 'HABITATION_VIDE') as TypeBail,
    locataireNom: '',
    locataireEmail: '',
    dateSignature: new Date().toISOString().split('T')[0],
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '',
    dureePreavisMois: '3',
    preavisRaison: 'Habitation vide hors zone tendue — préavis légal : 3 mois',
    loyerMensuel: bienInitial?.loyer?.toString() || '',
    chargesMensuelles: bienInitial?.charges?.toString() || '0',
    indiceRevision: 'IRL',
    dateProchRevision: getDateRevisionIRL(new Date().toISOString().split('T')[0]),
    dateFinDiagnostics: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ─── Encadrement loyers ───────────────────────────────────────────────────
  const [showEncadrement, setShowEncadrement] = useState(false);
  const [encParams, setEncParams] = useState({
    zoneCode: '',
    type: 'vide' as TypeLocation,
    nbPieces: 2 as NbPieces,
    epoque: 'avant_1946' as EpoqueConstruction,
    surface: '',
  });
  const [plafond, setPlafond] = useState<ResultatPlafond | null>(null);

  const villeEncadrement = detecterVilleEncadrement(form.adresseBien);
  const zonesDisponibles = villeEncadrement ? VILLES_ENCADREMENT[villeEncadrement]?.zones ?? [] : [];

  useEffect(() => {
    if (zonesDisponibles.length > 0 && !encParams.zoneCode) {
      setEncParams((prev) => ({ ...prev, zoneCode: zonesDisponibles[0].code }));
    }
  }, [villeEncadrement]);

  useEffect(() => {
    if (!encParams.zoneCode || !encParams.surface || !form.adresseBien) {
      setPlafond(null);
      return;
    }
    const result = calculerPlafondLoyer({
      adresse: form.adresseBien,
      zoneCode: encParams.zoneCode,
      type: encParams.type,
      nbPieces: encParams.nbPieces,
      epoque: encParams.epoque,
      surface: parseFloat(encParams.surface),
    });
    setPlafond(result);
  }, [encParams, form.adresseBien]);

  // Recalcule préavis + révision quand bien ou date changent
  useEffect(() => {
    const preavis = getPreavisLegal(form.typeBailBien, form.adresseBien);
    setForm((prev) => ({
      ...prev,
      dureePreavisMois: String(preavis.mois),
      preavisRaison: preavis.raison,
    }));
  }, [form.typeBailBien, form.adresseBien]);

  const handleBienChange = (bienId: string) => {
    const bien = biens.find((b) => b.id === bienId);
    if (!bien) return;
    const preavis = getPreavisLegal(bien.typeBail, bien.adresse);
    setForm((prev) => ({
      ...prev,
      bienId,
      adresseBien: bien.adresse,
      typeBailBien: bien.typeBail,
      loyerMensuel: bien.loyer?.toString() || prev.loyerMensuel,
      chargesMensuelles: bien.charges?.toString() || '0',
      dureePreavisMois: String(preavis.mois),
      preavisRaison: preavis.raison,
    }));
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Recalcule révision IRL quand dateDebut change
      if (field === 'dateDebut') {
        next.dateProchRevision = getDateRevisionIRL(value);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.bienId || !form.locataireNom || !form.locataireEmail || !form.loyerMensuel || !form.dateProchRevision) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/bails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bienId: form.bienId,
          locataireNom: form.locataireNom,
          locataireEmail: form.locataireEmail,
          dateSignature: form.dateSignature,
          dateDebut: form.dateDebut,
          dateFin: form.dateFin || null,
          dureePreavisMois: form.dureePreavisMois,
          loyerMensuel: form.loyerMensuel,
          chargesMensuelles: form.chargesMensuelles,
          indiceRevision: form.indiceRevision,
          dateProchRevision: form.dateProchRevision,
          dateFinDiagnostics: form.dateFinDiagnostics || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }
      onCreated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={trapRef} role="dialog" aria-modal="true" aria-labelledby="creer-bail-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 id="creer-bail-title" className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileSignature aria-hidden="true" className="w-5 h-5 text-emerald-600" />
            Enregistrer un bail
          </h2>
          <button onClick={onClose} aria-label="Fermer" className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-3">

          {/* Bien */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Bien *</label>
            <select
              value={form.bienId}
              onChange={(e) => handleBienChange(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {biens.map((b) => (
                <option key={b.id} value={b.id}>{b.adresse}</option>
              ))}
            </select>
          </div>

          {/* Adresse auto-remplie (affichage) */}
          {form.adresseBien && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-medium">
              <Info className="w-3.5 h-3.5 shrink-0" />
              {form.adresseBien} — {form.typeBailBien === 'HABITATION_VIDE' ? 'Vide' : form.typeBailBien === 'HABITATION_MEUBLE' ? 'Meublé' : 'Professionnel'}
              {isZoneTendue(form.adresseBien) && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">Zone tendue</span>
              )}
            </div>
          )}

          {/* Locataire */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Nom locataire *</label>
              <input
                type="text"
                value={form.locataireNom}
                onChange={(e) => handleChange('locataireNom', e.target.value)}
                placeholder="Jean Dupont"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Email locataire *</label>
              <input
                type="email"
                value={form.locataireEmail}
                onChange={(e) => handleChange('locataireEmail', e.target.value)}
                placeholder="locataire@email.fr"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Date de signature</label>
              <input
                type="date"
                value={form.dateSignature}
                onChange={(e) => handleChange('dateSignature', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Date de début *</label>
              <input
                type="date"
                value={form.dateDebut}
                onChange={(e) => handleChange('dateDebut', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Date de fin</label>
            <input
              type="date"
              value={form.dateFin}
              onChange={(e) => handleChange('dateFin', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">Vide = bail sans terme fixe</p>
          </div>

          {/* Préavis — auto calculé */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Préavis (mois)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={form.dureePreavisMois}
                onChange={(e) => handleChange('dureePreavisMois', e.target.value)}
                min="1"
                className="w-24 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-xs text-slate-500 italic flex items-center gap-1">
                <Info className="w-3 h-3 text-emerald-500" />
                {form.preavisRaison}
              </span>
            </div>
          </div>

          {/* Loyer + charges */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Loyer mensuel HC (€) *</label>
              <input
                type="number"
                value={form.loyerMensuel}
                onChange={(e) => handleChange('loyerMensuel', e.target.value)}
                placeholder="800"
                step="0.01"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Charges (€)</label>
              <input
                type="number"
                value={form.chargesMensuelles}
                onChange={(e) => handleChange('chargesMensuelles', e.target.value)}
                placeholder="50"
                step="0.01"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Indice + Révision IRL — auto calculée */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Indice de révision</label>
              <select
                value={form.indiceRevision}
                onChange={(e) => handleChange('indiceRevision', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="IRL">IRL (habitation)</option>
                <option value="ILC">ILC (commerce)</option>
                <option value="ILAT">ILAT (activités tertiaires)</option>
                <option value="ICC">ICC (construction)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Prochaine révision *
                <span className="ml-1 text-emerald-500 font-normal">(auto)</span>
              </label>
              <input
                type="date"
                value={form.dateProchRevision}
                onChange={(e) => handleChange('dateProchRevision', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Calculée automatiquement (date début + 1 an)</p>
            </div>
          </div>

          {/* Diagnostics */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Fin validité diagnostics (DPE, etc.)</label>
            <input
              type="date"
              value={form.dateFinDiagnostics}
              onChange={(e) => handleChange('dateFinDiagnostics', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Calculateur loyer plafonné */}
          {villeEncadrement && (
            <div className="border border-amber-200 bg-amber-50 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowEncadrement(!showEncadrement)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <Calculator aria-hidden="true" className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-800">
                    Calculer le loyer maximum légal — {villeEncadrement === 'paris' ? 'Paris' : 'Lyon'} (encadrement actif)
                  </span>
                </div>
                <span className="text-xs text-amber-500">{showEncadrement ? '▲' : '▼'}</span>
              </button>

              {showEncadrement && (
                <div className="px-4 pb-4 space-y-3 border-t border-amber-100">
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {/* Zone */}
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Zone / Quartier</label>
                      <select
                        value={encParams.zoneCode}
                        onChange={(e) => setEncParams((p) => ({ ...p, zoneCode: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        {zonesDisponibles.map((z) => (
                          <option key={z.code} value={z.code}>{z.label} {z.details ? `— ${z.details}` : ''}</option>
                        ))}
                      </select>
                    </div>
                    {/* Type */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                      <select
                        value={encParams.type}
                        onChange={(e) => setEncParams((p) => ({ ...p, type: e.target.value as TypeLocation }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        <option value="vide">Vide</option>
                        <option value="meuble">Meublé</option>
                      </select>
                    </div>
                    {/* Nb pièces */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Pièces</label>
                      <select
                        value={encParams.nbPieces}
                        onChange={(e) => setEncParams((p) => ({ ...p, nbPieces: parseInt(e.target.value) as NbPieces }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        <option value={1}>1 pièce (studio)</option>
                        <option value={2}>2 pièces</option>
                        <option value={3}>3 pièces</option>
                        <option value={4}>4 pièces et +</option>
                      </select>
                    </div>
                    {/* Époque */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Construction</label>
                      <select
                        value={encParams.epoque}
                        onChange={(e) => setEncParams((p) => ({ ...p, epoque: e.target.value as EpoqueConstruction }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        {(Object.keys(EPOQUE_LABELS) as EpoqueConstruction[]).map((k) => (
                          <option key={k} value={k}>{EPOQUE_LABELS[k]}</option>
                        ))}
                      </select>
                    </div>
                    {/* Surface */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Surface (m²)</label>
                      <input
                        type="number"
                        min="5"
                        step="0.5"
                        placeholder="ex: 42"
                        value={encParams.surface}
                        onChange={(e) => setEncParams((p) => ({ ...p, surface: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  {/* Résultat */}
                  {plafond && (
                    <div className="bg-white rounded-xl border border-amber-200 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Loyer de référence</span>
                        <span className="text-sm font-bold text-slate-700">{plafond.loyerRefTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €/mois</span>
                      </div>
                      <div className="flex items-center justify-between bg-red-50 rounded-lg px-2 py-1.5">
                        <span className="text-xs font-bold text-red-700">⚠️ Plafond légal (max +20%)</span>
                        <span className="text-sm font-black text-red-700">{plafond.loyerMaxTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €/mois</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Loyer minoré (plancher)</span>
                        <span className="text-xs text-slate-500">{plafond.loyerMinTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €/mois</span>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        {plafond.refParM2.reference} €/m²/mois (réf.) · {plafond.refParM2.majore} €/m²/mois (plafond) · {plafond.zone.label}
                      </div>
                      {form.loyerMensuel && parseFloat(form.loyerMensuel) > plafond.loyerMaxTotal && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2">
                          <span className="text-red-500 text-sm">🔴</span>
                          <p className="text-xs text-red-700 font-bold">
                            Loyer saisi ({parseFloat(form.loyerMensuel).toLocaleString('fr-FR')} €) dépasse le plafond légal ({plafond.loyerMaxTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €). Risque de litige.
                          </p>
                        </div>
                      )}
                      {form.loyerMensuel && parseFloat(form.loyerMensuel) <= plafond.loyerMaxTotal && (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                          <span>✅</span> Loyer conforme à l&apos;encadrement
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleChange('loyerMensuel', String(plafond.loyerMaxTotal))}
                        className="w-full text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg py-1.5 transition-colors border border-amber-200"
                      >
                        Utiliser le plafond ({plafond.loyerMaxTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />}
            Enregistrer le bail
          </button>
        </div>
      </div>
    </div>
  );
}
