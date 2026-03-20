"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Shield, CheckSquare, Square } from "lucide-react";
import { acceptDpaOAuth } from "@/app/actions/auth";

export default function DpaRequiredPage() {
  const router = useRouter();
  const { update } = useSession();
  const [dpaAccepted, setDpaAccepted] = useState(false);
  const [cguAccepted, setCguAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = dpaAccepted && cguAccepted && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    const result = await acceptDpaOAuth("1.1");
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Refresh du token JWT pour effacer needsDpaAcceptance
    await update({ needsDpaAcceptance: false });
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-emerald-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-blue-200">
              O
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">BailBot</span>
          </Link>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h1 className="text-2xl font-black text-slate-900">Une dernière étape</h1>
              <p className="text-slate-500 font-medium text-sm">Acceptez nos conditions pour continuer</p>
            </div>
          </div>

          <p className="text-slate-600 text-sm font-medium mb-8 leading-relaxed">
            Avant d'accéder à votre espace, merci de lire et d'accepter nos conditions d'utilisation
            et notre politique de traitement des données.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Checkbox CGU */}
            <div
              className="flex items-start gap-3 cursor-pointer select-none"
              onClick={() => setCguAccepted((v) => !v)}
            >
              <div className="mt-0.5 shrink-0">
                {cguAccepted ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <p className="text-sm text-slate-500 font-medium leading-snug">
                J'accepte les{" "}
                <a
                  href="/legal/cgu"
                  target="_blank"
                  className="text-emerald-600 font-bold hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Conditions Générales d'Utilisation
                </a>
              </p>
            </div>

            {/* Checkbox DPA */}
            <div
              className="flex items-start gap-3 cursor-pointer select-none"
              onClick={() => setDpaAccepted((v) => !v)}
            >
              <div className="mt-0.5 shrink-0">
                {dpaAccepted ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <p className="text-sm text-slate-500 font-medium leading-snug">
                J'accepte la{" "}
                <a
                  href="/legal/dpa"
                  target="_blank"
                  className="text-emerald-600 font-bold hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Politique de traitement des données (DPA v1.1)
                </a>
              </p>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-4"
            >
              {loading ? "Enregistrement..." : "Accepter et accéder à mon espace"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
