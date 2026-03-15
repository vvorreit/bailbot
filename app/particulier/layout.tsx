import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BailBot Particulier — Bail automatique pour propriétaires bailleurs",
  description:
    "Propriétaire bailleur ? Analysez vos dossiers locataires, obtenez le BailScore™ et générez votre bail loi ALUR en 5 minutes. 100% local, RGPD. Dès 4,90€.",
  keywords:
    "propriétaire bailleur, sélection locataire, bail automatique, quittance loyer, dossier locataire, loi ALUR, relance impayé, score dossier, BailScore, Visale",
  authors: [{ name: "BailBot" }],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://bailbot.fr/particulier" },
  openGraph: {
    title: "BailBot Particulier — Bail automatique pour propriétaires bailleurs",
    description:
      "Analysez vos dossiers locataires, obtenez le BailScore™ et générez votre bail loi ALUR en 5 minutes. 100% local, RGPD. Dès 4,90€.",
    url: "https://bailbot.fr/particulier",
    siteName: "BailBot",
    images: [
      {
        url: "/og-particulier.png",
        width: 1200,
        height: 630,
        alt: "BailBot Particulier — Bail automatique pour propriétaires bailleurs",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BailBot Particulier — Bail automatique pour propriétaires bailleurs",
    description:
      "Analysez vos dossiers locataires, obtenez le BailScore™ et générez votre bail loi ALUR en 5 minutes. 100% local, RGPD. Dès 4,90€.",
    images: ["/og-particulier.png"],
  },
};

export default function ParticulierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
