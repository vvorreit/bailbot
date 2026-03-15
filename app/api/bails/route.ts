import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { genererAlertes } from '@/lib/echeances-bail';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

  const bails = await prisma.bailActif.findMany({
    where: { userId: user.id },
    include: { alertes: { orderBy: { dateEcheance: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ bails });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

  const body = await req.json();
  const {
    bienId,
    locataireNom,
    locataireEmail,
    dateSignature,
    dateDebut,
    dateFin,
    dureePreavisMois,
    loyerMensuel,
    chargesMensuelles,
    indiceRevision,
    dateProchRevision,
    dateFinDiagnostics,
    colocataires,
    garants,
  } = body;

  if (!bienId || !locataireNom || !locataireEmail || !dateDebut || !loyerMensuel || !dateProchRevision) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  const bail = await prisma.bailActif.create({
    data: {
      userId: user.id,
      bienId,
      locataireNom,
      locataireEmail,
      dateSignature: new Date(dateSignature || dateDebut),
      dateDebut: new Date(dateDebut),
      dateFin: dateFin ? new Date(dateFin) : null,
      dureePreavisMois: parseInt(dureePreavisMois ?? '3', 10),
      loyerMensuel: parseFloat(loyerMensuel),
      chargesMensuelles: parseFloat(chargesMensuelles || '0'),
      indiceRevision: indiceRevision || 'IRL',
      dateProchRevision: new Date(dateProchRevision),
      dateFinDiagnostics: dateFinDiagnostics ? new Date(dateFinDiagnostics) : null,
      colocataires: Array.isArray(colocataires) ? colocataires : [],
      garants: Array.isArray(garants) ? garants : [],
    },
  });

  const alertesAGenerer = genererAlertes(bail);
  if (alertesAGenerer.length > 0) {
    await prisma.alerteBail.createMany({
      data: alertesAGenerer.map((a) => ({
        bailId: a.bailId,
        type: a.type,
        dateEcheance: a.dateEcheance,
      })),
    });
  }

  const bailComplet = await prisma.bailActif.findUnique({
    where: { id: bail.id },
    include: { alertes: true },
  });

  return NextResponse.json({ bail: bailComplet }, { status: 201 });
}
