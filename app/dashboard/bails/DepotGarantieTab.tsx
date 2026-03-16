"use client";

import { useState, useEffect } from "react";
import { Shield, AlertTriangle, Check, Loader2, X } from "lucide-react";
import { getDepotsGarantie, restituerDepotGarantie } from "@/app/actions/depot-garantie";

export default function DepotGarantieTab() {
  const [depots, setDepots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restitutionModal, setRestitutionModal] = useState<string | null>(null);

  useEffect(() => {
    getDepotsGarantie()
      .then(setDepots)
      .catch(() => setDepots([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (depots.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
        <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-600 mb-1">Aucun depot de garantie</p>
        <p className="text-xs text-slate-400">Les depots de garantie de vos baux apparaitront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {depots.map((d) => (
        <div key={d.id} className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">{d.locataireNom}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Bien : {d.bienId}</p>
            </div>
            <div className="flex items-center gap-2">
              {d.delaiDepasse && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  Delai depasse
                </span>
              )}
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  d.statut === "restitue"
                    ? "bg-emerald-100 text-emerald-700"
                    : d.statut === "a_restituer"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {d.statut === "restitue" ? "Restitue" : d.statut === "a_restituer" ? "A restituer" : "En cours"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Montant</p>
              <p className="text-sm font-black text-slate-900">{d.montant?.toLocaleString("fr-FR")} EUR</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Delai legal</p>
              <p className="text-sm font-bold text-slate-700">{d.delaiLegalJours} jours</p>
            </div>
            {d.dateSortie && (
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Date sortie</p>
                <p className="text-sm font-bold text-slate-700">{new Date(d.dateSortie).toLocaleDateString("fr-FR")}</p>
              </div>
            )}
            {d.restitue != null && (
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Restitue</p>
                <p className="text-sm font-black text-emerald-600">{d.restitue.toLocaleString("fr-FR")} EUR</p>
              </div>
            )}
          </div>

          {d.deductions && Array.isArray(d.deductions) && d.deductions.length > 0 && (
            <div className="mt-3 bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Deductions</p>
              {d.deductions.map((ded: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{ded.motif}</span>
                  <span className="font-bold text-slate-900">{ded.montant?.toLocaleString("fr-FR")} EUR</span>
                </div>
              ))}
            </div>
          )}

          {d.statut === "a_restituer" && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => setRestitutionModal(d.id)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Enregistrer la restitution
              </button>
            </div>
          )}

          {restitutionModal === d.id && (
            <RestitutionModal
              depot={d}
              onClose={() => setRestitutionModal(null)}
              onSaved={() => {
                setRestitutionModal(null);
                getDepotsGarantie().then(setDepots).catch(() => {});
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function RestitutionModal({
  depot,
  onClose,
  onSaved,
}: {
  depot: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [montant, setMontant] = useState(depot.montant?.toString() || "");
  const [deductions, setDeductions] = useState<{ motif: string; montant: number }[]>([]);
  const [saving, setSaving] = useState(false);

  const totalDeductions = deductions.reduce((sum, d) => sum + d.montant, 0);
  const montantRestitue = (parseFloat(montant) || 0) - totalDeductions;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await restituerDepotGarantie(depot.id, montantRestitue, deductions);
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
          <h2 className="text-lg font-black text-slate-900">Restitution du depot</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Montant initial (EUR)</label>
            <input
              type="number"
              step="0.01"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-600">Deductions</label>
              <button
                type="button"
                onClick={() => setDeductions([...deductions, { motif: "", montant: 0 }])}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                + Ajouter
              </button>
            </div>
            {deductions.map((d, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Motif"
                  value={d.motif}
                  onChange={(e) => {
                    const copy = [...deductions];
                    copy[i].motif = e.target.value;
                    setDeductions(copy);
                  }}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="EUR"
                  value={d.montant || ""}
                  onChange={(e) => {
                    const copy = [...deductions];
                    copy[i].montant = parseFloat(e.target.value) || 0;
                    setDeductions(copy);
                  }}
                  className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-right"
                />
                <button
                  type="button"
                  onClick={() => setDeductions(deductions.filter((_, j) => j !== i))}
                  className="p-1.5 text-slate-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-emerald-50 rounded-xl p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-700">Montant a restituer</span>
              <span className="font-black text-emerald-700">{montantRestitue.toLocaleString("fr-FR")} EUR</span>
            </div>
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
              Confirmer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
