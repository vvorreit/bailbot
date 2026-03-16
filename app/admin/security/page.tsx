"use client";

import { useEffect, useState } from "react";
import { Shield, Clock, Trash2, Key, Users, Activity, RefreshCw, AlertTriangle } from "lucide-react";
import { getSecurityReportAction, executePurgeAction } from "./actions";
import Link from "next/link";

interface SecurityData {
  recentLogins: {
    userId: string | null;
    action: string;
    ip: string | null;
    createdAt: string;
    details: string | null;
  }[];
  expiredTokens: { type: string; count: number }[];
  pendingPurges: {
    candidaturesRefusees: number;
    candidaturesExpirees: number;
    depotTokens: number;
    comptesInactifs: number;
    tokensExpires: number;
    total: number;
  };
  lastPurge: { createdAt: string; details: string | null } | null;
  stats: {
    totalUsers: number;
    usersWithPassword: number;
    usersOAuth: number;
    activeSessionsCount: number;
    auditLogsCount: number;
  };
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  LOGIN: { label: "Connexion", color: "text-green-600 bg-green-50" },
  LOGIN_FAILED: { label: "Échec connexion", color: "text-red-600 bg-red-50" },
  EXPORT_DATA: { label: "Export données", color: "text-blue-600 bg-blue-50" },
  DELETE_ACCOUNT: { label: "Suppression compte", color: "text-red-600 bg-red-50" },
  PURGE_RGPD: { label: "Purge RGPD", color: "text-amber-600 bg-amber-50" },
};

export default function SecurityPage() {
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [purgeLoading, setPurgeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getSecurityReportAction();
      if ("error" in result) {
        setError(result.error as string);
      } else {
        setData(result as unknown as SecurityData);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handlePurge = async () => {
    if (!confirm("Exécuter la purge RGPD maintenant ? Les données expirées seront définitivement supprimées.")) return;
    setPurgeLoading(true);
    try {
      await executePurgeAction();
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPurgeLoading(false);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center font-bold text-blue-600">Chargement...</div>;
  if (error) return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-red-50 text-red-600 p-8 rounded-3xl border border-red-100 max-w-md">
        <h1 className="text-2xl font-black mb-4">Accès Refusé</h1>
        <p className="font-medium mb-6">{error}</p>
        <Link href="/dashboard" className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg">Retour</Link>
      </div>
    </div>
  );
  if (!data) return null;

  return (
    <main className="flex-1 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-600" />
            <div>
              <h1 className="text-3xl font-black tracking-tight">Sécurité & RGPD</h1>
              <p className="text-slate-500 font-medium">Audit de sécurité et conformité RGPD</p>
            </div>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Utilisateurs", value: data.stats.totalUsers, icon: Users, color: "bg-blue-100 text-blue-600" },
            { label: "Avec mot de passe", value: data.stats.usersWithPassword, icon: Key, color: "bg-indigo-100 text-indigo-600" },
            { label: "OAuth seul", value: data.stats.usersOAuth, icon: Shield, color: "bg-green-100 text-green-600" },
            { label: "Sessions actives", value: data.stats.activeSessionsCount, icon: Activity, color: "bg-amber-100 text-amber-600" },
            { label: "Logs d'audit", value: data.stats.auditLogsCount, icon: Clock, color: "bg-purple-100 text-purple-600" },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white p-6 rounded-[28px] shadow-sm border border-slate-100">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${kpi.color} mb-3`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</p>
              <p className="text-2xl font-black">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tokens expirés */}
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8">
            <div className="flex items-center gap-2 mb-6">
              <Key className="w-5 h-5 text-amber-600" />
              <h2 className="font-black text-lg">Tokens expirés</h2>
            </div>
            <div className="space-y-3">
              {data.expiredTokens.map(t => (
                <div key={t.type} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                  <span className="text-sm font-medium text-slate-600">{t.type}</span>
                  <span className={`text-sm font-black ${t.count > 0 ? "text-amber-600" : "text-green-600"}`}>
                    {t.count > 0 ? `${t.count} à révoquer` : "OK"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Purge RGPD */}
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8">
            <div className="flex items-center gap-2 mb-6">
              <Trash2 className="w-5 h-5 text-red-500" />
              <h2 className="font-black text-lg">Données en attente de purge</h2>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { label: "Candidatures refusées (> 3 mois)", value: data.pendingPurges.candidaturesRefusees },
                { label: "Candidatures non traitées (> 3 mois)", value: data.pendingPurges.candidaturesExpirees },
                { label: "Dépôts expirés", value: data.pendingPurges.depotTokens },
                { label: "Comptes inactifs (> 3 ans)", value: data.pendingPurges.comptesInactifs },
                { label: "Tokens propriétaire expirés", value: data.pendingPurges.tokensExpires },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <span className={`text-sm font-black ${item.value > 0 ? "text-red-500" : "text-green-600"}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-700">
                  Total : <span className={data.pendingPurges.total > 0 ? "text-red-500" : "text-green-600"}>{data.pendingPurges.total} éléments</span>
                </p>
                {data.lastPurge && (
                  <p className="text-xs text-slate-400 mt-1">
                    Dernière purge : {new Date(data.lastPurge.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
              <button
                onClick={handlePurge}
                disabled={purgeLoading || data.pendingPurges.total === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                {purgeLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {purgeLoading ? "Purge..." : "Exécuter la purge"}
              </button>
            </div>
          </div>
        </div>

        {/* Journal d'audit */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8 mt-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="font-black text-lg">Journal d&apos;audit récent</h2>
          </div>
          {data.recentLogins.length === 0 ? (
            <p className="text-sm text-slate-400 font-medium py-8 text-center">Aucun événement enregistré.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Utilisateur</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">IP</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.recentLogins.map((log, i) => {
                    const actionInfo = ACTION_LABELS[log.action] ?? { label: log.action, color: "text-slate-600 bg-slate-50" };
                    return (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-3 font-medium text-slate-500">
                          {new Date(log.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${actionInfo.color}`}>
                            {actionInfo.label}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-slate-600 font-mono text-xs">
                          {log.userId ? log.userId.slice(0, 8) + "…" : "—"}
                        </td>
                        <td className="py-3 font-mono text-xs text-slate-400">{log.ip ?? "—"}</td>
                        <td className="py-3 text-xs text-slate-400 max-w-[200px] truncate">{log.details ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
