'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, ArrowUpFromLine, Loader2, Check, X } from 'lucide-react';

export default function MigrationBanner() {
  const [hasLocalData, setHasLocalData] = useState(false);
  const [counts, setCounts] = useState({ biens: 0, paiements: 0, candidatures: 0 });
  const [migrating, setMigrating] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkLocalData();
  }, []);

  async function checkLocalData() {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return;
    if (localStorage.getItem('bailbot_migration_done') === '1') return;

    try {
      const { openDB } = await import('idb');
      const db = await openDB('bailbot-local', 4);
      const biens = await db.getAll('biens');
      const paiements = await db.getAll('paiements');
      const candidatures = await db.getAll('candidatures');
      const total = biens.length + paiements.length + candidatures.length;
      if (total > 0) {
        setCounts({ biens: biens.length, paiements: paiements.length, candidatures: candidatures.length });
        setHasLocalData(true);
      }
    } catch {
      /* IndexedDB vide ou non disponible */
    }
  }

  async function handleMigrate() {
    setMigrating(true);
    setError('');
    try {
      const { openDB } = await import('idb');
      const db = await openDB('bailbot-local', 4);
      const biens = await db.getAll('biens');
      const paiements = await db.getAll('paiements');
      const candidatures = await db.getAll('candidatures');

      const res = await fetch('/api/migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biens, paiements, candidatures }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la migration');
      }

      localStorage.setItem('bailbot_migration_done', '1');
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setMigrating(false);
    }
  }

  if (!hasLocalData || dismissed) return null;

  if (done) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <Check className="w-5 h-5 text-emerald-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-emerald-800">Migration terminée</p>
          <p className="text-xs text-emerald-600">
            {counts.biens} bien(s), {counts.paiements} paiement(s) et {counts.candidatures} candidature(s) migrés vers le cloud.
          </p>
        </div>
        <button onClick={() => setDismissed(true)} className="p-1 hover:bg-emerald-100 rounded-lg">
          <X className="w-4 h-4 text-emerald-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-bold text-amber-800">Données locales détectées</p>
          <p className="text-xs text-amber-700 mt-1">
            Vous avez <strong>{counts.biens} bien(s)</strong>, <strong>{counts.paiements} paiement(s)</strong> et{' '}
            <strong>{counts.candidatures} candidature(s)</strong> stockés uniquement dans ce navigateur.
            Ces données seront perdues si vous changez de machine.
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Migrez-les vers le cloud pour y accéder depuis n&apos;importe quel appareil.
          </p>
          {error && <p className="text-xs text-red-600 font-bold mt-2">{error}</p>}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {migrating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpFromLine className="w-3.5 h-3.5" />}
              {migrating ? 'Migration en cours…' : 'Migrer vers le cloud'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-2 text-xs font-bold text-amber-600 hover:text-amber-800"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
