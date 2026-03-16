"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { TrendingUp, Banknote, Calculator, Receipt } from "lucide-react";

const FinancesContent = dynamic(() => import("./FinancesContent"), {
  ssr: false,
  loading: () => <TabLoader />,
});
const ImpayesContent = dynamic(() => import("../impayes/page"), {
  ssr: false,
  loading: () => <TabLoader />,
});
const ComptabiliteContent = dynamic(() => import("../comptabilite/page"), {
  ssr: false,
  loading: () => <TabLoader />,
});
const RegularisationContent = dynamic(() => import("./RegularisationTab"), {
  ssr: false,
  loading: () => <TabLoader />,
});

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-6 h-6 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );
}

const TABS = [
  { key: "finances", label: "Rendements", icon: TrendingUp },
  { key: "paiements", label: "Paiements & impayes", icon: Banknote },
  { key: "comptabilite", label: "Comptabilite", icon: Calculator },
  { key: "charges", label: "Charges", icon: Receipt },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function FinancesPage() {
  const [tab, setTab] = useState<TabKey>("finances");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-emerald-600" />
          Finances
        </h1>
        <p className="text-slate-500 mt-1">Rendements, paiements, comptabilite et charges</p>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex-1 justify-center whitespace-nowrap ${
              tab === t.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "finances" && <FinancesContent />}
      {tab === "paiements" && <ImpayesContent />}
      {tab === "comptabilite" && <ComptabiliteContent />}
      {tab === "charges" && <RegularisationContent />}
    </div>
  );
}
