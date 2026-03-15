-- Add sequential number to QuittanceAuto
ALTER TABLE "QuittanceAuto" ADD COLUMN IF NOT EXISTS "numero" VARCHAR(20) UNIQUE;
