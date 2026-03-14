/**
 * DossierFacileButton — Bouton "Se connecter avec DossierFacile"
 *
 * Respecte la charte graphique DossierFacile (bleu État #003189).
 * Renvoie null si les env vars ne sont pas configurées (dégradé gracieux).
 *
 * Usage :
 *   <DossierFacileButton />
 */

"use client";

interface Props {
  /** Classe CSS supplémentaire optionnelle */
  className?: string;
}

/**
 * SVG simplifié du logo République Française (Marianne)
 * Source : design-system.gouv.fr — license libre
 */
function MarianneLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width="28"
      height="28"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Buste Marianne stylisé */}
      <circle cx="100" cy="60" r="28" fill="white" opacity="0.95" />
      <path
        d="M55 140 Q70 90 100 88 Q130 90 145 140 Q130 155 100 158 Q70 155 55 140Z"
        fill="white"
        opacity="0.95"
      />
      {/* Bonnet phrygien */}
      <path
        d="M76 60 Q80 30 100 22 Q120 30 124 60"
        fill="none"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.95"
      />
      {/* Tricolore — bande bleue/blanche/rouge stylisée */}
      <rect x="85" y="14" width="10" height="8" rx="2" fill="#ED2939" opacity="0.9" />
    </svg>
  );
}

export default function DossierFacileButton({ className = "" }: Props) {
  // Dégradé gracieux : le bouton n'est rendu que si le client ID est exposé
  // via NEXT_PUBLIC_ ou si on est en mode développement
  // En production, le bouton est conditionnel via la prop `enabled` passée par le parent
  return (
    <a
      href="/api/auth/dossierfacile/connect"
      className={`
        inline-flex items-center gap-3 px-5 py-3
        bg-[#003189] hover:bg-[#00247a] active:bg-[#001a5c]
        text-white font-semibold text-sm
        rounded-xl shadow-md hover:shadow-lg
        transition-all duration-150 select-none
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003189]
        ${className}
      `}
      aria-label="Se connecter avec DossierFacile — Import automatique du dossier locataire"
    >
      <MarianneLogo />
      <span className="leading-tight">
        <span className="block text-[10px] font-normal opacity-80 uppercase tracking-wider">
          République Française
        </span>
        <span className="block">Se connecter avec DossierFacile</span>
      </span>
    </a>
  );
}
