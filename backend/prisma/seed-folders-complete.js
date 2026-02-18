const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedFolders() {
  console.log('📁 Création arborescence dossiers...');

  // Trouver le premier tenant actif (pas system)
  const tenant = await prisma.tenant.findFirst({
    where: {
      isActive: true,
      NOT: { email: 'system@lexdoc.fr' },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!tenant) {
    console.error('❌ Aucun tenant utilisateur trouvé');
    return;
  }

  console.log(`✅ Tenant trouvé : ${tenant.name}`);

  // Vérifier si les dossiers existent déjà
  const existingCount = await prisma.folder.count({
    where: { tenantId: tenant.id },
  });

  if (existingCount >= 11) {
    console.log(`✅ ${existingCount} dossiers déjà présents - arborescence complète`);
    return;
  }

  console.log(`📊 ${existingCount} dossiers existants - ajout des manquants...`);

  // Fonction helper pour créer ou récupérer un dossier
  async function getOrCreateFolder(data) {
    let folder = await prisma.folder.findFirst({
      where: { tenantId: data.tenantId, name: data.name, parentId: data.parentId || null },
    });
    if (!folder) {
      folder = await prisma.folder.create({ data });
      console.log(`   ✅ Créé : ${data.name}`);
    } else {
      console.log(`   ⏭️  Existe : ${data.name}`);
    }
    return folder;
  }

  // Créer les dossiers racine
  console.log('📁 Dossiers racine...');

  const folderClients = await getOrCreateFolder({
    tenantId: tenant.id,
    name: 'Clients',
    description: 'Dossiers clients du cabinet',
    color: '#3B82F6',
  });

  const folderLitiges = await getOrCreateFolder({
    tenantId: tenant.id,
    name: 'Litiges',
    description: 'Contentieux en cours',
    color: '#EF4444',
  });

  const folderSocietes = await getOrCreateFolder({
    tenantId: tenant.id,
    name: 'Sociétés',
    description: 'Droit des sociétés',
    color: '#8B5CF6',
  });

  await getOrCreateFolder({
    tenantId: tenant.id,
    name: 'Contrats',
    description: 'Contrats commerciaux',
    color: '#10B981',
  });

  // Sous-dossiers Clients
  console.log('📁 Sous-dossiers Clients...');

  await getOrCreateFolder({
    tenantId: tenant.id,
    name: 'Tech Corp',
    clientName: 'Tech Corp SAS',
    clientEmail: 'contact@techcorp.fr',
    color: '#06B6D4',
    parentId: folderClients.id,
  });

  await getOrCreateFolder({
    tenantId: tenant.id,
    name: 'StartupX',
    clientName: 'StartupX SARL',
    clientEmail: 'hello@startupx.fr',
    color: '#F59E0B',
    parentId: folderClients.id,
  });

  await getOrCreateFolder({
    tenantId: tenant.id,
    name: 'InnovCo',
    clientName: 'InnovCo SAS',
    clientEmail: 'contact@innovco.fr',
    color: '#EC4899',
    parentId: folderClients.id,
  });

  // Sous-dossiers Litiges
  console.log('📁 Sous-dossiers Litiges...');

  await getOrCreateFolder({
    tenantId: tenant.id,
    name: 'En cours',
    description: 'Litiges actifs',
    color: '#F87171',
    parentId: folderLitiges.id,
  });

  await getOrCreateFolder({
    tenantId: tenant.id,
    name: 'Clos',
    description: 'Litiges terminés',
    color: '#9CA3AF',
    parentId: folderLitiges.id,
  });

  // Sous-dossiers Sociétés
  console.log('📁 Sous-dossiers Sociétés...');

  await getOrCreateFolder({
    tenantId: tenant.id,
    name: 'Cessions',
    description: 'Cessions de parts et actions',
    color: '#A78BFA',
    parentId: folderSocietes.id,
  });

  await getOrCreateFolder({
    tenantId: tenant.id,
    name: 'Créations',
    description: 'Créations de sociétés',
    color: '#C4B5FD',
    parentId: folderSocietes.id,
  });

  // Compter les résultats
  const totalFolders = await prisma.folder.count({
    where: { tenantId: tenant.id },
  });

  console.log('');
  console.log('✅ Arborescence créée avec succès !');
  console.log(`   Total : ${totalFolders} dossiers`);
  console.log('');
  console.log('   📁 Clients');
  console.log('      └── Tech Corp');
  console.log('      └── StartupX');
  console.log('      └── InnovCo');
  console.log('   📁 Litiges');
  console.log('      └── En cours');
  console.log('      └── Clos');
  console.log('   📁 Sociétés');
  console.log('      └── Cessions');
  console.log('      └── Créations');
  console.log('   📁 Contrats');
}

seedFolders()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
