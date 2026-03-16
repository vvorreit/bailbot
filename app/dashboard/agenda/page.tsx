"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getAgendaEvents, type AgendaEvent } from "@/app/actions/agenda";

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MOIS_NOMS = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

const COLOR_MAP: Record<string, string> = {
  red: "bg-red-100 text-red-700 border-red-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function AgendaPage() {
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth());
  const [annee, setAnnee] = useState(now.getFullYear());
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAgendaEvents(mois, annee)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [mois, annee]);

  function prevMois() {
    if (mois === 0) { setMois(11); setAnnee(annee - 1); }
    else setMois(mois - 1);
  }

  function nextMois() {
    if (mois === 11) { setMois(0); setAnnee(annee + 1); }
    else setMois(mois + 1);
  }

  const grille = useMemo(() => {
    const premierJour = new Date(annee, mois, 1);
    const dernierJour = new Date(annee, mois + 1, 0);
    let startDay = premierJour.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const jours: { date: number; inMonth: boolean; events: AgendaEvent[] }[] = [];

    for (let i = 0; i < startDay; i++) {
      jours.push({ date: 0, inMonth: false, events: [] });
    }

    for (let d = 1; d <= dernierJour.getDate(); d++) {
      const dateStr = `${annee}-${String(mois + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEvents = events.filter((e) => e.date.startsWith(dateStr));
      jours.push({ date: d, inMonth: true, events: dayEvents });
    }

    while (jours.length % 7 !== 0) {
      jours.push({ date: 0, inMonth: false, events: [] });
    }

    return jours;
  }, [mois, annee, events]);

  const today = now.getDate();
  const isCurrentMonth = mois === now.getMonth() && annee === now.getFullYear();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Calendar className="w-7 h-7 text-emerald-600" />
            Agenda
          </h1>
          <p className="text-slate-500 mt-1">Echeances, diagnostics, EDL et revisions</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <button onClick={prevMois} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-lg font-black text-slate-900">
            {MOIS_NOMS[mois]} {annee}
          </h2>
          <button onClick={nextMois} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-px mb-2">
              {JOURS.map((j) => (
                <div key={j} className="text-center text-[10px] font-bold text-slate-400 uppercase py-2">
                  {j}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {grille.map((jour, i) => (
                <div
                  key={i}
                  className={`min-h-[80px] p-1.5 rounded-lg border transition-colors ${
                    !jour.inMonth
                      ? "bg-slate-50 border-transparent"
                      : isCurrentMonth && jour.date === today
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-white border-slate-100 hover:border-slate-200"
                  }`}
                >
                  {jour.inMonth && (
                    <>
                      <span
                        className={`text-xs font-bold ${
                          isCurrentMonth && jour.date === today
                            ? "text-emerald-700"
                            : "text-slate-600"
                        }`}
                      >
                        {jour.date}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {jour.events.slice(0, 2).map((e) => (
                          <div
                            key={e.id}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border truncate ${
                              COLOR_MAP[e.color] || COLOR_MAP.blue
                            }`}
                            title={e.titre}
                          >
                            {e.titre}
                          </div>
                        ))}
                        {jour.events.length > 2 && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            +{jour.events.length - 2}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
