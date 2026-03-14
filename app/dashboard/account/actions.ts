"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function exportUserData() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Non autorisé." };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      clientCount: true,
      isPro: true,
      role: true,
      teamId: true,
      teamRole: true,
      syncToken: true,
      createdAt: true,
      lastActiveAt: true,
      // Ne jamais inclure password, stripeCustomerId, stripeSubscriptionId
      accounts: {
        select: {
          provider: true,
          type: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
          plan: true,
          createdAt: true,
        },
      },
      invitationsSent: {
        select: {
          email: true,
          role: true,
          expires: true,
          team: { select: { name: true } },
        },
      },
    },
  });

  if (!user) return { error: "Utilisateur introuvable." };

  const payload = {
    exportDate: new Date().toISOString(),
    exportBasis: "RGPD Article 20 — Droit à la portabilité des données",
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
    },
    subscription: {
      isPro: user.isPro,
      role: user.role,
    },
    usage: {
      clientCount: user.clientCount,
    },
    connectedProviders: user.accounts.map((a) => a.provider),
    team: user.team
      ? {
          id: user.team.id,
          name: user.team.name,
          plan: user.team.plan,
          yourRole: user.teamRole,
          joinedAt: user.team.createdAt,
        }
      : null,
    invitationsSent: user.invitationsSent.map((inv) => ({
      invitedEmail: inv.email,
      role: inv.role,
      teamName: inv.team.name,
      expiresAt: inv.expires,
    })),
  };

  return { data: JSON.stringify(payload, null, 2) };
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Non autorisé." };

  if (newPassword.length < 8) return { error: "Le mot de passe doit contenir au moins 8 caractères." };

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });

  if (!user?.password) return { error: "Ce compte utilise une connexion externe (Google). Le mot de passe ne peut pas être modifié ici." };

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return { error: "Mot de passe actuel incorrect." };

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, passwordChangedAt: new Date() },
  });

  return { success: true };
}
