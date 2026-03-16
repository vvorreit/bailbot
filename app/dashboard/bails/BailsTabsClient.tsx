"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { FileSignature, MessageSquare, Shield, PenTool, Send, Loader2 } from "lucide-react";
import { envoyerLienPortail } from "@/app/actions/portail-locataire";

const BailsContent = dynamic(() => import("./BailsClient"), {
  ssr: false,
  loading: () => <TabLoader />,
});
const DemandesContent = dynamic(
  () => import("../espaces-locataires/EspacesLocatairesClient"),
  { ssr: false, loading: () => <TabLoader /> }
);
const DepotGarantieContent = dynamic(
  () => import("./DepotGarantieTab"),
  { ssr: false, loading: () => <TabLoader /> }
);

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-6 h-6 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );
}

const TABS = [
  { key: "baux", label: "Baux actifs", icon: FileSignature },
  { key: "demandes", label: "Demandes locataires", icon: MessageSquare },
  { key: "depot", label: "Depot de garantie", icon: Shield },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function BailsTabsClient() {
  const [tab, setTab] = useState<TabKey>("baux");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <FileSignature className="w-7 h-7 text-emerald-600" />
          Baux & Locataires
        </h1>
        <p className="text-slate-500 mt-1">Gerez vos baux, demandes locataires et depots de garantie</p>
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

      {tab === "baux" && <BailsContent />}
      {tab === "demandes" && <DemandesContent />}
      {tab === "depot" && <DepotGarantieContent />}
    </div>
  );
}
