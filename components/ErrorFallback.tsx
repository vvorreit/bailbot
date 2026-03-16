"use client";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorFallbackProps {
  error?: Error | null;
  onRetry?: () => void;
}

export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
          Une erreur est survenue
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
          {error?.message || "Un problème inattendu s'est produit. Veuillez réessayer."}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Réessayer
          </button>
        )}
        <a
          href={`mailto:contact@optibot.fr?subject=${encodeURIComponent("Bug report — BailBot")}&body=${encodeURIComponent(error?.message ? `Erreur : ${error.message}` : "Une erreur est survenue")}`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        >
          <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          Signaler
        </a>
      </div>
    </div>
  );
}
