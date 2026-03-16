"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail, escapeHtml } from "@/lib/mailer";
import { createSignatureRequest as yousignCreate } from "@/lib/yousign";

export async function createSignatureRequest(documentType: string, documentId: string, signataire: string, email: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Non authentifie");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) throw new Error("Utilisateur introuvable");

  let yousignRequestId: string | null = null;
  let signerUrl: string | null = null;

  if (process.env.YOUSIGN_API_KEY) {
    try {
      const docBuffer = Buffer.from(`Document ${documentType} — ${documentId}`);
      const result = await yousignCreate(docBuffer, email, signataire);
      yousignRequestId = result.signatureRequestId;
      signerUrl = result.signerUrl;
    } catch (err) {
      console.error("[signature] Yousign error, falling back:", err);
    }
  }

  const request = await prisma.signatureRequest.create({
    data: {
      userId: user.id,
      documentType,
      documentId,
      signataire,
      email,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      yousignRequestId,
      yousignStatus: yousignRequestId ? "ongoing" : null,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "https://app.optibot.fr";
  const lien = signerUrl || `${baseUrl}/sign/${request.token}`;

  await sendMail({
    to: email,
    subject: "Document a signer — BailBot",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 32px 24px;">
    <h2 style="color: #0f172a; margin-top: 0;">Document a signer</h2>
    <p>Bonjour ${escapeHtml(signataire)},</p>
    <p>Un document necessite votre signature electronique${yousignRequestId ? " avancee eIDAS via Yousign" : ""}.</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${lien}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Signer le document
      </a>
    </p>
    <p style="font-size: 12px; color: #64748b;">Ce lien expire dans 30 jours.</p>
    ${yousignRequestId ? '<p style="font-size: 11px; color: #64748b;">Signature electronique avancee eIDAS — prestataire certifie Yousign.</p>' : ""}
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    BailBot · contact@optibot.fr
  </p>
</div>`,
  });

  return { success: true, token: request.token };
}

export async function getSignatureRequest(token: string) {
  const request = await prisma.signatureRequest.findUnique({ where: { token } });
  if (!request || request.expiresAt < new Date()) return null;
  return {
    id: request.id,
    documentType: request.documentType,
    documentId: request.documentId,
    signataire: request.signataire,
    email: request.email,
    signedAt: request.signedAt?.toISOString() ?? null,
    signatureData: request.signatureData,
    yousignStatus: request.yousignStatus,
    certificatUrl: request.certificatUrl,
  };
}

export async function submitSignature(token: string, signatureData: string) {
  const request = await prisma.signatureRequest.findUnique({ where: { token } });
  if (!request || request.expiresAt < new Date()) throw new Error("Lien expire");
  if (request.signedAt) throw new Error("Deja signe");

  await prisma.signatureRequest.update({
    where: { token },
    data: { signatureData, signedAt: new Date() },
  });

  return { success: true };
}
