"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Non autorisé");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { team: true },
  });
  if (!user) throw new Error("Utilisateur introuvable");
  return user;
}

/**
 * Assigner un bien à un collaborateur de l'équipe.
 * Seuls OWNER et ADMIN peuvent assigner.
 */
export async function assignBienToCollaborateur(bienId: string, collaborateurId: string | null) {
  const user = await getUser();

  if (!user.teamId || (user.teamRole !== "OWNER" && user.teamRole !== "ADMIN")) {
    throw new Error("Seuls les administrateurs peuvent assigner des biens.");
  }

  if (collaborateurId) {
    const collaborateur = await prisma.user.findUnique({ where: { id: collaborateurId } });
    if (!collaborateur || collaborateur.teamId !== user.teamId) {
      throw new Error("Ce collaborateur ne fait pas partie de votre équipe.");
    }
  }

  const bien = await prisma.bien.findFirst({ where: { id: bienId, userId: user.team!.ownerId } });
  if (!bien) {
    const bienTeam = await prisma.bien.findFirst({
      where: {
        id: bienId,
        userId: { in: await getTeamUserIds(user.teamId) },
      },
    });
    if (!bienTeam) throw new Error("Bien introuvable dans votre équipe.");
  }

  await prisma.bien.update({
    where: { id: bienId },
    data: { assigneA: collaborateurId },
  });

  return { success: true };
}

/**
 * Assigner un bail à un collaborateur.
 */
export async function assignBailToCollaborateur(bailId: string, collaborateurId: string | null) {
  const user = await getUser();

  if (!user.teamId || (user.teamRole !== "OWNER" && user.teamRole !== "ADMIN")) {
    throw new Error("Seuls les administrateurs peuvent assigner des bails.");
  }

  await prisma.bailActif.update({
    where: { id: bailId },
    data: { assigneA: collaborateurId },
  });

  return { success: true };
}

async function getTeamUserIds(teamId: string): Promise<string[]> {
  const members = await prisma.user.findMany({
    where: { teamId },
    select: { id: true },
  });
  return members.map((m) => m.id);
}

/**
 * Retourne les biens accessibles pour l'utilisateur courant :
 * - OWNER/ADMIN : tous les biens de l'équipe
 * - MEMBER : uniquement les biens qui lui sont assignés + ses propres biens
 * - Sans équipe : uniquement ses propres biens
 */
export async function getBiensAccessibles() {
  const user = await getUser();

  if (!user.teamId) {
    return prisma.bien.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
  }

  const isAdmin = user.teamRole === "OWNER" || user.teamRole === "ADMIN";

  if (isAdmin) {
    const memberIds = await getTeamUserIds(user.teamId);
    return prisma.bien.findMany({
      where: { userId: { in: memberIds } },
      orderBy: { createdAt: "desc" },
    });
  }

  return prisma.bien.findMany({
    where: {
      OR: [
        { userId: user.id },
        { assigneA: user.id },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Vérifie si l'utilisateur courant a accès à un bien donné.
 */
export async function isAuthorizedForBien(bienId: string): Promise<boolean> {
  const user = await getUser();

  if (!user.teamId) {
    const bien = await prisma.bien.findFirst({ where: { id: bienId, userId: user.id } });
    return !!bien;
  }

  const isAdmin = user.teamRole === "OWNER" || user.teamRole === "ADMIN";

  if (isAdmin) {
    const memberIds = await getTeamUserIds(user.teamId);
    const bien = await prisma.bien.findFirst({
      where: { id: bienId, userId: { in: memberIds } },
    });
    return !!bien;
  }

  const bien = await prisma.bien.findFirst({
    where: {
      id: bienId,
      OR: [
        { userId: user.id },
        { assigneA: user.id },
      ],
    },
  });
  return !!bien;
}

/**
 * Retourne les biens assignés à chaque membre de l'équipe.
 */
export async function getBiensParMembre() {
  const user = await getUser();

  if (!user.teamId || (user.teamRole !== "OWNER" && user.teamRole !== "ADMIN")) {
    throw new Error("Accès réservé aux administrateurs.");
  }

  const memberIds = await getTeamUserIds(user.teamId);

  const biens = await prisma.bien.findMany({
    where: { userId: { in: memberIds } },
    select: { id: true, adresse: true, assigneA: true },
  });

  return biens;
}
