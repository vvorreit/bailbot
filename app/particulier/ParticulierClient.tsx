"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle, ArrowRight, ChevronDown, ChevronUp,
  Building2, Home, FileText, Zap, Shield, Users
} from "lucide-react";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex justify-between items-center text-left hover:text-emerald-600 transition-colors group"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-bold text-slate-800 group-hover:text-emerald-600">{question}</span>
        {isOpen
          ? <ChevronUp className="w-5 h-5 text-slate-400" aria-hidden="true" />
          : <ChevronDown className="w-5 h-5 text-slate-400" aria-hidden="true" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 pb-6" : "max-h-0"}`}>
        <p className="text-slate-500 leading-relaxed font-medium">{answer}</p>
      </div>
    </div>
  );
}

export default function ParticulierClient() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">

      {/* Navigation */}
      <nav
        aria-label="Navigation principale BailBot Particulier"
        className="fixed w-full z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 text-slate-900"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Building2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold tracking-tight uppercase">BailBot</span>
            <span className="ml-2 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full">
              Particulier
            </span>
          </div>
          <div className="hidden lg:flex gap-10 text-[11px] font-black uppercase tracking-widest text-slate-400" role="list">
            <a href="#comment-ca-marche" className="hover:text-emerald-600 transition-colors" role="listitem">Comment ça marche</a>
            <a href="#avantages" className="hover:text-emerald-600 transition-colors" role="listitem">Avantages</a>
            <a href="#tarifs" className="hover:text-emerald-600 transition-colors" role="listitem">Tarifs</a>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              aria-label="Essayer BailBot gratuitement — 3 dossiers locataires inclus"
              className="px-6 py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95"
            >
              Essayer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-48 pb-32 px-6 overflow-hidden bg-gradient-to-b from-slate-50 to-white" aria-label="Présentation BailBot pour propriétaires bailleurs">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-50/80 via-transparent to-transparent -z-10" aria-hidden="true"></div>
          <div className="max-w-6xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
              <Home className="w-3 h-3" aria-hidden="true" />
              Pour les propriétaires bailleurs particuliers
            </div>
            <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[0.95] text-slate-900">
              Traitez les dossiers<br />de vos locataires en{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                5 minutes.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-6 leading-relaxed font-medium">
              Vous êtes propriétaire bailleur ? BailBot analyse les documents de vos candidats locataires, calcule leur solvabilité avec le BailScore™ et génère votre bail loi ALUR automatiquement. Sans abonnement imposé.
            </p>
            <p className="text-base text-emerald-700 font-black uppercase tracking-[0.2em] mb-12">
              Simple. Local. RGPD.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link
                href="/dashboard"
                aria-label="Essayer BailBot gratuitement — 3 dossiers locataires inclus sans carte bancaire"
                className="px-10 py-5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 flex items-center justify-center gap-3 text-lg group active:scale-95 uppercase tracking-widest"
              >
                Essayer gratuitement (3 dossiers)
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="py-14 bg-white border-y border-slate-100 px-6" aria-label="Chiffres clés">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { value: "2,5M", label: "Propriétaires bailleurs en France" },
              { value: "45 min → 5 min", label: "Par dossier locataire" },
              { value: "0", label: "Donnée stockée en ligne" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span className="text-3xl md:text-4xl font-black text-slate-900">{s.value}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Steps Section — Comment ça marche */}
        <section id="comment-ca-marche" className="py-24 bg-slate-50 px-6 border-y border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4">Comment ça marche</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">3 étapes, c'est tout.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  step: "01",
                  title: "Recevez les documents",
                  desc: "Le candidat locataire vous envoie ses pièces par email : CNI, bulletins de paie, avis d'imposition, RIB.",
                  icon: FileText,
                },
                {
                  step: "02",
                  title: "Déposez tout dans BailBot",
                  desc: "Drag & drop sur BailBot — il trie automatiquement chaque document et extrait toutes les informations pour le dossier locataire.",
                  icon: Zap,
                },
                {
                  step: "03",
                  title: "Obtenez le BailScore et le bail",
                  desc: "Solvabilité calculée, éligibilité Visale vérifiée, bail PDF loi ALUR généré en 1 clic. Prêt à signer.",
                  icon: CheckCircle,
                },
              ].map((s, idx) => (
                <div key={idx} className="relative group">
                  <div className="text-8xl font-black text-slate-100 absolute -top-10 -left-4 group-hover:text-emerald-50 transition-colors" aria-hidden="true">
                    {s.step}
                  </div>
                  <div className="relative z-10 bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 group-hover:shadow-xl group-hover:-translate-y-2 transition-all">
                    <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-100">
                      <s.icon className="w-7 h-7" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-black mb-4">{s.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Avantages Section */}
        <section id="avantages" className="py-32 bg-white px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4">Ce que BailBot fait pour vous</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                Tout ce dont vous avez besoin.
              </h2>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 list-none">
              {[
                "Analyse automatique CNI, bulletins de paie, avis d'imposition, RIB",
                "Score de solvabilité BailScore™ 0-100 — sélection locataire fiable",
                "Vérification éligibilité Visale (garantie gratuite Action Logement)",
                "Génération contrat de location loi ALUR conforme",
                "Détection documents frauduleux et incohérences",
                "Quittances de loyer PDF mensuelles en 1 clic",
                "Relance premier impayé incluse — modèle conforme",
                "100% local — aucune donnée ne quitte votre ordinateur",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all">
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-slate-700 font-bold">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="tarifs" className="py-24 bg-slate-50 px-6 border-y border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4">Tarifs</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                Choisissez votre formule.
              </h2>
              <p className="text-slate-500 font-medium mt-4">Commencez gratuitement — 3 dossiers inclus sans carte bancaire.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
              {/* Plan Occasion */}
              <div className="p-10 rounded-[40px] border border-slate-200 bg-white flex flex-col group hover:shadow-2xl transition-all duration-500">
                <h3 className="text-2xl font-black mb-2 uppercase tracking-tight text-slate-900">Occasion</h3>
                <p className="text-slate-500 text-sm mb-8 font-medium italic">Parfait pour un locataire ponctuel.</p>
                <div className="mb-8">
                  <div className="text-5xl font-black text-slate-900">
                    4,90€
                  </div>
                  <div className="text-sm text-slate-400 font-bold mt-1">par dossier</div>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  {[
                    "1 dossier complet",
                    "Toutes les fonctionnalités",
                    "Export ZIP",
                    "Bail PDF loi ALUR",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  aria-label="Commencer avec le plan Occasion à 4,90€ par dossier"
                  className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all text-center uppercase tracking-widest text-xs"
                >
                  Commencer
                </Link>
              </div>

              {/* Plan Particulier — Recommandé */}
              <div className="p-12 rounded-[50px] border-4 border-emerald-600 bg-white shadow-[0_50px_80px_-20px_rgba(16,185,129,0.2)] flex flex-col relative scale-105 z-10">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-full shadow-xl">
                  Recommandé
                </div>
                <h3 className="text-3xl font-black mb-2 uppercase tracking-tight text-slate-900">Particulier</h3>
                <p className="text-slate-500 text-sm mb-8 font-medium italic">Pour les propriétaires réguliers.</p>
                <div className="mb-8">
                  <div className="text-5xl font-black text-slate-900">
                    9,90€
                    <span className="text-lg text-slate-400 font-bold">/mois</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  {[
                    "Dossiers illimités",
                    "Toutes les fonctionnalités",
                    "Quittances PDF",
                    "Bail PDF loi ALUR",
                    "Support email",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm font-black text-slate-800">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  aria-label="Démarrer un essai gratuit du plan Particulier à 9,90€/mois"
                  className="w-full py-5 bg-emerald-600 text-white font-black rounded-[24px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                >
                  Essai gratuit
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-32 bg-white px-6" aria-labelledby="faq-heading">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 id="faq-heading" className="text-4xl font-black mb-4 tracking-tight">Questions Fréquentes</h2>
              <p className="text-slate-500 font-medium italic">Tout ce que vous voulez savoir.</p>
            </div>
            <div className="bg-slate-50 rounded-[40px] p-8 md:p-12 border border-slate-100 text-slate-900">
              <FAQItem
                question="C'est quoi la différence avec DossierFacile ?"
                answer="DossierFacile est un outil pour les locataires — il leur permet de constituer leur dossier. BailBot est pour VOUS, le propriétaire bailleur — il analyse les dossiers que vous recevez et génère votre bail automatiquement selon la loi ALUR."
              />
              <FAQItem
                question="Mes données sont-elles sécurisées ?"
                answer="L'analyse se fait entièrement dans votre navigateur. Aucun document ne transite par nos serveurs. Vos données et celles de vos locataires restent 100% sur votre ordinateur."
              />
              <FAQItem
                question="Est-ce que ça marche avec Visale ?"
                answer="Oui. BailBot vérifie automatiquement si votre locataire est éligible à Visale (garantie gratuite d'Action Logement). Vous obtenez la réponse directement dans le dossier locataire."
              />
              <FAQItem
                question="Le bail généré est-il légalement valable ?"
                answer="Le bail suit le modèle légal loi ALUR. Il doit être signé par les deux parties pour être valable. Nous recommandons une relecture par un professionnel juridique en cas de doute."
              />
              <FAQItem
                question="Puis-je changer de formule plus tard ?"
                answer="Oui, à tout moment depuis votre compte. Vos dossiers existants sont conservés et vous bénéficiez immédiatement des fonctionnalités de votre nouvelle formule."
              />
            </div>
          </div>
        </section>

        {/* Legal links */}
        <section className="py-16 bg-slate-50 border-t border-slate-100 px-6" aria-label="Liens utiles">
          <div className="max-w-4xl mx-auto text-center">
            <nav aria-label="Liens légaux et accueil" className="flex flex-wrap gap-6 justify-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <Link href="/" className="hover:text-slate-600 transition-colors">Accueil</Link>
              <Link href="/legal/cgu" className="hover:text-slate-600 transition-colors">CGU</Link>
              <Link href="/legal/confidentialite" className="hover:text-slate-600 transition-colors">Confidentialité</Link>
              <Link href="/legal/mentions-legales" className="hover:text-slate-600 transition-colors">Mentions légales</Link>
            </nav>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-20 px-6" role="contentinfo">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-10 shadow-2xl shadow-emerald-500/50">
            <Building2 className="w-8 h-8" aria-hidden="true" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-8 tracking-tight">
            Simple. Local. RGPD.
          </h2>
          <Link
            href="/dashboard"
            aria-label="Essayer BailBot gratuitement — analyse de dossiers locataires"
            className="px-12 py-6 bg-white text-slate-900 font-black rounded-[32px] hover:bg-emerald-50 transition-all text-xl shadow-2xl active:scale-95 inline-block uppercase tracking-widest"
          >
            Essayer BailBot Gratuitement
          </Link>
          <nav aria-label="Liens utiles BailBot Particulier" className="mt-16 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <Link href="/legal/confidentialite" className="hover:text-white transition-colors">
                Confidentialité
              </Link>
              <Link href="/legal/cgu" className="hover:text-white transition-colors">
                Conditions
              </Link>
              <Link href="/legal/mentions-legales" className="hover:text-white transition-colors">
                Mentions
              </Link>
            </div>
            <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              © 2026 BailBot — Pour les propriétaires bailleurs
            </div>
          </nav>
        </div>
      </footer>
    </div>
  );
}
