import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendMail, smtpConfigured, escapeHtml } from '@/lib/mailer';

const TYPES_VALIDES = ['DOCUMENT', 'TRAVAUX', 'QUESTION', 'CONGE'] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const espace = await prisma.espaceLocataire.findUnique({
    where: { token },
  });

  if (!espace || !espace.actif || new Date(espace.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Espace invalide ou expiré' }, { status: 403 });
  }

  const demandes = await prisma.demandeLocataire.findMany({
    where: { espaceId: espace.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ demandes });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const espace = await prisma.espaceLocataire.findUnique({
    where: { token },
  });

  if (!espace || !espace.actif || new Date(espace.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Espace invalide ou expiré' }, { status: 403 });
  }

  const body = await req.json();
  const { type, message } = body;

  if (!type || !message?.trim()) {
    return NextResponse.json({ error: 'Type et message requis' }, { status: 400 });
  }

  if (typeof message !== 'string' || message.length > 5000) {
    return NextResponse.json({ error: 'Message trop long (max 5000 caractères)' }, { status: 400 });
  }

  if (!TYPES_VALIDES.includes(type)) {
    return NextResponse.json({ error: 'Type de demande invalide' }, { status: 400 });
  }

  const demande = await prisma.demandeLocataire.create({
    data: {
      espaceId: espace.id,
      type,
      message: message.trim(),
    },
  });

  /* Notification email gestionnaire */
  try {
    const bail = await prisma.bailActif.findUnique({
      where: { id: espace.bailId },
    });
    const user = await prisma.user.findUnique({
      where: { id: espace.userId },
      select: { email: true },
    });

    if (user?.email && smtpConfigured()) {
      const TYPE_LABELS: Record<string, string> = {
        DOCUMENT: 'Demande de document',
        TRAVAUX: 'Signalement travaux / réparation',
        QUESTION: 'Question générale',
        CONGE: 'Préavis de départ',
      };

      await sendMail({
        to: user.email,
        subject: `[BailBot] Nouvelle demande locataire — ${bail?.locataireNom || 'Locataire'}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#059669">Nouvelle demande locataire</h2>
            <p><strong>Locataire :</strong> ${bail?.locataireNom || '—'}</p>
            <p><strong>Type :</strong> ${TYPE_LABELS[type] || type}</p>
            <p><strong>Message :</strong></p>
            <blockquote style="border-left:3px solid #059669;padding-left:12px;color:#475569">
              ${escapeHtml(message.trim()).replace(/\n/g, '<br>')}
            </blockquote>
            <p style="margin-top:20px">
              <a href="${process.env.NEXTAUTH_URL || 'https://app.optibot.fr'}/dashboard/espaces-locataires"
                 style="background:#059669;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">
                Répondre dans BailBot
              </a>
            </p>
            <p style="font-size:12px;color:#94a3b8;margin-top:24px">
              Cet email a été envoyé automatiquement par BailBot.
            </p>
          </div>
        `,
      });
    }
  } catch (e) {
    console.error('[espace-locataire] Erreur envoi notification:', e);
  }

  return NextResponse.json({ demande }, { status: 201 });
}
