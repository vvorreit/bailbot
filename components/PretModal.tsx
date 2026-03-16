"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { genererTableauAmortissement } from "@/lib/amortissement";
import { createPret } from "@/app/actions/pret";
import { Landmark, Calculator } from "lucide-react";

interface Props {
  bienId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function PretModal({ bienId, open, onClose, onCreated }: Props) {
  const [nom, setNom] = useState("Pret principal");
  const [capital, setCapital] = useState("");
  const [taux, setTaux] = useState("");
  const [dureeAnnees, setDureeAnnees] = useState("");
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [assurance, setAssurance] = useState("");
  const [fraisDossier, setFraisDossier] = useState("");
  const [garantie, setGarantie] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const preview = useMemo(() => {
    const c = parseFloat(capital);
    const t = parseFloat(taux);
    const a = parseFloat(dureeAnnees);
    if (!c || c <= 0 || !t || t <= 0 || !a || a <= 0) return null;

    return genererTableauAmortissement({
      capitalEmprunte: c,
      tauxAnnuelPct: t,
      dureeMois: Math.round(a * 12),
      dateDebut: new Date(dateDebut),
      assuranceMensuelle: parseFloat(assurance) || 0,
      fraisDossier: parseFloat(fraisDossier) || 0,
      garantie: parseFloat(garantie) || 0,
    });
  }, [capital, taux, dureeAnnees, dateDebut, assurance, fraisDossier, garantie]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const c = parseFloat(capital);
    const t = parseFloat(taux);
    const a = parseFloat(dureeAnnees);
    if (!c || !t || !a) {
      setError("Remplissez les champs obligatoires");
      return;
    }
    setSaving(true);
    try {
      await createPret(bienId, {
        nom,
        capitalEmprunte: c,
        tauxAnnuelPct: t,
        dureeMois: Math.round(a * 12),
        dateDebut,
        assuranceMensuelle: parseFloat(assurance) || 0,
        fraisDossier: parseFloat(fraisDossier) || 0,
        garantie: parseFloat(garantie) || 0,
      });
      onCreated();
      onClose();
    } catch {
      setError("Erreur lors de la creation du pret");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajouter un pret immobilier" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Nom du pret</label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Capital emprunte *</label>
            <div className="relative">
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                placeholder="200000"
                step="1000"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">EUR</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Taux annuel *</label>
            <div className="relative">
              <input
                type="number"
                value={taux}
                onChange={(e) => setTaux(e.target.value)}
                placeholder="3.5"
                step="0.01"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Duree (annees) *</label>
            <input
              type="number"
              value={dureeAnnees}
              onChange={(e) => setDureeAnnees(e.target.value)}
              placeholder="20"
              step="1"
              min="1"
              max="35"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Date 1er remboursement *</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Assurance /mois</label>
            <input
              type="number"
              value={assurance}
              onChange={(e) => setAssurance(e.target.value)}
              placeholder="50"
              step="1"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Frais dossier</label>
            <input
              type="number"
              value={fraisDossier}
              onChange={(e) => setFraisDossier(e.target.value)}
              placeholder="1000"
              step="100"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Garantie</label>
            <input
              type="number"
              value={garantie}
              onChange={(e) => setGarantie(e.target.value)}
              placeholder="2000"
              step="100"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Preview en temps reel */}
        {preview && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-black text-emerald-700 uppercase flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5" />
              Apercu
            </h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[10px] font-bold text-emerald-600">Mensualite</p>
                <p className="font-black text-emerald-900">
                  {preview.mensualiteAvecAssurance.toLocaleString("fr-FR")} EUR
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-600">Cout total credit</p>
                <p className="font-black text-emerald-900">
                  {preview.coutTotal.toLocaleString("fr-FR")} EUR
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-600">Total interets</p>
                <p className="font-black text-emerald-900">
                  {preview.totalInterets.toLocaleString("fr-FR")} EUR
                </p>
              </div>
            </div>
            {preview.tauxEffectifGlobalPct > 0 && (
              <p className="text-xs text-emerald-600">
                TEG : {preview.tauxEffectifGlobalPct.toFixed(2)} %
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            <Landmark className="w-4 h-4" />
            {saving ? "Creation..." : "Creer le pret"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
