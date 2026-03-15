-- CreateTable Bien (migration IndexedDB → PostgreSQL)
CREATE TABLE IF NOT EXISTS "Bien" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "loyer" DOUBLE PRECISION NOT NULL,
    "charges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "typeBail" "TypeBail" NOT NULL DEFAULT 'HABITATION_VIDE',
    "locataireNom" TEXT,
    "locatairePrenom" TEXT,
    "dateEntree" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "preavisMois" INTEGER,
    "dateRevision" TIMESTAMP(3),
    "indiceReference" TEXT,
    "diagnostics" JSONB DEFAULT '[]',
    "statut" TEXT DEFAULT 'vacant',
    "annexes" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bien_pkey" PRIMARY KEY ("id")
);

-- CreateTable PaiementBien (migration IndexedDB → PostgreSQL)
CREATE TABLE IF NOT EXISTS "PaiementBien" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "locataireNom" TEXT NOT NULL,
    "locatairePrenom" TEXT,
    "locataireEmail" TEXT,
    "loyerCC" DOUBLE PRECISION NOT NULL,
    "dateAttendue" TIMESTAMP(3) NOT NULL,
    "dateReelle" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'attendu',
    "montantRecu" DOUBLE PRECISION,
    "mois" TEXT NOT NULL,
    "notes" TEXT,
    "relances" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaiementBien_pkey" PRIMARY KEY ("id")
);

-- CreateTable CandidatureLocal (migration IndexedDB → PostgreSQL)
CREATE TABLE IF NOT EXISTS "CandidatureLocal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "dossier" JSONB NOT NULL DEFAULT '{}',
    "bailScore" DOUBLE PRECISION,
    "scoreGrade" TEXT,
    "eligibleVisale" BOOLEAN,
    "alertesFraude" INTEGER,
    "aGarant" BOOLEAN NOT NULL DEFAULT false,
    "dossierGarant" JSONB,
    "completude" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidatureLocal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Bien_userId_idx" ON "Bien"("userId");
CREATE INDEX IF NOT EXISTS "PaiementBien_userId_idx" ON "PaiementBien"("userId");
CREATE INDEX IF NOT EXISTS "PaiementBien_bienId_idx" ON "PaiementBien"("bienId");
CREATE INDEX IF NOT EXISTS "PaiementBien_mois_idx" ON "PaiementBien"("mois");
CREATE INDEX IF NOT EXISTS "CandidatureLocal_userId_idx" ON "CandidatureLocal"("userId");
CREATE INDEX IF NOT EXISTS "CandidatureLocal_bienId_idx" ON "CandidatureLocal"("bienId");

-- AlterTable BailActif — colocataires, garants, cloture
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "colocataires" JSONB DEFAULT '[]';
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "garants" JSONB DEFAULT '[]';
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "dateSortie" TIMESTAMP(3);
ALTER TABLE "BailActif" ADD COLUMN IF NOT EXISTS "motifSortie" TEXT;
