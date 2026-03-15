-- Migration: Portail Locataire — Dépôt de documents chiffrés AES-256
CREATE TABLE IF NOT EXISTS "DepotToken" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "token" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "bienAdresse" TEXT NOT NULL,
  "message" TEXT,
  "expiresAt" TIMESTAMP NOT NULL,
  "used" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "FichierChiffre" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tokenId" TEXT NOT NULL REFERENCES "DepotToken"("id") ON DELETE CASCADE,
  "nomOriginal" TEXT NOT NULL,
  "nomRenomme" TEXT NOT NULL,
  "contenu" BYTEA NOT NULL,
  "iv" TEXT NOT NULL,
  "taille" INTEGER NOT NULL,
  "uploadedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
