'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Mail, CheckCircle2 } from 'lucide-react';
import { type Paiement, type Bien, ajouterRelance } from '@/lib/db-local';
import {
  ETAPES_RELANCE,
  getProchainEtape,
  genererTextRelance,
  type EtapeRelance,
} from '@/lib/relances-impaye';

interface Props {
  paiement: Paiement;
  bien?: Bien;
  onClose: () => void;
  onSaved: () => void;
}

const ETAPE_COLORS = {
  1: 'bg-blue-50 text-blue-700 border-blue-200',
  2: 'bg-amber-50 text-amber-700 border-amber-200',
  3: 'bg-orange-50 text-orange-700 border-orange-200',
  4: 'bg-red-50 text-red-700 border-red-200',
};

export default function RelanceModal({ paiement, bien, onClose, onSaved }: Props) {
  const prochainEtape = getProchainEtape(paiement);
  const [etapeSelectionnee, setEtapeSelectionnee] = useState<EtapeRelance>(
    prochainEtape ?? ETAPES_RELANCE[0]
  );
  const [texteObjet, setTexteObjet] = useState('');
  const [texteCorps, setTexteCorps] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [methode, setMethode] = useState<'email' | 'sms' | 'courrier' | 'lrar'>('email');

  // Infos bailleur (stub — à relier à un profil en prod)
  const infoBailleur = {
    nom: 'Le Bailleur',
    adresse: bien?.adresse ?? '',
    iban: '',
    ville: 'Paris',
  };

  useEffect(() => {
    const { objet, corps } = genererTextRelance(etapeSelectionnee, paiement, infoBailleur);
    setTexteObjet(objet);
    setTexteCorps(corps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapeSelectionnee, paiement.id]);

  const handleCopier = async () => {
    const full = `Objet: ${texteObjet}\n\n${texteCorps}`;
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOuvrirMail = () => {
    const mailto = `mailto:${paiement.locataireEmail ?? ''}?subject=${encodeURIComponent(texteObjet)}&body=${encodeURIComponent(texteCorps)}`;
    window.open(mailto, '_blank');
  };

  const handleMarquerEnvoyee = async () => {
    setLoading(true);
    try {
      await ajouterRelance(paiement.id, {
        etape: etapeSelectionnee.numero,
        envoyeeAt: Date.now(),
        methode,
        statut: 'envoyee',
      });
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">📧 Envoyer une relance</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Locataire info */}
          <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm">
            <span className="text-slate-500">Locataire : </span>
            <span className="font-bold text-slate-800">{paiement.locatairePrenom} {paiement.locataireNom}</span>
            {paiement.locataireEmail && (
              <span className="text-slate-400 ml-2">— {paiement.locataireEmail}</span>
            )}
            <span className="text-slate-400 ml-3">•</span>
            <span className="text-slate-500 ml-3">Loyer : </span>
            <span className="font-bold text-slate-800">{paiement.loyerCC.toLocaleString('fr-FR')}€</span>
          </div>

          {/* Sélecteur d'étape */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Étape de relance</label>
            <div className="grid grid-cols-2 gap-2">
              {ETAPES_RELANCE.map((e) => {
                const alreadySent = paiement.relances.some((r) => r.etape === e.numero);
                return (
                  <button
                    key={e.numero}
                    onClick={() => setEtapeSelectionnee(e)}
                    className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                      etapeSelectionnee.numero === e.numero
                        ? `${ETAPE_COLORS[e.numero]} border-current`
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300'
                    } ${alreadySent ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-xs font-black">Étape {e.numero}</span>
                      {alreadySent && <span className="ml-auto text-[10px] font-bold text-emerald-600">✓ Envoyée</span>}
                    </div>
                    <span className="text-xs font-semibold mt-0.5">{e.nom}</span>
                    <span className="text-[10px] opacity-70 mt-0.5">{e.action}</span>
                  </button>
                );
              })}
            </div>
            {prochainEtape && (
              <p className="text-xs text-emerald-700 font-semibold mt-2">
                ✨ Étape recommandée : {prochainEtape.nom}
              </p>
            )}
          </div>

          {/* Objet */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Objet</label>
            <input
              type="text"
              value={texteObjet}
              onChange={(e) => setTexteObjet(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Corps */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Corps du message</label>
            <textarea
              value={texteCorps}
              onChange={(e) => setTexteCorps(e.target.value)}
              rows={10}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>

          {/* Méthode d'envoi */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Méthode d'envoi</label>
            <div className="flex gap-2 flex-wrap">
              {(['email', 'sms', 'courrier', 'lrar'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors ${
                    methode === m
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {m === 'email' && '📧 '}
                  {m === 'sms' && '📱 '}
                  {m === 'courrier' && '✉️ '}
                  {m === 'lrar' && '📮 '}
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopier}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-100 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié !' : 'Copier le texte'}
            </button>
            {paiement.locataireEmail && (
              <button
                onClick={handleOuvrirMail}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-xl text-sm hover:bg-blue-100 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Ouvrir dans Mail
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleMarquerEnvoyee}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Enregistrement…' : 'Marquer comme envoyée'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
