/**
 * Seed template records in database for the default .docx templates
 * Run: node scripts/seed-templates.js
 */

const prisma = require('../src/config/database');

const TEMPLATES = [
  {
    name: 'Convention d\'honoraires',
    description: 'Convention d\'honoraires entre l\'avocat et le client, avec mentions obligatoires.',
    category: 'contrats',
    sourceFileUrl: 'convention-honoraires.docx',
    folderType: 'les_deux',
    folderNature: null,
    isSystem: true,
    variables: [
      { key: 'cabinet.nom', label: 'Nom du cabinet', required: true },
      { key: 'cabinet.adresse', label: 'Adresse du cabinet', required: true },
      { key: 'cabinet.barreau', label: 'Barreau', required: true },
      { key: 'cabinet.toque', label: 'Toque', required: false },
      { key: 'avocat.nom_complet', label: 'Nom complet de l\'avocat', required: true },
      { key: 'client.civilite', label: 'Civilite du client', required: false },
      { key: 'client.nom', label: 'Nom du client', required: true },
      { key: 'client.prenom', label: 'Prenom du client', required: true },
      { key: 'client.adresse', label: 'Adresse du client', required: true },
      { key: 'client.email', label: 'Email du client', required: false },
      { key: 'dossier.titre', label: 'Titre du dossier', required: true },
      { key: 'dossier.reference', label: 'Reference du dossier', required: true },
    ],
  },
  {
    name: 'Lettre de mission',
    description: 'Lettre de mission confirmant la prise en charge du dossier.',
    category: 'courriers',
    sourceFileUrl: 'lettre-mission.docx',
    folderType: 'les_deux',
    folderNature: null,
    isSystem: true,
    variables: [
      { key: 'cabinet.nom', label: 'Nom du cabinet', required: true },
      { key: 'cabinet.adresse', label: 'Adresse du cabinet', required: true },
      { key: 'cabinet.barreau', label: 'Barreau', required: true },
      { key: 'avocat.nom_complet', label: 'Nom de l\'avocat', required: true },
      { key: 'client.civilite', label: 'Civilite', required: false },
      { key: 'client.nom', label: 'Nom du client', required: true },
      { key: 'client.prenom', label: 'Prenom', required: false },
      { key: 'client.adresse', label: 'Adresse du client', required: true },
      { key: 'dossier.titre', label: 'Titre du dossier', required: true },
      { key: 'dossier.reference', label: 'Reference', required: true },
    ],
  },
  {
    name: 'Mise en demeure',
    description: 'Courrier de mise en demeure adresse a la partie adverse.',
    category: 'courriers',
    sourceFileUrl: 'mise-en-demeure.docx',
    folderType: 'les_deux',
    folderNature: null,
    isSystem: true,
    variables: [
      { key: 'cabinet.nom', label: 'Nom du cabinet', required: true },
      { key: 'cabinet.adresse', label: 'Adresse', required: true },
      { key: 'cabinet.telephone', label: 'Telephone', required: false },
      { key: 'cabinet.barreau', label: 'Barreau', required: true },
      { key: 'avocat.nom_complet', label: 'Avocat', required: true },
      { key: 'client.civilite', label: 'Civilite client', required: false },
      { key: 'client.nom', label: 'Nom du client', required: true },
      { key: 'client.prenom', label: 'Prenom du client', required: true },
      { key: 'client.adresse', label: 'Adresse du client', required: true },
      { key: 'dossier.titre', label: 'Titre du dossier', required: true },
      { key: 'dossier.reference', label: 'Reference', required: true },
    ],
  },
  {
    name: 'Assignation TJ',
    description: 'Assignation devant le Tribunal Judiciaire avec mentions obligatoires.',
    category: 'actes_procedure',
    sourceFileUrl: 'assignation-tj.docx',
    folderType: 'judiciaire',
    folderNature: null,
    isSystem: true,
    variables: [
      { key: 'cabinet.nom', label: 'Nom du cabinet', required: true },
      { key: 'cabinet.adresse', label: 'Adresse', required: true },
      { key: 'cabinet.barreau', label: 'Barreau', required: true },
      { key: 'cabinet.toque', label: 'Toque', required: true },
      { key: 'avocat.nom_complet', label: 'Avocat', required: true },
      { key: 'client.civilite', label: 'Civilite', required: false },
      { key: 'client.nom', label: 'Nom du client', required: true },
      { key: 'client.prenom', label: 'Prenom', required: true },
      { key: 'client.adresse', label: 'Adresse du client', required: true },
      { key: 'client.date_naissance', label: 'Date de naissance', required: true },
      { key: 'client.lieu_naissance', label: 'Lieu de naissance', required: true },
      { key: 'client.nationalite', label: 'Nationalite', required: true },
      { key: 'dossier.titre', label: 'Titre du dossier', required: true },
      { key: 'dossier.juridiction', label: 'Juridiction', required: true },
      { key: 'dossier.chambre', label: 'Chambre', required: false },
      { key: 'dossier.date_audience', label: 'Date d\'audience', required: false },
      { key: 'dossier.rg', label: 'Numero RG', required: false },
    ],
  },
];

async function main() {
  // Get the first tenant
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error('No tenant found! Run the app first.');
    process.exit(1);
  }
  console.log(`Tenant: ${tenant.name} (${tenant.id})`);

  for (const tpl of TEMPLATES) {
    // Check if already exists
    const existing = await prisma.template.findFirst({
      where: { tenantId: tenant.id, name: tpl.name, isSystem: true },
    });

    if (existing) {
      // Update
      await prisma.template.update({
        where: { id: existing.id },
        data: {
          description: tpl.description,
          category: tpl.category,
          sourceFileUrl: tpl.sourceFileUrl,
          folderType: tpl.folderType,
          folderNature: tpl.folderNature,
          variables: tpl.variables,
        },
      });
      console.log(`Updated: ${tpl.name} (${existing.id})`);
    } else {
      // Create
      const created = await prisma.template.create({
        data: {
          tenantId: tenant.id,
          name: tpl.name,
          description: tpl.description,
          category: tpl.category,
          sourceFileUrl: tpl.sourceFileUrl,
          folderType: tpl.folderType,
          folderNature: tpl.folderNature,
          isSystem: true,
          variables: tpl.variables,
        },
      });
      console.log(`Created: ${tpl.name} (${created.id})`);
    }
  }

  console.log('\nDone! Templates seeded.');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
