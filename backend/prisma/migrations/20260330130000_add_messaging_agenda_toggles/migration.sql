-- AlterTable
ALTER TABLE "tenant_settings" ADD COLUMN     "enableAgenda" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableMessaging" BOOLEAN NOT NULL DEFAULT true;
