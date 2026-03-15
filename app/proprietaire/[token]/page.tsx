export const dynamic = "force-dynamic";

import { getPortailProprietaire } from "@/app/actions/portail-proprietaire";
import { notFound } from "next/navigation";

function getMoisLabel(mois: string): string {
  const [year, month] = mois.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function StatutBadge({ statut }: { statut: string }) {
  const colors: Record<string, string> = {
    loue: "bg-emerald-100 text-emerald-700",
    vacant: "bg-amber-100 text-amber-700",
    ACTIF: "bg-emerald-100 text-emerald-700",
    PREAVIS: "bg-amber-100 text-amber-700",
    TERMINE: "bg-slate-100 text-slate-500",
    paye: "bg-emerald-100 text-emerald-700",
    attendu: "bg-blue-100 text-blue-700",
    retard: "bg-amber-100 text-amber-700",
    impaye: "bg-red-100 text-red-700",
    partiel: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase ${colors[statut] || "bg-slate-100 text-slate-500"}`}>
      {statut}
    </span>
  );
}

export default async function PortailProprietairePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getPortailProprietaire(token);

  if (!data) notFound();

  const { bien, bail, gestionnaire, revenus, paiements, quittances, alertes } = data;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Portail Propriétaire</p>
              <h1 className="text-2xl font-black text-slate-900">{bien.adresse}</h1>
              <p className="text-sm text-slate-500 mt-1">Géré par {gestionnaire}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatutBadge statut={bien.statut || "vacant"} />
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full uppercase">
                Lecture seule
              </span>
            </div>
          </div>
        </div>

        {/* Bail actif */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Bail en cours</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-400 font-medium">Locataire</p>
              <p className="text-sm font-bold text-slate-900">{bail.locataireNom}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Loyer CC</p>
              <p className="text-sm font-bold text-slate-900">
                {(bail.loyerMensuel + bail.chargesMensuelles).toLocaleString("fr-FR")} EUR
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Début</p>
              <p className="text-sm font-bold text-slate-900">
                {new Date(bail.dateDebut).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Statut</p>
              <StatutBadge statut={bail.statut} />
            </div>
          </div>
        </div>

        {/* Revenus du mois */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Loyer mensuel</p>
            <p className="text-3xl font-black text-slate-900">
              {(bail.loyerMensuel + bail.chargesMensuelles).toLocaleString("fr-FR")} <span className="text-lg">EUR</span>
            </p>
          </div>
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 text-center">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Encaissé ce mois</p>
            <p className="text-3xl font-black text-emerald-600">
              {revenus.totalEncaisse.toLocaleString("fr-FR")} <span className="text-lg">EUR</span>
            </p>
          </div>
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 text-center">
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2">Impayés</p>
            <p className="text-3xl font-black text-red-500">
              {revenus.totalImpayes.toLocaleString("fr-FR")} <span className="text-lg">EUR</span>
            </p>
          </div>
        </div>

        {/* Alertes */}
        {alertes.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-[32px] p-6">
            <h2 className="text-sm font-black text-amber-700 uppercase tracking-widest mb-3">Alertes</h2>
            <div className="space-y-2">
              {alertes.map((a, i) => (
                <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-amber-100">
                  <span className="text-sm font-semibold text-amber-800">{a.type.replace(/_/g, " ")}</span>
                  <span className="text-xs text-amber-600 font-medium">
                    {new Date(a.dateEcheance).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historique paiements */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">
              Historique des paiements (12 mois)
            </h2>
          </div>

          {/* Graphique simple */}
          <div className="px-8 py-4">
            <div className="flex items-end gap-1 h-32">
              {paiements.map((p, i) => {
                const maxLoyer = Math.max(...paiements.map((p) => p.loyerCC), 1);
                const recu = p.montantRecu ?? (p.statut === "paye" ? p.loyerCC : 0);
                const height = (recu / maxLoyer) * 100;
                const colorMap: Record<string, string> = {
                  paye: "bg-emerald-400",
                  partiel: "bg-orange-400",
                  retard: "bg-amber-400",
                  impaye: "bg-red-400",
                  attendu: "bg-blue-200",
                };
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t ${colorMap[p.statut] || "bg-slate-200"}`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${getMoisLabel(p.mois)}: ${recu.toLocaleString("fr-FR")}EUR — ${p.statut}`}
                    />
                    <span className="text-[8px] text-slate-400 font-medium">{p.mois.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <table className="w-full text-left">
            <thead className="bg-slate-50 border-y border-slate-100">
              <tr>
                <th className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Mois</th>
                <th className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Loyer CC</th>
                <th className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Reçu</th>
                <th className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paiements.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-8 py-4 text-sm font-bold text-slate-900">{getMoisLabel(p.mois)}</td>
                  <td className="px-8 py-4 text-sm text-slate-600">{p.loyerCC.toLocaleString("fr-FR")} EUR</td>
                  <td className="px-8 py-4 text-sm text-slate-600">
                    {p.montantRecu != null ? `${p.montantRecu.toLocaleString("fr-FR")} EUR` : "—"}
                  </td>
                  <td className="px-8 py-4"><StatutBadge statut={p.statut} /></td>
                </tr>
              ))}
              {paiements.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-8 text-center text-sm text-slate-400">
                    Aucun paiement enregistré
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Quittances */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">
              Quittances
            </h2>
          </div>
          {quittances.length === 0 ? (
            <p className="px-8 py-8 text-center text-sm text-slate-400">Aucune quittance générée</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {quittances.map((q, i) => (
                <div key={i} className="flex items-center justify-between px-8 py-4 hover:bg-slate-50/50">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{getMoisLabel(q.mois)}</p>
                    {q.numero && <p className="text-xs text-slate-400">N° {q.numero}</p>}
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(q.envoyeeLe).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-slate-400">
            Portail en lecture seule — Données fournies par BailBot
          </p>
        </div>
      </div>
    </main>
  );
}
