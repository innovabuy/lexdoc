const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedFolders() {
  console.log('📁 Création arborescence dossiers...');

  // Trouver le tenant Pragmavox
  const tenant = await prisma.tenant.findFirst({
    where: { email: 'contact@pragmavox.fr' },
  });

  if (!tenant) {
    console.error('❌ Tenant Pragmavox non trouvé');
    return;
  }

  console.log(`✅ Tenant : ${tenant.name}`);

  // Trouver l'admin du tenant
  const admin = await prisma.user.findFirst({
    where: { tenantId: tenant.id, role: 'ADMIN' },
  });

  if (!admin) {
    console.error('❌ Admin non trouvé');
    return;
  }

  console.log(`✅ Admin : ${admin.email}`);

  // Trouver ou créer des clients
  let clientTechCorp = await prisma.client.findFirst({
    where: { tenantId: tenant.id, companyName: 'Tech Corp SAS' },
  });

  if (!clientTechCorp) {
    clientTechCorp = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        type: 'COMPANY',
        companyName: 'Tech Corp SAS',
        email: 'contact@techcorp.fr',
      },
    });
    console.log('   ✅ Client créé : Tech Corp SAS');
  }

  let clientStartupX = await prisma.client.findFirst({
    where: { tenantId: tenant.id, companyName: 'StartupX SARL' },
  });

  if (!clientStartupX) {
    clientStartupX = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        type: 'COMPANY',
        companyName: 'StartupX SARL',
        email: 'hello@startupx.fr',
      },
    });
    console.log('   ✅ Client créé : StartupX SARL');
  }

  let clientInnovCo = await prisma.client.findFirst({
    where: { tenantId: tenant.id, companyName: 'InnovCo SAS' },
  });

  if (!clientInnovCo) {
    clientInnovCo = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        type: 'COMPANY',
        companyName: 'InnovCo SAS',
        email: 'contact@innovco.fr',
      },
    });
    console.log('   ✅ Client créé : InnovCo SAS');
  }

  // Compter les dossiers existants
  const existingCount = await prisma.folder.count({
    where: { tenantId: tenant.id },
  });

  if (existingCount >= 10) {
    console.log(`✅ ${existingCount} dossiers déjà présents - arborescence complète`);
    return;
  }

  console.log(`📊 ${existingCount} dossiers existants`);

  // Helper pour créer un dossier
  async function createFolderIfNotExists(data) {
    const existing = await prisma.folder.findFirst({
      where: {
        tenantId: data.tenantId,
        title: data.title,
      },
    });

    if (existing) {
      console.log(`   ⏭️  Existe : ${data.title}`);
      return existing;
    }

    const folder = await prisma.folder.create({ data });
    console.log(`   ✅ Créé : ${data.title}`);
    return folder;
  }

  // Générer une référence unique
  const refPrefix = 'DOS-2026-';
  let refCounter = existingCount + 1;
  const getRef = () => refPrefix + String(refCounter++).padStart(3, '0');

  // Créer les dossiers pour Tech Corp
  console.log('📁 Dossiers Tech Corp...');

  await createFolderIfNotExists({
    tenantId: tenant.id,
    reference: getRef(),
    title: 'Tech Corp - Litige Commercial',
    description: 'Contentieux avec fournisseur',
    type: 'LITIGATION',
    color: '#EF4444',
    clientId: clientTechCorp.id,
    createdById: admin.id,
  });

  await createFolderIfNotExists({
    tenantId: tenant.id,
    reference: getRef(),
    title: 'Tech Corp - Contrat Distribution',
    description: 'Négociation contrat de distribution',
    type: 'CONTRACT',
    color: '#10B981',
    clientId: clientTechCorp.id,
    createdById: admin.id,
  });

  // Créer les dossiers pour StartupX
  console.log('📁 Dossiers StartupX...');

  await createFolderIfNotExists({
    tenantId: tenant.id,
    reference: getRef(),
    title: 'StartupX - Levée de Fonds',
    description: 'Série A - Documentation juridique',
    type: 'BUSINESS',
    color: '#8B5CF6',
    clientId: clientStartupX.id,
    createdById: admin.id,
  });

  await createFolderIfNotExists({
    tenantId: tenant.id,
    reference: getRef(),
    title: 'StartupX - Pacte Associés',
    description: 'Rédaction pacte d\'associés',
    type: 'BUSINESS',
    color: '#F59E0B',
    clientId: clientStartupX.id,
    createdById: admin.id,
  });

  // Créer les dossiers pour InnovCo
  console.log('📁 Dossiers InnovCo...');

  await createFolderIfNotExists({
    tenantId: tenant.id,
    reference: getRef(),
    title: 'InnovCo - Cession Parts Sociales',
    description: 'Cession de 30% des parts',
    type: 'BUSINESS',
    color: '#EC4899',
    clientId: clientInnovCo.id,
    createdById: admin.id,
  });

  await createFolderIfNotExists({
    tenantId: tenant.id,
    reference: getRef(),
    title: 'InnovCo - Propriété Intellectuelle',
    description: 'Dépôt de marque et brevets',
    type: 'INTELLECTUAL',
    color: '#06B6D4',
    clientId: clientInnovCo.id,
    createdById: admin.id,
  });

  await createFolderIfNotExists({
    tenantId: tenant.id,
    reference: getRef(),
    title: 'InnovCo - Contrat de Travail',
    description: 'Recrutement CTO',
    type: 'LABOR',
    color: '#14B8A6',
    clientId: clientInnovCo.id,
    createdById: admin.id,
  });

  // Compter les résultats
  const totalFolders = await prisma.folder.count({
    where: { tenantId: tenant.id },
  });

  const totalClients = await prisma.client.count({
    where: { tenantId: tenant.id },
  });

  console.log('');
  console.log('✅ Arborescence créée avec succès !');
  console.log(`   📁 Dossiers : ${totalFolders}`);
  console.log(`   👥 Clients : ${totalClients}`);
}

seedFolders()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
