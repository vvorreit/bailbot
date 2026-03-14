"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const justVerified = searchParams.get("verified") === "1";
  const invalidLink = searchParams.get("error") === "InvalidLink";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (res?.ok) {
      router.push(callbackUrl);
    } else if (res?.error === "EmailNotVerified") {
      setError("Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte mail.");
      setLoading(false);
    } else {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-tr from-emerald-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-blue-200 group-hover:scale-105 transition-transform">
              O
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">BailBot</span>
          </Link>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Content de vous revoir</h1>
          <p className="text-slate-500 font-medium mb-8">
            Connectez-vous pour accéder à votre tableau de bord.
          </p>

          {justVerified && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Email confirmé ! Vous pouvez vous connecter.
            </div>
          )}

          {invalidLink && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-700 text-sm font-semibold">
              Lien invalide ou expiré. Recréez un compte ou contactez le support.
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jean@exemple.fr"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Mot de passe</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Votre mot de passe"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="text-center mt-4 text-sm font-medium text-slate-500">
            Pas encore de compte ?{" "}
            <Link href="/auth/signup" className="text-emerald-600 font-bold hover:underline">
              Créer un compte
            </Link>
          </p>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-black text-slate-400">
              <span className="bg-white px-4">Ou</span>
            </div>
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full flex items-center justify-center gap-4 py-4 px-6 bg-white border-2 border-slate-100 rounded-2xl text-slate-900 font-bold hover:bg-slate-50 hover:border-emerald-100 transition-all shadow-sm active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Continuer avec Google
          </button>

          <p className="text-xs text-slate-400 font-bold leading-relaxed px-4 text-center mt-6">
            En vous connectant, vous acceptez nos{" "}
            <Link href="/legal/cgu" className="text-emerald-600 underline">CGU</Link>{" "}
            et notre{" "}
            <Link href="/legal/confidentialite" className="text-emerald-600 underline">politique de confidentialité</Link>.
          </p>
        </div>

        <p className="text-center mt-8">
          <Link href="/" className="text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2">
            Retour à l'accueil
            <ArrowRight className="w-4 h-4" />
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-emerald-600 font-bold">Chargement...</div>}>
      <SignInForm />
    </Suspense>
  );
}
