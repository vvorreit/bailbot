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

export async function createCandidature(data: {
  bienId: string;
  statut?: string;
  dossier?: any;
  bailScore?: number;
  scoreGrade?: string;
  eligibleVisale?: boolean;
  alertesFraude?: number;
  aGarant?: boolean;
  dossierGarant?: any;
  completude?: any;
}) {
  const userId = await getUserId();
  return prisma.candidatureLocal.create({
    data: {
      userId,
      bienId: data.bienId,
      statut: data.statut ?? "en_attente",
      dossier: data.dossier ?? {},
      bailScore: data.bailScore,
      scoreGrade: data.scoreGrade,
      eligibleVisale: data.eligibleVisale,
      alertesFraude: data.alertesFraude,
      aGarant: data.aGarant ?? false,
      dossierGarant: data.dossierGarant,
      completude: data.completude,
    },
  });
}

export async function getCandidatures(bienId: string) {
  const userId = await getUserId();
  return prisma.candidatureLocal.findMany({
    where: { userId, bienId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateCandidature(id: string, data: Record<string, any>) {
  const userId = await getUserId();
  const c = await prisma.candidatureLocal.findFirst({ where: { id, userId } });
  if (!c) throw new Error("Candidature introuvable");
  return prisma.candidatureLocal.update({ where: { id }, data });
}

export async function deleteCandidature(id: string) {
  const userId = await getUserId();
  const c = await prisma.candidatureLocal.findFirst({ where: { id, userId } });
  if (!c) throw new Error("Candidature introuvable");
  return prisma.candidatureLocal.delete({ where: { id } });
}
