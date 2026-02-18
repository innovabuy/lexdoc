/**
 * Seed Demo Data — LexDoc
 * Creates realistic demo data for all features:
 * - Clients (individuals + companies)
 * - Folders with persons
 * - Documents (fake metadata, no actual files)
 * - Deadlines & Calendar events
 * - Document requests
 * - Signatures
 * - Notifications
 * - Chat conversations + messages
 * - Audit logs
 *
 * Usage: node prisma/seed-demo-data.js
 */

const prisma = require('../src/config/database');
const crypto = require('crypto');

const TENANT_ID = 'cml6vykdd0000jms2wwxl9s27';
const ADMIN_USER_ID = 'cml6vykja0002jms2hhr4hfr3';

// Helper: random date in last N days
function randomDate(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 10) + 8, Math.floor(Math.random() * 60));
  return d;
}

// Helper: future date in next N days
function futureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * daysAhead) + 1);
  d.setHours(Math.floor(Math.random() * 10) + 8, Math.floor(Math.random() * 60));
  return d;
}

// Helper: random pick
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function main() {
  console.log('--- Seed Demo Data ---');

  // Get existing users
  const users = await prisma.user.findMany({ where: { tenantId: TENANT_ID }, select: { id: true, firstName: true } });
  console.log(`Found ${users.length} users`);
  const userIds = users.map(u => u.id);

  // ═══════════════════════════════════════════════
  // 1. CLIENTS (add 7 more to make ~20 total)
  // ═══════════════════════════════════════════════
  const newClients = [
    { type: 'INDIVIDUAL', firstName: 'Marie', lastName: 'Dupont', email: `marie.dupont+demo@test.fr`, phone: '06 12 34 56 78', address: '15 rue de la Paix', postalCode: '75002', city: 'Paris' },
    { type: 'INDIVIDUAL', firstName: 'Jean-Pierre', lastName: 'Martin', email: `jp.martin+demo@test.fr`, phone: '06 98 76 54 32', address: '8 avenue Foch', postalCode: '69006', city: 'Lyon' },
    { type: 'COMPANY', companyName: 'SCI Les Tilleuls', siret: '98765432100012', email: `sci.tilleuls+demo@test.fr`, address: '22 bd Haussmann', postalCode: '75009', city: 'Paris', formeSociale: 'SCI' },
    { type: 'INDIVIDUAL', firstName: 'Sophie', lastName: 'Bernard', email: `sophie.bernard+demo@test.fr`, phone: '07 11 22 33 44', address: '3 place Bellecour', postalCode: '69002', city: 'Lyon', civilite: 'Mme' },
    { type: 'COMPANY', companyName: 'SARL Tech Solutions', siret: '12398765400056', email: `tech.solutions+demo@test.fr`, address: '10 rue du Commerce', postalCode: '44000', city: 'Nantes', formeSociale: 'SARL' },
    { type: 'INDIVIDUAL', firstName: 'Pierre', lastName: 'Leroy', email: `pierre.leroy+demo@test.fr`, phone: '06 55 44 33 22', address: '45 rue Gambetta', postalCode: '33000', city: 'Bordeaux' },
    { type: 'INDIVIDUAL', firstName: 'Isabelle', lastName: 'Moreau', email: `isabelle.moreau+demo@test.fr`, phone: '06 77 88 99 00', address: '12 rue Victor Hugo', postalCode: '31000', city: 'Toulouse', civilite: 'Mme' },
  ];

  const createdClients = [];
  for (const c of newClients) {
    const existing = await prisma.client.findFirst({ where: { tenantId: TENANT_ID, email: c.email } });
    if (!existing) {
      const client = await prisma.client.create({ data: { ...c, tenantId: TENANT_ID } });
      createdClients.push(client);
    }
  }
  console.log(`Created ${createdClients.length} new clients`);

  // Get all clients
  const allClients = await prisma.client.findMany({ where: { tenantId: TENANT_ID }, select: { id: true, email: true, firstName: true, lastName: true, companyName: true, address: true, postalCode: true, city: true } });

  // ═══════════════════════════════════════════════
  // 2. FOLDERS (add diverse types)
  // ═══════════════════════════════════════════════
  const folderTypes = ['LITIGATION', 'CONTRACT', 'BUSINESS', 'FAMILY', 'REAL_ESTATE', 'LABOR'];
  const folderStatuses = ['OPEN', 'IN_PROGRESS', 'PENDING', 'CLOSED'];
  const existingRefs = (await prisma.folder.findMany({ where: { tenantId: TENANT_ID }, select: { reference: true } })).map(f => f.reference);

  const folderDefs = [
    { title: 'Divorce Dupont/Martin', type: 'FAMILY', nature: 'divorce' },
    { title: 'Cession parts SCI Les Tilleuls', type: 'BUSINESS', nature: 'cession' },
    { title: 'Licenciement abusif Bernard c/ SARL Tech', type: 'LABOR', nature: 'contentieux_travail' },
    { title: 'Acquisition immobiliere Leroy', type: 'REAL_ESTATE', nature: 'acquisition' },
    { title: 'Contentieux bail commercial Moreau', type: 'LITIGATION', nature: 'bail_commercial' },
    { title: 'Constitution SAS InnoTech', type: 'BUSINESS', nature: 'creation_societe' },
    { title: 'Succession Martin', type: 'FAMILY', nature: 'succession' },
    { title: 'Redaction contrat de travail CDI', type: 'CONTRACT', nature: 'contrat_travail' },
  ];

  const createdFolders = [];
  let refCounter = existingRefs.length + 1;
  for (const fd of folderDefs) {
    const ref = `DOS-2026-${String(refCounter).padStart(4, '0')}`;
    if (existingRefs.includes(ref)) { refCounter++; continue; }
    const client = pick(allClients);
    const folder = await prisma.folder.create({
      data: {
        reference: ref,
        title: fd.title,
        type: fd.type,
        nature: fd.nature,
        status: pick(folderStatuses),
        openedAt: randomDate(90),
        clientId: client.id,
        createdById: ADMIN_USER_ID,
        tenantId: TENANT_ID,
      },
    });
    createdFolders.push(folder);
    refCounter++;
  }
  console.log(`Created ${createdFolders.length} new folders`);

  // Get all folders
  const allFolders = await prisma.folder.findMany({ where: { tenantId: TENANT_ID }, select: { id: true, title: true, clientId: true } });

  // ═══════════════════════════════════════════════
  // 3. FOLDER PERSONS
  // ═══════════════════════════════════════════════
  const personRoles = ['PARTIE_ADVERSE', 'AVOCAT_ADVERSE', 'TEMOIN', 'EXPERT', 'NOTAIRE'];
  let personsCreated = 0;
  for (const folder of createdFolders.slice(0, 5)) {
    // Add 1-3 persons per folder
    const count = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < count; i++) {
      await prisma.folderPerson.create({
        data: {
          folderId: folder.id,
          tenantId: TENANT_ID,
          type: 'PHYSIQUE',
          role: pick(personRoles),
          firstName: pick(['Alain', 'Catherine', 'Patrick', 'Nathalie', 'Francois']),
          lastName: pick(['Dubois', 'Petit', 'Roux', 'Blanc', 'Garnier']),
          email: `person-${crypto.randomBytes(3).toString('hex')}@avocat.fr`,
          phone: `06 ${Math.floor(10000000 + Math.random() * 90000000)}`,
          address: `${Math.floor(1 + Math.random() * 99)} rue ${pick(['de la Republique', 'des Lilas', 'du Marechal Foch', 'Jean Jaures'])}`,
          ordre: i,
        },
      });
      personsCreated++;
    }
  }
  console.log(`Created ${personsCreated} folder persons`);

  // ═══════════════════════════════════════════════
  // 4. DOCUMENTS (metadata only, no real files)
  // ═══════════════════════════════════════════════
  const docTypes = ['CONTRACT', 'LETTER', 'DEED', 'CERTIFICATE', 'REPORT', 'MEMORANDUM', 'MINUTES'];
  const docStatuses = ['DRAFT', 'PENDING_REVIEW', 'PENDING_SIGNATURE', 'SIGNED', 'SENT'];
  const docNames = [
    'Assignation en justice', 'Conclusions au fond', 'Protocole transactionnel',
    'Acte de cession', 'Statuts SAS', 'Procuration', 'Mise en demeure',
    'Requete en refere', 'Preavis de licenciement', 'Attestation de domicile',
    'Contrat de bail', 'Avenant au contrat', 'PV assemblee generale',
    'Courrier tribunal', 'Note de synthese', 'Acte notarie',
  ];

  let docsCreated = 0;
  for (const folder of allFolders) {
    const count = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < count; i++) {
      const name = pick(docNames);
      const ext = pick(['.pdf', '.docx', '.pdf', '.pdf']);
      const filename = `${name.toLowerCase().replace(/ /g, '_')}${ext}`;
      const objectKey = `${TENANT_ID}/${folder.id}/${crypto.randomBytes(8).toString('hex')}${ext}`;
      await prisma.document.create({
        data: {
          name: name,
          description: `Document genere pour le dossier`,
          type: pick(docTypes),
          filename: filename,
          originalName: filename,
          mimeType: ext === '.pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: BigInt(Math.floor(50000 + Math.random() * 500000)),
          checksum: crypto.randomBytes(16).toString('hex'),
          bucketName: 'lexdoc-documents',
          objectKey: objectKey,
          isEncrypted: false,
          status: pick(docStatuses),
          createdAt: randomDate(60),
          folderId: folder.id,
          createdById: pick(userIds),
          tenantId: TENANT_ID,
        },
      });
      docsCreated++;
    }
  }
  console.log(`Created ${docsCreated} documents`);

  // ═══════════════════════════════════════════════
  // 5. DEADLINES / CALENDAR EVENTS
  // ═══════════════════════════════════════════════
  const deadlineTypes = ['DEADLINE', 'HEARING', 'MEETING', 'REMINDER', 'TASK'];
  const deadlinePriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
  const deadlineTitles = [
    'Audience TGI Paris', 'Depot conclusions', 'RDV client Dupont',
    'Date limite appel', 'Mediation prevue', 'Audience mise en etat',
    'Echeance paiement', 'Depot plainte', 'Signature acte notarie',
    'Reunion cabinet', 'Rappel delai prescription', 'Audience Cour appel',
    'Visite expert immobilier', 'Depot memoire', 'RDV notaire cession',
  ];

  let deadlinesCreated = 0;
  for (const title of deadlineTitles) {
    const isPast = Math.random() > 0.6;
    const dueDate = isPast ? randomDate(30) : futureDate(45);
    const folder = Math.random() > 0.3 ? pick(allFolders) : null;

    await prisma.deadline.create({
      data: {
        title: title,
        description: `${title} - details a completer`,
        dueDate: dueDate,
        dueTime: `${String(Math.floor(Math.random() * 4) + 9).padStart(2, '0')}:${pick(['00', '15', '30', '45'])}`,
        type: pick(deadlineTypes),
        priority: pick(deadlinePriorities),
        status: isPast ? pick(['COMPLETED', 'OVERDUE']) : 'PENDING',
        completedAt: isPast && Math.random() > 0.5 ? new Date() : null,
        folderId: folder ? folder.id : null,
        assignedToId: pick(userIds),
        createdById: ADMIN_USER_ID,
        tenantId: TENANT_ID,
      },
    });
    deadlinesCreated++;
  }
  console.log(`Created ${deadlinesCreated} deadlines`);

  // ═══════════════════════════════════════════════
  // 6. DOCUMENT REQUESTS
  // ═══════════════════════════════════════════════
  const requestTitles = [
    'Justificatif de domicile', 'Piece identite recto-verso', 'RIB bancaire',
    'Avis imposition 2025', 'Certificat de non-gage', 'Extrait Kbis',
    'Attestation employeur', 'Bail en cours', 'Quittances de loyer',
    'Acte de naissance', 'Livret de famille', 'Contrat de travail',
  ];
  const reqStatuses = ['PENDING', 'PENDING', 'PENDING', 'COMPLETED', 'CANCELLED'];
  const reqPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

  let reqsCreated = 0;
  for (const title of requestTitles) {
    const folder = pick(allFolders);
    const status = pick(reqStatuses);
    await prisma.documentRequest.create({
      data: {
        title: title,
        description: `Merci de fournir : ${title}`,
        status: status,
        priority: pick(reqPriorities),
        dueDate: futureDate(30),
        reminderCount: status === 'PENDING' ? Math.floor(Math.random() * 3) : 0,
        lastReminderAt: status === 'PENDING' && Math.random() > 0.5 ? randomDate(7) : null,
        responseDate: status === 'COMPLETED' ? randomDate(5) : null,
        folderId: folder.id,
        createdById: ADMIN_USER_ID,
        tenantId: TENANT_ID,
      },
    });
    reqsCreated++;
  }
  console.log(`Created ${reqsCreated} document requests`);

  // ═══════════════════════════════════════════════
  // 7. NOTIFICATIONS
  // ═══════════════════════════════════════════════
  const notifTypes = [
    'SIGNATURE_PENDING', 'DOCUMENT_UPLOADED', 'DEADLINE_APPROACHING',
    'MESSAGE_RECEIVED', 'FOLDER_CREATED', 'DOCUMENT_REQUEST',
    'SIGNATURE_COMPLETED', 'CLIENT_ACCESS_CREATED',
  ];
  const notifTitles = [
    'Signature en attente', 'Nouveau document depose', 'Echeance dans 3 jours',
    'Nouveau message', 'Dossier cree', 'Demande de document',
    'Document signe', 'Acces client active', 'Rappel audience',
    'Document partage', 'Deadline depassee', 'Profil client complete',
  ];

  let notifsCreated = 0;
  for (let i = 0; i < 15; i++) {
    const isRead = Math.random() > 0.4;
    await prisma.notification.create({
      data: {
        type: pick(notifTypes),
        title: pick(notifTitles),
        message: `Notification automatique concernant votre dossier.`,
        entityType: pick(['Document', 'Folder', 'Signature', 'Deadline']),
        entityId: pick(allFolders).id,
        isRead: isRead,
        readAt: isRead ? randomDate(3) : null,
        userId: pick(userIds),
        tenantId: TENANT_ID,
        createdAt: randomDate(14),
      },
    });
    notifsCreated++;
  }
  console.log(`Created ${notifsCreated} notifications`);

  // ═══════════════════════════════════════════════
  // 8. CHAT CONVERSATIONS + MESSAGES
  // ═══════════════════════════════════════════════
  const chatSubjects = [
    'Dossier Dupont - documents manquants',
    'Organisation reunion cabinet',
    'Point cession SCI Tilleuls',
    'Audience TGI - preparation',
    'Question procedure licenciement',
  ];

  let convosCreated = 0;
  let msgsCreated = 0;
  for (const subject of chatSubjects) {
    if (userIds.length < 2) break;

    const conv = await prisma.conversation.create({
      data: {
        subject: subject,
        tenantId: TENANT_ID,
        lastMessageAt: randomDate(5),
      },
    });

    // Add 2 participants
    const participant1 = userIds[0];
    const participant2 = userIds.length > 1 ? userIds[1] : userIds[0];
    await prisma.conversationParticipant.createMany({
      data: [
        { conversationId: conv.id, userId: participant1, lastReadAt: new Date(), unreadCount: 0 },
        { conversationId: conv.id, userId: participant2, lastReadAt: randomDate(2), unreadCount: Math.floor(Math.random() * 3) },
      ],
      skipDuplicates: true,
    });

    // Add 3-6 messages per conversation
    const msgCount = Math.floor(Math.random() * 4) + 3;
    const messages = [
      'Bonjour, pouvez-vous me confirmer la date de rendez-vous ?',
      'Oui, c\'est prevu pour jeudi prochain a 14h.',
      'Parfait, je prepare les documents necessaires.',
      'N\'oubliez pas d\'apporter les conclusions au fond.',
      'Le client a confirme sa presence.',
      'J\'ai recu les pieces complementaires.',
      'Merci, je les ajoute au dossier.',
      'La date limite est fixee au 15 du mois.',
    ];

    for (let i = 0; i < msgCount; i++) {
      const msgDate = new Date(conv.lastMessageAt);
      msgDate.setHours(msgDate.getHours() - (msgCount - i));

      await prisma.message.create({
        data: {
          conversationId: conv.id,
          content: messages[i % messages.length],
          senderId: i % 2 === 0 ? participant1 : participant2,
          createdAt: msgDate,
          tenantId: TENANT_ID,
        },
      });
      msgsCreated++;
    }
    convosCreated++;
  }
  console.log(`Created ${convosCreated} conversations with ${msgsCreated} messages`);

  // ═══════════════════════════════════════════════
  // 9. AUDIT LOGS
  // ═══════════════════════════════════════════════
  const auditActions = [
    'LOGIN', 'DOCUMENT_UPLOAD', 'DOCUMENT_VIEW', 'DOCUMENT_DOWNLOAD',
    'FOLDER_CREATE', 'CLIENT_CREATE', 'SIGNATURE_SEND', 'SETTINGS_UPDATE',
    'TEMPLATE_GENERATE', 'DEADLINE_CREATE', 'NOTIFICATION_READ',
  ];
  const entityTypes = ['User', 'Document', 'Folder', 'Client', 'Signature', 'Template'];

  let logsCreated = 0;
  for (let i = 0; i < 50; i++) {
    await prisma.auditLog.create({
      data: {
        action: pick(auditActions),
        entityType: pick(entityTypes),
        entityId: pick(allFolders).id,
        userId: pick(userIds),
        ipAddress: '192.168.1.' + Math.floor(Math.random() * 254 + 1),
        tenantId: TENANT_ID,
        createdAt: randomDate(30),
      },
    });
    logsCreated++;
  }
  console.log(`Created ${logsCreated} audit logs`);

  // ═══════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════
  console.log('\n--- Summary ---');
  const counts = {
    clients: await prisma.client.count({ where: { tenantId: TENANT_ID } }),
    folders: await prisma.folder.count({ where: { tenantId: TENANT_ID } }),
    documents: await prisma.document.count({ where: { tenantId: TENANT_ID } }),
    deadlines: await prisma.deadline.count({ where: { tenantId: TENANT_ID } }),
    documentRequests: await prisma.documentRequest.count({ where: { tenantId: TENANT_ID } }),
    notifications: await prisma.notification.count({ where: { tenantId: TENANT_ID } }),
    conversations: await prisma.conversation.count({ where: { tenantId: TENANT_ID } }),
    auditLogs: await prisma.auditLog.count({ where: { tenantId: TENANT_ID } }),
  };
  console.table(counts);
  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
