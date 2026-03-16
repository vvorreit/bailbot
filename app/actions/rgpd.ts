"use server";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decryptIfPresent } from '@/lib/crypto';
import { createHash } from 'crypto';

function anonymizeEmail(email: string): string {
  return createHash('sha256').update(email).digest('hex').slice(0, 16) + '@supprime.rgpd';
}

/**
 * Export complet des données utilisateur (RGPD Art. 20 - Portabilité)
 */
export async function exportAllUserData() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: 'Non autorisé.' };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      accounts: { select: { provider: true, type: true } },
      team: { select: { id: true, name: true, plan: true, createdAt: true } },
      invitationsSent: { select: { email: true, role: true, expires: true } },
      pushSubscriptionRows: { select: { endpoint: true, createdAt: true } },
      messageTemplateRows: { select: { nom: true, type: true, sujet: true, corps: true, variables: true, createdAt: true } },
      profilBailleurRow: true,
      depotTokens: {
        select: { token: true, bienAdresse: true, candidatEmail: true, expiresAt: true, used: true, createdAt: true },
      },
    },
  });

  if (!user) return { error: 'Utilisateur introuvable.' };

  const [biens, bails, paiements, candidatures, edl, travaux, relancesLoyer, quittances, espaces, relancesCandidats] = await Promise.all([
    prisma.bien.findMany({ where: { userId: user.id } }),
    prisma.bailActif.findMany({ where: { userId: user.id }, include: { alertes: true } }),
    prisma.paiementBien.findMany({ where: { userId: user.id } }),
    prisma.candidatureLocal.findMany({ where: { userId: user.id } }),
    prisma.etatDesLieux.findMany({ where: { userId: user.id } }),
    prisma.travaux.findMany({ where: { userId: user.id }, include: { documents: true } }),
    prisma.relanceLoyer.findMany({ where: { userId: user.id } }),
    prisma.quittanceAuto.findMany({ where: { bail: { userId: user.id } } }),
    prisma.espaceLocataire.findMany({ where: { userId: user.id }, include: { demandes: true } }),
    prisma.relanceCandidat.findMany({ where: { userId: user.id } }),
  ]);

  const payload = {
    exportDate: new Date().toISOString(),
    exportBasis: 'RGPD Article 20 — Droit à la portabilité des données',
    profil: {
      id: user.id,
      nom: user.name,
      email: user.email,
      telephone: user.telephone,
      ville: user.ville,
      metier: user.metier,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      onboardingCompleted: user.onboardingCompleted,
    },
    abonnement: {
      plan: user.plan,
      isPro: user.isPro,
    },
    profilBailleur: user.profilBailleurRow ? {
      nom: user.profilBailleurRow.nom,
      prenom: user.profilBailleurRow.prenom,
      adresse: user.profilBailleurRow.adresse,
      codePostal: user.profilBailleurRow.codePostal,
      ville: user.profilBailleurRow.ville,
      telephone: user.profilBailleurRow.telephone,
      email: user.profilBailleurRow.email,
      siret: user.profilBailleurRow.siret,
      iban: decryptIfPresent(user.profilBailleurRow.iban) ? '***PRESENT***' : null,
    } : null,
    equipe: user.team ? {
      id: user.team.id,
      nom: user.team.name,
      plan: user.team.plan,
      role: user.teamRole,
    } : null,
    fournisseursOAuth: user.accounts.map(a => a.provider),
    biens: biens.map(b => ({
      id: b.id,
      adresse: b.adresse,
      loyer: b.loyer,
      charges: b.charges,
      typeBail: b.typeBail,
      locataireNom: b.locataireNom,
      statut: b.statut,
      createdAt: b.createdAt,
    })),
    baux: bails.map(b => ({
      id: b.id,
      locataireNom: b.locataireNom,
      locataireEmail: b.locataireEmail,
      dateDebut: b.dateDebut,
      dateFin: b.dateFin,
      loyer: b.loyerMensuel,
      charges: b.chargesMensuelles,
      statut: b.statut,
      alertes: b.alertes.length,
    })),
    paiements: paiements.map(p => ({
      id: p.id,
      mois: p.mois,
      montantRecu: p.montantRecu,
      statut: p.statut,
      dateAttendue: p.dateAttendue,
    })),
    candidatures: candidatures.map(c => ({
      id: c.id,
      bienId: c.bienId,
      statut: c.statut,
      bailScore: c.bailScore,
      createdAt: c.createdAt,
    })),
    etatsDesLieux: edl.map(e => ({
      id: e.id,
      type: e.type,
      date: e.date,
      bienId: e.bienId,
    })),
    travaux: travaux.map(t => ({
      id: t.id,
      titre: t.titre,
      statut: t.statut,
      categorie: t.categorie,
      montantDevis: t.montantDevis,
      montantReel: t.montantReel,
    })),
    quittances: quittances.map(q => ({
      id: q.id,
      mois: q.mois,
      numero: q.numero,
      envoyeeLe: q.envoyeeLe,
    })),
    depotTokens: user.depotTokens.map(d => ({
      bienAdresse: d.bienAdresse,
      candidatEmail: d.candidatEmail,
      expiresAt: d.expiresAt,
      used: d.used,
      createdAt: d.createdAt,
    })),
    relancesLoyer: relancesLoyer.length,
    relancesCandidats: relancesCandidats.length,
    espacesLocataires: espaces.length,
    demandesLocataires: espaces.reduce((acc, e) => acc + e.demandes.length, 0),
    modeles: user.messageTemplateRows.map(t => ({
      nom: t.nom,
      type: t.type,
      sujet: t.sujet,
    })),
    notificationsPush: user.pushSubscriptionRows.length,
  };

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'EXPORT_DATA',
      details: 'Export complet RGPD Art. 20',
    },
  });

  return { data: JSON.stringify(payload, null, 2) };
}

/**
 * Suppression du compte (RGPD Art. 17 - Droit à l'effacement)
 */
export async function deleteUserAccount(): Promise<{ success?: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: 'Non autorisé.' };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, teamId: true, teamRole: true },
  });

  if (!user) return { error: 'Utilisateur introuvable.' };

  const bailsActifs = await prisma.bailActif.count({
    where: { userId: user.id, statut: 'ACTIF' },
  });

  if (bailsActifs > 0) {
    return {
      error: `Vous avez ${bailsActifs} bail(s) actif(s). Terminez-les avant de supprimer votre compte. Les baux actifs ne peuvent pas être supprimés (obligation légale de conservation).`,
    };
  }

  if (user.teamRole === 'OWNER') {
    return {
      error: 'Vous êtes propriétaire d\'une équipe. Transférez la propriété ou supprimez l\'équipe avant de supprimer votre compte.',
    };
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'DELETE_ACCOUNT',
      details: `Demande de suppression par ${user.email}`,
    },
  });

  const DIX_ANS = 10 * 365 * 24 * 60 * 60 * 1000;
  const seuilDixAns = new Date(Date.now() - DIX_ANS);

  await prisma.bailActif.deleteMany({
    where: {
      userId: user.id,
      statut: 'TERMINE',
      dateSortie: { lt: seuilDixAns },
    },
  });

  await Promise.all([
    prisma.candidatureLocal.deleteMany({ where: { userId: user.id } }),
    prisma.depotToken.deleteMany({ where: { userId: user.id } }),
    prisma.relanceCandidat.deleteMany({ where: { userId: user.id } }),
    prisma.pushSubscription.deleteMany({ where: { userId: user.id } }),
    prisma.messageTemplate.deleteMany({ where: { userId: user.id } }),
    prisma.profilBailleurTable.deleteMany({ where: { userId: user.id } }),
    prisma.bien.deleteMany({ where: { userId: user.id } }),
    prisma.paiementBien.deleteMany({ where: { userId: user.id } }),
    prisma.travaux.deleteMany({ where: { userId: user.id } }),
    prisma.etatDesLieux.deleteMany({ where: { userId: user.id } }),
    prisma.espaceLocataire.deleteMany({ where: { userId: user.id } }),
  ]);

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
      metier: null,
      onboardingCompleted: false,
    },
  });

  return { success: true };
}

/**
 * Enregistre le consentement RGPD de l'utilisateur
 */
export async function saveConsentRGPD(
  type: string,
  consenti: boolean,
  ip?: string,
  userAgent?: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: 'Non autorisé.' };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return { error: 'Utilisateur introuvable.' };

  if (!consenti) {
    await prisma.consentRGPD.updateMany({
      where: { userId: user.id, type, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  await prisma.consentRGPD.create({
    data: {
      userId: user.id,
      type,
      consenti,
      ip,
      userAgent,
    },
  });

  return { success: true };
}

/**
 * Récupère les consentements RGPD actuels de l'utilisateur
 */
export async function getConsentsRGPD() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: 'Non autorisé.' };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return { error: 'Utilisateur introuvable.' };

  const consents = await prisma.consentRGPD.findMany({
    where: { userId: user.id, revokedAt: null },
    orderBy: { createdAt: 'desc' },
    distinct: ['type'],
  });

  return {
    analytics: consents.find(c => c.type === 'analytics')?.consenti ?? false,
    marketing: consents.find(c => c.type === 'marketing')?.consenti ?? false,
  };
}
