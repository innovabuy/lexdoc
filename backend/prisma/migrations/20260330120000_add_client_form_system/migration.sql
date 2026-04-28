-- CreateEnum
CREATE TYPE "FormSectionType" AS ENUM ('IDENTITE', 'COORDONNEES', 'SITUATION_FAMILIALE', 'FILIATION', 'CONJOINT_PACS', 'SITUATION_MATRIMONIALE', 'INFORMATIONS_PROJET');

-- CreateEnum
CREATE TYPE "FormResponseStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateTable
CREATE TABLE "client_form_templates" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "folderType" "FolderType",
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "client_form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_form_sections" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "templateId" TEXT NOT NULL,
    "section" "FormSectionType" NOT NULL,
    "label" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "client_form_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_form_responses" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "folderId" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "status" "FormResponseStatus" NOT NULL DEFAULT 'DRAFT',
    "lastStep" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "client_form_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_form_templates_tenantId_idx" ON "client_form_templates"("tenantId");

-- CreateIndex
CREATE INDEX "client_form_sections_templateId_idx" ON "client_form_sections"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "client_form_sections_templateId_section_key" ON "client_form_sections"("templateId", "section");

-- CreateIndex
CREATE INDEX "client_form_responses_tenantId_idx" ON "client_form_responses"("tenantId");

-- CreateIndex
CREATE INDEX "client_form_responses_clientId_idx" ON "client_form_responses"("clientId");

-- CreateIndex
CREATE INDEX "client_form_responses_folderId_idx" ON "client_form_responses"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "client_form_responses_clientId_templateId_folderId_key" ON "client_form_responses"("clientId", "templateId", "folderId");

-- AddForeignKey
ALTER TABLE "client_form_templates" ADD CONSTRAINT "client_form_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_form_sections" ADD CONSTRAINT "client_form_sections_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "client_form_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_form_responses" ADD CONSTRAINT "client_form_responses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_form_responses" ADD CONSTRAINT "client_form_responses_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "client_form_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_form_responses" ADD CONSTRAINT "client_form_responses_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_form_responses" ADD CONSTRAINT "client_form_responses_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
