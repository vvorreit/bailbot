"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Non autorisé");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("Utilisateur introuvable");
  return user.id;
}

export async function createPaiement(data: {
  bienId: string;
  locataireNom: string;
  locatairePrenom?: string;
  locataireEmail?: string;
  loyerCC: number;
  dateAttendue: string;
  dateReelle?: string;
  statut?: string;
  montantRecu?: number;
  mois: string;
  notes?: string;
}) {
  const userId = await getUserId();
  return prisma.paiementBien.create({
    data: {
      userId,
      bienId: data.bienId,
      locataireNom: data.locataireNom,
      locatairePrenom: data.locatairePrenom,
      locataireEmail: data.locataireEmail,
      loyerCC: data.loyerCC,
      dateAttendue: new Date(data.dateAttendue),
      dateReelle: data.dateReelle ? new Date(data.dateReelle) : null,
      statut: data.statut ?? "attendu",
      montantRecu: data.montantRecu,
      mois: data.mois,
      notes: data.notes,
    },
  });
}

export async function getPaiements(bienId?: string, mois?: string) {
  const userId = await getUserId();
  const where: any = { userId };
  if (bienId) where.bienId = bienId;
  if (mois) where.mois = mois;
  return prisma.paiementBien.findMany({
    where,
    orderBy: { dateAttendue: "desc" },
  });
}

export async function updatePaiement(id: string, data: Record<string, any>) {
  const userId = await getUserId();
  const p = await prisma.paiementBien.findFirst({ where: { id, userId } });
  if (!p) throw new Error("Paiement introuvable");

  // Whitelist allowed fields to prevent mass assignment
  const allowedFields = ["montant", "datePaiement", "methodePaiement", "statut", "notes", "reference"] as const;
  const sanitized: Record<string, any> = {};
  for (const key of allowedFields) {
    if (key in data) sanitized[key] = data[key];
  }

  return prisma.paiementBien.update({ where: { id }, data: sanitized });
}

export async function deletePaiement(id: string) {
  const userId = await getUserId();
  const p = await prisma.paiementBien.findFirst({ where: { id, userId } });
  if (!p) throw new Error("Paiement introuvable");
  return prisma.paiementBien.delete({ where: { id } });
}
