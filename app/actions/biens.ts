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

async function getUserId(): Promise<string> {
  const user = await getUser();
  return user.id;
}

export async function createBien(data: {
  adresse: string;
  loyer: number;
  charges?: number;
  typeBail?: string;
  statut?: string;
}) {
  const userId = await getUserId();
  return prisma.bien.create({
    data: {
      userId,
      adresse: data.adresse,
      loyer: data.loyer,
      charges: data.charges ?? 0,
      typeBail: (data.typeBail as any) ?? "HABITATION_VIDE",
      statut: data.statut ?? "vacant",
    },
  });
}

async function getTeamUserIds(teamId: string): Promise<string[]> {
  const members = await prisma.user.findMany({
    where: { teamId },
    select: { id: true },
  });
  return members.map((m) => m.id);
}

export async function getBiens() {
  const user = await getUser();

  // US 23 : Filtrer par accès collaborateur
  if (user.teamId) {
    const isAdmin = user.teamRole === "OWNER" || user.teamRole === "ADMIN";
    if (isAdmin) {
      const memberIds = await getTeamUserIds(user.teamId);
      return prisma.bien.findMany({
        where: { userId: { in: memberIds } },
        orderBy: { createdAt: "desc" },
      });
    }
    // MEMBER : ses biens + biens assignés
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

  return prisma.bien.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBien(id: string) {
  const userId = await getUserId();
  return prisma.bien.findFirst({ where: { id, userId } });
}

export async function updateBien(id: string, data: Record<string, any>) {
  const userId = await getUserId();
  const bien = await prisma.bien.findFirst({ where: { id, userId } });
  if (!bien) throw new Error("Bien introuvable");
  return prisma.bien.update({ where: { id }, data });
}

export async function deleteBien(id: string) {
  const userId = await getUserId();
  const bien = await prisma.bien.findFirst({ where: { id, userId } });
  if (!bien) throw new Error("Bien introuvable");
  return prisma.bien.delete({ where: { id } });
}
