"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calculator,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  Banknote,
  AlertTriangle,
} from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";
import RecapFiscalAnnuel from "@/components/RecapFiscalAnnuel";
import {
  listerBiens,
  listerPaiements,
  type Bien,
  type Paiement,
} from "@/lib/db-local";
import {
  calculerRecapFiscal,
  genererCSV,
  genererPDF,
  type RecapFiscal,
  type ConfigFiscalBien,
} from "@/lib/recapitulatif-fiscal";

/* ─── localStorage helpers pour persister les configs fiscales ──────────── */

const STORAGE_KEY = "bailbot-fiscal-configs";

function loadConfigs(): Record<string, ConfigFiscalBien> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveConfigs(configs: Record<string, ConfigFiscalBien>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function euros(n: number) {
  return (
    n.toLocaleString("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + " €"
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export default function ComptabilitePage() {
  return (
    <FeatureGate feature="COMPTABILITE_FISCALE">
      <ComptabiliteContent />
    </FeatureGate>
  );
}

function ComptabiliteContent() {
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [biens, setBiens] = useState<Bien[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [configs, setConfigs] = useState<Record<string, ConfigFiscalBien>>({});
  const [loading, setLoading] = useState(true);

  /* Charger les données IndexedDB */
  useEffect(() => {
    async function load() {
      try {
        const [b, p] = await Promise.all([listerBiens(), listerPaiements()]);
        setBiens(b);
        setPaiements(p);
        setConfigs(loadConfigs());
      } catch {
        setBiens([]);
        setPaiements([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* Calculer le récap */
  const recap: RecapFiscal = useMemo(
    () => calculerRecapFiscal(biens, paiements, configs, annee),
    [biens, paiements, configs, annee]
  );

  /* Callback changement config d'un bien */
  const handleConfigChange = useCallback(
    (bienId: string, config: ConfigFiscalBien) => {
      setConfigs((prev) => {
        const next = { ...prev, [bienId]: config };
        saveConfigs(next);
        return next;
      });
    },
    []
  );

  /* Export CSV */
  const handleCSV = useCallback(() => {
    const csv = genererCSV(recap);
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recap-fiscal-${recap.annee}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [recap]);

  /* Export PDF */
  const handlePDF = useCallback(() => {
    const doc = genererPDF(recap);
    doc.save(`recap-fiscal-${recap.annee}.pdf`);
  }, [recap]);

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Calculator className="w-7 h-7 text-emerald-600" />
            Comptabilité fiscale
          </h1>
          <p className="text-slate-500 mt-1">
            Récapitulatif annuel de vos revenus locatifs
          </p>
        </div>

        {/* Sélecteur année + exports */}
        <div className="flex items-center gap-3">
          {/* Année */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-1 py-1">
            <button
              onClick={() => setAnnee((a) => a - 1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <span className="px-3 text-sm font-black text-slate-900 tabular-nums min-w-[50px] text-center">
              {annee}
            </span>
            <button
              onClick={() => setAnnee((a) => a + 1)}
              disabled={annee >= new Date().getFullYear()}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* CSV */}
          <button
            onClick={handleCSV}
            disabled={recap.biens.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {/* PDF */}
          <button
            onClick={handlePDF}
            disabled={recap.biens.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 rounded-xl text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Loyers encaissés"
          value={euros(recap.totalEncaisses)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          label="Loyers attendus"
          value={euros(recap.totalAttendus)}
          icon={<Banknote className="w-5 h-5" />}
          color="slate"
        />
        <StatCard
          label="Charges déductibles"
          value={euros(recap.totalCharges)}
          icon={<TrendingDown className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Base imposable"
          value={euros(recap.totalBaseImposable)}
          icon={
            recap.totalManquants > 0 ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Calculator className="w-5 h-5" />
            )
          }
          color={recap.totalManquants > 0 ? "red" : "slate"}
        />
      </div>

      {/* Tableau récap */}
      <RecapFiscalAnnuel recap={recap} onConfigChange={handleConfigChange} />

      {/* Info export 2044 */}
      {recap.biens.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-sm text-blue-800 font-bold mb-1">
            Préparer votre déclaration fiscale
          </p>
          <p className="text-xs text-blue-600">
            Exportez le CSV et transmettez-le à votre comptable pour
            pré-remplir le formulaire 2044 (revenus fonciers) ou 2042-C-PRO
            (BIC/LMNP). Le formulaire applicable est indiqué par bien dans le
            tableau selon le régime fiscal sélectionné. Les charges déductibles
            sont à saisir manuellement (cliquez sur le montant dans le tableau)
            et ne s&apos;appliquent qu&apos;en régime réel.
          </p>
        </div>
      )}
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
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center ${colors[color] || colors.slate}`}
        >
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}
