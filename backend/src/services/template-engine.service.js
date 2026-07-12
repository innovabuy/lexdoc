const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const prisma = require('../config/database');
const logger = require('../config/logger');
const storageService = require('./storage.service');
const { buildFooterFromTenant } = require('../utils/branding-format');
const {
  formatMontantEur,
  formatPartieAdverse,
  buildAdversaireSingulier,
  normalizeCapital,
  numberToFrenchWords,
  frenchDateInWords,
  frenchHourInWords,
} = require('../utils/legal-format');

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
      return formatPartieAdverse(p, avocat);
    });

  // Co-débiteurs (B2 Phase 3)
  const coDebiteurs = persons
    .filter(p => p.role === 'CO_DEBITEUR')
    .map(p => ({
      nom: p.lastName || '',
      prenom: p.firstName || '',
      raison_sociale: p.company || '',
      adresse: p.address || '',
      code_postal: p.postalCode || '',
      ville: p.city || '',
      email: p.email || '',
      telephone: p.phone || '',
    }));

  const postulant = persons.find(p => p.role === 'POSTULANT') || {};

  // Generate presigned URL for logo
  let logoUrl = '';
  if (tenant.logo) {
    try {
      logoUrl = await storageService.generatePresignedUrl(tenant.logo, 3600);
    } catch (e) {
      logger.warn('Failed to generate presigned URL for logo', { error: e.message });
    }
  }

  // Build full address for client
  const clientAddress = [client.address, client.addressLine2, client.postalCode, client.city]
    .filter(Boolean).join(', ');

  const [avocatLegalInfo, logoBuffer] = await Promise.all([
    prisma.avocatLegalInfo.findUnique({ where: { tenantId } }).catch(() => null),
    tenant.logo
      ? storageService.downloadFile(tenant.logo).catch((e) => {
          logger.warn('Failed to download logo binary', { error: e.message });
          return null;
        })
      : Promise.resolve(null),
  ]);

  const data = {
    _branding: {
      logoBuffer,
      mentionsLegales: buildFooterFromTenant(tenant),
    },
    cabinet: {
      nom: tenant.name || '',
      raison_sociale: tenant.legalName || tenant.name || '',
      adresse: [tenant.addressLine1, tenant.postalCode, tenant.city].filter(Boolean).join(', '),
      telephone: tenant.phone || '',
      email: tenant.email || '',
      siret: tenant.siret || '',
      toque: tenant.toque || '',
      barreau: tenant.barreau || '',
      logo: logoUrl,
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
      adresse: [tenant.addressLine1, tenant.postalCode, tenant.city].filter(Boolean).join(', '),
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
      capital: normalizeCapital(client.capital), // GO-LIVE-1.C — strip €/euros (Q21) pour éviter « € euros »
      siege: client.siege || '',
      rcs: client.rcs || '',
      siret: client.siret || '',
      type: client.type || '',
      // GO-LIVE-1.C.1 — immatriculation isolée + booléens réels PP/PM
      ville_immatriculation: client.villeImmatriculation || '',
      numero_immatriculation: client.numeroImmatriculation || '',
      est_morale: client.type === 'COMPANY' || client.type === 'ASSOCIATION',
      est_physique: client.type === 'INDIVIDUAL',
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
    co_debiteurs: coDebiteurs,
    postulant: {
      nom: postulant.lastName || '',
      prenom: postulant.firstName || '',
      nom_complet: `${postulant.firstName || ''} ${postulant.lastName || ''}`.trim(),
      cabinet: postulant.cabinet || '',
      barreau: postulant.barreau || '',
      email: postulant.email || '',
      adresse: postulant.address || '',
    },
    societe: {
      nom: client.type === 'COMPANY' ? (client.companyName || '') : '',
      forme: client.formeSociale || '',
      objet_social: client.objetSocial || '',
      capital: normalizeCapital(client.capital), // GO-LIVE-1.C — strip €/euros (Q21) pour éviter « € euros »
      siege: client.siege || '',
      rcs: client.rcs || '',
    },
    date: new Date().toLocaleDateString('fr-FR'),
    date_jour_long: (() => {
      const d = new Date();
      const mois = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
      return `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`;
    })(),
    date_annee: String(new Date().getFullYear()),
    date_annee_lettres: numberToFrenchWords(new Date().getFullYear()),
  };

  // Mission B : champs Tenant ajoutés (Stage 2.2) + section mediateur + alias date
  data.cabinet.tva = tenant.tva || '';
  data.cabinet.address_line1 = tenant.addressLine1 || '';
  data.mediateur = {
    nom_complet: tenant.mediateurNomComplet || '',
    barreau: tenant.mediateurBarreau || '',
  };
  data.document_date = data.date;

  // Mission B Phase 1 : sections métier reçues via additionalData
  // Doivent être pré-initialisées sinon mergeAdditionalData skip silencieusement
  data.honoraires = {};
  data.provision = {};

  // Mission B Phase 2 — alias snake_case pour mise en demeure (zéro régression Phase 1)
  // Les clés existantes (client_capital, client_siege, client_email) restent intactes.
  data.client.capital_social = data.client.capital;
  data.client.siege_social = data.client.siege;
  data.client.adresse_mail = data.client.email;

  // GO-LIVE-1.C.1 — section adversaire SINGULIÈRE, peuplée depuis le 1er PARTIE_ADVERSE.
  // additionalData reste prioritaire (mergeAdditionalData override par champ, après).
  data.adversaire = buildAdversaireSingulier(partiesAdverses);
  data.devis = {};
  data.facture = {};
  data.somme_due = {};

  // Mission B Phase 2 — nouveaux champs dossier pour mise en demeure
  // (vides par défaut, peuplés via additionalData : dossier.ref_interne, dossier.ref_adverse, dossier.greffe)
  if (data.dossier.ref_interne == null) data.dossier.ref_interne = '';
  if (data.dossier.ref_adverse == null) data.dossier.ref_adverse = '';
  if (data.dossier.greffe == null) data.dossier.greffe = '';

  // GO-LIVE-1.B — audience en toutes lettres + heure, dérivées de folder.dateAudience (DateTime).
  const dateAudience = folder.dateAudience ? new Date(folder.dateAudience) : null;
  data.dossier.date_audience_lettres = dateAudience ? frenchDateInWords(dateAudience) : '';
  data.dossier.heure_audience = dateAudience ? frenchHourInWords(dateAudience) : '';

  // GO-LIVE-1.B — champs assignation peuplés ponctuellement via additionalData (pattern ref_interne/greffe).
  if (data.dossier.tribunal_ville == null) data.dossier.tribunal_ville = '';
  if (data.dossier.tribunal_adresse == null) data.dossier.tribunal_adresse = '';
  if (data.dossier.montant_article_700 == null) data.dossier.montant_article_700 = '';
  if (data.dossier.date_mise_en_demeure == null) data.dossier.date_mise_en_demeure = '';
  // GO-LIVE-1.C.1 — montant provisionnel réclamé au juge des référés (≠ somme_due_ttc de la MED)
  if (data.dossier.montant_provisionnel == null) data.dossier.montant_provisionnel = '';

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

  // Generate presigned URL for logo
  let logoUrl = '';
  if (tenant.logo) {
    try {
      logoUrl = await storageService.generatePresignedUrl(tenant.logo, 3600);
    } catch (e) {
      // Silently fail — logo just won't appear
    }
  }

  return {
    cabinet: {
      nom: tenant.name || '',
      raison_sociale: tenant.legalName || tenant.name || '',
      adresse: [tenant.addressLine1, tenant.postalCode, tenant.city].filter(Boolean).join(', '),
      cp: tenant.postalCode || '',
      ville: tenant.city || '',
      telephone: tenant.phone || '',
      email: tenant.email || '',
      siret: tenant.siret || '',
      toque: tenant.toque || '',
      barreau: tenant.barreau || '',
      logo: logoUrl,
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
      adresse: [tenant.addressLine1, tenant.postalCode, tenant.city].filter(Boolean).join(', '),
      telephone: tenant.phone || '',
      fax: '',
    },
    date: new Date().toLocaleDateString('fr-FR'),
    date_jour_long: (() => {
      const d = new Date();
      const mois = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
      return `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`;
    })(),
    date_annee: String(new Date().getFullYear()),
    date_annee_lettres: numberToFrenchWords(new Date().getFullYear()),
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
 * Enrichit data avec champs calculés (TVA 20%, TTC) à partir des montants HT.
 * Appelé après mergeAdditionalData, avant generateDocument.
 */
function enrichComputedFields(data) {
  if (data.honoraires && data.honoraires.ht != null && data.honoraires.ht !== '') {
    const ht = parseFloat(data.honoraires.ht);
    if (!isNaN(ht)) {
      data.honoraires.tva = formatMontantEur(ht * 0.20);
      data.honoraires.ttc = formatMontantEur(ht * 1.20);
      data.honoraires.ht = formatMontantEur(ht);
    }
  }
  if (data.provision && data.provision.ht != null && data.provision.ht !== '') {
    const ht = parseFloat(data.provision.ht);
    if (!isNaN(ht)) {
      data.provision.ttc = formatMontantEur(ht * 1.20);
      data.provision.ht = formatMontantEur(ht);
    }
  }
  // Mission B Phase 2 — calcul SIREN dérivé du SIRET (9 premiers chiffres)
  if (data.client && data.client.siret && typeof data.client.siret === 'string') {
    const siretClean = data.client.siret.replace(/\s/g, '');
    if (siretClean.length >= 9) {
      data.client.siren = siretClean.slice(0, 9);
    } else {
      data.client.siren = '';
    }
  }
  return data;
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
    co_debiteurs: data.co_debiteurs || [],
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

  const buffer = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  if (data._branding) {
    return applyBranding(buffer, data);
  }

  return buffer;
}

/**
 * Post-process a DOCX buffer to inject branding: logo in header, mentions légales in footer.
 */
function applyBranding(docBuffer, data) {
  const branding = data._branding;
  if (!branding) return docBuffer;

  const hasLogo = !!branding.logoBuffer;
  const hasMentions = !!branding.mentionsLegales;
  if (!hasLogo && !hasMentions) return docBuffer;

  const zip = new PizZip(docBuffer);

  if (hasLogo) {
    zip.file('word/media/image1.png', branding.logoBuffer);

    zip.file('word/header1.xml', [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"',
      '       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"',
      '       xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"',
      '       xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"',
      '       xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">',
      '  <w:p>',
      '    <w:pPr><w:jc w:val="left"/></w:pPr>',
      '    <w:r>',
      '      <w:drawing>',
      '        <wp:inline distT="0" distB="0" distL="0" distR="0">',
      '          <wp:extent cx="1800000" cy="600000"/>',
      '          <wp:docPr id="1" name="Logo"/>',
      '          <a:graphic>',
      '            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">',
      '              <pic:pic>',
      '                <pic:nvPicPr>',
      '                  <pic:cNvPr id="1" name="image1.png"/>',
      '                  <pic:cNvPicPr/>',
      '                </pic:nvPicPr>',
      '                <pic:blipFill>',
      '                  <a:blip r:embed="rId1"/>',
      '                  <a:stretch><a:fillRect/></a:stretch>',
      '                </pic:blipFill>',
      '                <pic:spPr>',
      '                  <a:xfrm>',
      '                    <a:off x="0" y="0"/>',
      '                    <a:ext cx="1800000" cy="600000"/>',
      '                  </a:xfrm>',
      '                  <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>',
      '                </pic:spPr>',
      '              </pic:pic>',
      '            </a:graphicData>',
      '          </a:graphic>',
      '        </wp:inline>',
      '      </w:drawing>',
      '    </w:r>',
      '  </w:p>',
      '</w:hdr>',
    ].join('\n'));

    zip.file('word/_rels/header1.xml.rels', [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '  <Relationship Id="rId1"',
      '    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"',
      '    Target="media/image1.png"/>',
      '</Relationships>',
    ].join('\n'));
  }

  if (hasMentions) {
    const escapedMentions = branding.mentionsLegales
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const lines = escapedMentions.split('\n');
    const runs = lines
      .map((line, idx) => {
        const brTag = idx > 0 ? '<w:br/>' : '';
        return [
          '    <w:r>',
          '      <w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>',
          `      ${brTag}<w:t xml:space="preserve">${line}</w:t>`,
          '    </w:r>',
        ].join('\n');
      })
      .join('\n');

    zip.file('word/footer1.xml', [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
      '  <w:p>',
      '    <w:pPr>',
      '      <w:jc w:val="center"/>',
      '      <w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>',
      '    </w:pPr>',
      runs,
      '  </w:p>',
      '</w:ftr>',
    ].join('\n'));
  }

  ensureContentTypes(zip);
  ensureDocumentRels(zip, hasLogo, hasMentions);
  ensureSectPr(zip, hasLogo, hasMentions);

  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

function ensureContentTypes(zip) {
  const ctFile = '[Content_Types].xml';
  const ctXml = zip.file(ctFile)?.asText();
  if (!ctXml) return;

  let updated = ctXml;

  if (!updated.includes('Extension="png"')) {
    updated = updated.replace(
      '</Types>',
      '  <Default Extension="png" ContentType="image/png"/>\n</Types>'
    );
  }

  if (!updated.includes('PartName="/word/header1.xml"') && zip.file('word/header1.xml')) {
    updated = updated.replace(
      '</Types>',
      '  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>\n</Types>'
    );
  }

  if (!updated.includes('PartName="/word/footer1.xml"') && zip.file('word/footer1.xml')) {
    updated = updated.replace(
      '</Types>',
      '  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>\n</Types>'
    );
  }

  zip.file(ctFile, updated);
}

function ensureDocumentRels(zip, hasLogo, hasMentions) {
  const relsPath = 'word/_rels/document.xml.rels';
  let relsXml = zip.file(relsPath)?.asText();
  if (!relsXml) return;

  const headerType = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header';
  const footerType = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer';

  const existingIds = [...relsXml.matchAll(/Id="(rId\d+)"/g)].map(m => m[1]);
  let nextId = Math.max(0, ...existingIds.map(id => parseInt(id.replace('rId', ''), 10))) + 1;

  let headerRelId = null;
  let footerRelId = null;

  if (hasLogo && !relsXml.includes('Target="header1.xml"')) {
    headerRelId = `rId${nextId++}`;
    relsXml = relsXml.replace(
      '</Relationships>',
      `  <Relationship Id="${headerRelId}" Type="${headerType}" Target="header1.xml"/>\n</Relationships>`
    );
  } else if (hasLogo) {
    const match = relsXml.match(/Id="(rId\d+)"[^>]*Target="header1\.xml"/);
    if (match) headerRelId = match[1];
  }

  if (hasMentions && !relsXml.includes('Target="footer1.xml"')) {
    footerRelId = `rId${nextId++}`;
    relsXml = relsXml.replace(
      '</Relationships>',
      `  <Relationship Id="${footerRelId}" Type="${footerType}" Target="footer1.xml"/>\n</Relationships>`
    );
  } else if (hasMentions) {
    const match = relsXml.match(/Id="(rId\d+)"[^>]*Target="footer1\.xml"/);
    if (match) footerRelId = match[1];
  }

  zip.file(relsPath, relsXml);

  zip._brandingRels = { headerRelId, footerRelId };
}

function ensureSectPr(zip, hasLogo, hasMentions) {
  const docPath = 'word/document.xml';
  let docXml = zip.file(docPath)?.asText();
  if (!docXml) return;

  const { headerRelId, footerRelId } = zip._brandingRels || {};

  let headerRef = '';
  if (hasLogo && headerRelId && !docXml.includes('w:headerReference')) {
    headerRef = `<w:headerReference w:type="default" r:id="${headerRelId}"/>`;
  }

  let footerRef = '';
  if (hasMentions && footerRelId && !docXml.includes('w:footerReference')) {
    footerRef = `<w:footerReference w:type="default" r:id="${footerRelId}"/>`;
  }

  if (!headerRef && !footerRef) {
    delete zip._brandingRels;
    return;
  }

  const refs = headerRef + footerRef;

  if (docXml.includes('<w:sectPr')) {
    docXml = docXml.replace(/<w:sectPr([^>]*?)(\/>|>)/, (match, attrs, closing) => {
      if (closing === '/>') {
        return `<w:sectPr${attrs}>${refs}</w:sectPr>`;
      }
      return `<w:sectPr${attrs}>${refs}`;
    });
  } else {
    docXml = docXml.replace(
      '</w:body>',
      `<w:sectPr>${refs}</w:sectPr></w:body>`
    );
  }

  zip.file(docPath, docXml);
  delete zip._brandingRels;
}

/**
 * Flatten nested object with underscore separator for simple template access
 * e.g. { client: { nom: 'X' } } → { client_nom: 'X' }
 */
function flattenObject(obj, prefix) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key;
    if (key === '_branding' || Buffer.isBuffer(value)) {
      continue;
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
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
      if (!data[section] || typeof data[section] !== 'object') {
        console.warn(`[mergeAdditionalData] Auto-creating section '${section}' for key '${key}' — consider declaring it in collectData()`);
        data[section] = {};
      }
      data[section][field] = value;
    }
  }
  return data;
}

module.exports = {
  collectData,
  collectBasicData,
  findMissingFields,
  generateDocument,
  applyBranding,
  mergeAdditionalData,
  enrichComputedFields,
  getNestedValue,
  flattenObject,
  // GO-LIVE-1.B — helpers purs (testables unitairement)
  formatMontantEur,
  formatPartieAdverse,
  numberToFrenchWords,
  frenchDateInWords,
  frenchHourInWords,
};
