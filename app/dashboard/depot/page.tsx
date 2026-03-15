'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Copy, Download, Trash2, Clock, FileText, Check, Loader2, AlertCircle, Upload } from 'lucide-react';
import CreerLienDepotModal from '@/components/CreerLienDepotModal';
import { importerCle, dechiffrerFichier } from '@/lib/crypto-client';

interface DepotTokenInfo {
  id: string;
  token: string;
  bienAdresse: string;
  message: string | null;
  candidatEmail: string | null;
  expiresAt: string;
  used: boolean;
  createdAt: string;
  _count: { fichiers: number };
}

function formatExpiry(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return '⏰ Expiré';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}min restantes`;
}

export default function DepotDashboardPage() {
  const [tokens, setTokens] = useState<DepotTokenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [recupLoading, setRecupLoading] = useState<string | null>(null);

  const loadTokens = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/depot/liste');
      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTokens(); }, [loadTokens]);

  const getLienComplet = (token: string) => {
    const cleBase64 = localStorage.getItem(`bailbot_depot_cle_${token}`);
    const baseUrl = window.location.origin;
    return cleBase64 ? `${baseUrl}/depot/${token}#cle=${cleBase64}` : `${baseUrl}/depot/${token}`;
  };

  const handleCopy = async (token: string) => {
    const lien = getLienComplet(token);
    await navigator.clipboard.writeText(lien);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDelete = async (token: string) => {
    if (!confirm('Supprimer ce lien et tous ses fichiers ?')) return;
    const res = await fetch(`/api/depot/${token}`, { method: 'DELETE' });
    if (res.ok) setTokens(prev => prev.filter(t => t.token !== token));
    else alert('Erreur lors de la suppression');
  };

  const handleRecuperer = async (token: string) => {
    const cleBase64 = localStorage.getItem(`bailbot_depot_cle_${token}`);
    if (!cleBase64) {
      alert('Clé introuvable dans ce navigateur. Le lien a peut-être été créé sur un autre appareil.');
      return;
    }

    setRecupLoading(token);
    try {
      const cle = await importerCle(cleBase64);
      const res = await fetch(`/api/depot/${token}/fichiers`);
      if (!res.ok) { alert('Erreur récupération des fichiers'); return; }
      const { fichiers } = await res.json();

      if (fichiers.length === 0) { alert('Aucun fichier dans ce dépôt'); return; }

      for (const f of fichiers) {
        const contenuBytes = Uint8Array.from(atob(f.contenuBase64), c => c.charCodeAt(0));
        const decrypted = await dechiffrerFichier(contenuBytes.buffer, cle, f.iv);
        const blob = new Blob([decrypted]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = f.nomOriginal;
        a.click();
        URL.revokeObjectURL(url);
        // Petit délai pour ne pas saturer le navigateur
        await new Promise(r => setTimeout(r, 200));
      }
    } catch (e: any) {
      alert(`Erreur déchiffrement : ${e.message}`);
    } finally {
      setRecupLoading(null);
    }
  };

  const handleCreated = () => {
    setTimeout(loadTokens, 500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Upload className="w-6 h-6 text-emerald-600" />
            Portail de dépôt locataire
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Envoyez un lien sécurisé à vos locataires pour collecter leurs documents.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Créer un lien
        </button>
      </div>

      {/* Info RGPD */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 text-sm text-blue-800 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
        <span>
          Les fichiers sont <strong>chiffrés AES-256 côté navigateur du locataire</strong>. Seule votre clé locale (stockée dans ce navigateur) peut les déchiffrer. Le serveur ne voit jamais vos documents en clair.
        </span>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : tokens.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-500">Aucun lien de dépôt actif</p>
          <p className="text-sm text-slate-400 mt-1">Créez un lien pour commencer à collecter des documents.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Liens actifs ({tokens.length})</h2>
          {tokens.map((t) => {
            const expired = new Date(t.expiresAt) < new Date();
            return (
              <div
                key={t.token}
                className={`bg-white rounded-2xl border shadow-sm p-5 ${expired ? 'border-red-100 opacity-70' : 'border-slate-100'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{t.bienAdresse}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`flex items-center gap-1 text-xs font-medium ${expired ? 'text-red-500' : 'text-amber-600'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        {formatExpiry(t.expiresAt)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <FileText className="w-3.5 h-3.5" />
                        {t._count.fichiers} fichier{t._count.fichiers !== 1 ? 's' : ''} reçu{t._count.fichiers !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {t.candidatEmail && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">📧 {t.candidatEmail}</p>
                    )}
                    {t.message && (
                      <p className="text-xs text-slate-400 mt-1 italic truncate">"{t.message}"</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => handleCopy(t.token)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    {copiedToken === t.token ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedToken === t.token ? 'Copié !' : 'Copier le lien'}
                  </button>

                  {t._count.fichiers > 0 && (
                    <button
                      onClick={() => handleRecuperer(t.token)}
                      disabled={recupLoading === t.token}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50"
                    >
                      {recupLoading === t.token
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Download className="w-3.5 h-3.5" />}
                      Récupérer les fichiers
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(t.token)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <CreerLienDepotModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
