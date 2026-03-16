"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getRegularisations() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return [];

  return prisma.regularisationCharges.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function creerRegularisation(data: {
  bienId: string;
  bailId?: string;
  annee: number;
  chargesReelles: number;
  provisionsMensuelles: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Non authentifie");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) throw new Error("Utilisateur introuvable");

  const totalProvisions = data.provisionsMensuelles * 12;
  const solde = totalProvisions - data.chargesReelles;

  return prisma.regularisationCharges.create({
    data: {
      userId: user.id,
      bienId: data.bienId,
      bailId: data.bailId,
      annee: data.annee,
      chargesReelles: data.chargesReelles,
      provisionsMensuelles: data.provisionsMensuelles,
      totalProvisions,
      solde,
    },
  });
}

export async function marquerRegularisee(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Non authentifie");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) throw new Error("Utilisateur introuvable");

  await prisma.regularisationCharges.updateMany({
    where: { id, userId: user.id },
    data: { statut: "regularise", dateRegularisation: new Date() },
  });

  return { success: true };
}
