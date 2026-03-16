"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Metier } from "@prisma/client";

async function getSession() {
  return await getServerSession(authOptions);
}

export async function saveOnboardingStep1(metier: Metier) {
  const session = await getSession();
  if (!session?.user?.email) throw new Error("Non autorise");

  await prisma.user.update({
    where: { email: session.user.email },
    data: { metier },
  });

  return { success: true };
}

export async function saveOnboardingStep2(data: {
  name: string;
  telephone?: string;
  ville?: string;
}) {
  const session = await getSession();
  if (!session?.user?.email) throw new Error("Non autorise");

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      name: data.name,
      telephone: data.telephone || null,
      ville: data.ville || null,
    },
  });

  return { success: true };
}

export async function saveOnboardingStep3(data: {
  bailleurNom: string;
  bailleurAdresse?: string;
  siret?: string;
}) {
  const session = await getSession();
  if (!session?.user?.email) throw new Error("Non autorise");

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      bailleurNom: data.bailleurNom,
      bailleurAdresse: data.bailleurAdresse || null,
      siret: data.siret || null,
    },
  });

  return { success: true };
}

export async function saveOnboardingStep4(data: {
  adresse: string;
  surface?: number;
  loyer?: number;
}) {
  const session = await getSession();
  if (!session?.user?.email) throw new Error("Non autorise");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) throw new Error("Utilisateur introuvable");

  await prisma.bien.create({
    data: {
      userId: user.id,
      adresse: data.adresse,
      surface: data.surface || null,
      loyer: data.loyer || 0,
    },
  });

  return { success: true };
}

export async function saveOnboardingLocataire(data: {
  locataireNom: string;
  locataireEmail?: string;
  dateDebut?: string;
  loyerMensuel?: number;
}) {
  const session = await getSession();
  if (!session?.user?.email) throw new Error("Non autorise");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) throw new Error("Utilisateur introuvable");

  const bien = await prisma.bien.findFirst({
    where: { userId: user.id },
    select: { id: true, loyer: true },
    orderBy: { createdAt: "desc" },
  });
  if (!bien) throw new Error("Créez d'abord un bien");

  const dateDebut = data.dateDebut ? new Date(data.dateDebut) : new Date();
  const dateProchRevision = new Date(dateDebut);
  dateProchRevision.setFullYear(dateProchRevision.getFullYear() + 1);

  await prisma.bailActif.create({
    data: {
      userId: user.id,
      bienId: bien.id,
      locataireNom: data.locataireNom,
      locataireEmail: data.locataireEmail || "",
      dateSignature: dateDebut,
      dateDebut,
      loyerMensuel: data.loyerMensuel || bien.loyer || 0,
      dateProchRevision,
    },
  });

  return { success: true };
}

export async function getOnboardingRecap() {
  const session = await getSession();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, metier: true, bailleurNom: true, ville: true },
  });
  if (!user) return null;

  const bienCount = await prisma.bien.count({ where: { userId: user.id } });
  const bailCount = await prisma.bailActif.count({ where: { userId: user.id } });

  return {
    nom: user.name,
    metier: user.metier,
    bailleurNom: user.bailleurNom,
    ville: user.ville,
    bienCount,
    bailCount,
  };
}

export async function markOnboardingComplete() {
  const session = await getSession();
  if (!session?.user?.email) throw new Error("Non autorise");

  await prisma.user.update({
    where: { email: session.user.email },
    data: { onboardingCompleted: true },
  });

  return { success: true };
}

/**
 * Vérifie si l'utilisateur a déjà des données (BailActif, Bien).
 * Si oui et onboardingCompleted = false, marque l'onboarding comme complété.
 * Retourne { shouldSkip: true } si l'utilisateur doit skip l'onboarding.
 */
export async function checkAndCompleteOnboarding() {
  const session = await getSession();
  if (!session?.user?.email) return { shouldSkip: false };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, onboardingCompleted: true },
  });
  if (!user) return { shouldSkip: false };

  if (user.onboardingCompleted) return { shouldSkip: true };

  const bailCount = await prisma.bailActif.count({ where: { userId: user.id } });
  const bienCount = await prisma.bien.count({ where: { userId: user.id } });

  if (bailCount > 0 || bienCount > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingCompleted: true },
    });
    return { shouldSkip: true };
  }

  return { shouldSkip: false };
}
