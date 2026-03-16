"use client";

import { useState, useEffect } from "react";
import {
  FileText, ChevronDown, ChevronRight, Check, X, Plus, Trash2,
  Copy, Save, BookOpen,
} from "lucide-react";
import {
  getModelesBaux, getModelesDefaut, saveModeleBail, deleteModeleBail,
  type ModeleBailData, type Clause,
} from "@/app/actions/modeles-baux";

const TYPE_LABELS: Record<string, string> = {
  HABITATION_VIDE: "Bail vide",
  HABITATION_MEUBLE: "Bail meublé",
  MOBILITE: "Bail mobilité",
};

const TYPE_COLORS: Record<string, string> = {
  HABITATION_VIDE: "bg-blue-100 text-blue-700",
  HABITATION_MEUBLE: "bg-violet-100 text-violet-700",
  MOBILITE: "bg-amber-100 text-amber-700",
};

export default function ModeleBauxClient() {
  const [defaults, setDefaults] = useState<ModeleBailData[]>([]);
  const [custom, setCustom] = useState<ModeleBailData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModel, setEditingModel] = useState<ModeleBailData | null>(null);
  const [editClauses, setEditClauses] = useState<Clause[]>([]);
  const [editNom, setEditNom] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedClause, setExpandedClause] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getModelesDefaut(), getModelesBaux()])
      .then(([d, c]) => { setDefaults(d); setCustom(c); })
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = (model: ModeleBailData) => {
    setEditingModel(model);
    setEditClauses(model.clauses.map((c) => ({ ...c })));
    setEditNom(model.id.startsWith("default-") ? `${model.nom} (personnalisé)` : model.nom);
    setExpandedClause(null);
  };

  const toggleClause = (id: string) => {
    setEditClauses((prev) =>
      prev.map((c) => c.id === id ? { ...c, active: !c.active } : c)
    );
  };

  const updateClauseText = (id: string, contenu: string) => {
    setEditClauses((prev) =>
      prev.map((c) => c.id === id ? { ...c, contenu } : c)
    );
  };

  const handleSave = async () => {
    if (!editingModel || !editNom.trim()) return;
    setSaving(true);
    try {
      const saved = await saveModeleBail({
        nom: editNom.trim(),
        type: editingModel.type,
        clauses: editClauses,
      });
      setCustom((prev) => [saved, ...prev]);
      setEditingModel(null);
    } catch {
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce modèle personnalisé ?")) return;
    try {
      await deleteModeleBail(id);
      setCustom((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (editingModel) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setEditingModel(null)}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 mb-6"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> Retour aux modèles
        </button>

        <div className="mb-6">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nom du modèle</label>
          <input
            value={editNom}
            onChange={(e) => setEditNom(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div className="mb-4">
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${TYPE_COLORS[editingModel.type] || "bg-slate-100"}`}>
            {TYPE_LABELS[editingModel.type] || editingModel.type}
          </span>
        </div>

        <div className="space-y-2">
          {editClauses.map((clause) => (
            <div key={clause.id} className={`border rounded-xl transition-colors ${clause.active ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"}`}>
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => !clause.obligatoire && toggleClause(clause.id)}
                  disabled={clause.obligatoire}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    clause.active
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-slate-300 bg-white"
                  } ${clause.obligatoire ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {clause.active && <Check className="w-3 h-3" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">{clause.titre}</p>
                    {clause.obligatoire && (
                      <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">OBLIGATOIRE</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setExpandedClause(expandedClause === clause.id ? null : clause.id)}
                  className="p-1 rounded hover:bg-slate-100"
                >
                  {expandedClause === clause.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
              {expandedClause === clause.id && (
                <div className="px-4 pb-4">
                  <textarea
                    value={clause.contenu}
                    onChange={(e) => updateClauseText(clause.id, e.target.value)}
                    rows={4}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-emerald-200 resize-y"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={() => setEditingModel(null)}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !editNom.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-emerald-600" />
            Modèles de baux
          </h1>
          <p className="text-sm text-slate-500 mt-1">Modèles conformes loi ALUR 2023 — personnalisez les clauses pour vos baux</p>
        </div>
      </div>

      {/* Default templates */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Modèles de base</h2>
        <div className="grid gap-3">
          {defaults.map((model) => (
            <div key={model.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <p className="text-sm font-bold text-slate-800">{model.nom}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[model.type]}`}>
                      {TYPE_LABELS[model.type]}
                    </span>
                    <span className="text-xs text-slate-400">
                      {model.clauses.filter((c) => c.obligatoire).length} obligatoires, {model.clauses.filter((c) => !c.obligatoire).length} optionnelles
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(model)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Personnaliser
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom templates */}
      {custom.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Mes modèles personnalisés</h2>
          <div className="grid gap-3">
            {custom.map((model) => (
              <div key={model.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      <p className="text-sm font-bold text-slate-800">{model.nom}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[model.type]}`}>
                        {TYPE_LABELS[model.type]}
                      </span>
                      <span className="text-xs text-slate-400">
                        {model.clauses.filter((c) => c.active).length} clauses actives
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(model)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg"
                    >
                      <Copy className="w-3.5 h-3.5" /> Dupliquer
                    </button>
                    <button
                      onClick={() => handleDelete(model.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
