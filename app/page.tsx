"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  CheckCircle, ArrowRight, ChevronDown, ChevronUp,
  Building2, ShieldCheck, Zap, FileText,
  Lock, Clock, AlertCircle, Users
} from "lucide-react";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex justify-between items-center text-left hover:text-emerald-600 transition-colors group"
      >
        <span className="text-lg font-bold text-slate-800 group-hover:text-emerald-600">{question}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 pb-6" : "max-h-0"}`}>
        <p className="text-slate-500 leading-relaxed font-medium">{answer}</p>
      </div>
    </div>
  );
}

function LandingContent() {
  const { data: session, status } = useSession();
  const [isAnnual, setIsAnnual] = useState(false);

  const price = (monthly: number) => {
    if (!isAnnual) return { label: `${monthly}€`, suffix: "/mois HT" };
    const perMonth = (monthly * 0.85).toFixed(0);
    const annual = (monthly * 12 * 0.85).toFixed(0);
    return { label: `${perMonth}€`, suffix: "/mois HT", annual: `soit ${annual}€/an HT` };
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-emerald-600 font-bold">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">

      {/* Navigation */}
      <nav className="fixed w-full z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 text-slate-900">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight uppercase">BailBot</span>
          </div>
          <div className="hidden lg:flex gap-10 text-[11px] font-black uppercase tracking-widest text-slate-400">
            <a href="#comment-ca-marche" className="hover:text-emerald-600 transition-colors">La Solution</a>
            <a href="#avantages" className="hover:text-emerald-600 transition-colors">Avantages</a>
            <a href="#tarifs" className="hover:text-emerald-600 transition-colors">Tarifs</a>
          </div>
          <div className="flex items-center gap-4">
            {status === "authenticated" ? (
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
              >
                Tableau de Bord
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                Essai Gratuit
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-50/60 via-transparent to-transparent -z-10"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
            <Building2 className="w-3 h-3" />
            L'assistant des propriétaires bailleurs
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[0.95] text-slate-900">
            Traitez un dossier<br />locataire en{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              5 minutes,
            </span>
            <br />pas en 2 heures.
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-6 leading-relaxed font-medium">
            Moins de paperasse, plus de baux signés.
          </p>
          <p className="text-base text-slate-400 max-w-2xl mx-auto mb-12 font-medium italic">
            "Je passais 45 minutes par dossier à recopier les infos dans 3 logiciels différents...
            <br className="hidden md:block" />
            Aujourd'hui BailBot le fait en 5 minutes."
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link
              href="/dashboard"
              className="px-10 py-5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 flex items-center justify-center gap-3 text-lg group active:scale-95 uppercase tracking-widest"
            >
              Démarrer l'essai gratuit
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-14 bg-white border-y border-slate-100 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "10 000+", label: "Propriétaires en France" },
            { value: "45 min", label: "→ 5 min par dossier" },
            { value: "0", label: "Donnée stockée" },
            { value: "5", label: "Types de documents" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-3xl md:text-4xl font-black text-slate-900">{s.value}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Steps Section */}
      <section id="comment-ca-marche" className="py-24 bg-slate-50 px-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4">La Solution</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Comment ça marche ?</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Déposez les PDF",
                desc: "Glissez les documents du locataire sur votre tableau de bord : CNI, bulletins de paie, avis d'imposition, RIB.",
                icon: FileText,
              },
              {
                step: "02",
                title: "L'OCR extrait tout",
                desc: "BailBot analyse chaque document localement et extrait automatiquement toutes les informations nécessaires.",
                icon: Zap,
              },
              {
                step: "03",
                title: "Formulaire rempli !",
                desc: "Vérifiez, corrigez si besoin, puis exportez vers Visale, GarantMe ou DossierFacile en un clic.",
                icon: CheckCircle,
              },
            ].map((s, idx) => (
              <div key={idx} className="relative group">
                <div className="text-8xl font-black text-slate-100 absolute -top-10 -left-4 group-hover:text-emerald-50 transition-colors">
                  {s.step}
                </div>
                <div className="relative z-10 bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 group-hover:shadow-xl group-hover:-translate-y-2 transition-all">
                  <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-100">
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

      {/* Documents supportés */}
      <section className="py-16 bg-white px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4">Documents traités</h2>
          <h3 className="text-3xl font-black tracking-tight text-slate-900 mb-12">
            Tout ce dont vous avez besoin pour un dossier complet.
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: "🪪", label: "CNI", desc: "Nom, prénom, DDN, adresse, numéro" },
              { icon: "💼", label: "Bulletins de paie", desc: "Employeur, salaire net, contrat" },
              { icon: "📄", label: "Avis d'imposition", desc: "Revenus N-1, N-2, parts fiscales" },
              { icon: "🏦", label: "RIB", desc: "IBAN, BIC, titulaire" },
              { icon: "🏠", label: "Justif. domicile", desc: "Adresse actuelle vérifiée" },
            ].map((doc, i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center hover:border-emerald-200 hover:bg-emerald-50 transition-all">
                <div className="text-3xl mb-3">{doc.icon}</div>
                <p className="font-black text-sm text-slate-800 mb-1">{doc.label}</p>
                <p className="text-xs text-slate-400 font-medium">{doc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section id="avantages" className="py-32 bg-slate-50 px-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4">Pourquoi BailBot ?</h2>
              <h3 className="text-4xl md:text-6xl font-black tracking-tight mb-8 leading-tight">
                La sécurité RGPD, la vitesse de l'IA.
              </h3>
              <div className="space-y-8">
                {[
                  {
                    title: "OCR 100% local — RGPD natif",
                    desc: "L'analyse se fait directement dans votre navigateur. Aucune donnée personnelle de vos locataires ne transite par nos serveurs.",
                    icon: Lock,
                  },
                  {
                    title: "Zéro erreur de saisie",
                    desc: "Fini les IBANs mal recopiés et les revenus erronés. BailBot lit et extrait, vous vérifiez et validez.",
                    icon: CheckCircle,
                  },
                  {
                    title: "Intégration Visale, GarantMe & DossierFacile",
                    desc: "Remplissage automatique des formulaires de garants. Compatible avec les principales plateformes du marché locatif.",
                    icon: Building2,
                  },
                  {
                    title: "Gain de temps mesurable",
                    desc: "De 45-90 minutes de saisie manuelle à 5 minutes par dossier. Traitez 10x plus de dossiers par jour.",
                    icon: Clock,
                  },
                ].map((a, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <a.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black mb-2">{a.title}</h4>
                      <p className="text-slate-500 font-medium text-sm leading-relaxed">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-[60px] p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 blur-[100px]"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-2xl font-black tracking-tight">Le comparatif</p>
                </div>
                <div className="space-y-12">
                  <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Saisie manuelle</p>
                    <div className="flex items-center gap-4">
                      <div className="h-4 bg-red-500 rounded-full w-full"></div>
                      <span className="font-black text-red-400 shrink-0">45 MIN</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Avec BailBot</p>
                    <div className="flex items-center gap-4">
                      <div className="h-4 bg-emerald-500 rounded-full w-12"></div>
                      <span className="font-black text-emerald-400 shrink-0">5 MIN</span>
                    </div>
                  </div>
                </div>
                <div className="mt-16 pt-10 border-t border-white/10">
                  <p className="text-xl font-bold italic text-slate-300">
                    "C'est comme avoir un assistant dédié uniquement à la paperasse des dossiers."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="tarifs" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4">Tarifs</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              Investissez dans votre temps.
            </h3>
            <p className="text-slate-500 font-medium mt-4">Sans engagement. Annulable en un clic.</p>
          </div>

          {/* Annual / Monthly toggle */}
          <div className="flex items-center justify-center gap-4 mb-14">
            <span className={`text-sm font-black uppercase tracking-widest ${!isAnnual ? "text-slate-900" : "text-slate-400"}`}>
              Mensuel
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${isAnnual ? "bg-emerald-600" : "bg-slate-200"}`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${isAnnual ? "translate-x-7" : ""}`}
              />
            </button>
            <span className={`text-sm font-black uppercase tracking-widest ${isAnnual ? "text-slate-900" : "text-slate-400"}`}>
              Annuel{" "}
              <span className="ml-2 inline-block px-2 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-700 rounded-full tracking-widest">
                -15%
              </span>
            </span>
          </div>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch">

            <div className="p-10 rounded-[40px] border border-slate-100 bg-white flex flex-col group hover:shadow-2xl transition-all duration-500">
              <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">
                Solo <span className="text-emerald-600">Bailleur</span>
              </h3>
              <p className="text-slate-500 text-sm mb-8 font-medium italic">Un propriétaire, un accès, illimité.</p>
              <div className="mb-8">
                <div className="text-5xl font-black whitespace-nowrap">
                  {price(29).label}
                  <span className="text-lg text-slate-400 font-bold">{price(29).suffix}</span>
                </div>
                {isAnnual && <div className="text-xs text-emerald-600 font-bold mt-1">{price(29).annual}</div>}
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle className="w-5 h-5 text-emerald-600" /> Dossiers illimités
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle className="w-5 h-5 text-emerald-600" /> OCR local RGPD
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle className="w-5 h-5 text-emerald-600" /> CNI, Bulletins, Avis impo, RIB
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle className="w-5 h-5 text-emerald-600" /> Bail ALUR + Quittances
                </li>
              </ul>
              <Link
                href="/dashboard"
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all text-center uppercase tracking-widest text-xs"
              >
                Commencer l'essai gratuit
              </Link>
            </div>

            <div className="p-12 rounded-[50px] border-4 border-emerald-600 bg-white shadow-[0_50px_80px_-20px_rgba(16,185,129,0.2)] flex flex-col relative scale-105 z-10">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-full shadow-xl">
                Recommandé
              </div>
              <h3 className="text-3xl font-black mb-2 uppercase tracking-tight">
                Bailleur <span className="text-emerald-600">Premium</span>
              </h3>
              <p className="text-slate-500 text-sm mb-8 font-medium italic">
                Gestion complète de vos biens locatifs.
              </p>
              <div className="mb-8">
                <div className="text-5xl font-black whitespace-nowrap">
                  {price(59).label}
                  <span className="text-lg text-slate-400 font-bold">{price(59).suffix}</span>
                </div>
                {isAnnual && <div className="text-xs text-emerald-600 font-bold mt-1">{price(59).annual}</div>}
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-sm font-black text-slate-800">
                  <CheckCircle className="w-5 h-5 text-emerald-600" /> Tout le plan Solo
                </li>
                <li className="flex items-center gap-3 text-sm font-black text-slate-800">
                  <CheckCircle className="w-5 h-5 text-emerald-600" /> Comptabilité fiscale
                </li>
                <li className="flex items-center gap-3 text-sm font-black text-slate-800">
                  <CheckCircle className="w-5 h-5 text-emerald-600" /> Révision IRL automatique
                </li>
                <li className="flex items-center gap-3 text-sm font-black text-slate-800">
                  <CheckCircle className="w-5 h-5 text-emerald-600" /> Support prioritaire
                </li>
              </ul>
              <Link
                href="/dashboard"
                className="w-full py-5 bg-emerald-600 text-white font-black rounded-[24px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
              >
                Essayer Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 bg-slate-50 px-6 border-y border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 tracking-tight">Questions Fréquentes</h2>
            <p className="text-slate-500 font-medium italic">On répond à tout.</p>
          </div>
          <div className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 text-slate-900">
            <FAQItem
              question="Mes données locataires sont-elles en sécurité ?"
              answer="Absolument. L'analyse OCR s'effectue directement dans votre navigateur, sans transiter par nos serveurs. Aucune donnée personnelle de vos locataires n'est stockée ou transmise à des tiers. BailBot est RGPD natif par conception."
            />
            <FAQItem
              question="Est-ce compatible avec Periimmo ou d'autres logiciels de gestion ?"
              answer="L'intégration directe avec les logiciels de gestion locative (Periimmo, ICS, etc.) est sur notre roadmap. Aujourd'hui, vous pouvez copier les données extraites et les coller dans votre outil. L'extension Chrome viendra automatiser cette étape."
            />
            <FAQItem
              question="Quels types de documents sont supportés ?"
              answer="BailBot traite 5 types de documents : la CNI (recto/verso), les 3 derniers bulletins de paie, l'avis d'imposition 2042 (CERFA), le RIB et les justificatifs de domicile (factures EDF, téléphone, loyer...)."
            />
            <FAQItem
              question="Peut-on tester avant de s'abonner ?"
              answer="Oui. Chaque inscrit bénéficie d'un essai gratuit de 7 jours sans carte bancaire, pour tester BailBot en conditions réelles sur vos vrais dossiers."
            />
            <FAQItem
              question="L'outil fonctionne-t-il avec des scans de mauvaise qualité ?"
              answer="BailBot utilise un moteur OCR robuste qui gère les photos prises au smartphone, les scans légèrement de travers ou les PDF issus de scanners bas de gamme. Pour des résultats optimaux, privilégiez des scans à 200 DPI ou plus."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-10 shadow-2xl shadow-emerald-500/50">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-12 tracking-tight">
            Moins de paperasse,
            <br />plus de baux signés.
          </h2>
          <Link
            href="/dashboard"
            className="px-12 py-6 bg-white text-slate-900 font-black rounded-[32px] hover:bg-emerald-50 transition-all text-2xl shadow-2xl active:scale-95 inline-block uppercase tracking-widest"
          >
            Essayer BailBot Gratuitement
          </Link>
          <div className="mt-20 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
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
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return <LandingContent />;
}
