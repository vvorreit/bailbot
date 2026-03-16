"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface AgendaEvent {
  id: string;
  type: "fin_bail" | "edl" | "diagnostic" | "revision_irl" | "relance";
  titre: string;
  date: string;
  bienId?: string;
  color: string;
}

export async function getAgendaEvents(mois: number, annee: number): Promise<AgendaEvent[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return [];

  const debut = new Date(annee, mois, 1);
  const fin = new Date(annee, mois + 1, 0, 23, 59, 59);
  const events: AgendaEvent[] = [];

  // Fins de bail
  const bails = await prisma.bailActif.findMany({
    where: { userId: user.id, dateFin: { gte: debut, lte: fin } },
    select: { id: true, bienId: true, locataireNom: true, dateFin: true },
  });
  for (const b of bails) {
    if (b.dateFin) {
      events.push({
        id: `bail-${b.id}`,
        type: "fin_bail",
        titre: `Fin bail — ${b.locataireNom}`,
        date: b.dateFin.toISOString(),
        bienId: b.bienId,
        color: "red",
      });
    }
  }

  // EDL
  const edls = await prisma.etatDesLieux.findMany({
    where: { userId: user.id, date: { gte: debut, lte: fin } },
    select: { id: true, bienId: true, type: true, date: true },
  });
  for (const e of edls) {
    events.push({
      id: `edl-${e.id}`,
      type: "edl",
      titre: `EDL ${e.type === "ENTREE" ? "entree" : "sortie"}`,
      date: e.date.toISOString(),
      bienId: e.bienId,
      color: "blue",
    });
  }

  // Diagnostics expirants
  const diags = await prisma.diagnosticBien.findMany({
    where: {
      userId: user.id,
      dateExpiration: { gte: debut, lte: fin },
      nonConcerne: false,
    },
    select: { id: true, bienId: true, type: true, dateExpiration: true },
  });
  for (const d of diags) {
    if (d.dateExpiration) {
      events.push({
        id: `diag-${d.id}`,
        type: "diagnostic",
        titre: `Diagnostic ${d.type} expire`,
        date: d.dateExpiration.toISOString(),
        bienId: d.bienId,
        color: "amber",
      });
    }
  }

  // Revisions IRL
  const bailsRevision = await prisma.bailActif.findMany({
    where: {
      userId: user.id,
      statut: "ACTIF",
      dateProchRevision: { gte: debut, lte: fin },
    },
    select: { id: true, bienId: true, locataireNom: true, dateProchRevision: true },
  });
  for (const b of bailsRevision) {
    events.push({
      id: `irl-${b.id}`,
      type: "revision_irl",
      titre: `Revision IRL — ${b.locataireNom}`,
      date: b.dateProchRevision.toISOString(),
      bienId: b.bienId,
      color: "emerald",
    });
  }

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
