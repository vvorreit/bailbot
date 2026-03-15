-- US 18 — Profil bailleur complet pour pré-remplissage PDF
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profilBailleur" JSONB;
