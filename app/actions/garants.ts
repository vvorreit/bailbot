"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getGarants(bailId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const bail = await prisma.bailActif.findFirst({
    where: { id: bailId, userId: session.user.id },
    select: { id: true },
  });
  if (!bail) return [];

  return prisma.garant.findMany({
    where: { bailId },
    orderBy: { createdAt: "desc" },
  });
}

export async function addGarant(data: {
  bailId: string;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  typeGarantie: "PHYSIQUE" | "MORAL" | "VISALE" | "CAUTIONNEMENT_BANCAIRE";
  revenus?: number;
  employeur?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Non authentifié");

  const bail = await prisma.bailActif.findFirst({
    where: { id: data.bailId, userId: session.user.id },
    select: { id: true },
  });
  if (!bail) throw new Error("Bail introuvable");

  return prisma.garant.create({
    data: {
      bailId: data.bailId,
      nom: data.nom,
      prenom: data.prenom || null,
      email: data.email || null,
      telephone: data.telephone || null,
      typeGarantie: data.typeGarantie,
      revenus: data.revenus || null,
      employeur: data.employeur || null,
    },
  });
}

export async function removeGarant(garantId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Non authentifié");

  const garant = await prisma.garant.findUnique({
    where: { id: garantId },
    include: { bail: { select: { userId: true } } },
  });
  if (!garant || garant.bail.userId !== session.user.id) throw new Error("Non autorisé");

  return prisma.garant.delete({ where: { id: garantId } });
}
