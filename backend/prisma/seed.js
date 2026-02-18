const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database (Phase 1A - enrichissement spec UX)...\n');

  // ==========================================================================
  // 1. Tenant (Cabinet) — find existing or create
  // ==========================================================================

  let tenant = await prisma.tenant.findFirst({
    where: { email: 'yves-marie.bienaime@pragmavox.fr' },
  });

  if (!tenant) {
    tenant = await prisma.tenant.findFirst({
      where: { email: 'contact@pragmavox.fr' },
    });
  }

  if (!tenant) {
    tenant = await prisma.tenant.findFirst();
  }

  if (tenant) {
    tenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        legalName: tenant.legalName || 'SELARL Cabinet Pragmavox Avocat',
        siret: tenant.siret || '12345678900001',
        address: tenant.address || '1 Place du Ralliement',
        postalCode: tenant.postalCode || '49100',
        city: tenant.city || 'Angers',
        phone: tenant.phone || '02 41 00 00 00',
        website: tenant.website || 'https://www.pragmavox.fr',
        toque: tenant.toque || 'T-123',
        barreau: tenant.barreau || 'Angers',
      },
    });
    console.log(`✅ Tenant enrichi: ${tenant.name} (${tenant.id})`);
  } else {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Cabinet Pragmavox Avocat',
        email: 'contact@pragmavox.fr',
        siret: '12345678900001',
        address: '1 Place du Ralliement',
        postalCode: '49100',
        city: 'Angers',
        phone: '02 41 00 00 00',
        toque: 'T-123',
        barreau: 'Angers',
        subscriptionTier: 'PRO',
      },
    });
    console.log(`✅ Tenant créé: ${tenant.name} (${tenant.id})`);
  }

  // ==========================================================================
  // 2. User admin
  // ==========================================================================

  let user = await prisma.user.findFirst({
    where: { tenantId: tenant.id, role: 'ADMIN' },
  });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingCompleted: true,
        onboardingStep: 99,
      },
    });
    console.log(`✅ User enrichi: ${user.firstName} ${user.lastName} (${user.role})`);
  } else {
    const passwordHash = await bcrypt.hash('Admin2026!', 12);
    user = await prisma.user.create({
      data: {
        email: 'ym@pragmavox.fr',
        password: passwordHash,
        firstName: 'Yves-Marie',
        lastName: 'Bienaime',
        role: 'ADMIN',
        tenantId: tenant.id,
        onboardingCompleted: false,
        onboardingStep: 0,
      },
    });
    console.log(`✅ User créé: ${user.firstName} ${user.lastName}`);
  }

  // ==========================================================================
  // 3. Client test - Personne Physique
  // ==========================================================================

  const clientPPId = 'seed-client-dupont-pp';
  const clientPP = await prisma.client.upsert({
    where: { id: clientPPId },
    update: {
      civilite: 'M.',
      nationalite: 'Française',
      profession: 'Directeur général',
      situationFamiliale: 'marie',
      nbEnfantsMineurs: 2,
      nbEnfantsMajeurs: 0,
      profileCompletionPercent: 38,
      profileLastStep: 1,
    },
    create: {
      id: clientPPId,
      tenantId: tenant.id,
      type: 'INDIVIDUAL',
      firstName: 'Jean',
      lastName: 'DUPONT',
      email: 'jean.dupont@example.fr',
      phone: '06 12 34 56 78',
      address: '15 rue de la République',
      postalCode: '75001',
      city: 'Paris',
      civilite: 'M.',
      nationalite: 'Française',
      profession: 'Directeur général',
      situationFamiliale: 'marie',
      conjointNom: 'DUPONT',
      conjointPrenom: 'Marie',
      regimeMatrimonial: 'communaute_legale',
      nbEnfantsMineurs: 2,
      nbEnfantsMajeurs: 0,
      profileCompletionPercent: 38,
      profileLastStep: 1,
    },
  });
  console.log(`✅ Client PP: ${clientPP.firstName} ${clientPP.lastName} (profil ${clientPP.profileCompletionPercent}%)`);

  // ==========================================================================
  // 4. Client test - Personne Morale
  // ==========================================================================

  const clientPMId = 'seed-client-techcorp-pm';
  const clientPM = await prisma.client.upsert({
    where: { id: clientPMId },
    update: {
      formeSociale: 'SAS',
      capital: '100 000 €',
      rcs: 'Paris B 123 456 789',
      profileCompletionPercent: 55,
    },
    create: {
      id: clientPMId,
      tenantId: tenant.id,
      type: 'COMPANY',
      companyName: 'Tech Corp SAS',
      email: 'direction@techcorp-seed.fr',
      phone: '01 23 45 67 89',
      address: '100 avenue des Champs-Élysées',
      postalCode: '75008',
      city: 'Paris',
      siret: '98765432100012',
      formeSociale: 'SAS',
      objetSocial: 'Développement et édition de logiciels',
      capital: '100 000 €',
      siege: '100 avenue des Champs-Élysées, 75008 Paris',
      rcs: 'Paris B 123 456 789',
      profileCompletionPercent: 55,
      profileLastStep: 2,
    },
  });
  console.log(`✅ Client PM: ${clientPM.companyName || clientPM.lastName} (profil ${clientPM.profileCompletionPercent}%)`);

  // ==========================================================================
  // 5. Dossier juridique - Cession
  // ==========================================================================

  let dossierJuridique = await prisma.folder.findFirst({
    where: { tenantId: tenant.id, reference: 'DOS-2026-SEED-001' },
  });

  if (!dossierJuridique) {
    dossierJuridique = await prisma.folder.create({
      data: {
        reference: 'DOS-2026-SEED-001',
        title: 'Cession Tech Corp 2026',
        description: 'Cession de parts sociales de Tech Corp SAS',
        type: 'CONTRACT',
        status: 'IN_PROGRESS',
        nature: 'cession',
        color: '#3B82F6',
        tenantId: tenant.id,
        clientId: clientPP.id,
        createdById: user.id,
      },
    });
    console.log(`✅ Dossier juridique créé: ${dossierJuridique.title} (${dossierJuridique.reference})`);
  } else {
    dossierJuridique = await prisma.folder.update({
      where: { id: dossierJuridique.id },
      data: { nature: 'cession' },
    });
    console.log(`✅ Dossier juridique enrichi: ${dossierJuridique.title}`);
  }

  // ==========================================================================
  // 6. Dossier judiciaire - Litige
  // ==========================================================================

  let dossierJudiciaire = await prisma.folder.findFirst({
    where: { tenantId: tenant.id, reference: 'DOS-2026-SEED-002' },
  });

  if (!dossierJudiciaire) {
    dossierJudiciaire = await prisma.folder.create({
      data: {
        reference: 'DOS-2026-SEED-002',
        title: 'Litige Commercial Alpha Distribution',
        description: 'Contentieux suite rupture brutale de relation commerciale',
        type: 'LITIGATION',
        status: 'IN_PROGRESS',
        nature: 'contentieux',
        juridiction: 'Tribunal de Commerce',
        numeroRG: '2026/01234',
        chambre: '3ème chambre',
        color: '#EF4444',
        tenantId: tenant.id,
        clientId: clientPM.id,
        createdById: user.id,
      },
    });
    console.log(`✅ Dossier judiciaire créé: ${dossierJudiciaire.title} (RG: ${dossierJudiciaire.numeroRG})`);
  } else {
    dossierJudiciaire = await prisma.folder.update({
      where: { id: dossierJudiciaire.id },
      data: {
        nature: 'contentieux',
        juridiction: 'Tribunal de Commerce',
        numeroRG: '2026/01234',
        chambre: '3ème chambre',
      },
    });
    console.log(`✅ Dossier judiciaire enrichi: ${dossierJudiciaire.title}`);
  }

  // ==========================================================================
  // 7. Catégories par dossier (FolderDocCategory)
  // ==========================================================================

  const categoriesJuridique = ['Actes et contrats', 'Correspondances', 'Pièces justificatives', 'Formalités'];
  for (let i = 0; i < categoriesJuridique.length; i++) {
    await prisma.folderDocCategory.upsert({
      where: {
        folderId_name: { folderId: dossierJuridique.id, name: categoriesJuridique[i] },
      },
      update: { ordre: i },
      create: {
        folderId: dossierJuridique.id,
        name: categoriesJuridique[i],
        ordre: i,
      },
    });
  }
  console.log(`✅ ${categoriesJuridique.length} catégories créées pour dossier juridique`);

  const categoriesJudiciaire = ['Actes de procédure', 'Conclusions', 'Correspondances', 'Pièces', 'Décisions'];
  for (let i = 0; i < categoriesJudiciaire.length; i++) {
    await prisma.folderDocCategory.upsert({
      where: {
        folderId_name: { folderId: dossierJudiciaire.id, name: categoriesJudiciaire[i] },
      },
      update: { ordre: i },
      create: {
        folderId: dossierJudiciaire.id,
        name: categoriesJudiciaire[i],
        ordre: i,
      },
    });
  }
  console.log(`✅ ${categoriesJudiciaire.length} catégories créées pour dossier judiciaire`);

  // ==========================================================================
  // 8. Arborescences par défaut (FolderTreeTemplate)
  // ==========================================================================

  await prisma.folderTreeTemplate.upsert({
    where: {
      tenantId_name: { tenantId: tenant.id, name: 'Arborescence juridique' },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Arborescence juridique',
      folderType: 'juridique',
      isDefault: true,
      categories: [
        { name: 'Actes et contrats', ordre: 0 },
        { name: 'Correspondances', ordre: 1 },
        { name: 'Pièces justificatives', ordre: 2 },
        { name: 'Formalités', ordre: 3 },
      ],
    },
  });
  console.log('✅ Arborescence juridique par défaut');

  await prisma.folderTreeTemplate.upsert({
    where: {
      tenantId_name: { tenantId: tenant.id, name: 'Arborescence judiciaire' },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Arborescence judiciaire',
      folderType: 'judiciaire',
      isDefault: true,
      categories: [
        { name: 'Actes de procédure', ordre: 0 },
        { name: 'Conclusions', ordre: 1 },
        { name: 'Correspondances', ordre: 2 },
        { name: 'Pièces', ordre: 3 },
        { name: 'Décisions', ordre: 4 },
      ],
    },
  });
  console.log('✅ Arborescence judiciaire par défaut');

  // ==========================================================================
  // 9. Personnes dans le dossier judiciaire
  // ==========================================================================

  const existingPerson = await prisma.folderPerson.findFirst({
    where: { folderId: dossierJudiciaire.id, role: 'PARTIE_ADVERSE' },
  });

  if (!existingPerson) {
    await prisma.folderPerson.create({
      data: {
        folderId: dossierJudiciaire.id,
        tenantId: tenant.id,
        type: 'MORALE',
        role: 'PARTIE_ADVERSE',
        lastName: 'Alpha Distribution SAS',
        company: 'Alpha Distribution SAS',
        email: 'contact@alphadistrib.fr',
        phone: '01 98 76 54 32',
        address: '50 boulevard Haussmann, 75009 Paris',
        ordre: 0,
      },
    });

    await prisma.folderPerson.create({
      data: {
        folderId: dossierJudiciaire.id,
        tenantId: tenant.id,
        type: 'PHYSIQUE',
        role: 'AVOCAT_ADVERSE',
        firstName: 'Sophie',
        lastName: 'MARTIN',
        email: 'sophie.martin@cabinet-martin.fr',
        phone: '01 44 55 66 77',
        cabinet: 'Cabinet Martin & Associés',
        barreau: 'Paris',
        ordre: 1,
      },
    });

    await prisma.folderPerson.create({
      data: {
        folderId: dossierJudiciaire.id,
        tenantId: tenant.id,
        type: 'PHYSIQUE',
        role: 'EXPERT',
        firstName: 'Pierre',
        lastName: 'DURAND',
        email: 'p.durand@expert-comptable.fr',
        phone: '02 41 33 44 55',
        notes: 'Expert-comptable désigné par le tribunal',
        ordre: 2,
      },
    });

    console.log('✅ 3 personnes ajoutées au dossier judiciaire');
  } else {
    console.log('✅ Personnes dossier judiciaire déjà présentes');
  }

  // ==========================================================================
  // 10. Timeline events
  // ==========================================================================

  const existingEvent = await prisma.timelineEvent.findFirst({
    where: { folderId: dossierJuridique.id },
  });

  if (!existingEvent) {
    await prisma.timelineEvent.createMany({
      data: [
        {
          folderId: dossierJuridique.id,
          type: 'dossier_cree',
          description: 'Dossier créé par Me Bienaime',
          userId: user.id,
          createdAt: new Date('2026-01-15T09:00:00Z'),
        },
        {
          folderId: dossierJuridique.id,
          type: 'personne_ajoutee',
          description: 'Client Jean DUPONT ajouté au dossier',
          userId: user.id,
          createdAt: new Date('2026-01-15T09:05:00Z'),
        },
        {
          folderId: dossierJudiciaire.id,
          type: 'dossier_cree',
          description: 'Dossier contentieux créé par Me Bienaime',
          userId: user.id,
          createdAt: new Date('2026-01-20T14:00:00Z'),
        },
      ],
    });
    console.log('✅ 3 événements timeline créés');
  } else {
    console.log('✅ Événements timeline déjà présents');
  }

  // ==========================================================================
  // 11. Template de document
  // ==========================================================================

  const existingTemplate = await prisma.template.findFirst({
    where: { tenantId: tenant.id },
  });

  if (!existingTemplate) {
    await prisma.template.create({
      data: {
        tenantId: tenant.id,
        name: 'Acte de cession de parts sociales',
        description: 'Modèle standard pour la cession de parts de SAS/SARL',
        category: 'contrats',
        folderType: 'juridique',
        folderNature: 'cession',
        isSystem: true,
        variables: [
          { key: 'client.nom', label: 'Nom du cédant', required: true },
          { key: 'client.prenom', label: 'Prénom du cédant', required: true },
          { key: 'societe.raisonSociale', label: 'Raison sociale', required: true },
          { key: 'cession.nombreParts', label: 'Nombre de parts cédées', required: true },
          { key: 'cession.prixUnitaire', label: 'Prix unitaire', required: true },
        ],
      },
    });
    console.log('✅ Template de document créé');
  } else {
    console.log('✅ Template déjà présent');
  }

  // ==========================================================================
  // SUMMARY
  // ==========================================================================

  console.log('\n====================================');
  console.log('🌱 Seed completed successfully!');
  console.log('====================================');

  const counts = {
    tenants: await prisma.tenant.count(),
    users: await prisma.user.count(),
    clients: await prisma.client.count(),
    folders: await prisma.folder.count(),
    folderPersons: await prisma.folderPerson.count(),
    folderDocCategories: await prisma.folderDocCategory.count(),
    folderTreeTemplates: await prisma.folderTreeTemplate.count(),
    documents: await prisma.document.count(),
    templates: await prisma.template.count(),
    builderBlocks: await prisma.builderBlock.count(),
    builderTemplates: await prisma.builderTemplate.count(),
    signatureRequests: await prisma.signatureRequest.count(),
    timelineEvents: await prisma.timelineEvent.count(),
    clientReminders: await prisma.clientReminder.count(),
  };

  for (const [model, count] of Object.entries(counts)) {
    console.log(`  ${model}: ${count}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
