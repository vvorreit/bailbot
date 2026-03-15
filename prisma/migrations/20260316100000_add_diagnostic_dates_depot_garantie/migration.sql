-- Add diagnostic date fields to Bien for expiration tracking
ALTER TABLE "Bien" ADD COLUMN IF NOT EXISTS "surface" DOUBLE PRECISION;
ALTER TABLE "Bien" ADD COLUMN IF NOT EXISTS "dateDPE" TIMESTAMP(3);
ALTER TABLE "Bien" ADD COLUMN IF NOT EXISTS "dateElectricite" TIMESTAMP(3);
ALTER TABLE "Bien" ADD COLUMN IF NOT EXISTS "dateGaz" TIMESTAMP(3);
ALTER TABLE "Bien" ADD COLUMN IF NOT EXISTS "datePlomb" TIMESTAMP(3);
ALTER TABLE "Bien" ADD COLUMN IF NOT EXISTS "dateAmiante" TIMESTAMP(3);

-- Add depot de garantie to BailActif for EDL comparison
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "depotGarantie" DOUBLE PRECISION;
