"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLoyerMarche, type LoyerMarcheResult } from "@/lib/dvf-api";

const CACHE_DUREE_MS = 30 * 24 * 60 * 60 * 1000; /* 30 jours */

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

async function getBienWithAuth(bienId: string) {
  const user = await getUser();

  if (user.teamId) {
    const isAdmin = user.teamRole === "OWNER" || user.teamRole === "ADMIN";
    if (isAdmin) {
      const memberIds = await getTeamUserIds(user.teamId);
      return prisma.bien.findFirst({ where: { id: bienId, userId: { in: memberIds } } });
    }
    return prisma.bien.findFirst({
      where: { id: bienId, OR: [{ userId: user.id }, { assigneA: user.id }] },
    });
  }

  return prisma.bien.findFirst({ where: { id: bienId, userId: user.id } });
}

export async function getLoyerMarcheForBien(
  bienId: string
): Promise<LoyerMarcheResult | null> {
  const bien = await getBienWithAuth(bienId);
  if (!bien) throw new Error("Bien introuvable");

  /* Vérifier le cache */
  if (bien.loyerMarcheCache && bien.loyerMarcheCachedAt) {
    const age = Date.now() - new Date(bien.loyerMarcheCachedAt).getTime();
    if (age < CACHE_DUREE_MS) {
      return bien.loyerMarcheCache as unknown as LoyerMarcheResult;
    }
  }

  /* Calculer */
  const surface = bien.surface ?? 0;
  if (!surface || surface < 5) return null;

  const typeBien = bien.typeBail === "PROFESSIONNEL"
    ? "local"
    : bien.adresse.toLowerCase().includes("maison")
      ? "maison"
      : "appartement";

  const result = await getLoyerMarche(bien.adresse, surface, typeBien);

  /* Mettre en cache */
  if (result) {
    await prisma.bien.update({
      where: { id: bienId },
      data: {
        loyerMarcheCache: result as any,
        loyerMarcheCachedAt: new Date(),
      },
    });
  }

  return result;
}

export async function refreshLoyerMarche(
  bienId: string
): Promise<LoyerMarcheResult | null> {
  const bien = await getBienWithAuth(bienId);
  if (!bien) throw new Error("Bien introuvable");

  const surface = bien.surface ?? 0;
  if (!surface || surface < 5) return null;

  const typeBien = bien.typeBail === "PROFESSIONNEL"
    ? "local"
    : bien.adresse.toLowerCase().includes("maison")
      ? "maison"
      : "appartement";

  const result = await getLoyerMarche(bien.adresse, surface, typeBien);

  /* Mettre à jour le cache même si null (pour éviter des re-calculs) */
  await prisma.bien.update({
    where: { id: bienId },
    data: {
      loyerMarcheCache: result as any ?? null,
      loyerMarcheCachedAt: new Date(),
    },
  });

  return result;
}
