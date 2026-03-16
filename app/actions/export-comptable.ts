"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) throw new Error("Non autorisé");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");
  return user.id;
}

async function getTeamUserIds(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { teamId: true, teamRole: true },
  });
  if (user?.teamId && (user.teamRole === "OWNER" || user.teamRole === "ADMIN")) {
    const members = await prisma.user.findMany({
      where: { teamId: user.teamId },
      select: { id: true },
    });
    return members.map((m) => m.id);
  }
  return [userId];
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "");
}

function formatDateISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatMontant(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

export async function exportFEC(annee: number): Promise<string> {
  const userId = await getUserId();
  const userIds = await getTeamUserIds(userId);

  const debut = new Date(annee, 0, 1);
  const fin = new Date(annee, 11, 31, 23, 59, 59);

  const [paiements, travaux, biens] = await Promise.all([
    prisma.paiementBien.findMany({
      where: {
        userId: { in: userIds },
        dateAttendue: { gte: debut, lte: fin },
        statut: { in: ["paye", "partiel"] },
      },
      orderBy: { dateAttendue: "asc" },
    }),
    prisma.travaux.findMany({
      where: {
        userId: { in: userIds },
        dateFin: { gte: debut, lte: fin },
        statut: "TERMINE",
        montantReel: { not: null },
      },
      orderBy: { dateFin: "asc" },
    }),
    prisma.bien.findMany({
      where: { userId: { in: userIds } },
      select: { id: true, adresse: true },
    }),
  ]);

  const bienMap: Record<string, string> = {};
  biens.forEach((b) => { bienMap[b.id] = b.adresse; });

  const header = [
    "JournalCode", "JournalLib", "EcritureNum", "EcritureDate",
    "CompteNum", "CompteLib", "CompAuxNum", "CompAuxLib",
    "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit",
    "EcritureLet", "DateLet", "ValidDate", "Montantdevise", "Idevise",
  ].join("|");

  const lines: string[] = [header];
  let ecritureNum = 1;

  for (const p of paiements) {
    const date = p.dateReelle ?? p.dateAttendue;
    const dateStr = formatDate(date);
    const montant = p.montantRecu ?? p.loyerCC;
    const bien = bienMap[p.bienId] || p.bienId;
    const ref = `LOY-${p.mois}-${p.id.slice(-6)}`;

    lines.push([
      "VT", "Ventes / Loyers", String(ecritureNum).padStart(6, "0"), dateStr,
      "411000", "Locataires", "", p.locataireNom,
      ref, dateStr, `Loyer ${p.mois} - ${bien}`,
      formatMontant(montant), formatMontant(0),
      "", "", dateStr, "", "EUR",
    ].join("|"));

    lines.push([
      "VT", "Ventes / Loyers", String(ecritureNum).padStart(6, "0"), dateStr,
      "706100", "Loyers", "", "",
      ref, dateStr, `Loyer ${p.mois} - ${bien}`,
      formatMontant(0), formatMontant(montant),
      "", "", dateStr, "", "EUR",
    ].join("|"));

    ecritureNum++;
  }

  for (const t of travaux) {
    const date = t.dateFin ?? t.dateFinReelle ?? new Date();
    const dateStr = formatDate(date);
    const montant = t.montantReel ?? 0;
    const bien = bienMap[t.bienId] || t.bienId;
    const ref = `TRX-${t.id.slice(-6)}`;

    lines.push([
      "AC", "Achats / Charges", String(ecritureNum).padStart(6, "0"), dateStr,
      "615100", "Travaux entretien", "", t.artisanNom || "",
      ref, dateStr, `${t.titre} - ${bien}`,
      formatMontant(montant), formatMontant(0),
      "", "", dateStr, "", "EUR",
    ].join("|"));

    lines.push([
      "AC", "Achats / Charges", String(ecritureNum).padStart(6, "0"), dateStr,
      "401000", "Fournisseurs", "", t.artisanNom || "",
      ref, dateStr, `${t.titre} - ${bien}`,
      formatMontant(0), formatMontant(montant),
      "", "", dateStr, "", "EUR",
    ].join("|"));

    ecritureNum++;
  }

  await prisma.auditLog.create({
    data: { userId, action: "EXPORT_FEC", details: `Export FEC année ${annee}` },
  });

  return lines.join("\r\n");
}

export async function exportCSV(annee: number): Promise<string> {
  const userId = await getUserId();
  const userIds = await getTeamUserIds(userId);

  const debut = new Date(annee, 0, 1);
  const fin = new Date(annee, 11, 31, 23, 59, 59);

  const [paiements, travaux, biens] = await Promise.all([
    prisma.paiementBien.findMany({
      where: {
        userId: { in: userIds },
        dateAttendue: { gte: debut, lte: fin },
      },
      orderBy: { dateAttendue: "asc" },
    }),
    prisma.travaux.findMany({
      where: {
        userId: { in: userIds },
        OR: [
          { dateFin: { gte: debut, lte: fin } },
          { dateDebut: { gte: debut, lte: fin } },
        ],
      },
      orderBy: { dateDebut: "asc" },
    }),
    prisma.bien.findMany({
      where: { userId: { in: userIds } },
      select: { id: true, adresse: true },
    }),
  ]);

  const bienMap: Record<string, string> = {};
  biens.forEach((b) => { bienMap[b.id] = b.adresse; });

  const header = "Date;Type;Description;Bien;Montant;Statut";
  const lines: string[] = [header];

  for (const p of paiements) {
    const date = formatDateISO(p.dateReelle ?? p.dateAttendue);
    const montant = p.montantRecu ?? p.loyerCC;
    const bien = bienMap[p.bienId] || p.bienId;
    lines.push([
      date,
      "Loyer",
      `Loyer ${p.mois} - ${p.locataireNom}`,
      `"${bien}"`,
      formatMontant(montant),
      p.statut,
    ].join(";"));
  }

  for (const t of travaux) {
    const date = formatDateISO(t.dateFin ?? t.dateDebut ?? t.createdAt);
    const montant = t.montantReel ?? t.montantDevis ?? 0;
    const bien = bienMap[t.bienId] || t.bienId;
    lines.push([
      date,
      "Travaux",
      `"${t.titre}"`,
      `"${bien}"`,
      formatMontant(montant),
      t.statut,
    ].join(";"));
  }

  await prisma.auditLog.create({
    data: { userId, action: "EXPORT_CSV", details: `Export CSV année ${annee}` },
  });

  return lines.join("\r\n");
}
