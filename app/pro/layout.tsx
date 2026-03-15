import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BailBot Pro — Plateforme gestion locative ADB et syndics",
  description:
    "Administrateur de biens ou syndic ? Pilotez vos lots, automatisez les révisions ILC/ILAT et restez conforme ALUR avec BailBot Pro. Pilote 30 jours inclus.",
  keywords:
    "administrateur de biens, syndic gestion locative, bail professionnel 6 ans, révision ILC ILAT, gestion multi-portefeuilles, conformité ALUR, bail commercial 3-6-9",
  authors: [{ name: "BailBot" }],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://bailbot.fr/pro" },
  openGraph: {
    title: "BailBot Pro — Plateforme gestion locative ADB et syndics",
    description:
      "Pilotez vos lots, automatisez les révisions ILC/ILAT et restez conforme ALUR avec BailBot Pro. Pilote 30 jours inclus.",
    url: "https://bailbot.fr/pro",
    siteName: "BailBot",
    images: [
      {
        url: "/og-pro.png",
        width: 1200,
        height: 630,
        alt: "BailBot Pro — Plateforme gestion locative ADB et syndics",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BailBot Pro — Plateforme gestion locative ADB et syndics",
    description:
      "Pilotez vos lots, automatisez les révisions ILC/ILAT et restez conforme ALUR avec BailBot Pro. Pilote 30 jours inclus.",
    images: ["/og-pro.png"],
  },
};

export default function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
