-- CreateTable
CREATE TABLE IF NOT EXISTS "DiagnosticBien" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "bienId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" VARCHAR(20) NOT NULL,
  "dateRealisation" TIMESTAMP(3),
  "dateExpiration" TIMESTAMP(3),
  "fichierUrl" TEXT,
  "fichierNom" TEXT,
  "validite" VARCHAR(20) DEFAULT 'valide',
  "notes" TEXT,
  "nonConcerne" BOOLEAN NOT NULL DEFAULT false,
  "alerteEnvoyee30j" BOOLEAN NOT NULL DEFAULT false,
  "alerteEnvoyee7j" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DiagnosticBien_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DiagnosticBien_bienId_type_key" ON "DiagnosticBien"("bienId", "type");
CREATE INDEX IF NOT EXISTS "DiagnosticBien_bienId_idx" ON "DiagnosticBien"("bienId");
CREATE INDEX IF NOT EXISTS "DiagnosticBien_userId_idx" ON "DiagnosticBien"("userId");
CREATE INDEX IF NOT EXISTS "DiagnosticBien_dateExpiration_idx" ON "DiagnosticBien"("dateExpiration");
