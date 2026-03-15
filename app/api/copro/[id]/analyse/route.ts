import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { analyserDocumentCopro } from '@/lib/analyse-copro';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

  const { id } = await params;

  const document = await prisma.documentCopro.findFirst({
    where: { id, userId: user.id },
  });

  if (!document) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }

  const analyse = analyserDocumentCopro(document.contenu, document.type);

  await prisma.documentCopro.update({
    where: { id },
    data: { analyseJson: JSON.stringify(analyse) },
  });

  return NextResponse.json({ analyse });
}
