"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Mail, MessageSquare, Phone, Building2, Send, ArrowLeft } from "lucide-react";
import { sendContactEmail } from "./actions";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    
    const formData = new FormData(e.currentTarget);
    const result = await sendContactEmail(formData);
    
    if (result.success) {
      setStatus("success");
    } else {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pt-24 pb-20 px-6 text-slate-900">
      <div className="max-w-4xl mx-auto">
        
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-bold mb-10 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <div className="bg-white rounded-[40px] shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-100">
          
          {/* Info Side */}
          <div className="bg-slate-900 p-12 text-white md:w-1/3">
            <Building2 className="w-12 h-12 text-blue-400 mb-8" />
            <h1 className="text-3xl font-black mb-6 leading-tight">Offre <br /><span className="text-blue-400">Franchise</span></h1>
            <p className="text-slate-400 text-sm mb-10 leading-relaxed font-medium">
              Vous gérez un réseau de plus de 10 magasins ? Profitez d'une gestion centralisée et de tarifs dégressifs.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-sm font-bold">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-blue-400">
                  <Mail className="w-5 h-5" />
                </div>
                contact@bailbot.fr
              </div>
              <div className="flex items-center gap-4 text-sm font-bold">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-blue-400">
                  <Phone className="w-5 h-5" />
                </div>
                01 84 60 00 00
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="p-12 md:w-2/3">
            {status === "success" ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black mb-2">Message envoyé !</h2>
                <p className="text-slate-500 font-medium">Un conseiller vous rappellera sous 24h.</p>
                <button onClick={() => setStatus("idle")} className="mt-8 text-blue-600 font-bold text-sm underline">Envoyer un autre message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Nom Complet</label>
                    <input required name="name" type="text" className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900" placeholder="Jean Dupont" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Enseigne / Réseau</label>
                    <input required name="company" type="text" className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900" placeholder="Ex: Krys, Afflelou..." />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Email Professionnel</label>
                  <input required name="email" type="email" className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900" placeholder="jean@reseau.com" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Nombre de magasins</label>
                  <select name="shops" className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none text-slate-900 font-medium">
                    <option>5 à 10 magasins</option>
                    <option>10 à 50 magasins</option>
                    <option>Plus de 50 magasins</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Votre Message</label>
                  <textarea required name="message" rows={4} className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900" placeholder="Décrivez votre besoin..." />
                </div>

                <button 
                  disabled={status === "sending"}
                  className={`w-full py-4 text-white font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50
                    ${status === "error" ? "bg-red-500" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"}`}
                >
                  {status === "sending" ? "Envoi en cours..." : status === "error" ? "Erreur d'envoi" : (
                    <>
                      Obtenir mon devis personnalisé
                      <Send className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
