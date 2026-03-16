import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail, smtpConfigured } from "@/lib/mailer";
import { calculerRevisionLoyer, IRL_DERNIERE_MAJ } from "@/lib/revision-loyer";
import { logCronStart, logCronSuccess, logCronFailure } from "@/lib/cron-logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const cronRunId = await logCronStart("indexation-irl");
  try {

  const now = new Date();
  const bails = await prisma.bailActif.findMany({
    where: {
      statut: "ACTIF",
      indexationIRLActive: true,
    },
  });

  const results: { bailId: string; action: string }[] = [];

  for (const bail of bails) {
    const joursAvant = bail.indexationIRLJoursAvant || 30;
    const dateRevision = new Date(bail.dateProchRevision);
    const diffMs = dateRevision.getTime() - now.getTime();
    const diffJours = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffJours > joursAvant || diffJours < 0) continue;

    const dernRevise = bail.derniereLoyerRevise;
    if (dernRevise) {
      const moisDepuisRevision = (now.getFullYear() - dernRevise.getFullYear()) * 12 + (now.getMonth() - dernRevise.getMonth());
      if (moisDepuisRevision < 10) {
        results.push({ bailId: bail.id, action: "skip_already_revised_this_cycle" });
        continue;
      }
    }

    const dateSignatureStr = new Date(bail.dateSignature).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });

    let nouveauLoyer = bail.loyerMensuel;
    let variation = 0;
    try {
      const resultat = calculerRevisionLoyer(bail.loyerMensuel, dateSignatureStr);
      nouveauLoyer = resultat.nouveauLoyer;
      variation = resultat.variation;
    } catch {
      /* IRL data might not cover this period */
    }

    const bien = await prisma.bien.findFirst({
      where: { id: bail.bienId },
      select: { adresse: true },
    });
    const adresse = bien?.adresse || bail.bienId;

    const user = await prisma.user.findUnique({
      where: { id: bail.userId },
      select: { email: true, name: true },
    });

    if (!user?.email) continue;

    const appUrl = process.env.NEXTAUTH_URL || "https://app.optibot.fr";
    const dateRevisionStr = dateRevision.toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
    });

    if (smtpConfigured()) {
      await sendMail({
        to: user.email,
        subject: `Rappel : Révision IRL possible pour ${adresse} — Date anniversaire dans ${diffJours} jours`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1e293b;">Révision IRL — ${adresse}</h2>
            <p>Bonjour ${user.name || ""},</p>
            <p>La date anniversaire du bail de <strong>${bail.locataireNom}</strong> approche :</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Date anniversaire</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${dateRevisionStr}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Loyer actuel</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${bail.loyerMensuel.toFixed(2)} €</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Nouveau loyer estimé</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${nouveauLoyer.toFixed(2)} € (${variation >= 0 ? "+" : ""}${variation.toFixed(2)}%)</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">IRL utilisé</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${IRL_DERNIERE_MAJ}</td></tr>
            </table>
            <div style="display: flex; gap: 12px; margin: 24px 0;">
              <a href="${appUrl}/dashboard/bails" style="display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Appliquer la révision</a>
              <a href="${appUrl}/dashboard/bails" style="display: inline-block; padding: 12px 24px; background: #64748b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Ne pas appliquer</a>
            </div>
            <p style="color: #94a3b8; font-size: 12px;">Cet email a été envoyé automatiquement par BailBot. Gérez vos préférences de notification dans les paramètres du bail.</p>
          </div>
        `,
      });
    }

    results.push({ bailId: bail.id, action: `notified_${diffJours}j_before` });
  }

  const responseData = { ok: true, processed: results.length, results };
  await logCronSuccess(cronRunId, responseData);
  return NextResponse.json(responseData);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logCronFailure(cronRunId, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
