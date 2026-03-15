import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BailBot Particulier — Analysez vos dossiers locataires en 5 minutes",
  description:
    "Propriétaire bailleur ? BailBot analyse les dossiers de vos locataires, vérifie l'éligibilité Visale et génère votre bail automatiquement. Dès 4,90€/dossier.",
  keywords:
    "dossier locataire, bail automatique, Visale, propriétaire bailleur, analyse dossier location",
};

export default function ParticulierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
