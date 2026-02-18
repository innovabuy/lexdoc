-- CreateEnum
CREATE TYPE "PersonRole" AS ENUM ('PARTIE_ADVERSE', 'AVOCAT_ADVERSE', 'TEMOIN', 'EXPERT', 'NOTAIRE', 'HUISSIER', 'MEDIATEUR', 'AUTRE');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('PHYSIQUE', 'MORALE');

-- CreateTable
CREATE TABLE "folder_persons" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "folderId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "PersonType" NOT NULL DEFAULT 'PHYSIQUE',
    "role" "PersonRole" NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,

    CONSTRAINT "folder_persons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "folder_persons_folderId_idx" ON "folder_persons"("folderId");

-- CreateIndex
CREATE INDEX "folder_persons_tenantId_idx" ON "folder_persons"("tenantId");

-- AddForeignKey
ALTER TABLE "folder_persons" ADD CONSTRAINT "folder_persons_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_persons" ADD CONSTRAINT "folder_persons_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
