-- CreateEnum
CREATE TYPE "BuilderTemplateCategory" AS ENUM ('PROCEDURE_CIVILE', 'PROCEDURE_COMMERCIALE', 'PROCEDURE_PRUDHOMALE', 'PROCEDURE_ADMINISTRATIVE', 'PROCEDURE_PENALE', 'VOIES_EXECUTION', 'CONTRATS_AFFAIRES', 'CONTRATS_TRAVAIL', 'DROIT_SOCIETES', 'DROIT_IMMOBILIER', 'DROIT_FAMILLE', 'COURRIERS_CLIENTS', 'COURRIERS_ADVERSAIRES', 'COURRIERS_JURIDICTIONS', 'RELANCES', 'CUSTOM');

-- AlterTable
ALTER TABLE "builder_templates" ADD COLUMN     "based_on_template_id" TEXT,
ADD COLUMN     "category" "BuilderTemplateCategory" NOT NULL DEFAULT 'CUSTOM',
ADD COLUMN     "color" TEXT DEFAULT '#3B82F6',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "is_favorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_used_at" TIMESTAMP(3),
ADD COLUMN     "subcategory" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "builder_templates_cabinet_id_category_idx" ON "builder_templates"("cabinet_id", "category");

-- CreateIndex
CREATE INDEX "builder_templates_is_favorite_idx" ON "builder_templates"("is_favorite");

-- CreateIndex
CREATE INDEX "builder_templates_last_used_at_idx" ON "builder_templates"("last_used_at");

-- CreateIndex
CREATE INDEX "builder_templates_based_on_template_id_idx" ON "builder_templates"("based_on_template_id");

-- AddForeignKey
ALTER TABLE "builder_templates" ADD CONSTRAINT "builder_templates_based_on_template_id_fkey" FOREIGN KEY ("based_on_template_id") REFERENCES "builder_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
