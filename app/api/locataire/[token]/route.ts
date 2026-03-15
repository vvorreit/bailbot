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
  });

  if (!bail) {
    return NextResponse.json({ error: 'Bail introuvable' }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: espace.userId },
    select: { name: true, email: true },
  });

  return NextResponse.json({
    locataireNom: bail.locataireNom,
    bienId: bail.bienId,
    loyerMensuel: bail.loyerMensuel,
    chargesMensuelles: bail.chargesMensuelles,
    dateDebut: bail.dateDebut,
    dateFin: bail.dateFin,
    indiceRevision: bail.indiceRevision,
    dateProchRevision: bail.dateProchRevision,
    statut: bail.statut,
    gestionnaire: {
      nom: user?.name || 'Votre gestionnaire',
      email: user?.email || null,
    },
  });
}
