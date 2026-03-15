"use client";

import { useEffect } from "react";
import { X, Keyboard } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface Props {
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ["⌘", "K"], label: "Recherche" },
  { keys: ["⌘", "G"], label: "Générer le bail" },
  { keys: ["⌘", "Q"], label: "Quittance de loyer" },
  { keys: ["⌘", "E"], label: "Exporter l'archive ZIP" },
  { keys: ["⌘", "N"], label: "Nouveau dossier" },
  { keys: ["?"], label: "Afficher cette aide" },
];

export default function ShortcutsModal({ onClose }: Props) {
  const trapRef = useFocusTrap(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div ref={trapRef} role="dialog" aria-modal="true" className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            <h2 className="text-base font-black text-slate-900">Raccourcis clavier</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="px-5 py-4 space-y-2">
          {SHORTCUTS.map(({ keys, label }) => (
            <div key={label} className="flex items-center justify-between py-1.5">
              <span className="text-sm font-medium text-slate-700">{label}</span>
              <div className="flex items-center gap-1">
                {keys.map((k, i) => (
                  <kbd
                    key={i}
                    className="inline-flex items-center justify-center px-2 py-0.5 min-w-[28px] text-xs font-bold bg-slate-100 text-slate-700 rounded-lg border border-slate-200 font-mono"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 text-center">
            Sur Windows/Linux, utilisez <kbd className="px-1 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-mono">Ctrl</kbd> à la place de <kbd className="px-1 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-mono">⌘</kbd>
          </p>
        </div>
      </div>
    </div>
  );
}
