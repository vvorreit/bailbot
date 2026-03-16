"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Plus, Trash2, X } from "lucide-react";
import { getGarants, addGarant, removeGarant } from "@/app/actions/garants";

interface Garant {
  id: string;
  bailId: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  typeGarantie: string;
  revenus: number | null;
  employeur: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  PHYSIQUE: "Personne physique",
  MORAL: "Personne morale",
  VISALE: "Garantie Visale",
  CAUTIONNEMENT_BANCAIRE: "Cautionnement bancaire",
};

const TYPE_COLORS: Record<string, string> = {
  PHYSIQUE: "bg-blue-100 text-blue-700",
  MORAL: "bg-purple-100 text-purple-700",
  VISALE: "bg-emerald-100 text-emerald-700",
  CAUTIONNEMENT_BANCAIRE: "bg-amber-100 text-amber-700",
};

export default function GarantsSection({ bailId }: { bailId: string }) {
  const [garants, setGarants] = useState<Garant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [typeGarantie, setTypeGarantie] = useState<"PHYSIQUE" | "MORAL" | "VISALE" | "CAUTIONNEMENT_BANCAIRE">("PHYSIQUE");
  const [revenus, setRevenus] = useState("");
  const [employeur, setEmployeur] = useState("");

  const load = () => {
    setLoading(true);
    getGarants(bailId)
      .then((data) => setGarants(data as Garant[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [bailId]);

  const handleAdd = async () => {
    if (!nom.trim()) return;
    setSaving(true);
    try {
      await addGarant({
        bailId,
        nom: nom.trim(),
        prenom: prenom.trim() || undefined,
        email: email.trim() || undefined,
        telephone: telephone.trim() || undefined,
        typeGarantie,
        revenus: revenus ? parseFloat(revenus) : undefined,
        employeur: employeur.trim() || undefined,
      });
      setNom(""); setPrenom(""); setEmail(""); setTelephone("");
      setTypeGarantie("PHYSIQUE"); setRevenus(""); setEmployeur("");
      setShowForm(false);
      load();
    } catch {
      alert("Erreur lors de l'ajout du garant");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Supprimer ce garant ?")) return;
    try {
      await removeGarant(id);
      load();
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-sm text-slate-400">Chargement des garants...</div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Garants / Cautionnaires
          {garants.length > 0 && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{garants.length}</span>
          )}
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        )}
      </div>

      {garants.length === 0 && !showForm && (
        <p className="text-xs text-slate-400">Aucun garant enregistré pour ce bail.</p>
      )}

      {garants.map((g) => (
        <div key={g.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-800">
                {g.prenom ? `${g.prenom} ${g.nom}` : g.nom}
              </p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[g.typeGarantie] || "bg-slate-100 text-slate-600"}`}>
                {TYPE_LABELS[g.typeGarantie] || g.typeGarantie}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              {g.email && <span>{g.email}</span>}
              {g.telephone && <span>{g.telephone}</span>}
              {g.revenus && <span>{g.revenus.toLocaleString("fr-FR")} €/mois</span>}
            </div>
          </div>
          <button onClick={() => handleRemove(g.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">Nouveau garant</p>
            <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-slate-100">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom *" className="col-span-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
            <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" className="col-span-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="col-span-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
            <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone" className="col-span-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
          </div>

          <select
            value={typeGarantie}
            onChange={(e) => setTypeGarantie(e.target.value as typeof typeGarantie)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="PHYSIQUE">Personne physique</option>
            <option value="MORAL">Personne morale</option>
            <option value="VISALE">Garantie Visale</option>
            <option value="CAUTIONNEMENT_BANCAIRE">Cautionnement bancaire</option>
          </select>

          <div className="grid grid-cols-2 gap-3">
            <input value={revenus} onChange={(e) => setRevenus(e.target.value)} placeholder="Revenus mensuels (€)" type="number" className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
            <input value={employeur} onChange={(e) => setEmployeur(e.target.value)} placeholder="Employeur" className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
              Annuler
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !nom.trim()}
              className="px-4 py-1.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
            >
              {saving ? "Ajout..." : "Ajouter"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
