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
  const { candidatEmail, bienAdresse, lienDepot, message, expiresAt } = body;

  if (!candidatEmail || !lienDepot) {
    return NextResponse.json({ error: 'candidatEmail et lienDepot requis' }, { status: 400 });
  }

  const dateExpiration = expiresAt
    ? new Date(expiresAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  const messageHtml = message
    ? message.replace(/\n/g, '<br>')
    : '';

  await sendMail({
    to: candidatEmail,
    subject: `Dépôt de dossier — ${bienAdresse || 'votre candidature'}`,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 32px 24px;">
    <h2 style="color: #0f172a; margin-top: 0;">D&eacute;posez votre dossier de candidature</h2>
    ${messageHtml ? `<div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 14px; line-height: 1.6;">${messageHtml}</div>` : ''}
    ${bienAdresse ? `<p><strong>Bien concern&eacute; :</strong> ${bienAdresse}</p>` : ''}
    <div style="text-align: center; margin: 28px 0;">
      <a href="${lienDepot}"
         style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
        D&eacute;poser mon dossier &rarr;
      </a>
    </div>
    ${dateExpiration ? `<p style="font-size: 13px; color: #64748b; text-align: center;">Ce lien expire le <strong>${dateExpiration}</strong></p>` : ''}
    <p style="font-size: 13px; color: #64748b;">
      Vos documents sont chiffr&eacute;s dans votre navigateur avant envoi. Personne ne peut les lire en transit.
    </p>
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    BailBot &middot; contact@optibot.fr
  </p>
</div>`,
  });

  return NextResponse.json({ success: true });
}
