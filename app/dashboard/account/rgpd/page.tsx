"use client";

import { useState } from "react";
import { Download, Trash2, Shield, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { exportAllUserData, deleteUserAccount } from "@/app/actions/rgpd";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function RGPDPage() {
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleExport = async () => {
    setExportLoading(true);
    setStatus(null);
    const result = await exportAllUserData();
    setExportLoading(false);

    if (result.error || !result.data) {
      setStatus({ type: "error", msg: result.error ?? "Erreur lors de l'export." });
      return;
    }

    const blob = new Blob([result.data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bailbot-donnees-completes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus({ type: "success", msg: "Export téléchargé avec succès." });
  };

  const handleDelete = async () => {
    if (deleteText !== "SUPPRIMER") return;
    setDeleteLoading(true);
    setStatus(null);

    const result = await deleteUserAccount();
    setDeleteLoading(false);

    if (result.error) {
      setStatus({ type: "error", msg: result.error });
      return;
    }

    await signOut({ callbackUrl: "/" });
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-black text-slate-900">Mes données & vie privée</h1>
        </div>
        <p className="text-sm text-slate-500 font-medium">
          Conformément au RGPD, vous avez le droit d&apos;accéder à vos données, de les exporter et de demander leur suppression.
        </p>

        {status && (
          <div className={`p-4 rounded-2xl text-sm font-semibold ${
            status.type === "success"
              ? "bg-green-50 border border-green-100 text-green-700"
              : "bg-red-50 border border-red-100 text-red-600"
          }`}>
            {status.msg}
          </div>
        )}

        {/* Informations collectées */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Données collectées</h2>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <p><strong>Compte :</strong> nom, email, téléphone, ville, mot de passe (chiffré)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <p><strong>Profil bailleur :</strong> identité, adresse, SIRET, IBAN (chiffré AES-256)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <p><strong>Biens & baux :</strong> adresses, loyers, informations locataires</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <p><strong>Candidatures :</strong> dossiers, revenus, scores (supprimés après 3 mois)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <p><strong>Paiements :</strong> suivi des loyers (infos bancaires gérées par Stripe)</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50">
            <Link href="/legal/confidentialite" className="text-sm font-bold text-blue-600 hover:underline">
              Voir la politique de confidentialité complète
            </Link>
          </div>
        </div>

        {/* Export des données */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">
            Télécharger mes données
          </h2>
          <p className="text-sm font-medium text-slate-500 mb-5">
            <strong>Article 20 du RGPD</strong> — Exportez l&apos;ensemble de vos données au format JSON :
            profil, biens, baux, paiements, candidatures, quittances, modèles et plus.
          </p>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exportLoading ? "Préparation..." : "Télécharger mes données"}
          </button>
        </div>

        {/* Conservation des données */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
            Durées de conservation
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-600">Candidatures refusées / non traitées</span>
              <span className="font-bold text-slate-900">3 mois</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-600">Données de navigation / analytics</span>
              <span className="font-bold text-slate-900">13 mois</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-600">Comptes inactifs sans bail</span>
              <span className="font-bold text-slate-900">3 ans</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600">Baux (obligation légale)</span>
              <span className="font-bold text-slate-900">10 ans</span>
            </div>
          </div>
        </div>

        {/* Supprimer mon compte */}
        <div className="bg-white rounded-[28px] border border-red-100 shadow-sm p-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-sm font-black text-red-500 uppercase tracking-widest">
              Supprimer mon compte
            </h2>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-2">
            <strong>Article 17 du RGPD</strong> — Droit à l&apos;effacement. Cette action est irréversible.
          </p>
          <ul className="text-xs text-slate-500 space-y-1 mb-5 list-disc pl-4">
            <li>Votre profil sera anonymisé (nom, email, téléphone)</li>
            <li>Vos biens, candidatures, paiements et modèles seront supprimés</li>
            <li>Les baux terminés depuis moins de 10 ans seront conservés (obligation légale)</li>
            <li>Les baux actifs doivent être terminés avant la suppression</li>
          </ul>

          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Demander la suppression
            </button>
          ) : (
            <div className="space-y-3 bg-red-50 border border-red-100 rounded-2xl p-5">
              <p className="text-sm font-bold text-red-700">
                Tapez <span className="font-mono bg-red-100 px-2 py-0.5 rounded">SUPPRIMER</span> pour confirmer :
              </p>
              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="SUPPRIMER"
                className="w-full px-4 py-3 rounded-xl border border-red-200 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleteText !== "SUPPRIMER" || deleteLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleteLoading ? "Suppression..." : "Confirmer la suppression"}
                </button>
                <button
                  onClick={() => { setDeleteConfirm(false); setDeleteText(""); }}
                  className="px-6 py-3 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
