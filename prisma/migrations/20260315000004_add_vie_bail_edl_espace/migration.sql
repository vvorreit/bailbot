-- CreateEnum
CREATE TYPE "StatutBail" AS ENUM ('ACTIF', 'PREAVIS', 'TERMINE', 'RENOUVELE');

-- CreateEnum
CREATE TYPE "TypeAlerte" AS ENUM ('REVISION_LOYER', 'RENOUVELLEMENT', 'CONGE_BAILLEUR', 'DIAGNOSTIC_DPE', 'DIAGNOSTIC_ELEC', 'ASSURANCE_PNO');

-- CreateEnum
CREATE TYPE "TypeEDL" AS ENUM ('ENTREE', 'SORTIE');

-- CreateEnum
CREATE TYPE "TypeDemande" AS ENUM ('DOCUMENT', 'TRAVAUX', 'QUESTION', 'CONGE');

-- CreateEnum
CREATE TYPE "StatutDemande" AS ENUM ('NOUVEAU', 'EN_COURS', 'RESOLU');

-- CreateTable BailActif
CREATE TABLE IF NOT EXISTS "BailActif" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "locataireNom" TEXT NOT NULL,
    "locataireEmail" TEXT NOT NULL,
    "dateSignature" TIMESTAMP(3) NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "dureePreavisMois" INTEGER NOT NULL DEFAULT 3,
    "loyerMensuel" DOUBLE PRECISION NOT NULL,
    "chargesMensuelles" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "indiceRevision" TEXT NOT NULL DEFAULT 'IRL',
    "dateProchRevision" TIMESTAMP(3) NOT NULL,
    "dateFinDiagnostics" TIMESTAMP(3),
    "statut" "StatutBail" NOT NULL DEFAULT 'ACTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BailActif_pkey" PRIMARY KEY ("id")
);

-- CreateTable AlerteBail
CREATE TABLE IF NOT EXISTS "AlerteBail" (
    "id" TEXT NOT NULL,
    "bailId" TEXT NOT NULL,
    "type" "TypeAlerte" NOT NULL,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "traitee" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlerteBail_pkey" PRIMARY KEY ("id")
);

-- CreateTable EtatDesLieux
CREATE TABLE IF NOT EXISTS "EtatDesLieux" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "bailId" TEXT,
    "type" "TypeEDL" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "pieces" JSONB NOT NULL,
    "compteurs" JSONB NOT NULL,
    "cles" JSONB NOT NULL,
    "signatureLocataire" TEXT,
    "signatureBailleur" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EtatDesLieux_pkey" PRIMARY KEY ("id")
);

-- CreateTable EspaceLocataire
CREATE TABLE IF NOT EXISTS "EspaceLocataire" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bailId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EspaceLocataire_pkey" PRIMARY KEY ("id")
);

-- CreateTable DemandeLocataire
CREATE TABLE IF NOT EXISTS "DemandeLocataire" (
    "id" TEXT NOT NULL,
    "espaceId" TEXT NOT NULL,
    "type" "TypeDemande" NOT NULL,
    "message" TEXT NOT NULL,
    "statut" "StatutDemande" NOT NULL DEFAULT 'NOUVEAU',
    "reponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandeLocataire_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BailActif_userId_idx" ON "BailActif"("userId");
CREATE INDEX IF NOT EXISTS "BailActif_bienId_idx" ON "BailActif"("bienId");
CREATE INDEX IF NOT EXISTS "AlerteBail_bailId_idx" ON "AlerteBail"("bailId");
CREATE INDEX IF NOT EXISTS "AlerteBail_dateEcheance_idx" ON "AlerteBail"("dateEcheance");
CREATE INDEX IF NOT EXISTS "EtatDesLieux_userId_idx" ON "EtatDesLieux"("userId");
CREATE INDEX IF NOT EXISTS "EtatDesLieux_bienId_idx" ON "EtatDesLieux"("bienId");
CREATE INDEX IF NOT EXISTS "EspaceLocataire_userId_idx" ON "EspaceLocataire"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "EspaceLocataire_bailId_key" ON "EspaceLocataire"("bailId");
CREATE UNIQUE INDEX IF NOT EXISTS "EspaceLocataire_token_key" ON "EspaceLocataire"("token");
CREATE INDEX IF NOT EXISTS "DemandeLocataire_espaceId_idx" ON "DemandeLocataire"("espaceId");

-- AddForeignKey
ALTER TABLE "AlerteBail" ADD CONSTRAINT "AlerteBail_bailId_fkey" FOREIGN KEY ("bailId") REFERENCES "BailActif"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DemandeLocataire" ADD CONSTRAINT "DemandeLocataire_espaceId_fkey" FOREIGN KEY ("espaceId") REFERENCES "EspaceLocataire"("id") ON DELETE CASCADE ON UPDATE CASCADE;
