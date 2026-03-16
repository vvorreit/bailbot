import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

  const body = await req.json();
  const { biens, paiements, candidatures } = body;

  let biensCount = 0;
  let paiementsCount = 0;
  let candidaturesCount = 0;

  if (Array.isArray(biens)) {
    for (const b of biens) {
      await prisma.bien.upsert({
        where: { id: b.id },
        update: {},
        create: {
          id: b.id,
          userId: user.id,
          adresse: b.adresse,
          loyer: b.loyer ?? 0,
          charges: b.charges ?? 0,
          typeBail: b.typeBail ?? 'HABITATION_VIDE',
          locataireNom: b.locataireNom ?? null,
          locatairePrenom: b.locatairePrenom ?? null,
          dateEntree: b.dateEntree ? new Date(b.dateEntree) : null,
          dateFin: b.dateFin ? new Date(b.dateFin) : null,
          preavisMois: b.preavisMois ?? null,
          dateRevision: b.dateRevision ? new Date(b.dateRevision) : null,
          indiceReference: b.indiceReference ?? null,
          diagnostics: b.diagnostics ?? [],
          statut: b.statut ?? 'vacant',
          annexes: b.annexes ?? [],
          createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
        },
      });
      biensCount++;
    }
  }

  if (Array.isArray(paiements)) {
    for (const p of paiements) {
      await prisma.paiementBien.upsert({
        where: { id: p.id },
        update: {},
        create: {
          id: p.id,
          userId: user.id,
          bienId: p.bienId,
          locataireNom: p.locataireNom ?? '',
          locatairePrenom: p.locatairePrenom ?? null,
          locataireEmail: p.locataireEmail ?? null,
          loyerCC: p.loyerCC ?? 0,
          dateAttendue: new Date(p.dateAttendue),
          dateReelle: p.dateReelle ? new Date(p.dateReelle) : null,
          statut: p.statut ?? 'attendu',
          montantRecu: p.montantRecu ?? null,
          mois: p.mois,
          notes: p.notes ?? null,
          relances: p.relances ?? [],
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        },
      });
      paiementsCount++;
    }
  }

  if (Array.isArray(candidatures)) {
    for (const c of candidatures) {
      await prisma.candidatureLocal.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          userId: user.id,
          bienId: c.bienId,
          statut: c.statut ?? 'en_attente',
          dossier: c.dossier ?? {},
          bailScore: c.bailScore ?? null,
          scoreGrade: c.scoreGrade ?? null,
          eligibleVisale: c.eligibleVisale ?? null,
          alertesFraude: c.alertesFraude ?? null,
          aGarant: c.aGarant ?? false,
          dossierGarant: c.dossierGarant ?? null,
          completude: c.completude ?? null,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        },
      });
      candidaturesCount++;
    }
  }

  return NextResponse.json({
    success: true,
    migrated: {
      biens: biensCount,
      paiements: paiementsCount,
      candidatures: candidaturesCount,
    },
  });
}
