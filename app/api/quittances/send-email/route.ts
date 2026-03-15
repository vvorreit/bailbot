import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = await req.json();
  const { locataireEmail, locataireNom, mois, montant, pdfBase64, nomBailleur } = body;

  if (!locataireEmail || !pdfBase64) {
    return NextResponse.json({ error: 'locataireEmail et pdfBase64 requis' }, { status: 400 });
  }

  const total = typeof montant === 'number' ? montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : montant;

  await sendMail({
    to: locataireEmail,
    subject: `Quittance de loyer — ${mois || 'mensuelle'}`,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 32px 24px;">
    <h2 style="color: #0f172a; margin-top: 0;">Votre quittance de loyer</h2>
    <p>Bonjour ${locataireNom || ''},</p>
    <p>Veuillez trouver ci-dessous votre quittance de loyer pour le mois de <strong>${mois || ''}</strong>.</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Montant total :</strong> ${total} &euro;</p>
    </div>
    <p style="text-align: center; margin: 24px 0;">
      <a href="data:application/pdf;base64,${pdfBase64}" download="quittance-${(mois || '').replace(/\s+/g, '_')}.pdf"
         style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        T&eacute;l&eacute;charger la quittance (PDF)
      </a>
    </p>
    <p style="font-size: 13px; color: #64748b;">
      Ce document a &eacute;t&eacute; envoy&eacute; par ${nomBailleur || 'votre bailleur'} via BailBot.
    </p>
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    BailBot &middot; contact@optibot.fr
  </p>
</div>`,
  });

  return NextResponse.json({ success: true });
}
