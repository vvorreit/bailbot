"use client";

import { useState, useRef, useCallback } from "react";
import { X, Loader2, Check, PenTool } from "lucide-react";
import { createSignatureRequest } from "@/app/actions/signature";

interface Props {
  documentType: "bail" | "edl";
  documentId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SignatureModal({ documentType, documentId, onClose, onSuccess }: Props) {
  const [signataire, setSignataire] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signataire.trim() || !email.trim()) return;
    setLoading(true);
    setError("");
    try {
      await createSignatureRequest(documentType, documentId, signataire.trim(), email.trim());
      setSent(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <PenTool className="w-5 h-5 text-emerald-600" />
            Demander une signature
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-slate-900 mb-1">Lien de signature envoye</p>
            <p className="text-xs text-slate-500">Un email a ete envoye a {email}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Nom du signataire</label>
              <input
                type="text"
                value={signataire}
                onChange={(e) => setSignataire(e.target.value)}
                placeholder="Jean Dupont"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean@exemple.fr"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Envoyer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
