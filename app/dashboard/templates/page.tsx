"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Plus,
  Copy,
  Trash2,
  Edit3,
  RotateCcw,
  Loader2,
  Eye,
} from "lucide-react";
import {
  getTemplates,
  saveTemplate,
  deleteTemplate,
  duplicateTemplate,
  resetTemplates,
  type MessageTemplateDTO as MessageTemplate,
} from "@/app/actions/templates";
import TemplateEditor from "@/components/TemplateEditor";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  RELANCE_LOYER: { label: "Relance loyer", color: "bg-red-100 text-red-700" },
  CONFIRMATION_VISITE: { label: "Visite", color: "bg-blue-100 text-blue-700" },
  REFUS_CANDIDATURE: { label: "Refus", color: "bg-slate-100 text-slate-600" },
  BIENVENUE_LOCATAIRE: { label: "Bienvenue", color: "bg-emerald-100 text-emerald-700" },
  RAPPEL_ECHEANCE: { label: "Rappel", color: "bg-amber-100 text-amber-700" },
  RESTITUTION_DEPOT: { label: "Restitution", color: "bg-purple-100 text-purple-700" },
  AUTRE: { label: "Autre", color: "bg-slate-100 text-slate-500" },
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const t = await getTemplates();
      setTemplates(t);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSave = async (template: MessageTemplate) => {
    await saveTemplate(template);
    setEditorOpen(false);
    setEditingTemplate(null);
    await loadTemplates();
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
    setConfirmDelete(null);
    await loadTemplates();
  };

  const handleDuplicate = async (id: string) => {
    await duplicateTemplate(id);
    await loadTemplates();
  };

  const handleReset = async () => {
    if (!confirm("Réinitialiser tous les modèles par défaut ? Les modèles personnalisés seront perdus.")) return;
    await resetTemplates();
    await loadTemplates();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Mail className="w-7 h-7 text-emerald-600" />
            Modèles de messages
          </h1>
          <p className="text-slate-500 mt-1">Créez et personnalisez vos modèles de communication</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setEditorOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nouveau modèle
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => {
          const typeInfo = TYPE_LABELS[t.type] || TYPE_LABELS.AUTRE;
          return (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-slate-900 truncate">{t.nom}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-2 truncate">Objet : {t.sujet}</p>
                <pre className="text-xs text-slate-500 whitespace-pre-wrap font-sans leading-relaxed line-clamp-3">
                  {t.corps.slice(0, 120)}...
                </pre>
                {t.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {t.variables.map((v) => (
                      <span key={v} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center border-t border-slate-100 divide-x divide-slate-100">
                <button
                  onClick={() => setPreviewTemplate(t)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Aperçu
                </button>
                <button
                  onClick={() => {
                    setEditingTemplate(t);
                    setEditorOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Modifier
                </button>
                <button
                  onClick={() => handleDuplicate(t.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Dupliquer
                </button>
                <button
                  onClick={() => setConfirmDelete(t.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer
                </button>
              </div>

              {/* Confirm delete */}
              {confirmDelete === t.id && (
                <div className="px-5 py-3 bg-red-50 border-t border-red-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-600">Confirmer la suppression ?</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg"
                    >
                      Oui
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1 bg-white text-slate-600 text-xs font-bold rounded-lg border border-slate-200"
                    >
                      Non
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-semibold">Aucun modèle</p>
          <p className="text-sm text-slate-400 mt-1">Créez votre premier modèle ou réinitialisez les modèles par défaut.</p>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900">{previewTemplate.nom}</h2>
              <button onClick={() => setPreviewTemplate(null)} className="p-2 rounded-xl hover:bg-slate-50 text-slate-400">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Objet</p>
              <p className="text-sm font-semibold text-slate-800 mb-4">{previewTemplate.sujet}</p>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Corps</p>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                {previewTemplate.corps}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {editorOpen && (
        <TemplateEditor
          template={editingTemplate}
          onSave={handleSave}
          onClose={() => {
            setEditorOpen(false);
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
}
