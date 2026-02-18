const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Timeline Service
 * Centralized service for recording timeline events on folders.
 */

const TYPE_LABELS = {
  dossier_cree: 'Dossier créé',
  dossier_modifie: 'Dossier modifié',
  dossier_statut: 'Changement de statut',
  dossier_cloture: 'Dossier clôturé',
  dossier_archive: 'Dossier archivé',
  dossier_reouvert: 'Dossier réouvert',
  document_cree: 'Document ajouté',
  document_modifie: 'Document modifié',
  document_supprime: 'Document supprimé',
  document_signe: 'Document signé',
  document_genere: 'Document généré',
  personne_ajoutee: 'Personne ajoutée',
  personne_supprimee: 'Personne retirée',
  echeance_creee: 'Échéance créée',
  echeance_terminee: 'Échéance terminée',
  email_envoye: 'Email envoyé',
  signature_demandee: 'Signature demandée',
  lrar_envoye: 'LRAR envoyé',
  ar_recu: 'AR reçu',
  extranet_invitation: 'Invitation extranet',
  extranet_relance: 'Relance extranet',
  extranet_relance_auto: 'Relance auto extranet',
  extranet_consulte: 'Consulté via extranet',
  extranet_profile_step: 'Profil extranet',
  extranet_profile_submitted: 'Profil extranet soumis',
  formulaire_envoye: 'Formulaire envoyé',
};

/**
 * Add a timeline event to a folder
 * @param {Object} params
 * @param {string} params.folderId - Required folder ID
 * @param {string} params.type - Event type (e.g. 'document_cree')
 * @param {string} params.description - Human-readable description
 * @param {string} [params.userId] - User who performed the action
 * @param {string} [params.documentId] - Related document ID
 * @param {Object} [params.metadata] - Additional metadata
 * @param {Object} [params.tx] - Prisma transaction client (if inside a transaction)
 */
async function addEvent({ folderId, type, description, userId, documentId, metadata, tx }) {
  if (!folderId || !type || !description) {
    logger.warn('Timeline: missing required fields', { folderId, type, description });
    return null;
  }

  const client = tx || prisma;

  try {
    const event = await client.timelineEvent.create({
      data: {
        folderId,
        type,
        description,
        userId: userId || null,
        documentId: documentId || null,
        metadata: metadata || null,
      },
    });
    return event;
  } catch (error) {
    // Don't let timeline errors break the main operation
    logger.error('Timeline: failed to create event', { error: error.message, folderId, type });
    return null;
  }
}

module.exports = {
  addEvent,
  TYPE_LABELS,
};
