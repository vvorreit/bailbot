"use client";

import { useState, useEffect } from "react";
import { Receipt, Plus, Check, Loader2, X } from "lucide-react";
import { getRegularisations, creerRegularisation, marquerRegularisee } from "@/app/actions/regularisation-charges";

export default function RegularisationTab() {
  const [regularisations, setRegularisations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    getRegularisations()
      .then(setRegularisations)
      .catch(() => setRegularisations([]))
      .finally(() => setLoading(false));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{regularisations.length} regularisation{regularisations.length > 1 ? "s" : ""}</p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle regularisation
        </button>
      </div>

      {regularisations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600 mb-1">Aucune regularisation</p>
          <p className="text-xs text-slate-400">Creez votre premiere regularisation de charges annuelles</p>
        </div>
      ) : (
        <div className="space-y-4">
          {regularisations.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Regularisation {r.annee}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Bien : {r.bienId}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    r.statut === "regularise"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {r.statut === "regularise" ? "Regularise" : "En cours"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Charges reelles</p>
                  <p className="text-sm font-black text-slate-900">{r.chargesReelles?.toLocaleString("fr-FR")} EUR</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Provisions mensuelles</p>
                  <p className="text-sm font-bold text-slate-700">{r.provisionsMensuelles?.toLocaleString("fr-FR")} EUR</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Total provisions</p>
                  <p className="text-sm font-bold text-slate-700">{r.totalProvisions?.toLocaleString("fr-FR")} EUR</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Solde</p>
                  <p className={`text-sm font-black ${r.solde >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {r.solde >= 0 ? "+" : ""}{r.solde?.toLocaleString("fr-FR")} EUR
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {r.solde >= 0 ? "Trop percu par le locataire" : "Complement a demander"}
                  </p>
                </div>
              </div>

              {r.statut !== "regularise" && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={async () => {
                      await marquerRegularisee(r.id);
                      load();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Marquer comme regularise
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <RegularisationForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function RegularisationForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [bienId, setBienId] = useState("");
  const [annee, setAnnee] = useState(new Date().getFullYear() - 1);
  const [chargesReelles, setChargesReelles] = useState("");
  const [provisionsMensuelles, setProvisionsMensuelles] = useState("");
  const [saving, setSaving] = useState(false);

  const totalProvisions = (parseFloat(provisionsMensuelles) || 0) * 12;
  const solde = totalProvisions - (parseFloat(chargesReelles) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bienId.trim()) return;
    setSaving(true);
    try {
      await creerRegularisation({
        bienId: bienId.trim(),
        annee,
        chargesReelles: parseFloat(chargesReelles) || 0,
        provisionsMensuelles: parseFloat(provisionsMensuelles) || 0,
      });
      onSaved();
    } catch {
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Nouvelle regularisation</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">ID du bien</label>
            <input
              type="text"
              value={bienId}
              onChange={(e) => setBienId(e.target.value)}
              placeholder="ID du bien"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Annee</label>
            <input
              type="number"
              value={annee}
              onChange={(e) => setAnnee(parseInt(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Charges reelles (EUR/an)</label>
              <input
                type="number"
                step="0.01"
                value={chargesReelles}
                onChange={(e) => setChargesReelles(e.target.value)}
                placeholder="2400"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Provisions (EUR/mois)</label>
              <input
                type="number"
                step="0.01"
                value={provisionsMensuelles}
                onChange={(e) => setProvisionsMensuelles(e.target.value)}
                placeholder="200"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Total provisions (12 mois)</span>
              <span className="font-bold text-slate-700">{totalProvisions.toLocaleString("fr-FR")} EUR</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-bold text-slate-700">Solde</span>
              <span className={`font-black ${solde >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {solde >= 0 ? "+" : ""}{solde.toLocaleString("fr-FR")} EUR
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {solde >= 0 ? "Trop percu : a rembourser au locataire" : "Complement a demander au locataire"}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Creer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
