/**
 * Create default .docx template files with proper variable placeholders
 * Run: node scripts/create-default-templates.js
 */

const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require('docx');
const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

async function createConventionHonoraires() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ children: [new TextRun({ text: '{cabinet_nom}', bold: true, size: 28 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: '{cabinet_adresse}', size: 20 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: 'Tel: {cabinet_telephone} — Email: {cabinet_email}', size: 18 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: 'Toque: {cabinet_toque} — Barreau de {cabinet_barreau}', size: 18 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'CONVENTION D\'HONORAIRES', bold: true })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'Dossier : {dossier_reference} — {dossier_titre}', size: 22 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'ENTRE LES SOUSSIGNES :', bold: true, size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'Le Cabinet {cabinet_nom}, representee par Me {avocat_nom_complet},', size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: 'Avocat au Barreau de {cabinet_barreau}, Toque n. {cabinet_toque},', size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: 'ci-apres denommee "l\'Avocat",', italics: true, size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'ET', bold: true, size: 22 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: '{client_civilite} {client_prenom} {client_nom},', size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: 'Demeurant : {client_adresse}', size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: 'Email : {client_email} — Tel : {client_telephone}', size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: 'ci-apres denommee "le Client",', italics: true, size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'IL A ETE CONVENU CE QUI SUIT :', bold: true, size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'Article 1 — Objet de la mission' })] }),
        new Paragraph({ children: [new TextRun({ text: 'Le Client confie a l\'Avocat la mission suivante : {dossier_titre}.', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'Article 2 — Honoraires' })] }),
        new Paragraph({ children: [new TextRun({ text: 'Les honoraires de l\'Avocat seront calcules selon le temps passe, au taux horaire de _____ EUR HT.', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'Article 3 — Modalites de paiement' })] }),
        new Paragraph({ children: [new TextRun({ text: 'Les honoraires seront factures mensuellement et payables a 30 jours.', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'Fait a {cabinet_barreau}, le {date}', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'L\'Avocat                                                    Le Client', size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '{avocat_signature}', size: 22 })] }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(TEMPLATES_DIR, 'convention-honoraires.docx'), buffer);
  console.log('Created: convention-honoraires.docx');
}

async function createLettreMission() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ children: [new TextRun({ text: '{cabinet_nom}', bold: true, size: 28 })], alignment: AlignmentType.RIGHT }),
        new Paragraph({ children: [new TextRun({ text: '{cabinet_adresse}', size: 18 })], alignment: AlignmentType.RIGHT }),
        new Paragraph({ children: [new TextRun({ text: '{cabinet_email}', size: 18 })], alignment: AlignmentType.RIGHT }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: '{client_civilite} {client_prenom} {client_nom}', size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '{client_adresse}', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: '{cabinet_barreau}, le {date}', size: 22 })], alignment: AlignmentType.RIGHT }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'Objet : Lettre de mission — {dossier_titre}', bold: true, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: 'Ref : {dossier_reference}', size: 20 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: '{client_civilite} {client_nom},', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'Suite a notre entretien, j\'ai l\'honneur de vous confirmer que j\'accepte de vous assister dans le cadre du dossier mentionne en objet.', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'Ma mission portera sur : {dossier_titre}.', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'Je vous prie d\'agreer, {client_civilite} {client_nom}, l\'expression de mes salutations distinguees.', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: '{avocat_signature}', size: 22 })], alignment: AlignmentType.RIGHT }),
        new Paragraph({ children: [new TextRun({ text: 'Avocat au Barreau de {cabinet_barreau}', size: 18 })], alignment: AlignmentType.RIGHT }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(TEMPLATES_DIR, 'lettre-mission.docx'), buffer);
  console.log('Created: lettre-mission.docx');
}

async function createMiseEnDemeure() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ children: [new TextRun({ text: '{cabinet_nom}', bold: true, size: 28 })], alignment: AlignmentType.RIGHT }),
        new Paragraph({ children: [new TextRun({ text: '{cabinet_adresse}', size: 18 })], alignment: AlignmentType.RIGHT }),
        new Paragraph({ children: [new TextRun({ text: 'Tel: {cabinet_telephone}', size: 18 })], alignment: AlignmentType.RIGHT }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'LETTRE RECOMMANDEE AVEC ACCUSE DE RECEPTION', bold: true, size: 22 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: '{cabinet_barreau}, le {date}', size: 22 })], alignment: AlignmentType.RIGHT }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'A l\'attention de :', bold: true, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '[Destinataire : premiere partie adverse]', size: 22, italics: true })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'Ref : {dossier_reference} — {dossier_titre}', size: 20 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'Objet : MISE EN DEMEURE', bold: true, size: 24 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'Madame, Monsieur,', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'J\'interviens en qualite de conseil de {client_civilite} {client_prenom} {client_nom}, demeurant {client_adresse}.', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'Par la presente, et en application des dispositions legales en vigueur, je vous mets en demeure de ______________ dans un delai de ______ jours a compter de la reception de la presente.', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'A defaut de votre part de satisfaire a cette mise en demeure, mon client se reservera le droit d\'engager toute action judiciaire qu\'il estimera utile a la defense de ses interets.', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'Dans l\'attente de votre reponse, je vous prie d\'agreer l\'expression de mes salutations distinguees.', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: '{avocat_signature}', size: 22 })], alignment: AlignmentType.RIGHT }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(TEMPLATES_DIR, 'mise-en-demeure.docx'), buffer);
  console.log('Created: mise-en-demeure.docx');
}

async function createAssignationTJ() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ASSIGNATION DEVANT LE TRIBUNAL JUDICIAIRE' })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'L\'AN DEUX MILLE VINGT SIX, le {date}', bold: true, size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'A LA REQUETE DE :', bold: true, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '{client_civilite} {client_prenom} {client_nom}', size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: 'Ne(e) le {client_date_naissance} a {client_lieu_naissance}', size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: 'De nationalite {client_nationalite}', size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: 'Demeurant : {client_adresse}', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'Ayant pour avocat constitue :', size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: 'Me {avocat_nom_complet}, Avocat au Barreau de {cabinet_barreau}, Toque {cabinet_toque}', size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '{cabinet_nom} — {cabinet_adresse}', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'A ETE DONNE ASSIGNATION A :', bold: true, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '[Partie adverse]', italics: true, size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'D\'AVOIR A COMPARAITRE devant :', bold: true, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: 'Le Tribunal Judiciaire de {dossier_juridiction}', size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: 'Chambre : {dossier_chambre}', size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: 'A l\'audience du {dossier_date_audience}', size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: 'RG : {dossier_rg}', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'OBJET DE LA DEMANDE', bold: true, size: 24 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: '[Exposer les faits et la demande]', italics: true, size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'PAR CES MOTIFS,', bold: true, size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'Il est demande au Tribunal de :', size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '- [Demande 1]', size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: '- [Demande 2]', size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'Sous toutes reserves.', italics: true, size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: '{avocat_signature}', size: 22 })], alignment: AlignmentType.RIGHT }),
        new Paragraph({ children: [new TextRun({ text: 'Avocat au Barreau de {cabinet_barreau}', size: 18 })], alignment: AlignmentType.RIGHT }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(TEMPLATES_DIR, 'assignation-tj.docx'), buffer);
  console.log('Created: assignation-tj.docx');
}

async function main() {
  console.log('Creating default template .docx files...\n');

  await createConventionHonoraires();
  await createLettreMission();
  await createMiseEnDemeure();
  await createAssignationTJ();

  console.log('\nAll templates created in:', TEMPLATES_DIR);
}

main().catch(console.error);
