"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import type { TableauAmortissement as TTableau, EcheancePret } from "@/lib/amortissement";
import { Download, ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface Props {
  tableau: TTableau;
  nomPret?: string;
  open: boolean;
  onClose: () => void;
}

type Vue = "mensuel" | "annuel";
const LIGNES_PAR_PAGE = 12;

interface SyntheseAnnuelle {
  annee: number;
  capital: number;
  interets: number;
  assurance: number;
  mensualiteTotal: number;
  capitalRestantFin: number;
}

export default function TableauAmortissementModal({ tableau, nomPret, open, onClose }: Props) {
  const [vue, setVue] = useState<Vue>("mensuel");
  const [page, setPage] = useState(0);

  const now = new Date();
  const moisCourantKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const synthesesAnnuelles = useMemo((): SyntheseAnnuelle[] => {
    const byYear = new Map<number, EcheancePret[]>();
    for (const e of tableau.echeances) {
      const y = e.date.getFullYear();
      if (!byYear.has(y)) byYear.set(y, []);
      byYear.get(y)!.push(e);
    }
    return Array.from(byYear.entries())
      .sort(([a], [b]) => a - b)
      .map(([annee, echeances]) => ({
        annee,
        capital: round2(echeances.reduce((s, e) => s + e.capital, 0)),
        interets: round2(echeances.reduce((s, e) => s + e.interets, 0)),
        assurance: round2(echeances.reduce((s, e) => s + e.assurance, 0)),
        mensualiteTotal: round2(echeances.reduce((s, e) => s + e.mensualite, 0)),
        capitalRestantFin: echeances[echeances.length - 1].capitalRestant,
      }));
  }, [tableau.echeances]);

  const dataMensuel = tableau.echeances;
  const totalPages = Math.ceil(dataMensuel.length / LIGNES_PAR_PAGE);
  const paginated = dataMensuel.slice(page * LIGNES_PAR_PAGE, (page + 1) * LIGNES_PAR_PAGE);

  const exportCSV = () => {
    const header = "Mois;Date;Mensualite;Capital;Interets;Assurance;Capital restant\n";
    const rows = tableau.echeances
      .map((e) =>
        [
          e.mois,
          formatDate(e.date),
          fmt(e.mensualite),
          fmt(e.capital),
          fmt(e.interets),
          fmt(e.assurance),
          fmt(e.capitalRestant),
        ].join(";")
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amortissement-${nomPret ?? "pret"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={open} onClose={onClose} title={`Tableau d'amortissement${nomPret ? ` — ${nomPret}` : ""}`} size="xl">
      {/* Header stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard label="Mensualite" value={`${fmt(tableau.mensualiteAvecAssurance)} EUR`} color="emerald" />
        <StatCard label="Total interets" value={`${fmt(tableau.totalInterets)} EUR`} color="amber" />
        <StatCard label="Cout total credit" value={`${fmt(tableau.coutTotal)} EUR`} color="red" />
        <StatCard label="TEG" value={`${tableau.tauxEffectifGlobalPct.toFixed(2)} %`} color="blue" />
      </div>

      {/* Graphique simple CSS */}
      <div className="bg-slate-50 rounded-xl p-4 mb-5">
        <h3 className="text-xs font-black text-slate-600 uppercase mb-3">Evolution du capital</h3>
        <div className="flex items-end gap-[1px] h-24">
          {tableau.echeances
            .filter((_, i) => i % Math.max(1, Math.floor(tableau.echeances.length / 60)) === 0)
            .map((e, i) => {
              const pctRestant = (e.capitalRestant / Number(tableau.totalCapital + tableau.echeances[0]?.capitalRestant || 1)) * 100;
              const totalRef = tableau.echeances[0]?.capitalRestant || 1;
              const hRestant = (e.capitalRestant / totalRef) * 100;
              const hRembourse = 100 - hRestant;
              return (
                <div key={i} className="flex-1 flex flex-col justify-end h-full" title={`Mois ${e.mois}: ${fmt(e.capitalRestant)} EUR restant`}>
                  <div className="bg-emerald-400 rounded-t-sm" style={{ height: `${hRembourse}%` }} />
                  <div className="bg-slate-300 rounded-b-sm" style={{ height: `${hRestant}%` }} />
                </div>
              );
            })}
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
          <span>Debut</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-sm" /> Capital rembourse</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-slate-300 rounded-sm" /> Capital restant</span>
          </div>
          <span>Fin</span>
        </div>
      </div>

      {/* Toggle vue */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => { setVue("mensuel"); setPage(0); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${vue === "mensuel" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setVue("annuel")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${vue === "annuel" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Annuel
          </button>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Exporter CSV
        </button>
      </div>

      {/* Tableau mensuel */}
      {vue === "mensuel" && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-200">
                  <th className="text-left py-2 px-2">Mois</th>
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-right py-2 px-2">Mensualite</th>
                  <th className="text-right py-2 px-2">Capital</th>
                  <th className="text-right py-2 px-2">Interets</th>
                  <th className="text-right py-2 px-2">Assurance</th>
                  <th className="text-right py-2 px-2">Capital restant</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((e) => {
                  const dateKey = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
                  const isCurrent = dateKey === moisCourantKey;
                  return (
                    <tr
                      key={e.mois}
                      className={`border-b border-slate-50 ${isCurrent ? "bg-emerald-50 font-bold" : ""}`}
                    >
                      <td className="py-1.5 px-2 text-slate-600">
                        {isCurrent && <Calendar className="w-3 h-3 inline mr-1 text-emerald-600" />}
                        {e.mois}
                      </td>
                      <td className="py-1.5 px-2 text-slate-500">{formatDate(e.date)}</td>
                      <td className="py-1.5 px-2 text-right text-slate-700">{fmt(e.mensualite)}</td>
                      <td className="py-1.5 px-2 text-right text-emerald-700">{fmt(e.capital)}</td>
                      <td className="py-1.5 px-2 text-right text-amber-600">{fmt(e.interets)}</td>
                      <td className="py-1.5 px-2 text-right text-slate-500">{fmt(e.assurance)}</td>
                      <td className="py-1.5 px-2 text-right text-slate-700 font-semibold">{fmt(e.capitalRestant)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold text-slate-900 border-t-2 border-slate-200">
                  <td colSpan={2} className="py-2 px-2">Total</td>
                  <td className="py-2 px-2 text-right">{fmt(tableau.totalCapital + tableau.totalInterets + tableau.totalAssurance)}</td>
                  <td className="py-2 px-2 text-right text-emerald-700">{fmt(tableau.totalCapital)}</td>
                  <td className="py-2 px-2 text-right text-amber-600">{fmt(tableau.totalInterets)}</td>
                  <td className="py-2 px-2 text-right text-slate-500">{fmt(tableau.totalAssurance)}</td>
                  <td className="py-2 px-2 text-right">0</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Precedent
              </button>
              <span className="text-xs text-slate-400">
                Page {page + 1} / {totalPages} (annee {Math.floor(page * LIGNES_PAR_PAGE / 12) + 1})
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30"
              >
                Suivant <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Tableau annuel */}
      {vue === "annuel" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-200">
                <th className="text-left py-2 px-2">Annee</th>
                <th className="text-right py-2 px-2">Total verse</th>
                <th className="text-right py-2 px-2">Capital</th>
                <th className="text-right py-2 px-2">Interets</th>
                <th className="text-right py-2 px-2">Assurance</th>
                <th className="text-right py-2 px-2">Capital restant</th>
              </tr>
            </thead>
            <tbody>
              {synthesesAnnuelles.map((s) => {
                const isCurrent = s.annee === now.getFullYear();
                return (
                  <tr key={s.annee} className={`border-b border-slate-50 ${isCurrent ? "bg-emerald-50 font-bold" : ""}`}>
                    <td className="py-1.5 px-2 text-slate-700">{s.annee}</td>
                    <td className="py-1.5 px-2 text-right text-slate-700">{fmt(s.mensualiteTotal)}</td>
                    <td className="py-1.5 px-2 text-right text-emerald-700">{fmt(s.capital)}</td>
                    <td className="py-1.5 px-2 text-right text-amber-600">{fmt(s.interets)}</td>
                    <td className="py-1.5 px-2 text-right text-slate-500">{fmt(s.assurance)}</td>
                    <td className="py-1.5 px-2 text-right text-slate-700 font-semibold">{fmt(s.capitalRestantFin)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <div className={`rounded-xl p-3 ${colors[color] ?? colors.emerald}`}>
      <p className="text-[10px] font-bold uppercase opacity-70">{label}</p>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
