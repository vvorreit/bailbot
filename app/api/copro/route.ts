import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { analyserDocumentCopro } from '@/lib/analyse-copro';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

  const documents = await prisma.documentCopro.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      bienId: true,
      nom: true,
      type: true,
      annee: true,
      trimestre: true,
      taille: true,
      analyseJson: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

  const body = await req.json();
  const { bienId, nom, type, annee, trimestre, contenu } = body;

  if (!bienId || !nom || !type || !annee || !contenu) {
    return NextResponse.json({ error: 'Champs requis : bienId, nom, type, annee, contenu' }, { status: 400 });
  }

  const typesValides = ['APPEL_CHARGES', 'RELEVE_DEPENSES', 'PV_ASSEMBLEE', 'BUDGET_PREVISIONNEL', 'AUTRE'];
  if (!typesValides.includes(type)) {
    return NextResponse.json({ error: 'Type de document invalide' }, { status: 400 });
  }

  const taille = Math.round((contenu.length * 3) / 4);
  const analyse = analyserDocumentCopro(contenu, type);

  const document = await prisma.documentCopro.create({
    data: {
      userId: user.id,
      bienId,
      nom,
      type,
      annee: parseInt(annee),
      trimestre: trimestre ? parseInt(trimestre) : null,
      contenu,
      taille,
      analyseJson: JSON.stringify(analyse),
    },
  });

  return NextResponse.json({
    document: {
      id: document.id,
      bienId: document.bienId,
      nom: document.nom,
      type: document.type,
      annee: document.annee,
      trimestre: document.trimestre,
      taille: document.taille,
      analyseJson: document.analyseJson,
      createdAt: document.createdAt,
    },
  }, { status: 201 });
}
