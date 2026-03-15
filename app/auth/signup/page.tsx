"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import { registerUser } from "@/app/actions/auth";

const SIGNUP_METIER_KEY = "bailbot_signup_metier";

function SignUpForm() {
  const searchParams = useSearchParams();
  const metierParam = searchParams.get("metier");

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const result = await registerUser(form.name, form.email, form.password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (metierParam) {
      localStorage.setItem(SIGNUP_METIER_KEY, metierParam);
    }

    setRegistered(true);
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-10">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-tr from-emerald-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-blue-200">
                O
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">BailBot</span>
            </Link>
          </div>
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-3">Vérifiez votre email</h1>
            <p className="text-slate-500 font-medium mb-2">
              Un email de confirmation a été envoyé à
            </p>
            <p className="text-emerald-600 font-bold mb-6">{form.email}</p>
            <p className="text-slate-400 text-sm font-medium">
              Cliquez sur le lien dans l'email pour activer votre compte. Le lien expire dans 24h.
            </p>
          </div>
          <p className="text-center mt-6 text-sm font-medium text-slate-400">
            Déjà confirmé ?{" "}
            <Link href="/auth/signin" className="text-emerald-600 font-bold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-black text-slate-900 mb-2">Créer un compte</h1>
          <p className="text-slate-500 font-medium mb-8">Rejoignez BailBot en quelques secondes.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Nom</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jean Dupont"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

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
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="8 caractères minimum"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirmer le mot de passe</label>
              <input
                type="password"
                required
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                placeholder="Répétez le mot de passe"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Création en cours..." : "Créer mon compte"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-black text-slate-400">
              <span className="bg-white px-4">Ou</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (metierParam) localStorage.setItem(SIGNUP_METIER_KEY, metierParam);
              signIn("google", { callbackUrl: "/dashboard" });
            }}
            className="w-full flex items-center justify-center gap-4 py-4 px-6 bg-white border-2 border-slate-100 rounded-2xl text-slate-900 font-bold hover:bg-slate-50 hover:border-emerald-100 transition-all shadow-sm active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" loading="lazy" />
            Continuer avec Google
          </button>

          <p className="text-center mt-6 text-sm font-medium text-slate-500">
            Déjà un compte ?{" "}
            <Link href="/auth/signin" className="text-emerald-600 font-bold hover:underline">
              Se connecter
            </Link>
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

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center" />}>
      <SignUpForm />
    </Suspense>
  );
}
