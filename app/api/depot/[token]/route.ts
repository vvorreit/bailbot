import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/depot/[token] — public, pour affichage locataire
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const depot = await prisma.depotToken.findUnique({ where: { token } });

  if (!depot) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 404 });
  }
  if (depot.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Ce lien a expiré' }, { status: 410 });
  }

  return NextResponse.json({
    bienAdresse: depot.bienAdresse,
    message: depot.message,
    expiresAt: depot.expiresAt,
    used: depot.used,
  });
}

// DELETE /api/depot/[token] — gestionnaire authentifié
export async function DELETE(
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

  const depot = await prisma.depotToken.findUnique({ where: { token } });
  if (!depot) return NextResponse.json({ error: 'Token introuvable' }, { status: 404 });
  if (depot.userId !== user.id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  await prisma.depotToken.delete({ where: { token } });
  return NextResponse.json({ success: true });
}
