"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { genererTableauAmortissement, type TableauAmortissement } from "@/lib/amortissement";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Non autorisé");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("Utilisateur introuvable");
  return user;
}

async function getUserId(): Promise<string> {
  const user = await getUser();
  return user.id;
}

export async function createPret(
  bienId: string | null,
  data: {
    nom?: string;
    capitalEmprunte: number;
    tauxAnnuelPct: number;
    dureeMois: number;
    dateDebut: string;
    typeAmortissement?: string;
    assuranceMensuelle?: number;
    fraisDossier?: number;
    garantie?: number;
  }
) {
  const userId = await getUserId();
  return prisma.pretImmobilier.create({
    data: {
      userId,
      bienId,
      nom: data.nom ?? "Pret principal",
      capitalEmprunte: data.capitalEmprunte,
      tauxAnnuelPct: data.tauxAnnuelPct,
      dureeMois: data.dureeMois,
      dateDebut: new Date(data.dateDebut),
      typeAmortissement: data.typeAmortissement ?? "classique",
      assuranceMensuelle: data.assuranceMensuelle ?? 0,
      fraisDossier: data.fraisDossier ?? 0,
      garantie: data.garantie ?? 0,
    },
  });
}

export async function getPrets(bienId: string) {
  const userId = await getUserId();
  return prisma.pretImmobilier.findMany({
    where: { userId, bienId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPretsUser() {
  const userId = await getUserId();
  return prisma.pretImmobilier.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updatePret(
  id: string,
  data: {
    nom?: string;
    capitalEmprunte?: number;
    tauxAnnuelPct?: number;
    dureeMois?: number;
    dateDebut?: string;
    typeAmortissement?: string;
    assuranceMensuelle?: number;
    fraisDossier?: number;
    garantie?: number;
  }
) {
  const userId = await getUserId();
  const pret = await prisma.pretImmobilier.findFirst({ where: { id, userId } });
  if (!pret) throw new Error("Prêt introuvable");

  const updateData: Record<string, unknown> = { ...data };
  if (data.dateDebut) updateData.dateDebut = new Date(data.dateDebut);

  return prisma.pretImmobilier.update({ where: { id }, data: updateData });
}

export async function deletePret(id: string) {
  const userId = await getUserId();
  const pret = await prisma.pretImmobilier.findFirst({ where: { id, userId } });
  if (!pret) throw new Error("Prêt introuvable");
  return prisma.pretImmobilier.delete({ where: { id } });
}

export async function getTableauAmortissement(pretId: string): Promise<TableauAmortissement> {
  const userId = await getUserId();
  const pret = await prisma.pretImmobilier.findFirst({ where: { id: pretId, userId } });
  if (!pret) throw new Error("Prêt introuvable");

  return genererTableauAmortissement({
    capitalEmprunte: Number(pret.capitalEmprunte),
    tauxAnnuelPct: Number(pret.tauxAnnuelPct),
    dureeMois: pret.dureeMois,
    dateDebut: pret.dateDebut,
    assuranceMensuelle: Number(pret.assuranceMensuelle ?? 0),
    fraisDossier: Number(pret.fraisDossier ?? 0),
    garantie: Number(pret.garantie ?? 0),
  });
}

export async function getEcheanceDuMois(pretId: string, dateStr?: string): Promise<{
  mensualite: number;
  capital: number;
  interets: number;
  assurance: number;
  capitalRestant: number;
  moisNumero: number;
} | null> {
  const userId = await getUserId();
  const pret = await prisma.pretImmobilier.findFirst({ where: { id: pretId, userId } });
  if (!pret) return null;

  const tableau = genererTableauAmortissement({
    capitalEmprunte: Number(pret.capitalEmprunte),
    tauxAnnuelPct: Number(pret.tauxAnnuelPct),
    dureeMois: pret.dureeMois,
    dateDebut: pret.dateDebut,
    assuranceMensuelle: Number(pret.assuranceMensuelle ?? 0),
  });

  const target = dateStr ? new Date(dateStr) : new Date();
  const targetKey = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;

  const echeance = tableau.echeances.find((e) => {
    const eKey = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
    return eKey === targetKey;
  });

  if (!echeance) return null;

  return {
    mensualite: echeance.mensualite,
    capital: echeance.capital,
    interets: echeance.interets,
    assurance: echeance.assurance,
    capitalRestant: echeance.capitalRestant,
    moisNumero: echeance.mois,
  };
}
