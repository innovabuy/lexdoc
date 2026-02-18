const PDFDocument = require('pdfkit');
const prisma = require('../config/database');

class PDFService {
  constructor() {
    this.colors = {
      primary: '#0066ff',
      secondary: '#6b7280',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      dark: '#1f2937',
      light: '#f3f4f6',
    };
  }

  /**
   * Generate a folder summary PDF
   */
  async generateFolderReport(folderId, tenantId) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, tenantId },
      include: {
        client: true,
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        persons: true,
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (!folder) {
      throw new Error('Dossier non trouve');
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { legalInfo: true },
    });

    return new Promise((resolve, reject) => {
      const chunks = [];
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      this.addHeader(doc, tenant, 'RAPPORT DE DOSSIER');

      // Folder info
      doc.moveDown();
      doc.fontSize(18).fillColor(this.colors.dark).text(folder.title);
      doc.fontSize(10).fillColor(this.colors.secondary).text(`Reference: ${folder.reference}`);
      doc.moveDown();

      // Status and type
      doc.fontSize(12).fillColor(this.colors.dark);
      this.addInfoRow(doc, 'Statut', this.translateStatus(folder.status));
      this.addInfoRow(doc, 'Type', this.translateType(folder.type));
      this.addInfoRow(doc, 'Date ouverture', this.formatDate(folder.openedAt));
      if (folder.closedAt) {
        this.addInfoRow(doc, 'Date fermeture', this.formatDate(folder.closedAt));
      }
      doc.moveDown();

      // Client info
      if (folder.client) {
        doc.fontSize(14).fillColor(this.colors.primary).text('Client');
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor(this.colors.dark);
        const clientName = folder.client.companyName ||
          `${folder.client.firstName} ${folder.client.lastName}`;
        this.addInfoRow(doc, 'Nom', clientName);
        if (folder.client.email) {
          this.addInfoRow(doc, 'Email', folder.client.email);
        }
        if (folder.client.phone) {
          this.addInfoRow(doc, 'Telephone', folder.client.phone);
        }
        doc.moveDown();
      }

      // Description
      if (folder.description) {
        doc.fontSize(14).fillColor(this.colors.primary).text('Description');
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor(this.colors.dark).text(folder.description);
        doc.moveDown();
      }

      // Documents
      if (folder.documents.length > 0) {
        doc.fontSize(14).fillColor(this.colors.primary).text(`Documents (${folder.documents.length})`);
        doc.moveDown(0.5);

        // Table header
        const tableTop = doc.y;
        doc.fontSize(10).fillColor(this.colors.secondary);
        doc.text('Nom', 50, tableTop);
        doc.text('Type', 250, tableTop);
        doc.text('Statut', 350, tableTop);
        doc.text('Date', 450, tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke(this.colors.light);

        let y = tableTop + 25;
        doc.fillColor(this.colors.dark);

        for (const document of folder.documents.slice(0, 20)) {
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
          doc.text(document.name.substring(0, 30), 50, y, { width: 190 });
          doc.text(this.translateDocType(document.type), 250, y);
          doc.text(this.translateDocStatus(document.status), 350, y);
          doc.text(this.formatDate(document.createdAt), 450, y);
          y += 20;
        }

        if (folder.documents.length > 20) {
          doc.fontSize(9).fillColor(this.colors.secondary)
            .text(`... et ${folder.documents.length - 20} autres documents`, 50, y + 10);
        }
      }

      // Footer
      this.addFooter(doc, tenant);

      doc.end();
    });
  }

  /**
   * Generate document list PDF for a folder or all documents
   */
  async generateDocumentListReport(tenantId, filters = {}) {
    const where = {
      tenantId,
      deletedAt: null,
    };

    if (filters.folderId) where.folderId = filters.folderId;
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        folder: { select: { title: true, reference: true } },
      },
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    return new Promise((resolve, reject) => {
      const chunks = [];
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      this.addHeader(doc, tenant, 'LISTE DES DOCUMENTS');

      doc.moveDown();
      doc.fontSize(12).fillColor(this.colors.secondary)
        .text(`Genere le ${this.formatDate(new Date())} - ${documents.length} document(s)`);
      doc.moveDown();

      // Table header
      const tableTop = doc.y;
      doc.fontSize(9).fillColor(this.colors.secondary);
      doc.text('Nom', 50, tableTop);
      doc.text('Dossier', 220, tableTop);
      doc.text('Type', 380, tableTop);
      doc.text('Statut', 480, tableTop);
      doc.text('Taille', 580, tableTop);
      doc.text('Date', 680, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(792 - 50, tableTop + 15).stroke(this.colors.light);

      let y = tableTop + 25;
      doc.fontSize(9).fillColor(this.colors.dark);

      for (const document of documents) {
        if (y > 500) {
          doc.addPage();
          y = 50;
        }

        doc.text(document.name.substring(0, 25), 50, y, { width: 160 });
        doc.text((document.folder?.title || '-').substring(0, 20), 220, y, { width: 150 });
        doc.text(this.translateDocType(document.type), 380, y);
        doc.text(this.translateDocStatus(document.status), 480, y);
        doc.text(this.formatFileSize(document.size), 580, y);
        doc.text(this.formatDate(document.createdAt), 680, y);
        y += 18;
      }

      // Footer
      this.addFooter(doc, tenant);

      doc.end();
    });
  }

  /**
   * Generate activity report
   */
  async generateActivityReport(tenantId, { startDate, endDate, entityType } = {}) {
    const where = { tenantId };

    if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }
    if (entityType) {
      where.entityType = entityType;
    }

    const activities = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    return new Promise((resolve, reject) => {
      const chunks = [];
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      this.addHeader(doc, tenant, "RAPPORT D'ACTIVITE");

      doc.moveDown();
      const period = startDate || endDate
        ? `Du ${startDate ? this.formatDate(startDate) : 'debut'} au ${endDate ? this.formatDate(endDate) : 'aujourd\'hui'}`
        : 'Toutes les activites';
      doc.fontSize(12).fillColor(this.colors.secondary).text(period);
      doc.fontSize(10).text(`${activities.length} activite(s)`);
      doc.moveDown();

      // Activities
      let currentDate = null;

      for (const activity of activities) {
        if (doc.y > 700) {
          doc.addPage();
        }

        const actDate = this.formatDate(activity.createdAt);
        if (actDate !== currentDate) {
          currentDate = actDate;
          doc.moveDown(0.5);
          doc.fontSize(12).fillColor(this.colors.primary).text(currentDate);
          doc.moveDown(0.3);
        }

        const userName = activity.user
          ? `${activity.user.firstName} ${activity.user.lastName}`
          : 'Systeme';

        doc.fontSize(10).fillColor(this.colors.dark);
        doc.text(`${this.formatTime(activity.createdAt)} - ${userName}`, { continued: true });
        doc.fillColor(this.colors.secondary).text(` - ${this.translateAction(activity.action)}`);

        if (activity.entityType) {
          doc.fontSize(9).fillColor(this.colors.secondary)
            .text(`   ${activity.entityType} ${activity.entityId || ''}`);
        }
      }

      // Footer
      this.addFooter(doc, tenant);

      doc.end();
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  addHeader(doc, tenant, title) {
    // Logo/Name
    doc.fontSize(20).fillColor(this.colors.primary).text(tenant?.name || 'LexDoc', 50, 50);
    doc.fontSize(10).fillColor(this.colors.secondary).text(title, 50, 75);

    // Line
    doc.moveTo(50, 95).lineTo(545, 95).stroke(this.colors.primary);
    doc.y = 110;
  }

  addFooter(doc, tenant) {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor(this.colors.secondary);
      doc.text(
        `${tenant?.name || 'LexDoc'} - Page ${i + 1}/${pageCount} - Genere le ${this.formatDate(new Date())}`,
        50,
        doc.page.height - 40,
        { align: 'center', width: doc.page.width - 100 }
      );
    }
  }

  addInfoRow(doc, label, value) {
    doc.fontSize(11).fillColor(this.colors.secondary).text(`${label}: `, { continued: true });
    doc.fillColor(this.colors.dark).text(value || '-');
  }

  formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatFileSize(bytes) {
    if (!bytes) return '-';
    const size = Number(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  translateStatus(status) {
    const map = {
      OPEN: 'Ouvert',
      IN_PROGRESS: 'En cours',
      PENDING: 'En attente',
      CLOSED: 'Ferme',
      ARCHIVED: 'Archive',
    };
    return map[status] || status;
  }

  translateType(type) {
    const map = {
      LITIGATION: 'Contentieux',
      CONTRACT: 'Contrat',
      BUSINESS: 'Affaires',
      FAMILY: 'Famille',
      REAL_ESTATE: 'Immobilier',
      LABOR: 'Travail',
      INTELLECTUAL: 'Propriete intellectuelle',
      ADMINISTRATIVE: 'Administratif',
      CRIMINAL: 'Penal',
      OTHER: 'Autre',
    };
    return map[type] || type;
  }

  translateDocType(type) {
    const map = {
      CONTRACT: 'Contrat',
      DEED: 'Acte',
      LETTER: 'Courrier',
      INVOICE: 'Facture',
      CERTIFICATE: 'Certificat',
      REPORT: 'Rapport',
      OTHER: 'Autre',
    };
    return map[type] || type;
  }

  translateDocStatus(status) {
    const map = {
      DRAFT: 'Brouillon',
      PENDING_SIGNATURE: 'Signature',
      SIGNED: 'Signe',
      SENT: 'Envoye',
      ARCHIVED: 'Archive',
    };
    return map[status] || status;
  }

  translateAction(action) {
    const map = {
      DOCUMENT_UPLOADED: 'Document televerse',
      DOCUMENT_VIEWED: 'Document consulte',
      DOCUMENT_DOWNLOADED: 'Document telecharge',
      DOCUMENT_UPDATED: 'Document modifie',
      DOCUMENT_DELETED: 'Document supprime',
      FOLDER_CREATED: 'Dossier cree',
      FOLDER_UPDATED: 'Dossier modifie',
      SIGNATURE_REQUESTED: 'Signature demandee',
      SIGNATURE_COMPLETED: 'Document signe',
      CLIENT_ACCESS_CREATED: 'Acces client cree',
      LOGIN: 'Connexion',
      LOGOUT: 'Deconnexion',
    };
    return map[action] || action;
  }
}

module.exports = new PDFService();
