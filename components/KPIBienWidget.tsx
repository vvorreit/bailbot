"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Landmark,
  Plus,
  BarChart2,
  Percent,
  ArrowUpRight,
  Eye,
} from "lucide-react";
import { calculerKPIs, type KPIsRendement, type DonneesBien } from "@/lib/calculs-rendement";
import { genererTableauAmortissement } from "@/lib/amortissement";
import { getPrets, getTableauAmortissement } from "@/app/actions/pret";
import PretModal from "@/components/PretModal";
import TableauAmortissementModal from "@/components/TableauAmortissement";
import type { TableauAmortissement } from "@/lib/amortissement";

interface PretData {
  id: string;
  nom: string;
  capitalEmprunte: any;
  tauxAnnuelPct: any;
  dureeMois: number;
  dateDebut: string | Date;
  assuranceMensuelle: any;
  fraisDossier: any;
  garantie: any;
}

interface Props {
  bienId: string;
  bailActif: {
    loyerMensuel: number;
    chargesMensuelles: number;
    prixAchat?: number | null;
    valeurActuelle?: number | null;
    taxeFonciere?: number | null;
    chargesAnnuelles?: number | null;
    fraisGestionPct?: number | null;
    trancheMarginalePct?: number | null;
    dateDebut: string | Date;
  } | null;
  surface?: number | null;
}

export default function KPIBienWidget({ bienId, bailActif, surface }: Props) {
  const [prets, setPrets] = useState<PretData[]>([]);
  const [pretModalOpen, setPretModalOpen] = useState(false);
  const [tableauModal, setTableauModal] = useState<{ open: boolean; tableau: TableauAmortissement | null; nom: string }>({
    open: false,
    tableau: null,
    nom: "",
  });
  const [loading, setLoading] = useState(true);

  const loadPrets = useCallback(async () => {
    try {
      const data = await getPrets(bienId);
      setPrets(data as unknown as PretData[]);
    } catch { /* ignore */ }
    setLoading(false);
  }, [bienId]);

  useEffect(() => { loadPrets(); }, [loadPrets]);

  const pretPrincipal = prets[0];
  const mensualiteCredit = useMemo(() => {
    if (!pretPrincipal) return 0;
    const t = genererTableauAmortissement({
      capitalEmprunte: Number(pretPrincipal.capitalEmprunte),
      tauxAnnuelPct: Number(pretPrincipal.tauxAnnuelPct),
      dureeMois: pretPrincipal.dureeMois,
      dateDebut: new Date(pretPrincipal.dateDebut),
      assuranceMensuelle: Number(pretPrincipal.assuranceMensuelle ?? 0),
    });
    return t.mensualiteAvecAssurance;
  }, [pretPrincipal]);

  const kpis: KPIsRendement | null = useMemo(() => {
    if (!bailActif) return null;
    const prixAchat = Number(bailActif.prixAchat ?? 0);
    if (prixAchat <= 0) return null;

    const donnees: DonneesBien = {
      prixAchat,
      valeurActuelle: bailActif.valeurActuelle ? Number(bailActif.valeurActuelle) : undefined,
      loyerMensuelHC: bailActif.loyerMensuel,
      chargesMensuelles: bailActif.chargesMensuelles,
      taxeFonciere: Number(bailActif.taxeFonciere ?? 0),
      chargesAnnuelles: Number(bailActif.chargesAnnuelles ?? 0),
      fraisGestionPct: Number(bailActif.fraisGestionPct ?? 0),
      trancheMarginalePct: Number(bailActif.trancheMarginalePct ?? 30),
      surface: surface ? Number(surface) : undefined,
      mensualiteCredit,
    };
    return calculerKPIs(donnees);
  }, [bailActif, surface, mensualiteCredit]);

  const pretTableau = useMemo(() => {
    if (!pretPrincipal) return null;
    return genererTableauAmortissement({
      capitalEmprunte: Number(pretPrincipal.capitalEmprunte),
      tauxAnnuelPct: Number(pretPrincipal.tauxAnnuelPct),
      dureeMois: pretPrincipal.dureeMois,
      dateDebut: new Date(pretPrincipal.dateDebut),
      assuranceMensuelle: Number(pretPrincipal.assuranceMensuelle ?? 0),
      fraisDossier: Number(pretPrincipal.fraisDossier ?? 0),
      garantie: Number(pretPrincipal.garantie ?? 0),
    });
  }, [pretPrincipal]);

  const pretProgress = useMemo(() => {
    if (!pretTableau || !pretPrincipal) return null;
    const debut = new Date(pretPrincipal.dateDebut);
    const now = new Date();
    const moisEcoules = (now.getFullYear() - debut.getFullYear()) * 12 + (now.getMonth() - debut.getMonth());
    const moisCourant = Math.max(0, Math.min(moisEcoules, pretPrincipal.dureeMois));
    const echeanceCourante = pretTableau.echeances[moisCourant - 1];
    const capitalRestant = echeanceCourante?.capitalRestant ?? Number(pretPrincipal.capitalEmprunte);
    const pctRembourse = ((Number(pretPrincipal.capitalEmprunte) - capitalRestant) / Number(pretPrincipal.capitalEmprunte)) * 100;
    const anneeCourante = Math.ceil(moisCourant / 12);
    const anneeTotal = Math.ceil(pretPrincipal.dureeMois / 12);
    return { capitalRestant, pctRembourse, anneeCourante, anneeTotal, moisCourant };
  }, [pretTableau, pretPrincipal]);

  const openTableau = async () => {
    if (!pretPrincipal || !pretTableau) return;
    setTableauModal({ open: true, tableau: pretTableau, nom: pretPrincipal.nom });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-slate-50 rounded-xl" />
          <div className="h-16 bg-slate-50 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!bailActif) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-emerald-600" />
          KPIs financiers
        </h2>
        <p className="text-sm text-slate-400 text-center py-4">Aucun bail actif</p>
      </div>
    );
  }

  const noPrixAchat = !bailActif.prixAchat || Number(bailActif.prixAchat) <= 0;

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-emerald-600" />
          KPIs financiers
        </h2>

        {noPrixAchat && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700">
              Renseignez le prix d&apos;achat dans les donnees financieres du bail pour calculer les rendements.
            </p>
          </div>
        )}

        {/* Rendements */}
        {kpis && (
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Rendements</h3>
            <div className="grid grid-cols-3 gap-2">
              <KPICard
                label="Brut"
                value={`${kpis.rendementBrut.toFixed(1)} %`}
                icon={<TrendingUp className="w-3.5 h-3.5" />}
                color={kpis.rendementBrut >= 5 ? "emerald" : kpis.rendementBrut >= 3 ? "amber" : "red"}
              />
              <KPICard
                label="Net"
                value={`${kpis.rendementNet.toFixed(1)} %`}
                icon={<TrendingUp className="w-3.5 h-3.5" />}
                color={kpis.rendementNet >= 4 ? "emerald" : kpis.rendementNet >= 2 ? "amber" : "red"}
              />
              <KPICard
                label="Net-net"
                value={`${kpis.rendementNetNet.toFixed(1)} %`}
                icon={<Percent className="w-3.5 h-3.5" />}
                color={kpis.rendementNetNet >= 3 ? "emerald" : kpis.rendementNetNet >= 1 ? "amber" : "red"}
              />
            </div>
          </div>
        )}

        {/* Cash-flow */}
        {kpis && (
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Cash-flow</h3>
            <div className="grid grid-cols-2 gap-2">
              <KPICard
                label="Mensuel"
                value={`${kpis.cashFlowMensuel >= 0 ? "+" : ""}${kpis.cashFlowMensuel.toLocaleString("fr-FR")} EUR`}
                icon={kpis.cashFlowMensuel >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                color={kpis.cashFlowMensuel >= 0 ? "emerald" : "red"}
              />
              <KPICard
                label="Annuel"
                value={`${kpis.cashFlowAnnuel >= 0 ? "+" : ""}${kpis.cashFlowAnnuel.toLocaleString("fr-FR")} EUR`}
                icon={<Wallet className="w-3.5 h-3.5" />}
                color={kpis.cashFlowAnnuel >= 0 ? "emerald" : "red"}
              />
            </div>
          </div>
        )}

        {/* Pret */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Pret immobilier</h3>
          {pretPrincipal && pretProgress && pretTableau ? (
            <div className="bg-slate-50 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{pretPrincipal.nom}</span>
                <span className="text-[10px] text-slate-400">
                  Annee {pretProgress.anneeCourante} / {pretProgress.anneeTotal}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Mensualite</span>
                <span className="font-bold text-slate-900">
                  {pretTableau.mensualiteAvecAssurance.toLocaleString("fr-FR")} EUR
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Capital restant</span>
                <span className="font-bold text-slate-900">
                  {pretProgress.capitalRestant.toLocaleString("fr-FR")} EUR
                </span>
              </div>
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Rembourse</span>
                  <span className="font-bold text-emerald-600">{pretProgress.pctRembourse.toFixed(1)} %</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, pretProgress.pctRembourse)}%` }}
                  />
                </div>
              </div>
              <button
                onClick={openTableau}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> Tableau d&apos;amortissement
              </button>
            </div>
          ) : (
            <button
              onClick={() => setPretModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-dashed border-emerald-300 transition-colors"
            >
              <Plus className="w-4 h-4" /> Ajouter un pret
            </button>
          )}
        </div>

        {/* Performance */}
        {kpis && (
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Performance</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Taux d&apos;occupation</span>
                <span className="font-bold text-slate-900">{kpis.tauxOccupation.toFixed(0)} %</span>
              </div>
              {kpis.loyerM2 != null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Loyer / m2</span>
                  <span className="font-bold text-slate-900">{kpis.loyerM2.toFixed(2)} EUR/m2</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Ratio charges / loyer</span>
                <span className={`font-bold ${kpis.ratioChargesLoyer > 30 ? "text-red-600" : "text-slate-900"}`}>
                  {kpis.ratioChargesLoyer.toFixed(1)} %
                </span>
              </div>
              {kpis.plusValueLatente != null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Plus-value latente</span>
                  <span className={`font-bold flex items-center gap-1 ${kpis.plusValueLatente >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {kpis.plusValueLatente >= 0 && <ArrowUpRight className="w-3 h-3" />}
                    {kpis.plusValueLatente >= 0 ? "+" : ""}{kpis.plusValueLatente.toLocaleString("fr-FR")} EUR
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <PretModal
        bienId={bienId}
        open={pretModalOpen}
        onClose={() => setPretModalOpen(false)}
        onCreated={loadPrets}
      />

      {tableauModal.tableau && (
        <TableauAmortissementModal
          tableau={tableauModal.tableau}
          nomPret={tableauModal.nom}
          open={tableauModal.open}
          onClose={() => setTableauModal({ open: false, tableau: null, nom: "" })}
        />
      )}
    </>
  );
}

function KPICard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "emerald" | "amber" | "red" | "blue";
}) {
  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <div className={`rounded-xl p-2.5 ${colorMap[color]}`}>
      <div className="flex items-center gap-1 mb-0.5 opacity-70">
        {icon}
        <span className="text-[10px] font-bold uppercase">{label}</span>
      </div>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
}
