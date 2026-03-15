import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

  const body = await req.json();
  const { bienAdresse, message, dureeHeures = 24 } = body;

  if (!bienAdresse) {
    return NextResponse.json({ error: 'bienAdresse requis' }, { status: 400 });
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + dureeHeures * 60 * 60 * 1000);

  const depot = await prisma.depotToken.create({
    data: {
      token,
      userId: user.id,
      bienAdresse,
      message: message || null,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3011';
  const lien = `${baseUrl}/depot/${token}`;

  return NextResponse.json({ token: depot.token, lien, expiresAt: depot.expiresAt });
}
