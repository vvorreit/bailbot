"use client";

import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-6 md:p-20">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-bold mb-10 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>
        <div className="flex items-center gap-4 mb-8 text-blue-600">
           <Shield className="w-12 h-12" />
           <h1 className="text-4xl font-black">Politique de Confidentialité</h1>
        </div>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">1. Principe de &ldquo;Privacy-by-Design&rdquo;</h2>
            <p className="text-slate-600 leading-relaxed">
              BailBot a été conçu pour respecter scrupuleusement la vie privée de ses utilisateurs et la confidentialité des données locatives.
              <strong> Les données sensibles (IBAN, revenus) sont chiffrées côté serveur avec AES-256-GCM.</strong> Les documents candidats sont chiffrés côté client avant transmission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">2. Responsable de traitement</h2>
            <p className="text-slate-600 leading-relaxed">
              Le responsable du traitement des données est BailBot. Pour toute question relative à vos données personnelles, contactez-nous à : <strong>contact@optibot.fr</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">3. Données collectées</h2>
            <p className="text-slate-600 leading-relaxed">
              Nous collectons uniquement les données strictement nécessaires au fonctionnement du service :
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Compte utilisateur</strong> : nom, email, téléphone, ville, mot de passe (haché bcrypt).</li>
              <li><strong>Profil bailleur</strong> : identité, adresse, SIRET, IBAN (<strong>chiffré AES-256-GCM</strong>).</li>
              <li><strong>Biens immobiliers</strong> : adresses, loyers, charges, informations locataires.</li>
              <li><strong>Baux</strong> : dates, montants, informations des parties.</li>
              <li><strong>Candidatures</strong> : dossiers, revenus, scores d&apos;analyse.</li>
              <li><strong>Paiements</strong> : suivi des loyers. Les informations bancaires de facturation sont gérées exclusivement par Stripe.</li>
              <li><strong>Documents candidats</strong> : chiffrés côté client (AES), stockés chiffrés sur nos serveurs.</li>
              <li><strong>Analytics</strong> : mesure d&apos;audience anonyme via PostHog (soumis à consentement).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">4. Bases légales du traitement</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Exécution du contrat</strong> : gestion des baux, paiements, quittances.</li>
              <li><strong>Obligation légale</strong> : conservation des baux et quittances (10 ans).</li>
              <li><strong>Consentement</strong> : cookies analytics et marketing.</li>
              <li><strong>Intérêt légitime</strong> : sécurité et prévention de la fraude.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">5. Durées de conservation</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Candidatures refusées / non traitées</strong> : 3 mois — suppression automatique.</li>
              <li><strong>Dépôts de documents expirés</strong> : suppression automatique à expiration.</li>
              <li><strong>Données de navigation</strong> : 13 mois maximum.</li>
              <li><strong>Comptes inactifs sans bail actif</strong> : anonymisation après 3 ans d&apos;inactivité.</li>
              <li><strong>Baux et quittances</strong> : 10 ans (obligation légale de conservation).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">6. Sécurité des données</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Chiffrement des données sensibles (IBAN) avec AES-256-GCM côté serveur.</li>
              <li>Chiffrement des documents candidats côté client avant transmission.</li>
              <li>Mots de passe hachés avec bcrypt (12 rounds).</li>
              <li>Tokens d&apos;accès avec expiration automatique.</li>
              <li>Authentification sécurisée (JWT, OAuth 2.0 Google).</li>
              <li>Base de données PostgreSQL avec connexion chiffrée.</li>
              <li>Infrastructure Docker avec déploiement automatisé.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">7. Sous-traitants</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Stripe</strong> : gestion des paiements par carte bancaire (certifié PCI DSS).</li>
              <li><strong>Resend</strong> : envoi d&apos;emails transactionnels.</li>
              <li><strong>PostHog</strong> : analytics (soumis à consentement).</li>
              <li><strong>Google</strong> : authentification OAuth 2.0.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">8. Droits des utilisateurs</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Droit d&apos;accès (Art. 15)</strong> : consulter vos données personnelles.</li>
              <li><strong>Droit de rectification (Art. 16)</strong> : modifier vos informations depuis votre profil.</li>
              <li><strong>Droit à l&apos;effacement (Art. 17)</strong> : supprimer votre compte depuis <Link href="/dashboard/account/rgpd" className="text-blue-600 hover:underline font-semibold">Mon compte &gt; Vie privée</Link>.</li>
              <li><strong>Droit à la portabilité (Art. 20)</strong> : exporter toutes vos données au format JSON.</li>
              <li><strong>Droit d&apos;opposition (Art. 21)</strong> : refuser les cookies analytics et marketing.</li>
              <li><strong>Droit de retrait du consentement</strong> : à tout moment via la bannière cookies ou les paramètres de votre compte.</li>
            </ul>
            <p className="text-slate-600 leading-relaxed mt-4">
              Pour exercer vos droits, rendez-vous dans <Link href="/dashboard/account/rgpd" className="text-blue-600 hover:underline font-semibold">Mon compte &gt; Vie privée</Link> ou contactez-nous à : <strong>contact@optibot.fr</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">9. Cookies</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Cookies nécessaires</strong> (toujours actifs) : authentification, session, sécurité CSRF.</li>
              <li><strong>Cookies analytics</strong> (consentement requis) : PostHog — mesure d&apos;audience anonyme, durée 13 mois max.</li>
              <li><strong>Cookies marketing</strong> (consentement requis) : communications promotionnelles.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">10. Réclamation</h2>
            <p className="text-slate-600 leading-relaxed">
              Si vous estimez que le traitement de vos données ne respecte pas la réglementation, vous pouvez introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libertés) : <a href="https://www.cnil.fr" className="text-blue-600 hover:underline font-semibold" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.
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
