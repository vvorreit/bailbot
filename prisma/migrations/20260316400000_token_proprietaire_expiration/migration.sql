-- Token propriétaire : expiration
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "tokenProprietaireExpiresAt" TIMESTAMP;
