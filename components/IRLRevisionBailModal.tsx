'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, Loader2, Bell, BellOff, Check, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { calculerRevisionLoyer, IRL_DERNIERE_MAJ, type ResultatRevisionLoyer } from '@/lib/revision-loyer';
import { updateIRLPreferences, getIRLStatus } from '@/app/actions/irl';

interface Props {
  bailId: string;
  onClose: () => void;
  onApplied?: () => void;
}

export default function IRLRevisionBailModal({ bailId, onClose, onApplied }: Props) {
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [bail, setBail] = useState<{
    loyerMensuel: number;
    dateSignature: Date;
    dateProchRevision: Date;
    indexationIRLActive: boolean;
    indexationIRLJoursAvant: number;
    dernierIRLApplique: number | null;
    derniereLoyerRevise: Date | null;
    locataireNom: string;
    locataireEmail: string;
  } | null>(null);

  const [irlActive, setIrlActive] = useState(false);
  const [joursAvant, setJoursAvant] = useState(30);
  const [resultat, setResultat] = useState<ResultatRevisionLoyer | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getIRLStatus(bailId);
        setBail({
          ...data,
          dateSignature: new Date(data.dateSignature),
          dateProchRevision: new Date(data.dateProchRevision),
          derniereLoyerRevise: data.derniereLoyerRevise ? new Date(data.derniereLoyerRevise) : null,
        });
        setIrlActive(data.indexationIRLActive);
        setJoursAvant(data.indexationIRLJoursAvant);

        const dateStr = new Date(data.dateSignature).toLocaleDateString('fr-FR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
        });
        try {
          const res = calculerRevisionLoyer(data.loyerMensuel, dateStr);
          setResultat(res);
        } catch { /* IRL data might not cover */ }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bailId]);

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    setError('');
    try {
      await updateIRLPreferences(bailId, {
        indexationIRLActive: irlActive,
        indexationIRLJoursAvant: joursAvant,
      });
      setSuccess('Préférences sauvegardées');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleAppliquer = async () => {
    setApplying(true);
    setError('');
    try {
      const res = await fetch('/api/irl/appliquer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bailId, appliquer: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setSuccess(`Loyer révisé : ${data.ancienLoyer.toFixed(2)} € → ${data.nouveauLoyer.toFixed(2)} €. Mail envoyé au locataire.`);
      onApplied?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setApplying(false);
    }
  };

  const handleNotifier = async () => {
    setApplying(true);
    setError('');
    try {
      const res = await fetch('/api/irl/appliquer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bailId, appliquer: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setSuccess('Décision enregistrée (pas de révision appliquée).');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Révision IRL" size="lg" footer={
      <div className="flex gap-2 w-full">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
        >
          Fermer
        </button>
        {resultat && !success.includes('révisé') && (
          <>
            <button
              onClick={handleNotifier}
              disabled={applying}
              className="px-4 py-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Ne pas appliquer
            </button>
            <button
              onClick={handleAppliquer}
              disabled={applying}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Appliquer la révision
            </button>
          </>
        )}
      </div>
    }>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : bail ? (
        <div className="space-y-5 p-1">
          {/* Current Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Loyer actuel</p>
              <p className="text-lg font-black text-slate-900">{bail.loyerMensuel.toFixed(2)} €</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Prochaine révision</p>
              <p className="text-lg font-black text-slate-900">
                {bail.dateProchRevision.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* IRL Calculation Result */}
          {resultat && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Résultat du calcul IRL
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-emerald-100">
                  <p className="text-xs text-emerald-700 font-semibold mb-1">IRL référence ({resultat.trimestreReference})</p>
                  <p className="text-lg font-black text-slate-900">{resultat.irlReference}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-emerald-100">
                  <p className="text-xs text-emerald-700 font-semibold mb-1">Nouvel IRL ({resultat.trimestreNouveau})</p>
                  <p className="text-lg font-black text-slate-900">{resultat.irlNouveau}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-600">Nouveau loyer</span>
                  <span className="text-2xl font-black text-emerald-700">{resultat.nouveauLoyer.toFixed(2)} €</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Variation</span>
                  <span className={`text-sm font-bold ${resultat.variation >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {resultat.variation >= 0 ? '+' : ''}{resultat.variation.toFixed(2)}% ({resultat.augmentation >= 0 ? '+' : ''}{resultat.augmentation.toFixed(2)} €)
                  </span>
                </div>
              </div>
              <p className="text-xs text-emerald-700">
                Données IRL INSEE à jour : <strong>{IRL_DERNIERE_MAJ}</strong>
              </p>
            </div>
          )}

          {!resultat && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
              Impossible de calculer la révision IRL pour ce bail. Les données IRL disponibles ne couvrent peut-être pas la période concernée.
            </div>
          )}

          {/* IRL Auto Preferences */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              {irlActive ? <Bell className="w-4 h-4 text-emerald-600" /> : <BellOff className="w-4 h-4 text-slate-400" />}
              Rappels automatiques IRL
            </h3>

            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={irlActive}
                  onChange={(e) => setIrlActive(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${irlActive ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform mt-1 ${irlActive ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </div>
              <span className="text-sm font-medium text-slate-700">
                Activer les rappels automatiques
              </span>
            </label>

            {irlActive && (
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Nombre de jours avant la date anniversaire</label>
                <input
                  type="number"
                  min={7}
                  max={90}
                  value={joursAvant}
                  onChange={(e) => setJoursAvant(Number(e.target.value))}
                  className="w-32 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            )}

            <button
              onClick={handleSavePrefs}
              disabled={savingPrefs}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Sauvegarder les préférences
            </button>
          </div>

          {/* Previous revision info */}
          {bail.derniereLoyerRevise && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
              Dernière révision : {bail.derniereLoyerRevise.toLocaleDateString('fr-FR')}
              {bail.dernierIRLApplique && ` — IRL appliqué : ${bail.dernierIRLApplique}`}
            </div>
          )}

          {/* Error/Success */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 font-semibold">
              {success}
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-slate-500">Bail introuvable</div>
      )}
    </Modal>
  );
}
