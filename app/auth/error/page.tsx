"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Suspense } from "react";

const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  OAuthAccountNotLinked: {
    title: "Compte deja existant",
    message:
      "Un compte existe deja avec cette adresse email mais via un autre moyen de connexion. Connectez-vous avec votre methode habituelle (email/mot de passe).",
  },
  OAuthSignin: {
    title: "Erreur de connexion Google",
    message:
      "Impossible de se connecter avec Google. Verifiez votre connexion et reessayez.",
  },
  OAuthCallback: {
    title: "Erreur de retour Google",
    message:
      "Une erreur est survenue lors du retour depuis Google. Reessayez.",
  },
  OAuthCreateAccount: {
    title: "Erreur de creation de compte",
    message:
      "Impossible de creer votre compte via Google. Reessayez ou inscrivez-vous avec email/mot de passe.",
  },
  Callback: {
    title: "Erreur d'authentification",
    message:
      "Une erreur est survenue pendant l'authentification. Reessayez.",
  },
  AccessDenied: {
    title: "Acces refuse",
    message: "Vous n'avez pas acces a cette ressource.",
  },
  Default: {
    title: "Erreur de connexion",
    message:
      "Une erreur inattendue est survenue. Reessayez ou contactez le support.",
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error") || "Default";
  const { title, message } =
    ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.Default;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-tr from-emerald-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-blue-200 group-hover:scale-105 transition-transform">
              O
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              BailBot
            </span>
          </Link>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-slate-900 mb-2">{title}</h1>
          <p className="text-slate-500 font-medium mb-8">{message}</p>

          {errorCode === "OAuthAccountNotLinked" && (
            <p className="text-sm text-slate-400 font-medium mb-6">
              Astuce : si vous souhaitez utiliser Google, connectez-vous
              d&apos;abord avec votre mot de passe, puis liez votre compte
              Google depuis les parametres.
            </p>
          )}

          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors active:scale-95"
          >
            Retour a la connexion
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-emerald-600 font-bold">
          Chargement...
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
