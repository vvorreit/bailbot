-- CreateEnum
CREATE TYPE "TypeDocCopro" AS ENUM ('APPEL_CHARGES', 'RELEVE_DEPENSES', 'PV_ASSEMBLEE', 'BUDGET_PREVISIONNEL', 'AUTRE');

-- CreateTable
CREATE TABLE "DocumentCopro" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeDocCopro" NOT NULL,
    "annee" INTEGER NOT NULL,
    "trimestre" INTEGER,
    "contenu" TEXT NOT NULL,
    "taille" INTEGER,
    "analyseJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentCopro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentCopro_userId_idx" ON "DocumentCopro"("userId");

-- CreateIndex
CREATE INDEX "DocumentCopro_bienId_idx" ON "DocumentCopro"("bienId");
