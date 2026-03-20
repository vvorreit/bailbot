"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { getTransporter, smtpConfigured, escapeHtml } from "@/lib/mailer";

export async function registerUser(
  name: string,
  email: string,
  password: string,
  dpaVersion?: string,
  _clientUserAgent?: string,
) {
  if (!name || !email || !password) {
    return { error: "Tous les champs sont requis." };
  }

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  if (!dpaVersion) {
    return { error: "Vous devez accepter les conditions générales pour continuer." };
  }

  // Récupération de l'IP et User-Agent côté serveur (fiable)
  const reqHeaders = await headers();
  const ipAddress =
    reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    reqHeaders.get("x-real-ip") ??
    null;
  const userAgent = reqHeaders.get("user-agent") ?? null;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Un compte existe déjà avec cet email." };
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });

  // Enregistrement du consentement légal (RGPD Art. 9 / DPA)
  await prisma.legalAcceptance.create({
    data: {
      userId: user.id,
      dpaVersion,
      ipAddress,
      userAgent,
    },
  });

  // Génération du token de vérification (24h)
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  if (smtpConfigured()) {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Confirmez votre adresse email — BailBot",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
          <h2 style="color:#1e293b">Bienvenue sur BailBot, ${escapeHtml(name)} !</h2>
          <p style="color:#475569">Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et activer votre compte.</p>
          <a href="${verifyUrl}" style="display:inline-block;margin:24px 0;background:#2563eb;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;">
            Confirmer mon email
          </a>
          <p style="color:#94a3b8;font-size:13px">Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.</p>
        </div>
      `,
    });
  } else {
    console.log("SMTP non configuré, lien de vérification :", verifyUrl);
  }

  return { success: true };
}
