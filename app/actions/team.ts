"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTransporter, smtpConfigured, escapeHtml } from "@/lib/mailer";
import { randomBytes } from "crypto";

// Nombre de postes maximum par plan d'équipe
export async function getTeamSeatsLimit(plan: string): Promise<number> {
  switch (plan) {
    case "TEAM_5": return 5;
    case "TEAM_3": return 3;
    case "PRO":    return 3; // ancien plan PRO → 3 postes par défaut
    default:       return 1; // FREE → solo, pas d'invitation possible
  }
}

export async function createTeam(name: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userId = (session.user as any).id;

  // Check if user already has a team
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.teamId) throw new Error("Already in a team");

  const team = await prisma.team.create({
    data: {
      name,
      ownerId: userId,
      users: {
        connect: { id: userId }
      }
    }
  });

  // Update user with teamId and teamRole OWNER
  await prisma.user.update({
    where: { id: userId },
    data: { teamId: team.id, teamRole: "OWNER" }
  });

  return { success: true, teamId: team.id };
}

export async function inviteMember(email: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      team: {
        include: {
          users: { select: { id: true } },
          invitations: { where: { expires: { gt: new Date() } }, select: { id: true } },
        }
      }
    }
  });

  if (!user?.teamId || (user.teamRole !== "OWNER" && user.teamRole !== "ADMIN")) {
    throw new Error("Must be a team admin/owner to invite.");
  }

  // Enforce seat limit based on team owner's plan
  const owner = await prisma.user.findUnique({ where: { id: user.team!.ownerId }, select: { plan: true } });
  const limit = await getTeamSeatsLimit(owner?.plan ?? "FREE");
  const occupied = (user.team?.users.length ?? 0) + (user.team?.invitations.length ?? 0);
  if (occupied >= limit) {
    throw new Error(`Limite de postes atteinte (${limit} postes maximum pour votre plan).`);
  }

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h expiry

  // Check if invitation exists and clean it up
  const existing = await prisma.invitation.findUnique({
    where: { teamId_email: { teamId: user.teamId, email } }
  });

  if (existing) {
    await prisma.invitation.delete({ where: { id: existing.id } });
  }

  await prisma.invitation.create({
    data: {
      email,
      token,
      expires,
      teamId: user.teamId,
      inviterId: userId,
      role: "MEMBER"
    }
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3011";
  const inviteLink = `${baseUrl}/join/${token}`;

  try {
    if (smtpConfigured()) {
      await getTransporter().sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: `Rejoignez l'équipe ${user.team?.name} sur BailBot`,
        html: `
          <h1>Invitation d'équipe</h1>
          <p><strong>${escapeHtml(user.name || user.email || "")}</strong> vous a invité à rejoindre l'équipe <strong>${escapeHtml(user.team?.name || "")}</strong>.</p>
          <p><a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accepter l'invitation</a></p>
          <p>Ou copiez ce lien : ${inviteLink}</p>
        `,
      });
      return { success: true, sent: true };
    } else {
      console.log("SMTP_HOST manquant, email non envoyé:", inviteLink);
      return { success: true, sent: false, link: inviteLink };
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: true, sent: false, link: inviteLink, error: "Email failed" };
  }
}

export async function removeMember(memberId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user?.teamId || user.teamRole !== "OWNER") {
    throw new Error("Only owner can remove members.");
  }

  // Ensure we are not removing ourselves (Owner must delete team to leave, or transfer ownership - scope creep for now)
  if (memberId === userId) throw new Error("Cannot remove self.");

  // Ensure member is in the same team
  const member = await prisma.user.findUnique({ where: { id: memberId } });
  if (member?.teamId !== user.teamId) throw new Error("User not in your team.");

  await prisma.user.update({
    where: { id: memberId },
    data: { teamId: null, teamRole: "MEMBER" } // Reset to default
  });

  return { success: true };
}

export async function acceptInvite(token: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { team: true }
  });

  if (!invitation || invitation.expires < new Date()) {
    throw new Error("Invitation invalide ou expirée.");
  }

  const userId = (session.user as any).id;

  // Check seat limit before accepting
  const teamWithData = await prisma.team.findUnique({
    where: { id: invitation.teamId },
    include: { users: { select: { id: true } } },
  });
  const teamOwner = teamWithData ? await prisma.user.findUnique({ where: { id: teamWithData.ownerId }, select: { plan: true } }) : null;
  const limit = await getTeamSeatsLimit(teamOwner?.plan ?? "FREE");
  if ((teamWithData?.users.length ?? 0) >= limit) {
    throw new Error("L'équipe est complète, aucun poste disponible.");
  }

  // Check if user is already in a team (optional: force leave current team?)
  // For MVP, fail if in team.
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.teamId) {
     if (user.teamId === invitation.teamId) return { success: true }; // Already joined
     throw new Error("Vous êtes déjà dans une équipe. Quittez-la d'abord.");
  }

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      teamId: invitation.teamId,
      teamRole: invitation.role
    }
  });

  // Delete invitation
  await prisma.invitation.delete({ where: { id: invitation.id } });

  return { success: true, teamName: invitation.team.name };
}

export async function getTeamDetails() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  // Résoudre l'id via l'email si absent de la session (ex: première connexion Google)
  const userId = (session.user as any).id;
  const whereClause = userId
    ? { id: userId }
    : { email: session.user.email };

  const user = await prisma.user.findUnique({
    where: whereClause,
    include: {
      team: {
        include: {
          users: {
            select: { id: true, name: true, email: true, teamRole: true, image: true },
          },
          invitations: true,
        },
      },
    },
  });

  if (!user?.team) return null;

  const teamOwner = await prisma.user.findUnique({ where: { id: user.team.ownerId }, select: { plan: true } });
  const seatsLimit = await getTeamSeatsLimit(teamOwner?.plan ?? "FREE");

  return {
    ...user.team,
    currentUserRole: user.teamRole,
    seatsLimit,
  };
}
