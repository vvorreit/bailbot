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

  const espaces = await prisma.espaceLocataire.findMany({
    where: { userId: user.id },
    include: {
      demandes: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  /* Enrichir avec les infos bail */
  const bailIds = espaces.map((e) => e.bailId);
  const bails = await prisma.bailActif.findMany({
    where: { id: { in: bailIds } },
    select: {
      id: true,
      locataireNom: true,
      locataireEmail: true,
      bienId: true,
      loyerMensuel: true,
      statut: true,
    },
  });

  const bailMap = Object.fromEntries(bails.map((b) => [b.id, b]));

  const enriched = espaces.map((e) => ({
    ...e,
    bail: bailMap[e.bailId] || null,
  }));

  return NextResponse.json({ espaces: enriched });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

  const body = await req.json();
  const { bailId } = body;

  if (!bailId) {
    return NextResponse.json({ error: 'bailId requis' }, { status: 400 });
  }

  /* Vérifier que le bail appartient à l'utilisateur */
  const bail = await prisma.bailActif.findFirst({
    where: { id: bailId, userId: user.id },
  });

  if (!bail) {
    return NextResponse.json({ error: 'Bail introuvable' }, { status: 404 });
  }

  /* Vérifier qu'il n'y a pas déjà un espace pour ce bail */
  const existing = await prisma.espaceLocataire.findUnique({
    where: { bailId },
  });

  if (existing) {
    return NextResponse.json({ error: 'Un espace locataire existe déjà pour ce bail' }, { status: 409 });
  }

  const espace = await prisma.espaceLocataire.create({
    data: {
      userId: user.id,
      bailId,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ espace }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

  const body = await req.json();

  /* Répondre à une demande */
  if (body.demandeId && body.reponse !== undefined) {
    const demande = await prisma.demandeLocataire.findUnique({
      where: { id: body.demandeId },
      include: { espace: true },
    });

    if (!demande || demande.espace.userId !== user.id) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    const updated = await prisma.demandeLocataire.update({
      where: { id: body.demandeId },
      data: {
        reponse: body.reponse,
        statut: body.statut || 'RESOLU',
      },
    });

    return NextResponse.json({ demande: updated });
  }

  /* Toggle actif/inactif */
  if (body.espaceId && body.actif !== undefined) {
    const espace = await prisma.espaceLocataire.findFirst({
      where: { id: body.espaceId, userId: user.id },
    });

    if (!espace) {
      return NextResponse.json({ error: 'Espace introuvable' }, { status: 404 });
    }

    const updated = await prisma.espaceLocataire.update({
      where: { id: body.espaceId },
      data: { actif: body.actif },
    });

    return NextResponse.json({ espace: updated });
  }

  return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const espaceId = searchParams.get('id');

  if (!espaceId) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 });
  }

  const espace = await prisma.espaceLocataire.findFirst({
    where: { id: espaceId, userId: user.id },
  });

  if (!espace) {
    return NextResponse.json({ error: 'Espace introuvable' }, { status: 404 });
  }

  await prisma.espaceLocataire.delete({ where: { id: espaceId } });

  return NextResponse.json({ ok: true });
}
