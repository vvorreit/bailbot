import { prisma } from "@/lib/db";

export type ScoreSante = "VERT" | "ORANGE" | "ROUGE";

export interface SanteResult {
  bienId: string;
  adresse: string;
  score: ScoreSante;
  details: string[];
}

export async function calculerSante(bienId: string, userId: string): Promise<SanteResult> {
  const bien = await prisma.bien.findFirst({
    where: { id: bienId, userId },
    select: { id: true, adresse: true, statut: true },
  });

  if (!bien) return { bienId, adresse: "Inconnu", score: "VERT", details: [] };

  const details: string[] = [];
  let score: ScoreSante = "VERT";

  const now = new Date();
  const il30j = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dans30j = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const paiements = await prisma.paiementBien.findMany({
    where: { bienId, userId, statut: { in: ["retard", "impaye"] } },
    select: { mois: true, dateAttendue: true, statut: true, locataireNom: true },
  });

  for (const p of paiements) {
    const joursRetard = Math.ceil((now.getTime() - p.dateAttendue.getTime()) / (1000 * 60 * 60 * 24));
    if (joursRetard > 30) {
      score = "ROUGE";
      details.push(`Loyer ${p.mois} impayé depuis ${joursRetard} jours`);
    } else if (joursRetard > 0) {
      if (score !== "ROUGE") score = "ORANGE";
      details.push(`Loyer ${p.mois} en retard de ${joursRetard} jours`);
    }
  }

  const diagnostics = await prisma.diagnosticBien.findMany({
    where: { bienId, userId, nonConcerne: false },
    select: { type: true, dateExpiration: true },
  });

  for (const d of diagnostics) {
    if (!d.dateExpiration) continue;
    const joursAvantExpiration = Math.ceil((d.dateExpiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (joursAvantExpiration < -30) {
      score = "ROUGE";
      details.push(`${d.type} expiré depuis ${Math.abs(joursAvantExpiration)} jours`);
    } else if (joursAvantExpiration < 0) {
      if (score !== "ROUGE") score = "ORANGE";
      details.push(`${d.type} expiré depuis ${Math.abs(joursAvantExpiration)} jours`);
    } else if (joursAvantExpiration <= 30) {
      if (score !== "ROUGE") score = "ORANGE";
      details.push(`${d.type} expire dans ${joursAvantExpiration} jours`);
    }
  }

  const bails = await prisma.bailActif.findMany({
    where: { bienId, userId },
    select: {
      id: true,
      statut: true,
      dateSortie: true,
      dateDebut: true,
      locataireNom: true,
    },
  });

  for (const bail of bails) {
    if (bail.statut === "TERMINE" && bail.dateSortie) {
      const edlSortie = await prisma.etatDesLieux.findFirst({
        where: { bienId, userId, type: "SORTIE" },
      });
      if (!edlSortie) {
        score = "ROUGE";
        details.push(`Bail terminé sans EDL de sortie — ${bail.locataireNom}`);
      }
    }

    if (bail.statut === "ACTIF") {
      const joursDepuisDebut = Math.ceil((now.getTime() - bail.dateDebut.getTime()) / (1000 * 60 * 60 * 24));
      if (joursDepuisDebut > 30) {
        const edlEntree = await prisma.etatDesLieux.findFirst({
          where: { bienId, userId, type: "ENTREE" },
        });
        if (!edlEntree) {
          if (score !== "ROUGE") score = "ORANGE";
          details.push(`EDL d'entrée manquant — ${bail.locataireNom}`);
        }
      }
    }
  }

  const moisCourant = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const bailsActifs = bails.filter((b) => b.statut === "ACTIF" || b.statut === "PREAVIS");
  if (bailsActifs.length > 0) {
    const quittanceMois = await prisma.quittanceAuto.findFirst({
      where: { bailId: { in: bailsActifs.map((b) => b.id) }, mois: moisCourant },
    });
    if (!quittanceMois) {
      if (score !== "ROUGE") score = "ORANGE";
      details.push(`Quittance de ${moisCourant} non envoyée`);
    }
  }

  return { bienId: bien.id, adresse: bien.adresse, score, details };
}
