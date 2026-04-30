-- NE PAS APPLIQUER avant validation humaine explicite
-- Migration générée dans le cadre de l'intégration des templates Pragmavox.
-- Ajoute 4 champs au modèle Tenant pour permettre la génération conforme
-- de lettres de mission (art. L. 612-1 Code conso : mention médiateur obligatoire).
-- Convention : camelCase côté DB, alignée sur les colonnes existantes
-- (legalName, postalCode, primaryColor, ...). Aucun @map dans schema.prisma.

ALTER TABLE "tenants" ADD COLUMN "tva" TEXT;
ALTER TABLE "tenants" ADD COLUMN "addressLine1" TEXT;
ALTER TABLE "tenants" ADD COLUMN "mediateurNomComplet" TEXT;
ALTER TABLE "tenants" ADD COLUMN "mediateurBarreau" TEXT;

-- Backfill Pragmavox (à exécuter après application de la migration) :
-- UPDATE "tenants" SET
--   "tva" = 'FR25982600272',
--   "addressLine1" = '11, rue Paul LANGEVIN'
--   WHERE "name" ILIKE '%pragmavox%';
