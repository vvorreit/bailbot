'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Building2, Upload, CheckCircle2, Clock, AlertCircle, Shield, FileText, Loader2 } from 'lucide-react';
import { importerCle, chiffrerFichier } from '@/lib/crypto-client';

interface DepotInfo {
  bienAdresse: string;
  message: string | null;
  expiresAt: string;
  used: boolean;
}

interface FichierStatus {
  name: string;
  taille: number;
  status: 'pending' | 'encrypting' | 'uploading' | 'done' | 'error';
  error?: string;
}

function formatExpiry(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expiré';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}min`;
}

function formatTaille(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function genererNomRenomme(nomOriginal: string, bienAdresse: string): string {
  const ext = nomOriginal.split('.').pop() || '';
  const base = nomOriginal.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${base}_${ts}.${ext}`;
}

export default function DepotPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<DepotInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cle, setCle] = useState<CryptoKey | null>(null);
  const [fichiers, setFichiers] = useState<FichierStatus[]>([]);
  const [valide, setValide] = useState(false);
  const [expiry, setExpiry] = useState('');
  const [dragging, setDragging] = useState(false);
  const [candidatEmail, setCandidatEmail] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Récupérer la clé depuis le fragment #cle=...
    const hash = window.location.hash;
    const match = hash.match(/#cle=(.+)/);
    if (match) {
      importerCle(match[1]).then(setCle).catch(() => setError('Clé invalide dans le lien'));
    }

    // Récupérer les infos du token
    fetch(`/api/depot/${token}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) { setError(data.error || 'Lien invalide'); return; }
        setInfo(data);
      })
      .catch(() => setError('Impossible de charger les informations'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!info) return;
    const update = () => setExpiry(formatExpiry(info.expiresAt));
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [info]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    if (!cle) { alert('Clé de chiffrement manquante dans le lien'); return; }
    const arr = Array.from(files);

    for (const file of arr) {
      const nom = file.name;
      const taille = file.size;

      setFichiers(prev => [...prev, { name: nom, taille, status: 'encrypting' }]);

      try {
        const { contenuChiffre, iv } = await chiffrerFichier(file, cle);

        setFichiers(prev => prev.map(f => f.name === nom ? { ...f, status: 'uploading' } : f));

        const nomRenomme = genererNomRenomme(nom, info?.bienAdresse || '');
        const form = new FormData();
        form.append('fichier', new Blob([contenuChiffre]), nom);
        form.append('iv', iv);
        form.append('nomOriginal', nom);
        form.append('nomRenomme', nomRenomme);

        const res = await fetch(`/api/depot/${token}/upload`, { method: 'POST', body: form });
        if (!res.ok) {
          const err = await res.json();
          setFichiers(prev => prev.map(f => f.name === nom ? { ...f, status: 'error', error: err.error } : f));
        } else {
          setFichiers(prev => prev.map(f => f.name === nom ? { ...f, status: 'done' } : f));
        }
      } catch (e: any) {
        setFichiers(prev => prev.map(f => f.name === nom ? { ...f, status: 'error', error: e.message } : f));
      }
    }
  }, [cle, token, info]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files);
  };

  const handleValider = async () => {
    const done = fichiers.filter(f => f.status === 'done').length;
    if (done === 0) { alert('Veuillez déposer au moins un document'); return; }
    if (!candidatEmail) { alert('Veuillez saisir votre adresse email'); return; }

    try {
      await fetch(`/api/depot/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidatEmail }),
      });
    } catch {}

    setValide(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Lien invalide</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (valide) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Dépôt validé</h1>
          <p className="text-slate-500">
            Vos documents ont été transmis de manière chiffrée. Le propriétaire va les traiter sous peu.
          </p>
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 font-semibold">
            Votre dossier a été envoyé avec succès. Nous vous recontactons sous 48h.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-black text-slate-900">BailBot</span>
          <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Chiffrement AES-256
          </span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-5">
        {/* Info du bien */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h1 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Dépôt de documents
          </h1>
          <p className="text-slate-700 font-semibold">{info?.bienAdresse}</p>
          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-amber-600 font-medium">Expire dans {expiry}</span>
          </div>
          {info?.message && (
            <div className="mt-4 bg-slate-50 rounded-xl p-3 text-sm text-slate-600 italic border border-slate-100">
              "{info.message}"
            </div>
          )}
          {!cle && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              ⚠️ Clé de chiffrement manquante. Utilisez le lien complet fourni par le propriétaire.
            </div>
          )}
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
          }`}
        >
          <Upload className={`w-8 h-8 mx-auto mb-3 ${dragging ? 'text-emerald-500' : 'text-slate-400'}`} />
          <p className="font-semibold text-slate-700">Déposez vos documents ici</p>
          <p className="text-sm text-slate-400 mt-1">CNI, bulletins de salaire, avis d'imposition, RIB</p>
          <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG — 10 Mo max par fichier</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>

        {/* Liste des fichiers */}
        {fichiers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Documents déposés</h2>
            {fichiers.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                {f.status === 'done' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                {(f.status === 'encrypting' || f.status === 'uploading') && (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
                )}
                {f.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
                {f.status === 'pending' && <FileText className="w-5 h-5 text-slate-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{f.name}</p>
                  <p className="text-xs text-slate-400">
                    {formatTaille(f.taille)}
                    {f.status === 'encrypting' && ' — chiffrement…'}
                    {f.status === 'uploading' && ' — envoi…'}
                    {f.status === 'error' && ` — ${f.error}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Email candidat */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <label className="block text-sm font-bold text-slate-700 mb-2">Votre adresse email *</label>
          <input
            type="email"
            value={candidatEmail}
            onChange={(e) => setCandidatEmail(e.target.value)}
            placeholder="votre.email@exemple.com"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-xs text-slate-400 mt-1.5">Pour vous recontacter en cas de besoin.</p>
        </div>

        {/* Mention RGPD */}
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-sm text-emerald-800">
          <Shield className="w-5 h-5 mt-0.5 shrink-0 text-emerald-600" />
          <p>
            <strong>Vos documents sont chiffrés dans votre navigateur avant envoi.</strong>{' '}
            Personne ne peut les lire en transit — ni BailBot, ni des tiers. Seul le propriétaire peut les déchiffrer.
          </p>
        </div>

        {/* Bouton valider */}
        <button
          onClick={handleValider}
          disabled={fichiers.filter(f => f.status === 'done').length === 0 || !candidatEmail}
          className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ✅ Valider mon dépôt
        </button>
      </div>
    </div>
  );
}
