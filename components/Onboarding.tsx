"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { X, ChevronRight, GraduationCap } from "lucide-react";
import { setMetier } from "@/app/dashboard/actions";

const ONBOARDING_KEY = "bailbot_onboarding_done";

interface Step {
  target: string;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
}

const STEPS: Step[] = [
  {
    target: "#drop-zone",
    title: "📂 Déposez vos documents",
    content:
      "Glissez tous les documents du locataire ici. BailBot détecte automatiquement le type de chaque fichier.",
    position: "bottom",
  },
  {
    target: "#bailscore-card",
    title: "🎯 BailScore automatique",
    content:
      "BailBot calcule un score de solvabilité basé sur les revenus, le type de contrat et la cohérence des documents.",
    position: "left",
  },
  {
    target: "#visale-card",
    title: "✅ Éligibilité Visale",
    content:
      "BailBot vérifie automatiquement si le locataire est éligible à la garantie gratuite Visale.",
    position: "left",
  },
  {
    target: "#generate-bail-btn",
    title: "📄 Générer le bail",
    content:
      "Une fois le dossier validé, générez un contrat de location conforme loi ALUR en un clic.",
    position: "bottom",
  },
  {
    target: "#nav-multi",
    title: "📋 Multi-dossiers",
    content:
      "Gérez plusieurs candidats pour un même bien dans un tableau Kanban. Vos données restent dans votre navigateur.",
    position: "right",
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getTooltipStyle(rect: SpotlightRect, position: Step["position"]): React.CSSProperties {
  const margin = 16;
  switch (position) {
    case "bottom":
      return {
        top: rect.top + rect.height + margin,
        left: Math.max(16, rect.left + rect.width / 2 - 150),
      };
    case "top":
      return {
        top: rect.top - margin - 180,
        left: Math.max(16, rect.left + rect.width / 2 - 150),
      };
    case "left":
      return {
        top: Math.max(16, rect.top + rect.height / 2 - 70),
        left: Math.max(16, rect.left - 320 - margin),
      };
    case "right":
      return {
        top: Math.max(16, rect.top + rect.height / 2 - 70),
        left: rect.left + rect.width + margin,
      };
    default:
      return { top: "50%", left: "50%" };
  }
}

export default function Onboarding() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user as any;

  /* Auto-set PROPRIETAIRE si pas de metier */
  const [metierSaving, setMetierSaving] = useState(false);

  /* Tour guidé */
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);

  /* Décider quelle phase afficher */
  useEffect(() => {
    if (!session) return;
    if (user?.metier == null) {
      /* Auto-assign PROPRIETAIRE */
      setMetierSaving(true);
      setMetier("PROPRIETAIRE")
        .then(() => updateSession({ metier: "PROPRIETAIRE" }))
        .catch(() => {})
        .finally(() => setMetierSaving(false));
      return;
    }
    if (typeof window !== "undefined") {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (!done) {
        const t = setTimeout(() => setActive(true), 1200);
        return () => clearTimeout(t);
      }
    }
  }, [session, user?.metier]);

  /* ─── Tour guidé ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!active) return;
    const currentStep = STEPS[step];
    const el = document.querySelector(currentStep.target) as HTMLElement | null;
    if (el) {
      const rect = el.getBoundingClientRect();
      setSpotlightRect({
        top: rect.top + window.scrollY - 8,
        left: rect.left + window.scrollX - 8,
        width: rect.width + 16,
        height: rect.height + 16,
      });
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setSpotlightRect(null);
    }
  }, [active, step]);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }, [step]);

  const finish = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setActive(false);
  };

  /* ─── Rendu tour guidé ─────────────────────────────────────────────────── */
  if (metierSaving || !active) return null;

  const currentStep = STEPS[step];
  const tooltipStyle = spotlightRect
    ? getTooltipStyle(spotlightRect, currentStep.position)
    : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

  return (
    <>
      {/* Overlay avec trou (spotlight) */}
      <div className="fixed inset-0 z-[9998] pointer-events-none" role="dialog" aria-modal="true" aria-label="Tour guidé de BailBot">
        <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={finish} />
        {spotlightRect && (
          <div
            className="absolute rounded-2xl ring-4 ring-emerald-400 ring-offset-0 pointer-events-none"
            style={{
              top: spotlightRect.top,
              left: spotlightRect.left,
              width: spotlightRect.width,
              height: spotlightRect.height,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
              zIndex: 9999,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        className="fixed z-[10000] w-[300px] bg-white rounded-2xl shadow-2xl p-5 pointer-events-auto"
        style={tooltipStyle}
      >
        {/* Progress dots */}
        <div
          className="flex gap-1.5 mb-3"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-label={`Étape ${step + 1} sur ${STEPS.length}`}
        >
          {STEPS.map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-emerald-600" : i < step ? "w-3 bg-emerald-200" : "w-3 bg-slate-100"
              }`}
            />
          ))}
        </div>

        <h3 className="text-base font-black text-slate-900 mb-2">{currentStep.title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">{currentStep.content}</p>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={finish}
            aria-label="Passer le tour guidé"
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Passer le tour
          </button>
          <button
            onClick={next}
            aria-label={step < STEPS.length - 1 ? "Étape suivante" : "Terminer le tour guidé"}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-colors"
          >
            {step < STEPS.length - 1 ? (
              <>
                Suivant <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </>
            ) : (
              "Terminer 🎉"
            )}
          </button>
        </div>

        <p className="text-[10px] text-slate-400 text-center mt-3">
          {step + 1} / {STEPS.length}
        </p>
      </div>
    </>
  );
}

/** Bouton pour relancer manuellement le tour depuis le NavMenu */
export function OnboardingTrigger() {
  const restart = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    window.location.reload();
  };
  return (
    <button
      onClick={restart}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
      title="Relancer le tutoriel"
      aria-label="Relancer le tutoriel"
    >
      <GraduationCap className="w-4 h-4" aria-hidden="true" />
      Tutoriel
    </button>
  );
}
