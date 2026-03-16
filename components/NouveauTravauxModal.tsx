"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Wrench, Info } from "lucide-react";
import { createTravaux, getEdlForBien } from "@/app/actions/travaux";
import { listerBiens, type Bien } from "@/lib/db-local";
import { Tooltip } from "@/components/ui/Tooltip";

const CATEGORIE_OPTIONS = [
  { value: "PLOMBERIE", label: "Plomberie" },
  { value: "ELECTRICITE", label: "Électricité" },
  { value: "CHAUFFAGE", label: "Chauffage" },
  { value: "ISOLATION", label: "Isolation" },
  { value: "TOITURE", label: "Toiture" },
  { value: "MENUISERIE", label: "Menuiserie" },
  { value: "PEINTURE", label: "Peinture" },
  { value: "CARRELAGE", label: "Carrelage" },
  { value: "SALLE_DE_BAIN", label: "Salle de bain" },
  { value: "CUISINE", label: "Cuisine" },
  { value: "EXTERIEUR", label: "Extérieur" },
  { value: "AUTRE", label: "Autre" },
];

interface EdlItem {
  id: string;
  type: string;
  date: string;
}

export default function NouveauTravauxModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [biens, setBiens] = useState<Bien[]>([]);
  const [edlList, setEdlList] = useState<EdlItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bienId: "",
    titre: "",
    categorie: "PLOMBERIE",
    description: "",
    dateDebut: "",
    budgetEstime: "",
    deductible: true,
    edlEntreeId: "",
    edlSortieId: "",
  });

  useEffect(() => {
    if (!open) return;
    listerBiens().then((b) => {
      setBiens(b);
      if (b.length > 0 && !form.bienId) {
        setForm((p) => ({ ...p, bienId: b[0].id }));
      }
    });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!form.bienId) { setEdlList([]); return; }
    getEdlForBien(form.bienId).then((edls) => setEdlList(edls as unknown as EdlItem[]));
  }, [form.bienId]);

  function update(field: string, value: string | boolean) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titre.trim() || !form.bienId) return;
    setSaving(true);
    try {
      const created = await createTravaux({
        bienId: form.bienId,
        titre: form.titre,
        categorie: form.categorie,
        description: form.description || undefined,
        dateDebut: form.dateDebut || undefined,
        budgetEstime: form.budgetEstime ? parseFloat(form.budgetEstime) : undefined,
        deductible: form.deductible,
        edlEntreeId: form.edlEntreeId || undefined,
        edlSortieId: form.edlSortieId || undefined,
      });
      onClose();
      router.push(`/dashboard/travaux/${created.id}`);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-black text-slate-900">Nouveau chantier</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Bien */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Bien *</label>
            <select value={form.bienId} onChange={(e) => update("bienId", e.target.value)} required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {biens.length === 0 && <option value="">Aucun bien</option>}
              {biens.map((b) => (
                <option key={b.id} value={b.id}>{b.adresse}</option>
              ))}
            </select>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Titre du chantier *</label>
            <input type="text" value={form.titre} onChange={(e) => update("titre", e.target.value)} required
              placeholder="Rénovation salle de bain"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          {/* Catégorie + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Catégorie *</label>
              <select value={form.categorie} onChange={(e) => update("categorie", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {CATEGORIE_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Date début estimée</label>
              <input type="date" value={form.dateDebut} onChange={(e) => update("dateDebut", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={2}
              placeholder="Détails du chantier..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Budget estimé (€)</label>
            <input type="number" step="0.01" min="0" value={form.budgetEstime} onChange={(e) => update("budgetEstime", e.target.value)}
              placeholder="5000"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          {/* Déductible */}
          <div className="bg-blue-50 rounded-xl p-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={form.deductible} onChange={(e) => update("deductible", e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <div>
                <span className="text-xs font-bold text-slate-700">Déductible fiscalement</span>
                <p className="text-[10px] text-blue-600 mt-0.5">
                  Travaux d&apos;entretien et de réparation = déductibles (régime réel).
                  Travaux d&apos;agrandissement ou de construction = non déductibles.
                </p>
              </div>
            </label>
          </div>

          {/* Lien EDL */}
          {edlList.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Lier à un EDL (optionnel)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">EDL Entrée</label>
                  <select value={form.edlEntreeId} onChange={(e) => update("edlEntreeId", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Aucun</option>
                    {edlList.filter((e) => e.type === "ENTREE").map((e) => (
                      <option key={e.id} value={e.id}>
                        Entrée — {new Date(e.date).toLocaleDateString("fr-FR")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">EDL Sortie</label>
                  <select value={form.edlSortieId} onChange={(e) => update("edlSortieId", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Aucun</option>
                    {edlList.filter((e) => e.type === "SORTIE").map((e) => (
                      <option key={e.id} value={e.id}>
                        Sortie — {new Date(e.date).toLocaleDateString("fr-FR")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={saving || !form.titre.trim() || !form.bienId}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Créer le chantier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
