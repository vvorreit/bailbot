"use client";

import { useEffect, useState } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, X } from "lucide-react";

export default function ServiceWorkerRegister() {
  const { permission, supported, requestPermission, subscribe } = usePushNotifications();
  const [showPrompt, setShowPrompt] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[BailBot] Service Worker enregistré", reg.scope);
        })
        .catch((err) => {
          console.warn("[BailBot] Service Worker échec", err);
        });
    }
  }, []);

  // Show prompt after 3s if permission not yet decided
  useEffect(() => {
    if (!supported || permission !== "default") return;
    const dismissed = sessionStorage.getItem("bailbot_push_dismissed");
    if (dismissed) return;
    const timer = setTimeout(() => setShowPrompt(true), 3000);
    return () => clearTimeout(timer);
  }, [supported, permission]);

  const handleEnable = async () => {
    setSaving(true);
    try {
      const result = await requestPermission();
      if (result === "granted") {
        const sub = await subscribe();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sub.toJSON()),
          });
        }
      }
    } catch {
      /* silent */
    } finally {
      setSaving(false);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem("bailbot_push_dismissed", "1");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[9000] w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 animate-in slide-in-from-bottom-4">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-900 mb-1">Activer les notifications</p>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            Recevez une alerte quand un loyer est en retard, un bail arrive a echeance ou un diagnostic expire.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {saving ? "..." : "Activer"}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
