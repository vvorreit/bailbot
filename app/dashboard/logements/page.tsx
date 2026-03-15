"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";
import {
  listerBiens,
  listerCandidatures,
  listerPaiements,
  type Bien,
  type Candidature,
  type Paiement,
} from "@/lib/db-local";

/* ─── Types locaux ────────────────────────────────────────────────────────── */

interface BienEnrichi extends Bien {
  candidatures: Candidature[];
  paiements: Paiement[];
  tauxOccupation: number;
  prochainPaiement?: string;
  prochaineRevisionIRL?: string;
  diagnosticsExpirants: Array<{ type: string; dateExpiration: number; joursRestants: number }>;
}

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

/* ─── Composant Principal ─────────────────────────────────────────────────── */

export default function LogementsPage() {
  return (
    <FeatureGate feature="MES_LOGEMENTS">
      <LogementsContent />
    </FeatureGate>
  );
}

function LogementsContent() {
  const [biens, setBiens] = useState<BienEnrichi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
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
    }
    load();
  }, []);

  /* ─── Stats agrégées ───────────────────────────────────────────────────── */

  const stats = useMemo(() => {
    const total = biens.length;
    const loues = biens.filter((b) => b.statut === "loue").length;
    const vacants = biens.filter((b) => b.statut === "vacant").length;
    const revenusMensuels = biens
      .filter((b) => b.statut === "loue")
      .reduce((sum, b) => sum + b.loyer + b.charges, 0);
    const tauxGlobal = total > 0 ? Math.round((loues / total) * 100) : 0;
    return { total, loues, vacants, revenusMensuels, tauxGlobal };
  }, [biens]);

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
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <Building2 className="w-7 h-7 text-emerald-600" />
          Mes logements
        </h1>
        <p className="text-slate-500 mt-1">Vue d&apos;ensemble de votre parc immobilier</p>
      </div>

      {/* Stats header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

      {/* Grille biens */}
      {biens.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-semibold">Aucun bien enregistré</p>
          <p className="text-sm text-slate-400 mt-1">
            Ajoutez votre premier bien depuis le tableau de bord des loyers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {biens.map((bien) => (
            <BienCard key={bien.id} bien={bien} />
          ))}
        </div>
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

function BienCard({ bien }: { bien: BienEnrichi }) {
  const statut = bien.statut || "vacant";
  const cfg = STATUT_CONFIG[statut];
  const candidaturesEnAttente = bien.candidatures.filter(
    (c) => c.statut === "en_attente" || c.statut === "en_analyse" || c.statut === "complet"
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
      {/* Header : Adresse + badge statut */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-slate-900 truncate">{bien.adresse}</h3>
          <span className="text-xs font-bold text-slate-400">{TYPE_LABELS[bien.typeBail] || bien.typeBail}</span>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
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
              Loyer CC : <span className="font-bold text-slate-700">{(bien.loyer + bien.charges).toLocaleString("fr-FR")} €</span>
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

      {/* Métriques : révision IRL, fin bail, diagnostics, occupation */}
      <div className="space-y-2 mb-4">
        {bien.prochaineRevisionIRL && (
          <MetricRow
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            label="Révision IRL"
            value={bien.prochaineRevisionIRL}
          />
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

      {/* Actions rapides */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
        <ActionButton
          icon={<Receipt className="w-3.5 h-3.5" />}
          label="Quittance"
          href="/dashboard/bails"
        />
        <ActionButton
          icon={<FileText className="w-3.5 h-3.5" />}
          label="Voir bail"
          href="/dashboard/bails"
        />
        <ActionButton
          icon={<ClipboardList className="w-3.5 h-3.5" />}
          label="Nouvel EDL"
          href="/dashboard/etats-des-lieux"
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
