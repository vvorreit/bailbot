"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Non autorisé");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
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

export async function getBienDetails(bienId: string) {
  const user = await getUser();

  // US 23 : Accès team-aware
  let bien;
  if (user.teamId) {
    const isAdmin = user.teamRole === "OWNER" || user.teamRole === "ADMIN";
    if (isAdmin) {
      const memberIds = await getTeamUserIds(user.teamId);
      bien = await prisma.bien.findFirst({ where: { id: bienId, userId: { in: memberIds } } });
    } else {
      bien = await prisma.bien.findFirst({
        where: { id: bienId, OR: [{ userId: user.id }, { assigneA: user.id }] },
      });
    }
  } else {
    bien = await prisma.bien.findFirst({ where: { id: bienId, userId: user.id } });
  }
  if (!bien) return null;

  const bails = await prisma.bailActif.findMany({
    where: { userId: bien.userId, bienId },
    include: { alertes: { orderBy: { dateEcheance: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const bailActif = bails.find((b) => b.statut === "ACTIF" || b.statut === "PREAVIS") ?? null;

  const paiements = await prisma.paiementBien.findMany({
    where: { userId: bien.userId, bienId },
    orderBy: { dateAttendue: "desc" },
    take: 12,
  });

  const edls = await prisma.etatDesLieux.findMany({
    where: { userId: bien.userId, bienId },
    orderBy: { date: "desc" },
  });

  const alertes = bails.flatMap((b) => b.alertes).filter((a) => !a.traitee);

  return {
    bien,
    bailActif,
    bails,
    paiements,
    edls,
    alertes,
  };
}
