"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculerKPIs } from "@/lib/calculs-rendement";
import { genererTableauAmortissement } from "@/lib/amortissement";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Non autorisé");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("Utilisateur introuvable");
  return user;
}

async function getTeamUserIds(teamId: string): Promise<string[]> {
  const members = await prisma.user.findMany({
    where: { teamId },
    select: { id: true },
  });
  return members.map((m) => m.id);
}

export async function getPortefeuilleFinancier() {
  const user = await getUser();

  let userIds: string[];
  if (user.teamId && (user.teamRole === "OWNER" || user.teamRole === "ADMIN")) {
    userIds = await getTeamUserIds(user.teamId);
  } else {
    userIds = [user.id];
  }

  const biens = await prisma.bien.findMany({
    where: { userId: { in: userIds } },
    orderBy: { createdAt: "desc" },
  });

  const bienIds = biens.map((b) => b.id);

  const bails = await prisma.bailActif.findMany({
    where: {
      bienId: { in: bienIds },
      statut: { in: ["ACTIF", "PREAVIS"] },
    },
  });

  const prets = await prisma.pretImmobilier.findMany({
    where: { userId: { in: userIds } },
  });

  const rows = biens.map((bien) => {
    const bail = bails.find((b) => b.bienId === bien.id);
    const pretsBien = prets.filter((p) => p.bienId === bien.id);
    const pretPrincipal = pretsBien[0];

    let mensualiteCredit = 0;
    let capitalRestant = 0;

    if (pretPrincipal) {
      const tableau = genererTableauAmortissement({
        capitalEmprunte: Number(pretPrincipal.capitalEmprunte),
        tauxAnnuelPct: Number(pretPrincipal.tauxAnnuelPct),
        dureeMois: pretPrincipal.dureeMois,
        dateDebut: pretPrincipal.dateDebut,
        assuranceMensuelle: Number(pretPrincipal.assuranceMensuelle ?? 0),
      });
      mensualiteCredit = tableau.mensualiteAvecAssurance;

      const now = new Date();
      const debut = new Date(pretPrincipal.dateDebut);
      const moisEcoules = (now.getFullYear() - debut.getFullYear()) * 12 + (now.getMonth() - debut.getMonth());
      const idx = Math.max(0, Math.min(moisEcoules - 1, tableau.echeances.length - 1));
      capitalRestant = tableau.echeances[idx]?.capitalRestant ?? Number(pretPrincipal.capitalEmprunte);
    }

    const prixAchat = bail ? Number(bail.prixAchat ?? 0) : 0;
    let rendementBrut = 0;
    let rendementNet = 0;
    let cashFlowMensuel = 0;

    if (bail && prixAchat > 0) {
      const kpis = calculerKPIs({
        prixAchat,
        loyerMensuelHC: bail.loyerMensuel,
        chargesMensuelles: bail.chargesMensuelles,
        taxeFonciere: Number(bail.taxeFonciere ?? 0),
        chargesAnnuelles: Number(bail.chargesAnnuelles ?? 0),
        fraisGestionPct: Number(bail.fraisGestionPct ?? 0),
        trancheMarginalePct: Number(bail.trancheMarginalePct ?? 30),
        mensualiteCredit,
      });
      rendementBrut = kpis.rendementBrut;
      rendementNet = kpis.rendementNet;
      cashFlowMensuel = kpis.cashFlowMensuel;
    }

    const loyerCC = bail ? bail.loyerMensuel + bail.chargesMensuelles : bien.loyer + bien.charges;

    return {
      bienId: bien.id,
      adresse: bien.adresse,
      loyerCC,
      rendementBrut,
      rendementNet,
      cashFlowMensuel,
      mensualiteCredit,
      capitalRestant,
      hasBail: !!bail,
      hasPret: !!pretPrincipal,
    };
  });

  const totaux = {
    revenuMensuel: rows.reduce((s, r) => s + r.loyerCC, 0),
    cashFlowNet: rows.reduce((s, r) => s + r.cashFlowMensuel, 0),
    encoursTotal: rows.reduce((s, r) => s + r.capitalRestant, 0),
    mensualitesTotales: rows.reduce((s, r) => s + r.mensualiteCredit, 0),
  };

  return { rows, totaux };
}
