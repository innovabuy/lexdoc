const pdfService = require('../services/pdf.service');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const logger = require('../config/logger');

/**
 * Export folder report as PDF
 */
const exportFolderPDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pdfBuffer = await pdfService.generateFolderReport(id, req.tenant.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="dossier-${id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error exporting folder PDF:', error);
    next(error);
  }
};

/**
 * Export document list as PDF
 */
const exportDocumentListPDF = async (req, res, next) => {
  try {
    const { folderId, status, type } = req.query;

    const pdfBuffer = await pdfService.generateDocumentListReport(req.tenant.id, {
      folderId,
      status,
      type,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="documents.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error exporting documents PDF:', error);
    next(error);
  }
};

/**
 * Export activity report as PDF
 */
const exportActivityPDF = async (req, res, next) => {
  try {
    const { startDate, endDate, entityType } = req.query;

    const pdfBuffer = await pdfService.generateActivityReport(req.tenant.id, {
      startDate,
      endDate,
      entityType,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="activite.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error exporting activity PDF:', error);
    next(error);
  }
};

module.exports = {
  exportFolderPDF,
  exportDocumentListPDF,
  exportActivityPDF,
};
