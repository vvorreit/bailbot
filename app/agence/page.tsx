import type { Metadata } from "next";
import AgenceLanding from "@/components/AgenceLanding";

export const metadata: Metadata = {
  title: "BailBot Agence — Gérez vos mandats locatifs 3× plus vite",
  description: "Agences immobilières et mandataires : centralisez la gestion de vos dossiers, détectez les fraudes automatiquement et automatisez vos relances. Dès 49€/mois.",
  keywords: "logiciel gestion dossiers locataires agence, outil sélection locataire professionnel, détection fraude dossier, agence immobilière SaaS",
  alternates: { canonical: "https://bailbot.fr/agence" },
  openGraph: {
    title: "BailBot Agence — L'outil que vos concurrents n'ont pas encore.",
    description: "Gérez tous vos mandats. Impressionnez vos propriétaires. Signez plus vite.",
    url: "https://bailbot.fr/agence",
    type: "website",
  },
};

export default function AgencePage() {
  return <AgenceLanding />;
}
