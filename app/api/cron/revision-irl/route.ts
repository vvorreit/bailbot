import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mailer";

/* ── IRL de référence (à mettre à jour manuellement chaque trimestre) ──
 * Source : https://www.insee.fr/fr/statistiques/serie/001515333
 * IRL_PRECEDENT = Q3 2025 → 144.51
 * IRL_NOUVEAU   = Q4 2025 → 145.42
 */
const IRL_PRECEDENT = 144.51;
const IRL_NOUVEAU = 145.42;

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  const now = new Date();
  const dans14j = new Date(now);
  dans14j.setDate(dans14j.getDate() + 14);
  const dans16j = new Date(now);
  dans16j.setDate(dans16j.getDate() + 16);

  const bails = await prisma.bailActif.findMany({
    where: {
      statut: "ACTIF",
      dateProchRevision: { gte: dans14j, lte: dans16j },
    },
  });

  if (bails.length === 0) {
    return NextResponse.json({ success: true, envoyees: 0, message: "Aucune révision à notifier" });
  }

  const userIds = [...new Set(bails.map((b) => b.userId))];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
  const usersMap = new Map(users.map((u) => [u.id, u]));

  let envoyees = 0;
  const erreurs: string[] = [];

  for (const bail of bails) {
    try {
      const user = usersMap.get(bail.userId);
      if (!user?.email) {
        erreurs.push(`${bail.id}: propriétaire sans email`);
        continue;
      }

      const ancienLoyer = bail.loyerMensuel;
      const nouveauLoyer = Math.round(ancienLoyer * (IRL_NOUVEAU / IRL_PRECEDENT) * 100) / 100;
      const augmentationEuros = Math.round((nouveauLoyer - ancienLoyer) * 100) / 100;
      const augmentationPct = Math.round(((IRL_NOUVEAU / IRL_PRECEDENT - 1) * 100) * 100) / 100;

      const dateButoire = bail.dateProchRevision.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const lotMention = bail.descriptionLot
        ? `${bail.descriptionLot} — `
        : "";

      const lettreRevision = `
<div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 24px; margin: 24px 0; font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.6;">
  <p style="text-align: right; margin-bottom: 16px;">[Ville], le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
  <p><strong>Objet : Révision annuelle du loyer</strong></p>
  <p>Madame, Monsieur ${bail.locataireNom},</p>
  <p>Conformément aux dispositions de l'article 17-1 de la loi du 6 juillet 1989 et aux termes du contrat de bail,
  je vous informe que le loyer de votre logement situé ${lotMention}fait l'objet d'une révision annuelle
  indexée sur l'Indice de Référence des Loyers (IRL).</p>
  <p><strong>Calcul de la révision :</strong></p>
  <p style="margin-left: 20px;">
    Loyer actuel × (nouvel IRL / ancien IRL)<br/>
    ${ancienLoyer.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € × (${IRL_NOUVEAU} / ${IRL_PRECEDENT})<br/>
    = <strong>${nouveauLoyer.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</strong>
  </p>
  <p>Le nouveau loyer mensuel de <strong>${nouveauLoyer.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</strong>
  (hors charges) s'appliquera à compter du <strong>${dateButoire}</strong>.</p>
  <p>Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>
  <p style="margin-top: 24px;">${user.name || "[Nom du bailleur]"}<br/>Bailleur</p>
</div>`;

      await sendMail({
        to: user.email,
        subject: `[BailBot] Révision IRL — ${bail.locataireNom} — +${augmentationEuros.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €/mois`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 32px 24px;">
    <h2 style="color: #0f172a; margin-top: 0;">Révision de loyer à venir</h2>
    <p>Bonjour ${user.name || ""},</p>
    <p>Le bail de <strong>${lotMention}${bail.locataireNom}</strong> est éligible à une révision IRL.</p>

    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Loyer actuel</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold;">${ancienLoyer.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Nouveau loyer</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #059669;">${nouveauLoyer.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</td>
        </tr>
        <tr style="border-top: 1px solid #e2e8f0;">
          <td style="padding: 6px 0; color: #64748b;">Augmentation</td>
          <td style="padding: 6px 0; text-align: right;">+${augmentationEuros.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € (+${augmentationPct}%)</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">IRL</td>
          <td style="padding: 6px 0; text-align: right;">${IRL_PRECEDENT} → ${IRL_NOUVEAU}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Date butoire</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #dc2626;">${dateButoire}</td>
        </tr>
      </table>
    </div>

    <h3 style="color: #0f172a; margin-top: 24px;">Modèle de lettre de révision</h3>
    <p style="font-size: 13px; color: #64748b;">Copiez et adaptez cette lettre pour notifier votre locataire :</p>
    ${lettreRevision}
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    BailBot · contact@optibot.fr
  </p>
</div>`,
      });

      envoyees++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      erreurs.push(`${bail.id}: ${msg}`);
    }
  }

  return NextResponse.json({
    success: true,
    envoyees,
    irlPrecedent: IRL_PRECEDENT,
    irlNouveau: IRL_NOUVEAU,
    erreurs: erreurs.length > 0 ? erreurs : undefined,
  });
}
