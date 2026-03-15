'use client';

import { useState } from 'react';
import { X, Copy, Check, QrCode, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { genererCle, exporterCle } from '@/lib/crypto-client';
import AdresseSearch from '@/components/AdresseSearch';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface Props {
  onClose: () => void;
  onCreated?: (token: string) => void;
}

export default function CreerLienDepotModal({ onClose, onCreated }: Props) {
  const [bienAdresse, setBienAdresse] = useState('');
  const [message, setMessage] = useState('');
  const [dureeHeures, setDureeHeures] = useState(24);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ lien: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const trapRef = useFocusTrap(true);

  const handleCreer = async () => {
    if (!bienAdresse) { alert('Adresse du bien requise'); return; }
    setLoading(true);
    try {
      // Générer la clé côté client
      const cle = await genererCle();
      const cleBase64 = await exporterCle(cle);

      // Créer le token via API
      const res = await fetch('/api/depot/creer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bienAdresse, message: message || undefined, dureeHeures }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur création');

      // Construire le lien avec la clé dans le fragment
      const lienComplet = `${data.lien}#cle=${cleBase64}`;

      // Stocker la clé localement pour pouvoir déchiffrer plus tard
      localStorage.setItem(`bailbot_depot_cle_${data.token}`, cleBase64);

      setResult({ lien: lienComplet, token: data.token });
      onCreated?.(data.token);
    } catch (e: any) {
      alert(`Erreur : ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.lien);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div ref={trapRef} role="dialog" aria-modal="true" className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-lg">📤 Créer un lien de dépôt</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Adresse du bien</label>
                <AdresseSearch
                  value={bienAdresse}
                  onChange={setBienAdresse}
                  placeholder="12 rue de la Paix, Paris..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Message pour le locataire <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Bonjour, merci de déposer vos documents de dossier..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Durée de validité</label>
                <select
                  value={dureeHeures}
                  onChange={(e) => setDureeHeures(Number(e.target.value))}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value={12}>12 heures</option>
                  <option value={24}>24 heures</option>
                  <option value={48}>48 heures</option>
                </select>
              </div>

              <button
                onClick={handleCreer}
                disabled={loading || !bienAdresse}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Création…</> : '✨ Créer le lien'}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800 font-medium">
                ✅ Lien créé avec succès ! Partagez-le avec le locataire.
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1 font-medium">Lien sécurisé :</p>
                <p className="text-sm font-mono text-slate-700 break-all">{result.lien}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors text-sm"
                >
                  {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                  {copied ? 'Copié !' : 'Copier le lien'}
                </button>
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                  <QrCode className="w-4 h-4" aria-hidden="true" />
                  QR Code
                </button>
              </div>

              {showQr && (
                <div className="flex justify-center p-4 bg-white border border-slate-100 rounded-xl">
                  <QRCodeSVG value={result.lien} size={180} />
                </div>
              )}

              <p className="text-xs text-slate-400 text-center">
                🔐 La clé de déchiffrement est stockée localement. Ne partagez que ce lien — jamais la clé séparément.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
