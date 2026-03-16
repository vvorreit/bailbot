import { prisma } from '@/lib/db';
import { getPendingPurges } from '@/lib/rgpd-purge';

export interface SecurityReport {
  recentLogins: {
    userId: string | null;
    action: string;
    ip: string | null;
    createdAt: Date;
    details: string | null;
  }[];
  expiredTokens: {
    type: string;
    count: number;
  }[];
  pendingPurges: Awaited<ReturnType<typeof getPendingPurges>>;
  lastPurge: { createdAt: Date; details: string | null } | null;
  stats: {
    totalUsers: number;
    usersWithPassword: number;
    usersOAuth: number;
    activeSessionsCount: number;
    auditLogsCount: number;
  };
}

export async function getSecurityReport(): Promise<SecurityReport> {
  const [recentLogins, expiredProprietaireTokens, expiredDepotTokens, expiredInvitations, lastPurge, totalUsers, usersWithPassword, activeSessionsCount, auditLogsCount, pendingPurges] = await Promise.all([
    prisma.auditLog.findMany({
      where: { action: { in: ['LOGIN', 'LOGIN_FAILED', 'EXPORT_DATA', 'DELETE_ACCOUNT'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { userId: true, action: true, ip: true, createdAt: true, details: true },
    }),
    prisma.bailActif.count({
      where: {
        tokenProprietaireExpiresAt: { lt: new Date() },
        tokenProprietaire: { not: null },
      },
    }),
    prisma.depotToken.count({
      where: { expiresAt: { lt: new Date() } },
    }),
    prisma.invitation.count({
      where: { expires: { lt: new Date() } },
    }),
    prisma.auditLog.findFirst({
      where: { action: 'PURGE_RGPD' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, details: true },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { password: { not: null } } }),
    prisma.session.count({ where: { expires: { gt: new Date() } } }),
    prisma.auditLog.count(),
    getPendingPurges(),
  ]);

  return {
    recentLogins,
    expiredTokens: [
      { type: 'Tokens propriétaire', count: expiredProprietaireTokens },
      { type: 'Tokens dépôt', count: expiredDepotTokens },
      { type: 'Invitations équipe', count: expiredInvitations },
    ],
    pendingPurges,
    lastPurge,
    stats: {
      totalUsers,
      usersWithPassword,
      usersOAuth: totalUsers - usersWithPassword,
      activeSessionsCount,
      auditLogsCount,
    },
  };
}

export async function checkExpiredTokens() {
  const [proprietaire, depot, invitations] = await Promise.all([
    prisma.bailActif.count({
      where: {
        tokenProprietaireExpiresAt: { lt: new Date() },
        tokenProprietaire: { not: null },
      },
    }),
    prisma.depotToken.count({
      where: { expiresAt: { lt: new Date() } },
    }),
    prisma.invitation.count({
      where: { expires: { lt: new Date() } },
    }),
  ]);

  return { proprietaire, depot, invitations, total: proprietaire + depot + invitations };
}
