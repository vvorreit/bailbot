"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface BienVacant {
  id: string;
  adresse: string;
  loyer: number;
  charges: number;
  surface: number | null;
  dateFinDernierBail: string | null;
  dureeVacanceJours: number;
  typeBail: string;
}

export async function getBiensVacants(): Promise<BienVacant[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return [];

  const biens = await prisma.bien.findMany({
    where: { userId: user.id },
  });

  const now = new Date();
  const vacants: BienVacant[] = [];

  for (const bien of biens) {
    /* Chercher un bail actif pour ce bien */
    const bailActif = await prisma.bailActif.findFirst({
      where: {
        userId: user.id,
        bienId: bien.id,
        statut: "ACTIF",
      },
    });

    if (bailActif) continue;

    /* Chercher le dernier bail terminé */
    const dernierBail = await prisma.bailActif.findFirst({
      where: {
        userId: user.id,
        bienId: bien.id,
        statut: { in: ["TERMINE", "PREAVIS"] },
      },
      orderBy: { dateSortie: "desc" },
    });

    const dateFinDernierBail = dernierBail?.dateSortie || dernierBail?.dateFin || null;
    let dureeVacanceJours = 0;

    if (dateFinDernierBail) {
      dureeVacanceJours = Math.ceil(
        (now.getTime() - new Date(dateFinDernierBail).getTime()) / (1000 * 60 * 60 * 24)
      );
    } else if (bien.createdAt) {
      dureeVacanceJours = Math.ceil(
        (now.getTime() - new Date(bien.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    vacants.push({
      id: bien.id,
      adresse: bien.adresse,
      loyer: bien.loyer,
      charges: bien.charges,
      surface: bien.surface,
      dateFinDernierBail: dateFinDernierBail ? new Date(dateFinDernierBail).toISOString() : null,
      dureeVacanceJours: Math.max(0, dureeVacanceJours),
      typeBail: bien.typeBail,
    });
  }

  return vacants.sort((a, b) => b.dureeVacanceJours - a.dureeVacanceJours);
}
