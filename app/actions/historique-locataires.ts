"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) throw new Error("Non autorisé");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");
  return user.id;
}

export async function getHistoriqueByBien(bienId: string) {
  const userId = await getUserId();

  const bails = await prisma.bailActif.findMany({
    where: { userId, bienId },
    orderBy: { dateDebut: "desc" },
    select: {
      id: true,
      locataireNom: true,
      locataireEmail: true,
      dateDebut: true,
      dateFin: true,
      dateSortie: true,
      motifSortie: true,
      loyerMensuel: true,
      chargesMensuelles: true,
      statut: true,
    },
  });

  return bails;
}

export async function cloturerBail(bailId: string, data: {
  dateSortie: string;
  motifSortie: string;
}) {
  const userId = await getUserId();
  const bail = await prisma.bailActif.findFirst({ where: { id: bailId, userId } });
  if (!bail) throw new Error("Bail introuvable");

  return prisma.bailActif.update({
    where: { id: bailId },
    data: {
      statut: "TERMINE",
      dateSortie: new Date(data.dateSortie),
      motifSortie: data.motifSortie,
    },
  });
}
