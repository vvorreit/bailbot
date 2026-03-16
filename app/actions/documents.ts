"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getDocuments(bienId?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return [];

  const where: any = { userId: user.id };
  if (bienId) where.bienId = bienId;

  return prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteDocument(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Non authentifie");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) throw new Error("Utilisateur introuvable");

  await prisma.document.deleteMany({
    where: { id, userId: user.id },
  });

  return { success: true };
}
