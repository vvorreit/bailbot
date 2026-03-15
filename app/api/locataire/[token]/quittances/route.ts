import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const espace = await prisma.espaceLocataire.findUnique({
    where: { token },
  });

  if (!espace || !espace.actif) {
    return NextResponse.json({ error: 'Espace introuvable ou désactivé' }, { status: 404 });
  }

  if (new Date(espace.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Lien expiré' }, { status: 410 });
  }

  const bail = await prisma.bailActif.findUnique({
    where: { id: espace.bailId },
    select: {
      id: true,
      locataireNom: true,
      dateDebut: true,
      loyerMensuel: true,
      chargesMensuelles: true,
      quittancesAuto: {
        orderBy: { mois: 'desc' },
        take: 24,
      },
    },
  });

  if (!bail) {
    return NextResponse.json({ quittances: [] });
  }

  const debut = new Date(bail.dateDebut);
  const now = new Date();
  const moisList: { mois: string; label: string; envoye: boolean }[] = [];
  const cursor = new Date(debut.getFullYear(), debut.getMonth(), 1);
  const quittancesMois = new Set(bail.quittancesAuto.map((q) => q.mois));

  while (cursor <= now && moisList.length < 24) {
    const moisKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    moisList.push({
      mois: moisKey,
      label: cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      envoye: quittancesMois.has(moisKey),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return NextResponse.json({
    quittances: moisList.reverse(),
    loyerMensuel: bail.loyerMensuel,
    chargesMensuelles: bail.chargesMensuelles,
  });
}
