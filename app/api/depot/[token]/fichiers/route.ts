import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/depot/[token]/fichiers — gestionnaire authentifié
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { token } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

  const depot = await prisma.depotToken.findUnique({
    where: { token },
    include: { fichiers: true },
  });

  if (!depot) return NextResponse.json({ error: 'Token introuvable' }, { status: 404 });
  if (depot.userId !== user.id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const fichiers = depot.fichiers.map((f) => ({
    id: f.id,
    nomOriginal: f.nomOriginal,
    nomRenomme: f.nomRenomme,
    taille: f.taille,
    iv: f.iv,
    uploadedAt: f.uploadedAt,
    contenuBase64: Buffer.from(f.contenu).toString('base64'),
  }));

  return NextResponse.json({ fichiers, bienAdresse: depot.bienAdresse, expiresAt: depot.expiresAt });
}
