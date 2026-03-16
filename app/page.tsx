import type { Metadata } from "next";
import LandingClient from "./LandingClient";

export const metadata: Metadata = {
  title: "BailBot — Logiciel gestion locative pour propriétaires particuliers | Conforme ALUR",
  description:
    "Automatisez vos baux, quittances et dossiers locataires. Conforme ALUR 2024, signature eIDAS. Essai gratuit 14 jours sans CB. Pour propriétaires de 1 à 10 biens.",
};

export default function LandingPage() {
  return <LandingClient />;
}
