// ============================================
// DOCUMENT BUILDER TYPES
// ============================================

// Block Category
export type BlockCategory = 'INTRO' | 'FAITS' | 'MOYENS' | 'DISPOSITIF' | 'SIGNATURE' | 'CLAUSE' | 'MENTION_LEGALE' | 'CUSTOM' | 'NOTE_LIBRE';

// Document Types
export type BuilderDocumentType =
  | 'ASSIGNATION_FOND'
  | 'ASSIGNATION_REFERE'
  | 'REQUETE'
  | 'CITATION_DIRECTE'
  | 'DECLARATION_APPEL'
  | 'POURVOI_CASSATION'
  | 'CONCLUSIONS_DEFENSE'
  | 'CONCLUSIONS_RECAPITULATIVES'
  | 'MEMOIRE'
  | 'OBSERVATIONS_ECRITES'
  | 'NOTE_DELIBERE'
  | 'MISE_EN_DEMEURE'
  | 'SOMMATION'
  | 'LETTRE_RECLAMATION'
  | 'CONVOCATION_AUDIENCE'
  | 'ALERTE_AUDIENCE'
  | 'CONVOCATION_RDV'
  | 'DEMANDE_PIECES'
  | 'COMPTE_RENDU_AUDIENCE'
  | 'NOTIFICATION_DECISION'
  | 'STATUTS_SOCIETE'
  | 'PACTE_ASSOCIES'
  | 'CESSION_PARTS'
  | 'PROTOCOLE_TRANSACTION'
  | 'CONTRAT_PRESTATION'
  | 'CONTRAT_TRAVAIL'
  | 'RUPTURE_CONVENTIONNELLE'
  | 'TRANSACTION_PRUDHOMALE'
  | 'CONVENTION_DIVORCE'
  | 'PROCURATION'
  | 'ATTESTATION_HONNEUR'
  | 'CERTIFICAT_NON_APPEL'
  | 'CUSTOM';

// Juridiction
export type Juridiction =
  | 'TRIBUNAL_JUDICIAIRE'
  | 'TRIBUNAL_COMMERCE'
  | 'COUR_APPEL'
  | 'CONSEIL_PRUDHOMMES'
  | 'TRIBUNAL_ADMINISTRATIF'
  | 'COUR_ADMINISTRATIVE_APPEL'
  | 'CONSEIL_ETAT'
  | 'COUR_CASSATION'
  | 'JUGE_EXECUTION'
  | 'JUGE_CONTENTIEUX_PROTECTION'
  | 'JUGE_AFFAIRES_FAMILIALES'
  | 'TRIBUNAL_PARITAIRE_BAUX_RURAUX';

// Variable Type
export type VariableType = 'string' | 'number' | 'date' | 'boolean' | 'text' | 'array';

// Output Format
export type OutputFormat = 'DOCX' | 'PDF';

// Generated Document Status
export type GeneratedDocumentStatus = 'DRAFT' | 'FINALIZED' | 'SENT' | 'SIGNED';

// ============================================
// DOCUMENT BLOCK
// ============================================

export interface BlockVariable {
  name: string;
  type: VariableType;
  required: boolean;
  description?: string;
}

export interface DocumentBlock {
  id: string;
  cabinetId: string;
  category: BlockCategory;
  title: string;
  description?: string;
  content: string;
  variables: BlockVariable[];
  tags: string[];
  isMandatory: boolean;
  isSystemBlock: boolean;
  displayOrder: number;
  usageCount: number;
  createdById: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DocumentBlockFilters {
  category?: BlockCategory;
  tags?: string[];
  search?: string;
  isSystemBlock?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'category' | 'createdAt' | 'usageCount' | 'displayOrder';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateDocumentBlockInput {
  title: string;
  description?: string;
  category: BlockCategory;
  content: string;
  variables?: BlockVariable[];
  tags?: string[];
  isMandatory?: boolean;
  displayOrder?: number;
}

export interface UpdateDocumentBlockInput {
  title?: string;
  category?: BlockCategory;
  content?: string;
  variables?: BlockVariable[];
  tags?: string[];
  isMandatory?: boolean;
  displayOrder?: number;
}

export interface ExtractVariablesResult {
  variables: BlockVariable[];
  validation: {
    valid: boolean;
    errors: string[];
  };
}

export interface CategoryCount {
  category: BlockCategory;
  count: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

// ============================================
// BUILDER TEMPLATE
// ============================================

export interface BlockReference {
  blockId: string;
  order: number;
  isOptional?: boolean;
}

export interface ExpandedBlockReference extends BlockReference {
  block: {
    id: string;
    title: string;
    category: BlockCategory;
    content: string;
    variables: BlockVariable[];
    isMandatory: boolean;
  } | null;
}

export interface WorkflowConfig {
  signature?: {
    enabled: boolean;
    profile?: 'DEFAULT' | 'CERTIFIED' | 'ADVANCED';
  };
  lrar?: {
    enabled: boolean;
  };
  autoStore?: {
    enabled: boolean;
    folderPath?: string;
  };
}

export interface LegalMentions {
  header?: string;
  footer?: string;
  confidentiality?: boolean;
  customMentions?: string[];
}

export interface BuilderTemplate {
  id: string;
  cabinetId: string;
  name: string;
  description?: string;
  documentType: BuilderDocumentType;
  juridiction?: Juridiction;
  blocksStructure: BlockReference[];
  blocks?: BlockReference[];
  requiredVariables: BlockVariable[];
  outputFormat: OutputFormat;
  workflowConfig: WorkflowConfig;
  legalMentions: LegalMentions;
  isSystemTemplate: boolean;
  usageCount: number;
  createdById: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
  expandedBlocks?: ExpandedBlockReference[];
}

export interface BuilderTemplateFilters {
  documentType?: BuilderDocumentType;
  juridiction?: Juridiction;
  isSystemTemplate?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'documentType' | 'createdAt' | 'usageCount';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateBuilderTemplateInput {
  name: string;
  description?: string;
  documentType: BuilderDocumentType;
  juridiction?: Juridiction;
  blocksStructure?: BlockReference[];
  blocks?: BlockReference[];
  requiredVariables?: BlockVariable[];
  outputFormat?: OutputFormat;
  workflowConfig?: WorkflowConfig;
  legalMentions?: LegalMentions;
}

export interface UpdateBuilderTemplateInput {
  name?: string;
  description?: string;
  documentType?: BuilderDocumentType;
  juridiction?: Juridiction | null;
  blocksStructure?: BlockReference[];
  blocks?: BlockReference[];
  requiredVariables?: BlockVariable[];
  outputFormat?: OutputFormat;
  workflowConfig?: WorkflowConfig;
  legalMentions?: LegalMentions;
}

// Alias for template block reference (used in template editor)
export interface TemplateBlockReference extends BlockReference {
  id?: string;
}

export interface DocumentTypeCount {
  documentType: BuilderDocumentType;
  count: number;
}

export interface JuridictionCount {
  juridiction: Juridiction;
  count: number;
}

export interface PreviewResult {
  preview: string;
  missingVariables: string[];
  template: {
    id: string;
    name: string;
    documentType: BuilderDocumentType;
  };
}

// ============================================
// GENERATED DOCUMENT
// ============================================

export interface GeneratedDocument {
  id: string;
  cabinetId: string;
  templateId?: string;
  folderId: string;
  affaireId?: string;
  clientId?: string;
  title: string;
  filledVariables: Record<string, any>;
  generatedContent?: string;
  outputFilePath?: string;
  status: GeneratedDocumentStatus;
  workflowStatus: Record<string, any>;
  sentAt?: string;
  signedAt?: string;
  createdById: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  template?: {
    id: string;
    name: string;
    documentType: BuilderDocumentType;
  };
  folder?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedDocumentFilters {
  folderId?: string;
  affaireId?: string;
  templateId?: string;
  status?: GeneratedDocumentStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateGeneratedDocumentInput {
  templateId?: string;
  folderId: string;
  title: string;
  affaireId?: string;
  clientId?: string;
  filledVariables?: Record<string, any>;
  outputFormat?: OutputFormat;
  freeNoteIds?: string[];
}

export interface UpdateGeneratedDocumentInput {
  title?: string;
  folderId?: string;
  filledVariables?: Record<string, any>;
  status?: GeneratedDocumentStatus;
}

export interface FinalizeDocumentInput {
  outputFormat?: OutputFormat;
}

export interface GeneratedDocumentPreview {
  content: string;
  html?: string;
  status: GeneratedDocumentStatus;
  missingVariables: string[];
}

export interface GeneratedDocumentStats {
  byStatus: Array<{
    status: GeneratedDocumentStatus;
    count: number;
  }>;
  topTemplates: Array<{
    templateId: string;
    templateName: string;
    count: number;
  }>;
  recentWeekCount: number;
}

// ============================================
// LABELS AND DISPLAY HELPERS
// ============================================

export const BLOCK_CATEGORY_LABELS: Record<BlockCategory, string> = {
  INTRO: 'Introduction',
  FAITS: 'Faits',
  MOYENS: 'Moyens',
  DISPOSITIF: 'Dispositif',
  SIGNATURE: 'Signature',
  CLAUSE: 'Clause',
  MENTION_LEGALE: 'Mention legale',
  CUSTOM: 'Personnalise',
  NOTE_LIBRE: 'Note libre',
};

export const DOCUMENT_TYPE_LABELS: Record<BuilderDocumentType, string> = {
  ASSIGNATION_FOND: 'Assignation au fond',
  ASSIGNATION_REFERE: 'Assignation en refere',
  REQUETE: 'Requete',
  CITATION_DIRECTE: 'Citation directe',
  DECLARATION_APPEL: 'Declaration d\'appel',
  POURVOI_CASSATION: 'Pourvoi en cassation',
  CONCLUSIONS_DEFENSE: 'Conclusions en defense',
  CONCLUSIONS_RECAPITULATIVES: 'Conclusions recapitulatives',
  MEMOIRE: 'Memoire',
  OBSERVATIONS_ECRITES: 'Observations ecrites',
  NOTE_DELIBERE: 'Note en delibere',
  MISE_EN_DEMEURE: 'Mise en demeure',
  SOMMATION: 'Sommation',
  LETTRE_RECLAMATION: 'Lettre de reclamation',
  CONVOCATION_AUDIENCE: 'Convocation audience',
  ALERTE_AUDIENCE: 'Alerte audience',
  CONVOCATION_RDV: 'Convocation RDV',
  DEMANDE_PIECES: 'Demande de pieces',
  COMPTE_RENDU_AUDIENCE: 'Compte-rendu d\'audience',
  NOTIFICATION_DECISION: 'Notification de decision',
  STATUTS_SOCIETE: 'Statuts de societe',
  PACTE_ASSOCIES: 'Pacte d\'associes',
  CESSION_PARTS: 'Cession de parts',
  PROTOCOLE_TRANSACTION: 'Protocole transactionnel',
  CONTRAT_PRESTATION: 'Contrat de prestation',
  CONTRAT_TRAVAIL: 'Contrat de travail',
  RUPTURE_CONVENTIONNELLE: 'Rupture conventionnelle',
  TRANSACTION_PRUDHOMALE: 'Transaction prud\'homale',
  CONVENTION_DIVORCE: 'Convention de divorce',
  PROCURATION: 'Procuration',
  ATTESTATION_HONNEUR: 'Attestation sur l\'honneur',
  CERTIFICAT_NON_APPEL: 'Certificat de non-appel',
  CUSTOM: 'Personnalise',
};

export const JURIDICTION_LABELS: Record<Juridiction, string> = {
  TRIBUNAL_JUDICIAIRE: 'Tribunal judiciaire',
  TRIBUNAL_COMMERCE: 'Tribunal de commerce',
  COUR_APPEL: 'Cour d\'appel',
  CONSEIL_PRUDHOMMES: 'Conseil de prud\'hommes',
  TRIBUNAL_ADMINISTRATIF: 'Tribunal administratif',
  COUR_ADMINISTRATIVE_APPEL: 'Cour administrative d\'appel',
  CONSEIL_ETAT: 'Conseil d\'Etat',
  COUR_CASSATION: 'Cour de cassation',
  JUGE_EXECUTION: 'Juge de l\'execution',
  JUGE_CONTENTIEUX_PROTECTION: 'Juge du contentieux de la protection',
  JUGE_AFFAIRES_FAMILIALES: 'Juge aux affaires familiales',
  TRIBUNAL_PARITAIRE_BAUX_RURAUX: 'Tribunal paritaire des baux ruraux',
};

export const GENERATED_STATUS_LABELS: Record<GeneratedDocumentStatus, string> = {
  DRAFT: 'Brouillon',
  FINALIZED: 'Finalise',
  SENT: 'Envoye',
  SIGNED: 'Signe',
};

export const VARIABLE_TYPE_LABELS: Record<VariableType, string> = {
  string: 'Texte court',
  number: 'Nombre',
  date: 'Date',
  boolean: 'Oui/Non',
  text: 'Texte long',
  array: 'Liste',
};
