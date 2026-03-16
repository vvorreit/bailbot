"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail, escapeHtml } from "@/lib/mailer";
import { rateLimit } from "@/lib/rateLimit";

export async function getPortailLocataireData(token: string, ip?: string) {
  /* Rate limiting: max 10 attempts/hour per IP */
  if (ip) {
    const allowed = await rateLimit(`portail:${ip}`, 10, 60 * 60 * 1000);
    if (!allowed) return null;
  }

  const espace = await prisma.espaceLocataire.findUnique({
    where: { token },
    include: { demandes: { orderBy: { createdAt: "desc" } } },
  });
  if (!espace || !espace.actif || espace.expiresAt < new Date()) return null;

  /* Audit log */
  try {
    await prisma.auditLog.create({
      data: {
        userId: espace.userId,
        action: "PORTAIL_ACCESS",
        details: `espaceId=${espace.id} bailId=${espace.bailId}`,
        ip: ip || null,
      },
    });
  } catch {
    /* non-blocking */
  }

  const bail = await prisma.bailActif.findFirst({
    where: { id: espace.bailId },
    select: {
      id: true,
      locataireNom: true,
      locataireEmail: true,
      bienId: true,
      loyerMensuel: true,
      chargesMensuelles: true,
      dateDebut: true,
      dateFin: true,
      statut: true,
    },
  });

  const quittances = await prisma.quittanceAuto.findMany({
    where: { bailId: espace.bailId },
    orderBy: { mois: "desc" },
    take: 12,
  });

  return { espace, bail, quittances };
}

export async function soumettreDemandeLocataire(token: string, type: string, message: string) {
  const espace = await prisma.espaceLocataire.findUnique({ where: { token } });
  if (!espace || !espace.actif) throw new Error("Espace invalide");

  await prisma.demandeLocataire.create({
    data: {
      espaceId: espace.id,
      type: type as any,
      message,
    },
  });

  /* Audit log */
  try {
    await prisma.auditLog.create({
      data: {
        userId: espace.userId,
        action: "PORTAIL_DEMANDE",
        details: `espaceId=${espace.id} type=${type}`,
      },
    });
  } catch {
    /* non-blocking */
  }

  return { success: true };
}

export async function envoyerLienPortail(bailId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Non authentifie");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) throw new Error("Utilisateur introuvable");

  const bail = await prisma.bailActif.findFirst({
    where: { id: bailId, userId: user.id },
  });
  if (!bail) throw new Error("Bail introuvable");

  let espace = await prisma.espaceLocataire.findUnique({
    where: { bailId: bail.id },
  });

  if (!espace) {
    espace = await prisma.espaceLocataire.create({
      data: {
        userId: user.id,
        bailId: bail.id,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const baseUrl = process.env.NEXTAUTH_URL || "https://app.optibot.fr";
  const lien = `${baseUrl}/locataire/${espace.token}`;

  await sendMail({
    to: bail.locataireEmail,
    subject: "Votre espace locataire BailBot",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 32px 24px;">
    <h2 style="color: #0f172a; margin-top: 0;">Votre espace locataire</h2>
    <p>Bonjour ${escapeHtml(bail.locataireNom)},</p>
    <p>Votre bailleur vous donne acces a votre espace locataire en ligne.</p>
    <p>Vous pouvez y consulter vos quittances, votre bail, et soumettre des demandes.</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${lien}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Acceder a mon espace
      </a>
    </p>
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    BailBot · contact@optibot.fr
  </p>
</div>`,
  });

  return { success: true, token: espace.token };
}
