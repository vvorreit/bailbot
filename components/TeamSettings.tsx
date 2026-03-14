"use client";

import { useState } from "react";
import { createTeam, inviteMember, removeMember } from "@/app/actions/team";
import { useRouter } from "next/navigation";

interface TeamData {
  id: string;
  name: string;
  users: Array<{
    id: string;
    name: string | null;
    email: string | null;
    teamRole: string | null;
    image: string | null;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: string;
  }>;
  currentUserRole: string | null;
  seatsLimit: number;
}

export default function TeamSettings({ initialTeam }: { initialTeam: TeamData | null }) {
  const router = useRouter();
  const [team, setTeam] = useState<TeamData | null>(initialTeam);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [teamName, setTeamName] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isOwner = team?.currentUserRole === "OWNER";
  const isAdmin = team?.currentUserRole === "ADMIN" || isOwner;
  const seatsUsed = team ? team.users.length + team.invitations.length : 0;
  const seatsLimit = team?.seatsLimit ?? 1;
  const isFull = seatsUsed >= seatsLimit;

  async function handleCreateTeam() {
    if (!teamName) return;
    setLoading(true);
    try {
      await createTeam(teamName);
      setMsg({ type: "success", text: "Équipe créée !" });
      router.refresh();
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await inviteMember(inviteEmail);
      if (res.success) {
        setMsg({ type: "success", text: res.link ? `Lien d'invitation : ${res.link}` : "Invitation envoyée !" });
        setInviteEmail("");
        router.refresh();
      }
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm("Êtes-vous sûr de vouloir retirer ce membre ?")) return;
    setLoading(true);
    try {
      await removeMember(userId);
      setMsg({ type: "success", text: "Membre retiré." });
      router.refresh();
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }

  if (!team) {
    return (
      <main className="min-h-screen bg-slate-50 pb-20">
        <div className="max-w-md mx-auto px-4 py-10">
          <div className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100 text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-3">Créer une équipe</h2>
            <p className="text-slate-500 font-medium mb-8 text-sm">
              Rassemblez vos collaborateurs et centralisez la facturation.
            </p>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nom de l'équipe (ex: Cabinet Optique X)"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
              <button
                onClick={handleCreateTeam}
                disabled={loading || !teamName}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Création..." : "Créer l'équipe"}
              </button>
            </div>
            {msg && (
              <p className={`mt-5 text-sm font-semibold ${msg.type === "error" ? "text-red-500" : "text-green-600"}`}>
                {msg.text}
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{team.name}</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Gérez vos membres et accès.</p>
          </div>
          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-wider">
            {team.currentUserRole}
          </span>
        </div>

        {/* Members */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">
              Membres ({team.users.length})
            </h2>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${isFull ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}`}>
              {seatsUsed} / {seatsLimit} postes
            </span>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Nom</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Email</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Rôle</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {team.users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 font-black text-slate-900">{user.name || "—"}</td>
                  <td className="px-8 py-5 text-slate-500 font-medium text-sm">{user.email}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-tighter ${
                      user.teamRole === "OWNER"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {user.teamRole}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {isOwner && user.teamRole !== "OWNER" && (
                      <button
                        onClick={() => handleRemove(user.id)}
                        disabled={loading}
                        className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                      >
                        Retirer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invite + Pending */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invite Form */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Inviter un membre</h2>
              {isFull ? (
                <p className="text-sm font-semibold text-red-500">
                  Tous les postes sont occupés ({seatsLimit}/{seatsLimit}). Passez à un plan supérieur pour inviter davantage.
                </p>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="email@exemple.com"
                      className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    />
                    <button
                      onClick={handleInvite}
                      disabled={loading || !inviteEmail}
                      className="px-5 py-3 bg-blue-600 text-white text-sm font-bold rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "..." : "Inviter"}
                    </button>
                  </div>
                  {msg && (
                    <p className={`mt-4 text-xs font-semibold break-all ${msg.type === "error" ? "text-red-500" : "text-green-600"}`}>
                      {msg.text}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Pending Invites */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Invitations en attente</h2>
              {team.invitations.length === 0 ? (
                <p className="text-slate-400 text-sm font-medium">Aucune invitation en cours.</p>
              ) : (
                <ul className="space-y-3">
                  {team.invitations.map((inv) => (
                    <li key={inv.id} className="flex justify-between items-center">
                      <span className="text-slate-700 font-semibold text-sm">{inv.email}</span>
                      <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        En attente
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
