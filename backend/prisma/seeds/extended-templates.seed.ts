import { PrismaClient, BuilderDocumentType, Juridiction, OutputFormat } from '@prisma/client';

const prisma = new PrismaClient();

interface ExtendedTemplateSeed {
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
// 25 EXTENDED SYSTEM TEMPLATES
// Using only existing blocks from documentBuilder.seed.ts and extended-blocks.seed.ts
// ============================================

const extendedTemplates: ExtendedTemplateSeed[] = [
  // ============================================
  // PROCÉDURE CIVILE - JAF / FAMILLE (4)
  // ============================================
  {
    name: 'Requête séparation de corps devant le JAF',
    documentType: BuilderDocumentType.REQUETE,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blockTitles: [
      { title: 'Introduction requête JAF', order: 1, isOptional: false },
      { title: 'Exposé séparation conjugale', order: 2, isOptional: false },
      { title: 'Articles 212 et suivants CC - Obligations entre époux', order: 3, isOptional: false },
      { title: 'Article 260 CC - Effets du divorce', order: 4, isOptional: true },
      { title: 'Dispositif pension alimentaire', order: 5, isOptional: false },
      { title: 'Bordereau de pièces', order: 6, isOptional: true },
      { title: 'Signature avocat standard', order: 7, isOptional: false },
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
    name: 'Requête pension alimentaire impayée JAF',
    documentType: BuilderDocumentType.REQUETE,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blockTitles: [
      { title: 'Introduction requête JAF', order: 1, isOptional: false },
      { title: 'Exposé pension alimentaire impayée', order: 2, isOptional: false },
      { title: 'Article 371-1 CC - Autorité parentale', order: 3, isOptional: true },
      { title: 'Dispositif pension alimentaire', order: 4, isOptional: false },
      { title: 'Bordereau de pièces', order: 5, isOptional: true },
      { title: 'Signature avocat standard', order: 6, isOptional: false },
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
    name: 'Requête modification droit de visite et hébergement',
    documentType: BuilderDocumentType.REQUETE,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blockTitles: [
      { title: 'Introduction requête JAF', order: 1, isOptional: false },
      { title: 'Exposé droit de visite non respecté', order: 2, isOptional: false },
      { title: 'Article 371-1 CC - Autorité parentale', order: 3, isOptional: false },
      { title: 'Dispositif droit de visite et hébergement', order: 4, isOptional: false },
      { title: 'Bordereau de pièces', order: 5, isOptional: true },
      { title: 'Signature avocat standard', order: 6, isOptional: false },
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
    name: 'Requête contestation autorité parentale',
    documentType: BuilderDocumentType.REQUETE,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blockTitles: [
      { title: 'Introduction requête JAF', order: 1, isOptional: false },
      { title: 'Exposé contestation autorité parentale', order: 2, isOptional: false },
      { title: 'Article 371-1 CC - Autorité parentale', order: 3, isOptional: false },
      { title: 'Dispositif droit de visite et hébergement', order: 4, isOptional: false },
      { title: 'Bordereau de pièces', order: 5, isOptional: true },
      { title: 'Signature avocat standard', order: 6, isOptional: false },
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
  // PROCÉDURE CIVILE - JEX / EXÉCUTION (3)
  // ============================================
  {
    name: 'Requête devant le JEX - Contestation exécution',
    documentType: BuilderDocumentType.REQUETE,
    juridiction: Juridiction.JEX,
    blockTitles: [
      { title: 'Introduction requête JEX', order: 1, isOptional: false },
      { title: 'Exposé créance impayée', order: 2, isOptional: false },
      { title: 'Article 1353 CC - Charge de la preuve', order: 3, isOptional: false },
      { title: 'Condamnation au paiement de somme', order: 4, isOptional: false },
      { title: 'Bordereau de pièces', order: 5, isOptional: true },
      { title: 'Signature avocat standard', order: 6, isOptional: false },
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
    name: 'Requête délais de grâce JEX',
    documentType: BuilderDocumentType.REQUETE,
    juridiction: Juridiction.JEX,
    blockTitles: [
      { title: 'Introduction requête JEX', order: 1, isOptional: false },
      { title: 'Exposé créance impayée', order: 2, isOptional: false },
      { title: 'Article 1343-5 CC - Délais de grâce', order: 3, isOptional: false },
      { title: 'Condamnation au paiement de somme', order: 4, isOptional: false },
      { title: 'Bordereau de pièces', order: 5, isOptional: true },
      { title: 'Signature avocat standard', order: 6, isOptional: false },
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
    name: 'Demande astreinte devant JEX',
    documentType: BuilderDocumentType.REQUETE,
    juridiction: Juridiction.JEX,
    blockTitles: [
      { title: 'Introduction requête JEX', order: 1, isOptional: false },
      { title: 'Exposé créance impayée', order: 2, isOptional: false },
      { title: 'Dispositif astreinte', order: 3, isOptional: false },
      { title: 'Bordereau de pièces', order: 4, isOptional: true },
      { title: 'Signature avocat standard', order: 5, isOptional: false },
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
  // PROCÉDURE CIVILE - INJONCTION DE PAYER (3)
  // ============================================
  {
    name: 'Opposition ordonnance injonction de payer',
    documentType: BuilderDocumentType.CONCLUSIONS_DEFENSE,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blockTitles: [
      { title: 'Introduction opposition injonction de payer', order: 1, isOptional: false },
      { title: 'Exposé créance impayée', order: 2, isOptional: false },
      { title: 'Article 1353 CC - Charge de la preuve', order: 3, isOptional: false },
      { title: 'Condamnation au paiement de somme', order: 4, isOptional: false },
      { title: 'Bordereau de pièces', order: 5, isOptional: true },
      { title: 'Signature avocat standard', order: 6, isOptional: false },
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
    name: 'Requête injonction de payer créance commerciale',
    documentType: BuilderDocumentType.REQUETE,
    juridiction: Juridiction.TRIBUNAL_COMMERCE,
    blockTitles: [
      { title: 'Introduction lettre avant poursuites', order: 1, isOptional: false },
      { title: 'Exposé impayés fournisseur', order: 2, isOptional: false },
      { title: 'Article 1104 CC - Bonne foi contractuelle', order: 3, isOptional: true },
      { title: 'Condamnation au paiement de somme', order: 4, isOptional: false },
      { title: 'Bordereau de pièces', order: 5, isOptional: false },
      { title: 'Signature société représentant légal', order: 6, isOptional: false },
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
    name: 'Lettre avant poursuites recouvrement',
    documentType: BuilderDocumentType.MISE_EN_DEMEURE,
    juridiction: null,
    blockTitles: [
      { title: 'Introduction lettre avant poursuites', order: 1, isOptional: false },
      { title: 'Exposé créance impayée', order: 2, isOptional: false },
      { title: 'Signature avocat standard', order: 3, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: false, lrar: true, autoStore: true },
    legalMentions: {
      afficherBarreau: true,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },

  // ============================================
  // CONSEIL DE PRUD'HOMMES (5)
  // ============================================
  {
    name: 'Saisine CPH licenciement sans cause réelle et sérieuse',
    documentType: BuilderDocumentType.REQUETE,
    juridiction: Juridiction.CONSEIL_PRUDHOMMES,
    blockTitles: [
      { title: 'Introduction saisine Conseil de Prud\'hommes', order: 1, isOptional: false },
      { title: 'Exposé licenciement contesté', order: 2, isOptional: false },
      { title: 'Licenciement sans cause réelle et sérieuse', order: 3, isOptional: false },
      { title: 'Article L1235-3 CT - Indemnité licenciement sans cause', order: 4, isOptional: false },
      { title: 'Dispositif indemnités prud\'homales', order: 5, isOptional: false },
      { title: 'Bordereau de pièces', order: 6, isOptional: true },
      { title: 'Signature avocat standard', order: 7, isOptional: false },
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
    name: 'Saisine CPH harcèlement moral',
    documentType: BuilderDocumentType.REQUETE,
    juridiction: Juridiction.CONSEIL_PRUDHOMMES,
    blockTitles: [
      { title: 'Introduction saisine Conseil de Prud\'hommes', order: 1, isOptional: false },
      { title: 'Exposé harcèlement moral au travail', order: 2, isOptional: false },
      { title: 'Article L1152-1 CT - Harcèlement moral', order: 3, isOptional: false },
      { title: 'Article 1240 CC - Responsabilité délictuelle', order: 4, isOptional: true },
      { title: 'Dispositif indemnités prud\'homales', order: 5, isOptional: false },
      { title: 'Bordereau de pièces', order: 6, isOptional: true },
      { title: 'Signature avocat standard', order: 7, isOptional: false },
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
    name: 'Saisine CPH rappel heures supplémentaires',
    documentType: BuilderDocumentType.REQUETE,
    juridiction: Juridiction.CONSEIL_PRUDHOMMES,
    blockTitles: [
      { title: 'Introduction saisine Conseil de Prud\'hommes', order: 1, isOptional: false },
      { title: 'Exposé heures supplémentaires impayées', order: 2, isOptional: false },
      { title: 'Article 1353 CC - Charge de la preuve', order: 3, isOptional: false },
      { title: 'Dispositif indemnités prud\'homales', order: 4, isOptional: false },
      { title: 'Bordereau de pièces', order: 5, isOptional: true },
      { title: 'Signature avocat standard', order: 6, isOptional: false },
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
    name: 'Saisine CPH licenciement pour faute grave',
    documentType: BuilderDocumentType.REQUETE,
    juridiction: Juridiction.CONSEIL_PRUDHOMMES,
    blockTitles: [
      { title: 'Introduction saisine Conseil de Prud\'hommes', order: 1, isOptional: false },
      { title: 'Exposé licenciement pour faute grave', order: 2, isOptional: false },
      { title: 'Article L1235-3 CT - Indemnité licenciement sans cause', order: 3, isOptional: false },
      { title: 'Dispositif indemnités prud\'homales', order: 4, isOptional: false },
      { title: 'Bordereau de pièces', order: 5, isOptional: true },
      { title: 'Signature avocat standard', order: 6, isOptional: false },
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
    name: 'Saisine CPH discrimination au travail',
    documentType: BuilderDocumentType.REQUETE,
    juridiction: Juridiction.CONSEIL_PRUDHOMMES,
    blockTitles: [
      { title: 'Introduction saisine Conseil de Prud\'hommes', order: 1, isOptional: false },
      { title: 'Exposé discrimination', order: 2, isOptional: false },
      { title: 'Article 1353 CC - Charge de la preuve', order: 3, isOptional: false },
      { title: 'Dispositif indemnités prud\'homales', order: 4, isOptional: false },
      { title: 'Bordereau de pièces', order: 5, isOptional: true },
      { title: 'Signature avocat standard', order: 6, isOptional: false },
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
  // IMMOBILIER / BAUX (5)
  // ============================================
  {
    name: 'Assignation loyers impayés détaillée',
    documentType: BuilderDocumentType.ASSIGNATION_FOND,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blockTitles: [
      { title: 'Introduction assignation Tribunal Judiciaire', order: 1, isOptional: false },
      { title: 'Exposé loyers impayés détaillé', order: 2, isOptional: false },
      { title: 'Article 1728 CC - Obligations du locataire', order: 3, isOptional: false },
      { title: 'Clause résolutoire bail (art. 24 loi 1989)', order: 4, isOptional: false },
      { title: 'Dispositif expulsion locataire', order: 5, isOptional: false },
      { title: 'Bordereau de pièces', order: 6, isOptional: true },
      { title: 'Signature avocat standard', order: 7, isOptional: false },
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
    name: 'Assignation dégradations locatives',
    documentType: BuilderDocumentType.ASSIGNATION_FOND,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blockTitles: [
      { title: 'Introduction assignation Tribunal Judiciaire', order: 1, isOptional: false },
      { title: 'Exposé dégradations locatives', order: 2, isOptional: false },
      { title: 'Article 1728 CC - Obligations du locataire', order: 3, isOptional: false },
      { title: 'Article 1231-1 CC - Dommages-intérêts contractuels', order: 4, isOptional: false },
      { title: 'Condamnation au paiement de somme', order: 5, isOptional: false },
      { title: 'Bordereau de pièces', order: 6, isOptional: true },
      { title: 'Signature avocat standard', order: 7, isOptional: false },
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
    name: 'Assignation troubles de jouissance locataire',
    documentType: BuilderDocumentType.ASSIGNATION_FOND,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blockTitles: [
      { title: 'Introduction assignation Tribunal Judiciaire', order: 1, isOptional: false },
      { title: 'Exposé trouble de jouissance', order: 2, isOptional: false },
      { title: 'Article 1719 CC - Obligations du bailleur', order: 3, isOptional: false },
      { title: 'Article 1231-1 CC - Dommages-intérêts contractuels', order: 4, isOptional: false },
      { title: 'Condamnation au paiement de somme', order: 5, isOptional: false },
      { title: 'Bordereau de pièces', order: 6, isOptional: true },
      { title: 'Signature avocat standard', order: 7, isOptional: false },
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
    name: 'Assignation copropriété charges impayées',
    documentType: BuilderDocumentType.ASSIGNATION_FOND,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blockTitles: [
      { title: 'Introduction assignation Tribunal Judiciaire', order: 1, isOptional: false },
      { title: 'Exposé copropriété - charges impayées', order: 2, isOptional: false },
      { title: 'Article 1104 CC - Bonne foi contractuelle', order: 3, isOptional: true },
      { title: 'Condamnation au paiement de somme', order: 4, isOptional: false },
      { title: 'Bordereau de pièces', order: 5, isOptional: true },
      { title: 'Signature avocat standard', order: 6, isOptional: false },
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
    name: 'Mise en demeure bailleur troubles jouissance',
    documentType: BuilderDocumentType.MISE_EN_DEMEURE,
    juridiction: null,
    blockTitles: [
      { title: 'En-tête mise en demeure', order: 1, isOptional: false },
      { title: 'Exposé trouble de jouissance', order: 2, isOptional: false },
      { title: 'Article 1719 CC - Obligations du bailleur', order: 3, isOptional: false },
      { title: 'Signature avocat standard', order: 4, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: false, lrar: true, autoStore: true },
    legalMentions: {
      afficherBarreau: true,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },

  // ============================================
  // DROIT COMMERCIAL (5)
  // ============================================
  {
    name: 'Assignation rupture brutale relation commerciale',
    documentType: BuilderDocumentType.ASSIGNATION_FOND,
    juridiction: Juridiction.TRIBUNAL_COMMERCE,
    blockTitles: [
      { title: 'Introduction assignation Tribunal Judiciaire', order: 1, isOptional: false },
      { title: 'Exposé rupture brutale relation commerciale', order: 2, isOptional: false },
      { title: 'Article L442-1 C. com - Rupture brutale', order: 3, isOptional: false },
      { title: 'Article 1231-1 CC - Dommages-intérêts contractuels', order: 4, isOptional: false },
      { title: 'Condamnation au paiement de somme', order: 5, isOptional: false },
      { title: 'Bordereau de pièces', order: 6, isOptional: true },
      { title: 'Signature société représentant légal', order: 7, isOptional: false },
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
    name: 'Assignation concurrence déloyale',
    documentType: BuilderDocumentType.ASSIGNATION_FOND,
    juridiction: Juridiction.TRIBUNAL_COMMERCE,
    blockTitles: [
      { title: 'Introduction assignation Tribunal Judiciaire', order: 1, isOptional: false },
      { title: 'Exposé concurrence déloyale', order: 2, isOptional: false },
      { title: 'Article 1240 CC - Responsabilité délictuelle', order: 3, isOptional: false },
      { title: 'Condamnation au paiement de somme', order: 4, isOptional: false },
      { title: 'Bordereau de pièces', order: 5, isOptional: true },
      { title: 'Signature société représentant légal', order: 6, isOptional: false },
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
    name: 'Assignation non-conformité marchandises',
    documentType: BuilderDocumentType.ASSIGNATION_FOND,
    juridiction: Juridiction.TRIBUNAL_COMMERCE,
    blockTitles: [
      { title: 'Introduction assignation Tribunal Judiciaire', order: 1, isOptional: false },
      { title: 'Exposé non-conformité marchandises', order: 2, isOptional: false },
      { title: 'Article 1104 CC - Bonne foi contractuelle', order: 3, isOptional: true },
      { title: 'Dispositif résolution contrat + restitutions', order: 4, isOptional: false },
      { title: 'Bordereau de pièces', order: 5, isOptional: true },
      { title: 'Signature société représentant légal', order: 6, isOptional: false },
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
    name: 'Mise en demeure défaut de livraison',
    documentType: BuilderDocumentType.MISE_EN_DEMEURE,
    juridiction: null,
    blockTitles: [
      { title: 'En-tête mise en demeure', order: 1, isOptional: false },
      { title: 'Exposé défaut de livraison', order: 2, isOptional: false },
      { title: 'Article 1104 CC - Bonne foi contractuelle', order: 3, isOptional: true },
      { title: 'Signature société représentant légal', order: 4, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: false, lrar: true, autoStore: true },
    legalMentions: {
      afficherBarreau: true,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: 'Assignation conflit associés',
    documentType: BuilderDocumentType.ASSIGNATION_FOND,
    juridiction: Juridiction.TRIBUNAL_COMMERCE,
    blockTitles: [
      { title: 'Introduction assignation Tribunal Judiciaire', order: 1, isOptional: false },
      { title: 'Exposé conflit entre associés', order: 2, isOptional: false },
      { title: 'Article 1104 CC - Bonne foi contractuelle', order: 3, isOptional: false },
      { title: 'Condamnation au paiement de somme', order: 4, isOptional: false },
      { title: 'Bordereau de pièces', order: 5, isOptional: true },
      { title: 'Signature avocat standard', order: 6, isOptional: false },
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
 * Seeds 25 extended system templates
 * @param cabinetId - Cabinet ID
 * @param userId - User ID for createdBy
 * @returns Number of templates created
 */
export async function seedExtendedTemplates(cabinetId: string, userId: string): Promise<number> {
  console.log('Seeding extended templates...');

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

  for (const template of extendedTemplates) {
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
    if (!allBlocksFound) {
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

  console.log(`\nExtended templates seeding completed: ${createdCount} templates created`);
  return createdCount;
}

// Run if called directly
if (require.main === module) {
  const cabinetId = process.argv[2];
  const userId = process.argv[3];

  if (!cabinetId || !userId) {
    console.error('Usage: npx tsx prisma/seeds/extended-templates.seed.ts <cabinetId> <userId>');
    process.exit(1);
  }

  seedExtendedTemplates(cabinetId, userId)
    .catch((e) => {
      console.error('Error during seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
