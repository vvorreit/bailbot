"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Wrench, ClipboardList, Stethoscope } from "lucide-react";

const EDLContent = dynamic(() => import("../etats-des-lieux/EdlListe"), { ssr: false, loading: () => <TabLoader /> });
const DiagnosticsContent = dynamic(() => import("../diagnostics/DiagnosticsOverviewClient"), { ssr: false, loading: () => <TabLoader /> });
const TravauxContent = dynamic(() => import("../travaux/page"), { ssr: false, loading: () => <TabLoader /> });

const TABS = [
  { key: "edl", label: "Etats des lieux", icon: ClipboardList },
  { key: "diagnostics", label: "Diagnostics", icon: Stethoscope },
  { key: "travaux", label: "Travaux", icon: Wrench },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-6 h-6 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );
}

export default function ProprietePage() {
  const [tab, setTab] = useState<TabKey>("edl");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <Wrench className="w-7 h-7 text-emerald-600" />
          Propriete
        </h1>
        <p className="text-slate-500 mt-1">Etats des lieux, diagnostics et travaux</p>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex-1 justify-center ${
              tab === t.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "edl" && <EDLContent />}
      {tab === "diagnostics" && <DiagnosticsContent />}
      {tab === "travaux" && <TravauxContent />}
    </div>
  );
}
