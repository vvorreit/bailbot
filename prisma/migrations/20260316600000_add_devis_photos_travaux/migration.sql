-- AlterTable: add new columns to Travaux
ALTER TABLE "Travaux" ADD COLUMN IF NOT EXISTS "budgetEstime" DOUBLE PRECISION;
ALTER TABLE "Travaux" ADD COLUMN IF NOT EXISTS "montantFinal" DOUBLE PRECISION;
ALTER TABLE "Travaux" ADD COLUMN IF NOT EXISTS "dateFinReelle" TIMESTAMP(3);
ALTER TABLE "Travaux" ADD COLUMN IF NOT EXISTS "edlEntreeId" TEXT;
ALTER TABLE "Travaux" ADD COLUMN IF NOT EXISTS "edlSortieId" TEXT;

-- CreateTable: DevisEntreprise
CREATE TABLE IF NOT EXISTS "DevisEntreprise" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "travauxId" TEXT NOT NULL,
    "entrepriseNom" TEXT NOT NULL,
    "entrepriseTel" TEXT,
    "entrepriseEmail" TEXT,
    "entrepriseSiret" TEXT,
    "montantHT" DOUBLE PRECISION NOT NULL,
    "montantTTC" DOUBLE PRECISION NOT NULL,
    "tvaRate" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "dateDevis" TIMESTAMP(3),
    "validiteJours" INTEGER NOT NULL DEFAULT 30,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "notes" TEXT,
    "fichierUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevisEntreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PhotoTravaux
CREATE TABLE IF NOT EXISTS "PhotoTravaux" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "travauxId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'pendant',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoTravaux_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DevisEntreprise_travauxId_idx" ON "DevisEntreprise"("travauxId");
CREATE INDEX IF NOT EXISTS "PhotoTravaux_travauxId_idx" ON "PhotoTravaux"("travauxId");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DevisEntreprise_travauxId_fkey') THEN
    ALTER TABLE "DevisEntreprise" ADD CONSTRAINT "DevisEntreprise_travauxId_fkey" FOREIGN KEY ("travauxId") REFERENCES "Travaux"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PhotoTravaux_travauxId_fkey') THEN
    ALTER TABLE "PhotoTravaux" ADD CONSTRAINT "PhotoTravaux_travauxId_fkey" FOREIGN KEY ("travauxId") REFERENCES "Travaux"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
