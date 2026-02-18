-- CreateEnum
CREATE TYPE "DeadlineType" AS ENUM ('DEADLINE', 'HEARING', 'MEETING', 'REMINDER', 'TASK', 'OTHER');

-- CreateEnum
CREATE TYPE "DeadlinePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "DeadlineStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE');

-- CreateTable
CREATE TABLE "deadlines" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "dueTime" TEXT,
    "type" "DeadlineType" NOT NULL DEFAULT 'DEADLINE',
    "priority" "DeadlinePriority" NOT NULL DEFAULT 'NORMAL',
    "status" "DeadlineStatus" NOT NULL DEFAULT 'PENDING',
    "reminders" JSONB,
    "lastReminderSentAt" TIMESTAMP(3),
    "folderId" TEXT,
    "documentId" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,

    CONSTRAINT "deadlines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deadlines_tenantId_idx" ON "deadlines"("tenantId");

-- CreateIndex
CREATE INDEX "deadlines_dueDate_idx" ON "deadlines"("dueDate");

-- CreateIndex
CREATE INDEX "deadlines_status_idx" ON "deadlines"("status");

-- CreateIndex
CREATE INDEX "deadlines_folderId_idx" ON "deadlines"("folderId");

-- CreateIndex
CREATE INDEX "deadlines_assignedToId_idx" ON "deadlines"("assignedToId");

-- AddForeignKey
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
