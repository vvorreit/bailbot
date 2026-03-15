"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isLimitReached, getUsageCount } from "@/lib/usage-limits";
import { X, PartyPopper } from "lucide-react";

const GRACE_KEY = "bailbot_grace_until";
const GRACE_DAYS = 7;

export default function UsageBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setVisible(isLimitReached());
  }, []);

  const handleGrace = () => {
    const until = Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(GRACE_KEY, String(until));
    setDismissed(true);
  };

  if (!visible || dismissed) return null;

  // Check grace period
  const graceUntil = typeof window !== "undefined"
    ? parseInt(localStorage.getItem(GRACE_KEY) ?? "0", 10)
    : 0;
  if (graceUntil > Date.now()) return null;

  const count = getUsageCount();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-3xl mx-auto bg-emerald-900 text-white rounded-2xl shadow-2xl border border-emerald-700 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <PartyPopper className="w-6 h-6 text-emerald-300 shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-white">
              🎉 Vous avez utilisé vos {count} dossiers gratuits !
            </p>
            <p className="text-emerald-300 text-sm mt-1">
              Passez au plan Particulier (9,90€/mois) pour continuer sans limite.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
          <Link
            href="/particulier#tarifs"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-sm uppercase tracking-widest text-center transition-colors"
          >
            Voir les plans
          </Link>
          <button
            onClick={handleGrace}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-200 font-bold rounded-xl text-sm text-center transition-colors"
          >
            Continuer gratuitement encore 7 jours ▾
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 sm:relative sm:top-auto sm:right-auto text-emerald-400 hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
