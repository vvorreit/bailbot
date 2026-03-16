"use client";

import { useEffect, useState } from "react";
import {
  getAllUsersAdmin, getAllTeamsAdmin,
  getAdminAnalytics, toggleUserProStatus,
  toggleUserAdminRole, setUserPlan,
} from "./actions";
import {
  Users, CreditCard, Activity, Search, CheckCircle, XCircle,
  ShieldCheck, ShieldOff, LogOut, TrendingUp, BarChart2, Euro,
  UserCheck, UserX, Building2, Zap, ChevronDown,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

const PLANS = ["FREE", "ESSENTIEL", "SERENITE", "PORTFOLIO", "TEAM_3", "TEAM_5"] as const;
type Plan = typeof PLANS[number];

const PLAN_COLORS: Record<Plan, string> = {
  FREE:      "bg-slate-100 text-slate-400",
  ESSENTIEL: "bg-green-100 text-green-600",
  SERENITE:  "bg-purple-100 text-purple-600",
  PORTFOLIO: "bg-amber-100 text-amber-700",
  TEAM_3:    "bg-indigo-100 text-indigo-600",
  TEAM_5:    "bg-blue-100 text-blue-700",
};

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  isPro: boolean;
  plan: string;
  clientCount: number;
  createdAt: string;
  role: string;
  teamId: string | null;
  teamRole: string | null;
  teamName: string | null;
  isTeamOwner: boolean;
}

interface TeamData {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPlan: string;
  membersCount: number;
  pendingCount: number;
  limit: number;
  members: { id: string; name: string | null; email: string | null; teamRole: string | null }[];
  pendingInvites: { id: string; email: string }[];
  createdAt: string;
}

interface Analytics {
  totalUsers: number; proUsers: number; essentielUsers: number; sereniteUsers: number; portfolioUsers: number;
  freeUsers: number; newThisMonth: number; newLastMonth: number;
  totalScans: number; verifiedUsers: number; unverifiedUsers: number;
  teamsCount: number; conversionRate: number; mrrEstimate: number;
  signupsLast30Days: Record<string, number>;
}

function SignupsChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="flex items-end gap-[3px] h-[80px] w-full">
      {entries.map(([date, count]) => {
        const height = Math.max((count / max) * 80, count > 0 ? 4 : 1);
        return (
          <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="w-full bg-blue-500 rounded-t-sm transition-all group-hover:bg-blue-400" style={{ height: `${height}px` }} />
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
              {count} — {date}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
  trend?: { value: number; label: string };
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600", green: "bg-green-100 text-green-600",
    amber: "bg-amber-100 text-amber-600", indigo: "bg-indigo-100 text-indigo-600",
    rose: "bg-rose-100 text-rose-600", purple: "bg-purple-100 text-purple-600",
  };
  return (
    <div className="bg-white p-7 rounded-[28px] shadow-sm border border-slate-100 flex flex-col gap-3">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-900">{value}</p>
        {sub && <p className="text-xs font-semibold text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend.value >= 0 ? "text-green-600" : "text-red-500"}`}>
          <TrendingUp className="w-3 h-3" />
          {trend.value >= 0 ? "+" : ""}{trend.value} {trend.label}
        </div>
      )}
    </div>
  );
}

function PlanSelector({ userId, currentPlan, onChange }: {
  userId: string; currentPlan: string; onChange: (plan: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (plan: Plan) => {
    setOpen(false);
    setLoading(true);
    try {
      await setUserPlan(userId, plan);
      onChange(plan);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const plan = (PLANS.includes(currentPlan as Plan) ? currentPlan : "FREE") as Plan;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${PLAN_COLORS[plan]} hover:opacity-80`}
      >
        {loading ? "..." : plan}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden min-w-[110px]">
          {PLANS.map(p => (
            <button
              key={p}
              onClick={() => handleSelect(p)}
              className={`w-full text-left px-4 py-2.5 text-[11px] font-black uppercase tracking-wide hover:bg-slate-50 transition-colors ${p === plan ? "text-blue-600" : "text-slate-600"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FillBar({ used, pending, limit }: { used: number; pending: number; limit: number }) {
  const pct = Math.min(100, ((used + pending) / limit) * 100);
  const full = used >= limit;
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${full ? "bg-red-500" : pct > 70 ? "bg-amber-400" : "bg-green-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-black ${full ? "text-red-500" : "text-slate-500"}`}>
        {used}/{limit}
        {pending > 0 && <span className="text-slate-300 font-semibold"> (+{pending} en attente)</span>}
      </span>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<"analytics" | "users" | "teams">("analytics");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | Plan>("all");
  const [adminLoading, setAdminLoading] = useState<string | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAllUsersAdmin(), getAllTeamsAdmin(), getAdminAnalytics()])
      .then(([u, t, a]) => { setUsers(u as AdminUser[]); setTeams(t); setAnalytics(a); })
      .catch((err) => setError(err.message || "Erreur de chargement."))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    if (!confirm(currentRole === "ADMIN" ? "Rétrograder en utilisateur standard ?" : "Promouvoir en administrateur ?")) return;
    setAdminLoading(userId);
    try {
      const updated = await toggleUserAdminRole(userId, currentRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: updated.role } : u));
    } catch (err: any) { alert(err.message); }
    finally { setAdminLoading(null); }
  };

  const filteredUsers = users.filter(u => {
    const match = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter !== "all") return match && u.plan === filter;
    return match;
  });

  if (loading) return <div className="flex-1 flex items-center justify-center font-bold text-blue-600">Chargement...</div>;
  if (error) return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-red-50 text-red-600 p-8 rounded-3xl border border-red-100 max-w-md">
        <h1 className="text-2xl font-black mb-4">Accès Refusé</h1>
        <p className="font-medium mb-6">{error}</p>
        <Link href="/dashboard" className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg">Retour au dashboard</Link>
      </div>
    </div>
  );

  return (
    <main className="flex-1 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Administration</h1>
            <p className="text-slate-500 font-medium">Suivi de l&apos;activité globale d&apos;BailBot.</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/auth/signin" })} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm w-fit mb-8 gap-1">
          {([["analytics", "Analytiques", BarChart2], ["users", "Utilisateurs", Users], ["teams", "Équipes", Building2]] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${tab === key ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-700"}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* ── ANALYTICS TAB ── */}
        {tab === "analytics" && analytics && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <KpiCard label="MRR estimé" value={`${analytics.mrrEstimate.toLocaleString("fr-FR", { minimumFractionDigits: 0 })} €`} sub="base €9.90/Particulier" icon={Euro} color="green" />
              <KpiCard label="Utilisateurs" value={analytics.totalUsers} sub={`+${analytics.newThisMonth} ce mois`} icon={Users} color="blue" trend={{ value: analytics.newThisMonth - analytics.newLastMonth, label: "vs mois préc." }} />
              <KpiCard label="Comptes Pro" value={analytics.proUsers} icon={CreditCard} color="indigo" />
              <KpiCard label="Conversion" value={`${analytics.conversionRate}%`} sub="Free → Pro" icon={TrendingUp} color="purple" />
              <KpiCard label="Scans totaux" value={analytics.totalScans.toLocaleString("fr-FR")} icon={Zap} color="amber" />
              <KpiCard label="Équipes" value={analytics.teamsCount} icon={Building2} color="rose" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div><h2 className="font-black text-lg">Nouveaux inscrits</h2><p className="text-xs text-slate-400 font-semibold">30 derniers jours</p></div>
                  <span className="text-2xl font-black text-blue-600">{analytics.newThisMonth}</span>
                </div>
                <SignupsChart data={analytics.signupsLast30Days} />
                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-300"><span>J-30</span><span>Aujourd&apos;hui</span></div>
              </div>
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-5">
                <h2 className="font-black text-lg">Répartition</h2>
                <div>
                  <div className="flex justify-between text-xs font-black text-slate-500 mb-2"><span>Pro</span><span>{analytics.proUsers} / {analytics.totalUsers}</span></div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${analytics.totalUsers > 0 ? (analytics.proUsers / analytics.totalUsers) * 100 : 0}%` }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-black text-slate-500 mb-2"><span>Emails vérifiés</span><span>{analytics.verifiedUsers} / {analytics.totalUsers}</span></div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${analytics.totalUsers > 0 ? (analytics.verifiedUsers / analytics.totalUsers) * 100 : 0}%` }} /></div>
                </div>
                <div className="border-t border-slate-50 pt-4 space-y-3 mt-auto">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><UserCheck className="w-4 h-4 text-green-500" />Vérifiés</div><span className="font-black">{analytics.verifiedUsers}</span></div>
                  <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><UserX className="w-4 h-4 text-amber-500" />Non vérifiés</div><span className="font-black">{analytics.unverifiedUsers}</span></div>
                  <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Activity className="w-4 h-4 text-slate-400" />Gratuits</div><span className="font-black">{analytics.freeUsers}</span></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <h2 className="font-black mb-5">Inscriptions — comparaison mensuelle</h2>
                <div className="flex items-end gap-6">
                  <div className="text-center"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Mois précédent</p><p className="text-4xl font-black text-slate-300">{analytics.newLastMonth}</p></div>
                  <div className="text-center"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ce mois-ci</p><p className="text-4xl font-black text-blue-600">{analytics.newThisMonth}</p></div>
                  <div className={`flex items-center gap-1 text-sm font-black px-3 py-1 rounded-full ${analytics.newThisMonth >= analytics.newLastMonth ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                    <TrendingUp className="w-4 h-4" />{analytics.newThisMonth >= analytics.newLastMonth ? "+" : ""}{analytics.newThisMonth - analytics.newLastMonth}
                  </div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <h2 className="font-black mb-5">MRR projeté</h2>
                <p className="text-4xl font-black text-green-600 mb-1">{analytics.mrrEstimate.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
                <p className="text-xs text-slate-400 font-semibold mb-4">{analytics.essentielUsers} Essentiel × 39 € + {analytics.sereniteUsers} Sérénité × 59 € + {analytics.portfolioUsers} Portfolio × 89 €</p>
                <p className="text-sm font-bold text-slate-400">ARR estimé : <span className="text-slate-700">{(analytics.mrrEstimate * 12).toLocaleString("fr-FR", { minimumFractionDigits: 0 })} €</span></p>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div>
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="text" placeholder="Rechercher un utilisateur..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex bg-slate-50 p-1.5 rounded-2xl w-full md:w-auto flex-wrap gap-1">
                {(["all", ...PLANS] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${filter === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                    {f === "all" ? "Tous" : f}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["Utilisateur", "Plan", "Équipe", "Rôle", "Scans", "Inscription", "Actions"].map(h => (
                        <th key={h} className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-900">{user.name || "Inconnu"}</p>
                          <p className="text-sm font-medium text-slate-400">{user.email}</p>
                        </td>
                        <td className="px-6 py-5">
                          <PlanSelector
                            userId={user.id}
                            currentPlan={user.plan}
                            onChange={plan => setUsers(prev => prev.map(u => u.id === user.id ? { ...u, plan, isPro: plan !== "FREE" } : u))}
                          />
                        </td>
                        <td className="px-6 py-5">
                          {user.teamName ? (
                            <div>
                              <p className="text-xs font-black text-slate-700">{user.teamName}</p>
                              <p className="text-[10px] font-bold text-slate-400">{user.isTeamOwner ? "Gérant" : user.teamRole}</p>
                            </div>
                          ) : <span className="text-slate-300 text-xs font-bold">—</span>}
                        </td>
                        <td className="px-6 py-5">
                          {user.role === "ADMIN"
                            ? <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded-full uppercase flex items-center gap-1 w-fit"><ShieldCheck className="w-3 h-3" />Admin</span>
                            : <span className="px-3 py-1 bg-slate-100 text-slate-400 text-[10px] font-black rounded-full uppercase">User</span>}
                        </td>
                        <td className="px-6 py-5">
                          <span className="font-black text-lg">{user.clientCount}</span>
                        </td>
                        <td className="px-6 py-5 text-sm font-bold text-slate-500">
                          {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-6 py-5">
                          <button
                            onClick={() => handleToggleAdmin(user.id, user.role)}
                            disabled={adminLoading === user.id}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-sm ${user.role === "ADMIN" ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}>
                            {adminLoading === user.id ? "..." : user.role === "ADMIN"
                              ? <><ShieldOff className="w-4 h-4" />Rétrograder</>
                              : <><ShieldCheck className="w-4 h-4" />Admin</>}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={7} className="px-8 py-12 text-center text-slate-400 font-bold">Aucun utilisateur trouvé.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TEAMS TAB ── */}
        {tab === "teams" && (
          <div className="space-y-4">
            {teams.length === 0 && (
              <div className="bg-white rounded-[32px] p-12 text-center text-slate-400 font-bold border border-slate-100">Aucune équipe créée.</div>
            )}
            {teams.map(team => {
              const isFull = team.membersCount >= team.limit;
              const isExpanded = expandedTeam === team.id;
              return (
                <div key={team.id} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                  <div
                    className="px-8 py-6 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                  >
                    {/* Team name + owner */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0">
                          {team.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{team.name}</p>
                          <p className="text-xs font-medium text-slate-400">Gérant : {team.ownerName} — {team.ownerEmail}</p>
                        </div>
                      </div>
                    </div>

                    {/* Plan du gérant */}
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Plan gérant</p>
                        <PlanSelector
                          userId={team.ownerId}
                          currentPlan={team.ownerPlan}
                          onChange={plan => setTeams(prev => prev.map(t => t.id === team.id ? { ...t, ownerPlan: plan, limit: plan === "TEAM_5" ? 5 : plan === "TEAM_3" ? 3 : 1 } : t))}
                        />
                      </div>

                      {/* Taux de remplissage */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Remplissage</p>
                        <FillBar used={team.membersCount} pending={team.pendingCount} limit={team.limit} />
                      </div>

                      {/* Badge statut */}
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shrink-0 ${isFull ? "bg-red-100 text-red-500" : "bg-green-100 text-green-600"}`}>
                        {isFull ? "Complet" : "Places dispo"}
                      </span>

                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  {/* Members list (expanded) */}
                  {isExpanded && (
                    <div className="border-t border-slate-50 px-8 py-5 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Membres ({team.membersCount}/{team.limit})</p>
                      {team.members.map(m => (
                        <div key={m.id} className="flex items-center justify-between py-2">
                          <div>
                            <p className="font-bold text-sm text-slate-800">{m.name || "Inconnu"}</p>
                            <p className="text-xs text-slate-400">{m.email}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${m.teamRole === "OWNER" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                            {m.teamRole === "OWNER" ? "Gérant" : "Membre"}
                          </span>
                        </div>
                      ))}
                      {team.pendingInvites.length > 0 && (
                        <>
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-4 mb-2">Invitations en attente</p>
                          {team.pendingInvites.map(inv => (
                            <div key={inv.id} className="flex items-center justify-between py-1.5">
                              <p className="text-sm text-slate-400 font-medium">{inv.email}</p>
                              <span className="px-3 py-1 bg-amber-50 text-amber-500 text-[10px] font-black rounded-full uppercase">En attente</span>
                            </div>
                          ))}
                        </>
                      )}
                      {team.members.length === 0 && team.pendingInvites.length === 0 && (
                        <p className="text-slate-400 text-sm font-medium">Aucun membre.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
