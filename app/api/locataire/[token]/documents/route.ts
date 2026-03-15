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

  if (!espace || !espace.actif || new Date(espace.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Espace invalide ou expiré' }, { status: 403 });
  }

  const bail = await prisma.bailActif.findUnique({
    where: { id: espace.bailId },
    select: {
      id: true,
      locataireNom: true,
      dateDebut: true,
      loyerMensuel: true,
      chargesMensuelles: true,
    },
  });

  if (!bail) {
    return NextResponse.json({ documents: [] });
  }

  /* EDL entrée lié au bail */
  const edlEntree = await prisma.etatDesLieux.findFirst({
    where: { bailId: bail.id, type: 'ENTREE' },
    select: { id: true, date: true, pdfUrl: true },
  });

  /* Quittances : on génère la liste des mois depuis dateDebut */
  const debut = new Date(bail.dateDebut);
  const now = new Date();
  const quittances: { mois: string; annee: number }[] = [];
  const cursor = new Date(debut.getFullYear(), debut.getMonth(), 1);

  while (cursor <= now && quittances.length < 24) {
    quittances.push({
      mois: cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      annee: cursor.getFullYear(),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return NextResponse.json({
    documents: {
      quittances: quittances.reverse(),
      edlEntree: edlEntree ? { id: edlEntree.id, date: edlEntree.date, pdfUrl: edlEntree.pdfUrl } : null,
    },
  });
}
