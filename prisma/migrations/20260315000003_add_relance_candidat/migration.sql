-- Migration: add_relance_candidat
-- Ajoute le modèle RelanceCandidat pour les relances automatiques

-- Enum StatutRelance
DO $$ BEGIN
  CREATE TYPE "StatutRelance" AS ENUM (
    'EN_ATTENTE',
    'RELANCE_1',
    'RELANCE_2',
    'RELANCE_3',
    'COMPLET',
    'ABANDONNE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Table RelanceCandidat
CREATE TABLE IF NOT EXISTS "RelanceCandidat" (
  "id"              TEXT NOT NULL,
  "depotToken"      TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "email"           TEXT NOT NULL,
  "telephone"       TEXT,
  "sequence"        INTEGER NOT NULL DEFAULT 0,
  "statut"          "StatutRelance" NOT NULL DEFAULT 'EN_ATTENTE',
  "derniereRelance" TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RelanceCandidat_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RelanceCandidat_userId_idx" ON "RelanceCandidat"("userId");
CREATE INDEX IF NOT EXISTS "RelanceCandidat_depotToken_idx" ON "RelanceCandidat"("depotToken");
