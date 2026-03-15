import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

  const { alerteId } = await req.json();
  if (!alerteId) {
    return NextResponse.json({ error: 'alerteId requis' }, { status: 400 });
  }

  const alerte = await prisma.alerteBail.findUnique({
    where: { id: alerteId },
    include: { bail: { select: { userId: true } } },
  });

  if (!alerte || alerte.bail.userId !== user.id) {
    return NextResponse.json({ error: 'Alerte introuvable' }, { status: 404 });
  }

  const updated = await prisma.alerteBail.update({
    where: { id: alerteId },
    data: { traitee: true },
  });

  return NextResponse.json({ alerte: updated });
}
