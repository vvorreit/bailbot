'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface Feature {
  properties: {
    label: string;
    postcode: string;
    city: string;
    name: string;
    context: string;
  };
}

interface AdresseSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function AdresseSearch({
  value,
  onChange,
  placeholder = 'Tapez l\'adresse du bien...',
  className = '',
  required = false,
}: AdresseSearchProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value → internal query
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5&autocomplete=1`
      );
      const data = await res.json();
      const features: Feature[] = data.features ?? [];
      setSuggestions(features);
      setIsOpen(features.length > 0);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    onChange(q); // let parent know immediately (for required validation)

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 300);
  };

  const handleSelect = (feature: Feature) => {
    const label = feature.properties.label;
    setQuery(label);
    onChange(label);
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className={`w-full border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder:text-slate-400 ${className}`}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((feature, idx) => (
            <li key={idx}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(feature); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  idx === activeIndex
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="font-medium">{feature.properties.name}</span>
                <span className="text-slate-500 ml-1.5 text-xs">
                  {feature.properties.postcode} {feature.properties.city}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
