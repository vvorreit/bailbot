import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { logCronStart, logCronSuccess, logCronFailure } from "@/lib/cron-logger";
import { isFeatureEnabled } from "@/lib/feature-flags";

export async function GET(req: NextRequest) {
  if (!isFeatureEnabled("FEATURE_RAPPELS_IMPAYES")) {
    return NextResponse.json({ skipped: true, reason: "FEATURE_RAPPELS_IMPAYES disabled" });
  }

  if (process.env.NODE_ENV === "production") {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }
  }

  const cronRunId = await logCronStart("rappels-impayes");
  try {

  const now = new Date();
  let emailsEnvoyes = 0;
  const erreurs: string[] = [];

  const paiementsRetard = await prisma.paiementBien.findMany({
    where: {
      statut: { in: ["retard", "impaye"] },
      locataireEmail: { not: null },
    },
    orderBy: { dateAttendue: "asc" },
  });

  for (const p of paiementsRetard) {
    if (!p.locataireEmail) continue;

    const joursRetard = Math.ceil((now.getTime() - p.dateAttendue.getTime()) / (1000 * 60 * 60 * 24));
    const relances = (p.relances as any[]) || [];
    const derniereRelance = relances.length > 0 ? relances[relances.length - 1] : null;
    const dernierJoursRelance = derniereRelance?.joursRetard ?? 0;

    let doitRelancer = false;
    let typeRelance = "";

    if (joursRetard >= 3 && joursRetard < 7 && dernierJoursRelance < 3) {
      doitRelancer = true;
      typeRelance = "J+3";
    } else if (joursRetard >= 7 && joursRetard < 15 && dernierJoursRelance < 7) {
      doitRelancer = true;
      typeRelance = "J+7";
    } else if (joursRetard >= 15 && dernierJoursRelance < 15) {
      doitRelancer = true;
      typeRelance = "J+15";
    }

    if (!doitRelancer) continue;

    try {
      const moisLabel = p.mois;
      const montant = p.loyerCC.toLocaleString("fr-FR", { minimumFractionDigits: 2 });

      await sendMail({
        to: p.locataireEmail,
        subject: `Rappel de loyer impaye — ${moisLabel}`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 32px 24px;">
    <h2 style="color: #0f172a; margin-top: 0;">Rappel de paiement</h2>
    <p>Bonjour ${p.locataireNom},</p>
    <p>Nous constatons que votre loyer pour le mois de <strong>${moisLabel}</strong> n'a pas encore ete regle.</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Montant du :</strong> ${montant} EUR</p>
      <p style="margin: 4px 0;"><strong>Retard :</strong> ${joursRetard} jours</p>
    </div>
    <p>Nous vous remercions de bien vouloir proceder au reglement dans les meilleurs delais.</p>
    <p style="font-size: 12px; color: #64748b; margin-top: 16px;">
      Si vous avez deja effectue le paiement, veuillez ignorer ce message.
    </p>
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    BailBot · contact@optibot.fr
  </p>
</div>`,
      });

      await prisma.paiementBien.update({
        where: { id: p.id },
        data: {
          relances: [
            ...relances,
            { type: typeRelance, joursRetard, date: now.toISOString() },
          ],
        },
      });

      emailsEnvoyes++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      erreurs.push(`${p.id}: ${msg}`);
    }
  }

  const responseData = {
    success: true,
    emailsEnvoyes,
    paiementsVerifies: paiementsRetard.length,
    erreurs: erreurs.length > 0 ? erreurs : undefined,
  };
  await logCronSuccess(cronRunId, responseData);
  return NextResponse.json(responseData);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logCronFailure(cronRunId, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
