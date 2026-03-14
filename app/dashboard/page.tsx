"use client";

import { useState, useCallback, useEffect } from "react";
import DropZone from "@/components/DropZone";
import DossierForm from "@/components/DossierForm";
import DossierFacileButton from "@/components/DossierFacileButton";
import EligibiliteVisaleCard from "@/components/EligibiliteVisaleCard";
import { processDocument } from "@/lib/ocr";
import {
  parseDossier,
  parseDossierFacileProfile,
  detectDocumentType,
  DossierLocataire,
  DocumentType,
} from "@/lib/parsers";
import { calculerEligibiliteVisale, EligibiliteVisale } from "@/lib/eligibilite-visale";
import { STATIC_BOOKMARKLET } from "@/lib/autofill";
import {
  getUserDashboardData,
  incrementClientCountInDB,
  createCheckoutSession,
  createPortalSession,
  generateAutofillPayload,
  upgradePlan,
} from "./actions";
import { Copy, FileText, ShieldCheck, Building2 } from "lucide-react";
import Link from "next/link";

const EMPTY_DOSSIER: Partial<DossierLocataire> = {};

type DropType = "cni" | "bulletin" | "avis_impo" | "rib" | "domicile";

interface DocState {
  loading: boolean;
  progress: number;
  fileName?: string;
}

function BookmarkletInstallButton() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-white border-2 border-dashed border-emerald-200 rounded-2xl p-6 text-center space-y-3">
      <p className="text-sm font-bold text-emerald-900">1. Installation (Une seule fois)</p>
      <p className="text-xs text-emerald-600">
        Créez un favori nommé "BailBot" et collez ce code comme URL :
      </p>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(STATIC_BOOKMARKLET);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className={`w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all shadow-sm
          ${copied ? "bg-green-500 text-white" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
      >
        {copied ? "✓ Code du favori copié !" : "Copier le code du favori"}
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [dossier, setDossier] = useState<Partial<DossierLocataire>>(EMPTY_DOSSIER);
  const [docStates, setDocStates] = useState<Record<DropType, DocState>>({
    cni: { loading: false, progress: 0 },
    bulletin: { loading: false, progress: 0 },
    avis_impo: { loading: false, progress: 0 },
    rib: { loading: false, progress: 0 },
    domicile: { loading: false, progress: 0 },
  });
  const [isDataCopied, setIsDataCopied] = useState(false);
  const [isStripeLoading, setIsStripeLoading] = useState<string | null>(null);
  const [rawText, setRawText] = useState<Partial<Record<DropType, string>>>({});
  const [showRaw, setShowRaw] = useState<DropType | null>(null);

  // ─── Éligibilité Visale ────────────────────────────────────────────────────
  const [loyerMensuel, setLoyerMensuel] = useState<string>("");
  const [villeEstParis, setVilleEstParis] = useState<boolean>(false);
  const [visaleResult, setVisaleResult] = useState<EligibiliteVisale | null>(null);

  // ─── DossierFacile Connect ─────────────────────────────────────────────────
  // dossierFacileEnabled : true si les env vars sont configurées côté serveur
  // (exposé via NEXT_PUBLIC_ pour le rendu conditionnel du bouton)
  const dossierFacileEnabled = Boolean(process.env.NEXT_PUBLIC_DOSSIERFACILE_ENABLED === "true");
  const [dfImportStatus, setDfImportStatus] = useState<"idle" | "loaded" | "error">("idle");

  useEffect(() => {
    // Lit le cookie df_profile posé par le callback OAuth après redirection
    // et applique le parseur pour pré-remplir le formulaire
    const params = new URLSearchParams(window.location.search);
    const dossierParam = params.get("dossier");

    if (dossierParam === "loaded") {
      try {
        // Lit le cookie df_profile (httpOnly: false → lisible côté JS)
        const match = document.cookie.match(/(?:^|; )df_profile=([^;]*)/);
        if (match) {
          const profile = JSON.parse(decodeURIComponent(match[1]));
          const parsed = parseDossierFacileProfile(profile);
          setDossier((prev) => ({ ...prev, ...parsed }));
          setDfImportStatus("loaded");

          // Supprime le cookie après lecture (usage unique)
          document.cookie = "df_profile=; Max-Age=0; path=/";
        }
      } catch (err) {
        console.error("[DossierFacile] Cookie parse error:", err);
        setDfImportStatus("error");
      }

      // Nettoie le query param sans recharger la page
      const url = new URL(window.location.href);
      url.searchParams.delete("dossier");
      window.history.replaceState({}, "", url.toString());
    } else if (dossierParam === "error") {
      setDfImportStatus("error");
      const url = new URL(window.location.href);
      url.searchParams.delete("dossier");
      url.searchParams.delete("reason");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const [userData, setUserData] = useState<{
    clientCount: number;
    isPro: boolean;
    plan: string;
    role: string;
    syncToken: string | null;
    createdAt: string | Date;
  } | null>(null);

  const TRIAL_DAYS = 7;
  const trialDaysLeft = userData?.createdAt
    ? Math.max(
        0,
        TRIAL_DAYS -
          Math.floor(
            (Date.now() - new Date(userData.createdAt).getTime()) / 86_400_000
          )
      )
    : TRIAL_DAYS;
  const isLimitReached = !userData?.isPro && trialDaysLeft <= 0;

  const refreshData = useCallback(async () => {
    const data = await getUserDashboardData();
    if (data) setUserData(data);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleCheckout = async (plan: "SOLO" | "DUO") => {
    setIsStripeLoading(plan);
    try {
      const { url } = await createCheckoutSession(plan);
      if (url) window.location.href = url;
    } catch (err: any) {
      alert(err?.message || "Erreur lors du paiement. Réessayez.");
    } finally {
      setIsStripeLoading(null);
    }
  };

  const incrementLimit = async () => {
    const newCount = await incrementClientCountInDB();
    setUserData((prev) => (prev ? { ...prev, clientCount: newCount } : null));
  };

  const hasDossier = Object.values(dossier).some((v) => v !== "" && v !== 0 && v !== undefined);

  // Données minimales pour Visale : CNI (dateNaissance) + bulletin (salaireNetMensuel)
  const hasVisaleData = Boolean(dossier.dateNaissance && dossier.salaireNetMensuel);

  // Recalcule l'éligibilité Visale chaque fois que loyer, ville ou dossier changent
  useEffect(() => {
    const loyer = parseFloat(loyerMensuel);
    if (!hasVisaleData || !loyerMensuel || isNaN(loyer) || loyer <= 0) {
      setVisaleResult(null);
      return;
    }
    const result = calculerEligibiliteVisale(dossier, loyer, villeEstParis);
    setVisaleResult(result);
  }, [dossier, loyerMensuel, villeEstParis, hasVisaleData]);

  const handleFile = useCallback(
    async (file: File, type: DropType) => {
      if (isLimitReached) {
        alert("Période d'essai terminée. Passez à la version PRO pour continuer.");
        return;
      }
      setDocStates((prev) => ({
        ...prev,
        [type]: { loading: true, progress: 0, fileName: file.name },
      }));
      try {
        const text = await processDocument(file, (progress) => {
          setDocStates((prev) => ({
            ...prev,
            [type]: { ...prev[type], progress },
          }));
        });
        setRawText((prev) => ({ ...prev, [type]: text }));
        const docType: DocumentType =
          type === "cni"
            ? "cni"
            : type === "bulletin"
            ? "bulletin_paie"
            : type === "avis_impo"
            ? "avis_imposition"
            : type === "rib"
            ? "rib"
            : "domicile";
        const parsed = parseDossier(text, docType);
        setDossier((prev) => ({ ...prev, ...parsed }));
      } catch (err) {
        console.error(err);
        alert("Erreur lors de l'analyse du document.");
      } finally {
        setDocStates((prev) => ({
          ...prev,
          [type]: { ...prev[type], loading: false, progress: 100 },
        }));
      }
    },
    [isLimitReached]
  );

  const copyData = async () => {
    if (isLimitReached) return;
    try {
      const payload = await generateAutofillPayload({
        mutuelle: dossier as any,
        ordonnance: {} as any,
        syncToken: userData?.syncToken ?? undefined,
      });
      await navigator.clipboard.writeText(payload);
      setIsDataCopied(true);
      await incrementLimit();
      setTimeout(() => setIsDataCopied(false), 3000);
    } catch (err) {
      console.error("Erreur lors de la copie :", err);
    }
  };

  const dropZones: { type: DropType; label: string; icon: string }[] = [
    { type: "cni", label: "CNI (recto/verso)", icon: "🪪" },
    { type: "bulletin", label: "Bulletin de paie", icon: "💼" },
    { type: "avis_impo", label: "Avis d'imposition", icon: "📄" },
    { type: "rib", label: "RIB", icon: "🏦" },
    { type: "domicile", label: "Justificatif domicile", icon: "🏠" },
  ];

  return (
    <main className="bg-slate-50 text-slate-900 pb-10">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 items-stretch">
          <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow">
                <Building2 className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-black">BailBot</h1>
            </div>
            <p className="text-slate-500 font-medium">
              Déposez les documents du locataire et récupérez le dossier complet en 5 minutes.
            </p>
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                  {userData?.isPro ? "Votre Plan" : "Essai Gratuit"}
                </p>
                {!userData?.isPro && (
                  <p className={`text-2xl font-black ${isLimitReached ? "text-red-500" : "text-slate-900"}`}>
                    {isLimitReached
                      ? "Expiré"
                      : `${trialDaysLeft}j restant${trialDaysLeft > 1 ? "s" : ""}`}
                  </p>
                )}
              </div>
              {userData?.isPro && (
                <span className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-full uppercase tracking-tighter mb-1">
                  {userData.plan === "DUO" ? "AGENCE" : "SOLO"}
                </span>
              )}
            </div>
            {!userData?.isPro && (
              <>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${isLimitReached ? "bg-red-500" : "bg-emerald-600"}`}
                    style={{ width: `${((TRIAL_DAYS - trialDaysLeft) / TRIAL_DAYS) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Passer au PRO
                  </p>
                  <button
                    onClick={() => handleCheckout("SOLO")}
                    disabled={isStripeLoading !== null}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-600 text-white text-[11px] font-black hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {isStripeLoading === "SOLO" ? "Chargement..." : "Solo — 59€/mois"}
                  </button>
                  <button
                    onClick={() => handleCheckout("DUO")}
                    disabled={isStripeLoading !== null}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-black hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    {isStripeLoading === "DUO" ? "Chargement..." : "Agence — 49€/user/mois"}
                  </button>
                </div>
              </>
            )}
            {userData?.isPro && (
              <div className="mt-4 pt-4 border-t border-slate-50 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight">
                    Utilisation illimitée activée
                  </p>
                  <button
                    onClick={async () => {
                      const { url } = await createPortalSession();
                      if (url) window.location.href = url;
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    Factures
                  </button>
                </div>
                {userData.plan === "SOLO" && (
                  <button
                    onClick={async () => {
                      setIsStripeLoading("DUO");
                      try {
                        await upgradePlan("DUO");
                        await refreshData();
                      } catch (err: any) {
                        alert(err?.message || "Erreur lors de la montée en gamme.");
                      } finally {
                        setIsStripeLoading(null);
                      }
                    }}
                    disabled={isStripeLoading !== null}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-black hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    {isStripeLoading === "DUO" ? "Chargement..." : "Passer Agence — 49€/user/mois"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* ─── DossierFacile Connect ─────────────────────────────────── */}
            {/* Section visible uniquement si NEXT_PUBLIC_DOSSIERFACILE_ENABLED=true */}
            {(dossierFacileEnabled || process.env.NODE_ENV === "development") && (
              <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Import DossierFacile</p>
                    <p className="text-xs text-slate-500">
                      Pré-remplissez le dossier automatiquement depuis DossierFacile
                    </p>
                  </div>
                  <DossierFacileButton />
                </div>

                {/* Statut d'import */}
                {dfImportStatus === "loaded" && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    <span>✅</span>
                    <span>Dossier importé depuis DossierFacile — Vérifiez et validez les données</span>
                  </div>
                )}
                {dfImportStatus === "error" && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    <span>⚠️</span>
                    <span>Échec de l'import DossierFacile. Réessayez ou utilisez l'OCR ci-dessous.</span>
                  </div>
                )}
              </div>
            )}

            {/* Drop Zones — 2 colonnes */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {dropZones.map(({ type, label, icon }) => (
                <div key={type} className={isLimitReached ? "opacity-40 grayscale pointer-events-none" : ""}>
                  <DropZone
                    label={label}
                    icon={icon}
                    onFile={(f) => handleFile(f, type)}
                    isLoading={docStates[type].loading}
                    progress={docStates[type].progress}
                    fileName={docStates[type].fileName}
                  />
                </div>
              ))}
            </div>

            {hasDossier && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
                <span className="text-lg mt-0.5 shrink-0">⚠️</span>
                <p className="text-xs font-semibold leading-relaxed">
                  <span className="font-black">Vérifiez les données avant de les utiliser.</span>{" "}
                  La lecture automatique peut contenir des erreurs selon la qualité du document.
                  BailBot n&apos;est pas responsable en cas de saisie incorrecte.
                </p>
              </div>
            )}

            {hasDossier && (
              <DossierForm data={dossier} onChange={setDossier} />
            )}

            {/* Debug raw text */}
            {Object.keys(rawText).length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    const key = Object.keys(rawText)[0] as DropType;
                    setShowRaw(showRaw ? null : key);
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  {showRaw ? "✕ Masquer le texte brut" : "👁 Voir le texte brut extrait"}
                </button>
                {showRaw && rawText[showRaw] && (
                  <pre className="mt-2 p-4 bg-slate-100 rounded-xl text-[10px] font-mono text-slate-600 overflow-x-auto whitespace-pre-wrap border border-slate-200">
                    {rawText[showRaw]}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <BookmarkletInstallButton />

            {/* ─── Loyer mensuel + Éligibilité Visale ──────────────────── */}
            {(hasVisaleData || hasDossier) && (
              <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-sm">
                <p className="text-sm font-bold text-slate-800">Loyer mensuel</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500 shrink-0">Charges comprises :</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="number"
                        min={0}
                        placeholder="ex. 850"
                        value={loyerMensuel}
                        onChange={(e) => setLoyerMensuel(e.target.value)}
                        className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <span className="text-sm font-semibold text-slate-500">€</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500 shrink-0">Ville :</label>
                    <select
                      value={villeEstParis ? "paris" : "autre"}
                      onChange={(e) => setVilleEstParis(e.target.value === "paris")}
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                    >
                      <option value="autre">Autre (plafond 1 500 €)</option>
                      <option value="paris">Paris / IDF (plafond 1 800 €)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <EligibiliteVisaleCard
              result={loyerMensuel && parseFloat(loyerMensuel) > 0 ? visaleResult : null}
              hasData={hasVisaleData && Boolean(loyerMensuel) && parseFloat(loyerMensuel) > 0}
            />

            {hasDossier && (
              <div className="p-8 rounded-[32px] shadow-xl space-y-6 bg-emerald-600 shadow-emerald-200">
                <div className="text-left space-y-2">
                  <h2 className="text-xl font-bold text-white leading-tight">Dossier prêt !</h2>
                  <p className="text-emerald-100 text-[10px] font-medium leading-relaxed">
                    Copiez les données pour les utiliser avec l'extension Chrome (à venir) ou exportez vers Visale / GarantMe.
                  </p>
                </div>
                <div className="relative">
                  <button
                    onClick={copyData}
                    className={`w-full flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                      isDataCopied
                        ? "bg-green-500 border-green-400 text-white shadow-lg shadow-green-900/20 scale-105"
                        : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    }`}
                  >
                    {isDataCopied ? <ShieldCheck className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    <span className="font-bold">{isDataCopied ? "Copié !" : "Copier le dossier"}</span>
                  </button>
                  {isDataCopied && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-green-600 text-[10px] font-black py-2 px-4 rounded-full shadow-xl whitespace-nowrap animate-bounce">
                      ✓ PRÊT À COLLER
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
