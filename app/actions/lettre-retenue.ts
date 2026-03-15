"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { ResultatComparaison } from "./comparaison-edl";

/**
 * Génère les données nécessaires pour la lettre de retenue sur dépôt de garantie.
 * Le PDF est généré côté client avec jsPDF.
 */
export async function getDonneesLettreRetenue(bienId: string): Promise<{
  bailleurNom: string;
  bailleurAdresse: string;
  locataireNom: string;
  adresse: string;
  depotGarantie: number | null;
  dateSortie: string | null;
} | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Non autorisé" };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return { error: "Utilisateur introuvable" };

  const bien = await prisma.bien.findFirst({
    where: { id: bienId, userId: user.id },
  });
  if (!bien) return { error: "Bien introuvable" };

  const bail = await prisma.bailActif.findFirst({
    where: { userId: user.id, bienId },
    orderBy: { dateDebut: "desc" },
  });

  return {
    bailleurNom: user.bailleurNom || user.name || "",
    bailleurAdresse: user.bailleurAdresse || "",
    locataireNom: bail?.locataireNom || bien.locataireNom || "",
    adresse: bien.adresse,
    depotGarantie: bail?.depotGarantie || null,
    dateSortie: bail?.dateSortie ? new Date(bail.dateSortie).toISOString() : null,
  };
}
