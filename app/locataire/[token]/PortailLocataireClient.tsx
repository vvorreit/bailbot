"use client";

import { useState, useEffect } from "react";
import { Home, FileText, MessageSquare, Loader2, Send, Download } from "lucide-react";
import { getPortailLocataireData, soumettreDemandeLocataire } from "@/app/actions/portail-locataire";

export default function PortailLocataireClient({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"bail" | "quittances" | "demandes">("bail");
  const [demandeType, setDemandeType] = useState("DOCUMENT");
  const [demandeMessage, setDemandeMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    getPortailLocataireData(token)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleDemande(e: React.FormEvent) {
    e.preventDefault();
    if (!demandeMessage.trim()) return;
    setSending(true);
    try {
      await soumettreDemandeLocataire(token, demandeType, demandeMessage.trim());
      setSent(true);
      setDemandeMessage("");
      setTimeout(() => setSent(false), 3000);
    } catch {}
    setSending(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900 mb-2">Lien invalide ou expire</p>
          <p className="text-sm text-slate-500">Veuillez contacter votre bailleur.</p>
        </div>
      </div>
    );
  }

  const { bail, quittances, espace } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">Mon espace locataire</h1>
            <p className="text-xs text-slate-500">{bail?.locataireNom}</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
          {[
            { key: "bail" as const, label: "Mon bail", icon: FileText },
            { key: "quittances" as const, label: "Quittances", icon: Download },
            { key: "demandes" as const, label: "Demandes", icon: MessageSquare },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex-1 justify-center ${
                tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "bail" && bail && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <h2 className="text-lg font-black text-slate-900">Informations du bail</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Locataire</span><p className="font-bold">{bail.locataireNom}</p></div>
              <div><span className="text-slate-500">Loyer CC</span><p className="font-bold">{(bail.loyerMensuel + bail.chargesMensuelles).toLocaleString("fr-FR")} EUR</p></div>
              <div><span className="text-slate-500">Debut</span><p className="font-bold">{new Date(bail.dateDebut).toLocaleDateString("fr-FR")}</p></div>
              <div><span className="text-slate-500">Fin</span><p className="font-bold">{bail.dateFin ? new Date(bail.dateFin).toLocaleDateString("fr-FR") : "—"}</p></div>
              <div><span className="text-slate-500">Statut</span><p className="font-bold">{bail.statut}</p></div>
            </div>
          </div>
        )}

        {tab === "quittances" && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {quittances.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">Aucune quittance disponible</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {quittances.map((q: any) => (
                  <div key={q.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Quittance {q.mois}</p>
                      <p className="text-xs text-slate-500">{q.numero}</p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(q.envoyeeLe).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "demandes" && (
          <div className="space-y-4">
            <form onSubmit={handleDemande} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <h3 className="text-sm font-black text-slate-900">Nouvelle demande</h3>
              <select
                value={demandeType}
                onChange={(e) => setDemandeType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="DOCUMENT">Demande de document</option>
                <option value="TRAVAUX">Signaler un probleme</option>
                <option value="QUESTION">Question</option>
                <option value="CONGE">Conge</option>
              </select>
              <textarea
                value={demandeMessage}
                onChange={(e) => setDemandeMessage(e.target.value)}
                placeholder="Decrivez votre demande..."
                rows={3}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none"
              />
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sent ? "Envoye !" : "Envoyer"}
              </button>
            </form>

            {espace.demandes?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="divide-y divide-slate-50">
                  {espace.demandes.map((d: any) => (
                    <div key={d.id} className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          d.statut === "NOUVEAU" ? "bg-blue-100 text-blue-700" :
                          d.statut === "EN_COURS" ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>{d.statut}</span>
                        <span className="text-[10px] text-slate-400">{d.type}</span>
                      </div>
                      <p className="text-sm text-slate-900">{d.message}</p>
                      {d.reponse && (
                        <div className="mt-2 bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-slate-500 font-bold mb-1">Reponse :</p>
                          <p className="text-sm text-slate-700">{d.reponse}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
