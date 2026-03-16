"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  CheckCircle, ArrowRight, ChevronDown, ChevronUp,
  Building2, ShieldCheck, FileText, Scale,
  Clock, Check, X, Star, PenLine, Receipt,
  TrendingUp, TrendingDown, Users, Lock, FileSearch, Euro, Lightbulb
} from "lucide-react";
import { createCheckoutSession } from "./dashboard/actions";

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

const features = [
  {
    icon: FileSearch,
    title: "Analyse OCR dossier",
    desc: "Vérifiez un dossier en 2 minutes, pas en 2 heures. BailScore automatique.",
  },
  {
    icon: ShieldCheck,
    title: "Baux ALUR conformes",
    desc: "Générez un bail conforme aux dernières lois en 3 clics. Mis à jour automatiquement.",
  },
  {
    icon: PenLine,
    title: "Signature eIDAS",
    desc: "Signez vos baux électroniquement avec valeur légale certifiée (Yousign).",
  },
  {
    icon: Receipt,
    title: "Quittances automatiques",
    desc: "Quittances générées et envoyées chaque mois par mail. Zéro action requise.",
  },
  {
    icon: TrendingUp,
    title: "Indexation IRL auto",
    desc: "Révision annuelle calculée et notifiée automatiquement. Plus d'argent perdu.",
  },
  {
    icon: Users,
    title: "Portail locataire",
    desc: "Votre locataire accède à ses documents 24h/24 sans vous appeler.",
  },
];

const testimonials = [
  {
    quote: "J'avais un bail depuis 3 ans avec une clause illégale sans le savoir. BailBot me l'a signalé dès l'import.",
    author: "Marie T.",
    detail: "propriétaire de 2 appartements à Lyon",
  },
  {
    quote: "La révision IRL, j'oubliais tous les ans. Maintenant BailBot m'envoie le mail à faire signer au locataire.",
    author: "Pierre D.",
    detail: "4 biens en région parisienne",
  },
  {
    quote: "Mon comptable m'a dit que l'export FEC était parfaitement conforme. Je lui envoie le fichier en 2 clics.",
    author: "Sophie M.",
    detail: "3 studios à Bordeaux",
  },
];

const comparisonRows = [
  { label: "Conformité ALUR automatique", bailbot: true, excel: false, rentila: false, bricks: false },
  { label: "Signature électronique légale", bailbot: true, excel: false, rentila: false, bricks: false },
  { label: "Analyse dossier OCR", bailbot: true, excel: false, rentila: false, bricks: false },
  { label: "Quittances automatiques", bailbot: true, excel: false, rentila: true, bricks: false },
  { label: "IRL automatique", bailbot: true, excel: false, rentila: false, bricks: false },
  { label: "Export FEC comptable", bailbot: true, excel: false, rentila: false, bricks: false },
];

const faqData = [
  {
    question: "Est-ce que BailBot remplace un notaire ou un avocat ?",
    answer: "Non. BailBot automatise la gestion locative courante (baux, quittances, indexation) en conformité avec la loi ALUR. Pour des situations complexes (litiges, contentieux, montages juridiques), nous vous recommandons de consulter un professionnel du droit. BailBot réduit le besoin d'y recourir pour les tâches quotidiennes.",
  },
  {
    question: "La signature électronique a-t-elle une valeur légale ?",
    answer: "Oui. BailBot utilise Yousign, un prestataire de services de confiance qualifié eIDAS. Les signatures électroniques générées ont la même valeur juridique qu'une signature manuscrite, conformément au règlement européen eIDAS et au Code civil français (article 1367).",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer: "Absolument. Toutes les données sont chiffrées en AES-256, hébergées en France, et nous sommes conformes au RGPD. L'analyse OCR des documents se fait localement dans votre navigateur — aucune donnée personnelle de vos locataires ne transite par nos serveurs.",
  },
  {
    question: "Que se passe-t-il à la fin de l'essai ?",
    answer: "À la fin des 14 jours d'essai gratuit, vous choisissez le plan qui vous convient. Si vous ne souscrivez pas, votre compte passe en lecture seule — vous ne perdez aucune donnée. Aucune carte bancaire n'est requise pour l'essai.",
  },
  {
    question: "BailBot fonctionne pour quel type de biens ?",
    answer: "BailBot gère les locations nues et meublées (résidence principale). Appartements, maisons, studios — tout type de bien résidentiel destiné à la location. Les baux commerciaux et professionnels ne sont pas encore supportés.",
  },
  {
    question: "Puis-je importer mes baux existants ?",
    answer: "Oui. Vous pouvez importer vos baux existants au format PDF. BailBot analysera le document et vous signalera les éventuelles clauses non conformes à la loi ALUR en vigueur, pour que vous puissiez les corriger lors du prochain renouvellement.",
  },
  {
    question: "L'export FEC est-il compatible avec mon comptable ?",
    answer: "Oui. L'export FEC (Fichier des Écritures Comptables) généré par BailBot est au format standard exigé par l'administration fiscale française. Votre comptable peut l'importer directement dans son logiciel de comptabilité.",
  },
  {
    question: "Les frais BailBot sont-ils déductibles fiscalement ?",
    answer: "Oui. En régime réel, les frais de gestion locative (dont BailBot) sont déductibles de vos revenus fonciers. BailBot est une charge déductible au même titre qu'une assurance ou des frais de gestion d'agence.",
  },
];

function ComparisonCell({ value }: { value: boolean }) {
  return value ? (
    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
      <Check className="w-4 h-4 text-emerald-600" />
    </div>
  ) : (
    <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
      <X className="w-4 h-4 text-slate-300" />
    </div>
  );
}

const dangerCards = [
  {
    icon: Scale,
    chiffre: "Bail annulable",
    description: "Un bail avec une clause illégale peut être annulé par le tribunal. 1 bailleur sur 3 est concerné.",
  },
  {
    icon: Clock,
    chiffre: "18 mois",
    description: "Durée moyenne d'une procédure d'expulsion. Un dossier locataire mal vérifié au départ peut coûter 18 mois de loyers perdus.",
  },
  {
    icon: Euro,
    chiffre: "1 mois de loyer",
    description: "Amende maximale pour un dépôt de garantie rendu hors délai ou avec déductions injustifiées.",
  },
  {
    icon: TrendingDown,
    chiffre: "∞ €/an perdus",
    description: "La révision IRL non appliquée chaque année, c'est de l'argent perdu définitivement. Elle ne se rattrape pas.",
  },
];

export default function LandingClient() {
  const { data: session, status } = useSession();
  const [isAnnual, setIsAnnual] = useState(true);
  const [isStripeLoading, setIsStripeLoading] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-emerald-600 font-bold">
        Chargement...
      </div>
    );
  }

  const dashHref = "/dashboard";

  const handleCheckout = async (plan: "ESSENTIEL" | "SERENITE") => {
    setIsStripeLoading(plan);
    try {
      const { url } = await createCheckoutSession(plan);
      if (url) window.location.href = url;
    } catch (err: any) {
      alert(err?.message || "Erreur lors du paiement. Réessayez.");
    } finally {
      setIsStripeLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">

      {/* ─── SECTION 1 — NAV ─── */}
      <nav className="fixed w-full z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 text-slate-900">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight uppercase">BailBot</span>
          </div>
          <div className="hidden lg:flex gap-10 text-[11px] font-black uppercase tracking-widest text-slate-400">
            <a href="#solution" className="hover:text-emerald-600 transition-colors">La Solution</a>
            <a href="#avantages" className="hover:text-emerald-600 transition-colors">Avantages</a>
            <a href="#tarifs" className="hover:text-emerald-600 transition-colors">Tarifs</a>
          </div>
          <div className="flex items-center gap-4">
            {status === "authenticated" ? (
              <Link
                href={dashHref}
                className="px-6 py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
              >
                Tableau de Bord
              </Link>
            ) : (
              <Link
                href={dashHref}
                className="px-6 py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95"
              >
                Essai 14j gratuit
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ─── SECTION 2 — HERO ─── */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-50/60 via-transparent to-transparent -z-10" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-7xl font-black tracking-tight mb-8 leading-[0.95] text-slate-900">
            Gérez vos locations en toute légalité.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              Sans avocat. Sans comptable.
            </span>{" "}
            Sans erreur.
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
            BailBot automatise vos baux ALUR, quittances, signatures et dossiers locataires — en 30 min/mois. Pour les propriétaires particuliers de 1 à 10 biens.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              href={dashHref}
              className="px-10 py-5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 flex items-center justify-center gap-3 text-lg group active:scale-95 uppercase tracking-widest"
            >
              Commencer mon essai gratuit de 14 jours
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-sm text-slate-400 font-medium">
              Sans carte bancaire · Annulable à tout moment
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-slate-500 font-semibold">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              Signature eIDAS certifiée
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Conforme ALUR 2024
            </span>
            <span className="flex items-center gap-2">
              <span className="text-base">🇫🇷</span>
              Données hébergées en France
            </span>
          </div>

          {/* Déduction fiscale argument */}
          <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-50 border border-amber-200 rounded-full text-sm font-bold text-amber-800">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            Déductible de vos revenus fonciers en régime réel
          </div>

          {/* Social stats */}
          <div className="flex flex-wrap justify-center gap-10 mt-10">
            {[
              { value: "1 200+", label: "bailleurs" },
              { value: "4.8/5", label: "⭐" },
              { value: "0", label: "litige traité" },
            ].map((s) => (
              <div key={s.label} className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{s.value}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 3 — PROBLÈME (Danger cards) ─── */}
      <section className="py-24 bg-slate-50 px-6 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Risques</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
              Ce que coûte vraiment la gestion sans BailBot
            </h3>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
              Chaque erreur de gestion locative a un prix. Voici les plus fréquentes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {dangerCards.map((card, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
                  <card.icon className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-3xl font-black text-slate-900 mb-3">{card.chiffre}</p>
                <p className="text-slate-500 font-medium leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm font-bold text-slate-700">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Conforme ALUR 2024 — mis à jour automatiquement
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Signature eIDAS — valeur légale certifiée
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Déductible de vos revenus fonciers
            </span>
          </div>

          <div className="text-center">
            <a
              href="#tarifs"
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all text-sm uppercase tracking-widest group"
            >
              Protégez-vous maintenant
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4 — SOLUTION (Features → Bénéfices) ─── */}
      <section id="solution" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4">La Solution</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              BailBot fait tout ce que vous devez faire — automatiquement.
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-8 rounded-[32px] border border-slate-100 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform">
                  <f.icon className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-black mb-3">{f.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Argument financier */}
          <div className="mt-16 bg-emerald-50 border border-emerald-100 rounded-[32px] p-10">
            <h4 className="text-2xl font-black text-slate-900 text-center mb-8">
              BailBot se rembourse tout seul
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                "Un impayé évité = 22 mois de BailBot remboursés",
                "Moins cher qu'une heure de consultation juridique",
                "Déductible à 100% en régime réel",
              ].map((stat) => (
                <div key={stat} className="flex items-start gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{stat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5 — SOCIAL PROOF ─── */}
      <section id="avantages" className="py-24 bg-slate-50 px-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4">Témoignages</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              Ce que disent les propriétaires qui ont choisi BailBot
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 flex flex-col">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 font-medium leading-relaxed mb-8 flex-grow italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-black text-slate-900">{t.author}</p>
                  <p className="text-sm text-slate-400 font-medium">{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-14 text-sm text-slate-400 font-semibold">
            <span>Paiement sécurisé Stripe</span>
            <span>·</span>
            <span>Données chiffrées AES-256</span>
            <span>·</span>
            <span>Hébergement France</span>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6 — DIFFÉRENCIATION ─── */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4">Comparatif</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              Pourquoi pas Excel ? Pourquoi pas Rentila ?
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="text-left py-4 pr-4 font-black text-slate-400 uppercase tracking-wider text-xs" />
                  <th className="py-4 px-4 font-black text-emerald-600 uppercase tracking-wider text-xs">BailBot</th>
                  <th className="py-4 px-4 font-black text-slate-400 uppercase tracking-wider text-xs">Excel / Papier</th>
                  <th className="py-4 px-4 font-black text-slate-400 uppercase tracking-wider text-xs">Rentila</th>
                  <th className="py-4 px-4 font-black text-slate-400 uppercase tracking-wider text-xs">Bricks</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="border-b border-slate-50">
                    <td className="py-4 pr-4 font-bold text-slate-700">{row.label}</td>
                    <td className="py-4 px-4"><ComparisonCell value={row.bailbot} /></td>
                    <td className="py-4 px-4"><ComparisonCell value={row.excel} /></td>
                    <td className="py-4 px-4"><ComparisonCell value={row.rentila} /></td>
                    <td className="py-4 px-4"><ComparisonCell value={row.bricks} /></td>
                  </tr>
                ))}
                <tr className="border-b border-slate-50">
                  <td className="py-4 pr-4 font-bold text-slate-700">Prix</td>
                  <td className="py-4 px-4 text-center font-black text-emerald-600">dès 0€/mois</td>
                  <td className="py-4 px-4 text-center font-bold text-slate-400">0€</td>
                  <td className="py-4 px-4 text-center font-bold text-slate-400">0-30€/mois</td>
                  <td className="py-4 px-4 text-center font-bold text-slate-400">Variable</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── SECTION 7 — PRICING ─── */}
      <section id="tarifs" className="py-24 bg-slate-50 px-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4">Tarifs</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              Un tarif transparent. Pas de surprise.
            </h3>
          </div>

          {/* Toggle mensuel / annuel */}
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
                2 mois offerts
              </span>
            </span>
          </div>

          {/* 3 plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">

            {/* Plan Gratuit */}
            <div className="p-10 rounded-[40px] flex flex-col relative border border-slate-100 bg-white hover:shadow-2xl transition-all duration-500">
              <h3 className="text-2xl font-black mb-1 uppercase tracking-tight">Gratuit</h3>
              <p className="text-slate-400 text-sm font-bold mb-6">1 bien</p>
              <div className="mb-8">
                <div className="text-5xl font-black whitespace-nowrap">
                  0€
                  <span className="text-lg text-slate-400 font-bold">/mois</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {["1 bien", "Baux ALUR basiques", "Quittances manuelles"].map((feat) => (
                  <li key={feat} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> {feat}
                  </li>
                ))}
              </ul>
              <Link
                href={dashHref}
                className="w-full py-4 font-black rounded-2xl text-center uppercase tracking-widest text-xs bg-slate-900 text-white hover:bg-emerald-600 transition-all"
              >
                Démarrer gratuitement
              </Link>
              <p className="text-xs text-slate-400 font-medium text-center mt-3">Aucune carte requise</p>
            </div>

            {/* Plan Essentiel */}
            <div className="p-10 rounded-[40px] flex flex-col relative border border-slate-100 bg-white hover:shadow-2xl transition-all duration-500">
              <h3 className="text-2xl font-black mb-1 uppercase tracking-tight">Essentiel</h3>
              <p className="text-slate-400 text-sm font-bold mb-6">Jusqu&apos;à 3 biens</p>
              <div className="mb-8">
                <div className="text-5xl font-black whitespace-nowrap">
                  {isAnnual ? "6,83" : "9,90"}€
                  <span className="text-lg text-slate-400 font-bold">/mois</span>
                </div>
                {isAnnual && (
                  <div className="text-xs text-emerald-600 font-bold mt-1">
                    soit 82€/an
                  </div>
                )}
              </div>
              <ul className="space-y-4 mb-6 flex-grow">
                {[
                  "3 biens max",
                  "Baux ALUR conformes",
                  "Quittances automatiques",
                  "Portail locataire",
                  "IRL automatique",
                  "Analyse dossier basique",
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> {feat}
                  </li>
                ))}
              </ul>
              <div className="space-y-1 mb-6">
                <p className="text-xs text-slate-500 font-bold text-center">Moins qu&apos;un café par semaine</p>
                <p className="text-xs text-emerald-600 font-bold text-center">≈ 6€ réels après déduction fiscale*</p>
              </div>
              <button
                onClick={() => handleCheckout("ESSENTIEL")}
                disabled={isStripeLoading === "ESSENTIEL"}
                className="w-full py-4 font-black rounded-2xl text-center uppercase tracking-widest text-xs bg-slate-900 text-white hover:bg-emerald-600 transition-all disabled:opacity-50"
              >
                {isStripeLoading === "ESSENTIEL" ? "Chargement..." : "Démarrer l'essai 14j"}
              </button>
            </div>

            {/* Plan Sérénité — RECOMMANDÉ */}
            <div className="p-10 rounded-[40px] flex flex-col relative border-4 border-emerald-600 bg-white shadow-[0_50px_80px_-20px_rgba(16,185,129,0.2)] scale-105 z-10 transition-all duration-500">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2.5 rounded-full shadow-xl">
                Plus populaire
              </div>
              <h3 className="text-2xl font-black mb-1 uppercase tracking-tight">Sérénité</h3>
              <p className="text-slate-400 text-sm font-bold mb-6">Biens illimités</p>
              <div className="mb-8">
                <div className="text-5xl font-black whitespace-nowrap">
                  {isAnnual ? "12,42" : "17,90"}€
                  <span className="text-lg text-slate-400 font-bold">/mois</span>
                </div>
                {isAnnual && (
                  <div className="text-xs text-emerald-600 font-bold mt-1">
                    soit 149€/an
                  </div>
                )}
              </div>
              <ul className="space-y-4 mb-6 flex-grow">
                {[
                  "Biens illimités",
                  "Tout Essentiel +",
                  "Analyse OCR + BailScore",
                  "Signature eIDAS Yousign",
                  "Finances & rendements",
                  "Export FEC comptable",
                  "États des lieux complets",
                  "Diagnostics avec alertes",
                  "Support prioritaire",
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> {feat}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-emerald-600 font-bold text-center mb-6">≈ 11€ réels après déduction fiscale*</p>
              <button
                onClick={() => handleCheckout("SERENITE")}
                disabled={isStripeLoading === "SERENITE"}
                className="w-full py-4 font-black rounded-2xl text-center uppercase tracking-widest text-xs bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all disabled:opacity-50"
              >
                {isStripeLoading === "SERENITE" ? "Chargement..." : "Démarrer l'essai 14j"}
              </button>
            </div>
          </div>

          <div className="text-center mt-10 space-y-2">
            <p className="text-sm text-slate-400 font-medium">
              Aucune carte de crédit requise pour l&apos;essai · Annulable à tout moment · Support inclus
            </p>
            <p className="text-xs text-slate-500 font-medium mt-4">
              * En régime réel, les frais de gestion locative sont déductibles de vos revenus fonciers. BailBot est une charge déductible.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 8 — FAQ ─── */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4">FAQ</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              Questions fréquentes
            </h3>
          </div>
          <div className="bg-slate-50 rounded-[40px] p-8 md:p-12 border border-slate-100 text-slate-900">
            {faqData.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 9 — CTA FINAL ─── */}
      <section className="py-32 bg-slate-900 text-white px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-10 shadow-2xl shadow-emerald-500/50">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            Votre première location conforme commence aujourd&apos;hui.
          </h2>
          <p className="text-xl text-slate-400 font-medium mb-12">
            Rejoignez 1 200 propriétaires qui gèrent sereinement leurs locations.
          </p>
          <Link
            href={dashHref}
            className="px-12 py-6 bg-emerald-600 text-white font-black rounded-[32px] hover:bg-emerald-500 transition-all text-xl shadow-2xl shadow-emerald-500/30 active:scale-95 inline-flex items-center gap-3 uppercase tracking-widest"
          >
            Commencer mon essai gratuit de 14 jours
            <ArrowRight className="w-6 h-6" />
          </Link>
          <p className="text-sm text-slate-500 font-medium mt-6">
            Sans carte bancaire · Configuration en 5 minutes · Support disponible
          </p>
        </div>
      </section>

      {/* ─── SECTION 10 — FOOTER ─── */}
      <footer className="bg-slate-950 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight uppercase">BailBot</span>
              </div>
              <p className="text-sm text-slate-400 font-medium max-w-xs">
                Logiciel de gestion locative pour propriétaires bailleurs particuliers. Conforme ALUR, signature eIDAS.
              </p>
            </div>
            <div className="flex gap-16">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Légal</h4>
                <div className="space-y-3">
                  <Link href="/legal/confidentialite" className="block text-sm text-slate-400 hover:text-white transition-colors font-medium">
                    Confidentialité
                  </Link>
                  <Link href="/legal/cgu" className="block text-sm text-slate-400 hover:text-white transition-colors font-medium">
                    CGU
                  </Link>
                  <Link href="/legal/mentions-legales" className="block text-sm text-slate-400 hover:text-white transition-colors font-medium">
                    Mentions légales
                  </Link>
                  <Link href="/legal/dpa" className="block text-sm text-slate-400 hover:text-white transition-colors font-medium">
                    DPA
                  </Link>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Contact</h4>
                <div className="space-y-3">
                  <a href="mailto:contact@optibot.fr" className="block text-sm text-slate-400 hover:text-white transition-colors font-medium">
                    contact@optibot.fr
                  </a>
                  <p className="text-sm text-slate-500 font-medium">Support inclus dans tous les plans</p>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              © 2026 BailBot — Pour les propriétaires bailleurs particuliers
            </p>
            <p className="text-slate-600 text-[10px] font-medium">
              Conforme RGPD · Données hébergées en France
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
