-- GO-LIVE-6 C1 — Contrainte d'unicité (tenantId, email) sur les clients ACTIFS.
-- Index UNIQUE PARTIEL : l'unicité ne s'applique qu'aux clients non supprimés
-- (deletedAt IS NULL), afin de pouvoir réutiliser un email après suppression d'un
-- client. Empêche les doublons créés par double-soumission (TOCTOU applicatif).
CREATE UNIQUE INDEX IF NOT EXISTS "clients_tenantId_email_active_key"
  ON "clients" ("tenantId", email)
  WHERE "deletedAt" IS NULL;
