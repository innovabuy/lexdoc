-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PersonRole" ADD VALUE 'CLIENT';
ALTER TYPE "PersonRole" ADD VALUE 'POSTULANT';

-- AlterTable
ALTER TABLE "builder_blocks" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "builder_templates" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "folderNature" TEXT,
ADD COLUMN     "folderType" TEXT,
ADD COLUMN     "isPersonalise" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourceFileUrl" TEXT;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "adressePro" TEXT,
ADD COLUMN     "capital" TEXT,
ADD COLUMN     "civilite" TEXT,
ADD COLUMN     "complementAdressePerso" TEXT,
ADD COLUMN     "complementAdressePro" TEXT,
ADD COLUMN     "conjointDateNaissance" TIMESTAMP(3),
ADD COLUMN     "conjointNationalite" TEXT,
ADD COLUMN     "conjointNom" TEXT,
ADD COLUMN     "conjointPrenom" TEXT,
ADD COLUMN     "conjointProfession" TEXT,
ADD COLUMN     "cpPro" TEXT,
ADD COLUMN     "dateContratMariage" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "departementNaissance" TEXT,
ADD COLUMN     "emailSecondaire" TEXT,
ADD COLUMN     "fax" TEXT,
ADD COLUMN     "formeSociale" TEXT,
ADD COLUMN     "lieuNaissance" TEXT,
ADD COLUMN     "mereNomJeuneFille" TEXT,
ADD COLUMN     "merePrenom" TEXT,
ADD COLUMN     "nationalite" TEXT DEFAULT 'Française',
ADD COLUMN     "nbEnfantsMajeurs" INTEGER DEFAULT 0,
ADD COLUMN     "nbEnfantsMineurs" INTEGER DEFAULT 0,
ADD COLUMN     "nomUsage" TEXT,
ADD COLUMN     "notaireMariage" TEXT,
ADD COLUMN     "objetSocial" TEXT,
ADD COLUMN     "paysNaissance" TEXT,
ADD COLUMN     "paysPro" TEXT,
ADD COLUMN     "pereNom" TEXT,
ADD COLUMN     "perePrenom" TEXT,
ADD COLUMN     "profession" TEXT,
ADD COLUMN     "profileCompletionPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "profileLastStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "profileSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "profileSubmittedVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rcs" TEXT,
ADD COLUMN     "regimeMatrimonial" TEXT,
ADD COLUMN     "secu" TEXT,
ADD COLUMN     "siege" TEXT,
ADD COLUMN     "situationFamiliale" TEXT,
ADD COLUMN     "telPro" TEXT,
ADD COLUMN     "villePro" TEXT;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "docCategoryId" TEXT,
ADD COLUMN     "docusignEnvelopeId" TEXT,
ADD COLUMN     "docusignSentAt" TIMESTAMP(3),
ADD COLUMN     "docusignSignedAt" TIMESTAMP(3),
ADD COLUMN     "docusignStatus" TEXT,
ADD COLUMN     "sendingboxDeliveredAt" TIMESTAMP(3),
ADD COLUMN     "sendingboxSentAt" TIMESTAMP(3),
ADD COLUMN     "sendingboxStatus" TEXT,
ADD COLUMN     "sendingboxTrackingId" TEXT,
ADD COLUMN     "templateId" TEXT,
ADD COLUMN     "visibleExtranet" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "folder_persons" ADD COLUMN     "avocatAdverseId" TEXT,
ADD COLUMN     "barreau" TEXT,
ADD COLUMN     "cabinet" TEXT,
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "ordre" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "folders" ADD COLUMN     "chambre" TEXT,
ADD COLUMN     "dateAudience" TIMESTAMP(3),
ADD COLUMN     "dateEcheance" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "juridiction" TEXT,
ADD COLUMN     "nature" TEXT,
ADD COLUMN     "numeroRG" TEXT;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "barreau" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "toque" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "sourceFileUrl" TEXT,
    "variables" JSONB,
    "blocks" JSONB,
    "folderType" TEXT,
    "folderNature" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isPersonalise" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder_doc_categories" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "folderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,

    CONSTRAINT "folder_doc_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder_tree_templates" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "folderType" TEXT NOT NULL,
    "categories" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "folder_tree_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature_requests" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "folderId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "docusignEnvelopeId" TEXT,
    "signataires" JSONB NOT NULL,
    "ordreSignature" TEXT NOT NULL DEFAULT 'parallele',
    "dateExpiration" TIMESTAMP(3),
    "messagePersonnalise" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "signature_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "folderId" TEXT NOT NULL,
    "documentId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "userId" TEXT,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_reminders" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "reminderNumber" INTEGER NOT NULL DEFAULT 1,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "client_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "templates_tenantId_idx" ON "templates"("tenantId");

-- CreateIndex
CREATE INDEX "templates_category_idx" ON "templates"("category");

-- CreateIndex
CREATE INDEX "folder_doc_categories_folderId_idx" ON "folder_doc_categories"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "folder_doc_categories_folderId_name_key" ON "folder_doc_categories"("folderId", "name");

-- CreateIndex
CREATE INDEX "folder_tree_templates_tenantId_idx" ON "folder_tree_templates"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "folder_tree_templates_tenantId_name_key" ON "folder_tree_templates"("tenantId", "name");

-- CreateIndex
CREATE INDEX "signature_requests_folderId_idx" ON "signature_requests"("folderId");

-- CreateIndex
CREATE INDEX "signature_requests_documentId_idx" ON "signature_requests"("documentId");

-- CreateIndex
CREATE INDEX "signature_requests_docusignEnvelopeId_idx" ON "signature_requests"("docusignEnvelopeId");

-- CreateIndex
CREATE INDEX "timeline_events_folderId_idx" ON "timeline_events"("folderId");

-- CreateIndex
CREATE INDEX "timeline_events_type_idx" ON "timeline_events"("type");

-- CreateIndex
CREATE INDEX "timeline_events_createdAt_idx" ON "timeline_events"("createdAt");

-- CreateIndex
CREATE INDEX "client_reminders_tenantId_idx" ON "client_reminders"("tenantId");

-- CreateIndex
CREATE INDEX "client_reminders_clientId_idx" ON "client_reminders"("clientId");

-- CreateIndex
CREATE INDEX "client_reminders_scheduledAt_idx" ON "client_reminders"("scheduledAt");

-- CreateIndex
CREATE INDEX "client_reminders_status_idx" ON "client_reminders"("status");

-- CreateIndex
CREATE INDEX "clients_lastName_firstName_idx" ON "clients"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "documents_docCategoryId_idx" ON "documents"("docCategoryId");

-- CreateIndex
CREATE INDEX "documents_clientId_idx" ON "documents"("clientId");

-- CreateIndex
CREATE INDEX "folder_persons_clientId_idx" ON "folder_persons"("clientId");

-- CreateIndex
CREATE INDEX "folder_persons_role_idx" ON "folder_persons"("role");

-- AddForeignKey
ALTER TABLE "folder_persons" ADD CONSTRAINT "folder_persons_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_persons" ADD CONSTRAINT "folder_persons_avocatAdverseId_fkey" FOREIGN KEY ("avocatAdverseId") REFERENCES "folder_persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_docCategoryId_fkey" FOREIGN KEY ("docCategoryId") REFERENCES "folder_doc_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_doc_categories" ADD CONSTRAINT "folder_doc_categories_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_requests" ADD CONSTRAINT "signature_requests_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_requests" ADD CONSTRAINT "signature_requests_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
