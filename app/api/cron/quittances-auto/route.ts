import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { genererQuittancePDF } from "@/lib/generateur-quittance";
import { generateQuittanceNumero } from "@/lib/quittance-numero";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  const now = new Date();
  const moisCle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const moisNom = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const dernierJour = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const periodeDebut = `1er ${moisNom}`;
  const periodeFin = `${dernierJour} ${moisNom}`;
  const dateReglement = now.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const bails = await prisma.bailActif.findMany({
    where: {
      statut: "ACTIF",
      quittancesAuto: { none: { mois: moisCle } },
    },
    include: { quittancesAuto: false },
  });

  if (bails.length === 0) {
    return NextResponse.json({ success: true, envoyees: 0, message: "Aucun bail à traiter" });
  }

  const userIds = [...new Set(bails.map((b) => b.userId))];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
  const usersMap = new Map(users.map((u) => [u.id, u]));

  interface PdfResult {
    bailId: string;
    bienId: string;
    userId: string;
    locataireNom: string;
    locataireEmail: string;
    descriptionLot: string | null;
    base64: string;
    numero: string;
  }

  const resultats: PdfResult[] = [];
  const erreurs: string[] = [];
  let emailsLocataire = 0;

  for (const bail of bails) {
    try {
      const user = usersMap.get(bail.userId);
      if (!user?.email) {
        erreurs.push(`${bail.id}: propriétaire sans email`);
        continue;
      }

      const parts = bail.locataireNom.trim().split(/\s+/);
      const prenomLocataire = parts.length > 1 ? parts[0] : "";
      const nomLocataire = parts.length > 1 ? parts.slice(1).join(" ") : parts[0];
      const adresseLot = bail.descriptionLot
        ? `${bail.descriptionLot} — ${bail.bienId}`
        : bail.bienId;

      const numero = await generateQuittanceNumero();

      const blob = genererQuittancePDF({
        nomBailleur: user.name || "Le bailleur",
        adresseBailleur: "",
        nomLocataire,
        prenomLocataire,
        adresseBien: adresseLot,
        loyerHC: bail.loyerMensuel,
        charges: bail.chargesMensuelles,
        mois: moisNom,
        dateReglement,
        modePaiement: "virement bancaire",
        periodeDebut,
        periodeFin,
      });

      const arrayBuffer = await blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      resultats.push({
        bailId: bail.id,
        bienId: bail.bienId,
        userId: bail.userId,
        locataireNom: bail.locataireNom,
        locataireEmail: bail.locataireEmail,
        descriptionLot: bail.descriptionLot,
        base64,
        numero,
      });

      /* ── Email locataire ── */
      const total = bail.loyerMensuel + bail.chargesMensuelles;
      await sendMail({
        to: bail.locataireEmail,
        subject: `Quittance de loyer — ${moisNom}`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 32px 24px;">
    <h2 style="color: #0f172a; margin-top: 0;">Votre quittance de loyer</h2>
    <p>Bonjour ${bail.locataireNom},</p>
    <p>Veuillez trouver ci-dessous votre quittance de loyer pour le mois de <strong>${moisNom}</strong>.</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Loyer :</strong> ${bail.loyerMensuel.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
      <p style="margin: 4px 0;"><strong>Charges :</strong> ${bail.chargesMensuelles.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
      <p style="margin: 4px 0;"><strong>Total :</strong> ${total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
    </div>
    <p style="text-align: center; margin: 24px 0;">
      <a href="data:application/pdf;base64,${base64}" download="quittance-${moisCle}.pdf"
         style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Télécharger la quittance (PDF)
      </a>
    </p>
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    BailBot · contact@optibot.fr
  </p>
</div>`,
      });
      emailsLocataire++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      erreurs.push(`${bail.id}: ${msg}`);
    }
  }

  /* ── Emails proprio groupés par bien ── */
  const parBien = new Map<string, PdfResult[]>();
  for (const r of resultats) {
    const key = `${r.userId}::${r.bienId}`;
    if (!parBien.has(key)) parBien.set(key, []);
    parBien.get(key)!.push(r);
  }

  let emailsProprio = 0;
  for (const [, pdfs] of parBien) {
    const user = usersMap.get(pdfs[0].userId);
    if (!user?.email) continue;

    try {
      const nbBaux = pdfs.length;
      const bienLabel = pdfs[0].descriptionLot
        ? `${pdfs[0].descriptionLot} (${pdfs[0].bienId})`
        : pdfs[0].bienId;

      const lignesRecap = pdfs
        .map((p, i) => {
          const lotLabel = p.descriptionLot || `Bail ${i + 1}`;
          return `
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 8px 0;">
      <p style="margin: 4px 0;"><strong>${lotLabel}</strong> — ${p.locataireNom}</p>
      <p style="margin: 8px 0;">
        <a href="data:application/pdf;base64,${p.base64}" download="quittance-${p.locataireNom.replace(/\s+/g, "-")}-${moisCle}.pdf"
           style="color: #4f46e5; text-decoration: underline;">
          Télécharger la quittance PDF
        </a>
      </p>
    </div>`;
        })
        .join("");

      await sendMail({
        to: user.email,
        subject: `[BailBot] ${nbBaux} quittance${nbBaux > 1 ? "s" : ""} envoyée${nbBaux > 1 ? "s" : ""} — ${moisNom}`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 32px 24px;">
    <h2 style="color: #0f172a; margin-top: 0;">Récapitulatif quittances — ${moisNom}</h2>
    <p>Bonjour ${user.name || ""},</p>
    <p>${nbBaux} quittance${nbBaux > 1 ? "s ont" : " a"} été envoyée${nbBaux > 1 ? "s" : ""} pour le bien <strong>${bienLabel}</strong>.</p>
    ${lignesRecap}
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    BailBot · contact@optibot.fr
  </p>
</div>`,
      });
      emailsProprio++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      erreurs.push(`proprio-${pdfs[0].bienId}: ${msg}`);
    }
  }

  /* ── Créer les QuittanceAuto en DB ── */
  for (const r of resultats) {
    const user = usersMap.get(r.userId);
    try {
      await prisma.quittanceAuto.create({
        data: {
          bailId: r.bailId,
          mois: moisCle,
          numero: r.numero,
          emailLocataire: r.locataireEmail,
          emailProprio: user?.email || "",
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      erreurs.push(`db-${r.bailId}: ${msg}`);
    }
  }

  return NextResponse.json({
    success: true,
    mois: moisCle,
    emailsLocataire,
    emailsProprio,
    quittancesCrees: resultats.length,
    erreurs: erreurs.length > 0 ? erreurs : undefined,
  });
}
