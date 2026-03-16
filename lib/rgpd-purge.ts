import { prisma } from '@/lib/db';
import { createHash } from 'crypto';

const TROIS_MOIS = 90 * 24 * 60 * 60 * 1000;
const TREIZE_MOIS = 13 * 30 * 24 * 60 * 60 * 1000;
const TROIS_ANS = 3 * 365 * 24 * 60 * 60 * 1000;

function anonymizeEmail(email: string): string {
  return createHash('sha256').update(email).digest('hex').slice(0, 16) + '@supprime.rgpd';
}

export interface PurgeResult {
  candidaturesRefusees: number;
  candidaturesExpirees: number;
  depotTokensExpires: number;
  comptesInactifs: number;
  tokensProprietaireExpires: number;
  timestamp: string;
}

/**
 * Purge des dossiers candidats refusés : 3 mois après refus
 */
export async function purgerCandidaturesRefusees(): Promise<number> {
  const seuil = new Date(Date.now() - TROIS_MOIS);

  const result = await prisma.candidatureLocal.deleteMany({
    where: {
      statut: { in: ['refuse', 'rejete'] },
      updatedAt: { lt: seuil },
    },
  });

  return result.count;
}

/**
 * Purge des dossiers candidats non traités : 3 mois après dépôt
 */
export async function purgerCandidaturesExpirees(): Promise<number> {
  const seuil = new Date(Date.now() - TROIS_MOIS);

  const result = await prisma.candidatureLocal.deleteMany({
    where: {
      statut: 'en_attente',
      createdAt: { lt: seuil },
    },
  });

  return result.count;
}

/**
 * Purge des dépôts de documents expirés
 */
export async function purgerDepotTokensExpires(): Promise<number> {
  const result = await prisma.depotToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  return result.count;
}

/**
 * Anonymise les comptes inactifs sans bail actif depuis 3 ans
 */
export async function anonymiserComptesInactifs(): Promise<number> {
  const seuil = new Date(Date.now() - TROIS_ANS);

  const inactifs = await prisma.user.findMany({
    where: {
      lastActiveAt: { lt: seuil },
      NOT: {
        id: {
          in: (await prisma.bailActif.findMany({
            where: { statut: 'ACTIF' },
            select: { userId: true },
            distinct: ['userId'],
          })).map(b => b.userId),
        },
      },
    },
    select: { id: true, email: true },
  });

  let count = 0;
  for (const user of inactifs) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: 'Compte supprimé',
        email: anonymizeEmail(user.email ?? user.id),
        telephone: null,
        ville: null,
        bailleurNom: null,
        bailleurAdresse: null,
        siret: null,
        password: null,
        image: null,
      },
    });
    count++;
  }

  return count;
}

/**
 * Révoquer les tokens propriétaire expirés
 */
export async function revoquerTokensProprietaireExpires(): Promise<number> {
  const result = await prisma.bailActif.updateMany({
    where: {
      tokenProprietaireExpiresAt: { lt: new Date() },
      tokenProprietaire: { not: null },
    },
    data: {
      tokenProprietaire: null,
      tokenProprietaireExpiresAt: null,
    },
  });

  return result.count;
}

/**
 * Exécute toutes les purges RGPD et log les résultats
 */
export async function executerPurgeRGPD(): Promise<PurgeResult> {
  const candidaturesRefusees = await purgerCandidaturesRefusees();
  const candidaturesExpirees = await purgerCandidaturesExpirees();
  const depotTokensExpires = await purgerDepotTokensExpires();
  const comptesInactifs = await anonymiserComptesInactifs();
  const tokensProprietaireExpires = await revoquerTokensProprietaireExpires();

  const result: PurgeResult = {
    candidaturesRefusees,
    candidaturesExpirees,
    depotTokensExpires,
    comptesInactifs,
    tokensProprietaireExpires,
    timestamp: new Date().toISOString(),
  };

  await prisma.auditLog.create({
    data: {
      action: 'PURGE_RGPD',
      details: JSON.stringify(result),
    },
  });

  return result;
}

/**
 * Retourne les données en attente de purge (pour le tableau de bord admin)
 */
export async function getPendingPurges() {
  const seuilTroisMois = new Date(Date.now() - TROIS_MOIS);
  const seuilTroisAns = new Date(Date.now() - TROIS_ANS);

  const [candidaturesRefusees, candidaturesExpirees, depotTokens, comptesInactifs, tokensExpires] = await Promise.all([
    prisma.candidatureLocal.count({
      where: { statut: { in: ['refuse', 'rejete'] }, updatedAt: { lt: seuilTroisMois } },
    }),
    prisma.candidatureLocal.count({
      where: { statut: 'en_attente', createdAt: { lt: seuilTroisMois } },
    }),
    prisma.depotToken.count({
      where: { expiresAt: { lt: new Date() } },
    }),
    prisma.user.count({
      where: {
        lastActiveAt: { lt: seuilTroisAns },
        NOT: {
          id: {
            in: (await prisma.bailActif.findMany({
              where: { statut: 'ACTIF' },
              select: { userId: true },
              distinct: ['userId'],
            })).map(b => b.userId),
          },
        },
      },
    }),
    prisma.bailActif.count({
      where: {
        tokenProprietaireExpiresAt: { lt: new Date() },
        tokenProprietaire: { not: null },
      },
    }),
  ]);

  return {
    candidaturesRefusees,
    candidaturesExpirees,
    depotTokens,
    comptesInactifs,
    tokensExpires,
    total: candidaturesRefusees + candidaturesExpirees + depotTokens + comptesInactifs + tokensExpires,
  };
}
