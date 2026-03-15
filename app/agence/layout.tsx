import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BailBot Agence — Gestion locative pour agences immobilières",
  description:
    "Agence immobilière ? Détectez les fraudes, gérez vos mandats en Kanban et automatisez les relances loyers impayés avec BailBot. Essai 14 jours gratuit.",
  keywords:
    "agence immobilière logiciel, gestion dossiers locataires, détection fraude dossier, mandataire immobilier, relance automatique, bail professionnel, DossierFacile, BailScore Pro",
  authors: [{ name: "BailBot" }],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://bailbot.fr/agence" },
  openGraph: {
    title: "BailBot Agence — Gestion locative pour agences immobilières",
    description:
      "Détectez les fraudes, gérez vos mandats en Kanban et automatisez les relances loyers impayés avec BailBot. Essai 14 jours gratuit.",
    url: "https://bailbot.fr/agence",
    siteName: "BailBot",
    images: [
      {
        url: "/og-agence.png",
        width: 1200,
        height: 630,
        alt: "BailBot Agence — Gestion locative pour agences immobilières",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BailBot Agence — Gestion locative pour agences immobilières",
    description:
      "Détectez les fraudes, gérez vos mandats en Kanban et automatisez les relances loyers impayés avec BailBot. Essai 14 jours gratuit.",
    images: ["/og-agence.png"],
  },
};

export default function AgenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
