import { PrismaClient, BuilderDocumentType, Juridiction, OutputFormat } from '@prisma/client';

const prisma = new PrismaClient();

interface DroitAffaireTemplateSeed {
  name: string;
  documentType: BuilderDocumentType;
  juridiction: Juridiction | null;
  blockTitles: Array<{ title: string; order: number; isOptional: boolean }>;
  outputFormat: OutputFormat;
  workflowConfig: { signature: boolean; lrar: boolean; autoStore: boolean };
  legalMentions: object;
  isSystemTemplate: boolean;
}

// ============================================
// TEMPLATES DROIT DES AFFAIRES ET CESSIONS (20 templates)
// Block titles must match exactly those in droit-affaires-blocs.seed.ts
// ============================================

const droitAffairesTemplates: DroitAffaireTemplateSeed[] = [
  // ============================================
  // CESSIONS D'ENTREPRISE (8 templates) - 31-38
  // ============================================
  {
    name: "Lettre d'intention (LOI) - Acquisition",
    documentType: BuilderDocumentType.MISE_EN_DEMEURE,
    juridiction: null,
    blockTitles: [
      { title: "Intro lettre d'intention (LOI)", order: 1, isOptional: false },
      { title: "Clause de confidentialité acquisition", order: 2, isOptional: false },
      { title: "Clause d'exclusivité négociation", order: 3, isOptional: true },
      { title: "Clause conditions suspensives", order: 4, isOptional: false },
      { title: "Signature - Acte de cession", order: 5, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: true, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: false,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: 'Protocole de cession de fonds de commerce',
    documentType: BuilderDocumentType.CESSION_PARTS,
    juridiction: null,
    blockTitles: [
      { title: "Intro protocole cession fonds de commerce", order: 1, isOptional: false },
      { title: "État du fonds de commerce", order: 2, isOptional: false },
      { title: "Clause de prix (cession)", order: 3, isOptional: false },
      { title: "Clause conditions suspensives", order: 4, isOptional: true },
      { title: "Clause non-concurrence cédant", order: 5, isOptional: false },
      { title: "Clause de garantie d'emploi", order: 6, isOptional: true },
      { title: "Mention - Formalités cession fonds de commerce", order: 7, isOptional: false },
      { title: "Signature - Acte de cession", order: 8, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: true, lrar: true, autoStore: true },
    legalMentions: {
      afficherBarreau: false,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: 'Protocole de cession de parts sociales SARL',
    documentType: BuilderDocumentType.CESSION_PARTS,
    juridiction: null,
    blockTitles: [
      { title: "Intro protocole cession parts sociales", order: 1, isOptional: false },
      { title: "État des parts sociales cédées", order: 2, isOptional: false },
      { title: "Clause agrément cessionnaire", order: 3, isOptional: false },
      { title: "Clause de prix (cession)", order: 4, isOptional: false },
      { title: "Clause de garantie de passif", order: 5, isOptional: false },
      { title: "Clause non-concurrence cédant", order: 6, isOptional: true },
      { title: "Clause déclarations et garanties", order: 7, isOptional: false },
      { title: "Mention - Registre mouvements de titres", order: 8, isOptional: false },
      { title: "Signature - Acte de cession", order: 9, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: true, lrar: true, autoStore: true },
    legalMentions: {
      afficherBarreau: false,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: "Protocole de cession d'actions SAS",
    documentType: BuilderDocumentType.CESSION_PARTS,
    juridiction: null,
    blockTitles: [
      { title: "Intro protocole cession parts sociales", order: 1, isOptional: false },
      { title: "État des parts sociales cédées", order: 2, isOptional: false },
      { title: "Clause agrément cessionnaire", order: 3, isOptional: false },
      { title: "Clause de prix (cession)", order: 4, isOptional: false },
      { title: "Clause d'earn-out", order: 5, isOptional: true },
      { title: "Clause de révision de prix", order: 6, isOptional: true },
      { title: "Clause de garantie de passif", order: 7, isOptional: false },
      { title: "Clause non-concurrence cédant", order: 8, isOptional: true },
      { title: "Clause audit préalable (due diligence)", order: 9, isOptional: true },
      { title: "Clause déclarations et garanties", order: 10, isOptional: false },
      { title: "Mention - Registre mouvements de titres", order: 11, isOptional: false },
      { title: "Signature - Acte de cession", order: 12, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: true, lrar: true, autoStore: true },
    legalMentions: {
      afficherBarreau: false,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: 'Garantie de passif (GAP) autonome',
    documentType: BuilderDocumentType.PROTOCOLE_TRANSACTION,
    juridiction: null,
    blockTitles: [
      { title: "Intro garantie d'actif-passif", order: 1, isOptional: false },
      { title: "Clause de garantie de passif", order: 2, isOptional: false },
      { title: "Clause de confidentialité acquisition", order: 3, isOptional: false },
      { title: "Clause résolution conflits associés", order: 4, isOptional: false },
      { title: "Signature - Acte de cession", order: 5, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: true, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: false,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: "Convention d'earn-out",
    documentType: BuilderDocumentType.PROTOCOLE_TRANSACTION,
    juridiction: null,
    blockTitles: [
      { title: "Intro protocole cession parts sociales", order: 1, isOptional: false },
      { title: "Clause d'earn-out", order: 2, isOptional: false },
      { title: "Clause de gouvernance", order: 3, isOptional: true },
      { title: "Clause de confidentialité acquisition", order: 4, isOptional: false },
      { title: "Clause résolution conflits associés", order: 5, isOptional: false },
      { title: "Signature - Acte de cession", order: 6, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: true, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: false,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: "Promesse unilatérale d'achat de titres",
    documentType: BuilderDocumentType.CESSION_PARTS,
    juridiction: null,
    blockTitles: [
      { title: "Intro protocole cession parts sociales", order: 1, isOptional: false },
      { title: "État des parts sociales cédées", order: 2, isOptional: false },
      { title: "Clause de prix (cession)", order: 3, isOptional: false },
      { title: "Clause conditions suspensives", order: 4, isOptional: false },
      { title: "Clause d'exclusivité négociation", order: 5, isOptional: true },
      { title: "Clause de confidentialité acquisition", order: 6, isOptional: false },
      { title: "Signature - Acte de cession", order: 7, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: true, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: false,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: "Promesse unilatérale de vente de titres",
    documentType: BuilderDocumentType.CESSION_PARTS,
    juridiction: null,
    blockTitles: [
      { title: "Intro protocole cession parts sociales", order: 1, isOptional: false },
      { title: "État des parts sociales cédées", order: 2, isOptional: false },
      { title: "Clause de prix (cession)", order: 3, isOptional: false },
      { title: "Clause conditions suspensives", order: 4, isOptional: false },
      { title: "Clause de confidentialité acquisition", order: 5, isOptional: false },
      { title: "Clause non-concurrence cédant", order: 6, isOptional: true },
      { title: "Signature - Acte de cession", order: 7, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: true, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: false,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },

  // ============================================
  // DROIT DES SOCIÉTÉS (7 templates) - 39-45
  // ============================================
  {
    name: 'Statuts SAS complets',
    documentType: BuilderDocumentType.STATUTS_SOCIETE,
    juridiction: null,
    blockTitles: [
      { title: "Intro statuts SAS", order: 1, isOptional: false },
      { title: "Composition du capital social", order: 2, isOptional: false },
      { title: "Clause de gouvernance", order: 3, isOptional: false },
      { title: "Clause d'agrément statutaire", order: 4, isOptional: false },
      { title: "Clause préemption associés", order: 5, isOptional: true },
      { title: "Clause inaliénabilité temporaire", order: 6, isOptional: true },
      { title: "Clause de répartition des résultats", order: 7, isOptional: false },
      { title: "Clause d'augmentation de capital", order: 8, isOptional: true },
      { title: "Clause résolution conflits associés", order: 9, isOptional: false },
      { title: "Signature - Pacte d'associés", order: 10, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: true, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: false,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: 'Statuts SARL complets',
    documentType: BuilderDocumentType.STATUTS_SOCIETE,
    juridiction: null,
    blockTitles: [
      { title: "Intro statuts SARL", order: 1, isOptional: false },
      { title: "Composition du capital social", order: 2, isOptional: false },
      { title: "Clause de gouvernance", order: 3, isOptional: false },
      { title: "Clause d'agrément statutaire", order: 4, isOptional: false },
      { title: "Clause préemption associés", order: 5, isOptional: true },
      { title: "Clause de répartition des résultats", order: 6, isOptional: false },
      { title: "Clause résolution conflits associés", order: 7, isOptional: false },
      { title: "Signature - Pacte d'associés", order: 8, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: true, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: false,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: "Pacte d'associés SAS",
    documentType: BuilderDocumentType.PACTE_ASSOCIES,
    juridiction: null,
    blockTitles: [
      { title: "Intro pacte d'associés", order: 1, isOptional: false },
      { title: "Clause de gouvernance", order: 2, isOptional: false },
      { title: "Clause d'agrément statutaire", order: 3, isOptional: false },
      { title: "Clause préemption associés", order: 4, isOptional: false },
      { title: "Clause tag along (sortie conjointe)", order: 5, isOptional: false },
      { title: "Clause drag along (sortie forcée)", order: 6, isOptional: false },
      { title: "Clause de préférence", order: 7, isOptional: true },
      { title: "Clause anti-dilution", order: 8, isOptional: true },
      { title: "Clause de liquidation préférentielle", order: 9, isOptional: true },
      { title: "Clause bad leaver / good leaver", order: 10, isOptional: true },
      { title: "Clause non-concurrence cédant", order: 11, isOptional: false },
      { title: "Clause de confidentialité acquisition", order: 12, isOptional: false },
      { title: "Clause résolution conflits associés", order: 13, isOptional: false },
      { title: "Signature - Pacte d'associés", order: 14, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: true, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: false,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: "PV d'assemblée générale ordinaire",
    documentType: BuilderDocumentType.CUSTOM,
    juridiction: null,
    blockTitles: [
      { title: "Intro PV assemblée générale", order: 1, isOptional: false },
      { title: "Clause de répartition des résultats", order: 2, isOptional: false },
      { title: "Signature - Pacte d'associés", order: 3, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: false,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: "PV d'assemblée générale extraordinaire",
    documentType: BuilderDocumentType.CUSTOM,
    juridiction: null,
    blockTitles: [
      { title: "Intro PV assemblée générale", order: 1, isOptional: false },
      { title: "Clause d'augmentation de capital", order: 2, isOptional: false },
      { title: "Signature - Pacte d'associés", order: 3, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: false,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: "Convention d'animation de groupe (holding)",
    documentType: BuilderDocumentType.CONTRAT_PRESTATION,
    juridiction: null,
    blockTitles: [
      { title: "Intro pacte d'associés", order: 1, isOptional: false },
      { title: "Clause de gouvernance", order: 2, isOptional: false },
      { title: "Clause de confidentialité acquisition", order: 3, isOptional: false },
      { title: "Clause résolution conflits associés", order: 4, isOptional: false },
      { title: "Signature - Pacte d'associés", order: 5, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: true, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: false,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: 'Conclusions dissolution société pour justes motifs',
    documentType: BuilderDocumentType.CONCLUSIONS_RECAPITULATIVES,
    juridiction: Juridiction.TRIBUNAL_COMMERCE,
    blockTitles: [
      { title: "Chronologie négociation cession", order: 1, isOptional: false },
      { title: "Abus de majorité/minorité", order: 2, isOptional: false },
      { title: "Dispositif - Dissolution anticipée société", order: 3, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: true,
      afficherToque: true,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },

  // ============================================
  // CONTRATS COMMERCIAUX (5 templates) - 46-50
  // ============================================
  {
    name: 'Contrat de distribution exclusive',
    documentType: BuilderDocumentType.CONTRAT_PRESTATION,
    juridiction: null,
    blockTitles: [
      { title: "Intro contrat de distribution", order: 1, isOptional: false },
      { title: "Clause non-concurrence cédant", order: 2, isOptional: false },
      { title: "Clause de confidentialité acquisition", order: 3, isOptional: false },
      { title: "Clause résolution conflits associés", order: 4, isOptional: false },
      { title: "Signature - Acte de cession", order: 5, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: true, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: false,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: 'Contrat de franchise',
    documentType: BuilderDocumentType.CONTRAT_PRESTATION,
    juridiction: null,
    blockTitles: [
      { title: "Intro contrat de franchise", order: 1, isOptional: false },
      { title: "Clause non-concurrence cédant", order: 2, isOptional: false },
      { title: "Clause de confidentialité acquisition", order: 3, isOptional: false },
      { title: "Clause résolution conflits associés", order: 4, isOptional: false },
      { title: "Signature - Acte de cession", order: 5, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: true, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: false,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: 'Conclusions rupture brutale relations commerciales',
    documentType: BuilderDocumentType.CONCLUSIONS_RECAPITULATIVES,
    juridiction: Juridiction.TRIBUNAL_COMMERCE,
    blockTitles: [
      { title: "Chronologie négociation cession", order: 1, isOptional: false },
      { title: "Rupture relation commerciale établie", order: 2, isOptional: false },
      { title: "Dispositif - Responsabilité dirigeant social", order: 3, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: true,
      afficherToque: true,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: 'Conclusions action en responsabilité du dirigeant',
    documentType: BuilderDocumentType.CONCLUSIONS_RECAPITULATIVES,
    juridiction: Juridiction.TRIBUNAL_COMMERCE,
    blockTitles: [
      { title: "Chronologie négociation cession", order: 1, isOptional: false },
      { title: "Faute de gestion dirigeant", order: 2, isOptional: false },
      { title: "Dispositif - Responsabilité dirigeant social", order: 3, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: true,
      afficherToque: true,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: 'Conclusions abus de majorité',
    documentType: BuilderDocumentType.CONCLUSIONS_RECAPITULATIVES,
    juridiction: Juridiction.TRIBUNAL_COMMERCE,
    blockTitles: [
      { title: "Chronologie négociation cession", order: 1, isOptional: false },
      { title: "Abus de majorité/minorité", order: 2, isOptional: false },
      { title: "Dispositif - Responsabilité dirigeant social", order: 3, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: true,
      afficherToque: true,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
];

/**
 * Seeds business law templates
 */
export async function seedDroitAffairesTemplates(cabinetId: string, userId: string): Promise<number> {
  console.log('Seeding business law templates (droit des affaires)...');

  // Load all system blocks to get their IDs
  const blocks = await prisma.documentBlock.findMany({
    where: { isSystemBlock: true },
    select: { id: true, title: true, variables: true },
  });

  console.log(`Found ${blocks.length} system blocks to reference`);

  // Helper to get block ID by title
  const getBlockId = (title: string): string | undefined => {
    const block = blocks.find((b) => b.title === title);
    if (!block) {
      console.warn(`  Warning: Block not found: "${title}"`);
    }
    return block?.id;
  };

  // Helper to get variables from block
  const getBlockVariables = (title: string): Array<{ name: string; type: string; required?: boolean }> => {
    const block = blocks.find((b) => b.title === title);
    if (block && block.variables) {
      return block.variables as Array<{ name: string; type: string; required?: boolean }>;
    }
    return [];
  };

  let createdCount = 0;
  const skippedTemplates: string[] = [];

  for (const template of droitAffairesTemplates) {
    // Build blocks structure with actual IDs
    const blocksStructure: Array<{ blockId: string; order: number; isOptional: boolean }> = [];
    let allBlocksFound = true;

    for (const bt of template.blockTitles) {
      const blockId = getBlockId(bt.title);
      if (blockId) {
        blocksStructure.push({
          blockId,
          order: bt.order,
          isOptional: bt.isOptional,
        });
      } else {
        allBlocksFound = false;
      }
    }

    // Skip template if not all blocks are found
    if (!allBlocksFound || blocksStructure.length === 0) {
      console.warn(`  Skipping template "${template.name}" - missing blocks`);
      skippedTemplates.push(template.name);
      continue;
    }

    // Collect required variables from all referenced blocks
    const requiredVariables: Array<{ name: string; type: string; required?: boolean }> = [];
    for (const bt of template.blockTitles) {
      const blockVars = getBlockVariables(bt.title);
      for (const v of blockVars) {
        if (!requiredVariables.find((rv) => rv.name === v.name)) {
          requiredVariables.push(v);
        }
      }
    }

    // Check if template already exists
    const existingTemplate = await prisma.builderTemplate.findFirst({
      where: {
        cabinetId,
        name: template.name,
      },
    });

    if (existingTemplate) {
      console.log(`  Template already exists: "${template.name}"`);
      continue;
    }

    // Create the template
    await prisma.builderTemplate.create({
      data: {
        cabinetId,
        createdById: userId,
        name: template.name,
        documentType: template.documentType,
        juridiction: template.juridiction,
        blocksStructure,
        requiredVariables,
        outputFormat: template.outputFormat,
        workflowConfig: template.workflowConfig,
        legalMentions: template.legalMentions,
        isSystemTemplate: template.isSystemTemplate,
      },
    });

    createdCount++;
    console.log(`  Created template: "${template.name}"`);
  }

  if (skippedTemplates.length > 0) {
    console.log(`\nSkipped ${skippedTemplates.length} templates due to missing blocks:`);
    skippedTemplates.forEach((name) => console.log(`  - ${name}`));
  }

  console.log(`\nBusiness law templates seeding completed: ${createdCount} templates created`);
  return createdCount;
}

// Export for use in seed.ts
export { droitAffairesTemplates };
export type { DroitAffaireTemplateSeed };
