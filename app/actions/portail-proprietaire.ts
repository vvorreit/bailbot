"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail, smtpConfigured } from "@/lib/mailer";
import { randomBytes } from "crypto";

async function getUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Non autorisé");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("Utilisateur introuvable");
  return user.id;
}

/**
 * Génère un token propriétaire pour un bail avec expiration 1 an.
 */
export async function genererTokenProprietaire(bailId: string) {
  const userId = await getUserId();
  const bail = await prisma.bailActif.findFirst({ where: { id: bailId, userId } });
  if (!bail) throw new Error("Bail introuvable");

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await prisma.bailActif.update({
    where: { id: bailId },
    data: { tokenProprietaire: token, tokenProprietaireExpiresAt: expiresAt },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return { token, lien: `${baseUrl}/proprietaire/${token}`, expiresAt: expiresAt.toISOString() };
}

/**
 * Renouvelle le token propriétaire (nouveau token + expiration 1 an).
 */
export async function renewTokenProprietaire(bailId: string) {
  const userId = await getUserId();
  const bail = await prisma.bailActif.findFirst({ where: { id: bailId, userId } });
  if (!bail) throw new Error("Bail introuvable");

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await prisma.bailActif.update({
    where: { id: bailId },
    data: { tokenProprietaire: token, tokenProprietaireExpiresAt: expiresAt },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return { token, lien: `${baseUrl}/proprietaire/${token}`, expiresAt: expiresAt.toISOString() };
}

/**
 * Révoque le token propriétaire (suppression du lien).
 */
export async function revokeTokenProprietaire(bailId: string) {
  const userId = await getUserId();
  const bail = await prisma.bailActif.findFirst({ where: { id: bailId, userId } });
  if (!bail) throw new Error("Bail introuvable");

  await prisma.bailActif.update({
    where: { id: bailId },
    data: { tokenProprietaire: null, tokenProprietaireExpiresAt: null },
  });

  return { success: true };
}

/**
 * Récupère les infos du token d'un bail (expiration, lien actif).
 */
export async function getTokenInfo(bailId: string) {
  const userId = await getUserId();
  const bail = await prisma.bailActif.findFirst({
    where: { id: bailId, userId },
    select: { tokenProprietaire: true, tokenProprietaireExpiresAt: true },
  });
  if (!bail) throw new Error("Bail introuvable");

  if (!bail.tokenProprietaire) return { active: false, lien: null, expiresAt: null };

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return {
    active: true,
    lien: `${baseUrl}/proprietaire/${bail.tokenProprietaire}`,
    expiresAt: bail.tokenProprietaireExpiresAt?.toISOString() ?? null,
  };
}

/**
 * Envoie le lien portail propriétaire par email.
 */
export async function envoyerLienProprietaire(bailId: string, emailProprietaire: string) {
  const userId = await getUserId();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const bail = await prisma.bailActif.findFirst({
    where: { id: bailId, userId },
  });
  if (!bail) throw new Error("Bail introuvable");

  let token = bail.tokenProprietaire;
  if (!token) {
    const result = await genererTokenProprietaire(bailId);
    token = result.token;
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const lien = `${baseUrl}/proprietaire/${token}`;

  if (!smtpConfigured()) {
    return { success: true, lien, sent: false };
  }

  const bien = await prisma.bien.findFirst({ where: { id: bail.bienId } });

  await sendMail({
    to: emailProprietaire,
    subject: `Votre portail propriétaire — ${bien?.adresse || "Bien"}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1e293b; font-size: 24px;">Portail Propriétaire</h1>
        <p style="color: #475569;">Bonjour,</p>
        <p style="color: #475569;">
          ${user?.name || "Votre gestionnaire"} vous donne accès au suivi de votre bien
          situé au <strong>${bien?.adresse || ""}</strong>.
        </p>
        <p style="color: #475569;">Ce portail vous permet de consulter en lecture seule :</p>
        <ul style="color: #475569;">
          <li>Le statut de votre bien (occupé/vacant)</li>
          <li>Les loyers encaissés et impayés</li>
          <li>L'historique des paiements</li>
          <li>Les quittances générées</li>
        </ul>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${lien}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">
            Accéder à mon portail
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">
          Ce lien est personnel et confidentiel. Ne le partagez pas.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center;">
          BailBot — Gestion locative simplifiée
        </p>
      </div>
    `,
  });

  return { success: true, lien, sent: true };
}

/**
 * Données du portail propriétaire (accès public par token).
 */
export async function getPortailProprietaire(token: string) {
  const bail = await prisma.bailActif.findFirst({
    where: { tokenProprietaire: token },
  });

  if (!bail) return null;

  /* Vérifier expiration du token */
  if (bail.tokenProprietaireExpiresAt && new Date() > bail.tokenProprietaireExpiresAt) {
    return { expired: true as const };
  }

  const bien = await prisma.bien.findFirst({ where: { id: bail.bienId } });
  if (!bien) return null;

  const user = await prisma.user.findUnique({
    where: { id: bail.userId },
    select: { name: true, email: true, bailleurNom: true },
  });

  // Tous les bails du bien (pour portefeuille)
  const bails = await prisma.bailActif.findMany({
    where: { userId: bail.userId, bienId: bail.bienId, tokenProprietaire: token },
    select: {
      id: true,
      locataireNom: true,
      locataireEmail: false,
      dateDebut: true,
      dateFin: true,
      loyerMensuel: true,
      chargesMensuelles: true,
      statut: true,
    },
  });

  // Paiements des 12 derniers mois
  const douzeMoisAgo = new Date();
  douzeMoisAgo.setMonth(douzeMoisAgo.getMonth() - 12);
  const douzeMoisStr = `${douzeMoisAgo.getFullYear()}-${String(douzeMoisAgo.getMonth() + 1).padStart(2, "0")}`;

  const paiements = await prisma.paiementBien.findMany({
    where: {
      userId: bail.userId,
      bienId: bail.bienId,
      mois: { gte: douzeMoisStr },
    },
    select: {
      mois: true,
      statut: true,
      loyerCC: true,
      montantRecu: true,
      dateReelle: true,
    },
    orderBy: { mois: "asc" },
  });

  // Quittances
  const quittances = await prisma.quittanceAuto.findMany({
    where: { bailId: bail.id },
    select: { mois: true, numero: true, envoyeeLe: true },
    orderBy: { mois: "desc" },
    take: 12,
  });

  // Alertes
  const alertes = await prisma.alerteBail.findMany({
    where: { bailId: bail.id, traitee: false },
    select: { type: true, dateEcheance: true },
    orderBy: { dateEcheance: "asc" },
  });

  // Calculs
  const now = new Date();
  const moisCourant = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const paiementsCourant = paiements.filter((p) => p.mois === moisCourant);
  const totalEncaisse = paiementsCourant
    .filter((p) => p.statut === "paye")
    .reduce((sum, p) => sum + (p.montantRecu ?? p.loyerCC), 0);
  const totalImpayes = paiementsCourant
    .filter((p) => p.statut === "impaye" || p.statut === "retard")
    .reduce((sum, p) => sum + p.loyerCC, 0);

  return {
    bien: {
      adresse: bien.adresse,
      statut: bien.statut,
      loyer: bien.loyer,
      charges: bien.charges,
      typeBail: bien.typeBail,
    },
    bail: {
      locataireNom: bail.locataireNom,
      dateDebut: bail.dateDebut,
      dateFin: bail.dateFin,
      loyerMensuel: bail.loyerMensuel,
      chargesMensuelles: bail.chargesMensuelles,
      statut: bail.statut,
    },
    gestionnaire: user?.bailleurNom || user?.name || "Gestionnaire",
    revenus: {
      mois: moisCourant,
      totalEncaisse,
      totalImpayes,
    },
    paiements,
    quittances,
    alertes,
  };
}
