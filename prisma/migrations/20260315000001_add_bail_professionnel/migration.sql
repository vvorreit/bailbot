-- Migration: add_bail_professionnel
-- Ajoute le support des baux professionnels

-- Enum TypeBail
DO $$ BEGIN
  CREATE TYPE "TypeBail" AS ENUM ('HABITATION_VIDE', 'HABITATION_MEUBLE', 'PROFESSIONNEL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum IndiceProRevision
DO $$ BEGIN
  CREATE TYPE "IndiceProRevision" AS ENUM ('ILC', 'ILAT', 'ICC', 'LIBRE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Table ContratPro
CREATE TABLE IF NOT EXISTS "ContratPro" (
  "id"               TEXT NOT NULL,
  "bienId"           TEXT NOT NULL,
  "locataireId"      TEXT NOT NULL,
  "dateDebut"        TIMESTAMP(3) NOT NULL,
  "dureeAns"         INTEGER NOT NULL DEFAULT 6,
  "loyerHT"          DOUBLE PRECISION NOT NULL,
  "chargesHT"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "tvaApplicable"    BOOLEAN NOT NULL DEFAULT false,
  "indiceRevision"   "IndiceProRevision" NOT NULL DEFAULT 'ILAT',
  "depotGarantie"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "preavisLocataire" INTEGER NOT NULL DEFAULT 6,
  "clausesSpeciales" TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ContratPro_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContratPro_bienId_idx" ON "ContratPro"("bienId");
