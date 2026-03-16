"use client";

import { useState, useMemo } from "react";
import { X, Eye, Code, Save } from "lucide-react";
import { type MessageTemplateDTO as MessageTemplate } from "@/app/actions/templates";
import { interpolerTemplate } from "@/hooks/useMessageTemplate";

const VARIABLES_DISPONIBLES = [
  { key: "nom_locataire", label: "Nom locataire", exemple: "Jean Dupont" },
  { key: "adresse", label: "Adresse du bien", exemple: "12 rue de la Paix, 75001 Paris" },
  { key: "montant", label: "Montant (EUR)", exemple: "850" },
  { key: "date", label: "Date", exemple: "15 mars 2026" },
  { key: "lien", label: "Lien", exemple: "https://bailbot.fr/locataire/abc123" },
];

const TYPE_OPTIONS = [
  { value: "RELANCE_LOYER", label: "Relance loyer" },
  { value: "CONFIRMATION_VISITE", label: "Confirmation visite" },
  { value: "REFUS_CANDIDATURE", label: "Refus candidature" },
  { value: "BIENVENUE_LOCATAIRE", label: "Bienvenue locataire" },
  { value: "RAPPEL_ECHEANCE", label: "Rappel échéance" },
  { value: "RESTITUTION_DEPOT", label: "Restitution dépôt" },
  { value: "AUTRE", label: "Autre" },
];

interface Props {
  template: MessageTemplate | null;
  onSave: (template: MessageTemplate) => void;
  onClose: () => void;
}

export default function TemplateEditor({ template, onSave, onClose }: Props) {
  const isNew = !template;
  const [nom, setNom] = useState(template?.nom || "");
  const [type, setType] = useState(template?.type || "AUTRE");
  const [sujet, setSujet] = useState(template?.sujet || "");
  const [corps, setCorps] = useState(template?.corps || "");
  const [showPreview, setShowPreview] = useState(false);

  const exemplesVariables = useMemo(() => {
    const map: Record<string, string> = {};
    VARIABLES_DISPONIBLES.forEach((v) => {
      map[v.key] = v.exemple;
    });
    return map;
  }, []);

  const previewSujet = useMemo(() => interpolerTemplate(sujet, exemplesVariables), [sujet, exemplesVariables]);
  const previewCorps = useMemo(() => interpolerTemplate(corps, exemplesVariables), [corps, exemplesVariables]);

  const variablesUtilisees = useMemo(() => {
    const matches = (sujet + corps).match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
  }, [sujet, corps]);

  const handleSave = () => {
    if (!nom || !sujet || !corps) return;
    const t: MessageTemplate = {
      id: template?.id || `custom-${Date.now()}`,
      nom,
      type,
      sujet,
      corps,
      variables: variablesUtilisees,
      createdAt: template?.createdAt || new Date().toISOString(),
    };
    onSave(t);
  };

  const insertVariable = (key: string) => {
    setCorps((prev) => prev + `{{${key}}}`);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">
            {isNew ? "Nouveau modèle" : "Modifier le modèle"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Nom + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Nom du modèle *</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Relance loyer impayé"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sujet */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Objet *</label>
            <input
              type="text"
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              placeholder="Ex: Rappel de paiement — {{adresse}}"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Variables */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Variables disponibles</label>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES_DISPONIBLES.map((v) => (
                <button
                  key={v.key}
                  onClick={() => insertVariable(v.key)}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
                  title={`Insérer {{${v.key}}} — Ex: ${v.exemple}`}
                >
                  {`{{${v.key}}}`}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Preview */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                !showPreview ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Édition
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                showPreview ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Aperçu
            </button>
          </div>

          {/* Corps */}
          {showPreview ? (
            <div className="bg-slate-50 rounded-xl p-4 min-h-[200px]">
              <p className="text-xs font-bold text-slate-400 mb-2">Objet : {previewSujet}</p>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                {previewCorps}
              </pre>
            </div>
          ) : (
            <textarea
              value={corps}
              onChange={(e) => setCorps(e.target.value)}
              rows={10}
              placeholder="Rédigez votre message ici. Utilisez {{variable}} pour les champs dynamiques."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!nom || !sujet || !corps}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-colors disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            {isNew ? "Créer" : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
}
