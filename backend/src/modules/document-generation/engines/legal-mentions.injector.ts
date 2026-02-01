import { prisma } from '@/config/database';
import { minioClient } from '@/config/minio';
import { config } from '@/config';
import { Civilite } from '@prisma/client';

// Position where legal mentions should be injected
export type MentionsPosition = 'HEADER' | 'FOOTER' | 'SIGNATURE' | 'NONE';

// Legal mentions configuration from template
export interface LegalMentionsTemplate {
  header?: string;
  footer?: string;
  confidentiality?: boolean;
  customMentions?: string[];
  positionMentions?: MentionsPosition;
}

// Avocat context for variable replacement
export interface AvocatContext {
  civilite: string;
  nom: string;
  prenom: string;
  barreau: string;
  numeroToque?: string | null;
  adresseCabinet: string;
  codePostal: string;
  ville: string;
  telephone: string;
  fax?: string | null;
  email: string;
  siteWeb?: string | null;
}

// Cabinet context
export interface CabinetContext {
  nom: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
}

// Complete legal mentions context
export interface LegalMentionsContext {
  avocat: AvocatContext;
  cabinet: CabinetContext;
  signatureImage?: Buffer;
  cachetImage?: Buffer;
}

// Default templates for legal mentions
const DEFAULT_HEADER_TEMPLATE = `
<p style="font-size: 10pt; color: #666;">
  <strong>{{avocat.civilite}} {{avocat.prenom}} {{avocat.nom}}</strong><br>
  Avocat au {{avocat.barreau}}{{#if avocat.numeroToque}} - Toque n° {{avocat.numeroToque}}{{/if}}<br>
  {{avocat.adresseCabinet}}, {{avocat.codePostal}} {{avocat.ville}}<br>
  Tél: {{avocat.telephone}}{{#if avocat.fax}} - Fax: {{avocat.fax}}{{/if}}
</p>
`;

const DEFAULT_FOOTER_TEMPLATE = `
<p style="font-size: 9pt; color: #888; text-align: center;">
  {{avocat.civilite}} {{avocat.prenom}} {{avocat.nom}} - Avocat au {{avocat.barreau}}<br>
  {{avocat.adresseCabinet}}, {{avocat.codePostal}} {{avocat.ville}}<br>
  Tél: {{avocat.telephone}} - Email: {{avocat.email}}{{#if avocat.siteWeb}} - {{avocat.siteWeb}}{{/if}}
</p>
`;

const DEFAULT_SIGNATURE_TEMPLATE = `
<p style="text-align: right; margin-top: 50px;">
  Fait à {{avocat.ville}}, le {{date_jour_long}}<br><br>
  {{avocat.civilite}} {{avocat.prenom}} {{avocat.nom}}<br>
  Avocat au {{avocat.barreau}}
</p>
`;

const CONFIDENTIALITY_MENTION = `
<p style="font-size: 8pt; color: #999; font-style: italic;">
  Ce document est confidentiel et destiné uniquement à son destinataire.
  Toute divulgation, reproduction ou utilisation non autorisée est strictement interdite.
</p>
`;

/**
 * Format civilite enum to display string
 */
function formatCivilite(civilite: Civilite): string {
  const mapping: Record<Civilite, string> = {
    MAITRE: 'Maître',
    MONSIEUR: 'Monsieur',
    MADAME: 'Madame',
  };
  return mapping[civilite] || civilite;
}

/**
 * Load avocat legal info and prepare context
 */
export async function loadAvocatContext(userId: string): Promise<LegalMentionsContext | null> {
  const legalInfo = await prisma.avocatLegalInfo.findUnique({
    where: { userId },
    include: {
      cabinet: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!legalInfo) {
    return null;
  }

  // Load signature and cachet images if they exist
  let signatureImage: Buffer | undefined;
  let cachetImage: Buffer | undefined;

  if (legalInfo.signatureImage) {
    try {
      const stream = await minioClient.getObject(
        config.minio.buckets.documents,
        legalInfo.signatureImage
      );
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk as Buffer);
      }
      signatureImage = Buffer.concat(chunks);
    } catch {
      // Skip if image not found
    }
  }

  if (legalInfo.cachetCabinet) {
    try {
      const stream = await minioClient.getObject(
        config.minio.buckets.documents,
        legalInfo.cachetCabinet
      );
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk as Buffer);
      }
      cachetImage = Buffer.concat(chunks);
    } catch {
      // Skip if image not found
    }
  }

  return {
    avocat: {
      civilite: formatCivilite(legalInfo.civilite),
      nom: legalInfo.nom,
      prenom: legalInfo.prenom,
      barreau: legalInfo.barreau,
      numeroToque: legalInfo.numeroToque,
      adresseCabinet: legalInfo.adresseCabinet,
      codePostal: legalInfo.codePostal,
      ville: legalInfo.ville,
      telephone: legalInfo.telephone,
      fax: legalInfo.fax,
      email: legalInfo.email,
      siteWeb: legalInfo.siteWeb,
    },
    cabinet: {
      nom: legalInfo.cabinet.name,
      email: legalInfo.cabinet.email,
    },
    signatureImage,
    cachetImage,
  };
}

/**
 * Build legal mentions config for document generation
 */
export function buildLegalMentionsConfig(
  templateConfig: LegalMentionsTemplate | null,
  context: LegalMentionsContext | null,
  position: MentionsPosition = 'FOOTER'
): {
  header?: string;
  footer?: string;
  signature?: string;
  signatureImage?: Buffer;
  cachetImage?: Buffer;
} | undefined {
  if (!context) {
    return undefined;
  }

  const result: {
    header?: string;
    footer?: string;
    signature?: string;
    signatureImage?: Buffer;
    cachetImage?: Buffer;
  } = {};

  // Determine what to include based on position
  const effectivePosition = templateConfig?.positionMentions || position;

  // Build header
  if (effectivePosition === 'HEADER' || templateConfig?.header) {
    result.header = templateConfig?.header || DEFAULT_HEADER_TEMPLATE;
  }

  // Build footer
  if (effectivePosition === 'FOOTER' || templateConfig?.footer) {
    let footerContent = templateConfig?.footer || DEFAULT_FOOTER_TEMPLATE;

    // Add confidentiality mention if enabled
    if (templateConfig?.confidentiality) {
      footerContent = CONFIDENTIALITY_MENTION + footerContent;
    }

    // Add custom mentions
    if (templateConfig?.customMentions && templateConfig.customMentions.length > 0) {
      footerContent += '\n' + templateConfig.customMentions.join('\n');
    }

    result.footer = footerContent;
  }

  // Always include signature template for document signing
  if (effectivePosition === 'SIGNATURE' || effectivePosition !== 'NONE') {
    result.signature = DEFAULT_SIGNATURE_TEMPLATE;
  }

  // Include images
  result.signatureImage = context.signatureImage;
  result.cachetImage = context.cachetImage;

  return result;
}

/**
 * Merge legal mentions context with other variables
 */
export function mergeContextWithVariables(
  variables: Record<string, unknown>,
  context: LegalMentionsContext | null
): Record<string, unknown> {
  if (!context) {
    return variables;
  }

  return {
    ...variables,
    avocat: context.avocat,
    cabinet: context.cabinet,
    // Add some convenience shortcuts
    'avocat.nom': context.avocat.nom,
    'avocat.prenom': context.avocat.prenom,
    'avocat.barreau': context.avocat.barreau,
    'avocat.telephone': context.avocat.telephone,
    'avocat.email': context.avocat.email,
    'avocat.adresse': `${context.avocat.adresseCabinet}, ${context.avocat.codePostal} ${context.avocat.ville}`,
    'cabinet.nom': context.cabinet.nom,
  };
}

/**
 * Get default legal mentions templates
 */
export function getDefaultTemplates(): {
  header: string;
  footer: string;
  signature: string;
} {
  return {
    header: DEFAULT_HEADER_TEMPLATE,
    footer: DEFAULT_FOOTER_TEMPLATE,
    signature: DEFAULT_SIGNATURE_TEMPLATE,
  };
}

/**
 * Load client context if clientId is provided
 */
export async function loadClientContext(clientId: string): Promise<Record<string, unknown> | null> {
  // Note: This assumes a Client model exists. Adapt based on actual schema.
  // For now, return null if client table doesn't exist
  try {
    // @ts-ignore - Client model may not exist yet
    const client = await prisma.client?.findUnique({
      where: { id: clientId },
    });

    if (!client) return null;

    return {
      client: {
        nom: client.nom || '',
        prenom: client.prenom || '',
        adresse: client.adresse || '',
        codePostal: client.codePostal || '',
        ville: client.ville || '',
        email: client.email || '',
        telephone: client.telephone || '',
        siret: client.siret || '',
      },
    };
  } catch {
    // Client model doesn't exist yet
    return null;
  }
}

/**
 * Load affaire context if affaireId is provided
 */
export async function loadAffaireContext(affaireId: string): Promise<Record<string, unknown> | null> {
  // Note: This assumes an Affaire model exists. Adapt based on actual schema.
  try {
    // @ts-ignore - Affaire model may not exist yet
    const affaire = await prisma.affaire?.findUnique({
      where: { id: affaireId },
    });

    if (!affaire) return null;

    return {
      affaire: {
        intitule: affaire.intitule || '',
        numeroRg: affaire.numeroRg || '',
        juridiction: affaire.juridiction || '',
        type: affaire.type || '',
      },
    };
  } catch {
    // Affaire model doesn't exist yet
    return null;
  }
}
