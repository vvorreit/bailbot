import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { TYPE_ALERTE_LABELS } from '@/lib/echeances-bail';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  const dans30jours = new Date();
  dans30jours.setDate(dans30jours.getDate() + 30);

  const alertes = await prisma.alerteBail.findMany({
    where: {
      traitee: false,
      dateEcheance: { lte: dans30jours },
    },
    include: {
      bail: true,
    },
  });

  let envoyees = 0;
  const erreurs: string[] = [];

  for (const alerte of alertes) {
    const bail = alerte.bail;
    const user = await prisma.user.findUnique({ where: { id: bail.userId } });
    if (!user?.email) continue;

    const label = TYPE_ALERTE_LABELS[alerte.type];
    const dateStr = alerte.dateEcheance.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    try {
      await sendMail({
        to: user.email,
        subject: `[BailBot] Alerte : ${label} — ${bail.locataireNom}`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 32px 24px;">
    <h2 style="color: #0f172a; margin-top: 0;">🔔 ${label}</h2>
    <p>Bonjour ${user.name || ''},</p>
    <p>Une échéance arrive pour le bail de <strong>${bail.locataireNom}</strong> :</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Type :</strong> ${label}</p>
      <p style="margin: 4px 0;"><strong>Date :</strong> ${dateStr}</p>
      <p style="margin: 4px 0;"><strong>Locataire :</strong> ${bail.locataireNom}</p>
      <p style="margin: 4px 0;"><strong>Loyer :</strong> ${bail.loyerMensuel.toLocaleString('fr-FR')}€</p>
    </div>
    <p>Connectez-vous à BailBot pour gérer cette échéance.</p>
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    BailBot · contact@optibot.fr
  </p>
</div>`,
      });

      await prisma.alerteBail.update({
        where: { id: alerte.id },
        data: { traitee: true },
      });

      envoyees++;
    } catch (e: any) {
      erreurs.push(`${alerte.id}: ${e.message}`);
    }
  }

  return NextResponse.json({ success: true, envoyees, erreurs: erreurs.length > 0 ? erreurs : undefined });
}
