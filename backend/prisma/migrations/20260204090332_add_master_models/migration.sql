-- CreateEnum
CREATE TYPE "TrackingStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURE', 'SIGNED', 'PENDING_DELIVERY', 'DELIVERED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('SIGNATURE_ELECTRONIQUE', 'LRAR', 'EMAIL');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('FIRST_REMINDER', 'SECOND_REMINDER', 'THIRD_REMINDER', 'FINAL_NOTICE');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('SENT', 'FAILED', 'OPENED', 'CLICKED');

-- CreateEnum
CREATE TYPE "BlockCategory" AS ENUM ('INTRO', 'FAITS', 'MOYENS', 'DISPOSITIF', 'SIGNATURE', 'CLAUSE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "OutputFormat" AS ENUM ('DOCX', 'PDF');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('DATABASE', 'MINIO', 'FULL');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "folders" ADD COLUMN     "color" TEXT DEFAULT '#3B82F6',
ADD COLUMN     "metadataCession" JSONB,
ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "refreshTokens" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE "avocat_legal_info" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "numeroToque" TEXT,
    "barreau" TEXT,
    "specialites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rcs" TEXT,
    "tvaIntra" TEXT,
    "assuranceRC" TEXT,
    "numeroPolice" TEXT,
    "signaturePath" TEXT,
    "cachetPath" TEXT,
    "mentionsLegales" JSONB,

    CONSTRAINT "avocat_legal_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_tracking" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" "TrackingStatus" NOT NULL DEFAULT 'DRAFT',
    "deliveryMethod" "DeliveryMethod",
    "signatureRequestId" TEXT,
    "signatureStatus" "SignatureStatus",
    "signedAt" TIMESTAMP(3),
    "signedBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lrarTrackingNumber" TEXT,
    "lrarStatus" "RegisteredMailStatus",
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "lastReminderAt" TIMESTAMP(3),
    "nextReminderAt" TIMESTAMP(3),
    "autoRemindersEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "document_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trackingId" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentTo" TEXT NOT NULL,
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "status" "ReminderStatus" NOT NULL DEFAULT 'SENT',
    "errorMessage" TEXT,

    CONSTRAINT "reminder_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builder_blocks" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "category" "BlockCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,

    CONSTRAINT "builder_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builder_templates" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "documentType" TEXT NOT NULL,
    "juridiction" TEXT,
    "category" TEXT,
    "blocksStructure" JSONB NOT NULL,
    "requiredVariables" JSONB,
    "outputFormat" "OutputFormat" NOT NULL DEFAULT 'DOCX',
    "workflowConfig" JSONB,
    "legalMentions" JSONB,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,

    CONSTRAINT "builder_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_accesses" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "folderId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "activationToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "isActivated" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "client_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_access_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,

    CONSTRAINT "client_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keys" JSONB NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT,
    "type" "BackupType" NOT NULL,
    "status" "BackupStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "fileSize" BIGINT,
    "googleDriveId" TEXT,
    "errorMessage" TEXT,

    CONSTRAINT "backup_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "avocat_legal_info_tenantId_key" ON "avocat_legal_info"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "document_tracking_documentId_key" ON "document_tracking"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "document_tracking_signatureRequestId_key" ON "document_tracking"("signatureRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "document_tracking_lrarTrackingNumber_key" ON "document_tracking"("lrarTrackingNumber");

-- CreateIndex
CREATE INDEX "document_tracking_status_idx" ON "document_tracking"("status");

-- CreateIndex
CREATE INDEX "document_tracking_nextReminderAt_idx" ON "document_tracking"("nextReminderAt");

-- CreateIndex
CREATE INDEX "reminder_logs_trackingId_idx" ON "reminder_logs"("trackingId");

-- CreateIndex
CREATE INDEX "reminder_logs_sentAt_idx" ON "reminder_logs"("sentAt");

-- CreateIndex
CREATE INDEX "builder_blocks_tenantId_idx" ON "builder_blocks"("tenantId");

-- CreateIndex
CREATE INDEX "builder_blocks_category_idx" ON "builder_blocks"("category");

-- CreateIndex
CREATE INDEX "builder_blocks_isSystem_idx" ON "builder_blocks"("isSystem");

-- CreateIndex
CREATE INDEX "builder_templates_tenantId_idx" ON "builder_templates"("tenantId");

-- CreateIndex
CREATE INDEX "builder_templates_documentType_idx" ON "builder_templates"("documentType");

-- CreateIndex
CREATE INDEX "builder_templates_isSystem_idx" ON "builder_templates"("isSystem");

-- CreateIndex
CREATE INDEX "builder_templates_category_idx" ON "builder_templates"("category");

-- CreateIndex
CREATE UNIQUE INDEX "client_accesses_activationToken_key" ON "client_accesses"("activationToken");

-- CreateIndex
CREATE INDEX "client_accesses_email_idx" ON "client_accesses"("email");

-- CreateIndex
CREATE INDEX "client_accesses_activationToken_idx" ON "client_accesses"("activationToken");

-- CreateIndex
CREATE UNIQUE INDEX "client_accesses_folderId_email_key" ON "client_accesses"("folderId", "email");

-- CreateIndex
CREATE INDEX "client_access_logs_accessId_idx" ON "client_access_logs"("accessId");

-- CreateIndex
CREATE INDEX "client_access_logs_createdAt_idx" ON "client_access_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_accessId_idx" ON "push_subscriptions"("accessId");

-- CreateIndex
CREATE INDEX "backup_logs_startedAt_idx" ON "backup_logs"("startedAt");

-- CreateIndex
CREATE INDEX "backup_logs_tenantId_idx" ON "backup_logs"("tenantId");

-- CreateIndex
CREATE INDEX "folders_parentId_idx" ON "folders"("parentId");

-- AddForeignKey
ALTER TABLE "avocat_legal_info" ADD CONSTRAINT "avocat_legal_info_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_tracking" ADD CONSTRAINT "document_tracking_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_logs" ADD CONSTRAINT "reminder_logs_trackingId_fkey" FOREIGN KEY ("trackingId") REFERENCES "document_tracking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builder_blocks" ADD CONSTRAINT "builder_blocks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builder_templates" ADD CONSTRAINT "builder_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_accesses" ADD CONSTRAINT "client_accesses_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_access_logs" ADD CONSTRAINT "client_access_logs_accessId_fkey" FOREIGN KEY ("accessId") REFERENCES "client_accesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_accessId_fkey" FOREIGN KEY ("accessId") REFERENCES "client_accesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_logs" ADD CONSTRAINT "backup_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
