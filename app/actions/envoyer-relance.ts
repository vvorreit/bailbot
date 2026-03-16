"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail, smtpConfigured, escapeHtml } from "@/lib/mailer";

async function getUser() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) throw new Error("Non autorisé");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");
  return user;
}

export async function envoyerRelanceLoyer(data: {
  bailId: string;
  bienId: string;
  mois: string;
  emailLocataire: string;
  objet: string;
  message: string;
  templateId?: string;
  envoyeVia?: string;
}) {
  const user = await getUser();

  const bail = await prisma.bailActif.findFirst({
    where: { id: data.bailId, userId: user.id },
  });
  if (!bail) throw new Error("Bail introuvable");

  const bien = await prisma.bien.findFirst({ where: { id: data.bienId } });

  const envoyeVia = data.envoyeVia || "email";

  if (envoyeVia === "email" && smtpConfigured()) {
    await sendMail({
      to: data.emailLocataire,
      subject: data.objet,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <p style="color: #991b1b; font-weight: bold; margin: 0; font-size: 14px;">Rappel de paiement</p>
          </div>
          <div style="white-space: pre-wrap; color: #334155; font-size: 14px; line-height: 1.6;">
${escapeHtml(data.message)}
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 11px; text-align: center;">
            ${escapeHtml(bien?.adresse || "")} — BailBot
          </p>
        </div>
      `,
    });
  }

  const relance = await prisma.relanceLoyer.create({
    data: {
      userId: user.id,
      bailId: data.bailId,
      bienId: data.bienId,
      mois: data.mois,
      templateId: data.templateId,
      objet: data.objet,
      message: data.message,
      emailLocataire: data.emailLocataire,
      envoyeVia,
    },
  });

  return {
    success: true,
    id: relance.id,
    emailSent: envoyeVia === "email" && smtpConfigured(),
  };
}

export async function getRelancesLoyer(bailId: string) {
  const user = await getUser();

  return prisma.relanceLoyer.findMany({
    where: { bailId, userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRelancesParBien(bienId: string) {
  const user = await getUser();

  return prisma.relanceLoyer.findMany({
    where: { bienId, userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
