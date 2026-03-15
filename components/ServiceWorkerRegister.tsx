"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
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

  return null;
}
