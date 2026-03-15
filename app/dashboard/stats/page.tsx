"use client";

import { useEffect, useState, useMemo } from "react";
import { listerBiens, listerPaiements, type Bien, type Paiement } from "@/lib/db-local";
import { BarChart2, TrendingUp, Home, AlertTriangle, Loader2, Banknote } from "lucide-react";

export default function StatsPage() {
  const [biens, setBiens] = useState<Bien[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [b, p] = await Promise.all([listerBiens(), listerPaiements()]);
        setBiens(b);
        setPaiements(p);
      } catch (e) {
        console.error("Erreur chargement stats", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const kpis = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    // Revenus annuels YTD
    const revenusYTD = paiements
      .filter((p) => p.statut === "paye" && p.dateReelle && p.dateReelle >= startOfYear)
      .reduce((sum, p) => sum + (p.montantRecu ?? p.loyerCC), 0);

    // Taux d'occupation global
    const totalBiens = biens.length;
    const loues = biens.filter((b) => b.statut === "loue" || b.locataireNom).length;
    const tauxOccupation = totalBiens > 0 ? Math.round((loues / totalBiens) * 100) : 0;

    // Loyers en retard (montant)
    const loyersRetard = paiements
      .filter((p) => p.statut === "retard" || p.statut === "impaye")
      .reduce((sum, p) => sum + p.loyerCC - (p.montantRecu ?? 0), 0);

    // Charges déductibles YTD — sum of charges from all biens loués * nb mois écoulés
    const moisEcoules = now.getMonth() + 1;
    const chargesDeductibles = biens
      .filter((b) => b.statut === "loue" || b.locataireNom)
      .reduce((sum, b) => sum + b.charges * moisEcoules, 0);

    // Revenus par mois (12 derniers mois)
    const revenusParMois: { label: string; montant: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const moisKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("fr-FR", { month: "short" });
      const montant = paiements
        .filter((p) => p.mois === moisKey && p.statut === "paye")
        .reduce((sum, p) => sum + (p.montantRecu ?? p.loyerCC), 0);
      revenusParMois.push({ label, montant });
    }

    return { revenusYTD, tauxOccupation, loyersRetard, chargesDeductibles, revenusParMois };
  }, [biens, paiements]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
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
          <h1 className="text-2xl font-black text-slate-900">Statistiques financières</h1>
          <p className="text-sm text-slate-400">
            {biens.length} bien{biens.length > 1 ? "s" : ""} · Données locales
          </p>
        </div>
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Revenus YTD"
          value={`${kpis.revenusYTD.toLocaleString("fr-FR")} €`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="emerald"
        />
        <KpiCard
          label="Taux d'occupation"
          value={`${kpis.tauxOccupation}%`}
          icon={<Home className="w-5 h-5" />}
          color="blue"
        />
        <KpiCard
          label="Loyers en retard"
          value={`${kpis.loyersRetard.toLocaleString("fr-FR")} €`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={kpis.loyersRetard > 0 ? "red" : "slate"}
        />
        <KpiCard
          label="Charges déductibles"
          value={`${kpis.chargesDeductibles.toLocaleString("fr-FR")} €`}
          icon={<Banknote className="w-5 h-5" />}
          color="violet"
        />
      </div>

      {/* Graphique revenus mensuels */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 mb-1">Revenus mensuels</h2>
        <p className="text-xs text-slate-400 mb-4">12 derniers mois</p>
        {kpis.revenusParMois.every((m) => m.montant === 0) ? (
          <div className="text-sm text-slate-400 text-center py-8">
            Aucun revenu enregistré sur les 12 derniers mois.
          </div>
        ) : (
          <RevenusChart data={kpis.revenusParMois} />
        )}
      </div>
    </div>
  );
}

/* ─── KPI Card ─────────────────────────────────────────────────────────────── */

function KpiCard({
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
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600",
    slate: "bg-slate-50 text-slate-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
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

/* ─── Revenus Chart (bar chart) ────────────────────────────────────────────── */

function RevenusChart({ data }: { data: { label: string; montant: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.montant), 1);
  const chartH = 140;
  const barW = 36;
  const gap = 8;
  const totalW = data.length * (barW + gap) - gap;
  const paddingLeft = 48;
  const paddingBottom = 28;
  const paddingTop = 20;

  return (
    <svg
      viewBox={`0 0 ${totalW + paddingLeft + 16} ${chartH + paddingBottom + paddingTop}`}
      className="w-full"
    >
      {[0, Math.round(maxVal / 2), maxVal].map((v, i) => {
        const y = paddingTop + chartH - (v / maxVal) * chartH;
        return (
          <g key={i}>
            <text x={paddingLeft - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#94a3b8">
              {v >= 1000 ? `${Math.round(v / 1000)}k` : v}
            </text>
            <line x1={paddingLeft} y1={y} x2={paddingLeft + totalW} y2={y} stroke="#f1f5f9" strokeWidth={1} />
          </g>
        );
      })}

      {data.map((d, i) => {
        const barH = Math.max(2, (d.montant / maxVal) * chartH);
        const x = paddingLeft + i * (barW + gap);
        const y = paddingTop + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill="#059669" opacity={0.85} />
            {d.montant > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fontWeight="bold" fill="#059669">
                {d.montant >= 1000 ? `${(d.montant / 1000).toFixed(1)}k` : d.montant}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={paddingTop + chartH + paddingBottom - 6}
              textAnchor="middle"
              fontSize={9}
              fill="#64748b"
            >
              {d.label}
            </text>
          </g>
        );
      })}

      <line
        x1={paddingLeft}
        y1={paddingTop + chartH}
        x2={paddingLeft + totalW}
        y2={paddingTop + chartH}
        stroke="#e2e8f0"
        strokeWidth={1}
      />
    </svg>
  );
}
