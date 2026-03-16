-- AlterTable: add loyer marché cache columns to Bien
ALTER TABLE "Bien" ADD COLUMN IF NOT EXISTS "loyerMarcheCache" JSONB;
ALTER TABLE "Bien" ADD COLUMN IF NOT EXISTS "loyerMarcheCachedAt" TIMESTAMP;
