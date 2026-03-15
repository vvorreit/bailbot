'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { rechercherCandidatures, listerBiens, type Candidature, type Bien } from '@/lib/db-local';
import DossierModal from './DossierModal';

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  en_analyse: 'En analyse',
  complet: 'Complet',
  selectionne: 'Sélectionné',
  refuse: 'Refusé',
};

const STATUT_COLORS: Record<string, string> = {
  en_attente: 'bg-slate-100 text-slate-600',
  en_analyse: 'bg-blue-100 text-blue-600',
  complet: 'bg-emerald-100 text-emerald-700',
  selectionne: 'bg-purple-100 text-purple-700',
  refuse: 'bg-red-100 text-red-600',
};

export default function SearchDossiers() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Candidature[]>([]);
  const [biens, setBiens] = useState<Record<string, Bien>>({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedCandidature, setSelectedCandidature] = useState<Candidature | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Charger les biens pour avoir les adresses
  useEffect(() => {
    listerBiens().then((b) => {
      setBiens(Object.fromEntries(b.map((bien) => [bien.id, bien])));
    }).catch(() => {});
  }, []);

  // Raccourci clavier Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fermer en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      setOpen(q.length > 0);
      return;
    }
    setLoading(true);
    setOpen(true);
    try {
      const res = await rechercherCandidatures(q);
      setResults(res.slice(0, 8)); // max 8 résultats
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = (c: Candidature) => {
    setSelectedCandidature(c);
    setOpen(false);
    setQuery('');
  };

  const scoreColor = (score?: number) => {
    if (!score) return 'text-slate-400';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 65) return 'text-blue-600';
    return 'text-orange-500';
  };

  return (
    <>
      <div ref={containerRef} className="relative hidden md:block">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-colors w-56 cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher… (⌘K)"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.length >= 2 && setOpen(true)}
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none min-w-0"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown résultats */}
        {open && (
          <div className="absolute top-full mt-2 left-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 overflow-hidden z-50">
            {loading && (
              <div className="px-4 py-3 text-sm text-slate-400">Recherche...</div>
            )}
            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-400">Aucun résultat pour « {query} »</div>
            )}
            {!loading && query.length < 2 && query.length > 0 && (
              <div className="px-4 py-3 text-sm text-slate-400">Tapez au moins 2 caractères</div>
            )}
            {!loading && results.map((c) => {
              const d = c.dossier;
              const bien = biens[c.bienId];
              const nomComplet = [d.prenom, d.nom].filter(Boolean).join(' ') || 'Locataire inconnu';
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 border-b border-slate-50 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{nomComplet}</p>
                    {bien?.adresse && (
                      <p className="text-xs text-slate-400 truncate">{bien.adresse}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.bailScore !== undefined && (
                      <span className={`text-xs font-black ${scoreColor(c.bailScore)}`}>
                        {c.bailScore}
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUT_COLORS[c.statut] || 'bg-slate-100 text-slate-600'}`}>
                      {STATUT_LABELS[c.statut] || c.statut}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* DossierModal si un résultat est sélectionné */}
      {selectedCandidature && (
        <DossierModal
          candidature={selectedCandidature}
          bien={biens[selectedCandidature.bienId]}
          onClose={() => setSelectedCandidature(null)}
          onUpdated={() => setSelectedCandidature(null)}
          onDeleted={() => setSelectedCandidature(null)}
        />
      )}
    </>
  );
}
