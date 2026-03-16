"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireUser() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) throw new Error("Non autorisé");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");
  return user;
}

export async function updateIRLPreferences(
  bailId: string,
  data: { indexationIRLActive: boolean; indexationIRLJoursAvant: number }
) {
  const user = await requireUser();
  const bail = await prisma.bailActif.findFirst({ where: { id: bailId, userId: user.id } });
  if (!bail) throw new Error("Bail introuvable");

  await prisma.bailActif.update({
    where: { id: bailId },
    data: {
      indexationIRLActive: data.indexationIRLActive,
      indexationIRLJoursAvant: data.indexationIRLJoursAvant,
    },
  });

  return { ok: true };
}

export async function getIRLStatus(bailId: string) {
  const user = await requireUser();
  const bail = await prisma.bailActif.findFirst({
    where: { id: bailId, userId: user.id },
    select: {
      id: true,
      loyerMensuel: true,
      dateSignature: true,
      dateProchRevision: true,
      indexationIRLActive: true,
      indexationIRLJoursAvant: true,
      dernierIRLApplique: true,
      derniereLoyerRevise: true,
      locataireNom: true,
      locataireEmail: true,
    },
  });
  if (!bail) throw new Error("Bail introuvable");
  return bail;
}
