"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, ChevronRight, ChevronLeft, Check, Bell, Home, User, Briefcase } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  saveOnboardingStep1,
  saveOnboardingStep2,
  saveOnboardingStep3,
  saveOnboardingStep4,
  markOnboardingComplete,
} from "@/app/actions/onboarding";
import type { Metier } from "@prisma/client";

const TOTAL_STEPS = 5;

const METIER_OPTIONS: { value: Metier; icon: string; label: string; description: string }[] = [
  { value: "PROPRIETAIRE", icon: "🏠", label: "Proprietaire bailleur", description: "Je gere mes propres biens en direct" },
  { value: "AGENCE", icon: "🏢", label: "Agence / Mandataire", description: "Je gere des biens pour le compte de proprietaires" },
  { value: "GESTIONNAIRE", icon: "⚖️", label: "Gestionnaire professionnel", description: "Administrateur de biens, syndic, notaire" },
];

export default function OnboardingPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const { supported, requestPermission, subscribe } = usePushNotifications();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [metier, setMetier] = useState<Metier | null>(null);

  // Step 2
  const [nom, setNom] = useState(session?.user?.name || "");
  const [telephone, setTelephone] = useState("");
  const [ville, setVille] = useState("");

  // Step 3
  const [bailleurNom, setBailleurNom] = useState("");
  const [bailleurAdresse, setBailleurAdresse] = useState("");
  const [siret, setSiret] = useState("");

  // Step 4
  const [bienAdresse, setBienAdresse] = useState("");
  const [bienSurface, setBienSurface] = useState("");
  const [bienLoyer, setBienLoyer] = useState("");

  const handleNext = async () => {
    setError("");
    setSaving(true);
    try {
      if (step === 1) {
        if (!metier) { setError("Selectionnez un profil"); setSaving(false); return; }
        await saveOnboardingStep1(metier);
        await updateSession({ metier });
      } else if (step === 2) {
        if (!nom.trim()) { setError("Le nom est requis"); setSaving(false); return; }
        await saveOnboardingStep2({ name: nom.trim(), telephone: telephone.trim(), ville: ville.trim() });
      } else if (step === 3) {
        await saveOnboardingStep3({
          bailleurNom: bailleurNom.trim(),
          bailleurAdresse: bailleurAdresse.trim(),
          siret: siret.trim(),
        });
      } else if (step === 4) {
        if (bienAdresse.trim()) {
          await saveOnboardingStep4({
            adresse: bienAdresse.trim(),
            surface: bienSurface ? parseFloat(bienSurface) : undefined,
            loyer: bienLoyer ? parseFloat(bienLoyer) : undefined,
          });
        }
      } else if (step === 5) {
        // Push notifications — optional, handled inline
      }

      if (step < TOTAL_STEPS) {
        setStep(step + 1);
      }
    } catch (e: any) {
      setError(e.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSkip = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await markOnboardingComplete();
      await updateSession({ onboardingCompleted: true });
      router.push("/dashboard?welcome=1");
    } catch (e: any) {
      setError(e.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePush = async () => {
    try {
      const result = await requestPermission();
      if (result === "granted") {
        const sub = await subscribe();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sub.toJSON()),
          });
        }
      }
    } catch {
      /* silent */
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200">
        <div
          className="h-full bg-emerald-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-slate-900">BailBot</span>
          </div>

          {/* Step indicator */}
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            Etape {step} / {TOTAL_STEPS}
          </p>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            {/* Step 1: Profil */}
            {step === 1 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-black text-slate-900">Quel est votre profil ?</h2>
                </div>
                <p className="text-sm text-slate-500 mb-5">Personnalisez BailBot selon votre activite.</p>
                <div className="space-y-3">
                  {METIER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setMetier(opt.value)}
                      className={`w-full flex items-start gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all text-left ${
                        metier === opt.value
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-2xl leading-none mt-0.5">{opt.icon}</span>
                      <div>
                        <p className="text-sm font-black text-slate-900">{opt.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 2: Infos de base */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <User className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-black text-slate-900">Vos informations</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Nom complet *</label>
                    <input
                      type="text"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      placeholder="Jean Dupont"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Telephone</label>
                    <input
                      type="tel"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      placeholder="06 12 34 56 78"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Ville</label>
                    <input
                      type="text"
                      value={ville}
                      onChange={(e) => setVille(e.target.value)}
                      placeholder="Paris"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Profil bailleur */}
            {step === 3 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-black text-slate-900">Profil bailleur</h2>
                </div>
                <p className="text-sm text-slate-500 mb-5">Ces informations pre-rempliront vos contrats et quittances.</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Nom complet du bailleur</label>
                    <input
                      type="text"
                      value={bailleurNom}
                      onChange={(e) => setBailleurNom(e.target.value)}
                      placeholder="Jean Dupont / SCI Dupont"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Adresse du bailleur</label>
                    <input
                      type="text"
                      value={bailleurAdresse}
                      onChange={(e) => setBailleurAdresse(e.target.value)}
                      placeholder="12 rue de la Paix, 75002 Paris"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  {metier !== "PROPRIETAIRE" && (
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">SIRET (agence / gestionnaire)</label>
                      <input
                        type="text"
                        value={siret}
                        onChange={(e) => setSiret(e.target.value)}
                        placeholder="123 456 789 00010"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 4: Premier bien */}
            {step === 4 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Home className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-black text-slate-900">Votre premier bien</h2>
                </div>
                <p className="text-sm text-slate-500 mb-5">Optionnel — vous pourrez en ajouter plus tard.</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Adresse du bien</label>
                    <input
                      type="text"
                      value={bienAdresse}
                      onChange={(e) => setBienAdresse(e.target.value)}
                      placeholder="25 avenue des Champs-Elysees, 75008 Paris"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Surface (m2)</label>
                      <input
                        type="number"
                        value={bienSurface}
                        onChange={(e) => setBienSurface(e.target.value)}
                        placeholder="45"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Loyer CC (EUR)</label>
                      <input
                        type="number"
                        value={bienLoyer}
                        onChange={(e) => setBienLoyer(e.target.value)}
                        placeholder="850"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 5: Notifications */}
            {step === 5 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Bell className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-black text-slate-900">Notifications</h2>
                </div>
                <p className="text-sm text-slate-500 mb-5">
                  Activez les notifications push pour etre alerte en cas de loyer impaye,
                  d&apos;echeance de bail ou de diagnostic expire.
                </p>
                {supported ? (
                  <button
                    onClick={handleEnablePush}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    Activer les notifications
                  </button>
                ) : (
                  <div className="bg-slate-100 rounded-xl p-4 text-sm text-slate-500 text-center">
                    Les notifications push ne sont pas supportees par ce navigateur.
                  </div>
                )}
              </>
            )}

            {/* Error */}
            {error && (
              <p className="mt-4 text-sm text-red-600 font-semibold">{error}</p>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {(step === 4 || step === 5) && step < TOTAL_STEPS && (
                <button
                  onClick={handleSkip}
                  className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Passer
                </button>
              )}

              {step < TOTAL_STEPS ? (
                <button
                  onClick={handleNext}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "..." : "Continuer"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "..." : "Commencer"}
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
