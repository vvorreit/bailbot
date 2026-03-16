"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface TimelineEvent {
  date: string;
  type: "creation" | "quittance" | "paiement_ok" | "paiement_retard" | "demande" | "relance" | "edl" | "travaux" | "fin";
  description: string;
  metadata?: Record<string, string>;
}

export async function getTimelineLocataire(bailId: string): Promise<TimelineEvent[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return [];

  const bail = await prisma.bailActif.findFirst({
    where: { id: bailId, userId: user.id },
    select: {
      id: true,
      bienId: true,
      locataireNom: true,
      dateDebut: true,
      dateFin: true,
      dateSortie: true,
      statut: true,
      quittancesAuto: {
        orderBy: { envoyeeLe: "asc" },
        select: { id: true, mois: true, envoyeeLe: true },
      },
      relancesLoyer: {
        orderBy: { createdAt: "asc" },
        select: { id: true, mois: true, objet: true, createdAt: true },
      },
    },
  });
  if (!bail) return [];

  const events: TimelineEvent[] = [];

  events.push({
    date: bail.dateDebut.toISOString(),
    type: "creation",
    description: `Début du bail — ${bail.locataireNom}`,
  });

  for (const q of bail.quittancesAuto) {
    events.push({
      date: q.envoyeeLe.toISOString(),
      type: "quittance",
      description: `Quittance ${q.mois} envoyée`,
      metadata: { mois: q.mois },
    });
  }

  const paiements = await prisma.paiementBien.findMany({
    where: { bienId: bail.bienId, userId: user.id },
    orderBy: { dateAttendue: "asc" },
    select: { id: true, mois: true, statut: true, dateAttendue: true, dateReelle: true, montantRecu: true, loyerCC: true, locataireNom: true },
  });

  for (const p of paiements) {
    const isPaid = p.statut === "paye";
    events.push({
      date: (p.dateReelle ?? p.dateAttendue).toISOString(),
      type: isPaid ? "paiement_ok" : "paiement_retard",
      description: isPaid
        ? `Paiement ${p.mois} reçu — ${(p.montantRecu ?? p.loyerCC).toLocaleString("fr-FR")} €`
        : `Paiement ${p.mois} ${p.statut === "retard" ? "en retard" : p.statut === "impaye" ? "impayé" : "attendu"}`,
      metadata: { mois: p.mois, statut: p.statut },
    });
  }

  const espaceLocataire = await prisma.espaceLocataire.findFirst({
    where: { bailId: bail.id },
    select: {
      demandes: {
        orderBy: { createdAt: "asc" },
        select: { id: true, type: true, message: true, statut: true, createdAt: true },
      },
    },
  });

  if (espaceLocataire) {
    for (const d of espaceLocataire.demandes) {
      events.push({
        date: d.createdAt.toISOString(),
        type: "demande",
        description: `Demande locataire : ${d.type.toLowerCase()} — ${d.message.slice(0, 60)}${d.message.length > 60 ? "…" : ""}`,
        metadata: { statut: d.statut },
      });
    }
  }

  for (const r of bail.relancesLoyer) {
    events.push({
      date: r.createdAt.toISOString(),
      type: "relance",
      description: `Relance loyer ${r.mois} — ${r.objet}`,
    });
  }

  const edls = await prisma.etatDesLieux.findMany({
    where: { bienId: bail.bienId, userId: user.id },
    orderBy: { date: "asc" },
    select: { id: true, type: true, date: true },
  });

  for (const e of edls) {
    events.push({
      date: e.date.toISOString(),
      type: "edl",
      description: `État des lieux ${e.type === "ENTREE" ? "d'entrée" : "de sortie"}`,
    });
  }

  const travaux = await prisma.travaux.findMany({
    where: { bienId: bail.bienId, userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, titre: true, statut: true, categorie: true, createdAt: true },
  });

  for (const t of travaux) {
    events.push({
      date: t.createdAt.toISOString(),
      type: "travaux",
      description: `Travaux : ${t.titre} (${t.statut.replace("_", " ").toLowerCase()})`,
    });
  }

  if (bail.dateSortie || (bail.dateFin && bail.statut === "TERMINE")) {
    const finDate = bail.dateSortie ?? bail.dateFin;
    if (finDate) {
      events.push({
        date: finDate.toISOString(),
        type: "fin",
        description: "Fin du bail",
      });
    }
  }

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return events;
}
