/*
  Warnings:

  - You are about to drop the column `category` on the `documents` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DocumentRequestStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DocumentRequestPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "builder_templates" ADD COLUMN     "templateCategoryId" TEXT;

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "category",
ADD COLUMN     "folderCategoryId" TEXT;

-- CreateTable
CREATE TABLE "folder_categories" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "parentId" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "folder_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_categories" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "template_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_requests" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "folderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "DocumentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "DocumentRequestPriority" NOT NULL DEFAULT 'NORMAL',
    "dueDate" TIMESTAMP(3),
    "responseDocumentId" TEXT,
    "responseDate" TIMESTAMP(3),
    "responseNotes" TEXT,
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "lastReminderAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "document_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "folder_categories_tenantId_idx" ON "folder_categories"("tenantId");

-- CreateIndex
CREATE INDEX "folder_categories_parentId_idx" ON "folder_categories"("parentId");

-- CreateIndex
CREATE INDEX "template_categories_tenantId_idx" ON "template_categories"("tenantId");

-- CreateIndex
CREATE INDEX "document_requests_folderId_idx" ON "document_requests"("folderId");

-- CreateIndex
CREATE INDEX "document_requests_tenantId_idx" ON "document_requests"("tenantId");

-- CreateIndex
CREATE INDEX "document_requests_status_idx" ON "document_requests"("status");

-- CreateIndex
CREATE INDEX "builder_templates_templateCategoryId_idx" ON "builder_templates"("templateCategoryId");

-- CreateIndex
CREATE INDEX "documents_folderCategoryId_idx" ON "documents"("folderCategoryId");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_folderCategoryId_fkey" FOREIGN KEY ("folderCategoryId") REFERENCES "folder_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builder_templates" ADD CONSTRAINT "builder_templates_templateCategoryId_fkey" FOREIGN KEY ("templateCategoryId") REFERENCES "template_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_categories" ADD CONSTRAINT "folder_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "folder_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_categories" ADD CONSTRAINT "folder_categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_categories" ADD CONSTRAINT "template_categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_responseDocumentId_fkey" FOREIGN KEY ("responseDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
