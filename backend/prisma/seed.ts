import { PrismaClient, CabinetStatus, UserRole, AuditAction } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedDocumentBuilder } from './seeds/documentBuilder.seed';
import { seedExtendedBlocks } from './seeds/extended-blocks.seed';
import { seedExtendedTemplates } from './seeds/extended-templates.seed';
import { seedDroitAffairesBlocks } from './seeds/droit-affaires-blocs.seed';
import { seedDroitAffairesTemplates } from './seeds/droit-affaires-templates.seed';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('Starting database seed...');

  // Clean existing data (in development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Cleaning existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.generatedDocument.deleteMany();
    await prisma.documentBlock.deleteMany();
    await prisma.builderTemplate.deleteMany();
    await prisma.avocatLegalInfo.deleteMany();
    await prisma.document.deleteMany();
    await prisma.folder.deleteMany();
    await prisma.template.deleteMany();
    await prisma.user.deleteMany();
    await prisma.cabinet.deleteMany();
  }

  // Create demo cabinet
  console.log('Creating demo cabinet...');
  const demoCabinet = await prisma.cabinet.create({
    data: {
      name: 'Cabinet Juridique Demo',
      email: 'contact@cabinet-demo.fr',
      phone: '+33 1 23 45 67 89',
      address: '123 Avenue des Avocats',
      city: 'Paris',
      postalCode: '75001',
      siret: '12345678901234',
      status: CabinetStatus.ACTIVE,
    },
  });

  console.log(`Created cabinet: ${demoCabinet.name} (${demoCabinet.id})`);

  // Create admin user
  console.log('Creating admin user...');
  const adminPassword = await hashPassword('Admin123!');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@cabinet-demo.fr',
      password: adminPassword,
      firstName: 'Jean',
      lastName: 'Administrateur',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
      cabinetId: demoCabinet.id,
    },
  });

  console.log(`Created admin: ${adminUser.email}`);

  // Create avocat users
  console.log('Creating avocat users...');
  const avocatPassword = await hashPassword('Avocat123!');

  const avocat1 = await prisma.user.create({
    data: {
      email: 'marie.dupont@cabinet-demo.fr',
      password: avocatPassword,
      firstName: 'Marie',
      lastName: 'Dupont',
      role: UserRole.AVOCAT,
      isActive: true,
      emailVerified: true,
      cabinetId: demoCabinet.id,
    },
  });

  const avocat2 = await prisma.user.create({
    data: {
      email: 'pierre.martin@cabinet-demo.fr',
      password: avocatPassword,
      firstName: 'Pierre',
      lastName: 'Martin',
      role: UserRole.AVOCAT,
      isActive: true,
      emailVerified: true,
      cabinetId: demoCabinet.id,
    },
  });

  console.log(`Created avocats: ${avocat1.email}, ${avocat2.email}`);

  // Create secretaire user
  console.log('Creating secretaire user...');
  const secretairePassword = await hashPassword('Secretaire123!');
  const secretaire = await prisma.user.create({
    data: {
      email: 'sophie.bernard@cabinet-demo.fr',
      password: secretairePassword,
      firstName: 'Sophie',
      lastName: 'Bernard',
      role: UserRole.SECRETAIRE,
      isActive: true,
      emailVerified: true,
      cabinetId: demoCabinet.id,
    },
  });

  console.log(`Created secretaire: ${secretaire.email}`);

  // Create folder structure
  console.log('Creating folder structure...');

  const clientsFolder = await prisma.folder.create({
    data: {
      name: 'Clients',
      cabinetId: demoCabinet.id,
    },
  });

  await prisma.folder.create({
    data: {
      name: 'Modèles',
      cabinetId: demoCabinet.id,
    },
  });

  await prisma.folder.create({
    data: {
      name: 'Archives',
      cabinetId: demoCabinet.id,
    },
  });

  // Create sub-folders for clients
  await prisma.folder.create({
    data: {
      name: 'Entreprise ABC - Droit des sociétés',
      parentId: clientsFolder.id,
      cabinetId: demoCabinet.id,
    },
  });

  await prisma.folder.create({
    data: {
      name: 'M. Durand - Divorce',
      parentId: clientsFolder.id,
      cabinetId: demoCabinet.id,
    },
  });

  console.log('Created folder structure');

  // Create audit log for login
  console.log('Creating sample audit log...');

  await prisma.auditLog.create({
    data: {
      action: AuditAction.USER_LOGIN,
      userId: adminUser.id,
      cabinetId: demoCabinet.id,
      entity: 'User',
      entityId: adminUser.id,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      details: { method: 'password' },
    },
  });

  console.log('Created audit log');

  // Seed Document Builder module
  await seedDocumentBuilder(demoCabinet.id, adminUser.id);

  // Seed Extended Blocks
  const extendedBlocksCount = await seedExtendedBlocks(demoCabinet.id, adminUser.id);
  console.log(`Extended blocks seeding completed: ${extendedBlocksCount} blocks added`);

  // Seed Extended Templates
  const extendedTemplatesCount = await seedExtendedTemplates(demoCabinet.id, adminUser.id);
  console.log(`Extended templates seeding completed: ${extendedTemplatesCount} templates added`);

  // Seed Droit des Affaires Blocks
  const droitAffairesBlocksCount = await seedDroitAffairesBlocks(demoCabinet.id, adminUser.id);
  console.log(`Droit des affaires blocks seeding completed: ${droitAffairesBlocksCount} blocks added`);

  // Seed Droit des Affaires Templates
  const droitAffairesTemplatesCount = await seedDroitAffairesTemplates(demoCabinet.id, adminUser.id);
  console.log(`Droit des affaires templates seeding completed: ${droitAffairesTemplatesCount} templates added`);

  // Summary
  console.log('\n========================================');
  console.log('Database seeded successfully!');
  console.log('========================================\n');
  console.log('Demo Cabinet:', demoCabinet.name);
  console.log('\nDemo Users:');
  console.log('-------------------------------------------');
  console.log(`Admin:      ${adminUser.email} / Admin123!`);
  console.log(`Avocat 1:   ${avocat1.email} / Avocat123!`);
  console.log(`Avocat 2:   ${avocat2.email} / Avocat123!`);
  console.log(`Secretaire: ${secretaire.email} / Secretaire123!`);
  console.log('-------------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
