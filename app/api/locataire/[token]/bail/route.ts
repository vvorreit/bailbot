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
      locataireNom: true,
      locataireEmail: true,
      bienId: true,
      dateSignature: true,
      dateDebut: true,
      dateFin: true,
      loyerMensuel: true,
      chargesMensuelles: true,
      indiceRevision: true,
      dateProchRevision: true,
      statut: true,
      colocataires: true,
    },
  });

  if (!bail) {
    return NextResponse.json({ error: 'Bail introuvable' }, { status: 404 });
  }

  const bien = await prisma.bien.findFirst({
    where: { id: bail.bienId },
    select: { adresse: true },
  });

  return NextResponse.json({
    bail: {
      ...bail,
      adresseBien: bien?.adresse ?? bail.bienId,
    },
  });
}
