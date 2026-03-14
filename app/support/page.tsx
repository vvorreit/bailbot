"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle, Bug, Lightbulb, Sparkles } from "lucide-react";
import { sendSupportEmail } from "./actions";

type RequestType = "suggestion" | "incident" | "evolution";

const TYPES: { value: RequestType; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    value: "suggestion",
    label: "Suggestion",
    desc: "Une idée pour améliorer BailBot",
    icon: <Lightbulb className="w-5 h-5" />,
    color: "blue",
  },
  {
    value: "incident",
    label: "Incident / Bug",
    desc: "Quelque chose ne fonctionne pas",
    icon: <Bug className="w-5 h-5" />,
    color: "red",
  },
  {
    value: "evolution",
    label: "Demande d'évolution",
    desc: "Ajouter un ERP, une mutuelle...",
    icon: <Sparkles className="w-5 h-5" />,
    color: "violet",
  },
];

const COLOR_CLASSES: Record<string, { ring: string; bg: string; text: string; btn: string }> = {
  blue:   { ring: "ring-blue-500",   bg: "bg-blue-50",   text: "text-blue-600",   btn: "bg-blue-600 hover:bg-blue-700 shadow-blue-200" },
  red:    { ring: "ring-red-500",    bg: "bg-red-50",    text: "text-red-600",    btn: "bg-red-600 hover:bg-red-700 shadow-red-200" },
  violet: { ring: "ring-violet-500", bg: "bg-violet-50", text: "text-violet-600", btn: "bg-violet-600 hover:bg-violet-700 shadow-violet-200" },
};

export default function SupportPage() {
  const [type, setType] = useState<RequestType>("suggestion");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const current = TYPES.find((t) => t.value === type)!;
  const colors = COLOR_CLASSES[current.color];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);
    const result = await sendSupportEmail(formData);
    if (result.success) {
      setStatus("success");
    } else {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 px-4 pt-12">
      <div className="max-w-2xl mx-auto">

        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-bold mb-10 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Nous contacter</h1>
          <p className="text-slate-500 font-medium">Suggestions, incidents ou demandes d'évolution — on est à l'écoute.</p>
        </div>

        {status === "success" ? (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black mb-2">Message envoyé !</h2>
            <p className="text-slate-500 font-medium mb-8">Nous reviendrons vers vous rapidement.</p>
            <button
              onClick={() => setStatus("idle")}
              className="text-blue-600 font-bold text-sm underline"
            >
              Envoyer un autre message
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">

            {/* Sélecteur de type */}
            <div className="p-8 border-b border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Type de demande</p>
              <div className="grid grid-cols-3 gap-3">
                {TYPES.map((t) => {
                  const c = COLOR_CLASSES[t.color];
                  const selected = type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center
                        ${selected
                          ? `border-current ${c.ring} ring-2 ${c.bg} ${c.text}`
                          : "border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600"
                        }`}
                    >
                      {t.icon}
                      <span className="text-xs font-black leading-tight">{t.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className={`mt-3 text-xs font-semibold ${colors.text}`}>{current.desc}</p>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="p-8 space-y-5">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Nom</label>
                  <input
                    required
                    name="name"
                    type="text"
                    placeholder="Jean Dupont"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                  <input
                    required
                    name="email"
                    type="email"
                    placeholder="jean@exemple.fr"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Téléphone — uniquement pour les demandes d'évolution */}
              {type === "evolution" && (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Téléphone <span className="text-violet-500">*</span>
                  </label>
                  <input
                    required
                    name="phone"
                    type="tel"
                    placeholder="06 00 00 00 00"
                    className="w-full px-4 py-3 rounded-2xl border border-violet-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <p className="mt-1.5 text-xs text-violet-500 font-semibold">
                    Nous vous rappellerons pour comprendre votre besoin.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  {type === "evolution" ? "Logiciel de gestion locative" : "Objet"}
                </label>
                <input
                  name="subject"
                  type="text"
                  placeholder={
                    type === "evolution"
                      ? "Ex: Intégration Periimmo, DossierFacile..."
                      : type === "incident"
                      ? "Ex: Le bookmarklet ne fonctionne plus..."
                      : "Ex: Améliorer la vitesse de scan..."
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Message</label>
                <textarea
                  required
                  name="message"
                  rows={5}
                  placeholder={
                    type === "incident"
                      ? "Décrivez le problème rencontré, les étapes pour le reproduire..."
                      : type === "evolution"
                      ? "Décrivez l'ERP ou la mutuelle à intégrer, votre contexte..."
                      : "Partagez votre idée..."
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                disabled={status === "sending"}
                className={`w-full py-4 text-white font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 ${
                  status === "error" ? "bg-red-500" : colors.btn
                }`}
              >
                {status === "sending" ? "Envoi en cours..." : status === "error" ? "Erreur — réessayez" : (
                  <><Send className="w-5 h-5" /> Envoyer</>
                )}
              </button>

            </form>
          </div>
        )}
      </div>
    </div>
  );
}
