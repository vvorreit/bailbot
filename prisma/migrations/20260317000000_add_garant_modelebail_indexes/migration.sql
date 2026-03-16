-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "TypeGarantie" AS ENUM ('PHYSIQUE', 'MORAL', 'VISALE', 'CAUTIONNEMENT_BANCAIRE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable Garant
CREATE TABLE IF NOT EXISTS "Garant" (
    "id" TEXT NOT NULL,
    "bailId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "typeGarantie" "TypeGarantie" NOT NULL DEFAULT 'PHYSIQUE',
    "revenus" DOUBLE PRECISION,
    "employeur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Garant_pkey" PRIMARY KEY ("id")
);

-- CreateTable ModeleBail
CREATE TABLE IF NOT EXISTS "ModeleBail" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "clauses" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeleBail_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Garant" ADD CONSTRAINT "Garant_bailId_fkey" FOREIGN KEY ("bailId") REFERENCES "BailActif"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex Garant
CREATE INDEX IF NOT EXISTS "Garant_bailId_idx" ON "Garant"("bailId");

-- CreateIndex ModeleBail
CREATE INDEX IF NOT EXISTS "ModeleBail_userId_idx" ON "ModeleBail"("userId");

-- Performance indexes — BailActif
CREATE INDEX IF NOT EXISTS "BailActif_statut_idx" ON "BailActif"("statut");
CREATE INDEX IF NOT EXISTS "BailActif_locataireEmail_idx" ON "BailActif"("locataireEmail");
CREATE INDEX IF NOT EXISTS "BailActif_dateDebut_idx" ON "BailActif"("dateDebut");

-- Performance indexes — Bien
CREATE INDEX IF NOT EXISTS "Bien_statut_idx" ON "Bien"("statut");

-- Performance indexes — PaiementBien
CREATE INDEX IF NOT EXISTS "PaiementBien_statut_idx" ON "PaiementBien"("statut");
CREATE INDEX IF NOT EXISTS "PaiementBien_dateAttendue_idx" ON "PaiementBien"("dateAttendue");

-- Performance indexes — CandidatureLocal
CREATE INDEX IF NOT EXISTS "CandidatureLocal_statut_idx" ON "CandidatureLocal"("statut");
CREATE INDEX IF NOT EXISTS "CandidatureLocal_createdAt_idx" ON "CandidatureLocal"("createdAt");

-- Performance indexes — Travaux
CREATE INDEX IF NOT EXISTS "Travaux_statut_idx" ON "Travaux"("statut");

-- Performance indexes — QuittanceAuto
CREATE INDEX IF NOT EXISTS "QuittanceAuto_mois_idx" ON "QuittanceAuto"("mois");
