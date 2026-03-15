"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle, ArrowRight, ChevronDown, ChevronUp,
  Building2, FileText, TrendingUp, LayoutDashboard, Star, Scale, Phone
} from "lucide-react";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex justify-between items-center text-left hover:text-violet-600 transition-colors group"
      >
        <span className="text-lg font-bold text-slate-800 group-hover:text-violet-600">{question}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 pb-6" : "max-h-0"}`}>
        <p className="text-slate-500 leading-relaxed font-medium">{answer}</p>
      </div>
    </div>
  );
}

export default function ProPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-violet-100 selection:text-violet-900">

      {/* Navigation */}
      <nav className="fixed w-full z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 text-slate-900">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight uppercase">BailBot</span>
            <span className="ml-2 px-2 py-0.5 bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-black uppercase tracking-widest rounded-full">
              Pro
            </span>
          </div>
          <div className="hidden lg:flex gap-10 text-[11px] font-black uppercase tracking-widest text-slate-400">
            <a href="#fonctionnalites" className="hover:text-violet-600 transition-colors">Fonctionnalités</a>
            <a href="#temoignage" className="hover:text-violet-600 transition-colors">Témoignage</a>
            <a href="#tarifs" className="hover:text-violet-600 transition-colors">Tarifs</a>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/contact?metier=GESTIONNAIRE"
              className="px-6 py-3 bg-violet-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-violet-700 transition-all shadow-xl shadow-violet-200 active:scale-95"
            >
              Demander une démo
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-50/80 via-transparent to-transparent -z-10"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
            <Scale className="w-3 h-3" />
            Pour les administrateurs de biens et syndics
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[0.95] text-slate-900">
            La plateforme de gestion locative<br />conçue pour les{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
              volumes professionnels.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-6 leading-relaxed font-medium">
            Administrateurs de biens et syndics : pilotez des centaines de lots, automatisez les flux et restez conformes — sans multiplier les outils.
          </p>
          <p className="text-base text-violet-700 font-black uppercase tracking-[0.2em] mb-12">
            Puissance pro. Conformité garantie.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link
              href="/contact?metier=GESTIONNAIRE"
              className="px-10 py-5 bg-violet-600 text-white font-black rounded-2xl hover:bg-violet-700 transition-all shadow-2xl shadow-violet-200 flex items-center justify-center gap-3 text-lg group active:scale-95 uppercase tracking-widest"
            >
              Demander une démo personnalisée
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <p className="mt-6 text-slate-400 text-sm font-medium">Réponse sous 24h. Pilote 30 jours inclus. Onboarding guidé.</p>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-14 bg-white border-y border-slate-100 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { value: "100+", label: "Lots gérés par portefeuille" },
            { value: "Auto", label: "Révision ILC/ILAT sans calcul manuel" },
            { value: "100%", label: "Conforme réglementation en vigueur" },
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
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-600 mb-4">Conçu pour la complexité professionnelle</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">3 piliers. Une plateforme.</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                icon: FileText,
                title: "Bail pro + clauses spéciales",
                desc: "Générez des baux commerciaux et baux professionnels conformes, avec clauses d'indexation, résiliation anticipée et cession automatiquement intégrées. Réduit la dépendance aux juristes pour les cas standards.",
              },
              {
                step: "02",
                icon: TrendingUp,
                title: "Révision ILC/ILAT automatique",
                desc: "BailBot calcule automatiquement les révisions de loyers commerciaux selon les indices ILC et ILAT publiés par l'INSEE. Alertes à l'échéance, lettres de révision prêtes à l'envoi, archivage automatique.",
              },
              {
                step: "03",
                icon: LayoutDashboard,
                title: "Dashboard multi-portefeuilles",
                desc: "Vue consolidée de tous vos mandants et leurs lots. Taux d'occupation par portefeuille, alertes impayés, indicateurs financiers — en un coup d'œil. Exportable en PDF pour vos reportings mandants.",
              },
            ].map((s, idx) => (
              <div key={idx} className="relative group">
                <div className="text-8xl font-black text-slate-100 absolute -top-10 -left-4 group-hover:text-violet-50 transition-colors">
                  {s.step}
                </div>
                <div className="relative z-10 bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 group-hover:shadow-xl group-hover:-translate-y-2 transition-all">
                  <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-violet-100">
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
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-600 mb-4">Fonctionnalités avancées</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              Le back-office de vos mandats.
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              "Baux commerciaux et professionnels (bail pro 3/6/9)",
              "Clauses spéciales : destination, sous-location, travaux",
              "Révision automatique ILC et ILAT (indice INSEE)",
              "Alertes d'échéance de révision et de renouvellement",
              "Dashboard multi-mandants et multi-portefeuilles",
              "Reporting PDF mensuel par mandant en 1 clic",
              "BailScore™ Pro — analyse solvabilité et fraude",
              "Relances graduées et mise en demeure PDF",
              "Gestion TVA sur loyer (baux commerciaux)",
              "Multi-utilisateurs avec rôles et permissions",
              "Onboarding dédié + Customer Success Manager",
              "API & webhooks pour intégration avec votre SI",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50 transition-all">
                <CheckCircle className="w-6 h-6 text-violet-600 shrink-0 mt-0.5" />
                <p className="text-slate-700 font-bold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignage */}
      <section id="temoignage" className="py-24 bg-violet-600 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            {[1,2,3,4,5].map((i) => (
              <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <blockquote className="text-2xl md:text-3xl font-black text-white leading-snug mb-10">
            "Nous gérons 340 lots pour 28 mandants. BailBot a supprimé 80% des tâches manuelles de révision et de relance. Le reporting mensuel mandant qui prenait une demi-journée se génère maintenant en 3 minutes."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white font-black text-lg">
              AT
            </div>
            <div className="text-left">
              <p className="text-white font-black">Arnaud T.</p>
              <p className="text-violet-200 text-sm font-medium">Administrateur de biens — Cabinet Tessier & Associés, Paris 8e</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="tarifs" className="py-24 bg-slate-50 px-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-600 mb-4">Tarifs</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              Choisissez votre formule professionnelle.
            </h3>
            <p className="text-slate-500 font-medium mt-4">Pilote 30 jours inclus sur les deux formules.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch">
            {/* Plan Pro 100 — Recommandé */}
            <div className="p-12 rounded-[50px] border-4 border-violet-600 bg-white shadow-[0_50px_80px_-20px_rgba(139,92,246,0.2)] flex flex-col relative scale-105 z-10">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-full shadow-xl">
                Recommandé
              </div>
              <h3 className="text-3xl font-black mb-2 uppercase tracking-tight text-slate-900">Pro 100</h3>
              <p className="text-slate-500 text-sm mb-8 font-medium italic">Pour les cabinets jusqu'à 100 lots.</p>
              <div className="mb-8">
                <div className="text-5xl font-black text-slate-900">
                  149€
                  <span className="text-lg text-slate-400 font-bold">/mois</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  "Jusqu'à 100 lots",
                  "10 utilisateurs",
                  "Bail pro + clauses spéciales",
                  "Révision ILC/ILAT automatique",
                  "Dashboard multi-portefeuilles",
                  "BailScore™ Pro + détection fraude",
                  "Reporting PDF mandants",
                  "Onboarding dédié inclus",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm font-black text-slate-800">
                    <CheckCircle className="w-5 h-5 text-violet-600 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact?metier=GESTIONNAIRE"
                className="w-full py-5 bg-violet-600 text-white font-black rounded-[24px] hover:bg-violet-700 transition-all shadow-xl shadow-violet-200 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
              >
                Demander une démo
              </Link>
            </div>

            {/* Plan Entreprise */}
            <div className="p-10 rounded-[40px] border border-slate-200 bg-white flex flex-col group hover:shadow-2xl transition-all duration-500">
              <h3 className="text-2xl font-black mb-2 uppercase tracking-tight text-slate-900">
                Entreprise
              </h3>
              <p className="text-slate-500 text-sm mb-8 font-medium italic">Pour les grands cabinets et syndics.</p>
              <div className="mb-8">
                <div className="text-4xl font-black text-slate-900">
                  Sur devis
                </div>
                <div className="text-sm text-slate-400 font-bold mt-1">selon volume et configuration</div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  "Lots illimités",
                  "Utilisateurs illimités",
                  "CSM dédié",
                  "SLA garanti",
                  "White-label disponible",
                  "API & webhooks",
                  "Intégration SI personnalisée",
                  "Formation équipe incluse",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <CheckCircle className="w-5 h-5 text-violet-600 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact?metier=GESTIONNAIRE"
                className="w-full py-4 bg-slate-100 text-slate-700 font-black rounded-2xl hover:bg-slate-200 transition-all text-center uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Contacter notre équipe
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
            <p className="text-slate-500 font-medium italic">Réponses aux questions des professionnels.</p>
          </div>
          <div className="bg-slate-50 rounded-[40px] p-8 md:p-12 border border-slate-100 text-slate-900">
            <FAQItem
              question="BailBot gère-t-il les baux commerciaux 3/6/9 ?"
              answer="Oui. BailBot prend en charge les baux commerciaux (code de commerce), baux professionnels, baux dérogatoires et baux d'habitation. Les clauses spécifiques (destination, cession, sous-location, franchise de loyer) sont disponibles dans l'éditeur."
            />
            <FAQItem
              question="Comment fonctionne le calcul de révision ILC/ILAT ?"
              answer="BailBot récupère automatiquement les indices ILC et ILAT publiés par l'INSEE. À chaque échéance de révision, il calcule le nouveau loyer, génère la lettre de révision prête à signer et archive le calcul. Zéro calcul manuel, zéro risque d'erreur."
            />
            <FAQItem
              question="Peut-on gérer plusieurs mandants avec des portefeuilles séparés ?"
              answer="C'est exactement le cœur du plan Pro 100 et Entreprise. Chaque mandant a son propre espace, ses propres lots et son propre reporting. Vous voyez tout depuis le dashboard consolidé, mais chaque mandant n'a accès qu'à ses données."
            />
            <FAQItem
              question="BailBot est-il conforme RGPD pour une utilisation professionnelle ?"
              answer="Oui. BailBot est hébergé en France, sur des serveurs certifiés HDS. Les données des locataires sont chiffrées au repos et en transit. Un DPA (Data Processing Agreement) est signable avec Anthropic pour les clients Pro et Entreprise."
            />
            <FAQItem
              question="Quel accompagnement est prévu lors du déploiement ?"
              answer="Tous les plans Pro 100 incluent un onboarding guidé par notre équipe : import de vos lots existants, configuration des templates, formation de vos collaborateurs. Le plan Entreprise inclut un CSM dédié et un SLA de disponibilité garanti."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-violet-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-10 shadow-2xl shadow-violet-500/50">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-8 tracking-tight">
            Puissance pro.<br />Conformité garantie.
          </h2>
          <Link
            href="/contact?metier=GESTIONNAIRE"
            className="px-12 py-6 bg-violet-600 text-white font-black rounded-[32px] hover:bg-violet-700 transition-all text-xl shadow-2xl active:scale-95 inline-block uppercase tracking-widest"
          >
            Demander une démo personnalisée
          </Link>
          <div className="mt-16 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <Link href="/particulier" className="hover:text-white transition-colors">
                BailBot Particulier
              </Link>
              <Link href="/agence" className="hover:text-white transition-colors">
                BailBot Agence
              </Link>
              <Link href="/legal/confidentialite" className="hover:text-white transition-colors">
                Confidentialité
              </Link>
              <Link href="/legal/cgu" className="hover:text-white transition-colors">
                Conditions
              </Link>
            </div>
            <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              © 2026 BailBot — Pour les professionnels de l'immobilier
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
