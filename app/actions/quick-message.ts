"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mailer";

export interface LocataireOption {
  email: string;
  nom: string;
  bailId: string;
}

export async function getLocatairesActifs(): Promise<LocataireOption[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return [];

  const bails = await prisma.bailActif.findMany({
    where: { userId: user.id, statut: { in: ["ACTIF", "PREAVIS"] } },
    select: { id: true, locataireNom: true, locataireEmail: true },
    orderBy: { locataireNom: "asc" },
  });

  return bails.map((b) => ({
    email: b.locataireEmail,
    nom: b.locataireNom,
    bailId: b.id,
  }));
}

export async function sendQuickMessage(to: string, subject: string, body: string): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { success: false, error: "Non authentifié" };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true },
  });
  if (!user) return { success: false, error: "Utilisateur introuvable" };

  if (!to || !subject || !body) {
    return { success: false, error: "Tous les champs sont requis" };
  }

  try {
    await sendMail({
      to,
      subject,
      html: `<div style="font-family: sans-serif; max-width: 600px;">
        <p>${body.replace(/\n/g, "<br>")}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">
          Envoyé via BailBot par ${user.name || user.email}
        </p>
      </div>`,
      replyTo: user.email ?? undefined,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "QUICK_MESSAGE",
        details: `Message envoyé à ${to} — Sujet: ${subject}`,
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Erreur d'envoi" };
  }
}
