"use client";
import { useState, useEffect } from "react";
import { HelpCircle, X, Book, MessageSquare, Keyboard, ExternalLink } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const helpSections = [
  {
    icon: Book,
    title: "Premiers pas",
    items: [
      "Créez votre premier bien dans 'Logements'",
      "Ajoutez un dossier locataire via le drag & drop",
      "Générez un bail automatiquement depuis un dossier complet",
    ],
  },
  {
    icon: Keyboard,
    title: "Raccourcis clavier",
    items: [
      "⌘K / Ctrl+K — Rechercher un dossier",
      "⌘G / Ctrl+G — Générer un bail",
      "⌘Q / Ctrl+Q — Quittance de loyer",
      "? — Afficher l'aide raccourcis",
    ],
  },
  {
    icon: MessageSquare,
    title: "Support",
    items: [
      "Email : support@bailbot.fr",
      "Réponse sous 24h en jours ouvrés",
    ],
  },
];

export function HelpCenter() {
  const [open, setOpen] = useState(false);
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "?" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le centre d'aide"
        className="fixed bottom-20 right-4 z-50 md:bottom-6 w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-label="Centre d'aide"
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl h-full overflow-y-auto animate-slide-in-right"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Centre d&apos;aide</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-6">
              {helpSections.map(({ icon: Icon, title, items }) => (
                <section key={title}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item} className="text-xs text-slate-600 dark:text-slate-400 pl-6">
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              <a
                href="/support"
                className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium mt-4"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                Contacter le support
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
