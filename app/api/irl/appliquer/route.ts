import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail, smtpConfigured, escapeHtml } from "@/lib/mailer";
import { calculerRevisionLoyer } from "@/lib/revision-loyer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
  }

  const body = await request.json();
  const { bailId, appliquer, nouveauLoyer: nouveauLoyerOverride } = body as {
    bailId: string;
    appliquer: boolean;
    nouveauLoyer?: number;
  };

  if (!bailId) {
    return NextResponse.json({ error: "bailId requis" }, { status: 400 });
  }

  const bail = await prisma.bailActif.findFirst({
    where: { id: bailId, userId: user.id },
  });

  if (!bail) {
    return NextResponse.json({ error: "Bail introuvable" }, { status: 404 });
  }

  const bien = await prisma.bien.findFirst({
    where: { id: bail.bienId },
    select: { adresse: true },
  });
  const adresse = bien?.adresse || bail.bienId;

  if (!appliquer) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "IRL_REVISION_REFUSEE",
        details: `Révision IRL refusée pour bail ${bailId} (${bail.locataireNom}) — ${adresse}`,
      },
    });
    return NextResponse.json({ ok: true, action: "skipped" });
  }

  const dateSignatureStr = new Date(bail.dateSignature).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  let resultat;
  try {
    resultat = calculerRevisionLoyer(bail.loyerMensuel, dateSignatureStr);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur calcul IRL: ${e.message}` }, { status: 400 });
  }

  const nouveauLoyer = nouveauLoyerOverride ?? resultat.nouveauLoyer;
  const ancienLoyer = bail.loyerMensuel;

  const now = new Date();
  const premierMoisSuivant = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  await prisma.bailActif.update({
    where: { id: bailId },
    data: {
      loyerMensuel: nouveauLoyer,
      dernierIRLApplique: resultat.irlNouveau,
      derniereLoyerRevise: now,
      dateProchRevision: (() => {
        const d = new Date(bail.dateProchRevision);
        d.setFullYear(d.getFullYear() + 1);
        return d;
      })(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "IRL_REVISION_APPLIQUEE",
      details: JSON.stringify({
        bailId,
        locataire: bail.locataireNom,
        adresse,
        ancienLoyer,
        nouveauLoyer,
        irlReference: resultat.irlReference,
        irlNouveau: resultat.irlNouveau,
        variation: resultat.variation,
      }),
    },
  });

  const profil = await prisma.profilBailleurTable.findUnique({
    where: { userId: user.id },
  });
  const nomBailleur = profil
    ? [profil.prenom, profil.nom].filter(Boolean).join(" ")
    : user.name || "Le bailleur";
  const adresseBailleur = profil?.adresse || "";
  const telBailleur = profil?.telephone || "";

  if (bail.locataireEmail && smtpConfigured()) {
    const dateApplicationStr = premierMoisSuivant.toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
    });

    await sendMail({
      to: bail.locataireEmail,
      subject: `Révision annuelle de votre loyer — ${adresse}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e293b;">Révision annuelle de votre loyer</h2>
          <p>Madame, Monsieur <strong>${escapeHtml(bail.locataireNom)}</strong>,</p>
          <p>Conformément aux dispositions de votre contrat de bail signé le ${new Date(bail.dateSignature).toLocaleDateString("fr-FR")} et à l'article 17-1 de la loi du 6 juillet 1989 modifiée par la loi ALUR du 24 mars 2014, nous vous informons de la révision annuelle de votre loyer.</p>

          <h3 style="color: #334155; margin-top: 24px;">Détail du calcul</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Loyer actuel (hors charges)</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${ancienLoyer.toFixed(2)} €</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">IRL de référence (${resultat.trimestreReference})</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${resultat.irlReference}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Nouvel IRL (${resultat.trimestreNouveau})</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${resultat.irlNouveau}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Formule</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${ancienLoyer.toFixed(2)} × ${resultat.irlNouveau} / ${resultat.irlReference} = ${nouveauLoyer.toFixed(2)} €</td></tr>
            <tr style="background: #f0fdf4;"><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Nouveau loyer (hors charges)</td><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #059669;">${nouveauLoyer.toFixed(2)} €</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Variation</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${resultat.variation >= 0 ? "+" : ""}${resultat.variation.toFixed(2)}% (${resultat.augmentation >= 0 ? "+" : ""}${resultat.augmentation.toFixed(2)} €/mois)</td></tr>
          </table>

          <p><strong>Date d'application :</strong> ${dateApplicationStr}</p>

          <h3 style="color: #334155; margin-top: 24px;">Coordonnées du bailleur</h3>
          <p>${escapeHtml(nomBailleur)}${adresseBailleur ? `<br/>${escapeHtml(adresseBailleur)}` : ""}${telBailleur ? `<br/>Tél : ${escapeHtml(telBailleur)}` : ""}<br/>Email : contact@optibot.fr</p>

          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            Ce courrier tient lieu de notification de révision de loyer conformément aux articles 17-1 et 17-2 de la loi n° 89-462 du 6 juillet 1989 tendant à améliorer les rapports locatifs. En cas de contestation, vous pouvez saisir la commission départementale de conciliation dans un délai de 4 mois à compter de la réception de cette notification.
          </p>
        </div>
      `,
    });
  }

  return NextResponse.json({
    ok: true,
    action: "applied",
    ancienLoyer,
    nouveauLoyer,
    variation: resultat.variation,
  });
}
