-- Ajout de la colonne passwordChangedAt pour l'invalidation des sessions après changement de mot de passe
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);

-- Indexes pour améliorer les performances des requêtes fréquentes
-- User.teamId : utilisé dans toutes les requêtes d'équipe
CREATE INDEX IF NOT EXISTS "User_teamId_idx" ON "User"("teamId");

-- Team.ownerId : utilisé pour identifier le propriétaire
CREATE INDEX IF NOT EXISTS "Team_ownerId_idx" ON "Team"("ownerId");

-- User.role : utilisé dans les requêtes admin
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- User.createdAt : utilisé dans les statistiques admin (30 derniers jours)
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");
