"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { updatePassword, exportUserData } from "./actions";
import { Download } from "lucide-react";

export default function AccountPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwStatus, setPwStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    const result = await exportUserData();
    setExportLoading(false);
    if (result.error || !result.data) return alert(result.error ?? "Erreur lors de l'export.");

    const blob = new Blob([result.data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bailbot-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus(null);
    if (pwForm.next !== pwForm.confirm) {
      setPwStatus({ type: "error", msg: "Les mots de passe ne correspondent pas." });
      return;
    }
    setPwLoading(true);
    const result = await updatePassword(pwForm.current, pwForm.next);
    setPwStatus(result.error
      ? { type: "error", msg: result.error }
      : { type: "success", msg: "Mot de passe mis à jour." }
    );
    if (!result.error) setPwForm({ current: "", next: "", confirm: "" });
    setPwLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

        <h1 className="text-2xl font-black text-slate-900">Mon compte</h1>

        {/* Infos */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8 space-y-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Informations</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">Nom</p>
              <p className="text-slate-900 font-semibold">{user?.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">Email</p>
              <p className="text-slate-900 font-semibold">{user?.email || "—"}</p>
            </div>
          </div>
        </div>

        {/* Changer mot de passe — uniquement pour les comptes credentials */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Changer le mot de passe</h2>

          {pwStatus && (
            <div className={`mb-5 p-4 rounded-2xl text-sm font-semibold ${
              pwStatus.type === "success"
                ? "bg-green-50 border border-green-100 text-green-700"
                : "bg-red-50 border border-red-100 text-red-600"
            }`}>
              {pwStatus.msg}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Mot de passe actuel</label>
              <input
                type="password"
                required
                value={pwForm.current}
                onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={8}
                value={pwForm.next}
                onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                placeholder="8 caractères minimum"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                required
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={pwLoading}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pwLoading ? "Mise à jour..." : "Mettre à jour"}
            </button>
          </form>
        </div>

        {/* Export RGPD */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Mes données personnelles</h2>
          <p className="text-sm font-medium text-slate-500 mb-5">
            Conformément à l'<strong>article 20 du RGPD</strong>, vous pouvez télécharger l'ensemble de vos données personnelles détenues par BailBot au format JSON.
          </p>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {exportLoading ? "Préparation..." : "Télécharger mes données"}
          </button>
          <p className="text-xs text-slate-400 font-medium mt-3">
            Données incluses : profil, abonnement, utilisation, équipe, fournisseurs OAuth connectés. Les données sensibles (mot de passe, tokens) sont exclues.
          </p>
        </div>

      </div>
    </main>
  );
}
