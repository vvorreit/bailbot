import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

  const edls = await prisma.etatDesLieux.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ edls });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

  const body = await req.json();
  const { bienId, bailId, type, date, pieces, compteurs, cles, signatureLocataire, signatureBailleur } = body;

  if (!bienId || !type || !date || !pieces || !compteurs || !cles) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  if (type !== 'ENTREE' && type !== 'SORTIE') {
    return NextResponse.json({ error: 'Type EDL invalide' }, { status: 400 });
  }

  const edl = await prisma.etatDesLieux.create({
    data: {
      userId: user.id,
      bienId,
      bailId: bailId || null,
      type,
      date: new Date(date),
      pieces,
      compteurs,
      cles,
      signatureLocataire: signatureLocataire || null,
      signatureBailleur: signatureBailleur || null,
    },
  });

  return NextResponse.json({ edl }, { status: 201 });
}
