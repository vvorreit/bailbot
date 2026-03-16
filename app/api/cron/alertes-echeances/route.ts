import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendMail, escapeHtml } from '@/lib/mailer';
import { TYPE_ALERTE_LABELS } from '@/lib/echeances-bail';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const auth = req.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    if (!secret || auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  const now = new Date();
  const dans30jours = new Date();
  dans30jours.setDate(dans30jours.getDate() + 30);
  const dans7jours = new Date();
  dans7jours.setDate(dans7jours.getDate() + 7);

  /* J-30 : alertes non encore notifiées à J-30 */
  const alertesJ30 = await prisma.alerteBail.findMany({
    where: {
      traitee: false,
      notifJ30Envoyee: false,
      dateEcheance: { lte: dans30jours, gte: now },
    },
    include: { bail: true },
  });

  /* J-7 : alertes non encore notifiées à J-7 */
  const alertesJ7 = await prisma.alerteBail.findMany({
    where: {
      traitee: false,
      notifJ7Envoyee: false,
      dateEcheance: { lte: dans7jours, gte: now },
    },
    include: { bail: true },
  });

  let envoyees = 0;
  const erreurs: string[] = [];

  async function envoyerNotif(
    alerte: typeof alertesJ30[number],
    palier: 'J-30' | 'J-7'
  ) {
    const bail = alerte.bail;
    const user = await prisma.user.findUnique({ where: { id: bail.userId } });
    if (!user?.email) return;

    const label = TYPE_ALERTE_LABELS[alerte.type];
    const dateStr = alerte.dateEcheance.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const urgencyColor = palier === 'J-7' ? '#dc2626' : '#f59e0b';
    const urgencyLabel = palier === 'J-7' ? 'URGENT' : 'À venir';

    try {
      await sendMail({
        to: user.email,
        subject: `[BailBot] ${palier} — ${label} — ${bail.locataireNom}`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 32px 24px;">
    <div style="display: inline-block; background: ${urgencyColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 16px;">
      ${urgencyLabel} &mdash; ${palier}
    </div>
    <h2 style="color: #0f172a; margin-top: 0;">${label}</h2>
    <p>Bonjour ${escapeHtml(user.name || '')},</p>
    <p>Une &eacute;ch&eacute;ance arrive pour le bail de <strong>${escapeHtml(bail.locataireNom)}</strong> :</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Type :</strong> ${label}</p>
      <p style="margin: 4px 0;"><strong>Date :</strong> ${dateStr}</p>
      <p style="margin: 4px 0;"><strong>Locataire :</strong> ${escapeHtml(bail.locataireNom)}</p>
      <p style="margin: 4px 0;"><strong>Loyer :</strong> ${bail.loyerMensuel.toLocaleString('fr-FR')}&euro;</p>
    </div>
    <p>Connectez-vous &agrave; BailBot pour g&eacute;rer cette &eacute;ch&eacute;ance.</p>
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    BailBot &middot; contact@optibot.fr
  </p>
</div>`,
      });

      await prisma.alerteBail.update({
        where: { id: alerte.id },
        data: palier === 'J-30' ? { notifJ30Envoyee: true } : { notifJ7Envoyee: true },
      });

      envoyees++;
    } catch (e: any) {
      erreurs.push(`${alerte.id} (${palier}): ${e.message}`);
    }
  }

  for (const alerte of alertesJ30) {
    await envoyerNotif(alerte, 'J-30');
  }

  for (const alerte of alertesJ7) {
    await envoyerNotif(alerte, 'J-7');
  }

  return NextResponse.json({
    success: true,
    envoyees,
    j30: alertesJ30.length,
    j7: alertesJ7.length,
    erreurs: erreurs.length > 0 ? erreurs : undefined,
  });
}
