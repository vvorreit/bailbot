-- AlterTable: Ajout champs financiers sur BailActif
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "prixAchat" DECIMAL(12,2);
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "valeurActuelle" DECIMAL(12,2);
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "apportInitial" DECIMAL(12,2);
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "taxeFonciere" DECIMAL(10,2);
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "chargesAnnuelles" DECIMAL(10,2);
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "fraisGestionPct" DECIMAL(5,2) DEFAULT 0;
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "trancheMarginalePct" DECIMAL(5,2) DEFAULT 30;

-- CreateTable: PretImmobilier
CREATE TABLE IF NOT EXISTS "PretImmobilier" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "bienId" TEXT,
  "userId" TEXT NOT NULL,
  "nom" TEXT NOT NULL DEFAULT 'Pret principal',
  "capitalEmprunte" DECIMAL(12,2) NOT NULL,
  "tauxAnnuelPct" DECIMAL(6,4) NOT NULL,
  "dureeMois" INTEGER NOT NULL,
  "dateDebut" TIMESTAMP NOT NULL,
  "typeAmortissement" VARCHAR(20) DEFAULT 'classique',
  "assuranceMensuelle" DECIMAL(10,2) DEFAULT 0,
  "fraisDossier" DECIMAL(10,2) DEFAULT 0,
  "garantie" DECIMAL(10,2) DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PretImmobilier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PretImmobilier_userId_idx" ON "PretImmobilier"("userId");
CREATE INDEX IF NOT EXISTS "PretImmobilier_bienId_idx" ON "PretImmobilier"("bienId");
