-- Migration: add_user_metier
-- Adds Metier enum and metier field on User table

DO $$ BEGIN
  CREATE TYPE "Metier" AS ENUM ('PROPRIETAIRE', 'AGENCE', 'GESTIONNAIRE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "metier" "Metier";
