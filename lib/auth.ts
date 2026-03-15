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

        if (!user?.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        if (!user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { team: true },
        });

        token.role = dbUser?.role ?? "USER";
        token.clientCount = dbUser?.clientCount ?? 0;
        token.teamId = dbUser?.teamId;
        token.teamRole = dbUser?.teamRole;
        token.metier = dbUser?.metier ?? null;

        const isTeamPro = dbUser?.team?.plan === "PRO" || dbUser?.team?.plan === "ENTERPRISE";
        token.isPro = dbUser?.isPro || isTeamPro || false;
      }

      if (trigger === "update" && session) {
        return { ...token, ...session };
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
