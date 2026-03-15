-- AlterTable: add rechercheMasquee preference on User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "rechercheMasquee" BOOLEAN NOT NULL DEFAULT false;
