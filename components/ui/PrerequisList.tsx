"use client";

import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

export interface Prerequis {
  label: string;
  met: boolean;
  fieldId?: string;
}

interface PrerequisListProps {
  items: Prerequis[];
  className?: string;
}

export function PrerequisList({ items, className = "" }: PrerequisListProps) {
  const allMet = items.every((i) => i.met);
  const metCount = items.filter((i) => i.met).length;

  const handleClick = (fieldId?: string) => {
    if (!fieldId) return;
    const el = document.getElementById(fieldId) ?? document.querySelector(`[name="${fieldId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        el.focus();
      }
    }
  };

  if (allMet) return null;

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-xl p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <p className="text-xs font-bold text-amber-800">
          {metCount}/{items.length} champs requis
        </p>
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.label}>
            {item.met ? (
              <span className="flex items-center gap-2 text-xs text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleClick(item.fieldId)}
                className="flex items-center gap-2 text-xs text-amber-700 hover:text-amber-900 hover:underline transition-colors"
              >
                <Circle className="w-3.5 h-3.5" />
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface PrerequisButtonProps {
  items: Prerequis[];
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  className?: string;
  id?: string;
}

export function PrerequisButton({ items, onClick, label, icon, className = "", id }: PrerequisButtonProps) {
  const allMet = items.every((i) => i.met);

  return (
    <div className="relative group" id={id}>
      <button
        onClick={allMet ? onClick : undefined}
        disabled={!allMet}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
          allMet
            ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            : "bg-slate-200 text-slate-400 cursor-not-allowed"
        } ${className}`}
      >
        {icon}
        {label}
      </button>
      {!allMet && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
          <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
            Completez les champs requis
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
          </div>
        </div>
      )}
    </div>
  );
}
