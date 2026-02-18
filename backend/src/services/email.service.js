const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: false,
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendEmail(to, subject, template, data) {
    const templatePath = path.join(__dirname, '../templates', `${template}.html`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const compiled = handlebars.compile(templateContent);
    const html = compiled(data);

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
  }

  async sendSignatureInvitation(signature, document) {
    await this.sendEmail(
      signature.signerEmail,
      'Document en attente de signature',
      'signature-invitation',
      {
        signerName: signature.signerName,
        documentName: document.name,
        signatureUrl: signature.signatureUrl,
        deadline: document.signatureDeadline,
      }
    );
  }

  async sendSignatureReminder(signature, document, reminderNumber, options = {}) {
    // Use progressive template based on reminder number
    const templateName = `signature-reminder-${Math.min(reminderNumber, 3)}`;

    // Subject becomes more urgent with each reminder
    const subjects = {
      1: `Rappel : Document "${document.name}" en attente de signature`,
      2: `2e rappel : Document "${document.name}" - Action requise`,
      3: `URGENT - Dernier rappel : Document "${document.name}"`,
    };
    const subject = subjects[Math.min(reminderNumber, 3)];

    await this.sendEmail(
      signature.signerEmail,
      subject,
      templateName,
      {
        signerName: signature.signerName,
        documentName: document.name,
        folderName: options.folderName || document.folder?.title,
        signatureUrl: signature.signatureUrl,
        reminderNumber,
        tenantName: options.tenantName || document.tenant?.name || 'Votre cabinet',
        unsubscribeUrl: options.unsubscribeUrl || '#',
      }
    );
  }

  /**
   * Send signature reminder with full context (for tracking-based reminders)
   */
  async sendTrackingReminder({ recipientEmail, recipientName, documentName, folderName, signatureUrl, reminderNumber, tenantName }) {
    const templateName = `signature-reminder-${Math.min(reminderNumber, 3)}`;

    const subjects = {
      1: `Rappel : Document "${documentName}" en attente de signature`,
      2: `2e rappel : Document "${documentName}" - Action requise`,
      3: `URGENT - Dernier rappel : Document "${documentName}"`,
    };
    const subject = subjects[Math.min(reminderNumber, 3)];

    await this.sendEmail(
      recipientEmail,
      subject,
      templateName,
      {
        signerName: recipientName,
        documentName,
        folderName,
        signatureUrl,
        reminderNumber,
        tenantName: tenantName || 'Votre cabinet',
        unsubscribeUrl: '#',
      }
    );
  }

  async sendClientInvitation({ to, clientName, folderTitle, tenantName, activationLink, expiresIn }) {
    // Use inline template if file doesn't exist
    const subject = `${tenantName} - Invitation à votre espace client`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0066ff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #0066ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${tenantName}</h1>
          </div>
          <div class="content">
            <p>Bonjour ${clientName},</p>
            <p>Vous êtes invité(e) à accéder à votre espace client pour consulter les documents relatifs à votre dossier :</p>
            <p><strong>${folderTitle}</strong></p>
            <p>Pour activer votre compte et définir votre mot de passe, cliquez sur le bouton ci-dessous :</p>
            <p style="text-align: center;">
              <a href="${activationLink}" class="button">Activer mon compte</a>
            </p>
            <p><small>Ce lien expire dans ${expiresIn}.</small></p>
            <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
            <p>Cordialement,<br>${tenantName}</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement via LexDoc.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@lexdoc.fr',
      to,
      subject,
      html,
    });
  }

  async sendDocumentRequestReminder({ to, clientName, requestTitle, folderTitle, dueDate, reminderCount, tenantName }) {
    const subjects = {
      1: `Rappel : Document demandé - "${requestTitle}"`,
      2: `2e rappel : Document demandé - "${requestTitle}"`,
      3: `URGENT - Dernier rappel : Document demandé - "${requestTitle}"`,
    };
    const subject = subjects[Math.min(reminderCount || 1, 3)] || subjects[1];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0066ff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .highlight { background: #fff3cd; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0; border-radius: 4px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${tenantName || 'Votre cabinet'}</h1>
          </div>
          <div class="content">
            <p>Bonjour ${clientName},</p>
            <p>Nous vous rappelons qu'un document vous a été demandé dans le cadre de votre dossier :</p>
            <div class="highlight">
              <strong>${requestTitle}</strong><br>
              Dossier : ${folderTitle}
              ${dueDate ? `<br>Date limite : ${dueDate}` : ''}
            </div>
            <p>Merci de nous transmettre ce document dans les meilleurs délais via votre espace client.</p>
            <p>Cordialement,<br>${tenantName || 'Votre cabinet'}</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement via LexDoc.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@lexdoc.fr',
      to,
      subject,
      html,
    });
  }

  async sendDocumentReady({ to, clientName, documentName, tenantName, portalLink }) {
    const subject = `${tenantName} - Nouveau document disponible`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0066ff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #0066ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${tenantName}</h1>
          </div>
          <div class="content">
            <p>Bonjour ${clientName},</p>
            <p>Un nouveau document est disponible dans votre espace client :</p>
            <p><strong>${documentName}</strong></p>
            <p style="text-align: center;">
              <a href="${portalLink}" class="button">Accéder à mon espace</a>
            </p>
            <p>Cordialement,<br>${tenantName}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@lexdoc.fr',
      to,
      subject,
      html,
    });
  }
}

module.exports = new EmailService();
