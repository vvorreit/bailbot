import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { DIAGNOSTICS_CONFIG, type DiagnosticType } from "@/lib/diagnostics-config";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }
  }

  const now = new Date();
  const dans30jours = new Date();
  dans30jours.setDate(dans30jours.getDate() + 30);
  const dans7jours = new Date();
  dans7jours.setDate(dans7jours.getDate() + 7);

  const diagnosticsJ30 = await prisma.diagnosticBien.findMany({
    where: {
      nonConcerne: false,
      alerteEnvoyee30j: false,
      dateExpiration: { lte: dans30jours, gte: now },
    },
  });

  const diagnosticsJ7 = await prisma.diagnosticBien.findMany({
    where: {
      nonConcerne: false,
      alerteEnvoyee7j: false,
      dateExpiration: { lte: dans7jours, gte: now },
    },
  });

  let envoyees = 0;
  const erreurs: string[] = [];

  async function envoyerAlerte(
    diag: (typeof diagnosticsJ30)[number],
    palier: "J-30" | "J-7"
  ) {
    const user = await prisma.user.findUnique({ where: { id: diag.userId } });
    if (!user?.email) return;

    const bien = await prisma.bien.findUnique({
      where: { id: diag.bienId },
      select: { adresse: true },
    });
    if (!bien) return;

    const config = DIAGNOSTICS_CONFIG[diag.type as DiagnosticType];
    if (!config) return;

    const dateStr = diag.dateExpiration!.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const isUrgent = palier === "J-7";
    const urgencyColor = isUrgent ? "#dc2626" : "#f59e0b";
    const urgencyLabel = isUrgent ? "URGENT" : "A venir";
    const subjectPrefix = isUrgent ? "[URGENT] " : "";

    try {
      await sendMail({
        to: user.email,
        subject: `${subjectPrefix}Renouvellement diagnostic ${diag.type} - ${bien.adresse}`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 32px 24px;">
    <div style="display: inline-block; background: ${urgencyColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 16px;">
      ${urgencyLabel} &mdash; ${palier}
    </div>
    <h2 style="color: #0f172a; margin-top: 0;">Renouvellement : ${config.nom}</h2>
    <p>Bonjour ${user.name || ""},</p>
    <p>Votre <strong>${config.nom}</strong> pour le bien situ&eacute; au <strong>${bien.adresse}</strong> expire le <strong>${dateStr}</strong>.</p>
    <p>Ce document est <strong>OBLIGATOIRE</strong> pour la mise en location (ref: ${config.legalRef}).</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0; color: #991b1b; font-weight: bold;">Sans ce document &agrave; jour, vous vous exposez &agrave; :</p>
      <ul style="margin: 8px 0; color: #991b1b;">
        <li>L'annulation du bail par le locataire</li>
        <li>Des amendes pouvant aller jusqu'&agrave; 3 000&euro;</li>
      </ul>
    </div>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Type :</strong> ${config.nom}</p>
      <p style="margin: 4px 0;"><strong>Adresse :</strong> ${bien.adresse}</p>
      <p style="margin: 4px 0;"><strong>Expiration :</strong> ${dateStr}</p>
      <p style="margin: 4px 0;"><strong>Validit&eacute; l&eacute;gale :</strong> ${config.validiteAns ? config.validiteAns + " ans" : config.validiteMois ? config.validiteMois + " mois" : "Illimit&eacute;e"}</p>
    </div>
    <p style="font-size: 13px; color: #64748b;">${config.conseils}</p>
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    BailBot &middot; contact@optibot.fr
  </p>
</div>`,
      });

      await prisma.diagnosticBien.update({
        where: { id: diag.id },
        data: palier === "J-30" ? { alerteEnvoyee30j: true } : { alerteEnvoyee7j: true },
      });

      envoyees++;
    } catch (e: any) {
      erreurs.push(`${diag.id} (${palier}): ${e.message}`);
    }
  }

  for (const diag of diagnosticsJ30) {
    await envoyerAlerte(diag, "J-30");
  }

  for (const diag of diagnosticsJ7) {
    await envoyerAlerte(diag, "J-7");
  }

  return NextResponse.json({
    success: true,
    envoyees,
    j30: diagnosticsJ30.length,
    j7: diagnosticsJ7.length,
    erreurs: erreurs.length > 0 ? erreurs : undefined,
  });
}
