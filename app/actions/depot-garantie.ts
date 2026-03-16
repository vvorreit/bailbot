"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getDepotsGarantie() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return [];

  const bails = await prisma.bailActif.findMany({
    where: { userId: user.id, depotGarantie: { not: null } },
    select: {
      id: true,
      bienId: true,
      locataireNom: true,
      depotGarantie: true,
      depositGarantieRestitue: true,
      depositGarantieRestitutionDate: true,
      depositGarantieDeductions: true,
      statut: true,
      dateSortie: true,
      dateDebut: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return bails.map((b) => {
    const hasDeductions = b.depositGarantieDeductions && Object.keys(b.depositGarantieDeductions as any).length > 0;
    const delaiLegalJours = hasDeductions ? 60 : 30;
    let delaiDepasse = false;
    if (b.dateSortie && !b.depositGarantieRestitue) {
      const joursDepuisSortie = Math.ceil((Date.now() - b.dateSortie.getTime()) / (1000 * 60 * 60 * 24));
      delaiDepasse = joursDepuisSortie > delaiLegalJours;
    }

    return {
      id: b.id,
      bienId: b.bienId,
      locataireNom: b.locataireNom,
      montant: b.depotGarantie,
      restitue: b.depositGarantieRestitue,
      dateRestitution: b.depositGarantieRestitutionDate?.toISOString() ?? null,
      deductions: b.depositGarantieDeductions,
      statut: b.depositGarantieRestitue ? "restitue" : b.statut === "TERMINE" ? "a_restituer" : "en_cours",
      delaiDepasse,
      delaiLegalJours,
      dateSortie: b.dateSortie?.toISOString() ?? null,
    };
  });
}

export async function restituerDepotGarantie(
  bailId: string,
  montantRestitue: number,
  deductions: { motif: string; montant: number }[]
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Non authentifie");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) throw new Error("Utilisateur introuvable");

  await prisma.bailActif.update({
    where: { id: bailId },
    data: {
      depositGarantieRestitue: montantRestitue,
      depositGarantieRestitutionDate: new Date(),
      depositGarantieDeductions: deductions,
    },
  });

  return { success: true };
}
