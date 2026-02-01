import sgMail from '@sendgrid/mail';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// Initialize SendGrid
if (config.email.sendgridApiKey) {
  sgMail.setApiKey(config.email.sendgridApiKey);
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailParams {
  to: string;
  subject?: string;
  template: string;
  data: Record<string, any>;
}

// Email templates
const templates: Record<string, (data: Record<string, any>) => EmailTemplate> = {
  'signature-created': (data) => ({
    subject: 'Document à signer',
    html: `
      <h2>Bonjour,</h2>
      <p>Vous avez un document à signer : <strong>${data.documentName}</strong></p>
      <p>Cliquez sur le lien ci-dessous pour accéder à la signature :</p>
      <p><a href="${data.signUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Signer le document</a></p>
      <p>Ce lien expire le ${data.expiresAt}.</p>
      <p>Cordialement,<br>L'équipe LexDoc</p>
    `,
    text: `
Bonjour,

Vous avez un document à signer : ${data.documentName}

Cliquez sur le lien ci-dessous pour accéder à la signature :
${data.signUrl}

Ce lien expire le ${data.expiresAt}.

Cordialement,
L'équipe LexDoc
    `,
  }),

  'signature-completed': (data) => ({
    subject: 'Document signé disponible',
    html: `
      <h2>Signature complétée</h2>
      <p>Le document <strong>${data.documentName}</strong> a été signé par tous les signataires.</p>
      <p>Vous pouvez télécharger le document signé et les certificats depuis votre espace LexDoc :</p>
      <p><a href="${data.downloadUrl}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Voir le document signé</a></p>
      <p>Cordialement,<br>L'équipe LexDoc</p>
    `,
    text: `
Signature complétée

Le document "${data.documentName}" a été signé par tous les signataires.

Vous pouvez télécharger le document signé et les certificats depuis votre espace LexDoc :
${data.downloadUrl}

Cordialement,
L'équipe LexDoc
    `,
  }),

  'signature-failed': (data) => ({
    subject: `Signature ${data.reason}`,
    html: `
      <h2>Signature non aboutie</h2>
      <p>La signature du document <strong>${data.documentName}</strong> a été ${data.reason}.</p>
      <p>Vous pouvez créer une nouvelle demande de signature depuis votre espace LexDoc.</p>
      <p>Cordialement,<br>L'équipe LexDoc</p>
    `,
    text: `
Signature non aboutie

La signature du document "${data.documentName}" a été ${data.reason}.

Vous pouvez créer une nouvelle demande de signature depuis votre espace LexDoc.

Cordialement,
L'équipe LexDoc
    `,
  }),

  'signature-reminder': (data) => ({
    subject: 'Rappel : Document à signer',
    html: `
      <h2>Rappel de signature</h2>
      <p>Vous avez un document en attente de signature.</p>
      <p>Cliquez sur le lien ci-dessous pour accéder à la signature :</p>
      <p><a href="${data.signUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Signer le document</a></p>
      <p>Cordialement,<br>L'équipe LexDoc</p>
    `,
    text: `
Rappel de signature

Vous avez un document en attente de signature.

Cliquez sur le lien ci-dessous pour accéder à la signature :
${data.signUrl}

Cordialement,
L'équipe LexDoc
    `,
  }),

  'lrar-sent': (data) => ({
    subject: 'LRAR envoyé',
    html: `
      <h2>Courrier recommandé envoyé</h2>
      <p>Votre lettre recommandée <strong>${data.subject}</strong> a été envoyée.</p>
      <p><strong>Numéro de suivi :</strong> ${data.trackingNumber}</p>
      <p><strong>Destinataire :</strong> ${data.recipientName}</p>
      <p><strong>Date d'envoi estimée :</strong> ${data.estimatedDelivery}</p>
      <p>Vous pouvez suivre l'acheminement depuis votre espace LexDoc.</p>
      <p>Cordialement,<br>L'équipe LexDoc</p>
    `,
    text: `
Courrier recommandé envoyé

Votre lettre recommandée "${data.subject}" a été envoyée.

Numéro de suivi : ${data.trackingNumber}
Destinataire : ${data.recipientName}
Date d'envoi estimée : ${data.estimatedDelivery}

Vous pouvez suivre l'acheminement depuis votre espace LexDoc.

Cordialement,
L'équipe LexDoc
    `,
  }),

  'lrar-delivered': (data) => ({
    subject: 'LRAR distribué',
    html: `
      <h2>Courrier recommandé distribué</h2>
      <p>Votre lettre recommandée <strong>${data.subject}</strong> a été distribuée.</p>
      <p><strong>Destinataire :</strong> ${data.recipientName}</p>
      <p><strong>Date de distribution :</strong> ${data.deliveredAt}</p>
      <p>L'accusé de réception est disponible dans votre espace LexDoc :</p>
      <p><a href="${data.proofUrl}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Télécharger l'AR</a></p>
      <p>Cordialement,<br>L'équipe LexDoc</p>
    `,
    text: `
Courrier recommandé distribué

Votre lettre recommandée "${data.subject}" a été distribuée.

Destinataire : ${data.recipientName}
Date de distribution : ${data.deliveredAt}

L'accusé de réception est disponible dans votre espace LexDoc :
${data.proofUrl}

Cordialement,
L'équipe LexDoc
    `,
  }),

  'lrar-returned': (data) => ({
    subject: 'LRAR retourné',
    html: `
      <h2>Courrier recommandé retourné</h2>
      <p>Votre lettre recommandée <strong>${data.subject}</strong> a été retournée à l'expéditeur.</p>
      <p><strong>Destinataire :</strong> ${data.recipientName}</p>
      <p><strong>Raison :</strong> ${data.reason || 'Non réclamé'}</p>
      <p>Vous pouvez consulter les détails dans votre espace LexDoc.</p>
      <p>Cordialement,<br>L'équipe LexDoc</p>
    `,
    text: `
Courrier recommandé retourné

Votre lettre recommandée "${data.subject}" a été retournée à l'expéditeur.

Destinataire : ${data.recipientName}
Raison : ${data.reason || 'Non réclamé'}

Vous pouvez consulter les détails dans votre espace LexDoc.

Cordialement,
L'équipe LexDoc
    `,
  }),
};

/**
 * Send an email using a template
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const { to, template, data } = params;

  // Check if SendGrid is configured
  if (!config.email.sendgridApiKey) {
    logger.warn(`[Email] SendGrid not configured, skipping email to ${to}`);
    return false;
  }

  // Get template
  const templateFn = templates[template];
  if (!templateFn) {
    logger.error(`[Email] Unknown template: ${template}`);
    return false;
  }

  const emailContent = templateFn(data);

  try {
    await sgMail.send({
      to,
      from: config.email.from,
      subject: params.subject || emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    logger.info(`[Email] Sent ${template} email to ${to}`);
    return true;
  } catch (error: any) {
    logger.error(`[Email] Failed to send email:`, error);
    return false;
  }
}

/**
 * Send raw email (without template)
 */
export async function sendRawEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  if (!config.email.sendgridApiKey) {
    logger.warn(`[Email] SendGrid not configured, skipping email to ${params.to}`);
    return false;
  }

  try {
    await sgMail.send({
      to: params.to,
      from: config.email.from,
      subject: params.subject,
      html: params.html,
      text: params.text || params.html.replace(/<[^>]*>/g, ''),
    });

    logger.info(`[Email] Sent email to ${params.to}`);
    return true;
  } catch (error: any) {
    logger.error(`[Email] Failed to send email:`, error);
    return false;
  }
}

export default sendEmail;
