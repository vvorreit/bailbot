"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getNbImpayes(): Promise<number> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return 0;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return 0;

  return prisma.paiementBien.count({
    where: {
      userId: user.id,
      statut: { in: ["retard", "impaye"] },
    },
  });
}
