"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scanConformite, type ConformiteReport } from "@/lib/conformite/scanner";

async function getUser() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) throw new Error("Non autorisé");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");
  return user;
}

async function getTeamUserIds(teamId: string): Promise<string[]> {
  const members = await prisma.user.findMany({
    where: { teamId },
    select: { id: true },
  });
  return members.map((m) => m.id);
}

/**
 * Lance un scan de conformité pour un bail donné.
 * Persiste le rapport en JSONB sur le bail.
 */
export async function lancerScanConformite(bailId: string): Promise<ConformiteReport> {
  const user = await getUser();

  /* Charger le bail avec accès team-aware */
  let bail;
  if (user.teamId) {
    const isAdmin = user.teamRole === "OWNER" || user.teamRole === "ADMIN";
    if (isAdmin) {
      const memberIds = await getTeamUserIds(user.teamId);
      bail = await prisma.bailActif.findFirst({
        where: { id: bailId, userId: { in: memberIds } },
      });
    } else {
      bail = await prisma.bailActif.findFirst({
        where: { id: bailId, OR: [{ userId: user.id }, { assigneA: user.id }] },
      });
    }
  } else {
    bail = await prisma.bailActif.findFirst({
      where: { id: bailId, userId: user.id },
    });
  }

  if (!bail) throw new Error("Bail introuvable");

  /* Charger le bien associé */
  const bien = await prisma.bien.findFirst({
    where: { id: bail.bienId },
  });

  if (!bien) throw new Error("Bien introuvable");

  /* Exécuter le scan */
  const report = scanConformite(
    {
      id: bail.id,
      loyerMensuel: bail.loyerMensuel,
      chargesMensuelles: bail.chargesMensuelles,
      depotGarantie: bail.depotGarantie,
      dateDebut: bail.dateDebut,
      dateFin: bail.dateFin,
      indiceRevision: bail.indiceRevision,
      statut: bail.statut,
    },
    {
      adresse: bien.adresse,
      surface: bien.surface,
      typeBail: bien.typeBail,
      classeDPE: (bien as Record<string, unknown>).classeDPE as string | null ?? null,
      dateDPE: bien.dateDPE,
      dateElectricite: bien.dateElectricite,
      dateGaz: bien.dateGaz,
      datePlomb: bien.datePlomb,
      dateAmiante: bien.dateAmiante,
    },
  );

  /* Persister le rapport */
  await prisma.bailActif.update({
    where: { id: bailId },
    data: {
      conformiteReport: JSON.parse(JSON.stringify(report)),
      conformiteAnalysedAt: new Date(),
    },
  });

  return report;
}

/**
 * Récupère le dernier rapport de conformité d'un bail (sans relancer le scan).
 */
export async function getConformiteReport(bailId: string): Promise<ConformiteReport | null> {
  const user = await getUser();

  let bail;
  if (user.teamId) {
    const isAdmin = user.teamRole === "OWNER" || user.teamRole === "ADMIN";
    if (isAdmin) {
      const memberIds = await getTeamUserIds(user.teamId);
      bail = await prisma.bailActif.findFirst({
        where: { id: bailId, userId: { in: memberIds } },
        select: { conformiteReport: true, conformiteAnalysedAt: true },
      });
    } else {
      bail = await prisma.bailActif.findFirst({
        where: { id: bailId, OR: [{ userId: user.id }, { assigneA: user.id }] },
        select: { conformiteReport: true, conformiteAnalysedAt: true },
      });
    }
  } else {
    bail = await prisma.bailActif.findFirst({
      where: { id: bailId, userId: user.id },
      select: { conformiteReport: true, conformiteAnalysedAt: true },
    });
  }

  if (!bail) return null;
  return (bail.conformiteReport as unknown as ConformiteReport) ?? null;
}
