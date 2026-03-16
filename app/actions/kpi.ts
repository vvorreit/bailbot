"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getDashboardKPIs() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return null;

  const now = new Date();
  const moisCourant = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Loyers encaisses ce mois vs total attendu
  const paiementsMois = await prisma.paiementBien.findMany({
    where: { userId: user.id, mois: moisCourant },
  });
  const loyersEncaisses = paiementsMois
    .filter((p) => p.statut === "paye")
    .reduce((sum, p) => sum + (p.montantRecu ?? p.loyerCC), 0);
  const loyersAttendus = paiementsMois.reduce((sum, p) => sum + p.loyerCC, 0);

  // Taux d'occupation
  const totalBiens = await prisma.bien.count({ where: { userId: user.id } });
  const biensAvecBailActif = await prisma.bailActif.findMany({
    where: { userId: user.id, statut: "ACTIF" },
    select: { bienId: true },
    distinct: ["bienId"],
  });
  const tauxOccupation = totalBiens > 0 ? Math.round((biensAvecBailActif.length / totalBiens) * 100) : 0;

  // Impayes en cours
  const nbImpayes = await prisma.paiementBien.count({
    where: { userId: user.id, statut: { in: ["retard", "impaye"] } },
  });

  // Prochaines echeances
  const dans30j = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const bailsExpirants = await prisma.bailActif.findMany({
    where: {
      userId: user.id,
      statut: "ACTIF",
      dateFin: { lte: dans30j, gte: now },
    },
    select: { id: true, bienId: true, dateFin: true, locataireNom: true },
  });

  const diagsExpirants = await prisma.diagnosticBien.findMany({
    where: {
      userId: user.id,
      dateExpiration: { lte: dans30j, gte: now },
      nonConcerne: false,
    },
    select: { id: true, bienId: true, type: true, dateExpiration: true },
  });

  return {
    loyersEncaisses,
    loyersAttendus,
    tauxOccupation,
    nbImpayes,
    bailsExpirants: bailsExpirants.map((b) => ({
      id: b.id,
      bienId: b.bienId,
      dateFin: b.dateFin?.toISOString() ?? null,
      locataireNom: b.locataireNom,
    })),
    diagsExpirants: diagsExpirants.map((d) => ({
      id: d.id,
      bienId: d.bienId,
      type: d.type,
      dateExpiration: d.dateExpiration?.toISOString() ?? null,
    })),
  };
}
