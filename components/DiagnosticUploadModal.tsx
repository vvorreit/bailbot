"use client";

import { useState, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Upload, AlertTriangle, Calendar, FileText } from "lucide-react";
import {
  DIAGNOSTICS_CONFIG,
  calculerDateExpiration,
  type DiagnosticType,
} from "@/lib/diagnostics-config";
import { upsertDiagnostic } from "@/app/actions/diagnostics-gestion";

interface Props {
  open: boolean;
  onClose: () => void;
  bienId: string;
  type: DiagnosticType;
  existingData?: {
    dateRealisation: string | null;
    dateExpiration: string | null;
    fichierUrl: string | null;
    fichierNom: string | null;
    notes: string | null;
  };
  onSaved: () => void;
}

export default function DiagnosticUploadModal({ open, onClose, bienId, type, existingData, onSaved }: Props) {
  const config = DIAGNOSTICS_CONFIG[type];
  const [dateRealisation, setDateRealisation] = useState(
    existingData?.dateRealisation ? existingData.dateRealisation.slice(0, 10) : ""
  );
  const [dateExpirationOverride, setDateExpirationOverride] = useState(
    existingData?.dateExpiration ? existingData.dateExpiration.slice(0, 10) : ""
  );
  const [fichier, setFichier] = useState<File | null>(null);
  const [notes, setNotes] = useState(existingData?.notes || "");
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const dateExpirationCalculee = dateRealisation
    ? calculerDateExpiration(type, new Date(dateRealisation))
    : null;

  const dateExpirationFinale = dateExpirationOverride
    ? new Date(dateExpirationOverride)
    : dateExpirationCalculee;

  const joursRestants = dateExpirationFinale
    ? Math.ceil((dateExpirationFinale.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setFichier(file);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let fichierUrl = existingData?.fichierUrl ?? null;
      let fichierNom = existingData?.fichierNom ?? null;

      if (fichier) {
        const arrayBuffer = await fichier.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        fichierUrl = `data:application/pdf;base64,${base64}`;
        fichierNom = fichier.name;
      }

      await upsertDiagnostic(bienId, type, {
        dateRealisation: dateRealisation || null,
        dateExpiration: dateExpirationOverride || null,
        fichierUrl,
        fichierNom,
        notes: notes || null,
      });

      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={config.nom}
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !dateRealisation}
            className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Info diagnostic */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-800 font-medium">{config.description}</p>
          <p className="text-xs text-blue-600 mt-1">{config.obligatoire}</p>
          <p className="text-xs text-blue-500 mt-1">Ref: {config.legalRef}</p>
        </div>

        {/* Date realisation */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date de realisation
          </label>
          <input
            type="date"
            value={dateRealisation}
            onChange={(e) => setDateRealisation(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        {/* Date expiration calculee */}
        {dateExpirationFinale && (
          <div className={`rounded-xl p-4 ${joursRestants !== null && joursRestants <= 30 ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 border border-emerald-100"}`}>
            <p className="text-sm font-medium">
              {joursRestants !== null && joursRestants <= 30 && (
                <AlertTriangle className="w-4 h-4 inline mr-1 text-amber-600" />
              )}
              Ce diagnostic sera valide jusqu&apos;au{" "}
              <strong>
                {dateExpirationFinale.toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </strong>
            </p>
            {joursRestants !== null && joursRestants <= 30 && (
              <p className="text-xs text-amber-600 mt-1 font-bold">
                Ce diagnostic expire bientot ({joursRestants} jours restants)
              </p>
            )}
          </div>
        )}

        {!config.validiteAns && !config.validiteMois && dateRealisation && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-800">
              Ce diagnostic a une validite illimitee
            </p>
            <p className="text-xs text-blue-600 mt-1">{config.conseils}</p>
          </div>
        )}

        {/* Override date expiration */}
        {(config.validiteAns || config.validiteMois) && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Date d&apos;expiration (override manuel)
            </label>
            <input
              type="date"
              value={dateExpirationOverride}
              onChange={(e) => setDateExpirationOverride(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Laisser vide pour calcul automatique"
            />
            <p className="text-xs text-slate-400 mt-1">
              Laisser vide pour le calcul automatique (validite: {config.validiteAns ? `${config.validiteAns} ans` : `${config.validiteMois} mois`})
            </p>
          </div>
        )}

        {/* Upload fichier */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            <FileText className="w-4 h-4 inline mr-1" />
            Document PDF
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
              dragOver ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
            }`}
            onClick={() => document.getElementById("diag-file-input")?.click()}
          >
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            {fichier ? (
              <p className="text-sm font-medium text-emerald-700">{fichier.name}</p>
            ) : existingData?.fichierNom ? (
              <p className="text-sm text-slate-500">
                Fichier actuel : <strong>{existingData.fichierNom}</strong>
                <br />
                <span className="text-xs">Glissez un nouveau fichier pour remplacer</span>
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                Glissez votre PDF ici ou cliquez pour parcourir
              </p>
            )}
            <input
              id="diag-file-input"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setFichier(file);
              }}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            placeholder="Informations complementaires..."
          />
        </div>

        {/* Conseils */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Conseil</p>
          <p className="text-xs text-slate-600">{config.conseils}</p>
        </div>
      </form>
    </Modal>
  );
}
