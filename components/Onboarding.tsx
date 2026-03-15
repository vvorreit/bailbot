"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { X, ChevronRight, GraduationCap } from "lucide-react";
import { setMetier } from "@/app/dashboard/actions";
import type { Metier } from "@prisma/client";

const ONBOARDING_KEY = "bailbot_onboarding_done";
const SIGNUP_METIER_KEY = "bailbot_signup_metier";

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

const METIER_OPTIONS: { value: Metier; icon: string; label: string; description: string }[] = [
  {
    value: "PROPRIETAIRE",
    icon: "🏠",
    label: "Propriétaire bailleur",
    description: "Je gère mes propres biens en direct",
  },
  {
    value: "AGENCE",
    icon: "🏢",
    label: "Agence / Mandataire",
    description: "Je gère des biens pour le compte de propriétaires",
  },
  {
    value: "GESTIONNAIRE",
    icon: "⚖️",
    label: "Gestionnaire professionnel",
    description: "Administrateur de biens, syndic, notaire",
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

  /* Phase 0 : sélection métier (bloquante) */
  const [metierPhase, setMetierPhase] = useState(false);
  const [metierSaving, setMetierSaving] = useState(false);
  const [selectedMetier, setSelectedMetier] = useState<Metier | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(SIGNUP_METIER_KEY) as Metier | null;
    const valid: Metier[] = ["PROPRIETAIRE", "AGENCE", "GESTIONNAIRE"];
    return stored && valid.includes(stored) ? stored : null;
  });

  /* Phase 1 : tour guidé */
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);

  /* Décider quelle phase afficher */
  useEffect(() => {
    if (!session) return;
    if (user?.metier == null) {
      setMetierPhase(true);
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

  /* ─── Sélection métier ─────────────────────────────────────────────────── */
  const handleConfirmMetier = async () => {
    if (!selectedMetier) return;
    setMetierSaving(true);
    try {
      await setMetier(selectedMetier);
      await updateSession({ metier: selectedMetier });
      localStorage.removeItem(SIGNUP_METIER_KEY);
      setMetierPhase(false);
      /* Lancer le tour guidé juste après */
      const done = typeof window !== "undefined" && localStorage.getItem(ONBOARDING_KEY);
      if (!done) {
        setTimeout(() => setActive(true), 600);
      }
    } catch {
      /* silent */
    } finally {
      setMetierSaving(false);
    }
  };

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

  /* ─── Rendu sélection métier ───────────────────────────────────────────── */
  if (metierPhase) {
    return (
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Sélection de votre profil métier">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <h2 className="text-xl font-black text-slate-900 mb-1">Quel est votre profil ?</h2>
          <p className="text-sm text-slate-500 mb-5">
            Personnalisez BailBot selon votre activité.
          </p>

          <div className="space-y-3 mb-6">
            {METIER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedMetier(opt.value)}
                className={`w-full flex items-start gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all text-left ${
                  selectedMetier === opt.value
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="text-2xl leading-none mt-0.5" aria-hidden="true">{opt.icon}</span>
                <div>
                  <p className="text-sm font-black text-slate-900">{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleConfirmMetier}
            disabled={!selectedMetier || metierSaving}
            aria-label={metierSaving ? "Enregistrement en cours" : "Confirmer le profil et continuer"}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {metierSaving ? "Enregistrement..." : "Continuer →"}
          </button>
        </div>
      </div>
    );
  }

  /* ─── Rendu tour guidé ─────────────────────────────────────────────────── */
  if (!active) return null;

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
