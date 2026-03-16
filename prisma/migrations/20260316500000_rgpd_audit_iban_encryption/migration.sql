-- RGPD : Ajout IBAN chiffré au profil bailleur
ALTER TABLE "ProfilBailleurTable" ADD COLUMN IF NOT EXISTS "iban" TEXT;

-- RGPD : Table de consentement utilisateur
CREATE TABLE IF NOT EXISTS "ConsentRGPD" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "consenti" BOOLEAN NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ConsentRGPD_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ConsentRGPD_userId_idx" ON "ConsentRGPD"("userId");
CREATE INDEX IF NOT EXISTS "ConsentRGPD_type_idx" ON "ConsentRGPD"("type");

-- RGPD : Journal d'audit
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
