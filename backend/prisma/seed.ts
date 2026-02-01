import { PrismaClient, CabinetStatus, UserRole, AuditAction, BlockCategory } from '@prisma/client';
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

  // Create Document Builder system blocks
  console.log('Creating system document blocks...');

  const systemBlocks = [
    // INTRO blocks
    {
      category: BlockCategory.INTRO,
      title: 'En-tête Assignation au fond',
      content: `ASSIGNATION

L'AN DEUX MILLE {{annee}}
ET LE {{date_assignation}}

A LA REQUÊTE DE :

{{demandeur.civilite}} {{demandeur.prenom}} {{demandeur.nom}}
Demeurant : {{demandeur.adresse}}, {{demandeur.code_postal}} {{demandeur.ville}}

Ayant pour Avocat constitué :
Maître {{avocat.prenom}} {{avocat.nom}}
Avocat au Barreau de {{avocat.barreau}}
{{avocat.adresse}}
{{avocat.code_postal}} {{avocat.ville}}`,
      tags: ['assignation', 'fond', 'intro'],
      isMandatory: true,
      displayOrder: 1,
    },
    {
      category: BlockCategory.INTRO,
      title: 'En-tête Assignation en référé',
      content: `ASSIGNATION EN RÉFÉRÉ

L'AN DEUX MILLE {{annee}}
ET LE {{date_assignation}}

A LA REQUÊTE DE :

{{demandeur.civilite}} {{demandeur.prenom}} {{demandeur.nom}}
Demeurant : {{demandeur.adresse}}, {{demandeur.code_postal}} {{demandeur.ville}}

Ayant pour Avocat constitué :
Maître {{avocat.prenom}} {{avocat.nom}}`,
      tags: ['assignation', 'refere', 'intro'],
      isMandatory: true,
      displayOrder: 2,
    },
    {
      category: BlockCategory.INTRO,
      title: 'En-tête Conclusions',
      content: `CONCLUSIONS

POUR : {{demandeur.civilite}} {{demandeur.prenom}} {{demandeur.nom}}
       Demandeur

CONTRE : {{defendeur.civilite}} {{defendeur.prenom}} {{defendeur.nom}}
         Défendeur

Plaise au Tribunal,`,
      tags: ['conclusions', 'intro'],
      isMandatory: true,
      displayOrder: 3,
    },
    {
      category: BlockCategory.INTRO,
      title: 'En-tête Mise en demeure',
      content: `{{lieu}}, le {{date}}

LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION

{{destinataire.civilite}} {{destinataire.prenom}} {{destinataire.nom}}
{{destinataire.adresse}}
{{destinataire.code_postal}} {{destinataire.ville}}

Objet : Mise en demeure

{{destinataire.civilite}},`,
      tags: ['mise_en_demeure', 'courrier', 'intro'],
      isMandatory: false,
      displayOrder: 4,
    },

    // FAITS blocks
    {
      category: BlockCategory.FAITS,
      title: 'Exposé des faits - Contrat',
      content: `I. EXPOSÉ DES FAITS

Par contrat en date du {{date_contrat}}, {{partie1.nom}} et {{partie2.nom}} ont conclu un accord portant sur {{objet_contrat}}.

Les principales obligations des parties étaient les suivantes :
- Pour {{partie1.nom}} : {{obligations_partie1}}
- Pour {{partie2.nom}} : {{obligations_partie2}}

Or, le {{date_inexecution}}, {{partie_defaillante.nom}} a manqué à ses obligations contractuelles en {{description_inexecution}}.`,
      tags: ['faits', 'contrat', 'inexecution'],
      isMandatory: false,
      displayOrder: 10,
    },
    {
      category: BlockCategory.FAITS,
      title: 'Exposé des faits - Accident',
      content: `I. EXPOSÉ DES FAITS

Le {{date_accident}}, à {{heure_accident}}, {{victime.civilite}} {{victime.nom}} a été victime d'un accident survenu {{lieu_accident}}.

Les circonstances de l'accident sont les suivantes :
{{circonstances_accident}}

Un procès-verbal a été établi par {{autorite}} le {{date_pv}} sous le numéro {{numero_pv}}.`,
      tags: ['faits', 'accident', 'responsabilite'],
      isMandatory: false,
      displayOrder: 11,
    },
    {
      category: BlockCategory.FAITS,
      title: 'Exposé des faits - Licenciement',
      content: `I. EXPOSÉ DES FAITS

{{salarie.civilite}} {{salarie.nom}} a été embauché(e) par la société {{employeur.nom}} le {{date_embauche}} en qualité de {{poste}}, moyennant une rémunération mensuelle brute de {{salaire}} euros.

Le {{date_licenciement}}, {{salarie.civilite}} {{salarie.nom}} a été licencié(e) pour le motif suivant : {{motif_licenciement}}.

Ce licenciement est intervenu dans les conditions suivantes : {{conditions_licenciement}}`,
      tags: ['faits', 'licenciement', 'travail'],
      isMandatory: false,
      displayOrder: 12,
    },

    // MOYENS blocks
    {
      category: BlockCategory.MOYENS,
      title: 'Moyen - Inexécution contractuelle',
      content: `II. DISCUSSION

A. Sur l'inexécution contractuelle

En vertu de l'article 1217 du Code civil, "La partie envers laquelle l'engagement n'a pas été exécuté, ou l'a été imparfaitement, peut refuser d'exécuter ou suspendre l'exécution de sa propre obligation".

En l'espèce, {{partie_defaillante.nom}} a manifestement manqué à son obligation de {{obligation_violee}}.

Cette inexécution est caractérisée par les éléments suivants : {{elements_inexecution}}

Il s'ensuit que {{partie_demanderesse.nom}} est fondé(e) à solliciter {{consequences}}.`,
      tags: ['moyens', 'contrat', 'inexecution'],
      isMandatory: false,
      displayOrder: 20,
    },
    {
      category: BlockCategory.MOYENS,
      title: 'Moyen - Responsabilité délictuelle',
      content: `II. DISCUSSION

A. Sur la responsabilité délictuelle

Aux termes de l'article 1240 du Code civil, "Tout fait quelconque de l'homme, qui cause à autrui un dommage, oblige celui par la faute duquel il est arrivé à le réparer".

La mise en œuvre de cette responsabilité suppose la démonstration d'une faute, d'un préjudice et d'un lien de causalité entre les deux.

1. Sur la faute
{{demonstration_faute}}

2. Sur le préjudice
{{description_prejudice}}

3. Sur le lien de causalité
{{demonstration_lien_causalite}}`,
      tags: ['moyens', 'responsabilite', 'delictuelle'],
      isMandatory: false,
      displayOrder: 21,
    },
    {
      category: BlockCategory.MOYENS,
      title: 'Moyen - Vice du consentement',
      content: `II. DISCUSSION

A. Sur le vice du consentement

En application de l'article 1130 du Code civil, "L'erreur, le dol et la violence vicient le consentement lorsqu'ils sont de telle nature que, sans eux, l'une des parties n'aurait pas contracté ou aurait contracté à des conditions substantiellement différentes".

En l'espèce, {{type_vice}} est caractérisé(e) par les éléments suivants :
{{elements_vice}}

Le contrat doit en conséquence être annulé avec toutes les conséquences de droit.`,
      tags: ['moyens', 'nullite', 'consentement'],
      isMandatory: false,
      displayOrder: 22,
    },
    {
      category: BlockCategory.MOYENS,
      title: 'Moyen - Licenciement sans cause réelle',
      content: `II. DISCUSSION

A. Sur l'absence de cause réelle et sérieuse du licenciement

En application de l'article L.1232-1 du Code du travail, tout licenciement pour motif personnel doit être justifié par une cause réelle et sérieuse.

La cause réelle doit être objective, exacte et vérifiable. La cause sérieuse doit être suffisamment importante pour justifier la rupture du contrat de travail.

En l'espèce, le motif invoqué par l'employeur ne saurait constituer une cause réelle et sérieuse car {{arguments_absence_cause}}.`,
      tags: ['moyens', 'licenciement', 'travail'],
      isMandatory: false,
      displayOrder: 23,
    },

    // DISPOSITIF blocks
    {
      category: BlockCategory.DISPOSITIF,
      title: 'Dispositif - Condamnation paiement',
      content: `PAR CES MOTIFS

Vu les articles {{articles_vises}},
Vu les pièces versées aux débats,

Plaise au Tribunal de :

- DÉCLARER {{demandeur.nom}} recevable et bien fondé(e) en ses demandes ;
- CONDAMNER {{defendeur.nom}} à payer à {{demandeur.nom}} la somme de {{montant_principal}} euros à titre de {{nature_creance}} ;
- CONDAMNER {{defendeur.nom}} à payer à {{demandeur.nom}} la somme de {{montant_interets}} euros au titre des intérêts au taux légal à compter du {{date_depart_interets}} ;
- CONDAMNER {{defendeur.nom}} aux entiers dépens ;
- CONDAMNER {{defendeur.nom}} à payer à {{demandeur.nom}} la somme de {{montant_article_700}} euros au titre de l'article 700 du Code de procédure civile ;
- ORDONNER l'exécution provisoire de la décision à intervenir.`,
      tags: ['dispositif', 'condamnation', 'paiement'],
      isMandatory: true,
      displayOrder: 30,
    },
    {
      category: BlockCategory.DISPOSITIF,
      title: 'Dispositif - Résolution contrat',
      content: `PAR CES MOTIFS

Vu les articles 1224 et suivants du Code civil,
Vu les pièces versées aux débats,

Plaise au Tribunal de :

- PRONONCER la résolution du contrat conclu le {{date_contrat}} entre {{partie1.nom}} et {{partie2.nom}} aux torts exclusifs de {{partie_fautive.nom}} ;
- CONDAMNER {{partie_fautive.nom}} à restituer à {{autre_partie.nom}} la somme de {{montant_restitution}} euros ;
- CONDAMNER {{partie_fautive.nom}} à payer à {{autre_partie.nom}} la somme de {{dommages_interets}} euros à titre de dommages et intérêts ;
- CONDAMNER {{partie_fautive.nom}} aux entiers dépens.`,
      tags: ['dispositif', 'resolution', 'contrat'],
      isMandatory: true,
      displayOrder: 31,
    },
    {
      category: BlockCategory.DISPOSITIF,
      title: 'Dispositif - Référé provision',
      content: `PAR CES MOTIFS

Vu l'article 835 du Code de procédure civile,

Plaise au Président du Tribunal statuant en référé de :

- CONSTATER que l'obligation de {{debiteur.nom}} n'est pas sérieusement contestable ;
- CONDAMNER {{debiteur.nom}} à payer à {{creancier.nom}} une provision de {{montant_provision}} euros à valoir sur l'indemnisation de son préjudice ;
- CONDAMNER {{debiteur.nom}} aux entiers dépens ;
- CONDAMNER {{debiteur.nom}} à payer à {{creancier.nom}} la somme de {{montant_article_700}} euros au titre de l'article 700 du Code de procédure civile.`,
      tags: ['dispositif', 'refere', 'provision'],
      isMandatory: true,
      displayOrder: 32,
    },

    // SIGNATURE blocks
    {
      category: BlockCategory.SIGNATURE,
      title: 'Formule signature avocat',
      content: `Sous toutes réserves

Fait à {{lieu}}, le {{date}}

Pour {{client.civilite}} {{client.nom}}
Son Conseil

Maître {{avocat.prenom}} {{avocat.nom}}
Avocat au Barreau de {{avocat.barreau}}`,
      tags: ['signature', 'avocat'],
      isMandatory: true,
      displayOrder: 40,
    },
    {
      category: BlockCategory.SIGNATURE,
      title: 'Bordereau de pièces',
      content: `BORDEREAU DE COMMUNICATION DE PIÈCES

{{#each pieces}}
Pièce n°{{@index}} : {{this.description}}
{{/each}}

Dont il est certifié que copie a été communiquée à la partie adverse par {{mode_communication}} en date du {{date_communication}}.`,
      tags: ['signature', 'bordereau', 'pieces'],
      isMandatory: false,
      displayOrder: 41,
    },

    // CLAUSE blocks
    {
      category: BlockCategory.CLAUSE,
      title: 'Clause pénale',
      content: `En cas de manquement par l'une des parties à l'une quelconque de ses obligations contractuelles, la partie défaillante devra verser à l'autre partie, à titre de clause pénale au sens de l'article 1231-5 du Code civil, une somme forfaitaire de {{montant_clause_penale}} euros.

Cette clause pénale est indépendante de l'éventuel préjudice réellement subi, dont la réparation pourra être demandée en sus si celui-ci excède le montant de la clause pénale.`,
      tags: ['clause', 'penale', 'contrat'],
      isMandatory: false,
      displayOrder: 50,
    },
    {
      category: BlockCategory.CLAUSE,
      title: 'Clause attributive de juridiction',
      content: `En cas de litige relatif à l'interprétation ou à l'exécution du présent contrat, et à défaut de résolution amiable, les parties conviennent expressément d'attribuer compétence exclusive au {{juridiction}} de {{ville_juridiction}}, et ce nonobstant pluralité de défendeurs ou appel en garantie.`,
      tags: ['clause', 'competence', 'juridiction'],
      isMandatory: false,
      displayOrder: 51,
    },

    // MENTION_LEGALE blocks
    {
      category: BlockCategory.MENTION_LEGALE,
      title: 'Mentions légales avocat',
      content: `Maître {{avocat.prenom}} {{avocat.nom}}
Avocat au Barreau de {{avocat.barreau}}
Toque n° {{avocat.toque}}
{{avocat.adresse}}
{{avocat.code_postal}} {{avocat.ville}}
Tél : {{avocat.telephone}} - Fax : {{avocat.fax}}
Email : {{avocat.email}}

Membre d'une association agréée, le règlement par chèque est accepté.`,
      tags: ['mentions', 'legales', 'avocat'],
      isMandatory: false,
      displayOrder: 60,
    },
  ];

  for (const block of systemBlocks) {
    await prisma.documentBlock.create({
      data: {
        cabinetId: demoCabinet.id,
        createdById: adminUser.id,
        category: block.category,
        title: block.title,
        content: block.content,
        tags: block.tags,
        isMandatory: block.isMandatory,
        isSystemBlock: true,
        displayOrder: block.displayOrder,
        variables: [],
      },
    });
  }

  console.log(`Created ${systemBlocks.length} system document blocks`);

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
