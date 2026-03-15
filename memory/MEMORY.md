# BailBot — Mémoire Smith

## Stack
Next.js 16, Prisma, PostgreSQL, NextAuth v4 JWT, Tailwind, Docker CI/CD (GitHub Actions → GHCR)

## Architecture clé
- `lib/auth.ts` — NextAuth config, JWT callback injecte: id, role, isPro, clientCount, teamId, teamRole, metier
- `types/next-auth.d.ts` — augmente Session/JWT avec metier
- `app/dashboard/actions.ts` — "use server" actions (setMetier, getUserDashboardData, Stripe, etc.)
- `lib/db-local.ts` — IndexedDB local-first (candidatures, paiements, biens)
- `prisma/schema.prisma` — migrations ALUR, pas de CREATE TABLE (tables existantes avant Prisma)

## Système d'accès par métier (implémenté 2026-03-15)
- `lib/features.ts` — matrice FEATURES + hasAccess(metier, feature)
- `hooks/useFeature.ts` — hook React côté client
- `components/FeatureGate.tsx` — composant wrapper conditionnel
- `components/UpgradePrompt.tsx` — message feature non accessible
- `lib/auth-guards.ts` — requireFeature() pour routes API (retourne NextResponse 403)
- Onboarding.tsx — étape 0 bloquante si metier null

## Migrations Prisma
- Ne jamais CREATE TABLE (tables préexistantes)
- Toujours ALTER TABLE ... ADD COLUMN IF NOT EXISTS
- Migration add_user_metier: enum Metier (PROPRIETAIRE/AGENCE/GESTIONNAIRE) + colonne metier sur User

## Règles critiques
- "use server" : 100% des exports async
- SDK tiers : instanciation lazy uniquement
- Pages Server avec Prisma/session : export const dynamic = "force-dynamic"
- Email : contact@optibot.fr
- ENV : jamais NEXT_PUBLIC_ pour secrets
