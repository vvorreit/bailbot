-- CreateTable PushSubscription
CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL UNIQUE,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- CreateTable MessageTemplate
CREATE TABLE IF NOT EXISTS "MessageTemplate" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "corps" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MessageTemplate_userId_idx" ON "MessageTemplate"("userId");
ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- CreateTable ProfilBailleur
CREATE TABLE IF NOT EXISTS "ProfilBailleur" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL UNIQUE,
    "nom" TEXT,
    "prenom" TEXT,
    "adresse" TEXT,
    "codePostal" TEXT,
    "ville" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "siret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfilBailleur_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ProfilBailleur" ADD CONSTRAINT "ProfilBailleur_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- Drop JSON columns after migration
ALTER TABLE "User" DROP COLUMN IF EXISTS "pushSubscriptions";
ALTER TABLE "User" DROP COLUMN IF EXISTS "messageTemplates";
ALTER TABLE "User" DROP COLUMN IF EXISTS "profilBailleur";
