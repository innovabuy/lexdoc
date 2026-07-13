-- GO-LIVE-6 C3 — une personne MORALE (partie adverse société) n'a pas de "nom de
-- famille" : lastName devient nullable (la raison sociale vit dans company).
ALTER TABLE "folder_persons" ALTER COLUMN "lastName" DROP NOT NULL;
