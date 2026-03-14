-- Ajout du champ plan sur User pour distinguer FREE / SOLO / DUO
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'FREE';
