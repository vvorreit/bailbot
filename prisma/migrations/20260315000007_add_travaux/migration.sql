-- CreateEnum
CREATE TYPE "StatutTravaux" AS ENUM ('A_FAIRE', 'EN_COURS', 'TERMINE', 'ANNULE');

-- CreateEnum
CREATE TYPE "CategorieTravaux" AS ENUM ('PLOMBERIE', 'ELECTRICITE', 'CHAUFFAGE', 'ISOLATION', 'TOITURE', 'MENUISERIE', 'PEINTURE', 'CARRELAGE', 'SALLE_DE_BAIN', 'CUISINE', 'EXTERIEUR', 'AUTRE');

-- CreateTable
CREATE TABLE "Travaux" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "statut" "StatutTravaux" NOT NULL DEFAULT 'A_FAIRE',
    "categorie" "CategorieTravaux" NOT NULL,
    "montantDevis" DOUBLE PRECISION,
    "montantReel" DOUBLE PRECISION,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "artisanNom" TEXT,
    "artisanTel" TEXT,
    "artisanEmail" TEXT,
    "deductible" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Travaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravauxDocument" (
    "id" TEXT NOT NULL,
    "travauxId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "taille" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravauxDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Travaux_userId_idx" ON "Travaux"("userId");

-- CreateIndex
CREATE INDEX "Travaux_bienId_idx" ON "Travaux"("bienId");

-- CreateIndex
CREATE INDEX "TravauxDocument_travauxId_idx" ON "TravauxDocument"("travauxId");

-- AddForeignKey
ALTER TABLE "TravauxDocument" ADD CONSTRAINT "TravauxDocument_travauxId_fkey" FOREIGN KEY ("travauxId") REFERENCES "Travaux"("id") ON DELETE CASCADE ON UPDATE CASCADE;
