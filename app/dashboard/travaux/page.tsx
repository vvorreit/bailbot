"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Wrench,
  Plus,
  X,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  Phone,
  FileText,
  Upload,
  AlertTriangle,
  Receipt,
  HardHat,
  CheckCircle2,
  Clock,
  Ban,
  Paperclip,
  Eye,
  Camera,
} from "lucide-react";
import { listerBiens, type Bien } from "@/lib/db-local";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface TravauxDocument {
  id: string;
  travauxId: string;
  nom: string;
  type: string;
  url: string;
  taille: number | null;
  createdAt: string;
}

interface Travaux {
  id: string;
  userId: string;
  bienId: string;
  titre: string;
  description: string | null;
  statut: string;
  categorie: string;
  montantDevis: number | null;
  montantReel: number | null;
  dateDebut: string | null;
  dateFin: string | null;
  artisanNom: string | null;
  artisanTel: string | null;
  artisanEmail: string | null;
  deductible: boolean;
  notes: string | null;
  documents: TravauxDocument[];
  createdAt: string;
  updatedAt: string;
}

type FiltreStatut = "tous" | "A_FAIRE" | "EN_COURS" | "TERMINE" | "ANNULE";
type FiltreCategorie = "toutes" | string;

/* ─── Config ─────────────────────────────────────────────────────────────── */

const STATUT_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  A_FAIRE: { label: "À faire", bg: "bg-slate-100", text: "text-slate-700", icon: <Clock className="w-3 h-3" /> },
  EN_COURS: { label: "En cours", bg: "bg-blue-100", text: "text-blue-700", icon: <HardHat className="w-3 h-3" /> },
  TERMINE: { label: "Terminé", bg: "bg-emerald-100", text: "text-emerald-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  ANNULE: { label: "Annulé", bg: "bg-red-100", text: "text-red-600", icon: <Ban className="w-3 h-3" /> },
};

const CATEGORIE_CONFIG: Record<string, { label: string; color: string }> = {
  PLOMBERIE: { label: "Plomberie", color: "bg-blue-100 text-blue-700" },
  ELECTRICITE: { label: "Électricité", color: "bg-yellow-100 text-yellow-700" },
  CHAUFFAGE: { label: "Chauffage", color: "bg-orange-100 text-orange-700" },
  ISOLATION: { label: "Isolation", color: "bg-teal-100 text-teal-700" },
  TOITURE: { label: "Toiture", color: "bg-stone-100 text-stone-700" },
  MENUISERIE: { label: "Menuiserie", color: "bg-amber-100 text-amber-700" },
  PEINTURE: { label: "Peinture", color: "bg-purple-100 text-purple-700" },
  CARRELAGE: { label: "Carrelage", color: "bg-cyan-100 text-cyan-700" },
  SALLE_DE_BAIN: { label: "Salle de bain", color: "bg-sky-100 text-sky-700" },
  CUISINE: { label: "Cuisine", color: "bg-rose-100 text-rose-700" },
  EXTERIEUR: { label: "Extérieur", color: "bg-green-100 text-green-700" },
  AUTRE: { label: "Autre", color: "bg-slate-100 text-slate-600" },
};

const FILTRES_STATUT: { key: FiltreStatut; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "A_FAIRE", label: "À faire" },
  { key: "EN_COURS", label: "En cours" },
  { key: "TERMINE", label: "Terminés" },
  { key: "ANNULE", label: "Annulés" },
];

const DOC_TYPES = [
  { value: "devis", label: "Devis" },
  { value: "facture", label: "Facture" },
  { value: "photo", label: "Photo" },
  { value: "autre", label: "Autre" },
];

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function formatMontant(v: number | null): string {
  if (v == null) return "—";
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €";
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function TravauxPage() {
  const [travaux, setTravaux] = useState<Travaux[]>([]);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("tous");
  const [filtreCategorie, setFiltreCategorie] = useState<FiltreCategorie>("toutes");
  const [filtreBien, setFiltreBien] = useState<string>("tous");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Travaux | null>(null);
  const [docsPanel, setDocsPanel] = useState<Travaux | null>(null);

  const load = useCallback(async () => {
    try {
      const [res, biensData] = await Promise.all([
        fetch("/api/travaux"),
        listerBiens(),
      ]);
      if (res.ok) {
        const data = await res.json();
        setTravaux(data.travaux);
      }
      setBiens(biensData);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = travaux;
    if (filtreStatut !== "tous") list = list.filter((t) => t.statut === filtreStatut);
    if (filtreCategorie !== "toutes") list = list.filter((t) => t.categorie === filtreCategorie);
    if (filtreBien !== "tous") list = list.filter((t) => t.bienId === filtreBien);
    return list;
  }, [travaux, filtreStatut, filtreCategorie, filtreBien]);

  /* Stats */
  const stats = useMemo(() => {
    const totalDevis = travaux.reduce((s, t) => s + (t.montantDevis || 0), 0);
    const totalReel = travaux.reduce((s, t) => s + (t.montantReel || 0), 0);
    const enCours = travaux.filter((t) => t.statut === "EN_COURS").length;
    const deductibles = travaux.filter((t) => t.deductible).reduce((s, t) => s + (t.montantReel || t.montantDevis || 0), 0);
    return { totalDevis, totalReel, enCours, deductibles };
  }, [travaux]);

  const bienMap = useMemo(() => {
    const m: Record<string, string> = {};
    biens.forEach((b) => { m[b.id] = b.adresse; });
    return m;
  }, [biens]);

  const usedCategories = useMemo(() => {
    const cats = new Set(travaux.map((t) => t.categorie));
    return Array.from(cats).sort();
  }, [travaux]);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce chantier et ses documents ?")) return;
    const res = await fetch(`/api/travaux/${id}`, { method: "DELETE" });
    if (res.ok) setTravaux((prev) => prev.filter((t) => t.id !== id));
  }

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
            <Wrench className="w-7 h-7 text-emerald-600" />
            Gestion travaux
          </h1>
          <p className="text-slate-500 mt-1">Suivi de vos chantiers et devis</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouveau chantier
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total devis" value={formatMontant(stats.totalDevis)} icon={<Receipt className="w-5 h-5" />} color="slate" />
        <StatCard label="Total factures" value={formatMontant(stats.totalReel)} icon={<FileText className="w-5 h-5" />} color="emerald" />
        <StatCard label="En cours" value={stats.enCours} icon={<HardHat className="w-5 h-5" />} color="blue" />
        <StatCard label="Déductibles" value={formatMontant(stats.deductibles)} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" />
      </div>

      {/* Filtres */}
      {travaux.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Statut */}
          <div className="flex flex-wrap gap-2">
            {FILTRES_STATUT.map((f) => {
              const count = f.key === "tous" ? travaux.length : travaux.filter((t) => t.statut === f.key).length;
              return (
                <button
                  key={f.key}
                  onClick={() => setFiltreStatut(f.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    filtreStatut === f.key
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                    filtreStatut === f.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Catégorie */}
          {usedCategories.length > 1 && (
            <select
              value={filtreCategorie}
              onChange={(e) => setFiltreCategorie(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="toutes">Toutes catégories</option>
              {usedCategories.map((c) => (
                <option key={c} value={c}>{CATEGORIE_CONFIG[c]?.label || c}</option>
              ))}
            </select>
          )}

          {/* Bien */}
          {biens.length > 1 && (
            <select
              value={filtreBien}
              onChange={(e) => setFiltreBien(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="tous">Tous les biens</option>
              {biens.map((b) => (
                <option key={b.id} value={b.id}>{b.adresse}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Liste */}
      {travaux.length === 0 ? (
        <EmptyState onAdd={() => { setEditItem(null); setShowForm(true); }} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">Aucun chantier pour ces filtres</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <TravauxCard
              key={t.id}
              travaux={t}
              bienAdresse={bienMap[t.bienId] || t.bienId}
              onEdit={() => { setEditItem(t); setShowForm(true); }}
              onDelete={() => handleDelete(t.id)}
              onDocs={() => setDocsPanel(t)}
            />
          ))}
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <TravauxFormModal
          travaux={editItem}
          biens={biens}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSaved={() => { setShowForm(false); setEditItem(null); load(); }}
        />
      )}

      {/* Panel documents */}
      {docsPanel && (
        <DocumentsPanel
          travaux={docsPanel}
          onClose={() => setDocsPanel(null)}
          onUpdate={(updated) => {
            setTravaux((prev) => prev.map((t) => t.id === updated.id ? updated : t));
            setDocsPanel(updated);
          }}
        />
      )}
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────────────────────────── */

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    slate: "bg-slate-50 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colors[color] || colors.slate}`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────────────────────────── */

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
      <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Wrench className="w-8 h-8 text-emerald-400" />
      </div>
      <p className="text-lg font-bold text-slate-700 mb-1">Aucun chantier enregistré</p>
      <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
        Suivez vos travaux, devis et factures pour une gestion simplifiée de vos rénovations.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Créer votre premier chantier
      </button>
    </div>
  );
}

/* ─── Travaux Card ───────────────────────────────────────────────────────── */

function TravauxCard({
  travaux,
  bienAdresse,
  onEdit,
  onDelete,
  onDocs,
}: {
  travaux: Travaux;
  bienAdresse: string;
  onEdit: () => void;
  onDelete: () => void;
  onDocs: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const statutCfg = STATUT_CONFIG[travaux.statut] || STATUT_CONFIG.A_FAIRE;
  const catCfg = CATEGORIE_CONFIG[travaux.categorie] || CATEGORIE_CONFIG.AUTRE;
  const hasDelta = travaux.montantDevis != null && travaux.montantReel != null && travaux.montantReel !== travaux.montantDevis;
  const overBudget = hasDelta && travaux.montantReel! > travaux.montantDevis!;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-slate-900 truncate">{travaux.titre}</h3>
          <p className="text-xs text-slate-400 truncate">{bienAdresse}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${catCfg.color}`}>
            {catCfg.label}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${statutCfg.bg} ${statutCfg.text}`}>
            {statutCfg.icon}
            {statutCfg.label}
          </span>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-20">
                <button onClick={() => { setMenuOpen(false); onEdit(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Modifier
                </button>
                <button onClick={() => { setMenuOpen(false); onDocs(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <Paperclip className="w-3.5 h-3.5" /> Documents
                </button>
                <button onClick={() => { setMenuOpen(false); onDelete(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {travaux.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{travaux.description}</p>
      )}

      {/* Montants */}
      <div className="bg-slate-50 rounded-xl p-3 mb-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Devis</span>
          <span className="font-bold text-slate-700">{formatMontant(travaux.montantDevis)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Facture réelle</span>
          <span className={`font-bold ${overBudget ? "text-red-600" : "text-slate-700"}`}>
            {formatMontant(travaux.montantReel)}
            {overBudget && <AlertTriangle className="w-3 h-3 inline ml-1 -mt-0.5" />}
          </span>
        </div>
        {travaux.deductible && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
            <CheckCircle2 className="w-2.5 h-2.5" /> Déductible
          </span>
        )}
      </div>

      {/* Artisan */}
      {travaux.artisanNom && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <HardHat className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-700">{travaux.artisanNom}</span>
          {travaux.artisanTel && (
            <a href={`tel:${travaux.artisanTel}`} className="inline-flex items-center gap-1 text-emerald-600 hover:underline">
              <Phone className="w-3 h-3" /> {travaux.artisanTel}
            </a>
          )}
        </div>
      )}

      {/* Dates */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
        <span>{formatDate(travaux.dateDebut)} → {formatDate(travaux.dateFin)}</span>
        {travaux.documents.length > 0 && (
          <button onClick={onDocs} className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-bold">
            <Paperclip className="w-3 h-3" /> {travaux.documents.length} doc{travaux.documents.length > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Detail link */}
      <Link
        href={`/dashboard/travaux/${travaux.id}`}
        className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors"
      >
        <Eye className="w-3.5 h-3.5" />
        Voir détail · Devis · Photos
      </Link>
    </div>
  );
}

/* ─── Formulaire Modal ───────────────────────────────────────────────────── */

function TravauxFormModal({
  travaux,
  biens,
  onClose,
  onSaved,
}: {
  travaux: Travaux | null;
  biens: Bien[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!travaux;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titre: travaux?.titre || "",
    bienId: travaux?.bienId || (biens[0]?.id || ""),
    categorie: travaux?.categorie || "PLOMBERIE",
    statut: travaux?.statut || "A_FAIRE",
    description: travaux?.description || "",
    montantDevis: travaux?.montantDevis?.toString() || "",
    montantReel: travaux?.montantReel?.toString() || "",
    dateDebut: travaux?.dateDebut ? travaux.dateDebut.split("T")[0] : "",
    dateFin: travaux?.dateFin ? travaux.dateFin.split("T")[0] : "",
    artisanNom: travaux?.artisanNom || "",
    artisanTel: travaux?.artisanTel || "",
    artisanEmail: travaux?.artisanEmail || "",
    deductible: travaux?.deductible ?? true,
    notes: travaux?.notes || "",
  });

  function update(field: string, value: string | boolean) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titre.trim() || !form.bienId) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        montantDevis: form.montantDevis || null,
        montantReel: form.montantReel || null,
        dateDebut: form.dateDebut || null,
        dateFin: form.dateFin || null,
        artisanNom: form.artisanNom || null,
        artisanTel: form.artisanTel || null,
        artisanEmail: form.artisanEmail || null,
        notes: form.notes || null,
        description: form.description || null,
      };

      const url = isEdit ? `/api/travaux/${travaux!.id}` : "/api/travaux";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">{isEdit ? "Modifier le chantier" : "Nouveau chantier"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Titre du chantier *</label>
            <input
              type="text"
              value={form.titre}
              onChange={(e) => update("titre", e.target.value)}
              placeholder="Rénovation salle de bain"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Bien + Catégorie + Statut */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Bien *</label>
              <select
                value={form.bienId}
                onChange={(e) => update("bienId", e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {biens.map((b) => (
                  <option key={b.id} value={b.id}>{b.adresse}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Catégorie *</label>
              <select
                value={form.categorie}
                onChange={(e) => update("categorie", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {Object.entries(CATEGORIE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Statut</label>
              <select
                value={form.statut}
                onChange={(e) => update("statut", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {Object.entries(STATUT_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={2}
              placeholder="Détails du chantier..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Montants */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Montant devis (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.montantDevis}
                onChange={(e) => update("montantDevis", e.target.value)}
                placeholder="5000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Montant réel (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.montantReel}
                onChange={(e) => update("montantReel", e.target.value)}
                placeholder="4800"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Date début</label>
              <input
                type="date"
                value={form.dateDebut}
                onChange={(e) => update("dateDebut", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Date fin</label>
              <input
                type="date"
                value={form.dateFin}
                onChange={(e) => update("dateFin", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Artisan */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Artisan</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Nom</label>
                <input
                  type="text"
                  value={form.artisanNom}
                  onChange={(e) => update("artisanNom", e.target.value)}
                  placeholder="Martin SARL"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Téléphone</label>
                <input
                  type="tel"
                  value={form.artisanTel}
                  onChange={(e) => update("artisanTel", e.target.value)}
                  placeholder="06 12 34 56 78"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.artisanEmail}
                  onChange={(e) => update("artisanEmail", e.target.value)}
                  placeholder="artisan@email.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Déductible + Notes */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.deductible}
                onChange={(e) => update("deductible", e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-600">Déductible fiscalement</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={2}
              placeholder="Notes internes..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !form.titre.trim() || !form.bienId}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Panel Documents ────────────────────────────────────────────────────── */

function DocumentsPanel({
  travaux,
  onClose,
  onUpdate,
}: {
  travaux: Travaux;
  onClose: () => void;
  onUpdate: (t: Travaux) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("devis");
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const res = await fetch(`/api/travaux/${travaux.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: file.name,
          type: docType,
          url: base64,
          taille: file.size,
        }),
      });

      if (res.ok) {
        const { document } = await res.json();
        onUpdate({ ...travaux, documents: [document, ...travaux.documents] });
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("Supprimer ce document ?")) return;
    const res = await fetch(`/api/travaux/${travaux.id}/documents?docId=${docId}`, { method: "DELETE" });
    if (res.ok) {
      onUpdate({ ...travaux, documents: travaux.documents.filter((d) => d.id !== docId) });
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900">Documents</h2>
            <p className="text-xs text-slate-400">{travaux.titre}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Upload zone */}
          <div className="flex items-center gap-3 mb-2">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {DOC_TYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>{dt.label}</option>
              ))}
            </select>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragOver ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"
            }`}
          >
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">Glissez un fichier ou cliquez pour uploader</p>
                <p className="text-[10px] text-slate-400 mt-1">Devis, factures, photos...</p>
              </>
            )}
          </div>

          {/* Liste documents */}
          {travaux.documents.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Aucun document</p>
          ) : (
            <div className="space-y-2">
              {travaux.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{doc.nom}</p>
                      <p className="text-[10px] text-slate-400">
                        {DOC_TYPES.find((dt) => dt.value === doc.type)?.label || doc.type}
                        {doc.taille && ` — ${(doc.taille / 1024).toFixed(0)} Ko`}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(doc.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
