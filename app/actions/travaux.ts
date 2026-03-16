"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireUser() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) throw new Error("Non autorisé");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");
  return user;
}

/* ─── Travaux CRUD ───────────────────────────────────────────────────────── */

export async function createTravaux(data: {
  bienId: string;
  titre: string;
  description?: string;
  categorie: string;
  statut?: string;
  budgetEstime?: number;
  dateDebut?: string;
  deductible?: boolean;
  edlEntreeId?: string;
  edlSortieId?: string;
}) {
  const user = await requireUser();
  const travaux = await prisma.travaux.create({
    data: {
      userId: user.id,
      bienId: data.bienId,
      titre: data.titre,
      description: data.description || null,
      categorie: data.categorie as never,
      statut: (data.statut as never) || "A_FAIRE",
      budgetEstime: data.budgetEstime ?? null,
      dateDebut: data.dateDebut ? new Date(data.dateDebut) : null,
      deductible: data.deductible ?? true,
      edlEntreeId: data.edlEntreeId || null,
      edlSortieId: data.edlSortieId || null,
    },
    include: { documents: true, devis: true, photos: true },
  });
  return travaux;
}

export async function getTravaux(bienId?: string) {
  const user = await requireUser();
  const where: { userId: string; bienId?: string } = { userId: user.id };
  if (bienId) where.bienId = bienId;
  return prisma.travaux.findMany({
    where,
    include: { documents: true, devis: true, photos: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTravauxById(id: string) {
  const user = await requireUser();
  return prisma.travaux.findFirst({
    where: { id, userId: user.id },
    include: { documents: true, devis: true, photos: true },
  });
}

export async function updateTravaux(
  id: string,
  data: {
    titre?: string;
    description?: string;
    statut?: string;
    categorie?: string;
    budgetEstime?: number | null;
    montantFinal?: number | null;
    dateDebut?: string | null;
    dateFin?: string | null;
    dateFinReelle?: string | null;
    artisanNom?: string | null;
    artisanTel?: string | null;
    artisanEmail?: string | null;
    deductible?: boolean;
    notes?: string | null;
    edlEntreeId?: string | null;
    edlSortieId?: string | null;
    montantDevis?: number | null;
    montantReel?: number | null;
    bienId?: string;
  }
) {
  const user = await requireUser();
  const existing = await prisma.travaux.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error("Travaux introuvables");

  const updateData: Record<string, unknown> = {};
  if (data.titre !== undefined) updateData.titre = data.titre;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.statut !== undefined) updateData.statut = data.statut;
  if (data.categorie !== undefined) updateData.categorie = data.categorie;
  if (data.budgetEstime !== undefined) updateData.budgetEstime = data.budgetEstime;
  if (data.montantFinal !== undefined) updateData.montantFinal = data.montantFinal;
  if (data.montantDevis !== undefined) updateData.montantDevis = data.montantDevis;
  if (data.montantReel !== undefined) updateData.montantReel = data.montantReel;
  if (data.dateDebut !== undefined) updateData.dateDebut = data.dateDebut ? new Date(data.dateDebut) : null;
  if (data.dateFin !== undefined) updateData.dateFin = data.dateFin ? new Date(data.dateFin) : null;
  if (data.dateFinReelle !== undefined) updateData.dateFinReelle = data.dateFinReelle ? new Date(data.dateFinReelle) : null;
  if (data.artisanNom !== undefined) updateData.artisanNom = data.artisanNom;
  if (data.artisanTel !== undefined) updateData.artisanTel = data.artisanTel;
  if (data.artisanEmail !== undefined) updateData.artisanEmail = data.artisanEmail;
  if (data.deductible !== undefined) updateData.deductible = data.deductible;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.edlEntreeId !== undefined) updateData.edlEntreeId = data.edlEntreeId;
  if (data.edlSortieId !== undefined) updateData.edlSortieId = data.edlSortieId;
  if (data.bienId !== undefined) updateData.bienId = data.bienId;

  return prisma.travaux.update({
    where: { id },
    data: updateData,
    include: { documents: true, devis: true, photos: true },
  });
}

export async function deleteTravaux(id: string) {
  const user = await requireUser();
  const existing = await prisma.travaux.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error("Travaux introuvables");
  await prisma.travaux.delete({ where: { id } });
  return { success: true };
}

/* ─── Devis ──────────────────────────────────────────────────────────────── */

export async function addDevis(
  travauxId: string,
  data: {
    entrepriseNom: string;
    entrepriseTel?: string;
    entrepriseEmail?: string;
    entrepriseSiret?: string;
    montantHT: number;
    montantTTC: number;
    tvaRate?: number;
    dateDevis?: string;
    validiteJours?: number;
    notes?: string;
    fichierUrl?: string;
  }
) {
  const user = await requireUser();
  const travaux = await prisma.travaux.findFirst({ where: { id: travauxId, userId: user.id } });
  if (!travaux) throw new Error("Travaux introuvables");

  return prisma.devisEntreprise.create({
    data: {
      travauxId,
      entrepriseNom: data.entrepriseNom,
      entrepriseTel: data.entrepriseTel || null,
      entrepriseEmail: data.entrepriseEmail || null,
      entrepriseSiret: data.entrepriseSiret || null,
      montantHT: data.montantHT,
      montantTTC: data.montantTTC,
      tvaRate: data.tvaRate ?? 10.0,
      dateDevis: data.dateDevis ? new Date(data.dateDevis) : null,
      validiteJours: data.validiteJours ?? 30,
      notes: data.notes || null,
      fichierUrl: data.fichierUrl || null,
    },
  });
}

export async function accepterDevis(devisId: string) {
  const user = await requireUser();
  const devis = await prisma.devisEntreprise.findUnique({ where: { id: devisId }, include: { travaux: true } });
  if (!devis || devis.travaux.userId !== user.id) throw new Error("Devis introuvable");

  await prisma.$transaction([
    prisma.devisEntreprise.update({ where: { id: devisId }, data: { statut: "accepte" } }),
    prisma.devisEntreprise.updateMany({
      where: { travauxId: devis.travauxId, id: { not: devisId } },
      data: { statut: "refuse" },
    }),
    prisma.travaux.update({
      where: { id: devis.travauxId },
      data: { montantDevis: devis.montantTTC },
    }),
  ]);

  return { success: true };
}

export async function deleteDevis(devisId: string) {
  const user = await requireUser();
  const devis = await prisma.devisEntreprise.findUnique({ where: { id: devisId }, include: { travaux: true } });
  if (!devis || devis.travaux.userId !== user.id) throw new Error("Devis introuvable");
  await prisma.devisEntreprise.delete({ where: { id: devisId } });
  return { success: true };
}

/* ─── Photos ─────────────────────────────────────────────────────────────── */

export async function addPhoto(
  travauxId: string,
  data: { url: string; type: string; description?: string }
) {
  const user = await requireUser();
  const travaux = await prisma.travaux.findFirst({ where: { id: travauxId, userId: user.id } });
  if (!travaux) throw new Error("Travaux introuvables");

  return prisma.photoTravaux.create({
    data: {
      travauxId,
      url: data.url,
      type: data.type,
      description: data.description || null,
    },
  });
}

export async function deletePhoto(photoId: string) {
  const user = await requireUser();
  const photo = await prisma.photoTravaux.findUnique({ where: { id: photoId }, include: { travaux: true } });
  if (!photo || photo.travaux.userId !== user.id) throw new Error("Photo introuvable");
  await prisma.photoTravaux.delete({ where: { id: photoId } });
  return { success: true };
}

/* ─── Fiscal ─────────────────────────────────────────────────────────────── */

export async function getTravauxDeductibles(annee: number) {
  const user = await requireUser();
  const debut = new Date(`${annee}-01-01T00:00:00Z`);
  const fin = new Date(`${annee + 1}-01-01T00:00:00Z`);

  return prisma.travaux.findMany({
    where: {
      userId: user.id,
      deductible: true,
      statut: "TERMINE",
      dateFinReelle: { gte: debut, lt: fin },
    },
    include: { devis: { where: { statut: "accepte" } } },
    orderBy: { dateFinReelle: "asc" },
  });
}

/* ─── EDL link helpers ───────────────────────────────────────────────────── */

export async function getEdlForBien(bienId: string) {
  const user = await requireUser();
  return prisma.etatDesLieux.findMany({
    where: { userId: user.id, bienId },
    orderBy: { date: "desc" },
  });
}
