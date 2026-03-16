"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface Notification {
  id: string;
  type: "loyer_retard" | "diagnostic_expirant" | "bail_fin" | "edl_planifier";
  titre: string;
  description: string;
  date: string;
  severity: "danger" | "warning" | "info";
}

export async function getNotifications(): Promise<Notification[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return [];

  const now = new Date();
  const notifications: Notification[] = [];

  // Loyers en retard
  const impayes = await prisma.paiementBien.findMany({
    where: { userId: user.id, statut: { in: ["retard", "impaye"] } },
    orderBy: { dateAttendue: "desc" },
    take: 10,
  });
  for (const p of impayes) {
    notifications.push({
      id: `loyer-${p.id}`,
      type: "loyer_retard",
      titre: `Loyer impaye — ${p.locataireNom}`,
      description: `${p.loyerCC.toLocaleString("fr-FR")} EUR attendu pour ${p.mois}`,
      date: p.dateAttendue.toISOString(),
      severity: "danger",
    });
  }

  // Diagnostics expirants dans 30j
  const dans30j = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const diags = await prisma.diagnosticBien.findMany({
    where: {
      userId: user.id,
      dateExpiration: { lte: dans30j, gte: now },
      nonConcerne: false,
    },
    orderBy: { dateExpiration: "asc" },
    take: 10,
  });
  for (const d of diags) {
    const jours = Math.ceil((d.dateExpiration!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    notifications.push({
      id: `diag-${d.id}`,
      type: "diagnostic_expirant",
      titre: `Diagnostic ${d.type} expire dans ${jours}j`,
      description: `Bien ${d.bienId}`,
      date: d.dateExpiration!.toISOString(),
      severity: jours <= 7 ? "danger" : "warning",
    });
  }

  // Bails qui se terminent dans 60j
  const dans60j = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const bails = await prisma.bailActif.findMany({
    where: {
      userId: user.id,
      statut: "ACTIF",
      dateFin: { lte: dans60j, gte: now },
    },
    orderBy: { dateFin: "asc" },
    take: 10,
  });
  for (const b of bails) {
    const jours = Math.ceil((b.dateFin!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    notifications.push({
      id: `bail-${b.id}`,
      type: "bail_fin",
      titre: `Bail termine dans ${jours}j`,
      description: `${b.locataireNom} — ${b.bienId}`,
      date: b.dateFin!.toISOString(),
      severity: jours <= 30 ? "danger" : "warning",
    });
  }

  // EDL a planifier (bails en preavis sans EDL sortie)
  const bailsPreavis = await prisma.bailActif.findMany({
    where: { userId: user.id, statut: "PREAVIS" },
    select: { id: true, bienId: true, locataireNom: true, dateSortie: true },
  });
  for (const b of bailsPreavis) {
    const edlSortie = await prisma.etatDesLieux.findFirst({
      where: { bailId: b.id, type: "SORTIE" },
    });
    if (!edlSortie) {
      notifications.push({
        id: `edl-${b.id}`,
        type: "edl_planifier",
        titre: "EDL de sortie a planifier",
        description: `${b.locataireNom} — ${b.bienId}`,
        date: b.dateSortie?.toISOString() ?? now.toISOString(),
        severity: "warning",
      });
    }
  }

  return notifications.sort((a, b) => {
    const severityOrder = { danger: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
