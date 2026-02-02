import nodemailer, { Transporter } from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  context?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }>;
}

class EmailService {
  private transporter: Transporter | null = null;
  private templateCache: Map<string, Handlebars.TemplateDelegate> = new Map();

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      logger.warn('SMTP configuration incomplete. Email service will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: parseInt(SMTP_PORT, 10) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        logger.error('SMTP connection error:', error);
      } else {
        logger.info('SMTP server ready');
      }
    });
  }

  private async loadTemplate(templateName: string): Promise<Handlebars.TemplateDelegate> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);

    try {
      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      const template = Handlebars.compile(templateSource);
      this.templateCache.set(templateName, template);
      return template;
    } catch (error) {
      logger.error(`Failed to load email template: ${templateName}`, error);
      throw new Error(`Email template not found: ${templateName}`);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      logger.warn('Email service not configured. Email not sent.');
      return false;
    }

    try {
      let html = options.html;

      // If template is provided, render it
      if (options.template && options.context) {
        const template = await this.loadTemplate(options.template);
        html = template(options.context);
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'LexDoc <noreply@lexdoc.fr>',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html,
        text: options.text,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId} to ${mailOptions.to}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  // Convenience methods for common emails
  async sendClientInvitation(
    to: string,
    data: {
      clientName: string;
      cabinetName: string;
      activationUrl: string;
      expiresIn: string;
    }
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Invitation à accéder à votre espace client - ${data.cabinetName}`,
      template: 'client-invitation',
      context: data,
    });
  }

  async sendSignatureReminder(
    to: string,
    data: {
      recipientName: string;
      documentTitle: string;
      cabinetName: string;
      signUrl: string;
      reminderNumber: number;
      expiresAt: string;
    }
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Rappel: Document en attente de signature - ${data.documentTitle}`,
      template: 'signature-reminder',
      context: data,
    });
  }

  async sendPasswordReset(
    to: string,
    data: {
      name: string;
      resetUrl: string;
      expiresIn: string;
    }
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Réinitialisation de votre mot de passe - LexDoc',
      template: 'password-reset',
      context: data,
    });
  }

  async sendNewDocumentNotification(
    to: string,
    data: {
      clientName: string;
      documentTitle: string;
      cabinetName: string;
      documentUrl: string;
    }
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Nouveau document disponible - ${data.cabinetName}`,
      template: 'new-document',
      context: data,
    });
  }
}

export const emailService = new EmailService();
export default emailService;
