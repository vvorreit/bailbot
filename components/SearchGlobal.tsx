"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, X, Home, FileSignature, FileSearch, Wrench, FileText, Users,
} from "lucide-react";
import { searchGlobal, type SearchResult } from "@/app/actions/search";

const TYPE_CONFIG: Record<SearchResult["type"], { icon: typeof Search; label: string; color: string }> = {
  bien: { icon: Home, label: "Biens", color: "text-emerald-600" },
  locataire: { icon: Users, label: "Locataires", color: "text-blue-600" },
  bail: { icon: FileSignature, label: "Baux", color: "text-violet-600" },
  candidature: { icon: FileSearch, label: "Candidatures", color: "text-amber-600" },
  travaux: { icon: Wrench, label: "Travaux", color: "text-orange-600" },
  document: { icon: FileText, label: "Documents", color: "text-slate-600" },
};

export default function SearchGlobal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const doSearch = useCallback((q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    searchGlobal(q)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSelect = (r: SearchResult) => {
    onClose();
    router.push(r.href);
  };

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Rechercher biens, locataires, baux, documents..."
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-slate-400"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }} className="p-1 rounded hover:bg-slate-100">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
          <kbd className="hidden sm:inline text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {loading && (
            <div className="py-8 text-center text-sm text-slate-400">Recherche...</div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-400">Aucun résultat</div>
          )}

          {!loading && Object.entries(grouped).map(([type, items]) => {
            const cfg = TYPE_CONFIG[type as SearchResult["type"]];
            const Icon = cfg.icon;
            return (
              <div key={type}>
                <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                  {cfg.label}
                </div>
                {items.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r)}
                    className="flex items-center gap-3 px-4 py-2.5 w-full text-left hover:bg-slate-50 transition-colors"
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{r.label}</p>
                      {r.sublabel && (
                        <p className="text-xs text-slate-400 truncate">{r.sublabel}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            );
          })}

          {!loading && query.length < 2 && (
            <div className="py-8 text-center text-sm text-slate-400">
              Tapez au moins 2 caractères
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
