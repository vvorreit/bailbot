"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mailer";

export interface EdlPieceData {
  nom: string;
  elements: {
    nom: string;
    etat: string;
    commentaire: string;
    photos: string[];
  }[];
}

export interface EdlCompteursData {
  eauFroide?: string;
  eauChaude?: string;
  gaz?: string;
  electricite?: string;
  photosCompteurs?: string[];
}

export interface EdlClesData {
  nombre: number;
  type: string;
}

export interface CreateEdlInput {
  bienId: string;
  bailId?: string;
  type: "ENTREE" | "SORTIE";
  date: string;
  heure?: string;
  locataireNom: string;
  bailleurNom: string;
  pieces: EdlPieceData[];
  compteurs: EdlCompteursData;
  cles: EdlClesData;
  signatureLocataire?: string;
  signatureBailleur?: string;
}

export async function createEDL(input: CreateEdlInput): Promise<{ id: string } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Non autorisé" };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return { error: "Utilisateur introuvable" };

  const edl = await prisma.etatDesLieux.create({
    data: {
      userId: user.id,
      bienId: input.bienId,
      bailId: input.bailId || null,
      type: input.type,
      date: new Date(input.date),
      pieces: input.pieces as any,
      compteurs: {
        eauFroide: input.compteurs.eauFroide,
        eauChaude: input.compteurs.eauChaude,
        gaz: input.compteurs.gaz,
        electricite: input.compteurs.electricite,
        photosCompteurs: input.compteurs.photosCompteurs,
      },
      cles: { nombre: input.cles.nombre, type: input.cles.type },
      signatureLocataire: input.signatureLocataire || null,
      signatureBailleur: input.signatureBailleur || null,
    },
  });

  return { id: edl.id };
}

export async function getEdlsByBien(bienId: string): Promise<any[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return [];

  return prisma.etatDesLieux.findMany({
    where: { userId: user.id, bienId },
    orderBy: { date: "desc" },
  });
}

export async function getEdlById(edlId: string): Promise<any | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return null;

  return prisma.etatDesLieux.findFirst({
    where: { id: edlId, userId: user.id },
  });
}

export async function sendEdlByEmail(
  edlId: string,
  locataireEmail: string,
  bailleurEmail: string,
): Promise<{ success: boolean }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { success: false };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return { success: false };

  const edl = await prisma.etatDesLieux.findFirst({
    where: { id: edlId, userId: user.id },
  });
  if (!edl) return { success: false };

  const bien = await prisma.bien.findFirst({
    where: { id: edl.bienId, userId: user.id },
  });

  const typeLabel = edl.type === "ENTREE" ? "d'entrée" : "de sortie";
  const dateStr = new Date(edl.date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 32px 24px;">
    <h2 style="color: #0f172a; margin-top: 0;">📋 État des lieux ${typeLabel}</h2>
    <p>L'état des lieux ${typeLabel} a été réalisé le ${dateStr} pour le bien :</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Adresse :</strong> ${bien?.adresse || "—"}</p>
      <p style="margin: 4px 0;"><strong>Date :</strong> ${dateStr}</p>
      <p style="margin: 4px 0;"><strong>Type :</strong> ${edl.type === "ENTREE" ? "Entrée" : "Sortie"}</p>
    </div>
    <p>Connectez-vous à BailBot pour consulter le détail et télécharger le PDF.</p>
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    BailBot · contact@optibot.fr
  </p>
</div>`;

  const emails = [locataireEmail, bailleurEmail].filter(Boolean);
  for (const email of emails) {
    try {
      await sendMail({
        to: email,
        subject: `[BailBot] État des lieux ${typeLabel} — ${bien?.adresse || ""}`,
        html,
      });
    } catch {
      /* non-bloquant */
    }
  }

  return { success: true };
}

export async function getBiensForEdl(): Promise<{ id: string; adresse: string; locataireNom?: string | null }[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return [];

  const biens = await prisma.bien.findMany({
    where: { userId: user.id },
    select: { id: true, adresse: true, locataireNom: true },
    orderBy: { adresse: "asc" },
  });

  return biens;
}

export async function getBailsForBien(bienId: string): Promise<{ id: string; locataireNom: string; statut: string }[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return [];

  return prisma.bailActif.findMany({
    where: { userId: user.id, bienId },
    select: { id: true, locataireNom: true, statut: true },
    orderBy: { dateDebut: "desc" },
  });
}
