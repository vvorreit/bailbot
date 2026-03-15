import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const depot = await prisma.depotToken.findUnique({
    where: { token },
    include: { _count: { select: { fichiers: true } } },
  });

  if (!depot) return NextResponse.json({ error: 'Token invalide' }, { status: 404 });
  if (depot.expiresAt < new Date()) return NextResponse.json({ error: 'Ce lien a expiré' }, { status: 410 });

  const existingCount = (depot as any)._count.fichiers;
  if (existingCount >= MAX_FILES) {
    return NextResponse.json({ error: 'Limite de fichiers atteinte (10 max)' }, { status: 429 });
  }

  const formData = await req.formData();
  const fichierChiffre = formData.get('fichier') as File | null;
  const iv = formData.get('iv') as string | null;
  const nomOriginal = formData.get('nomOriginal') as string | null;
  const nomRenomme = formData.get('nomRenomme') as string | null;

  if (!fichierChiffre || !iv || !nomOriginal || !nomRenomme) {
    return NextResponse.json({ error: 'Champs manquants : fichier, iv, nomOriginal, nomRenomme' }, { status: 400 });
  }

  if (fichierChiffre.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (10MB max)' }, { status: 413 });
  }

  if (existingCount + 1 > MAX_FILES) {
    return NextResponse.json({ error: 'Limite de fichiers atteinte' }, { status: 429 });
  }

  const arrayBuffer = await fichierChiffre.arrayBuffer();
  const contenuBuffer = Buffer.from(arrayBuffer);

  const fichier = await prisma.fichierChiffre.create({
    data: {
      id: randomUUID(),
      tokenId: depot.id,
      nomOriginal,
      nomRenomme,
      contenu: contenuBuffer,
      iv,
      taille: fichierChiffre.size,
    },
  });

  return NextResponse.json({ id: fichier.id, nomRenomme: fichier.nomRenomme });
}
