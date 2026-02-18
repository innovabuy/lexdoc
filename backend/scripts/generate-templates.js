/**
 * Generate .docx template files for all templates that don't have a sourceFileUrl set.
 * Creates proper .docx files with {variable_name} placeholders compatible with docxtemplater.
 * Updates the database sourceFileUrl after creation.
 *
 * Run: node scripts/generate-templates.js
 */

const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');
const path = require('path');
const prisma = require('../src/config/database');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// Ensure templates directory exists
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sanitize a template name into a safe filename (no accents, lowercase, dashes)
 */
function sanitizeFilename(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')       // strip accents
    .toLowerCase()
    .replace(/['']/g, '-')                  // apostrophes to dashes
    .replace(/[^a-z0-9]+/g, '-')            // non-alphanumeric to dashes
    .replace(/^-+|-+$/g, '')                // trim leading/trailing dashes
    + '.docx';
}

/**
 * Create helper to make paragraph creation less verbose
 */
function p(text, opts = {}) {
  const runOpts = { text, size: opts.size || 22 };
  if (opts.bold) runOpts.bold = true;
  if (opts.italics) runOpts.italics = true;
  const paragraphOpts = { children: [new TextRun(runOpts)] };
  if (opts.alignment) paragraphOpts.alignment = opts.alignment;
  if (opts.heading) paragraphOpts.heading = opts.heading;
  return new Paragraph(paragraphOpts);
}

function emptyLine() {
  return new Paragraph({ children: [] });
}

// ---------------------------------------------------------------------------
// Common document sections reused across categories
// ---------------------------------------------------------------------------

function cabinetHeader() {
  return [
    p('{cabinet_nom}', { bold: true, size: 28, alignment: AlignmentType.RIGHT }),
    p('{cabinet_adresse}', { size: 18, alignment: AlignmentType.RIGHT }),
    p('Tel : {cabinet_telephone} - Email : {cabinet_email}', { size: 18, alignment: AlignmentType.RIGHT }),
    p('Barreau de {cabinet_barreau} - Toque {cabinet_toque}', { size: 18, alignment: AlignmentType.RIGHT }),
    emptyLine(),
  ];
}

function signatureBlock() {
  return [
    emptyLine(),
    emptyLine(),
    p('Fait a {cabinet_barreau}, le {date}', { size: 22 }),
    emptyLine(),
    emptyLine(),
    p('{avocat_signature}', { size: 22, alignment: AlignmentType.RIGHT }),
    p('Avocat au Barreau de {cabinet_barreau}', { size: 18, alignment: AlignmentType.RIGHT }),
  ];
}

function clientBlock() {
  return [
    p('{client_civilite} {client_prenom} {client_nom}', { size: 22 }),
    p('Demeurant : {client_adresse}', { size: 22 }),
    p('Email : {client_email} - Tel : {client_telephone}', { size: 22 }),
  ];
}

function dossierRefLine() {
  return p('Ref : {dossier_reference} - {dossier_titre}', { size: 20 });
}

// ---------------------------------------------------------------------------
// Category-specific document generators
// ---------------------------------------------------------------------------

/**
 * contrats: Contract structure with parties, clauses, signatures
 */
function generateContrat(templateName) {
  return [
    ...cabinetHeader(),
    emptyLine(),
    p(templateName.toUpperCase(), { bold: true, size: 28, alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1 }),
    emptyLine(),
    dossierRefLine(),
    emptyLine(),
    emptyLine(),

    p('ENTRE LES SOUSSIGNES :', { bold: true, size: 22, heading: HeadingLevel.HEADING_2 }),
    emptyLine(),
    p('Le Cabinet {cabinet_nom}, represente par Me {avocat_nom_complet},', { size: 22 }),
    p('Avocat au Barreau de {cabinet_barreau}, Toque n. {cabinet_toque},', { size: 22 }),
    p('ci-apres denomme "la Premiere Partie",', { italics: true, size: 22 }),
    emptyLine(),

    p('ET', { bold: true, size: 22, alignment: AlignmentType.CENTER }),
    emptyLine(),

    ...clientBlock(),
    p('ci-apres denomme "la Seconde Partie",', { italics: true, size: 22 }),
    emptyLine(),
    emptyLine(),

    p('IL A ETE CONVENU CE QUI SUIT :', { bold: true, size: 22 }),
    emptyLine(),

    p('Article 1 - Objet', { bold: true, size: 22, heading: HeadingLevel.HEADING_2 }),
    p('Le present contrat a pour objet : {dossier_titre}.', { size: 22 }),
    emptyLine(),

    p('Article 2 - Duree', { bold: true, size: 22, heading: HeadingLevel.HEADING_2 }),
    p('Le present contrat est conclu pour une duree de ______ a compter de sa signature.', { size: 22 }),
    emptyLine(),

    p('Article 3 - Obligations des parties', { bold: true, size: 22, heading: HeadingLevel.HEADING_2 }),
    p('[A completer selon la nature du contrat]', { italics: true, size: 22 }),
    emptyLine(),

    p('Article 4 - Conditions financieres', { bold: true, size: 22, heading: HeadingLevel.HEADING_2 }),
    p('[A completer : montant, echeancier, modalites de paiement]', { italics: true, size: 22 }),
    emptyLine(),

    p('Article 5 - Resiliation', { bold: true, size: 22, heading: HeadingLevel.HEADING_2 }),
    p('Chacune des parties pourra resilier le present contrat par lettre recommandee avec accuse de reception, moyennant un preavis de ______ jours.', { size: 22 }),
    emptyLine(),

    p('Article 6 - Juridiction competente', { bold: true, size: 22, heading: HeadingLevel.HEADING_2 }),
    p('En cas de litige, les parties conviennent de soumettre leur differend au Tribunal competent de {dossier_juridiction}.', { size: 22 }),
    emptyLine(),

    ...signatureBlock(),
    emptyLine(),
    emptyLine(),
    p('La Premiere Partie                                              La Seconde Partie', { size: 22 }),
    p('{avocat_nom_complet}                                            {client_civilite} {client_prenom} {client_nom}', { size: 22 }),
  ];
}

/**
 * actes_procedure: Court procedure act with header, body, request
 */
function generateActeProcedure(templateName) {
  return [
    p(templateName.toUpperCase(), { bold: true, size: 28, alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1 }),
    emptyLine(),
    p('L\'AN DEUX MILLE VINGT SIX, le {date}', { bold: true, size: 22 }),
    emptyLine(),

    p('A LA REQUETE DE :', { bold: true, size: 22 }),
    p('{client_civilite} {client_prenom} {client_nom}', { size: 22 }),
    p('Ne(e) le {client_date_naissance} a {client_lieu_naissance}', { size: 22 }),
    p('De nationalite {client_nationalite}', { size: 22 }),
    p('Demeurant : {client_adresse}', { size: 22 }),
    emptyLine(),

    p('Ayant pour avocat constitue :', { size: 22 }),
    p('Me {avocat_nom_complet}, Avocat au Barreau de {cabinet_barreau}, Toque {cabinet_toque}', { size: 22 }),
    p('{cabinet_nom} - {cabinet_adresse}', { size: 22 }),
    p('Tel : {cabinet_telephone} - Email : {cabinet_email}', { size: 22 }),
    emptyLine(),

    p('A L\'ENCONTRE DE :', { bold: true, size: 22 }),
    p('[Partie adverse - a completer]', { italics: true, size: 22 }),
    emptyLine(),

    p('DEVANT :', { bold: true, size: 22 }),
    p('{dossier_juridiction}', { size: 22 }),
    p('Chambre : {dossier_chambre}', { size: 22 }),
    p('Audience du : {dossier_date_audience}', { size: 22 }),
    p('RG : {dossier_rg}', { size: 22 }),
    emptyLine(),
    emptyLine(),

    p('I. EXPOSE DES FAITS', { bold: true, size: 24, heading: HeadingLevel.HEADING_2 }),
    emptyLine(),
    p('[Exposer les faits de maniere chronologique et detaillee]', { italics: true, size: 22 }),
    emptyLine(),
    emptyLine(),

    p('II. DISCUSSION', { bold: true, size: 24, heading: HeadingLevel.HEADING_2 }),
    emptyLine(),
    p('[Developper les moyens de droit et les arguments juridiques]', { italics: true, size: 22 }),
    emptyLine(),
    emptyLine(),

    p('PAR CES MOTIFS,', { bold: true, size: 24, alignment: AlignmentType.CENTER }),
    emptyLine(),

    p('Il est demande au Tribunal de :', { size: 22 }),
    p('- [Demande principale]', { size: 22 }),
    p('- [Demande subsidiaire]', { size: 22 }),
    p('- Condamner la partie adverse aux entiers depens.', { size: 22 }),
    p('- Ordonner l\'execution provisoire de la decision a intervenir.', { size: 22 }),
    emptyLine(),

    p('Sous toutes reserves.', { italics: true, size: 22 }),
    emptyLine(),

    ...signatureBlock(),
  ];
}

/**
 * courriers: Letter format with sender/recipient, date, body
 */
function generateCourrier(templateName) {
  return [
    ...cabinetHeader(),
    emptyLine(),

    ...clientBlock(),
    emptyLine(),

    p('{cabinet_barreau}, le {date}', { size: 22, alignment: AlignmentType.RIGHT }),
    emptyLine(),

    p('Objet : ' + templateName, { bold: true, size: 22 }),
    dossierRefLine(),
    emptyLine(),

    p('{client_civilite} {client_nom},', { size: 22 }),
    emptyLine(),

    p('[Corps du courrier - a adapter selon l\'objet]', { italics: true, size: 22 }),
    emptyLine(),

    p('Je me permets de vous ecrire dans le cadre du dossier reference en objet ({dossier_titre}).', { size: 22 }),
    emptyLine(),

    p('[Developper le contenu du courrier]', { italics: true, size: 22 }),
    emptyLine(),

    p('Je reste a votre entiere disposition pour tout renseignement complementaire et vous prie d\'agreer, {client_civilite} {client_nom}, l\'expression de mes salutations distinguees.', { size: 22 }),
    emptyLine(),

    ...signatureBlock(),
  ];
}

/**
 * droit_societes: Corporate law documents with company info
 */
function generateDroitSocietes(templateName) {
  return [
    ...cabinetHeader(),
    emptyLine(),

    p(templateName.toUpperCase(), { bold: true, size: 28, alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1 }),
    emptyLine(),
    dossierRefLine(),
    emptyLine(),
    emptyLine(),

    p('SOCIETE :', { bold: true, size: 22, heading: HeadingLevel.HEADING_2 }),
    p('{societe_nom}', { bold: true, size: 24 }),
    p('Forme sociale : {societe_forme}', { size: 22 }),
    p('Capital social : {societe_capital}', { size: 22 }),
    p('Siege social : {societe_siege}', { size: 22 }),
    p('RCS : {societe_rcs}', { size: 22 }),
    p('Objet social : {societe_objet_social}', { size: 22 }),
    emptyLine(),
    emptyLine(),

    p('REPRESENTEE PAR :', { bold: true, size: 22 }),
    p('{client_civilite} {client_prenom} {client_nom}', { size: 22 }),
    p('Demeurant : {client_adresse}', { size: 22 }),
    emptyLine(),

    p('Assiste de :', { size: 22 }),
    p('Me {avocat_nom_complet}, Avocat au Barreau de {cabinet_barreau}', { size: 22 }),
    p('{cabinet_nom} - {cabinet_adresse}', { size: 22 }),
    emptyLine(),
    emptyLine(),

    p('I. OBJET', { bold: true, size: 24, heading: HeadingLevel.HEADING_2 }),
    emptyLine(),
    p('[Decrire l\'objet de l\'acte de droit des societes]', { italics: true, size: 22 }),
    emptyLine(),
    emptyLine(),

    p('II. DECISIONS', { bold: true, size: 24, heading: HeadingLevel.HEADING_2 }),
    emptyLine(),
    p('Resolution n. 1 :', { bold: true, size: 22 }),
    p('[A completer]', { italics: true, size: 22 }),
    emptyLine(),
    p('Resolution n. 2 :', { bold: true, size: 22 }),
    p('[A completer]', { italics: true, size: 22 }),
    emptyLine(),
    emptyLine(),

    p('III. FORMALITES', { bold: true, size: 24, heading: HeadingLevel.HEADING_2 }),
    emptyLine(),
    p('Les formalites de publicite seront accomplies conformement aux dispositions legales en vigueur.', { size: 22 }),
    emptyLine(),

    ...signatureBlock(),
    emptyLine(),
    emptyLine(),
    p('Le Gerant / Le President                                        L\'Avocat', { size: 22 }),
    p('{client_civilite} {client_prenom} {client_nom}                  Me {avocat_nom_complet}', { size: 22 }),
  ];
}

/**
 * divers: General legal document structure
 */
function generateDivers(templateName) {
  return [
    ...cabinetHeader(),
    emptyLine(),

    p(templateName.toUpperCase(), { bold: true, size: 28, alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1 }),
    emptyLine(),
    dossierRefLine(),
    emptyLine(),

    p('{cabinet_barreau}, le {date}', { size: 22, alignment: AlignmentType.RIGHT }),
    emptyLine(),
    emptyLine(),

    p('CONCERNE :', { bold: true, size: 22 }),
    p('{client_civilite} {client_prenom} {client_nom}', { size: 22 }),
    p('Demeurant : {client_adresse}', { size: 22 }),
    p('Ne(e) le {client_date_naissance} a {client_lieu_naissance}', { size: 22 }),
    p('De nationalite {client_nationalite}', { size: 22 }),
    emptyLine(),
    emptyLine(),

    p('REDIGE PAR :', { bold: true, size: 22 }),
    p('Me {avocat_nom_complet}, Avocat au Barreau de {cabinet_barreau}', { size: 22 }),
    p('{cabinet_nom} - {cabinet_adresse}', { size: 22 }),
    emptyLine(),

    p('Juridiction : {dossier_juridiction}', { size: 22 }),
    p('RG : {dossier_rg}', { size: 22 }),
    emptyLine(),
    emptyLine(),

    p('[Corps du document - a adapter selon la nature de l\'acte]', { italics: true, size: 22 }),
    emptyLine(),
    emptyLine(),

    p('[Developper le contenu]', { italics: true, size: 22 }),
    emptyLine(),

    ...signatureBlock(),
  ];
}

// ---------------------------------------------------------------------------
// Map category to generator
// ---------------------------------------------------------------------------

const GENERATORS = {
  contrats: generateContrat,
  actes_procedure: generateActeProcedure,
  courriers: generateCourrier,
  droit_societes: generateDroitSocietes,
  divers: generateDivers,
};

// ---------------------------------------------------------------------------
// Variable definitions per category
// ---------------------------------------------------------------------------

const COMMON_VARIABLES = [
  { key: 'cabinet.nom', label: 'Nom du cabinet', required: true },
  { key: 'cabinet.adresse', label: 'Adresse du cabinet', required: true },
  { key: 'cabinet.telephone', label: 'Telephone du cabinet', required: false },
  { key: 'cabinet.email', label: 'Email du cabinet', required: false },
  { key: 'cabinet.barreau', label: 'Barreau', required: true },
  { key: 'cabinet.toque', label: 'Toque', required: false },
  { key: 'avocat.nom_complet', label: 'Nom complet de l\'avocat', required: true },
  { key: 'client.civilite', label: 'Civilite du client', required: false },
  { key: 'client.nom', label: 'Nom du client', required: true },
  { key: 'client.prenom', label: 'Prenom du client', required: false },
  { key: 'client.adresse', label: 'Adresse du client', required: true },
  { key: 'client.email', label: 'Email du client', required: false },
  { key: 'client.telephone', label: 'Telephone du client', required: false },
  { key: 'dossier.titre', label: 'Titre du dossier', required: true },
  { key: 'dossier.reference', label: 'Reference du dossier', required: true },
];

const PROCEDURE_VARIABLES = [
  ...COMMON_VARIABLES,
  { key: 'client.date_naissance', label: 'Date de naissance', required: true },
  { key: 'client.lieu_naissance', label: 'Lieu de naissance', required: true },
  { key: 'client.nationalite', label: 'Nationalite', required: true },
  { key: 'dossier.juridiction', label: 'Juridiction', required: true },
  { key: 'dossier.chambre', label: 'Chambre', required: false },
  { key: 'dossier.date_audience', label: 'Date d\'audience', required: false },
  { key: 'dossier.rg', label: 'Numero RG', required: false },
];

const SOCIETES_VARIABLES = [
  ...COMMON_VARIABLES,
  { key: 'societe.nom', label: 'Nom de la societe', required: true },
  { key: 'societe.forme', label: 'Forme sociale', required: true },
  { key: 'societe.capital', label: 'Capital social', required: false },
  { key: 'societe.siege', label: 'Siege social', required: true },
  { key: 'societe.rcs', label: 'RCS', required: false },
  { key: 'societe.objet_social', label: 'Objet social', required: false },
];

const DIVERS_VARIABLES = [
  ...COMMON_VARIABLES,
  { key: 'client.date_naissance', label: 'Date de naissance', required: false },
  { key: 'client.lieu_naissance', label: 'Lieu de naissance', required: false },
  { key: 'client.nationalite', label: 'Nationalite', required: false },
  { key: 'dossier.juridiction', label: 'Juridiction', required: false },
  { key: 'dossier.rg', label: 'Numero RG', required: false },
];

const CATEGORY_VARIABLES = {
  contrats: [
    ...COMMON_VARIABLES,
    { key: 'dossier.juridiction', label: 'Juridiction', required: false },
  ],
  actes_procedure: PROCEDURE_VARIABLES,
  courriers: COMMON_VARIABLES,
  droit_societes: SOCIETES_VARIABLES,
  divers: DIVERS_VARIABLES,
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Generate Templates ===\n');

  // 1. Find all templates without sourceFileUrl
  const templates = await prisma.template.findMany({
    where: {
      sourceFileUrl: null,
      deletedAt: null,
    },
    orderBy: { name: 'asc' },
  });

  if (templates.length === 0) {
    console.log('All templates already have a sourceFileUrl. Nothing to do.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${templates.length} templates without sourceFileUrl.\n`);

  let created = 0;
  let errors = 0;

  for (const template of templates) {
    const filename = sanitizeFilename(template.name);
    const filePath = path.join(TEMPLATES_DIR, filename);
    const category = template.category || 'divers';
    const generator = GENERATORS[category] || GENERATORS.divers;

    try {
      // Generate .docx content using the docx library
      const children = generator(template.name);

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
            },
          },
          children,
        }],
      });

      const buffer = await Packer.toBuffer(doc);

      // Verify the generated file is valid for docxtemplater by loading it
      const zip = new PizZip(buffer);
      new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter() { return ''; },
      });

      // Write the file
      fs.writeFileSync(filePath, buffer);

      // Build variables list for this category
      const variables = CATEGORY_VARIABLES[category] || COMMON_VARIABLES;

      // Update the database
      await prisma.template.update({
        where: { id: template.id },
        data: {
          sourceFileUrl: filename,
          variables: template.variables || variables,
        },
      });

      console.log(`  [OK] ${template.name} -> ${filename} (${category})`);
      created++;
    } catch (err) {
      console.error(`  [ERROR] ${template.name}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`  Created: ${created}`);
  console.log(`  Errors:  ${errors}`);
  console.log(`  Templates directory: ${TEMPLATES_DIR}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Fatal error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
