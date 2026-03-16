-- Conformité réglementaire : rapport JSONB + date d'analyse + classe DPE
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "conformiteReport" JSONB;
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "conformiteAnalysedAt" TIMESTAMP;
ALTER TABLE "Bien" ADD COLUMN IF NOT EXISTS "classeDPE" TEXT;
