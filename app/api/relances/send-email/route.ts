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
  const { locataireEmail, locataireNom, objet, corps, pdfBase64, etapeNumero, nomBailleur } = body;

  if (!locataireEmail || !objet) {
    return NextResponse.json({ error: 'locataireEmail et objet requis' }, { status: 400 });
  }

  const isMiseEnDemeure = etapeNumero === 3;

  await sendMail({
    to: locataireEmail,
    subject: objet,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: ${isMiseEnDemeure ? '#fef2f2' : '#f8fafc'}; border-radius: 12px; padding: 32px 24px; ${isMiseEnDemeure ? 'border: 1px solid #fecaca;' : ''}">
    <h2 style="color: #0f172a; margin-top: 0;">${objet}</h2>
    <p>Bonjour ${locataireNom || ''},</p>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; white-space: pre-line; font-size: 14px; line-height: 1.6;">
${corps || ''}
    </div>
    ${pdfBase64 ? `<p style="text-align: center; margin: 24px 0;">
      <a href="data:application/pdf;base64,${pdfBase64}" download="${isMiseEnDemeure ? 'mise-en-demeure' : 'courrier-relance'}.pdf"
         style="display: inline-block; background: ${isMiseEnDemeure ? '#dc2626' : '#10b981'}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        T&eacute;l&eacute;charger le courrier (PDF)
      </a>
    </p>` : ''}
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    ${nomBailleur || ''} &mdash; BailBot &middot; contact@optibot.fr
  </p>
</div>`,
  });

  return NextResponse.json({ success: true });
}
