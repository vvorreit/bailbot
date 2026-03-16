"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Building2,
  Home,
  Users,
  TrendingUp,
  CalendarClock,
  AlertTriangle,
  FileText,
  ClipboardList,
  Receipt,
  ChevronRight,
  Loader2,
  Plus,
  X,
  MoreVertical,
  Pencil,
  Trash2,
  Wrench,
  Calculator,
  Bell,
  Banknote,
  MessageSquare,
  BarChart2,
  Wallet,
} from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";
import { getDashboardKPIs } from "@/app/actions/kpi";
import {
  listerBiens,
  listerCandidatures,
  listerPaiements,
  creerBien,
  supprimerBien,
  mettreAJourBien,
  type Bien,
  type Candidature,
  type Paiement,
  type TypeBail,
  type Annexe,
  type TypeAnnexe,
} from "@/lib/db-local";

const StatsContent = dynamic(() => import("./stats/page"), { ssr: false, loading: () => <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div> });
const CoproContent = dynamic(() => import("./copro/page"), { ssr: false, loading: () => <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div> });

/* ─── Types locaux ────────────────────────────────────────────────────────── */

interface BienEnrichi extends Bien {
  candidatures: Candidature[];
  paiements: Paiement[];
  tauxOccupation: number;
  prochainPaiement?: string;
  prochaineRevisionIRL?: string;
  diagnosticsExpirants: Array<{ type: string; dateExpiration: number; joursRestants: number }>;
}

type Filtre = "tous" | "loue" | "vacant" | "selection";

const TYPE_LABELS: Record<string, string> = {
  HABITATION_VIDE: "Vide",
  HABITATION_MEUBLE: "Meublé",
  PROFESSIONNEL: "Pro",
};

const STATUT_CONFIG = {
  loue: { label: "Loué", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  selection: { label: "En sélection", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  vacant: { label: "Vacant", bg: "bg-red-100", text: "text-red-600", dot: "bg-red-500" },
};

const FILTRES: { key: Filtre; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "loue", label: "Loués" },
  { key: "vacant", label: "Vacants" },
  { key: "selection", label: "En sélection" },
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function computeStatut(bien: Bien, candidatures: Candidature[]): "loue" | "selection" | "vacant" {
  if (bien.statut) return bien.statut;
  if (bien.locataireNom) return "loue";
  const enCours = candidatures.filter((c) => c.statut === "en_attente" || c.statut === "en_analyse" || c.statut === "complet");
  if (enCours.length > 0) return "selection";
  return "vacant";
}

function computeTauxOccupation(paiements: Paiement[]): number {
  if (paiements.length === 0) return 0;
  const moisPayes = new Set(paiements.filter((p) => p.statut === "paye").map((p) => p.mois));
  const allMois = new Set(paiements.map((p) => p.mois));
  return allMois.size > 0 ? Math.round((moisPayes.size / Math.max(allMois.size, 12)) * 100) : 0;
}

function computeProchainPaiement(paiements: Paiement[]): string | undefined {
  const now = Date.now();
  const prochain = paiements
    .filter((p) => p.statut === "attendu" && p.dateAttendue >= now)
    .sort((a, b) => a.dateAttendue - b.dateAttendue)[0];
  if (!prochain) return undefined;
  return new Date(prochain.dateAttendue).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function computeProchaineRevisionIRL(bien: Bien): string | undefined {
  if (!bien.dateRevision) return undefined;
  return new Date(bien.dateRevision).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function computeDiagnosticsExpirants(bien: Bien): BienEnrichi["diagnosticsExpirants"] {
  if (!bien.diagnostics) return [];
  const now = Date.now();
  const seuil = 90 * 24 * 60 * 60 * 1000;
  return bien.diagnostics
    .filter((d) => d.dateExpiration && d.dateExpiration - now < seuil && d.dateExpiration > now)
    .map((d) => ({
      type: d.type,
      dateExpiration: d.dateExpiration!,
      joursRestants: Math.ceil((d.dateExpiration! - now) / (1000 * 60 * 60 * 24)),
    }));
}

function formatDate(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── KPI Band ──────────────────────────────────────────────────────────── */

function KPIBand() {
  const [kpis, setKpis] = useState<any>(null);

  useEffect(() => {
    getDashboardKPIs().then(setKpis).catch(() => {});
  }, []);

  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Loyers ce mois</span>
        </div>
        <p className="text-xl font-black text-slate-900">
          {kpis.loyersEncaisses.toLocaleString("fr-FR")} <span className="text-sm font-bold text-slate-400">/ {kpis.loyersAttendus.toLocaleString("fr-FR")} EUR</span>
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Taux occupation</span>
        </div>
        <p className="text-xl font-black text-slate-900">{kpis.tauxOccupation}%</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${kpis.nbImpayes > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Impayes</span>
        </div>
        <div className="flex items-center gap-2">
          <p className={`text-xl font-black ${kpis.nbImpayes > 0 ? "text-red-600" : "text-slate-900"}`}>{kpis.nbImpayes}</p>
          {kpis.nbImpayes > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{kpis.nbImpayes}</span>
          )}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CalendarClock className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Echeances</span>
        </div>
        <p className="text-sm font-bold text-slate-700">
          {kpis.bailsExpirants.length} bail{kpis.bailsExpirants.length > 1 ? "s" : ""}, {kpis.diagsExpirants.length} diag{kpis.diagsExpirants.length > 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

/* ─── Composant Principal avec Tabs ─────────────────────────────────────── */

const DASHBOARD_TABS = [
  { key: "biens", label: "Mes biens", icon: Home },
  { key: "stats", label: "Statistiques", icon: BarChart2 },
  { key: "copro", label: "Copropriete", icon: Building2 },
] as const;

type DashboardTab = (typeof DASHBOARD_TABS)[number]["key"];

export default function LogementsPage() {
  const [tab, setTab] = useState<DashboardTab>("biens");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* KPI Band */}
      <KPIBand />

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
        {DASHBOARD_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex-1 justify-center ${
              tab === t.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "biens" && (
        <FeatureGate feature="MES_LOGEMENTS">
          <LogementsContent />
        </FeatureGate>
      )}
      {tab === "stats" && <StatsContent />}
      {tab === "copro" && <CoproContent />}
    </div>
  );
}

function LogementsContent() {
  const [biens, setBiens] = useState<BienEnrichi[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [showAjout, setShowAjout] = useState(false);
  const [editBien, setEditBien] = useState<BienEnrichi | null>(null);
  const [nbDemandesNouv, setNbDemandesNouv] = useState(0);
  const [allPaiements, setAllPaiements] = useState<Paiement[]>([]);

  const loadBiens = useCallback(async () => {
    try {
      const allBiens = await listerBiens();
      const enriched: BienEnrichi[] = await Promise.all(
        allBiens.map(async (bien) => {
          const candidatures = await listerCandidatures(bien.id);
          const paiements = await listerPaiements(bien.id);
          const statut = computeStatut(bien, candidatures);
          return {
            ...bien,
            statut,
            candidatures,
            paiements,
            tauxOccupation: computeTauxOccupation(paiements),
            prochainPaiement: computeProchainPaiement(paiements),
            prochaineRevisionIRL: computeProchaineRevisionIRL(bien),
            diagnosticsExpirants: computeDiagnosticsExpirants(bien),
          };
        })
      );
      setBiens(enriched);
    } catch {
      setBiens([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBiens(); }, [loadBiens]);

  // Charger les paiements globaux et les demandes locataires
  useEffect(() => {
    listerPaiements().then(setAllPaiements).catch(() => {});
    fetch("/api/espaces-locataires")
      .then((r) => r.json())
      .then((data) => {
        const espaces = data.espaces ?? [];
        const nb = espaces.reduce(
          (sum: number, e: any) => sum + (e.demandes ?? []).filter((d: any) => d.statut === "NOUVEAU").length,
          0
        );
        setNbDemandesNouv(nb);
      })
      .catch(() => {});
  }, []);

  const biensFiltres = useMemo(() => {
    if (filtre === "tous") return biens;
    return biens.filter((b) => b.statut === filtre);
  }, [biens, filtre]);

  /* ─── Stats agrégées ───────────────────────────────────────────────────── */

  const stats = useMemo(() => {
    const total = biens.length;
    const loues = biens.filter((b) => b.statut === "loue").length;
    const vacants = biens.filter((b) => b.statut === "vacant").length;
    const revenusMensuels = biens
      .filter((b) => b.statut === "loue")
      .reduce((sum, b) => sum + b.loyer + b.charges + (b.annexes?.reduce((s, a) => s + (a.loyer || 0), 0) ?? 0), 0);
    const tauxGlobal = total > 0 ? Math.round((loues / total) * 100) : 0;
    return { total, loues, vacants, revenusMensuels, tauxGlobal };
  }, [biens]);

  /* ─── Vue d'ensemble — Loyers du mois ────────────────────────────────── */
  const loyersMois = useMemo(() => {
    const now = new Date();
    const moisCourant = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const duMois = allPaiements.filter((p) => p.mois === moisCourant);
    const payes = duMois.filter((p) => p.statut === "paye").length;
    const attendus = duMois.filter((p) => p.statut === "attendu").length;
    const retard = duMois.filter((p) => p.statut === "retard" || p.statut === "impaye").length;
    return { payes, attendus, retard, total: duMois.length };
  }, [allPaiements]);

  /* ─── Vue d'ensemble — Alertes urgentes ────────────────────────────── */
  const alertes = useMemo(() => {
    const now = Date.now();
    const items: { label: string; type: "danger" | "warning" }[] = [];
    for (const b of biens) {
      if (b.dateFin) {
        const joursRestants = Math.ceil((b.dateFin - now) / (1000 * 60 * 60 * 24));
        if (joursRestants > 0 && joursRestants <= 90) {
          items.push({ label: `Fin bail ${b.adresse.slice(0, 25)} — ${joursRestants}j`, type: joursRestants <= 30 ? "danger" : "warning" });
        }
      }
      if (b.dateRevision) {
        const joursRestants = Math.ceil((b.dateRevision - now) / (1000 * 60 * 60 * 24));
        if (joursRestants > 0 && joursRestants <= 30) {
          items.push({ label: `Révision IRL ${b.adresse.slice(0, 25)} — ${joursRestants}j`, type: "warning" });
        }
      }
      for (const d of b.diagnosticsExpirants) {
        items.push({ label: `${d.type} expire ${b.adresse.slice(0, 20)} — ${d.joursRestants}j`, type: d.joursRestants <= 30 ? "danger" : "warning" });
      }
    }
    return items.slice(0, 3);
  }, [biens]);

  async function handleSupprimer(id: string) {
    if (!confirm("Supprimer ce bien et toutes ses données associées ?")) return;
    await supprimerBien(id);
    await loadBiens();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Building2 className="w-7 h-7 text-emerald-600" />
            Tableau de bord
          </h1>
          <p className="text-slate-500 mt-1">Vue d&apos;ensemble de votre parc immobilier</p>
        </div>
        <button
          onClick={() => { setEditBien(null); setShowAjout(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter un bien
        </button>
      </div>

      {/* Stats header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Biens" value={stats.total} icon={<Building2 className="w-5 h-5" />} color="slate" />
        <StatCard
          label="Revenus mensuels"
          value={`${stats.revenusMensuels.toLocaleString("fr-FR")} €`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          label="Taux d'occupation"
          value={`${stats.tauxGlobal}%`}
          icon={<Home className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Vacants"
          value={stats.vacants}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={stats.vacants > 0 ? "red" : "slate"}
        />
      </div>

      {/* Vue d'ensemble */}
      {biens.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Loyers du mois */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loyers du mois</span>
            </div>
            {loyersMois.total > 0 ? (
              <div className="flex items-baseline gap-3">
                <span className="text-lg font-black text-emerald-600">{loyersMois.payes} payé{loyersMois.payes > 1 ? "s" : ""}</span>
                <span className="text-xs text-slate-400">{loyersMois.attendus} attendu{loyersMois.attendus > 1 ? "s" : ""}</span>
                {loyersMois.retard > 0 && (
                  <span className="text-xs font-bold text-red-500">{loyersMois.retard} en retard</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Aucun loyer ce mois</p>
            )}
          </div>

          {/* Alertes urgentes */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alertes</span>
            </div>
            {alertes.length > 0 ? (
              <ul className="space-y-1.5">
                {alertes.map((a, i) => (
                  <li key={i} className={`text-xs font-semibold ${a.type === "danger" ? "text-red-600" : "text-amber-600"}`}>
                    {a.type === "danger" ? "!!" : "!"} {a.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Aucune alerte</p>
            )}
          </div>

          {/* Demandes locataires */}
          <Link
            href="/dashboard/espaces-locataires"
            className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Demandes locataires</span>
            </div>
            {nbDemandesNouv > 0 ? (
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-blue-600">{nbDemandesNouv}</span>
                <span className="text-xs text-slate-400">en attente</span>
                <ChevronRight className="w-4 h-4 text-blue-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
              </div>
            ) : (
              <p className="text-sm text-slate-400">Aucune demande en attente</p>
            )}
          </Link>
        </div>
      )}

      {/* Filtres rapides */}
      {biens.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTRES.map((f) => {
            const count = f.key === "tous" ? biens.length : biens.filter((b) => b.statut === f.key).length;
            return (
              <button
                key={f.key}
                onClick={() => setFiltre(f.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  filtre === f.key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  filtre === f.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Grille biens */}
      {biens.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-slate-700 mb-1">Aucun bien enregistré</p>
          <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
            Commencez par ajouter votre premier bien pour gérer vos baux, quittances et états des lieux.
          </p>
          <button
            onClick={() => { setEditBien(null); setShowAjout(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter votre premier bien
          </button>
        </div>
      ) : biensFiltres.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">Aucun bien pour ce filtre</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {biensFiltres.map((bien) => (
            <BienCard
              key={bien.id}
              bien={bien}
              onSupprimer={() => handleSupprimer(bien.id)}
              onModifier={() => { setEditBien(bien); setShowAjout(true); }}
            />
          ))}
        </div>
      )}

      {/* Modal ajout / modification */}
      {showAjout && (
        <BienFormModal
          bien={editBien}
          onClose={() => { setShowAjout(false); setEditBien(null); }}
          onSaved={() => { setShowAjout(false); setEditBien(null); loadBiens(); }}
        />
      )}
    </div>
  );
}

/* ─── Stat Card ───────────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
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

/* ─── Bien Card ───────────────────────────────────────────────────────────── */

function BienCard({
  bien,
  onSupprimer,
  onModifier,
}: {
  bien: BienEnrichi;
  onSupprimer: () => void;
  onModifier: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const statut = bien.statut || "vacant";
  const cfg = STATUT_CONFIG[statut];
  const candidaturesEnAttente = bien.candidatures.filter(
    (c) => c.statut === "en_attente" || c.statut === "en_analyse" || c.statut === "complet"
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
      {/* Header : Adresse + badge statut + menu */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-slate-900 truncate">{bien.adresse}</h3>
          <span className="text-xs font-bold text-slate-400">{TYPE_LABELS[bien.typeBail] || bien.typeBail}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          {/* Menu contextuel */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-20">
                <button
                  onClick={() => { setMenuOpen(false); onModifier(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Modifier
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onSupprimer(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Infos locataire si loué */}
      {statut === "loue" && (
        <div className="bg-emerald-50/50 rounded-xl p-3 mb-3 space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-slate-800">
              {[bien.locatairePrenom, bien.locataireNom].filter(Boolean).join(" ") || "Locataire"}
            </span>
          </div>
          {bien.dateEntree && (
            <p className="text-xs text-slate-500 ml-6">
              Entrée le {formatDate(bien.dateEntree)}
            </p>
          )}
          <div className="flex items-center justify-between ml-6 text-xs">
            <span className="text-slate-500">
              Loyer CC : <span className="font-bold text-slate-700">{(bien.loyer + bien.charges + (bien.annexes?.reduce((s, a) => s + (a.loyer || 0), 0) ?? 0)).toLocaleString("fr-FR")} €</span>
            </span>
            {bien.prochainPaiement && (
              <span className="text-slate-500">
                Prochain : <span className="font-bold text-slate-700">{bien.prochainPaiement}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Infos candidatures si vacant/sélection */}
      {statut !== "loue" && candidaturesEnAttente.length > 0 && (
        <Link
          href="/dashboard/depot"
          className="flex items-center justify-between bg-amber-50/50 rounded-xl p-3 mb-3 hover:bg-amber-50 transition-colors group"
        >
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-amber-700">{candidaturesEnAttente.length} candidature{candidaturesEnAttente.length > 1 ? "s" : ""} en attente</span>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      {/* Métriques */}
      <div className="space-y-2 mb-4">
        {bien.prochaineRevisionIRL && (
          <MetricRow icon={<TrendingUp className="w-3.5 h-3.5" />} label="Révision IRL" value={bien.prochaineRevisionIRL} />
        )}
        {bien.dateFin && (
          <MetricRow
            icon={<CalendarClock className="w-3.5 h-3.5" />}
            label={`Fin bail${bien.preavisMois ? ` (préavis ${bien.preavisMois}m)` : ""}`}
            value={formatDate(bien.dateFin)}
          />
        )}
        <MetricRow
          icon={<Home className="w-3.5 h-3.5" />}
          label="Taux d'occupation"
          value={`${bien.tauxOccupation}%`}
          valueColor={bien.tauxOccupation >= 80 ? "text-emerald-600" : bien.tauxOccupation >= 50 ? "text-amber-600" : "text-red-500"}
        />
        {bien.diagnosticsExpirants.length > 0 && (
          <div className="flex items-start gap-2 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-amber-600">Diagnostics expirants :</span>
              {bien.diagnosticsExpirants.map((d) => (
                <span key={d.type} className="ml-1 text-slate-500">
                  {d.type} ({d.joursRestants}j)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions rapides avec bienId */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
        <ActionButton
          icon={<Receipt className="w-3.5 h-3.5" />}
          label="Quittance"
          href={`/dashboard/impayes?bienId=${bien.id}`}
        />
        <ActionButton
          icon={<FileText className="w-3.5 h-3.5" />}
          label="Voir bail"
          href={`/dashboard/bails?bienId=${bien.id}`}
        />
        <ActionButton
          icon={<ClipboardList className="w-3.5 h-3.5" />}
          label="Nouvel EDL"
          href={`/dashboard/etats-des-lieux/nouveau?bienId=${bien.id}`}
        />
        <ActionButton
          icon={<Wrench className="w-3.5 h-3.5" />}
          label="Travaux"
          href={`/dashboard/travaux?bienId=${bien.id}`}
        />
        <ActionButton
          icon={<Calculator className="w-3.5 h-3.5" />}
          label="Finances"
          href={`/dashboard/comptabilite?bienId=${bien.id}`}
        />
      </div>
    </div>
  );
}

/* ─── Metric Row ──────────────────────────────────────────────────────────── */

function MetricRow({
  icon,
  label,
  value,
  valueColor = "text-slate-700",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`font-bold ${valueColor}`}>{value}</span>
    </div>
  );
}

/* ─── Action Button ───────────────────────────────────────────────────────── */

function ActionButton({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}

/* ─── Modal Formulaire Bien ───────────────────────────────────────────────── */

function BienFormModal({
  bien,
  onClose,
  onSaved,
}: {
  bien: BienEnrichi | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!bien;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    adresse: bien?.adresse || "",
    typeBail: (bien?.typeBail || "HABITATION_VIDE") as TypeBail,
    statut: (bien?.statut || "vacant") as "loue" | "vacant" | "selection",
    loyer: bien?.loyer?.toString() || "",
    charges: bien?.charges?.toString() || "",
    locataireNom: bien?.locataireNom || "",
    locatairePrenom: bien?.locatairePrenom || "",
    dateEntree: bien?.dateEntree ? new Date(bien.dateEntree).toISOString().split("T")[0] : "",
  });
  const [annexes, setAnnexes] = useState<Annexe[]>(bien?.annexes || []);

  const ANNEXE_LABELS: Record<TypeAnnexe, string> = {
    parking: "🚗 Parking",
    garage: "🏠 Garage",
    box: "📦 Box",
    cave: "🪨 Cave",
    jardin: "🌿 Jardin",
    terrasse: "☀️ Terrasse",
    grenier: "🏚️ Grenier",
    autre: "📎 Autre",
  };

  function addAnnexe() {
    setAnnexes((prev) => [...prev, { id: crypto.randomUUID(), type: "parking", loyer: 0 }]);
  }

  function updateAnnexe(id: string, field: keyof Annexe, value: string | number) {
    setAnnexes((prev) => prev.map((a) => a.id === id ? { ...a, [field]: value } : a));
  }

  function removeAnnexe(id: string) {
    setAnnexes((prev) => prev.filter((a) => a.id !== id));
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.adresse.trim()) return;
    setSaving(true);
    try {
      const data = {
        adresse: form.adresse.trim(),
        typeBail: form.typeBail,
        statut: form.statut,
        loyer: parseFloat(form.loyer) || 0,
        charges: parseFloat(form.charges) || 0,
        locataireNom: form.locataireNom.trim() || undefined,
        locatairePrenom: form.locatairePrenom.trim() || undefined,
        dateEntree: form.dateEntree ? new Date(form.dateEntree).getTime() : undefined,
        annexes: annexes.length > 0 ? annexes : undefined,
      };
      if (isEdit && bien) {
        await mettreAJourBien(bien.id, data);
      } else {
        await creerBien(data);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">
            {isEdit ? "Modifier le bien" : "Ajouter un bien"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Adresse */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Adresse du bien *</label>
            <input
              type="text"
              value={form.adresse}
              onChange={(e) => update("adresse", e.target.value)}
              placeholder="12 rue de la Paix, 75002 Paris"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Type bail */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Type de bail</label>
            <select
              value={form.typeBail}
              onChange={(e) => update("typeBail", e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="HABITATION_VIDE">Habitation vide</option>
              <option value="HABITATION_MEUBLE">Habitation meublée</option>
              <option value="PROFESSIONNEL">Professionnel</option>
            </select>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Statut du logement</label>
            <select
              value={form.statut}
              onChange={(e) => update("statut", e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="vacant">🔴 Vacant</option>
              <option value="selection">🟡 En sélection</option>
              <option value="loue">🟢 Loué</option>
            </select>
          </div>

          {/* Loyer + Charges */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Loyer HC (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.loyer}
                onChange={(e) => update("loyer", e.target.value)}
                placeholder="800"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Charges (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.charges}
                onChange={(e) => update("charges", e.target.value)}
                placeholder="50"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Locataire */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Locataire (optionnel)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={form.locatairePrenom}
                  onChange={(e) => update("locatairePrenom", e.target.value)}
                  placeholder="Jean"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Nom</label>
                <input
                  type="text"
                  value={form.locataireNom}
                  onChange={(e) => update("locataireNom", e.target.value)}
                  placeholder="Dupont"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Date entrée */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Date d&apos;entrée</label>
            <input
              type="date"
              value={form.dateEntree}
              onChange={(e) => update("dateEntree", e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Annexes */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Annexes</p>
              <button
                type="button"
                onClick={addAnnexe}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter
              </button>
            </div>
            {annexes.length === 0 && (
              <p className="text-xs text-slate-400 italic">Aucune annexe (parking, cave, garage…)</p>
            )}
            <div className="space-y-2">
              {annexes.map((annexe) => (
                <div key={annexe.id} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5">
                  <select
                    value={annexe.type}
                    onChange={(e) => updateAnnexe(annexe.id, "type", e.target.value as TypeAnnexe)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {(Object.keys(ANNEXE_LABELS) as TypeAnnexe[]).map((t) => (
                      <option key={t} value={t}>{ANNEXE_LABELS[t]}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Description (optionnel)"
                    value={annexe.description || ""}
                    onChange={(e) => updateAnnexe(annexe.id, "description", e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={annexe.loyer || ""}
                      onChange={(e) => updateAnnexe(annexe.id, "loyer", parseFloat(e.target.value) || 0)}
                      className="w-20 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-400">€</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAnnexe(annexe.id)}
                    className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !form.adresse.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
