"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Wallet,
  Landmark,
  Loader2,
  ExternalLink,
  Download,
} from "lucide-react";
import { getPortefeuilleFinancier } from "@/app/actions/finances";

type PortefeuilleRow = {
  bienId: string;
  adresse: string;
  loyerCC: number;
  rendementBrut: number;
  rendementNet: number;
  cashFlowMensuel: number;
  mensualiteCredit: number;
  capitalRestant: number;
  hasBail: boolean;
  hasPret: boolean;
};

type Totaux = {
  revenuMensuel: number;
  cashFlowNet: number;
  encoursTotal: number;
  mensualitesTotales: number;
};

export default function FinancesContent() {
  const [rows, setRows] = useState<PortefeuilleRow[]>([]);
  const [totaux, setTotaux] = useState<Totaux>({ revenuMensuel: 0, cashFlowNet: 0, encoursTotal: 0, mensualitesTotales: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPortefeuilleFinancier()
      .then(({ rows, totaux }) => {
        setRows(rows);
        setTotaux(totaux);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = useCallback(() => {
    const header = "Bien;Loyer CC;Rendement brut;Rendement net;Cash-flow mensuel;Mensualite;Capital restant\n";
    const body = rows
      .map((r) =>
        [
          r.adresse,
          fmt(r.loyerCC),
          `${r.rendementBrut.toFixed(1)}%`,
          `${r.rendementNet.toFixed(1)}%`,
          fmt(r.cashFlowMensuel),
          fmt(r.mensualiteCredit),
          fmt(r.capitalRestant),
        ].join(";")
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portefeuille-finances.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Export button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={exportCSV}
          disabled={rows.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40"
        >
          <Download className="w-4 h-4" /> Exporter CSV
        </button>
      </div>

      {/* Stats totaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Revenu mensuel"
          value={`${fmt(totaux.revenuMensuel)} EUR`}
          icon={<Wallet className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          label="Cash-flow net"
          value={`${totaux.cashFlowNet >= 0 ? "+" : ""}${fmt(totaux.cashFlowNet)} EUR`}
          icon={<TrendingUp className="w-5 h-5" />}
          color={totaux.cashFlowNet >= 0 ? "emerald" : "red"}
        />
        <StatCard
          label="Mensualites totales"
          value={`${fmt(totaux.mensualitesTotales)} EUR`}
          icon={<Landmark className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Encours total prets"
          value={`${fmt(totaux.encoursTotal)} EUR`}
          icon={<Landmark className="w-5 h-5" />}
          color="slate"
        />
      </div>

      {/* Tableau biens */}
      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <p className="text-sm text-slate-400">Aucun bien enregistre</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700"
          >
            Ajouter un bien
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4">Bien</th>
                  <th className="text-right py-3 px-4">Loyer CC</th>
                  <th className="text-right py-3 px-4">Rdt brut</th>
                  <th className="text-right py-3 px-4">Rdt net</th>
                  <th className="text-right py-3 px-4">Cash-flow</th>
                  <th className="text-right py-3 px-4">Mensualite</th>
                  <th className="text-right py-3 px-4">Capital restant</th>
                  <th className="text-center py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.bienId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 truncate block max-w-[200px]">{r.adresse}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {!r.hasBail && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-full font-bold">Pas de bail</span>
                        )}
                        {!r.hasPret && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-full font-bold">Pas de pret</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-700">{fmt(r.loyerCC)}</td>
                    <td className="py-3 px-4 text-right"><RdtBadge value={r.rendementBrut} /></td>
                    <td className="py-3 px-4 text-right"><RdtBadge value={r.rendementNet} /></td>
                    <td className={`py-3 px-4 text-right font-bold ${r.cashFlowMensuel >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {r.cashFlowMensuel >= 0 ? "+" : ""}{fmt(r.cashFlowMensuel)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">{r.mensualiteCredit > 0 ? fmt(r.mensualiteCredit) : "—"}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{r.capitalRestant > 0 ? fmt(r.capitalRestant) : "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/dashboard/biens/${r.bienId}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        <ExternalLink className="w-3 h-3" /> Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold text-slate-900 border-t-2 border-slate-200 bg-slate-50">
                  <td className="py-3 px-4">Total ({rows.length} biens)</td>
                  <td className="py-3 px-4 text-right">{fmt(totaux.revenuMensuel)}</td>
                  <td className="py-3 px-4 text-right">—</td>
                  <td className="py-3 px-4 text-right">—</td>
                  <td className={`py-3 px-4 text-right ${totaux.cashFlowNet >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {totaux.cashFlowNet >= 0 ? "+" : ""}{fmt(totaux.cashFlowNet)}
                  </td>
                  <td className="py-3 px-4 text-right">{fmt(totaux.mensualitesTotales)}</td>
                  <td className="py-3 px-4 text-right">{fmt(totaux.encoursTotal)}</td>
                  <td className="py-3 px-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function RdtBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-slate-400">—</span>;
  const color = value >= 5 ? "text-emerald-700 bg-emerald-50" : value >= 3 ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {value.toFixed(1)} %
    </span>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-50 text-slate-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colors[color] ?? colors.slate}`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
