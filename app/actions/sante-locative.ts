"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculerSante, type SanteResult } from "@/lib/sante-locative";

export async function getSantePortfolio(): Promise<SanteResult[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return [];

  const biens = await prisma.bien.findMany({
    where: { userId: user.id },
    select: { id: true },
  });

  const results = await Promise.all(
    biens.map((b) => calculerSante(b.id, user.id))
  );

  return results;
}
