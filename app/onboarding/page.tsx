"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, ChevronRight, ChevronLeft, Check, Home, User, Users, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/Input";
import {
  saveOnboardingStep1,
  saveOnboardingStep2,
  saveOnboardingStep3,
  saveOnboardingStep4,
  saveOnboardingLocataire,
  getOnboardingRecap,
  markOnboardingComplete,
  checkAndCompleteOnboarding,
} from "@/app/actions/onboarding";
const TOTAL_STEPS = 4;

const STEP_CONFIG = [
  { icon: User, label: "Profil" },
  { icon: Home, label: "Premier bien" },
  { icon: Users, label: "Locataire" },
  { icon: Sparkles, label: "Terminé" },
];

export default function OnboardingPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  // Step 1: Profil
  const [nom, setNom] = useState(session?.user?.name || "");
  const [telephone, setTelephone] = useState("");
  const [ville, setVille] = useState("");
  const [bailleurNom, setBailleurNom] = useState("");
  const [bailleurAdresse, setBailleurAdresse] = useState("");
  const [siret, setSiret] = useState("");

  // Step 2: Bien
  const [bienAdresse, setBienAdresse] = useState("");
  const [bienSurface, setBienSurface] = useState("");
  const [bienLoyer, setBienLoyer] = useState("");
  const [bienCharges, setBienCharges] = useState("");

  // Step 3: Locataire
  const [locNom, setLocNom] = useState("");
  const [locEmail, setLocEmail] = useState("");
  const [locDateDebut, setLocDateDebut] = useState("");
  const [locLoyer, setLocLoyer] = useState("");

  // Step 4: Recap
  const [recap, setRecap] = useState<{ nom?: string | null; metier?: string | null; bailleurNom?: string | null; ville?: string | null; bienCount: number; bailCount: number } | null>(null);

  useEffect(() => {
    checkAndCompleteOnboarding()
      .then(async ({ shouldSkip }) => {
        if (shouldSkip) {
          await updateSession({ onboardingCompleted: true });
          router.push("/dashboard");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, []);

  const handleNext = async () => {
    setError("");
    setSaving(true);
    try {
      if (step === 1) {
        if (!nom.trim()) { setError("Le nom est requis"); setSaving(false); return; }
        await saveOnboardingStep1("PROPRIETAIRE");
        await updateSession({ metier: "PROPRIETAIRE" });
        await saveOnboardingStep2({ name: nom.trim(), telephone: telephone.trim(), ville: ville.trim() });
        if (bailleurNom.trim() || bailleurAdresse.trim()) {
          await saveOnboardingStep3({ bailleurNom: bailleurNom.trim(), bailleurAdresse: bailleurAdresse.trim(), siret: siret.trim() });
        }
      } else if (step === 2) {
        if (bienAdresse.trim()) {
          await saveOnboardingStep4({
            adresse: bienAdresse.trim(),
            surface: bienSurface ? parseFloat(bienSurface) : undefined,
            loyer: bienLoyer ? parseFloat(bienLoyer) : undefined,
          });
        }
      } else if (step === 3) {
        if (locNom.trim()) {
          await saveOnboardingLocataire({
            locataireNom: locNom.trim(),
            locataireEmail: locEmail.trim() || undefined,
            dateDebut: locDateDebut || undefined,
            loyerMensuel: locLoyer ? parseFloat(locLoyer) : undefined,
          });
        }
      }

      if (step < TOTAL_STEPS) {
        if (step === 3 || (step === 2 && !bienAdresse.trim())) {
          const r = await getOnboardingRecap();
          setRecap(r);
        }
        if (step === 2 && !bienAdresse.trim()) {
          setStep(4);
        } else {
          setStep(step + 1);
        }
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

  const handleSkip = async () => {
    if (step === 3 || step === 2) {
      const r = await getOnboardingRecap();
      setRecap(r);
    }
    if (step === 2) {
      setStep(4);
    } else if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
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

  const progress = (step / TOTAL_STEPS) * 100;

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white mx-auto mb-3">
            <Building2 className="w-5 h-5" />
          </div>
          <p className="text-sm text-slate-500 font-semibold">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200">
        <div className="h-full bg-emerald-600 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 pt-6 pb-2">
        {STEP_CONFIG.map((s, i) => {
          const StepIcon = s.icon;
          const stepNum = i + 1;
          const isActive = stepNum === step;
          const isDone = stepNum < step;
          return (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <div className={`w-8 h-0.5 ${isDone ? "bg-emerald-400" : "bg-slate-200"}`} />}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                isActive ? "bg-emerald-100 text-emerald-700" : isDone ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
              }`}>
                {isDone ? <Check className="w-3 h-3" /> : <StepIcon className="w-3 h-3" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </div>
          );
        })}
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

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            {/* Step 1: Profil complet */}
            {step === 1 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <User className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-black text-slate-900">Votre profil</h2>
                </div>
                <p className="text-sm text-slate-500 mb-5">Commençons par vous connaître.</p>

                <div className="space-y-3">
                  <Input label="Nom complet *" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Jean Dupont" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Téléphone" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="06 12 34 56 78" />
                    <Input label="Ville" value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Paris" />
                  </div>
                  <Input label="Nom du bailleur" value={bailleurNom} onChange={(e) => setBailleurNom(e.target.value)} placeholder="Jean Dupont / SCI Dupont" />
                  <Input label="Adresse du bailleur" value={bailleurAdresse} onChange={(e) => setBailleurAdresse(e.target.value)} placeholder="12 rue de la Paix, 75002 Paris" />
                </div>
              </>
            )}

            {/* Step 2: Premier bien */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Home className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-black text-slate-900">Votre premier bien</h2>
                </div>
                <p className="text-sm text-slate-500 mb-5">Ajoutez votre premier logement. Vous pourrez en ajouter d&apos;autres plus tard.</p>
                <div className="space-y-3">
                  <Input label="Adresse du bien" value={bienAdresse} onChange={(e) => setBienAdresse(e.target.value)} placeholder="25 avenue des Champs-Elysées, 75008 Paris" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Surface (m²)" type="number" value={bienSurface} onChange={(e) => setBienSurface(e.target.value)} placeholder="45" />
                    <Input label="Loyer CC (€)" type="number" value={bienLoyer} onChange={(e) => setBienLoyer(e.target.value)} placeholder="850" />
                  </div>
                  <Input label="Charges mensuelles (€)" type="number" value={bienCharges} onChange={(e) => setBienCharges(e.target.value)} placeholder="50" />
                </div>
              </>
            )}

            {/* Step 3: Locataire actuel */}
            {step === 3 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-black text-slate-900">Locataire actuel</h2>
                </div>
                <p className="text-sm text-slate-500 mb-5">Si un locataire occupe déjà votre bien, renseignez ses informations. Sinon, vous pouvez passer cette étape.</p>
                <div className="space-y-3">
                  <Input label="Nom du locataire" value={locNom} onChange={(e) => setLocNom(e.target.value)} placeholder="Marie Martin" />
                  <Input label="Email du locataire" type="email" value={locEmail} onChange={(e) => setLocEmail(e.target.value)} placeholder="marie@example.com" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Début du bail" type="date" value={locDateDebut} onChange={(e) => setLocDateDebut(e.target.value)} />
                    <Input label="Loyer mensuel (€)" type="number" value={locLoyer} onChange={(e) => setLocLoyer(e.target.value)} placeholder="850" />
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Terminé */}
            {step === 4 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-black text-slate-900">Tout est prêt !</h2>
                </div>
                <p className="text-sm text-slate-500 mb-5">Voici un récapitulatif de votre configuration :</p>

                <div className="space-y-3">
                  {recap && (
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Nom</span>
                        <span className="font-bold text-slate-800">{recap.nom || "—"}</span>
                      </div>
                      {recap.ville && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Ville</span>
                          <span className="font-bold text-slate-800">{recap.ville}</span>
                        </div>
                      )}
                      {recap.bailleurNom && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Bailleur</span>
                          <span className="font-bold text-slate-800">{recap.bailleurNom}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Biens</span>
                        <span className="font-bold text-slate-800">{recap.bienCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Baux actifs</span>
                        <span className="font-bold text-slate-800">{recap.bailCount}</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-700">
                    Vous pouvez maintenant gérer vos biens, baux, candidatures et finances depuis votre tableau de bord.
                  </div>
                </div>
              </>
            )}

            {error && <p className="mt-4 text-sm text-red-600 font-semibold">{error}</p>}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {step > 1 && step < 4 ? (
              <button onClick={handleBack} className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700">
                <ChevronLeft className="w-4 h-4" /> Retour
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              {(step === 2 || step === 3) && (
                <button onClick={handleSkip} className="text-sm font-bold text-slate-400 hover:text-slate-600">
                  Passer
                </button>
              )}

              {step < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? "..." : "Continuer"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? "..." : "Accéder à mon tableau de bord"}
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
