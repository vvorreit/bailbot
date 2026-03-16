"use client";

import { useState, useEffect } from "react";
import { getCronStatus, triggerCron, getFeatureFlags, toggleFeatureFlag, type CronStatusEntry } from "@/app/actions/cron-monitoring";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Play,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Link from "next/link";

const CRON_LABELS: Record<string, string> = {
  "quittances-auto": "Quittances automatiques",
  "indexation-irl": "Indexation IRL",
  "rappels-impayes": "Rappels impayes",
  "rgpd-purge": "Purge RGPD",
  "alertes-diagnostics": "Alertes diagnostics",
  "alertes-bails": "Alertes bails",
  "alertes-echeances": "Alertes echeances",
  "relances-candidats": "Relances candidats",
  "revision-irl": "Revision IRL",
  "cleanup-depot": "Nettoyage tokens depot",
};

const FLAG_LABELS: Record<string, string> = {
  FEATURE_QUITTANCES_AUTO: "Quittances automatiques",
  FEATURE_RAPPELS_IMPAYES: "Rappels impayes",
  FEATURE_INDEXATION_IRL: "Indexation IRL",
  FEATURE_RGPD_PURGE: "Purge RGPD",
};

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-400">
        <Clock className="w-3 h-3" />
        Jamais execute
      </span>
    );
  }

  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    SUCCESS: { bg: "bg-emerald-100", text: "text-emerald-700", icon: <CheckCircle2 className="w-3 h-3" /> },
    FAILURE: { bg: "bg-red-100", text: "text-red-600", icon: <XCircle className="w-3 h-3" /> },
    RUNNING: { bg: "bg-blue-100", text: "text-blue-600", icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
  };

  const cfg = config[status] || config.RUNNING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      {cfg.icon}
      {status}
    </span>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function CronCard({ entry, onTrigger }: { entry: CronStatusEntry; onTrigger: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const handleTrigger = async () => {
    setTriggering(true);
    await onTrigger();
    setTriggering(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-slate-900">
              {CRON_LABELS[entry.cronName] || entry.cronName}
            </h3>
            <StatusBadge status={entry.lastRun?.status ?? null} />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Derniere execution : {formatDate(entry.lastRun?.startedAt ?? null)}
          </p>
          {entry.lastRun?.error && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="truncate">{entry.lastRun.error}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
          >
            {triggering ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Executer
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && entry.recentRuns.length > 0 && (
        <div className="border-t border-slate-100 px-4 sm:px-5 py-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Dernieres executions
          </p>
          {/* Mobile: cards */}
          <div className="sm:hidden space-y-2">
            {entry.recentRuns.map((run) => (
              <div key={run.id} className="bg-slate-50 rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <StatusBadge status={run.status} />
                  <span className="text-[10px] text-slate-400">{formatDate(run.startedAt)}</span>
                </div>
                {run.finishedAt && (
                  <p className="text-[10px] text-slate-400">Fin : {formatDate(run.finishedAt)}</p>
                )}
                {run.error && (
                  <p className="text-xs text-red-500 truncate">{run.error}</p>
                )}
              </div>
            ))}
          </div>
          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="pb-2 font-medium">Statut</th>
                  <th className="pb-2 font-medium">Debut</th>
                  <th className="pb-2 font-medium">Fin</th>
                  <th className="pb-2 font-medium">Erreur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {entry.recentRuns.map((run) => (
                  <tr key={run.id}>
                    <td className="py-2 pr-3"><StatusBadge status={run.status} /></td>
                    <td className="py-2 pr-3 text-slate-500">{formatDate(run.startedAt)}</td>
                    <td className="py-2 pr-3 text-slate-500">{formatDate(run.finishedAt)}</td>
                    <td className="py-2 text-red-500 truncate max-w-[200px]">{run.error || "\u2014"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureFlagsPanel({
  flags,
  onToggle,
}: {
  flags: Record<string, boolean>;
  onToggle: (flag: string, enabled: boolean) => void;
}) {
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (flag: string, current: boolean) => {
    setToggling(flag);
    await onToggle(flag, !current);
    setToggling(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 mb-6">
      <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
        <ToggleRight className="w-4 h-4 text-emerald-600" />
        Feature Flags — Crons critiques
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(flags).map(([flag, enabled]) => (
          <div
            key={flag}
            className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3"
          >
            <div>
              <p className="text-xs font-bold text-slate-700">
                {FLAG_LABELS[flag] || flag}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">{flag}</p>
            </div>
            <button
              onClick={() => handleToggle(flag, enabled)}
              disabled={toggling === flag}
              className="flex items-center gap-1.5 text-xs font-bold transition-colors"
            >
              {enabled ? (
                <ToggleRight className="w-6 h-6 text-emerald-600" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-slate-400" />
              )}
              <span className={enabled ? "text-emerald-600" : "text-slate-400"}>
                {enabled ? "ON" : "OFF"}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CronsPage() {
  const [entries, setEntries] = useState<CronStatusEntry[]>([]);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [data, flagData] = await Promise.all([getCronStatus(), getFeatureFlags()]);
      setEntries(data);
      setFlags(flagData);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTrigger = async (cronName: string) => {
    await triggerCron(cronName);
    setTimeout(loadData, 2000);
  };

  const handleToggleFlag = async (flag: string, enabled: boolean) => {
    await toggleFeatureFlag(flag, enabled);
    setFlags((prev) => ({ ...prev, [flag]: enabled }));
  };

  const successCount = entries.filter((e) => e.lastRun?.status === "SUCCESS").length;
  const failureCount = entries.filter((e) => e.lastRun?.status === "FAILURE").length;
  const neverRun = entries.filter((e) => !e.lastRun).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin" className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <Activity className="w-7 h-7 text-emerald-600" />
          Monitoring Crons
        </h1>
      </div>
      <p className="text-slate-500 mb-6 ml-12">Statut des jobs automatises</p>

      {/* Feature flags */}
      {Object.keys(flags).length > 0 && (
        <FeatureFlagsPanel flags={flags} onToggle={handleToggleFlag} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-700">{successCount}</p>
          <p className="text-xs font-bold text-emerald-600">OK</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-red-600">{failureCount}</p>
          <p className="text-xs font-bold text-red-500">Echec</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-slate-400">{neverRun}</p>
          <p className="text-xs font-bold text-slate-400">Jamais</p>
        </div>
      </div>

      {/* Refresh */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setLoading(true); loadData(); }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Rafraichir
        </button>
      </div>

      {/* Cron cards */}
      <div className="space-y-3">
        {entries.map((entry) => (
          <CronCard
            key={entry.cronName}
            entry={entry}
            onTrigger={() => handleTrigger(entry.cronName)}
          />
        ))}
      </div>
    </div>
  );
}
