import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { getTemplate } from '@/lib/templates-relance-candidat';

// GET /api/relances/candidat — liste les relances du gestionnaire connecté
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

  const relances = await prisma.relanceCandidat.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ relances });
}

// POST /api/relances/candidat — créer ou déclencher une relance manuelle
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

  const body = await req.json();
  const { depotToken, email, telephone, sequence, docsManquants, prenomNom } = body;

  if (!depotToken || !email) {
    return NextResponse.json({ error: 'depotToken et email requis' }, { status: 400 });
  }

  const seq = (sequence as 1 | 2 | 3) ?? 1;

  // Chercher le depot pour récupérer l'adresse du bien
  const depot = await prisma.depotToken.findUnique({ where: { token: depotToken } });
  if (!depot || depot.userId !== user.id) {
    return NextResponse.json({ error: 'Dépôt introuvable ou accès refusé' }, { status: 403 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3011';
  const lienDepot = `${baseUrl}/depot/${depotToken}`;

  const tpl = getTemplate(seq, {
    prenomNom: prenomNom ?? undefined,
    bienAdresse: depot.bienAdresse,
    lienDepot,
    docsManquants: docsManquants ?? [],
    nomGestionnaire: user.rechercheMasquee ? undefined : (user.name ?? undefined),
  });

  // Upsert relance en base
  const relanceExistante = await prisma.relanceCandidat.findFirst({
    where: { depotToken, userId: user.id },
  });

  const statutMap = {
    1: 'RELANCE_1',
    2: 'RELANCE_2',
    3: 'RELANCE_3',
  } as const;

  let relance;
  if (relanceExistante) {
    relance = await prisma.relanceCandidat.update({
      where: { id: relanceExistante.id },
      data: {
        sequence: seq,
        statut: statutMap[seq],
        derniereRelance: new Date(),
      },
    });
  } else {
    relance = await prisma.relanceCandidat.create({
      data: {
        depotToken,
        userId: user.id,
        email,
        telephone: telephone ?? null,
        sequence: seq,
        statut: statutMap[seq],
        derniereRelance: new Date(),
      },
    });
  }

  await sendMail({
    to: email,
    subject: tpl.sujet,
    html: tpl.corps,
  });

  return NextResponse.json({ success: true, relance });
}
