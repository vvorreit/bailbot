"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle, ArrowRight, ChevronDown, ChevronUp,
  Building2, Shield, LayoutGrid, Bell, Users, Star, Briefcase
} from "lucide-react";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex justify-between items-center text-left hover:text-indigo-600 transition-colors group"
      >
        <span className="text-lg font-bold text-slate-800 group-hover:text-indigo-600">{question}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 pb-6" : "max-h-0"}`}>
        <p className="text-slate-500 leading-relaxed font-medium">{answer}</p>
      </div>
    </div>
  );
}

export default function AgenceLanding() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">

      {/* Navigation */}
      <nav className="fixed w-full z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 text-slate-900">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight uppercase">BailBot</span>
            <span className="ml-2 px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full">
              Agence
            </span>
          </div>
          <div className="hidden lg:flex gap-10 text-[11px] font-black uppercase tracking-widest text-slate-400">
            <a href="#fonctionnalites" className="hover:text-indigo-600 transition-colors">Fonctionnalités</a>
            <a href="#temoignage" className="hover:text-indigo-600 transition-colors">Témoignage</a>
            <a href="#tarifs" className="hover:text-indigo-600 transition-colors">Tarifs</a>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/signup?metier=AGENCE"
              className="px-6 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95"
            >
              Essai 14 jours gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-50/80 via-transparent to-transparent -z-10"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
            <Briefcase className="w-3 h-3" />
            Pour les agences immobilières et mandataires
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[0.95] text-slate-900">
            Gérez tous vos mandats.<br />Impressionnez vos propriétaires.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Signez plus vite.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-6 leading-relaxed font-medium">
            BailBot centralise la gestion locative de votre portefeuille et vous fait gagner du temps sur chaque dossier — de la candidature à la signature.
          </p>
          <p className="text-base text-indigo-700 font-black uppercase tracking-[0.2em] mb-12">
            L'outil que vos concurrents n'ont pas encore.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link
              href="/auth/signup?metier=AGENCE"
              className="px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 text-lg group active:scale-95 uppercase tracking-widest"
            >
              Démarrer un essai équipe 14 jours
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <p className="mt-6 text-slate-400 text-sm font-medium">Sans carte bancaire. Sans engagement. Annulation en 1 clic.</p>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-14 bg-white border-y border-slate-100 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { value: "3×", label: "Plus de mandats traités par agent" },
            { value: "< 5 min", label: "Pour qualifier un dossier complet" },
            { value: "0 fraude", label: "Non détectée avec BailScore Pro" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-3xl md:text-4xl font-black text-slate-900">{s.value}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Fonctionnalités Section */}
      <section id="fonctionnalites" className="py-24 bg-slate-50 px-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-4">Ce que BailBot fait pour votre agence</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">3 arguments. 0 compromis.</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                icon: Shield,
                title: "Détection fraude intégrée",
                desc: "BailBot analyse la cohérence de chaque document — bulletin de paie, avis d'imposition, RIB — et alerte en cas de falsification. Protégez vos propriétaires avant même la visite.",
              },
              {
                step: "02",
                icon: LayoutGrid,
                title: "Kanban candidats + DossierFacile",
                desc: "Gérez toutes vos candidatures en tableau visuel. Lien dépôt DossierFacile intégré — le locataire dépose, vous validez. Fini les emails perdus et les pièces manquantes.",
              },
              {
                step: "03",
                icon: Bell,
                title: "Relances auto + mise en demeure",
                desc: "Dès le premier impayé, BailBot déclenche la séquence de relance graduée. J+1, J+8, J+15 — et génère la mise en demeure PDF conforme en un clic. Zéro oubli.",
              },
            ].map((s, idx) => (
              <div key={idx} className="relative group">
                <div className="text-8xl font-black text-slate-100 absolute -top-10 -left-4 group-hover:text-indigo-50 transition-colors">
                  {s.step}
                </div>
                <div className="relative z-10 bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 group-hover:shadow-xl group-hover:-translate-y-2 transition-all">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-100">
                    <s.icon className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-black mb-4">{s.title}</h4>
                  <p className="text-slate-500 font-medium leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages complets */}
      <section className="py-32 bg-white px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-4">Tout ce dont votre agence a besoin</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              De l'analyse au bail signé.
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              "Analyse automatique CNI, bulletins de paie, avis d'imposition",
              "BailScore™ Pro — scoring avancé avec signaux fraude",
              "Kanban candidatures multi-biens en temps réel",
              "Lien dépôt DossierFacile personnalisé par bien",
              "Génération bail PDF conforme loi ALUR",
              "Relances loyers impayés automatiques et graduées",
              "Mise en demeure PDF générée en 1 clic",
              "Multi-utilisateurs — invitez toute votre équipe",
              "Statistiques portefeuille — taux d'occupation, délai moyen",
              "Export CSV des dossiers pour votre comptabilité",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all">
                <CheckCircle className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-slate-700 font-bold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignage */}
      <section id="temoignage" className="py-24 bg-indigo-600 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            {[1,2,3,4,5].map((i) => (
              <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <blockquote className="text-2xl md:text-3xl font-black text-white leading-snug mb-10">
            "Avant BailBot, on passait 3h à trier des dossiers pour chaque bien. Maintenant, en 20 minutes, le Kanban est à jour et les fraudes sont flaggées. On a signé 40% de mandats en plus ce trimestre."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white font-black text-lg">
              CD
            </div>
            <div className="text-left">
              <p className="text-white font-black">Camille D.</p>
              <p className="text-indigo-200 text-sm font-medium">Directrice — Agence Immo Atlantique, Nantes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="tarifs" className="py-24 bg-slate-50 px-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-4">Tarifs</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              Choisissez votre formule agence.
            </h3>
            <p className="text-slate-500 font-medium mt-4">14 jours d'essai inclus — sans carte bancaire.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch">
            {/* Plan Starter */}
            <div className="p-10 rounded-[40px] border border-slate-200 bg-white flex flex-col group hover:shadow-2xl transition-all duration-500">
              <h3 className="text-2xl font-black mb-2 uppercase tracking-tight text-slate-900">Starter</h3>
              <p className="text-slate-500 text-sm mb-8 font-medium italic">Pour les petites agences qui démarrent.</p>
              <div className="mb-8">
                <div className="text-5xl font-black text-slate-900">
                  49€
                  <span className="text-lg text-slate-400 font-bold">/mois</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  "3 utilisateurs",
                  "20 biens actifs",
                  "Détection fraude BailScore Pro",
                  "Kanban candidatures",
                  "Relances auto",
                  "Support email",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup?metier=AGENCE"
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-indigo-600 transition-all text-center uppercase tracking-widest text-xs"
              >
                Démarrer l'essai gratuit
              </Link>
            </div>

            {/* Plan Pro — Recommandé */}
            <div className="p-12 rounded-[50px] border-4 border-indigo-600 bg-white shadow-[0_50px_80px_-20px_rgba(99,102,241,0.2)] flex flex-col relative scale-105 z-10">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-full shadow-xl">
                Recommandé
              </div>
              <h3 className="text-3xl font-black mb-2 uppercase tracking-tight text-slate-900">Pro</h3>
              <p className="text-slate-500 text-sm mb-8 font-medium italic">Pour les agences ambitieuses.</p>
              <div className="mb-8">
                <div className="text-5xl font-black text-slate-900">
                  99€
                  <span className="text-lg text-slate-400 font-bold">/mois</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  "Utilisateurs illimités",
                  "Biens illimités",
                  "Détection fraude BailScore Pro",
                  "Kanban + DossierFacile",
                  "Relances + mise en demeure PDF",
                  "Stats avancées + export CSV",
                  "Garantie loyer impayé (GLI)",
                  "Support prioritaire",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm font-black text-slate-800">
                    <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup?metier=AGENCE"
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-[24px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
              >
                Essai 14 jours gratuit
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 bg-white px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 tracking-tight">Questions Fréquentes</h2>
            <p className="text-slate-500 font-medium italic">Tout ce que votre équipe veut savoir.</p>
          </div>
          <div className="bg-slate-50 rounded-[40px] p-8 md:p-12 border border-slate-100 text-slate-900">
            <FAQItem
              question="Combien d'agents peuvent utiliser BailBot simultanément ?"
              answer="En Starter, jusqu'à 3 utilisateurs en simultané. En Pro, aucune limite — toute votre agence, tous vos négociateurs. Chaque compte a ses propres accès et peut travailler sur ses propres biens ou partager le portefeuille."
            />
            <FAQItem
              question="Comment fonctionne la détection de fraude ?"
              answer="BailBot analyse la cohérence des documents entre eux : les revenus sur les bulletins correspondent-ils à l'avis d'imposition ? Le RIB correspond-il au nom sur la CNI ? Les polices et métadonnées PDF sont vérifiées. Toute anomalie est signalée avec un niveau d'alerte."
            />
            <FAQItem
              question="Peut-on personnaliser les emails de relance ?"
              answer="Oui. BailBot propose des templates prérédigés et conformes, mais vous pouvez les éditer, ajouter votre logo et personnaliser le ton. Les séquences (J+1, J+8, J+15) sont aussi configurables."
            />
            <FAQItem
              question="BailBot s'intègre-t-il avec notre logiciel de gestion actuel ?"
              answer="L'export CSV permet d'importer les dossiers dans la plupart des logiciels métier (Gestimmo, ICS, Crypto, Thetrawin). Une API est disponible sur le plan Pro pour les intégrations sur mesure."
            />
            <FAQItem
              question="Qu'est-ce que la GLI et comment ça fonctionne avec BailBot ?"
              answer="La Garantie Loyers Impayés est une assurance que votre agence peut proposer aux propriétaires. BailBot vérifie l'éligibilité du dossier et prépare toute la documentation nécessaire à la souscription GLI en un clic."
            />
          </div>
        </div>
      </section>

      {/* Interlinking */}
      <section className="py-10 bg-slate-50 border-t border-slate-100 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-slate-500 font-medium">
            Vous n'êtes pas une agence ?{" "}
            <Link href="/particulier" className="text-emerald-600 hover:underline font-bold">Propriétaire bailleur →</Link>
            {" "}|{" "}
            <Link href="/pro" className="text-violet-600 hover:underline font-bold">Gestionnaire pro (ADB) →</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-10 shadow-2xl shadow-indigo-500/50">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-8 tracking-tight">
            L'outil que vos concurrents<br />n'ont pas encore.
          </h2>
          <Link
            href="/auth/signup?metier=AGENCE"
            className="px-12 py-6 bg-indigo-600 text-white font-black rounded-[32px] hover:bg-indigo-700 transition-all text-xl shadow-2xl active:scale-95 inline-block uppercase tracking-widest"
          >
            Démarrer l'essai 14 jours
          </Link>
          <div className="mt-16 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <Link href="/particulier" className="hover:text-white transition-colors">
                BailBot Particulier
              </Link>
              <Link href="/pro" className="hover:text-white transition-colors">
                BailBot Pro (ADB)
              </Link>
              <Link href="/legal/confidentialite" className="hover:text-white transition-colors">
                Confidentialité
              </Link>
              <Link href="/legal/cgu" className="hover:text-white transition-colors">
                Conditions
              </Link>
            </div>
            <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              © 2026 BailBot — Pour les agences immobilières
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
