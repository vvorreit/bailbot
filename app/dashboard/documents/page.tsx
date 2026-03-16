"use client";

import { useState, useEffect, useCallback } from "react";
import { FolderOpen, Upload, Trash2, Loader2, FileText, Download } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { getDocuments, deleteDocument } from "@/app/actions/documents";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterBien, setFilterBien] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getDocuments(filterBien || undefined)
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, [filterBien]);

  useEffect(() => { load(); }, [load]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      if (filterBien) formData.append("bienId", filterBien);

      try {
        await fetch("/api/documents/upload", { method: "POST", body: formData });
      } catch {}
    }

    setUploading(false);
    load();
    e.target.value = "";
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    await deleteDocument(id);
    load();
  }

  const TYPE_LABELS: Record<string, string> = {
    dpe: "DPE",
    diagnostic: "Diagnostic",
    contrat: "Contrat",
    quittance: "Quittance",
    photo_edl: "Photo EDL",
    autre: "Autre",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <FolderOpen className="w-7 h-7 text-emerald-600" />
            Coffre-fort documentaire
          </h1>
          <p className="text-slate-500 mt-1">Tous vos documents au meme endroit</p>
        </div>
        <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold cursor-pointer transition-colors">
          <Upload className="w-4 h-4" />
          {uploading ? "Envoi..." : "Ajouter"}
          <input type="file" multiple onChange={handleUpload} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100">
          <EmptyState
            icon={FolderOpen}
            title="Aucun document"
            description="Uploadez vos premiers documents : DPE, contrats de bail, quittances, diagnostics..."
            ctaLabel="Uploader un document"
            ctaOnClick={() => document.getElementById("doc-upload-input")?.click()}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-4">Nom</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-900 truncate max-w-[250px]">{doc.nom}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                      {TYPE_LABELS[doc.type] || doc.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
