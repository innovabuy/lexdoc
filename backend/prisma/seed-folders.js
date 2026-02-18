const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedFolders() {
  console.log('📁 Création arborescence dossiers...');

  // Trouver un tenant utilisateur (pas system)
  const tenant = await prisma.tenant.findFirst({
    where: {
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!tenant) {
    console.error('❌ Aucun tenant utilisateur trouvé');
    return;
  }

  const existing = await prisma.folder.count({
    where: { tenantId: tenant.id },
  });

  if (existing > 0) {
    console.log(`✅ ${existing} dossiers déjà présents pour ${tenant.name}`);
    return;
  }

  console.log(`✅ Tenant : ${tenant.name}`);

  // Créer le dossier parent "Clients"
  const folderClients = await prisma.folder.create({
    data: {
      tenantId: tenant.id,
      name: 'Clients',
      color: '#3B82F6',
    },
  });

  // Créer les sous-dossiers et dossiers racine
  await prisma.folder.createMany({
    data: [
      {
        tenantId: tenant.id,
        name: 'Tech Corp',
        clientName: 'Tech Corp SAS',
        color: '#10B981',
        parentId: folderClients.id,
      },
      {
        tenantId: tenant.id,
        name: 'StartupX',
        clientName: 'StartupX SARL',
        color: '#F59E0B',
        parentId: folderClients.id,
      },
      {
        tenantId: tenant.id,
        name: 'Litiges',
        color: '#EF4444',
      },
      {
        tenantId: tenant.id,
        name: 'Sociétés',
        color: '#8B5CF6',
      },
      {
        tenantId: tenant.id,
        name: 'Contrats',
        color: '#10B981',
      },
    ],
  });

  console.log('✅ 6 dossiers créés !');
}

seedFolders()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
