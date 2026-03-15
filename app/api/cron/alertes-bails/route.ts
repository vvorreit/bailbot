import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { sendPushToUser } from '@/lib/push-notifications';
import { TYPE_ALERTE_LABELS } from '@/lib/echeances-bail';
import { analyserTousDiagnostics, diagnosticsARenouveler } from '@/lib/diagnostics-expiration';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  const now = new Date();
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
  let pushEnvoyees = 0;
  let diagEnvoyees = 0;
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

    const joursRestants = Math.ceil(
      (alerte.dateEcheance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const shouldNotify = joursRestants <= 7;

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

      if (shouldNotify) {
        try {
          const urgence = joursRestants <= 1 ? "URGENT" : `J-${joursRestants}`;
          await sendPushToUser(bail.userId, {
            title: `${urgence} — ${label}`,
            body: `${bail.locataireNom} : ${label} le ${dateStr}`,
            url: "/dashboard/bails",
          });
          pushEnvoyees++;
        } catch {
          /* push failure non-bloquant */
        }
      }

      await prisma.alerteBail.update({
        where: { id: alerte.id },
        data: { traitee: true },
      });

      envoyees++;
    } catch (e: any) {
      erreurs.push(`${alerte.id}: ${e.message}`);
    }
  }

  /* ─── Alertes diagnostics immobiliers ────────────────────────────────────── */

  const biens = await prisma.bien.findMany({
    where: {
      OR: [
        { dateDPE: { not: null } },
        { dateElectricite: { not: null } },
        { dateGaz: { not: null } },
      ],
    },
    select: {
      id: true,
      userId: true,
      adresse: true,
      dateDPE: true,
      dateElectricite: true,
      dateGaz: true,
      datePlomb: true,
      dateAmiante: true,
    },
  });

  for (const bien of biens) {
    const user = await prisma.user.findUnique({ where: { id: bien.userId } });
    if (!user?.email) continue;

    const diagnostics = analyserTousDiagnostics({
      dateDPE: bien.dateDPE,
      dateElectricite: bien.dateElectricite,
      dateGaz: bien.dateGaz,
      datePlomb: bien.datePlomb,
      dateAmiante: bien.dateAmiante,
    });

    const seuilsJours = [90, 30, 7];
    const aNotifier = diagnosticsARenouveler(diagnostics, 90);

    for (const diag of aNotifier) {
      const matchSeuil = seuilsJours.find(
        (s) => diag.joursRestants <= s && diag.joursRestants > s - 7
      );
      if (!matchSeuil && diag.joursRestants > 0) continue;

      const dateStr = diag.dateExpiration.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      try {
        await sendMail({
          to: user.email,
          subject: `[BailBot] Diagnostic ${diag.type} expire bientôt — ${bien.adresse}`,
          html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 32px 24px;">
    <h2 style="color: #0f172a; margin-top: 0;">🔍 ${diag.label}</h2>
    <p>Bonjour ${user.name || ''},</p>
    <p>Un diagnostic immobilier expire bientôt pour votre bien :</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Bien :</strong> ${bien.adresse}</p>
      <p style="margin: 4px 0;"><strong>Diagnostic :</strong> ${diag.label}</p>
      <p style="margin: 4px 0;"><strong>Expiration :</strong> ${dateStr}</p>
      <p style="margin: 4px 0;"><strong>Jours restants :</strong> ${diag.joursRestants <= 0 ? 'Expiré' : `${diag.joursRestants} jours`}</p>
    </div>
    <p>
      <a href="https://www.diagnostiqueurs.din.developpement-durable.gouv.fr/index.action"
         style="color: #059669; font-weight: bold;">
        Trouver un diagnostiqueur certifié
      </a>
    </p>
    <p>Connectez-vous à BailBot pour mettre à jour vos diagnostics.</p>
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    BailBot · contact@optibot.fr
  </p>
</div>`,
        });

        if (diag.joursRestants <= 7) {
          try {
            await sendPushToUser(bien.userId, {
              title: `Diagnostic ${diag.type} expire dans ${diag.joursRestants}j`,
              body: `${bien.adresse} — ${diag.label}`,
              url: "/dashboard/logements",
            });
          } catch {
            /* push failure non-bloquant */
          }
        }

        diagEnvoyees++;
      } catch (e: any) {
        erreurs.push(`diag-${bien.id}-${diag.type}: ${e.message}`);
      }
    }
  }

  return NextResponse.json({
    success: true,
    envoyees,
    pushEnvoyees,
    diagEnvoyees,
    erreurs: erreurs.length > 0 ? erreurs : undefined,
  });
}
