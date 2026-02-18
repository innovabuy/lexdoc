const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Collect all available data for template rendering from a folder
 */
async function collectData(folderId, tenantId) {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, tenantId },
    include: {
      client: true,
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      tenant: true,
      persons: true,
    },
  });

  if (!folder) throw new Error('Dossier non trouve');

  const client = folder.client || {};
  const tenant = folder.tenant || {};
  const createdBy = folder.createdBy || {};
  const persons = folder.persons || [];

  // Find parties adverses and their lawyers
  const partiesAdverses = persons
    .filter(p => p.role === 'PARTIE_ADVERSE')
    .map(p => {
      const avocat = persons.find(
        a => a.role === 'AVOCAT_ADVERSE' && a.avocatAdverseId === p.id
      );
      return {
        nom: p.lastName || '',
        prenom: p.firstName || '',
        adresse: p.address || '',
        email: p.email || '',
        telephone: p.phone || '',
        avocat_nom: avocat ? `${avocat.firstName || ''} ${avocat.lastName || ''}`.trim() : '',
        avocat_cabinet: avocat?.cabinet || '',
        avocat_barreau: avocat?.barreau || '',
        avocat_email: avocat?.email || '',
      };
    });

  const postulant = persons.find(p => p.role === 'POSTULANT') || {};

  // Build full address for client
  const clientAddress = [client.address, client.addressLine2, client.postalCode, client.city]
    .filter(Boolean).join(', ');

  const data = {
    cabinet: {
      nom: tenant.name || '',
      raison_sociale: tenant.legalName || tenant.name || '',
      adresse: [tenant.address, tenant.postalCode, tenant.city].filter(Boolean).join(', '),
      telephone: tenant.phone || '',
      email: tenant.email || '',
      siret: tenant.siret || '',
      toque: tenant.toque || '',
      barreau: tenant.barreau || '',
      logo: tenant.logo || '',
      site: tenant.website || '',
      cp: tenant.postalCode || '',
      ville: tenant.city || '',
    },
    avocat: {
      nom: createdBy.lastName || '',
      prenom: createdBy.firstName || '',
      nom_complet: `${createdBy.firstName || ''} ${createdBy.lastName || ''}`.trim(),
      signature: `Me ${createdBy.firstName || ''} ${createdBy.lastName || ''}`.trim(),
      email: createdBy.email || '',
      toque: tenant.toque || '',
      barreau: tenant.barreau || '',
      adresse: [tenant.address, tenant.postalCode, tenant.city].filter(Boolean).join(', '),
      telephone: tenant.phone || '',
      fax: '',
    },
    client: {
      civilite: client.civilite || '',
      nom: client.lastName || '',
      prenom: client.firstName || '',
      nom_complet: `${client.civilite || ''} ${client.firstName || ''} ${client.lastName || ''}`.trim(),
      adresse: clientAddress,
      email: client.email || '',
      telephone: client.phone || client.mobile || '',
      nationalite: client.nationalite || '',
      date_naissance: client.birthDate ? new Date(client.birthDate).toLocaleDateString('fr-FR') : '',
      lieu_naissance: client.lieuNaissance || '',
      profession: client.profession || '',
      secu: client.secu || '',
      situation_familiale: client.situationFamiliale || '',
      conjoint_nom: client.conjointNom || '',
      conjoint_prenom: client.conjointPrenom || '',
      regime_matrimonial: client.regimeMatrimonial || '',
      // Company
      raison_sociale: client.companyName || '',
      forme_sociale: client.formeSociale || '',
      objet_social: client.objetSocial || '',
      capital: client.capital || '',
      siege: client.siege || '',
      rcs: client.rcs || '',
      siret: client.siret || '',
      type: client.type || '',
    },
    dossier: {
      titre: folder.title || '',
      reference: folder.reference || '',
      date_ouverture: folder.openedAt ? new Date(folder.openedAt).toLocaleDateString('fr-FR') : '',
      type: folder.type || '',
      nature: folder.nature || '',
      juridiction: folder.juridiction || '',
      rg: folder.numeroRG || '',
      chambre: folder.chambre || '',
      date_audience: folder.dateAudience ? new Date(folder.dateAudience).toLocaleDateString('fr-FR') : '',
      date_echeance: folder.dateEcheance ? new Date(folder.dateEcheance).toLocaleDateString('fr-FR') : '',
    },
    parties_adverses: partiesAdverses,
    postulant: {
      nom: postulant.lastName || '',
      prenom: postulant.firstName || '',
      nom_complet: `${postulant.firstName || ''} ${postulant.lastName || ''}`.trim(),
      cabinet: postulant.cabinet || '',
      barreau: postulant.barreau || '',
      email: postulant.email || '',
    },
    societe: {
      nom: client.type === 'COMPANY' ? (client.companyName || '') : '',
      forme: client.formeSociale || '',
      objet_social: client.objetSocial || '',
      capital: client.capital || '',
      siege: client.siege || '',
      rcs: client.rcs || '',
    },
    date: new Date().toLocaleDateString('fr-FR'),
  };

  return data;
}

/**
 * Collect basic cabinet/avocat/date data without requiring a folderId.
 * Used by the Builder pipeline when no folder is specified.
 */
async function collectBasicData(tenantId, userId) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { date: new Date().toLocaleDateString('fr-FR') };

  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });
  }

  return {
    cabinet: {
      nom: tenant.name || '',
      raison_sociale: tenant.legalName || tenant.name || '',
      adresse: [tenant.address, tenant.postalCode, tenant.city].filter(Boolean).join(', '),
      cp: tenant.postalCode || '',
      ville: tenant.city || '',
      telephone: tenant.phone || '',
      email: tenant.email || '',
      siret: tenant.siret || '',
      toque: tenant.toque || '',
      barreau: tenant.barreau || '',
      logo: tenant.logo || '',
      site: tenant.website || '',
    },
    avocat: {
      nom: user?.lastName || '',
      prenom: user?.firstName || '',
      nom_complet: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      signature: `Me ${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      email: user?.email || '',
      toque: tenant.toque || '',
      barreau: tenant.barreau || '',
      adresse: [tenant.address, tenant.postalCode, tenant.city].filter(Boolean).join(', '),
      telephone: tenant.phone || '',
      fax: '',
    },
    date: new Date().toLocaleDateString('fr-FR'),
  };
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => (o || {})[k], obj);
}

/**
 * Find which template variables have empty/missing values in the data
 */
function findMissingFields(data, variables) {
  if (!variables || !Array.isArray(variables)) return [];

  const missing = [];
  for (const variable of variables) {
    const value = getNestedValue(data, variable.key);
    if (!value || value === '') {
      missing.push({
        key: variable.key,
        label: variable.label || variable.key,
        required: variable.required !== false,
        currentValue: value || '',
      });
    }
  }
  return missing;
}

/**
 * Generate a .docx document from a template buffer and data
 */
function generateDocument(templateBuffer, data) {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter(part) {
      // Missing fields render as placeholder
      if (!part.module) {
        return '[A COMPLETER]';
      }
      return '';
    },
  });

  // Flatten data for simple {variable} syntax + keep nested for {#loop}
  const renderData = {
    ...flattenObject(data, ''),
    // Keep arrays for loops
    parties_adverses: data.parties_adverses || [],
    // Also pass full objects for nested access
    cabinet: data.cabinet,
    avocat: data.avocat,
    client: data.client,
    dossier: data.dossier,
    postulant: data.postulant,
    societe: data.societe,
    date: data.date,
  };

  doc.render(renderData);

  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
}

/**
 * Flatten nested object with underscore separator for simple template access
 * e.g. { client: { nom: 'X' } } → { client_nom: 'X' }
 */
function flattenObject(obj, prefix) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(result, flattenObject(value, newKey));
    } else if (!Array.isArray(value)) {
      result[newKey] = value;
    }
  }
  return result;
}

/**
 * Merge additional data (from missing fields modal) into collected data
 */
function mergeAdditionalData(data, additionalData) {
  if (!additionalData || typeof additionalData !== 'object') return data;

  for (const [key, value] of Object.entries(additionalData)) {
    // key is like "client.adresse" or "dossier.juridiction"
    const parts = key.split('.');
    if (parts.length === 2) {
      const [section, field] = parts;
      if (data[section] && typeof data[section] === 'object') {
        data[section][field] = value;
      }
    }
  }
  return data;
}

module.exports = {
  collectData,
  collectBasicData,
  findMissingFields,
  generateDocument,
  mergeAdditionalData,
  getNestedValue,
  flattenObject,
};
