/**
 * Seed system and standard blocks into BuilderBlock
 * Run: node scripts/seed-blocks.js
 */

const prisma = require('../src/config/database');

const SYSTEM_BLOCKS = [
  {
    title: 'En-tete cabinet',
    category: 'INTRO',
    isSystem: true,
    isMandatory: false,
    content: '{cabinet.nom}\n{cabinet.adresse}\nTel: {cabinet.telephone} — Email: {cabinet.email}\nBarreau de {cabinet.barreau} — Toque {cabinet.toque}',
    variables: [
      { key: 'cabinet.nom', label: 'Nom du cabinet' },
      { key: 'cabinet.adresse', label: 'Adresse du cabinet' },
      { key: 'cabinet.telephone', label: 'Telephone' },
      { key: 'cabinet.email', label: 'Email' },
      { key: 'cabinet.barreau', label: 'Barreau' },
      { key: 'cabinet.toque', label: 'Toque' },
    ],
    tags: ['system', 'en-tete'],
    displayOrder: 0,
  },
  {
    title: 'Pied de page',
    category: 'SIGNATURE',
    isSystem: true,
    isMandatory: false,
    content: '{cabinet.nom} — SIRET {cabinet.siret} — Barreau de {cabinet.barreau} — Toque {cabinet.toque}\n{cabinet.adresse} — {cabinet.telephone}',
    variables: [
      { key: 'cabinet.nom', label: 'Nom du cabinet' },
      { key: 'cabinet.siret', label: 'SIRET' },
      { key: 'cabinet.barreau', label: 'Barreau' },
      { key: 'cabinet.toque', label: 'Toque' },
      { key: 'cabinet.adresse', label: 'Adresse' },
      { key: 'cabinet.telephone', label: 'Telephone' },
    ],
    tags: ['system', 'pied-de-page'],
    displayOrder: 100,
  },
  {
    title: 'Signature + Date',
    category: 'SIGNATURE',
    isSystem: true,
    isMandatory: false,
    content: 'Fait a {cabinet.ville}, le {date}\n\n{avocat.signature}\nAvocat au Barreau de {cabinet.barreau}',
    variables: [
      { key: 'cabinet.ville', label: 'Ville du cabinet' },
      { key: 'date', label: 'Date du jour' },
      { key: 'avocat.signature', label: 'Signature de l\'avocat' },
      { key: 'cabinet.barreau', label: 'Barreau' },
    ],
    tags: ['system', 'signature'],
    displayOrder: 99,
  },
];

const STANDARD_BLOCKS = [
  {
    title: 'Identification des parties',
    category: 'INTRO',
    content: 'ENTRE LES SOUSSIGNES :\n\nLe Cabinet {cabinet.nom}, represente par Me {avocat.nom_complet},\nAvocat au Barreau de {cabinet.barreau}, Toque n. {cabinet.toque},\nci-apres denomme "l\'Avocat",\n\nET\n\n{client.civilite} {client.prenom} {client.nom},\nNe(e) le {client.date_naissance} a {client.lieu_naissance},\nDe nationalite {client.nationalite},\nDemeurant : {client.adresse}\nci-apres denomme(e) "le Client"',
    variables: [
      { key: 'cabinet.nom' }, { key: 'avocat.nom_complet' }, { key: 'cabinet.barreau' },
      { key: 'cabinet.toque' }, { key: 'client.civilite' }, { key: 'client.prenom' },
      { key: 'client.nom' }, { key: 'client.date_naissance' }, { key: 'client.lieu_naissance' },
      { key: 'client.nationalite' }, { key: 'client.adresse' },
    ],
    tags: ['standard', 'parties'],
    displayOrder: 1,
  },
  {
    title: 'Objet de la mission',
    category: 'CLAUSE',
    content: 'Le Client confie au Cabinet la mission suivante :\n{dossier.titre}\n\nCette mission comprend le conseil juridique, la redaction d\'actes et, le cas echeant, la representation en justice.',
    variables: [{ key: 'dossier.titre' }],
    tags: ['standard', 'mission'],
    displayOrder: 2,
  },
  {
    title: 'Conditions d\'honoraires',
    category: 'CLAUSE',
    content: 'Les honoraires de l\'Avocat sont fixes comme suit :\n\n- Honoraire forfaitaire : ______ EUR HT\n- Ou honoraire au temps passe : ______ EUR HT / heure\n\nLes honoraires seront factures mensuellement et payables a 30 jours.\nUne provision de ______ EUR sera demandee a la signature de la presente convention.',
    variables: [],
    tags: ['standard', 'honoraires'],
    displayOrder: 3,
  },
  {
    title: 'Clause de confidentialite',
    category: 'CLAUSE',
    content: 'Les parties s\'engagent a considerer comme strictement confidentiel l\'ensemble des informations echangees dans le cadre de la presente mission.\n\nCette obligation de confidentialite survivra a la cessation de la mission pour une duree de deux (2) ans.',
    variables: [],
    tags: ['standard', 'confidentialite'],
    displayOrder: 4,
  },
  {
    title: 'Clause d\'election de domicile',
    category: 'CLAUSE',
    content: 'Pour l\'execution des presentes, les parties font election de domicile :\n- L\'Avocat : {cabinet.adresse}\n- Le Client : {client.adresse}',
    variables: [{ key: 'cabinet.adresse' }, { key: 'client.adresse' }],
    tags: ['standard', 'domicile'],
    displayOrder: 5,
  },
  {
    title: 'Clause de juridiction',
    category: 'DISPOSITIF',
    content: 'En cas de litige relatif a l\'interpretation ou a l\'execution de la presente convention, les parties conviennent de soumettre leur differend au Tribunal Judiciaire de {dossier.juridiction}.',
    variables: [{ key: 'dossier.juridiction' }],
    tags: ['standard', 'juridiction'],
    displayOrder: 6,
  },
];

async function main() {
  // Get the user's tenant (Cabinet Pragmavox)
  const user = await prisma.user.findFirst({
    where: { email: 'yves-marie.bienaime@pragmavox.fr' },
  });
  if (!user) {
    console.error('User not found');
    process.exit(1);
  }
  const tenantId = user.tenantId;
  console.log(`Tenant: ${tenantId}`);

  // Seed system blocks
  for (const block of SYSTEM_BLOCKS) {
    const existing = await prisma.builderBlock.findFirst({
      where: { tenantId, title: block.title, isSystem: true },
    });

    if (existing) {
      await prisma.builderBlock.update({
        where: { id: existing.id },
        data: {
          content: block.content,
          variables: block.variables,
          tags: block.tags,
          displayOrder: block.displayOrder,
          category: block.category,
          isMandatory: block.isMandatory,
        },
      });
      console.log(`Updated system: ${block.title}`);
    } else {
      await prisma.builderBlock.create({
        data: {
          tenantId,
          ...block,
          createdById: user.id,
        },
      });
      console.log(`Created system: ${block.title}`);
    }
  }

  // Seed standard blocks
  for (const block of STANDARD_BLOCKS) {
    const existing = await prisma.builderBlock.findFirst({
      where: { tenantId, title: block.title, isSystem: false, tags: { hasSome: ['standard'] } },
    });

    if (existing) {
      await prisma.builderBlock.update({
        where: { id: existing.id },
        data: {
          content: block.content,
          variables: block.variables,
          tags: block.tags,
          displayOrder: block.displayOrder,
          category: block.category,
        },
      });
      console.log(`Updated standard: ${block.title}`);
    } else {
      await prisma.builderBlock.create({
        data: {
          tenantId,
          ...block,
          isSystem: false,
          isMandatory: false,
          createdById: user.id,
        },
      });
      console.log(`Created standard: ${block.title}`);
    }
  }

  console.log('\nDone! Blocks seeded.');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
