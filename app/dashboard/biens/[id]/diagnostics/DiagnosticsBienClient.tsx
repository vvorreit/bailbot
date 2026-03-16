"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Home,
  Stethoscope,
  Upload,
  Download,
  Trash2,
  AlertTriangle,
  MinusCircle,
  FileText,
} from "lucide-react";
import { STATUT_LABELS, STATUT_ICONS, type DiagnosticType } from "@/lib/diagnostics-config";
import { upsertDiagnostic, deleteDiagnostic } from "@/app/actions/diagnostics-gestion";
import type { DiagnosticAvecStatut } from "@/app/actions/diagnostics-gestion";
import DiagnosticUploadModal from "@/components/DiagnosticUploadModal";

interface Props {
  bienId: string;
  adresse: string;
  diagnostics: DiagnosticAvecStatut[];
}

export default function DiagnosticsBienClient({ bienId, adresse, diagnostics: initialDiags }: Props) {
  const router = useRouter();
  const [diagnostics, setDiagnostics] = useState(initialDiags);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DiagnosticType | null>(null);

  const stats = {
    valides: diagnostics.filter((d) => d.statut === "valide" || d.statut === "illimite").length,
    aRenouveler: diagnostics.filter((d) => d.statut === "expire-bientot" || d.statut === "expire").length,
    manquants: diagnostics.filter((d) => d.statut === "manquant").length,
    nonConcernes: diagnostics.filter((d) => d.statut === "non-concerne").length,
  };

  const obligatoiresManquants = diagnostics.filter(
    (d) => d.statut === "manquant" && (d.type === "DPE" || d.type === "SURFACE" || d.type === "ERP")
  );

  const handleOpenUpload = useCallback((type: DiagnosticType) => {
    setSelectedType(type);
    setModalOpen(true);
  }, []);

  const handleSaved = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleMarkNonConcerne = useCallback(async (type: DiagnosticType) => {
    await upsertDiagnostic(bienId, type, { nonConcerne: true });
    router.refresh();
  }, [bienId, router]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Supprimer ce diagnostic ?")) return;
    await deleteDiagnostic(id);
    router.refresh();
  }, [router]);

  const selectedDiag = selectedType ? diagnostics.find((d) => d.type === selectedType) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
        <Link href="/dashboard" className="hover:text-slate-600">Tableau de bord</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/dashboard" className="hover:text-slate-600">Mes biens</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/dashboard/biens/${bienId}`} className="hover:text-slate-600">{adresse}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-700 font-bold">Diagnostics</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Diagnostics obligatoires</h1>
            <p className="text-sm text-slate-500">{adresse}</p>
          </div>
        </div>
      </div>

      {/* Warning for mandatory missing diagnostics */}
      {obligatoiresManquants.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">
              {obligatoiresManquants.length} diagnostic(s) obligatoire(s) manquant(s)
            </p>
            <ul className="text-xs text-red-700 mt-1 space-y-0.5">
              {obligatoiresManquants.map((d) => (
                <li key={d.type}>
                  {d.nom} — {d.obligatoire}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-emerald-700">{stats.valides}</p>
          <p className="text-[10px] font-bold text-emerald-600 uppercase">Valides</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-amber-700">{stats.aRenouveler}</p>
          <p className="text-[10px] font-bold text-amber-600 uppercase">A renouveler</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-red-700">{stats.manquants}</p>
          <p className="text-[10px] font-bold text-red-600 uppercase">Manquants</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-slate-500">{stats.nonConcernes}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Non concernes</p>
        </div>
      </div>

      {/* Diagnostics table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase border-b border-slate-100 bg-slate-50">
                <th className="text-center py-3 px-3 w-12">Statut</th>
                <th className="text-left py-3 px-3">Diagnostic</th>
                <th className="text-left py-3 px-3">Realisation</th>
                <th className="text-left py-3 px-3">Expiration</th>
                <th className="text-left py-3 px-3">Validite</th>
                <th className="text-left py-3 px-3">Ref. legale</th>
                <th className="text-center py-3 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {diagnostics.map((d) => {
                const statutCfg = STATUT_LABELS[d.statut] || STATUT_LABELS["manquant"];
                const icon = STATUT_ICONS[d.statut] || "?";
                return (
                  <tr key={d.type} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${statutCfg.bg} ${statutCfg.color}`}>
                        {icon} {statutCfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800">{d.type}</p>
                      <p className="text-xs text-slate-400 max-w-[180px] truncate">{d.nom}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{d.description}</p>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600">
                      {d.dateRealisation
                        ? new Date(d.dateRealisation).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600">
                      {d.dateExpiration
                        ? new Date(d.dateExpiration).toLocaleDateString("fr-FR")
                        : d.statut === "illimite" ? "Illimite" : "—"}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-400">{d.validiteLabel}</td>
                    <td className="py-3 px-3 text-[10px] text-slate-400">{d.legalRef}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenUpload(d.type as DiagnosticType)}
                          title="Uploader le document"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        {d.statut !== "non-concerne" && !d.id && (
                          <button
                            onClick={() => handleMarkNonConcerne(d.type as DiagnosticType)}
                            title="Marquer comme non concerne"
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        )}
                        {d.fichierUrl && (
                          <a
                            href={d.fichierUrl}
                            download={d.fichierNom || `${d.type}.pdf`}
                            title="Telecharger"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        {d.fichierNom && (
                          <span className="text-[10px] text-slate-400 max-w-[80px] truncate hidden lg:inline" title={d.fichierNom}>
                            <FileText className="w-3 h-3 inline mr-0.5" />
                            {d.fichierNom}
                          </span>
                        )}
                        {d.id && (
                          <button
                            onClick={() => handleDelete(d.id!)}
                            title="Supprimer"
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload modal */}
      {selectedType && (
        <DiagnosticUploadModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedType(null); }}
          bienId={bienId}
          type={selectedType}
          existingData={selectedDiag ? {
            dateRealisation: selectedDiag.dateRealisation,
            dateExpiration: selectedDiag.dateExpiration,
            fichierUrl: selectedDiag.fichierUrl,
            fichierNom: selectedDiag.fichierNom,
            notes: selectedDiag.notes,
          } : undefined}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
