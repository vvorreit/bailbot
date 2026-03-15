-- US 23: Accès collaborateur limité aux biens assignés
ALTER TABLE "Bien" ADD COLUMN IF NOT EXISTS "assigneA" TEXT;
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "assigneA" TEXT;

-- US 24: Portail lecture-seule propriétaire
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "tokenProprietaire" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "BailActif_tokenProprietaire_key" ON "BailActif"("tokenProprietaire");

-- US 25: Modèles de message personnalisables
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "messageTemplates" JSONB DEFAULT '[]';

-- US 26: Relances loyer
CREATE TABLE IF NOT EXISTS "RelanceLoyer" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bailId" TEXT NOT NULL,
  "bienId" TEXT NOT NULL,
  "mois" TEXT NOT NULL,
  "templateId" TEXT,
  "objet" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "emailLocataire" TEXT NOT NULL,
  "envoyeVia" TEXT NOT NULL DEFAULT 'email',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RelanceLoyer_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RelanceLoyer_userId_idx" ON "RelanceLoyer"("userId");
CREATE INDEX IF NOT EXISTS "RelanceLoyer_bailId_idx" ON "RelanceLoyer"("bailId");
CREATE INDEX IF NOT EXISTS "RelanceLoyer_bienId_idx" ON "RelanceLoyer"("bienId");
