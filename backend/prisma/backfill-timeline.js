/**
 * Backfill Timeline Events
 *
 * Generates timeline events from existing data:
 * - Folders: dossier_cree
 * - Documents: document_cree
 * - Folder persons: personne_ajoutee
 * - Deadlines: echeance_creee
 *
 * Safe to run multiple times — skips folders that already have events.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfill() {
  console.log('=== Timeline Backfill ===\n');

  // Check existing event count
  const existingCount = await prisma.timelineEvent.count();
  console.log(`Existing timeline events: ${existingCount}`);

  // Get all folders
  const folders = await prisma.folder.findMany({
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      client: { select: { companyName: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Total folders: ${folders.length}`);

  let created = 0;
  let skipped = 0;

  for (const folder of folders) {
    // Check if this folder already has a dossier_cree event
    const hasCreatedEvent = await prisma.timelineEvent.findFirst({
      where: { folderId: folder.id, type: 'dossier_cree' },
    });

    if (hasCreatedEvent) {
      skipped++;
      continue;
    }

    // 1. Create folder creation event
    await prisma.timelineEvent.create({
      data: {
        folderId: folder.id,
        type: 'dossier_cree',
        description: `Dossier "${folder.title}" créé`,
        userId: folder.createdById,
        createdAt: folder.createdAt,
      },
    });
    created++;

    // 2. Create events for documents in this folder
    const documents = await prisma.document.findMany({
      where: { folderId: folder.id, deletedAt: null },
      select: { id: true, name: true, createdAt: true, createdById: true, originalName: true },
      orderBy: { createdAt: 'asc' },
    });

    for (const doc of documents) {
      // Skip if already has event
      const hasDocEvent = await prisma.timelineEvent.findFirst({
        where: { folderId: folder.id, documentId: doc.id, type: 'document_cree' },
      });
      if (hasDocEvent) continue;

      await prisma.timelineEvent.create({
        data: {
          folderId: folder.id,
          type: 'document_cree',
          description: `Document "${doc.name}" ajouté`,
          userId: doc.createdById,
          documentId: doc.id,
          createdAt: doc.createdAt,
        },
      });
      created++;
    }

    // 3. Create events for persons in this folder
    const persons = await prisma.folderPerson.findMany({
      where: { folderId: folder.id },
      select: { id: true, firstName: true, lastName: true, company: true, role: true, type: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const ROLE_LABELS = {
      PARTIE_ADVERSE: 'Partie adverse',
      AVOCAT_ADVERSE: 'Avocat adverse',
      EXPERT: 'Expert',
      TEMOIN: 'Témoin',
      NOTAIRE: 'Notaire',
      HUISSIER: 'Huissier',
      MAGISTRAT: 'Magistrat',
      MEDIATEUR: 'Médiateur',
      ASSUREUR: 'Assureur',
      AUTRE: 'Autre',
    };

    for (const person of persons) {
      const personName = person.firstName ? `${person.firstName} ${person.lastName}` : (person.company || person.lastName);
      await prisma.timelineEvent.create({
        data: {
          folderId: folder.id,
          type: 'personne_ajoutee',
          description: `${ROLE_LABELS[person.role] || person.role} ajouté(e) : ${personName}`,
          createdAt: person.createdAt,
          metadata: { personId: person.id, role: person.role },
        },
      });
      created++;
    }

    // 4. Create events for deadlines linked to this folder
    const deadlines = await prisma.deadline.findMany({
      where: { folderId: folder.id },
      select: { id: true, title: true, type: true, dueDate: true, createdAt: true, createdById: true, status: true, completedAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const DEADLINE_TYPE_LABELS = {
      DEADLINE: 'Échéance',
      HEARING: 'Audience',
      MEETING: 'Rendez-vous',
      REMINDER: 'Rappel',
      TASK: 'Tâche',
      OTHER: 'Autre',
    };

    for (const dl of deadlines) {
      await prisma.timelineEvent.create({
        data: {
          folderId: folder.id,
          type: 'echeance_creee',
          description: `${DEADLINE_TYPE_LABELS[dl.type] || 'Échéance'} créée : "${dl.title}" (${dl.dueDate.toLocaleDateString('fr-FR')})`,
          userId: dl.createdById,
          createdAt: dl.createdAt,
          metadata: { deadlineId: dl.id, type: dl.type },
        },
      });
      created++;

      // If completed, also add completion event
      if (dl.status === 'COMPLETED' && dl.completedAt) {
        await prisma.timelineEvent.create({
          data: {
            folderId: folder.id,
            type: 'echeance_terminee',
            description: `Échéance terminée : "${dl.title}"`,
            createdAt: dl.completedAt,
            metadata: { deadlineId: dl.id },
          },
        });
        created++;
      }
    }
  }

  console.log(`\nBackfill complete:`);
  console.log(`  Created: ${created} events`);
  console.log(`  Skipped: ${skipped} folders (already had events)`);

  const totalNow = await prisma.timelineEvent.count();
  console.log(`  Total events now: ${totalNow}`);

  await prisma.$disconnect();
}

backfill().catch(err => {
  console.error('Backfill failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
