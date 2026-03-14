"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Accès refusé. Non connecté.");
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true }
  });
  if (dbUser?.role !== "ADMIN") throw new Error("Accès refusé. Réservé aux administrateurs.");
}

export async function getAdminAnalytics() {
  await checkAdmin();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalUsers, proUsers, soloUsers, duoUsers,
    newThisMonth, newLastMonth, usersLast30Days,
    scansAggregate, verifiedUsers, teamsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isPro: true } }),
    prisma.user.count({ where: { plan: "SOLO" } }),
    prisma.user.count({ where: { plan: "DUO" } }),
    prisma.user.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
    prisma.user.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true } }),
    prisma.user.aggregate({ _sum: { clientCount: true } }),
    prisma.user.count({ where: { emailVerified: { not: null } } }),
    prisma.team.count(),
  ]);

  const dailyCounts: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
    dailyCounts[d.toISOString().slice(0, 10)] = 0;
  }
  for (const u of usersLast30Days) {
    const key = u.createdAt.toISOString().slice(0, 10);
    if (key in dailyCounts) dailyCounts[key]++;
  }

  const conversionRate = totalUsers > 0 ? Math.round((proUsers / totalUsers) * 1000) / 10 : 0;
  const priceSolo = Number(process.env.STRIPE_PRICE_SOLO_AMOUNT ?? 32.9);
  const priceDuo = Number(process.env.STRIPE_PRICE_DUO_AMOUNT ?? 49.9);
  const mrrEstimate = Math.round((soloUsers * priceSolo + duoUsers * priceDuo) * 100) / 100;

  return {
    totalUsers, proUsers, soloUsers, duoUsers,
    freeUsers: totalUsers - proUsers,
    newThisMonth, newLastMonth,
    totalScans: scansAggregate._sum.clientCount ?? 0,
    verifiedUsers, unverifiedUsers: totalUsers - verifiedUsers,
    teamsCount, conversionRate, mrrEstimate,
    signupsLast30Days: dailyCounts,
  };
}

export async function getAllUsersAdmin() {
  await checkAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true,
      isPro: true, plan: true, clientCount: true,
      createdAt: true, role: true,
      teamId: true, teamRole: true,
      team: { select: { id: true, name: true, ownerId: true } },
    }
  });

  return users.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    teamName: u.team?.name ?? null,
    isTeamOwner: u.team?.ownerId === u.id,
  }));
}

export async function getAllTeamsAdmin() {
  await checkAdmin();

  const teams = await prisma.team.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: { select: { id: true, name: true, email: true, teamRole: true, plan: true } },
      invitations: { where: { expires: { gt: new Date() } }, select: { id: true, email: true } },
    }
  });

  // Pour chaque team, récupérer le plan du owner
  const ownerIds = [...new Set(teams.map(t => t.ownerId))];
  const owners = await prisma.user.findMany({
    where: { id: { in: ownerIds } },
    select: { id: true, plan: true, name: true, email: true }
  });
  const ownerMap = Object.fromEntries(owners.map(o => [o.id, o]));

  return teams.map(t => {
    const owner = ownerMap[t.ownerId];
    const limit = owner?.plan === "TEAM_5" ? 5 : owner?.plan === "TEAM_3" ? 3 : 1;
    return {
      id: t.id,
      name: t.name,
      ownerId: t.ownerId,
      ownerName: owner?.name ?? owner?.email ?? "Inconnu",
      ownerEmail: owner?.email ?? "",
      ownerPlan: owner?.plan ?? "FREE",
      membersCount: t.users.length,
      pendingCount: t.invitations.length,
      limit,
      members: t.users,
      pendingInvites: t.invitations,
      createdAt: t.createdAt.toISOString(),
    };
  });
}

export async function setUserPlan(userId: string, plan: string) {
  await checkAdmin();

  const isPro = plan !== "FREE";
  await prisma.user.update({
    where: { id: userId },
    data: { plan, isPro },
  });

  return { success: true };
}

export async function toggleUserAdminRole(userId: string, currentRole: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Accès refusé.");
  const self = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (self?.role !== "ADMIN") throw new Error("Accès refusé.");
  if (self?.id === userId) throw new Error("Vous ne pouvez pas modifier votre propre rôle.");
  const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
  return prisma.user.update({ where: { id: userId }, data: { role: newRole }, select: { id: true, role: true } });
}

export async function toggleUserProStatus(userId: string, currentStatus: boolean) {
  await checkAdmin();
  return prisma.user.update({
    where: { id: userId },
    data: { isPro: !currentStatus },
    select: { id: true, isPro: true }
  });
}
