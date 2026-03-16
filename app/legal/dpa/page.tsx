"use client";

import Link from "next/link";
import { Shield, ArrowLeft, ExternalLink } from "lucide-react";

const SOUS_TRAITANTS = [
  {
    nom: "Stripe",
    role: "Traitement des paiements par carte bancaire",
    localisation: "États-Unis + Europe",
    baseLegale: "Clauses contractuelles types (SCCs) + certification PCI DSS",
    dpaUrl: "https://stripe.com/fr/legal/dpa",
  },
  {
    nom: "Resend",
    role: "Envoi d'emails transactionnels (quittances, relances, notifications)",
    localisation: "États-Unis",
    baseLegale: "Clauses contractuelles types (SCCs)",
    dpaUrl: "https://resend.com/legal/dpa",
  },
  {
    nom: "PostHog",
    role: "Analytics produit et mesure d'audience (soumis à consentement)",
    localisation: "Union Européenne (option Cloud EU disponible)",
    baseLegale: "Consentement utilisateur + Cloud EU",
    dpaUrl: "https://posthog.com/docs/privacy/dpa",
  },
  {
    nom: "Upstash",
    role: "Rate limiting et cache Redis",
    localisation: "Union Européenne",
    baseLegale: "Traitement dans l'UE — pas de transfert hors UE",
    dpaUrl: "https://upstash.com/trust/dpa.pdf",
  },
  {
    nom: "Hébergeur (VPS)",
    role: "Hébergement de l'infrastructure serveur (Docker)",
    localisation: "France / Union Européenne",
    baseLegale: "Traitement dans l'UE — pas de transfert hors UE",
    dpaUrl: null,
  },
];

export default function DPAPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-6 md:p-20">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-bold mb-10 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>
        <div className="flex items-center gap-4 mb-8 text-blue-600">
          <Shield className="w-12 h-12" />
          <h1 className="text-4xl font-black">Accord de traitement des données (DPA)</h1>
        </div>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <p className="text-slate-600 leading-relaxed">
              Conformément au Règlement Général sur la Protection des Données (RGPD), BailBot fait appel à des sous-traitants
              pour le fonctionnement de son service. Chaque sous-traitant est lié par un accord de traitement des données (Data
              Processing Agreement — DPA) garantissant la protection de vos données personnelles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Sous-traitants</h2>
            <div className="space-y-6">
              {SOUS_TRAITANTS.map((st) => (
                <div key={st.nom} className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-800">{st.nom}</h3>
                    {st.dpaUrl && (
                      <a
                        href={st.dpaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                      >
                        DPA officiel <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li><strong>Rôle :</strong> {st.role}</li>
                    <li><strong>Localisation :</strong> {st.localisation}</li>
                    <li><strong>Base légale :</strong> {st.baseLegale}</li>
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Transferts hors UE</h2>
            <p className="text-slate-600 leading-relaxed">
              Pour les sous-traitants situés en dehors de l&apos;Union Européenne (Stripe, Resend), les transferts de données
              sont encadrés par les <strong>Clauses Contractuelles Types (SCCs)</strong> approuvées par la Commission Européenne,
              conformément à l&apos;article 46 du RGPD. Ces clauses garantissent un niveau de protection adéquat des données
              personnelles transférées.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Mesures de sécurité</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Chiffrement des données sensibles (IBAN) avec AES-256-GCM côté serveur.</li>
              <li>Chiffrement des documents candidats côté client avant transmission.</li>
              <li>Connexions HTTPS/TLS pour tous les échanges avec les sous-traitants.</li>
              <li>Accès restreint aux données selon le principe du moindre privilège.</li>
              <li>Journalisation des accès et des opérations (audit log).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Vos droits</h2>
            <p className="text-slate-600 leading-relaxed">
              Vous pouvez exercer vos droits (accès, rectification, effacement, portabilité) à tout moment depuis votre
              espace <Link href="/dashboard/account/rgpd" className="text-blue-600 hover:underline font-semibold">Mon compte &gt; Vie privée</Link> ou
              en nous contactant à : <strong>contact@bailbot.fr</strong>.
            </p>
            <p className="text-slate-600 leading-relaxed mt-2">
              Pour plus de détails sur notre traitement des données, consultez
              notre <Link href="/legal/confidentialite" className="text-blue-600 hover:underline font-semibold">Politique de Confidentialité</Link>.
            </p>
          </section>

          <p className="text-sm text-slate-400 border-t pt-6">
            Dernière mise à jour : 16 mars 2026
          </p>
        </div>
      </div>
    </div>
  );
}
