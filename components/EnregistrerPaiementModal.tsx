'use client';

import { useState, useEffect } from 'react';
import { X, Zap, AlertTriangle, Send, Copy, Check } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { creerPaiement, listerPaiements, type Bien } from '@/lib/db-local';
import { useMessageTemplate, interpolerTemplate } from '@/hooks/useMessageTemplate';
import { envoyerRelanceLoyer } from '@/app/actions/envoyer-relance';
import type { MessageTemplateDTO as MessageTemplate } from '@/app/actions/templates';

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
  const trapRef = useFocusTrap(true);

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
      <div ref={trapRef} role="dialog" aria-modal="true" className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Enregistrer un paiement</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Génération automatique */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" aria-hidden="true" />
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

          {/* US 26 — Relance inline si paiement en retard */}
          {(statut === 'retard' || statut === 'impaye') && (
            <RelanceInline
              bienId={bienId}
              mois={mois}
              locataireNom={locataireNom}
              locatairePrenom={locatairePrenom}
              locataireEmail={locataireEmail}
              loyerCC={loyerCC}
              adresse={bienSelectionne?.adresse || ''}
            />
          )}
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

/* ─── Relance Inline (US 26) ─────────────────────────────────────────────── */

function RelanceInline({
  bienId,
  mois,
  locataireNom,
  locatairePrenom,
  locataireEmail,
  loyerCC,
  adresse,
}: {
  bienId: string;
  mois: string;
  locataireNom: string;
  locatairePrenom: string;
  locataireEmail: string;
  loyerCC: string;
  adresse: string;
}) {
  const { templates, getByType, interpoler } = useMessageTemplate();
  const [showComposer, setShowComposer] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [relanceEmail, setRelanceEmail] = useState(locataireEmail);
  const [relanceObjet, setRelanceObjet] = useState('');
  const [relanceCorps, setRelanceCorps] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const variables = {
    nom_locataire: `${locatairePrenom} ${locataireNom}`.trim() || locataireNom,
    adresse: adresse || '[adresse]',
    montant: loyerCC || '[montant]',
    date: getMoisLabel(mois),
  };

  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      const relanceTemplate = getByType('RELANCE_LOYER');
      if (relanceTemplate) {
        setSelectedTemplateId(relanceTemplate.id);
        const { sujet, corps } = interpoler(relanceTemplate, variables);
        setRelanceObjet(sujet);
        setRelanceCorps(corps);
      }
    }
  }, [templates]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      const { sujet, corps } = interpoler(template, variables);
      setRelanceObjet(sujet);
      setRelanceCorps(corps);
    }
  };

  const handleEnvoyer = async () => {
    if (!relanceObjet || !relanceCorps || !relanceEmail) return;
    setSending(true);
    try {
      await envoyerRelanceLoyer({
        bailId: bienId,
        bienId,
        mois,
        emailLocataire: relanceEmail,
        objet: relanceObjet,
        message: relanceCorps,
        templateId: selectedTemplateId || undefined,
        envoyeVia: 'email',
      });
      setSent(true);
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  const handleCopier = async () => {
    const text = `Objet: ${relanceObjet}\n\n${relanceCorps}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (sent) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
        <Check className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
        <p className="text-sm font-bold text-emerald-700">Relance envoyée</p>
      </div>
    );
  }

  if (!showComposer) {
    return (
      <button
        onClick={() => setShowComposer(true)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-sm hover:bg-red-100 transition-colors"
      >
        <AlertTriangle className="w-4 h-4" />
        Envoyer une relance
      </button>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-red-700 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Relance loyer
        </p>
        <button onClick={() => setShowComposer(false)} className="text-red-400 hover:text-red-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Template selector */}
      <div>
        <label className="block text-xs font-bold text-red-600 mb-1">Modèle</label>
        <select
          value={selectedTemplateId}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          <option value="">-- Choisir un modèle --</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.nom}</option>
          ))}
        </select>
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-bold text-red-600 mb-1">Email locataire</label>
        <input
          type="email"
          value={relanceEmail}
          onChange={(e) => setRelanceEmail(e.target.value)}
          className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
          placeholder="email@locataire.fr"
        />
      </div>

      {/* Objet */}
      <div>
        <label className="block text-xs font-bold text-red-600 mb-1">Objet</label>
        <input
          type="text"
          value={relanceObjet}
          onChange={(e) => setRelanceObjet(e.target.value)}
          className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-bold text-red-600 mb-1">Message</label>
        <textarea
          value={relanceCorps}
          onChange={(e) => setRelanceCorps(e.target.value)}
          rows={6}
          className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300 resize-none font-mono"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleEnvoyer}
          disabled={sending || !relanceEmail || !relanceObjet}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          {sending ? 'Envoi…' : 'Envoyer par email'}
        </button>
        <button
          onClick={handleCopier}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-700 font-bold rounded-lg text-sm hover:bg-red-50 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>
    </div>
  );
}
