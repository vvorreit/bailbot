-- feat: navigation simplifiee + 10 features
-- BailActif: depot de garantie restitution fields
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "depositGarantieRestitue" DOUBLE PRECISION;
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "depositGarantieRestitutionDate" TIMESTAMP(3);
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "depositGarantieDeductions" JSONB;

-- SignatureRequest: signature electronique
CREATE TABLE IF NOT EXISTS "SignatureRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "signataire" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "signatureData" TEXT,
    "signedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SignatureRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SignatureRequest_token_key" ON "SignatureRequest"("token");
CREATE INDEX IF NOT EXISTS "SignatureRequest_userId_idx" ON "SignatureRequest"("userId");
CREATE INDEX IF NOT EXISTS "SignatureRequest_documentId_idx" ON "SignatureRequest"("documentId");

-- Document: coffre-fort documentaire
CREATE TABLE IF NOT EXISTS "Document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bienId" TEXT,
    "bailId" TEXT,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "taille" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Document_userId_idx" ON "Document"("userId");
CREATE INDEX IF NOT EXISTS "Document_bienId_idx" ON "Document"("bienId");

-- RegularisationCharges: regularisation des charges
CREATE TABLE IF NOT EXISTS "RegularisationCharges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "bailId" TEXT,
    "annee" INTEGER NOT NULL,
    "chargesReelles" DOUBLE PRECISION NOT NULL,
    "provisionsMensuelles" DOUBLE PRECISION NOT NULL,
    "totalProvisions" DOUBLE PRECISION NOT NULL,
    "solde" DOUBLE PRECISION NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_cours',
    "dateRegularisation" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegularisationCharges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RegularisationCharges_userId_idx" ON "RegularisationCharges"("userId");
CREATE INDEX IF NOT EXISTS "RegularisationCharges_bienId_idx" ON "RegularisationCharges"("bienId");
