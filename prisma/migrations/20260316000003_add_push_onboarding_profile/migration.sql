-- Web Push subscriptions
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pushSubscriptions" JSONB DEFAULT '[]';

-- Onboarding
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN DEFAULT false;

-- Profil bailleur (rempli a l'onboarding)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telephone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ville" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bailleurNom" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bailleurAdresse" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "siret" TEXT;
