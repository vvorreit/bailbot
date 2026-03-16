'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Minus, Send, Loader2, ChevronDown, Mail } from 'lucide-react';
import { getLocatairesActifs, sendQuickMessage, type LocataireOption } from '@/app/actions/quick-message';

interface Props {
  open: boolean;
  onClose: () => void;
  preselectedEmail?: string;
}

export default function QuickMessageDrawer({ open, onClose, preselectedEmail }: Props) {
  const [minimized, setMinimized] = useState(false);
  const [locataires, setLocataires] = useState<LocataireOption[]>([]);
  const [to, setTo] = useState(preselectedEmail || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      getLocatairesActifs().then(setLocataires).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (preselectedEmail) setTo(preselectedEmail);
  }, [preselectedEmail]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredLocataires = locataires.filter((l) =>
    l.nom.toLowerCase().includes(search.toLowerCase()) ||
    l.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSend() {
    if (!to || !subject || !body) return;
    setSending(true);
    setResult(null);
    try {
      const res = await sendQuickMessage(to, subject, body);
      setResult(res);
      if (res.success) {
        setTimeout(() => {
          setTo('');
          setSubject('');
          setBody('');
          setResult(null);
          onClose();
        }, 1500);
      }
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  if (minimized) {
    return (
      <div className="fixed bottom-0 right-4 z-50 w-72">
        <button
          onClick={() => setMinimized(false)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-emerald-600 text-white rounded-t-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg"
        >
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Message rapide
          </div>
          <ChevronDown className="w-4 h-4 rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-4 z-50 w-[400px] max-w-[calc(100vw-2rem)] animate-slide-up">
      <div className="bg-white rounded-t-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-emerald-600 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white">Message rapide</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(true)}
              className="p-1 rounded hover:bg-emerald-700 transition-colors"
              title="Réduire"
            >
              <Minus className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-emerald-700 transition-colors"
              title="Fermer"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          {/* Destinataire */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Destinataire</label>
            <input
              ref={inputRef}
              type="email"
              value={to}
              onChange={(e) => { setTo(e.target.value); setSearch(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="email@locataire.fr"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            {showSuggestions && filteredLocataires.length > 0 && (
              <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                {filteredLocataires.map((l) => (
                  <button
                    key={l.bailId}
                    onClick={() => { setTo(l.email); setShowSuggestions(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    <p className="text-sm font-semibold text-slate-700">{l.nom}</p>
                    <p className="text-xs text-slate-400">{l.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sujet */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sujet</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet du message"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Corps */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Votre message..."
              rows={5}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>

          {/* Result message */}
          {result && (
            <div className={`text-xs font-bold px-3 py-2 rounded-lg ${result.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {result.success ? 'Message envoyé !' : result.error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">⌘M pour ouvrir/fermer</span>
          <button
            onClick={handleSend}
            disabled={sending || !to || !subject || !body}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
