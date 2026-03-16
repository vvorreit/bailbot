import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: "openid email profile",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.password) {
          await prisma.auditLog.create({
            data: { action: 'LOGIN_FAILED', details: `Tentative sur ${credentials.email} (compte inexistant ou OAuth)` },
          }).catch(() => {});
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) {
          await prisma.auditLog.create({
            data: { userId: user.id, action: 'LOGIN_FAILED', details: 'Mot de passe incorrect' },
          }).catch(() => {});
          return null;
        }

        if (!user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

        await prisma.auditLog.create({
          data: { userId: user.id, action: 'LOGIN', details: 'Connexion credentials' },
        }).catch(() => {});

        return user;
      },
    }),
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      from: process.env.SMTP_FROM,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Premier login Google : stocker les tokens
      if (account && account.provider === "google") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600 * 1000;
      }

      if (user) {
        token.id = user.id;

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { team: true },
        });

        token.role = dbUser?.role ?? "USER";
        token.clientCount = dbUser?.clientCount ?? 0;
        token.teamId = dbUser?.teamId ?? undefined;
        token.teamRole = dbUser?.teamRole ?? undefined;
        token.metier = dbUser?.metier ?? null;

        const isTeamPro = dbUser?.team?.plan === "PRO" || dbUser?.team?.plan === "ENTERPRISE";
        token.isPro = dbUser?.isPro || isTeamPro || false;
        token.rechercheMasquee = dbUser?.rechercheMasquee ?? false;
        token.onboardingCompleted = dbUser?.onboardingCompleted ?? false;
      }

      if (trigger === "update" && session) {
        return { ...token, ...session };
      }

      // Refresh automatique du token Google si expiré
      if (
        token.refreshToken &&
        token.accessTokenExpires &&
        Date.now() >= (token.accessTokenExpires as number)
      ) {
        try {
          const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
          });
          const refreshed = await response.json();
          if (!response.ok) throw refreshed;
          token.accessToken = refreshed.access_token;
          token.accessTokenExpires = Date.now() + refreshed.expires_in * 1000;
          if (refreshed.refresh_token) {
            token.refreshToken = refreshed.refresh_token;
          }
        } catch {
          token.error = "RefreshAccessTokenError";
        }
      }

      // Invalider le token si le mot de passe a été changé après l'émission du token
      if (token.id && !user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { passwordChangedAt: true },
        });
        const tokenIssuedMs = ((token.iat as number) ?? 0) * 1000;
        if (dbUser?.passwordChangedAt && dbUser.passwordChangedAt.getTime() > tokenIssuedMs) {
          return { ...token, error: "SessionInvalidated" };
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).isPro = token.isPro;
        (session.user as any).clientCount = token.clientCount;
        (session.user as any).teamId = token.teamId;
        (session.user as any).teamRole = token.teamRole;
        (session.user as any).metier = token.metier ?? null;
        (session.user as any).rechercheMasquee = token.rechercheMasquee ?? false;
        (session.user as any).onboardingCompleted = token.onboardingCompleted ?? false;
        (session as any).error = token.error;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
};
