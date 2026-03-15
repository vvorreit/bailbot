"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function toggleRechercheMasquee(): Promise<
  { rechercheMasquee: boolean } | { error: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Non autorisé." };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return { error: "Utilisateur introuvable." };

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { rechercheMasquee: !user.rechercheMasquee },
    select: { rechercheMasquee: true },
  });

  return { rechercheMasquee: updated.rechercheMasquee };
}
