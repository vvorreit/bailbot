"use server";

import { prisma } from '@/lib/db';
import { sendMail, smtpConfigured } from '@/lib/mailer';

export async function notifyNouveauDepot(depotTokenId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const depot = await prisma.depotToken.findUnique({
      where: { id: depotTokenId },
      include: {
        user: { select: { email: true, name: true } },
        _count: { select: { fichiers: true } },
      },
    });

    if (!depot) return { ok: false, error: 'Depot non trouvé' };
    if (!depot.user.email) return { ok: false, error: 'Email gestionnaire manquant' };

    if (!smtpConfigured()) {
      console.warn('[notify] RESEND_API_KEY manquant — notification non envoyée');
      return { ok: false, error: 'Email non configuré' };
    }

    const nbFichiers = depot._count.fichiers;
    const lien = `${process.env.NEXTAUTH_URL || 'https://app.optibot.fr'}/dashboard/candidats`;

    await sendMail({
      to: depot.user.email,
      subject: `Nouveau dossier déposé pour ${depot.bienAdresse}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #10B981; padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">BailBot — Nouveau dépôt</h1>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
            <p style="color: #334155; font-size: 14px; margin-bottom: 16px;">
              Un candidat a déposé ses documents pour le bien :
            </p>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <p style="font-weight: bold; color: #0f172a; margin: 0 0 4px;">${depot.bienAdresse}</p>
              <p style="color: #64748b; margin: 0; font-size: 13px;">${nbFichiers} document${nbFichiers > 1 ? 's' : ''} déposé${nbFichiers > 1 ? 's' : ''}</p>
            </div>
            <a href="${lien}" style="display: inline-block; background: #10B981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
              Voir le dossier
            </a>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
              Ce message a été envoyé automatiquement par BailBot — contact@optibot.fr
            </p>
          </div>
        </div>
      `,
    });

    return { ok: true };
  } catch (e: any) {
    console.error('[notify] Erreur notification gestionnaire:', e.message);
    return { ok: false, error: e.message };
  }
}

export async function notifyConfirmationCandidat(email: string, bienAdresse: string): Promise<{ ok: boolean }> {
  try {
    if (!smtpConfigured() || !email) return { ok: false };

    await sendMail({
      to: email,
      subject: `Votre dossier a bien été reçu — ${bienAdresse}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #10B981; padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">BailBot</h1>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
            <p style="color: #334155; font-size: 14px;">
              Votre dossier pour le bien <strong>${bienAdresse}</strong> a bien été reçu.
            </p>
            <p style="color: #334155; font-size: 14px;">
              Nous vous recontactons sous 48h.
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
              Ce message a été envoyé automatiquement par BailBot — contact@optibot.fr
            </p>
          </div>
        </div>
      `,
    });

    return { ok: true };
  } catch {
    return { ok: false };
  }
}
