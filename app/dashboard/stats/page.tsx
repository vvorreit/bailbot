"use client";

import { useEffect, useState } from "react";
import { toutesLesCandidatures, type Candidature } from "@/lib/db-local";
import { BarChart2, TrendingUp, Clock, Users, AlertTriangle, CheckCircle } from "lucide-react";

interface Stats {
  dossiersTraitesCeMois: number;
  pourcentageEligibleVisale: number;
  bailScoreMoyen: number;
  tempsTraitementMoyen: number; // jours
  topMotifsRefus: { motif: string; count: number }[];
  dossiersByWeek: { label: string; count: number }[];
}

function getWeekLabel(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 1 - day); // Monday
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
}

function computeStats(candidatures: Candidature[]): Stats {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // Dossiers traités ce mois
  const dossiersTraitesCeMois = candidatures.filter(
    (c) => c.createdAt >= startOfMonth
  ).length;

  // % éligible Visale
  const avecEligibilite = candidatures.filter((c) => c.eligibleVisale !== undefined);
  const pourcentageEligibleVisale =
    avecEligibilite.length > 0
      ? Math.round(
          (avecEligibilite.filter((c) => c.eligibleVisale).length /
            avecEligibilite.length) *
            100
        )
      : 0;

  // BailScore moyen
  const avecScore = candidatures.filter((c) => c.bailScore !== undefined && c.bailScore !== null);
  const bailScoreMoyen =
    avecScore.length > 0
      ? Math.round(
          avecScore.reduce((s, c) => s + (c.bailScore ?? 0), 0) / avecScore.length
        )
      : 0;

  // Temps de traitement moyen (créatedAt → statut complet)
  const complets = candidatures.filter((c) => c.statut === "complet");
  const tempsTraitementMoyen =
    complets.length > 0
      ? Math.round(
          complets.reduce((s, c) => {
            const jours = (c.updatedAt - c.createdAt) / (1000 * 60 * 60 * 24);
            return s + jours;
          }, 0) / complets.length
        )
      : 0;

  // Top motifs de refus (depuis pointsAttention des dossiers)
  const motifsCount: Record<string, number> = {};
  candidatures
    .filter((c) => c.statut === "refuse")
    .forEach((c) => {
      const dossier = c.dossier;
      const salaire = dossier?.salaireNetMensuel ?? 0;
      const contrat = (dossier?.typeContrat ?? "").toUpperCase();

      // Analyser les motifs courants
      if (salaire > 0) {
        // On doit avoir le bien pour calculer le ratio, on approche via bailScore
        if ((c.bailScore ?? 100) < 35) {
          motifsCount["Ratio loyer élevé"] = (motifsCount["Ratio loyer élevé"] ?? 0) + 1;
        }
      }
      if (contrat.includes("CDD")) {
        motifsCount["CDD court"] = (motifsCount["CDD court"] ?? 0) + 1;
      }
      if (contrat.includes("INTERIM") || contrat.includes("INTÉRIM")) {
        motifsCount["Contrat intérim"] = (motifsCount["Contrat intérim"] ?? 0) + 1;
      }
      if (!dossier?.salaireNetMensuel) {
        motifsCount["Dossier incomplet"] = (motifsCount["Dossier incomplet"] ?? 0) + 1;
      }
      if (c.alertesFraude && c.alertesFraude > 0) {
        motifsCount["Alerte fraude"] = (motifsCount["Alerte fraude"] ?? 0) + 1;
      }
      if ((c.completude?.pourcentage ?? 100) < 60) {
        motifsCount["Complétude faible"] = (motifsCount["Complétude faible"] ?? 0) + 1;
      }
    });

  const topMotifsRefus = Object.entries(motifsCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([motif, count]) => ({ motif, count }));

  // Dossiers par semaine sur 4 semaines
  const weeks: { label: string; start: number; end: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    const day = monday.getDay() || 7;
    monday.setDate(monday.getDate() + 1 - day - i * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    weeks.push({
      label: getWeekLabel(monday),
      start: monday.getTime(),
      end: sunday.getTime(),
    });
  }

  const dossiersByWeek = weeks.map((w) => ({
    label: w.label,
    count: candidatures.filter((c) => c.createdAt >= w.start && c.createdAt <= w.end).length,
  }));

  return {
    dossiersTraitesCeMois,
    pourcentageEligibleVisale,
    bailScoreMoyen,
    tempsTraitementMoyen,
    topMotifsRefus,
    dossiersByWeek,
  };
}

function BarChart({ data }: { data: { label: string; count: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const chartH = 120;
  const barW = 48;
  const gap = 16;
  const totalW = data.length * (barW + gap) - gap;
  const paddingLeft = 32;
  const paddingBottom = 28;
  const paddingTop = 16;

  return (
    <svg
      viewBox={`0 0 ${totalW + paddingLeft + 16} ${chartH + paddingBottom + paddingTop}`}
      className="w-full max-w-sm"
    >
      {/* Y axis labels */}
      {[0, Math.round(maxVal / 2), maxVal].map((v, i) => {
        const y = paddingTop + chartH - (v / maxVal) * chartH;
        return (
          <text key={i} x={paddingLeft - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">
            {v}
          </text>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = Math.max(4, (d.count / maxVal) * chartH);
        const x = paddingLeft + i * (barW + gap);
        const y = paddingTop + chartH - barH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={6}
              fill="#059669"
              opacity={0.85}
            />
            <text
              x={x + barW / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight="bold"
              fill="#059669"
            >
              {d.count}
            </text>
            <text
              x={x + barW / 2}
              y={paddingTop + chartH + paddingBottom - 6}
              textAnchor="middle"
              fontSize={10}
              fill="#64748b"
            >
              {d.label}
            </text>
          </g>
        );
      })}

      {/* Baseline */}
      <line
        x1={paddingLeft}
        y1={paddingTop + chartH}
        x2={paddingLeft + totalW + 16}
        y2={paddingTop + chartH}
        stroke="#e2e8f0"
        strokeWidth={1}
      />
    </svg>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "emerald",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: "emerald" | "blue" | "violet" | "amber";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-4 shadow-sm">
      <div className={`p-2.5 rounded-xl ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-black text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const candidatures = await toutesLesCandidatures();
        setTotal(candidatures.length);
        setStats(computeStats(candidatures));
      } catch (e) {
        console.error("Erreur chargement stats", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400 animate-pulse">Chargement des statistiques…</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-red-400">Erreur lors du chargement.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-50 rounded-xl">
          <BarChart2 className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Statistiques</h1>
          <p className="text-sm text-slate-400">{total} dossier{total > 1 ? "s" : ""} au total · Données locales (IndexedDB)</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Dossiers ce mois"
          value={stats.dossiersTraitesCeMois}
          sub="créés ce mois-ci"
          color="emerald"
        />
        <StatCard
          icon={CheckCircle}
          label="Éligible Visale"
          value={`${stats.pourcentageEligibleVisale}%`}
          sub="des dossiers analysés"
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="BailScore moyen"
          value={stats.bailScoreMoyen > 0 ? stats.bailScoreMoyen : "—"}
          sub="sur 100"
          color="violet"
        />
        <StatCard
          icon={Clock}
          label="Délai traitement"
          value={stats.tempsTraitementMoyen > 0 ? `${stats.tempsTraitementMoyen}j` : "—"}
          sub="jusqu'à statut complet"
          color="amber"
        />
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 mb-1">Dossiers par semaine</h2>
        <p className="text-xs text-slate-400 mb-4">4 dernières semaines</p>
        {stats.dossiersByWeek.every((w) => w.count === 0) ? (
          <div className="text-sm text-slate-400 text-center py-8">
            Aucun dossier sur les 4 dernières semaines.
          </div>
        ) : (
          <BarChart data={stats.dossiersByWeek} />
        )}
      </div>

      {/* Top motifs refus */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-slate-700">Top motifs de refus</h2>
        </div>
        {stats.topMotifsRefus.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun refus enregistré.</p>
        ) : (
          <div className="space-y-3">
            {stats.topMotifsRefus.map((m, i) => {
              const maxCount = stats.topMotifsRefus[0]?.count ?? 1;
              const pct = Math.round((m.count / maxCount) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-700">{m.motif}</span>
                    <span className="text-slate-400 font-mono">{m.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-amber-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
