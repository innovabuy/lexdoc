import { PrismaClient, CabinetStatus, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
      country: 'France',
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
      status: UserStatus.ACTIVE,
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
      status: UserStatus.ACTIVE,
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
      status: UserStatus.ACTIVE,
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
      status: UserStatus.ACTIVE,
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
      createdById: adminUser.id,
    },
  });

  const modèlesFolder = await prisma.folder.create({
    data: {
      name: 'Modèles',
      cabinetId: demoCabinet.id,
      createdById: adminUser.id,
    },
  });

  const archivesFolder = await prisma.folder.create({
    data: {
      name: 'Archives',
      cabinetId: demoCabinet.id,
      createdById: adminUser.id,
    },
  });

  // Create sub-folders for clients
  const client1Folder = await prisma.folder.create({
    data: {
      name: 'Entreprise ABC - Droit des sociétés',
      parentId: clientsFolder.id,
      cabinetId: demoCabinet.id,
      createdById: avocat1.id,
    },
  });

  const client2Folder = await prisma.folder.create({
    data: {
      name: 'M. Durand - Divorce',
      parentId: clientsFolder.id,
      cabinetId: demoCabinet.id,
      createdById: avocat2.id,
    },
  });

  console.log('Created folder structure');

  // Create templates
  console.log('Creating document templates...');

  await prisma.template.createMany({
    data: [
      {
        name: 'Lettre de mission',
        description: 'Modèle standard de lettre de mission client',
        content: '# Lettre de Mission\n\nObjet : Mission de conseil juridique\n\n...',
        cabinetId: demoCabinet.id,
        createdById: adminUser.id,
      },
      {
        name: 'Convention d\'honoraires',
        description: 'Convention type pour les honoraires',
        content: '# Convention d\'Honoraires\n\nEntre les soussignés :\n\n...',
        cabinetId: demoCabinet.id,
        createdById: adminUser.id,
      },
      {
        name: 'Procuration',
        description: 'Modèle de procuration générale',
        content: '# Procuration\n\nJe soussigné(e),\n\n...',
        cabinetId: demoCabinet.id,
        createdById: adminUser.id,
      },
      {
        name: 'Conclusions',
        description: 'Structure type pour des conclusions',
        content: '# Conclusions\n\nPour : [CLIENT]\nContre : [PARTIE_ADVERSE]\n\n...',
        cabinetId: demoCabinet.id,
        createdById: avocat1.id,
      },
    ],
  });

  console.log('Created templates');

  // Create audit logs
  console.log('Creating sample audit logs...');

  await prisma.auditLog.createMany({
    data: [
      {
        action: 'LOGIN',
        userId: adminUser.id,
        cabinetId: demoCabinet.id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        details: { method: 'password' },
      },
      {
        action: 'CREATE',
        userId: avocat1.id,
        cabinetId: demoCabinet.id,
        entityType: 'Folder',
        entityId: client1Folder.id,
        ipAddress: '192.168.1.101',
        details: { folderName: client1Folder.name },
      },
      {
        action: 'CREATE',
        userId: avocat2.id,
        cabinetId: demoCabinet.id,
        entityType: 'Folder',
        entityId: client2Folder.id,
        ipAddress: '192.168.1.102',
        details: { folderName: client2Folder.name },
      },
    ],
  });

  console.log('Created audit logs');

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
