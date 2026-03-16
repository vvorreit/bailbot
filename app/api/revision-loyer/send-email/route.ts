import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendMail, escapeHtml } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = await req.json();
  const { locataireEmail, locataireNom, nomBailleur, loyerActuel, nouveauLoyer, dateApplication, pdfBase64 } = body;

  if (!locataireEmail || !pdfBase64) {
    return NextResponse.json({ error: 'locataireEmail et pdfBase64 requis' }, { status: 400 });
  }

  await sendMail({
    to: locataireEmail,
    subject: `Révision annuelle de votre loyer — applicable au ${dateApplication || ''}`,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 32px 24px;">
    <h2 style="color: #0f172a; margin-top: 0;">Révision annuelle du loyer</h2>
    <p>Bonjour ${escapeHtml(locataireNom || '')},</p>
    <p>Conform&eacute;ment &agrave; l'article 17-1 de la loi du 6 juillet 1989, votre loyer sera r&eacute;vis&eacute; :</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Loyer actuel :</strong> ${typeof loyerActuel === 'number' ? loyerActuel.toFixed(2) : loyerActuel} &euro;</p>
      <p style="margin: 4px 0;"><strong>Nouveau loyer :</strong> ${typeof nouveauLoyer === 'number' ? nouveauLoyer.toFixed(2) : nouveauLoyer} &euro;</p>
      <p style="margin: 4px 0;"><strong>Applicable &agrave; compter du :</strong> ${dateApplication || ''}</p>
    </div>
    <p>Vous trouverez le courrier officiel en pi&egrave;ce jointe ci-dessous.</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="data:application/pdf;base64,${pdfBase64}" download="revision-loyer.pdf"
         style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        T&eacute;l&eacute;charger le courrier (PDF)
      </a>
    </p>
    <p style="font-size: 13px; color: #64748b;">
      Ce courrier a &eacute;t&eacute; envoy&eacute; par ${escapeHtml(nomBailleur || 'votre bailleur')} via BailBot.
    </p>
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    BailBot &middot; contact@optibot.fr
  </p>
</div>`,
  });

  return NextResponse.json({ success: true });
}
