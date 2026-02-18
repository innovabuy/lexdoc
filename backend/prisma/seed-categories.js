/**
 * Seed script for FolderCategories and TemplateCategories
 *
 * Run with: node prisma/seed-categories.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding categories...\n');

  // Get the first tenant (Pragmavox)
  const tenant = await prisma.tenant.findFirst({
    where: { email: 'contact@pragmavox.fr' }
  });

  if (!tenant) {
    console.error('❌ No tenant found. Run the main seed first.');
    process.exit(1);
  }

  console.log(`📁 Using tenant: ${tenant.name} (${tenant.id})\n`);

  // ============================================================================
  // FOLDER CATEGORIES (Document organization)
  // ============================================================================

  console.log('Creating folder categories...');

  // Parent categories
  const catContentieux = await prisma.folderCategory.create({
    data: {
      name: 'Contentieux',
      description: 'Documents relatifs aux procédures contentieuses',
      color: '#EF4444',
      icon: 'Scale',
      displayOrder: 1,
      tenantId: tenant.id,
    },
  });

  const catCorporate = await prisma.folderCategory.create({
    data: {
      name: 'Corporate',
      description: 'Documents de droit des sociétés',
      color: '#3B82F6',
      icon: 'Building',
      displayOrder: 2,
      tenantId: tenant.id,
    },
  });

  const catContrats = await prisma.folderCategory.create({
    data: {
      name: 'Contrats',
      description: 'Contrats et conventions',
      color: '#10B981',
      icon: 'FileSignature',
      displayOrder: 3,
      tenantId: tenant.id,
    },
  });

  const catPiecesClient = await prisma.folderCategory.create({
    data: {
      name: 'Pièces Client',
      description: 'Documents fournis par le client',
      color: '#F59E0B',
      icon: 'Upload',
      displayOrder: 4,
      tenantId: tenant.id,
    },
  });

  // Child categories (Contentieux)
  await prisma.folderCategory.createMany({
    data: [
      {
        name: 'Assignations',
        description: 'Actes d\'assignation',
        color: '#F87171',
        icon: 'FileText',
        displayOrder: 1,
        parentId: catContentieux.id,
        tenantId: tenant.id,
      },
      {
        name: 'Conclusions',
        description: 'Conclusions et mémoires',
        color: '#FB923C',
        icon: 'FileText',
        displayOrder: 2,
        parentId: catContentieux.id,
        tenantId: tenant.id,
      },
      {
        name: 'Pièces',
        description: 'Pièces du dossier',
        color: '#FBBF24',
        icon: 'Paperclip',
        displayOrder: 3,
        parentId: catContentieux.id,
        tenantId: tenant.id,
      },
      {
        name: 'Jugements',
        description: 'Décisions de justice',
        color: '#A78BFA',
        icon: 'Gavel',
        displayOrder: 4,
        parentId: catContentieux.id,
        tenantId: tenant.id,
      },
    ],
  });

  // Child categories (Corporate)
  await prisma.folderCategory.createMany({
    data: [
      {
        name: 'Statuts',
        description: 'Statuts et modifications',
        color: '#60A5FA',
        icon: 'FileText',
        displayOrder: 1,
        parentId: catCorporate.id,
        tenantId: tenant.id,
      },
      {
        name: 'PV Assemblées',
        description: 'Procès-verbaux d\'assemblées',
        color: '#34D399',
        icon: 'Users',
        displayOrder: 2,
        parentId: catCorporate.id,
        tenantId: tenant.id,
      },
      {
        name: 'Cessions',
        description: 'Documents de cession',
        color: '#818CF8',
        icon: 'ArrowRightLeft',
        displayOrder: 3,
        parentId: catCorporate.id,
        tenantId: tenant.id,
      },
      {
        name: 'Garanties',
        description: 'Garanties d\'actif et passif',
        color: '#F472B6',
        icon: 'Shield',
        displayOrder: 4,
        parentId: catCorporate.id,
        tenantId: tenant.id,
      },
    ],
  });

  // Child categories (Contrats)
  await prisma.folderCategory.createMany({
    data: [
      {
        name: 'Contrats de travail',
        description: 'CDI, CDD, avenants',
        color: '#2DD4BF',
        icon: 'Briefcase',
        displayOrder: 1,
        parentId: catContrats.id,
        tenantId: tenant.id,
      },
      {
        name: 'Contrats commerciaux',
        description: 'Vente, distribution, partenariat',
        color: '#A3E635',
        icon: 'Handshake',
        displayOrder: 2,
        parentId: catContrats.id,
        tenantId: tenant.id,
      },
      {
        name: 'Baux',
        description: 'Baux commerciaux et professionnels',
        color: '#FB7185',
        icon: 'Home',
        displayOrder: 3,
        parentId: catContrats.id,
        tenantId: tenant.id,
      },
    ],
  });

  const folderCategoriesCount = await prisma.folderCategory.count({ where: { tenantId: tenant.id } });
  console.log(`✅ Created ${folderCategoriesCount} folder categories\n`);

  // ============================================================================
  // TEMPLATE CATEGORIES
  // ============================================================================

  console.log('Creating template categories...');

  await prisma.templateCategory.createMany({
    data: [
      {
        name: 'Contentieux',
        description: 'Templates pour les procédures contentieuses',
        icon: 'Scale',
        color: '#EF4444',
        displayOrder: 1,
        tenantId: tenant.id,
      },
      {
        name: 'Corporate',
        description: 'Templates de droit des sociétés',
        icon: 'Building',
        color: '#3B82F6',
        displayOrder: 2,
        tenantId: tenant.id,
      },
      {
        name: 'Contrats',
        description: 'Templates de contrats',
        icon: 'FileSignature',
        color: '#10B981',
        displayOrder: 3,
        tenantId: tenant.id,
      },
      {
        name: 'Courriers',
        description: 'Templates de courriers',
        icon: 'Mail',
        color: '#8B5CF6',
        displayOrder: 4,
        tenantId: tenant.id,
      },
      {
        name: 'Immobilier',
        description: 'Templates immobilier',
        icon: 'Home',
        color: '#F59E0B',
        displayOrder: 5,
        tenantId: tenant.id,
      },
      {
        name: 'Social',
        description: 'Templates droit social',
        icon: 'Users',
        color: '#EC4899',
        displayOrder: 6,
        tenantId: tenant.id,
      },
      {
        name: 'Propriété intellectuelle',
        description: 'Templates PI/Marques/Brevets',
        icon: 'Lightbulb',
        color: '#14B8A6',
        displayOrder: 7,
        tenantId: tenant.id,
      },
    ],
  });

  const templateCategoriesCount = await prisma.templateCategory.count({ where: { tenantId: tenant.id } });
  console.log(`✅ Created ${templateCategoriesCount} template categories\n`);

  // ============================================================================
  // SAMPLE DOCUMENT REQUEST
  // ============================================================================

  console.log('Creating sample document request...');

  // Get first folder and user
  const folder = await prisma.folder.findFirst({ where: { tenantId: tenant.id } });
  const user = await prisma.user.findFirst({ where: { tenantId: tenant.id } });

  if (folder && user) {
    await prisma.documentRequest.create({
      data: {
        title: 'Kbis de moins de 3 mois',
        description: 'Merci de fournir un extrait Kbis de votre société datant de moins de 3 mois pour la constitution du dossier.',
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        folderId: folder.id,
        createdById: user.id,
        tenantId: tenant.id,
      },
    });

    await prisma.documentRequest.create({
      data: {
        title: 'Pièce d\'identité',
        description: 'Copie recto-verso de votre pièce d\'identité en cours de validité.',
        status: 'PENDING',
        priority: 'NORMAL',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 jours
        folderId: folder.id,
        createdById: user.id,
        tenantId: tenant.id,
      },
    });

    await prisma.documentRequest.create({
      data: {
        title: 'Derniers bilans comptables',
        description: 'Les 3 derniers bilans comptables certifiés par votre expert-comptable.',
        status: 'PENDING',
        priority: 'URGENT',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 jours
        folderId: folder.id,
        createdById: user.id,
        tenantId: tenant.id,
      },
    });

    console.log('✅ Created 3 sample document requests\n');
  } else {
    console.log('⚠️ No folder or user found, skipping document requests\n');
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log('📊 Summary:');
  console.log(`   - Folder categories: ${folderCategoriesCount}`);
  console.log(`   - Template categories: ${templateCategoriesCount}`);
  console.log(`   - Document requests: ${await prisma.documentRequest.count({ where: { tenantId: tenant.id } })}`);
  console.log('\n🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
