"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Building2,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Download,
  RefreshCw,
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";

/* ─── Types ───────────────────────────────────────────────────────────── */

interface PosteCharge {
  poste: string;
  montant: number;
}

interface AnalyseCopro {
  postes: PosteCharge[];
  total: number;
  quotePartLot: number | null;
  periode: string | null;
}

interface DocumentCopro {
  id: string;
  bienId: string;
  nom: string;
  type: string;
  annee: number;
  trimestre: number | null;
  taille: number | null;
  analyseJson: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  APPEL_CHARGES: "Appel de charges",
  RELEVE_DEPENSES: "Relevé de dépenses",
  PV_ASSEMBLEE: "PV d'assemblée",
  BUDGET_PREVISIONNEL: "Budget prévisionnel",
  AUTRE: "Autre",
};

const COULEURS_POSTES = [
  "#059669", "#0284c7", "#7c3aed", "#db2777", "#ea580c",
  "#ca8a04", "#0d9488", "#4f46e5", "#be123c", "#65a30d",
  "#6366f1", "#dc2626",
];

function euros(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function formatTaille(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export default function CoproPage() {
  return (
    <FeatureGate feature="ANALYSE_COPRO">
      <CoproContent />
    </FeatureGate>
  );
}

function CoproContent() {
  const [documents, setDocuments] = useState<DocumentCopro[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [anneeFiltre, setAnneeFiltre] = useState(new Date().getFullYear());

  /* Upload form state */
  const [formNom, setFormNom] = useState("");
  const [formType, setFormType] = useState("APPEL_CHARGES");
  const [formAnnee, setFormAnnee] = useState(new Date().getFullYear().toString());
  const [formTrimestre, setFormTrimestre] = useState("");
  const [formBienId, setFormBienId] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Charger les documents */
  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/copro");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  /* Upload handler */
  const handleUpload = useCallback(
    async (file: File) => {
      if (!formBienId.trim()) {
        alert("Veuillez saisir un identifiant de bien.");
        return;
      }
      setUploading(true);
      try {
        const base64 = await fileToBase64(file);
        const res = await fetch("/api/copro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bienId: formBienId.trim(),
            nom: formNom.trim() || file.name,
            type: formType,
            annee: formAnnee,
            trimestre: formTrimestre || null,
            contenu: base64,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Erreur upload");
          return;
        }
        setFormNom("");
        setFormTrimestre("");
        if (fileRef.current) fileRef.current.value = "";
        await fetchDocs();
      } catch {
        alert("Erreur réseau");
      } finally {
        setUploading(false);
      }
    },
    [formBienId, formNom, formType, formAnnee, formTrimestre, fetchDocs]
  );

  /* Supprimer */
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Supprimer ce document ?")) return;
      await fetch(`/api/copro/${id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    },
    []
  );

  /* Relancer analyse */
  const handleReanalyse = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/copro/${id}/analyse`, { method: "POST" });
      if (res.ok) {
        const { analyse } = await res.json();
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? { ...d, analyseJson: JSON.stringify(analyse) } : d))
        );
      }
    },
    []
  );

  /* Filtrer par année */
  const docsFiltres = useMemo(
    () => documents.filter((d) => d.annee === anneeFiltre),
    [documents, anneeFiltre]
  );

  /* Agréger toutes les analyses de l'année */
  const analyseGlobale = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;

    for (const doc of docsFiltres) {
      if (!doc.analyseJson) continue;
      try {
        const a: AnalyseCopro = JSON.parse(doc.analyseJson);
        for (const p of a.postes) {
          map.set(p.poste, (map.get(p.poste) || 0) + p.montant);
        }
        total += a.total;
      } catch {
        /* ignore */
      }
    }

    const postes = Array.from(map.entries())
      .map(([poste, montant]) => ({ poste, montant }))
      .sort((a, b) => b.montant - a.montant);

    return { postes, total };
  }, [docsFiltres]);

  /* Évolution par trimestre */
  const evolutionTrimestre = useMemo(() => {
    const trimMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

    for (const doc of docsFiltres) {
      if (!doc.analyseJson || !doc.trimestre) continue;
      try {
        const a: AnalyseCopro = JSON.parse(doc.analyseJson);
        trimMap[doc.trimestre] += a.total;
      } catch {
        /* ignore */
      }
    }

    return Object.entries(trimMap).map(([t, montant]) => ({
      trimestre: `T${t}`,
      montant,
    }));
  }, [docsFiltres]);

  /* Données année précédente pour comparaison */
  const analyseAnneePrecedente = useMemo(() => {
    const docsPrev = documents.filter((d) => d.annee === anneeFiltre - 1);
    const map = new Map<string, number>();
    let total = 0;

    for (const doc of docsPrev) {
      if (!doc.analyseJson) continue;
      try {
        const a: AnalyseCopro = JSON.parse(doc.analyseJson);
        for (const p of a.postes) {
          map.set(p.poste, (map.get(p.poste) || 0) + p.montant);
        }
        total += a.total;
      } catch {
        /* ignore */
      }
    }

    return { map, total };
  }, [documents, anneeFiltre]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const chargeMensuelle = analyseGlobale.total > 0 ? analyseGlobale.total / 12 : 0;
  const posteMax = analyseGlobale.postes[0] || null;
  const barMax = analyseGlobale.postes.length > 0 ? analyseGlobale.postes[0].montant : 1;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Building2 className="w-7 h-7 text-emerald-600" />
            Charges de copropriété
          </h1>
          <p className="text-slate-500 mt-1">
            Analysez vos appels de charges et suivez l&apos;évolution des postes
          </p>
        </div>

        {/* Sélecteur année */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-1 py-1">
          <button
            onClick={() => setAnneeFiltre((a) => a - 1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="px-3 text-sm font-black text-slate-900 tabular-nums min-w-[50px] text-center">
            {anneeFiltre}
          </span>
          <button
            onClick={() => setAnneeFiltre((a) => a + 1)}
            disabled={anneeFiltre >= new Date().getFullYear()}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total charges"
          value={euros(analyseGlobale.total)}
          icon={<DollarSign className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          label="Charge mensuelle"
          value={euros(chargeMensuelle)}
          icon={<BarChart3 className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Poste principal"
          value={posteMax ? posteMax.poste : "—"}
          icon={<PieChart className="w-5 h-5" />}
          color="slate"
        />
        <StatCard
          label="Documents"
          value={docsFiltres.length.toString()}
          icon={<FileText className="w-5 h-5" />}
          color="slate"
        />
      </div>

      {/* Visualisation */}
      {analyseGlobale.postes.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Barres charges par poste */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Répartition des charges
            </h2>
            <div className="space-y-3">
              {analyseGlobale.postes.map((p, i) => {
                const pct = analyseGlobale.total > 0 ? (p.montant / analyseGlobale.total) * 100 : 0;
                return (
                  <div key={p.poste}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-600 truncate mr-2">{p.poste}</span>
                      <span className="text-xs font-black text-slate-900 whitespace-nowrap">
                        {euros(p.montant)} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(p.montant / barMax) * 100}%`,
                          backgroundColor: COULEURS_POSTES[i % COULEURS_POSTES.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Évolution trimestrielle */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Évolution trimestrielle
            </h2>
            {evolutionTrimestre.some((t) => t.montant > 0) ? (
              <div className="flex items-end gap-3 h-48">
                {(() => {
                  const maxTrim = Math.max(...evolutionTrimestre.map((t) => t.montant), 1);
                  return evolutionTrimestre.map((t, i) => (
                    <div key={t.trimestre} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500">
                        {t.montant > 0 ? euros(t.montant) : "—"}
                      </span>
                      <div className="w-full flex items-end" style={{ height: "140px" }}>
                        <div
                          className="w-full rounded-t-lg transition-all duration-500"
                          style={{
                            height: t.montant > 0 ? `${(t.montant / maxTrim) * 100}%` : "4px",
                            backgroundColor: t.montant > 0 ? COULEURS_POSTES[i] : "#e2e8f0",
                          }}
                        />
                      </div>
                      <span className="text-xs font-black text-slate-700">{t.trimestre}</span>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-slate-400">
                Aucune donnée trimestrielle
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tableau détaillé */}
      {analyseGlobale.postes.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Détail poste par poste
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Poste
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    % du total
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Évol. N-1
                  </th>
                </tr>
              </thead>
              <tbody>
                {analyseGlobale.postes.map((p) => {
                  const pct = analyseGlobale.total > 0 ? (p.montant / analyseGlobale.total) * 100 : 0;
                  const prev = analyseAnneePrecedente.map.get(p.poste);
                  let evol: number | null = null;
                  if (prev && prev > 0) {
                    evol = ((p.montant - prev) / prev) * 100;
                  }
                  return (
                    <tr key={p.poste} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-sm font-bold text-slate-700">{p.poste}</td>
                      <td className="px-6 py-3 text-sm font-black text-slate-900 text-right tabular-nums">
                        {euros(p.montant)}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-500 text-right tabular-nums">
                        {pct.toFixed(1)}%
                      </td>
                      <td className="px-6 py-3 text-sm text-right tabular-nums">
                        {evol !== null ? (
                          <span className={evol > 0 ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>
                            {evol > 0 ? "+" : ""}
                            {evol.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50">
                  <td className="px-6 py-3 text-sm font-black text-slate-900">Total</td>
                  <td className="px-6 py-3 text-sm font-black text-slate-900 text-right tabular-nums">
                    {euros(analyseGlobale.total)}
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-slate-500 text-right">100%</td>
                  <td className="px-6 py-3 text-sm text-right tabular-nums">
                    {analyseAnneePrecedente.total > 0 ? (
                      <span
                        className={
                          analyseGlobale.total > analyseAnneePrecedente.total
                            ? "text-red-600 font-bold"
                            : "text-emerald-600 font-bold"
                        }
                      >
                        {analyseGlobale.total > analyseAnneePrecedente.total ? "+" : ""}
                        {(
                          ((analyseGlobale.total - analyseAnneePrecedente.total) /
                            analyseAnneePrecedente.total) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload section */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-8">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-600" />
          Importer un document
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Bien (ID ou adresse)</label>
            <input
              type="text"
              value={formBienId}
              onChange={(e) => setFormBienId(e.target.value)}
              placeholder="ex: apt-paris-11"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Type de document</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
            >
              {Object.entries(TYPE_LABELS).map(([val, lab]) => (
                <option key={val} value={val}>{lab}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Année</label>
            <input
              type="number"
              value={formAnnee}
              onChange={(e) => setFormAnnee(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Trimestre (optionnel)</label>
            <select
              value={formTrimestre}
              onChange={(e) => setFormTrimestre(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
            >
              <option value="">—</option>
              <option value="1">T1</option>
              <option value="2">T2</option>
              <option value="3">T3</option>
              <option value="4">T4</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Nom du document (optionnel)</label>
            <input
              type="text"
              value={formNom}
              onChange={(e) => setFormNom(e.target.value)}
              placeholder="ex: Appel T2 2025"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Drop zone */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
            dragOver ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleUpload(file);
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.csv"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">
                Glissez-déposez un fichier ou cliquez pour sélectionner
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, TXT ou CSV</p>
            </>
          )}
        </div>
      </div>

      {/* Liste documents */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Documents importés ({docsFiltres.length})
          </h2>
        </div>

        {docsFiltres.length === 0 ? (
          <div className="px-6 py-12 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-200 mx-auto" />
            <p className="text-sm font-semibold text-slate-400">Aucun relevé de charges pour {anneeFiltre}</p>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">Importez un appel de charges de votre syndic (PDF) via le bouton ci-dessus pour analyser automatiquement vos postes de dépenses.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {docsFiltres.map((doc) => {
              const expanded = expandedId === doc.id;
              let analyse: AnalyseCopro | null = null;
              if (doc.analyseJson) {
                try {
                  analyse = JSON.parse(doc.analyseJson);
                } catch {
                  /* ignore */
                }
              }

              return (
                <div key={doc.id}>
                  <div className="px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{doc.nom}</p>
                      <p className="text-xs text-slate-400">
                        {TYPE_LABELS[doc.type] || doc.type} · {doc.annee}
                        {doc.trimestre ? ` T${doc.trimestre}` : ""} · {formatTaille(doc.taille)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {analyse && (
                        <button
                          onClick={() => setExpandedId(expanded ? null : doc.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          Analyse
                        </button>
                      )}
                      <button
                        onClick={() => handleReanalyse(doc.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Relancer l'analyse"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <a
                        href={`/api/copro/${doc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded analysis */}
                  {expanded && analyse && (
                    <div className="px-6 pb-4">
                      <div className="bg-slate-50 rounded-xl p-4">
                        {analyse.periode && (
                          <p className="text-xs text-slate-500 mb-3">
                            <span className="font-bold">Période :</span> {analyse.periode}
                          </p>
                        )}
                        {analyse.quotePartLot !== null && (
                          <p className="text-xs text-slate-500 mb-3">
                            <span className="font-bold">Quote-part du lot :</span> {euros(analyse.quotePartLot)}
                          </p>
                        )}
                        {analyse.postes.length > 0 ? (
                          <div className="space-y-2">
                            {analyse.postes.map((p) => (
                              <div key={p.poste} className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-600">{p.poste}</span>
                                <span className="text-xs font-black text-slate-900 tabular-nums">
                                  {euros(p.montant)}
                                </span>
                              </div>
                            ))}
                            <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                              <span className="text-xs font-black text-slate-700">Total</span>
                              <span className="text-sm font-black text-emerald-700 tabular-nums">
                                {euros(analyse.total)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">
                            Aucun poste extrait. Le document est peut-être un PDF non textuel.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <p className="text-sm text-blue-800 font-bold mb-1">
          Comment ça marche ?
        </p>
        <p className="text-xs text-blue-600">
          Importez vos appels de charges, relevés de dépenses ou PV d&apos;assemblée générale.
          L&apos;analyse extrait automatiquement les postes de charges (eau, ascenseur, gardien, etc.)
          et calcule les totaux. Les visualisations agrègent toutes les données de l&apos;année sélectionnée.
          Pour de meilleurs résultats, importez des fichiers texte ou des PDF avec du texte sélectionnable.
        </p>
      </div>
    </div>
  );
}

/* ─── Stat Card ───────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colors: Record<string, string> = {
    slate: "bg-slate-50 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colors[color] || colors.slate}`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-xl font-black text-slate-900 truncate">{value}</p>
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] || result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
