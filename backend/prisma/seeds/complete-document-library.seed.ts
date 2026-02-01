import { PrismaClient, BlockCategory, BuilderDocumentType, Juridiction, OutputFormat } from '@prisma/client';

const prisma = new PrismaClient();

interface BlockSeed {
  category: BlockCategory;
  title: string;
  content: string;
  variables: Array<{ name: string; type: string; required?: boolean }>;
  tags: string[];
  isSystemBlock: boolean;
  isMandatory: boolean;
  displayOrder: number;
}

interface TemplateSeed {
  name: string;
  documentType: BuilderDocumentType;
  juridiction: Juridiction | null;
  blocksStructure: Array<{ blockTitle: string; order: number; isOptional: boolean }>;
  outputFormat: OutputFormat;
  workflowConfig: { signature: boolean; lrar: boolean; autoStore: boolean };
  legalMentions: object;
  isSystemTemplate: boolean;
}

// ============================================
// SYSTEM BLOCKS - 150 BLOCS AU TOTAL
// ============================================

// ============================================
// INTRO BLOCKS (15)
// ============================================

const introBlocks: BlockSeed[] = [
  {
    category: BlockCategory.INTRO,
    title: 'Introduction assignation Tribunal Judiciaire',
    content: `L'AN DEUX MILLE VINGT-SIX
Et le {{date_assignation}}

A la requete de :
{{client.civilite}} {{client.nom}} {{client.prenom}}
Demeurant {{client.adresse}}
{{client.codePostal}} {{client.ville}}

Represente par Maitre {{avocat.nom}}, Avocat au Barreau de {{avocat.barreau}}
Toque n° {{avocat.toque}}
{{avocat.adresse}}
Tel : {{avocat.telephone}} - Email : {{avocat.email}}

J'AI, {{huissier.nom}}, Commissaire de Justice,
Demeurant {{huissier.adresse}}

DONNE ASSIGNATION A :

{{adversaire.civilite}} {{adversaire.nom}} {{adversaire.prenom}}
Demeurant {{adversaire.adresse}}
{{adversaire.codePostal}} {{adversaire.ville}}

A COMPARAITRE devant le Tribunal Judiciaire de {{juridiction.ville}}
Le {{date_audience}} a {{heure_audience}}
{{juridiction.adresse}}`,
    variables: [
      { name: 'date_assignation', type: 'date', required: true },
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'client.prenom', type: 'string', required: true },
      { name: 'client.adresse', type: 'string', required: true },
      { name: 'client.codePostal', type: 'string', required: true },
      { name: 'client.ville', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'avocat.toque', type: 'string' },
      { name: 'avocat.adresse', type: 'string', required: true },
      { name: 'avocat.telephone', type: 'string' },
      { name: 'avocat.email', type: 'string' },
      { name: 'huissier.nom', type: 'string', required: true },
      { name: 'huissier.adresse', type: 'string', required: true },
      { name: 'adversaire.civilite', type: 'string', required: true },
      { name: 'adversaire.nom', type: 'string', required: true },
      { name: 'adversaire.prenom', type: 'string' },
      { name: 'adversaire.adresse', type: 'string', required: true },
      { name: 'adversaire.codePostal', type: 'string', required: true },
      { name: 'adversaire.ville', type: 'string', required: true },
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'juridiction.adresse', type: 'string', required: true },
      { name: 'date_audience', type: 'date', required: true },
      { name: 'heure_audience', type: 'string', required: true },
    ],
    tags: ['assignation', 'tribunal_judiciaire', 'introduction', 'fond'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 1,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Introduction assignation en refere',
    content: `L'AN DEUX MILLE VINGT-SIX
Et le {{date_assignation}}

A la requete de :
{{client.civilite}} {{client.nom}} {{client.prenom}}
{{client.adresse}}, {{client.codePostal}} {{client.ville}}

Represente par Maitre {{avocat.nom}}, Avocat au Barreau de {{avocat.barreau}}

J'AI, {{huissier.nom}}, Commissaire de Justice,

DONNE ASSIGNATION EN REFERE A :

{{adversaire.civilite}} {{adversaire.nom}}
{{adversaire.adresse}}, {{adversaire.codePostal}} {{adversaire.ville}}

A COMPARAITRE EN REFERE devant Monsieur/Madame le President du Tribunal Judiciaire de {{juridiction.ville}}
Le {{date_audience}} a {{heure_audience}}
{{juridiction.adresse}}`,
    variables: [
      { name: 'date_assignation', type: 'date', required: true },
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'client.prenom', type: 'string' },
      { name: 'client.adresse', type: 'string', required: true },
      { name: 'client.codePostal', type: 'string', required: true },
      { name: 'client.ville', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'huissier.nom', type: 'string', required: true },
      { name: 'adversaire.civilite', type: 'string', required: true },
      { name: 'adversaire.nom', type: 'string', required: true },
      { name: 'adversaire.adresse', type: 'string', required: true },
      { name: 'adversaire.codePostal', type: 'string', required: true },
      { name: 'adversaire.ville', type: 'string', required: true },
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'juridiction.adresse', type: 'string', required: true },
      { name: 'date_audience', type: 'date', required: true },
      { name: 'heure_audience', type: 'string', required: true },
    ],
    tags: ['assignation', 'refere', 'introduction', 'urgence'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 2,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Introduction assignation Tribunal de Commerce',
    content: `L'AN DEUX MILLE VINGT-SIX
Et le {{date_assignation}}

A la requete de :
{{#if client.societe}}
La societe {{client.societe}}, {{client.forme_juridique}} au capital de {{client.capital}} euros
Immatriculee au RCS de {{client.rcs_ville}} sous le numero {{client.siren}}
Dont le siege social est {{client.adresse}}, {{client.codePostal}} {{client.ville}}
Prise en la personne de son representant legal en exercice
{{else}}
{{client.civilite}} {{client.nom}} {{client.prenom}}
{{client.adresse}}, {{client.codePostal}} {{client.ville}}
{{/if}}

Representee par Maitre {{avocat.nom}}, Avocat au Barreau de {{avocat.barreau}}

J'AI, {{huissier.nom}}, Commissaire de Justice,

DONNE ASSIGNATION A :

{{#if adversaire.societe}}
La societe {{adversaire.societe}}
{{adversaire.adresse}}, {{adversaire.codePostal}} {{adversaire.ville}}
{{else}}
{{adversaire.civilite}} {{adversaire.nom}}
{{adversaire.adresse}}, {{adversaire.codePostal}} {{adversaire.ville}}
{{/if}}

A COMPARAITRE devant le Tribunal de Commerce de {{juridiction.ville}}
Le {{date_audience}} a {{heure_audience}}
{{juridiction.adresse}}`,
    variables: [
      { name: 'date_assignation', type: 'date', required: true },
      { name: 'client.societe', type: 'string' },
      { name: 'client.forme_juridique', type: 'string' },
      { name: 'client.capital', type: 'number' },
      { name: 'client.rcs_ville', type: 'string' },
      { name: 'client.siren', type: 'string' },
      { name: 'client.civilite', type: 'string' },
      { name: 'client.nom', type: 'string' },
      { name: 'client.prenom', type: 'string' },
      { name: 'client.adresse', type: 'string', required: true },
      { name: 'client.codePostal', type: 'string', required: true },
      { name: 'client.ville', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'huissier.nom', type: 'string', required: true },
      { name: 'adversaire.societe', type: 'string' },
      { name: 'adversaire.civilite', type: 'string' },
      { name: 'adversaire.nom', type: 'string' },
      { name: 'adversaire.adresse', type: 'string', required: true },
      { name: 'adversaire.codePostal', type: 'string', required: true },
      { name: 'adversaire.ville', type: 'string', required: true },
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'juridiction.adresse', type: 'string', required: true },
      { name: 'date_audience', type: 'date', required: true },
      { name: 'heure_audience', type: 'string', required: true },
    ],
    tags: ['assignation', 'tribunal_commerce', 'introduction', 'commercial'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 3,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Introduction requete Conseil de Prudhommes',
    content: `CONSEIL DE PRUD'HOMMES DE {{juridiction.ville}}

REQUETE EN SAISINE

DEMANDEUR :
{{salarie.civilite}} {{salarie.prenom}} {{salarie.nom}}
Ne(e) le {{salarie.date_naissance}} a {{salarie.lieu_naissance}}
De nationalite {{salarie.nationalite}}
Demeurant {{salarie.adresse}}, {{salarie.codePostal}} {{salarie.ville}}

Represente par Maitre {{avocat.nom}}, Avocat au Barreau de {{avocat.barreau}}

DEFENDEUR :
{{employeur.nom}}
{{#if employeur.siren}}SIREN : {{employeur.siren}}{{/if}}
{{employeur.adresse}}, {{employeur.codePostal}} {{employeur.ville}}

SECTION : {{section_prudhommes}}

OBJET DE LA DEMANDE :
{{objet_demande}}`,
    variables: [
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.prenom', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'salarie.date_naissance', type: 'date' },
      { name: 'salarie.lieu_naissance', type: 'string' },
      { name: 'salarie.nationalite', type: 'string' },
      { name: 'salarie.adresse', type: 'string', required: true },
      { name: 'salarie.codePostal', type: 'string', required: true },
      { name: 'salarie.ville', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'employeur.siren', type: 'string' },
      { name: 'employeur.adresse', type: 'string', required: true },
      { name: 'employeur.codePostal', type: 'string', required: true },
      { name: 'employeur.ville', type: 'string', required: true },
      { name: 'section_prudhommes', type: 'string', required: true },
      { name: 'objet_demande', type: 'text', required: true },
    ],
    tags: ['requete', 'prudhommes', 'introduction', 'travail'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 4,
  },
  {
    category: BlockCategory.INTRO,
    title: 'En-tete conclusions recapitulatives',
    content: `CONCLUSIONS RECAPITULATIVES

POUR :
{{client.civilite}} {{client.prenom}} {{client.nom}}
{{client.adresse}}, {{client.codePostal}} {{client.ville}}
{{#if client.qualite}}{{client.qualite}}{{/if}}

Represente par Maitre {{avocat.nom}}
Avocat au Barreau de {{avocat.barreau}}

CONTRE :
{{adversaire.civilite}} {{adversaire.nom}}
{{adversaire.adresse}}, {{adversaire.codePostal}} {{adversaire.ville}}
{{#if adversaire.qualite}}{{adversaire.qualite}}{{/if}}

{{#if adversaire.avocat}}Represente par Maitre {{adversaire.avocat}}{{/if}}

DEVANT LE {{juridiction.nom}} DE {{juridiction.ville}}
N° RG : {{affaire.numero_rg}}

PLAISE AU TRIBUNAL`,
    variables: [
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.prenom', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'client.adresse', type: 'string', required: true },
      { name: 'client.codePostal', type: 'string', required: true },
      { name: 'client.ville', type: 'string', required: true },
      { name: 'client.qualite', type: 'string' },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'adversaire.civilite', type: 'string', required: true },
      { name: 'adversaire.nom', type: 'string', required: true },
      { name: 'adversaire.adresse', type: 'string', required: true },
      { name: 'adversaire.codePostal', type: 'string', required: true },
      { name: 'adversaire.ville', type: 'string', required: true },
      { name: 'adversaire.qualite', type: 'string' },
      { name: 'adversaire.avocat', type: 'string' },
      { name: 'juridiction.nom', type: 'string', required: true },
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'affaire.numero_rg', type: 'string' },
    ],
    tags: ['conclusions', 'recapitulatives', 'introduction'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 5,
  },
  {
    category: BlockCategory.INTRO,
    title: 'En-tete conclusions en reponse',
    content: `CONCLUSIONS EN REPONSE N°{{numero_conclusions}}

POUR :
{{client.civilite}} {{client.prenom}} {{client.nom}}
{{client.adresse}}, {{client.codePostal}} {{client.ville}}
DEFENDEUR

Represente par Maitre {{avocat.nom}}
Avocat au Barreau de {{avocat.barreau}}

CONTRE :
{{adversaire.civilite}} {{adversaire.nom}}
{{adversaire.adresse}}, {{adversaire.codePostal}} {{adversaire.ville}}
DEMANDEUR

{{#if adversaire.avocat}}Represente par Maitre {{adversaire.avocat}}{{/if}}

DEVANT LE {{juridiction.nom}} DE {{juridiction.ville}}
N° RG : {{affaire.numero_rg}}

EN REPONSE AUX CONCLUSIONS {{#if date_conclusions_adverses}}DU {{date_conclusions_adverses}}{{/if}}

PLAISE AU TRIBUNAL`,
    variables: [
      { name: 'numero_conclusions', type: 'number', required: true },
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.prenom', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'client.adresse', type: 'string', required: true },
      { name: 'client.codePostal', type: 'string', required: true },
      { name: 'client.ville', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'adversaire.civilite', type: 'string', required: true },
      { name: 'adversaire.nom', type: 'string', required: true },
      { name: 'adversaire.adresse', type: 'string', required: true },
      { name: 'adversaire.codePostal', type: 'string', required: true },
      { name: 'adversaire.ville', type: 'string', required: true },
      { name: 'adversaire.avocat', type: 'string' },
      { name: 'juridiction.nom', type: 'string', required: true },
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'affaire.numero_rg', type: 'string' },
      { name: 'date_conclusions_adverses', type: 'date' },
    ],
    tags: ['conclusions', 'reponse', 'introduction', 'defense'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 6,
  },
  {
    category: BlockCategory.INTRO,
    title: 'En-tete mise en demeure',
    content: `{{lieu}}, le {{date_courrier}}

LETTRE RECOMMANDEE AVEC ACCUSE DE RECEPTION
{{#if reference}}Ref. : {{reference}}{{/if}}

{{destinataire.civilite}} {{destinataire.nom}}
{{#if destinataire.societe}}{{destinataire.societe}}{{/if}}
{{destinataire.adresse}}
{{destinataire.codePostal}} {{destinataire.ville}}

Objet : MISE EN DEMEURE

{{destinataire.civilite}},

Nous intervenons en qualite de conseil de {{client.civilite}} {{client.prenom}} {{client.nom}}.`,
    variables: [
      { name: 'lieu', type: 'string', required: true },
      { name: 'date_courrier', type: 'date', required: true },
      { name: 'reference', type: 'string' },
      { name: 'destinataire.civilite', type: 'string', required: true },
      { name: 'destinataire.nom', type: 'string', required: true },
      { name: 'destinataire.societe', type: 'string' },
      { name: 'destinataire.adresse', type: 'string', required: true },
      { name: 'destinataire.codePostal', type: 'string', required: true },
      { name: 'destinataire.ville', type: 'string', required: true },
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.prenom', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
    ],
    tags: ['mise_en_demeure', 'courrier', 'introduction', 'lrar'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 7,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Convocation client audience',
    content: `{{lieu}}, le {{date_courrier}}

{{client.civilite}} {{client.prenom}} {{client.nom}}
{{client.adresse}}
{{client.codePostal}} {{client.ville}}

Objet : Convocation a l'audience du {{date_audience}}
Dossier : {{affaire.intitule}}
N° RG : {{affaire.numero_rg}}

{{client.civilite}},

J'ai l'honneur de vous informer que votre affaire sera appelee a l'audience du {{date_audience}} a {{heure_audience}}.

Juridiction : {{juridiction.nom}}
Adresse : {{juridiction.adresse}}
Salle : {{salle_audience}}

Votre presence est {{#if presence_obligatoire}}OBLIGATOIRE{{else}}souhaitee{{/if}}.

{{#if documents_apporter}}
Merci de vous munir des documents suivants :
{{documents_apporter}}
{{/if}}

Je reste a votre disposition pour tout renseignement complementaire.

Veuillez agreer, {{client.civilite}}, l'expression de mes salutations distinguees.`,
    variables: [
      { name: 'lieu', type: 'string', required: true },
      { name: 'date_courrier', type: 'date', required: true },
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.prenom', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'client.adresse', type: 'string', required: true },
      { name: 'client.codePostal', type: 'string', required: true },
      { name: 'client.ville', type: 'string', required: true },
      { name: 'date_audience', type: 'date', required: true },
      { name: 'heure_audience', type: 'string', required: true },
      { name: 'affaire.intitule', type: 'string', required: true },
      { name: 'affaire.numero_rg', type: 'string' },
      { name: 'juridiction.nom', type: 'string', required: true },
      { name: 'juridiction.adresse', type: 'string', required: true },
      { name: 'salle_audience', type: 'string' },
      { name: 'presence_obligatoire', type: 'boolean' },
      { name: 'documents_apporter', type: 'text' },
    ],
    tags: ['convocation', 'audience', 'client', 'courrier'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 8,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Courrier transmission pieces adversaire',
    content: `{{lieu}}, le {{date_courrier}}

Maitre {{adversaire.avocat}}
{{adversaire.avocat_adresse}}
{{adversaire.avocat_codePostal}} {{adversaire.avocat_ville}}

{{#if reference}}Ref. : {{reference}}{{/if}}
V/Ref. : {{reference_adverse}}
Dossier : {{affaire.intitule}}

Cher Confrere,

Je vous prie de bien vouloir trouver ci-joint les pieces suivantes versees au soutien des pretentions de mon client :

{{#each pieces}}
- Piece n°{{this.numero}} : {{this.intitule}}
{{/each}}

Je vous remercie de bien vouloir m'accuser reception de la presente.

Je vous prie d'agreer, Cher Confrere, l'expression de mes sentiments distingues.`,
    variables: [
      { name: 'lieu', type: 'string', required: true },
      { name: 'date_courrier', type: 'date', required: true },
      { name: 'adversaire.avocat', type: 'string', required: true },
      { name: 'adversaire.avocat_adresse', type: 'string', required: true },
      { name: 'adversaire.avocat_codePostal', type: 'string', required: true },
      { name: 'adversaire.avocat_ville', type: 'string', required: true },
      { name: 'reference', type: 'string' },
      { name: 'reference_adverse', type: 'string' },
      { name: 'affaire.intitule', type: 'string', required: true },
      { name: 'pieces', type: 'array', required: true },
    ],
    tags: ['courrier', 'transmission', 'pieces', 'confrere'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 9,
  },
  {
    category: BlockCategory.INTRO,
    title: 'En-tete requete injonction de payer',
    content: `REQUETE EN INJONCTION DE PAYER

A Monsieur/Madame le President du Tribunal {{#if commercial}}de Commerce{{else}}Judiciaire{{/if}} de {{juridiction.ville}}

Le demandeur :
{{#if creancier.societe}}
{{creancier.societe}}, {{creancier.forme_juridique}}
RCS {{creancier.rcs_ville}} {{creancier.siren}}
{{creancier.adresse}}, {{creancier.codePostal}} {{creancier.ville}}
{{else}}
{{creancier.civilite}} {{creancier.prenom}} {{creancier.nom}}
{{creancier.adresse}}, {{creancier.codePostal}} {{creancier.ville}}
{{/if}}

Le debiteur :
{{#if debiteur.societe}}
{{debiteur.societe}}
{{debiteur.adresse}}, {{debiteur.codePostal}} {{debiteur.ville}}
{{else}}
{{debiteur.civilite}} {{debiteur.prenom}} {{debiteur.nom}}
{{debiteur.adresse}}, {{debiteur.codePostal}} {{debiteur.ville}}
{{/if}}

EXPOSE DE LA DEMANDE`,
    variables: [
      { name: 'commercial', type: 'boolean' },
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'creancier.societe', type: 'string' },
      { name: 'creancier.forme_juridique', type: 'string' },
      { name: 'creancier.rcs_ville', type: 'string' },
      { name: 'creancier.siren', type: 'string' },
      { name: 'creancier.civilite', type: 'string' },
      { name: 'creancier.prenom', type: 'string' },
      { name: 'creancier.nom', type: 'string' },
      { name: 'creancier.adresse', type: 'string', required: true },
      { name: 'creancier.codePostal', type: 'string', required: true },
      { name: 'creancier.ville', type: 'string', required: true },
      { name: 'debiteur.societe', type: 'string' },
      { name: 'debiteur.civilite', type: 'string' },
      { name: 'debiteur.prenom', type: 'string' },
      { name: 'debiteur.nom', type: 'string' },
      { name: 'debiteur.adresse', type: 'string', required: true },
      { name: 'debiteur.codePostal', type: 'string', required: true },
      { name: 'debiteur.ville', type: 'string', required: true },
    ],
    tags: ['requete', 'injonction', 'payer', 'introduction'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 10,
  },
  {
    category: BlockCategory.INTRO,
    title: 'En-tete declaration appel',
    content: `DECLARATION D'APPEL

AU GREFFE DE LA COUR D'APPEL DE {{juridiction.ville}}

L'APPELANT :
{{client.civilite}} {{client.prenom}} {{client.nom}}
{{client.adresse}}, {{client.codePostal}} {{client.ville}}

Represente par Maitre {{avocat.nom}}, Avocat au Barreau de {{avocat.barreau}}
{{#if avocat.postulant}}Postulant : Maitre {{avocat.postulant}}, Avocat au Barreau de {{avocat.postulant_barreau}}{{/if}}

L'INTIME :
{{adversaire.civilite}} {{adversaire.nom}}
{{adversaire.adresse}}, {{adversaire.codePostal}} {{adversaire.ville}}

INTERJETTE APPEL de la decision rendue par le {{juridiction_premiere_instance}} de {{ville_premiere_instance}} le {{date_decision}}, N° RG : {{numero_rg_premiere_instance}}

{{#if appel_total}}APPEL TOTAL{{else}}APPEL PARTIEL portant sur :
{{chefs_appel}}{{/if}}`,
    variables: [
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.prenom', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'client.adresse', type: 'string', required: true },
      { name: 'client.codePostal', type: 'string', required: true },
      { name: 'client.ville', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'avocat.postulant', type: 'string' },
      { name: 'avocat.postulant_barreau', type: 'string' },
      { name: 'adversaire.civilite', type: 'string', required: true },
      { name: 'adversaire.nom', type: 'string', required: true },
      { name: 'adversaire.adresse', type: 'string', required: true },
      { name: 'adversaire.codePostal', type: 'string', required: true },
      { name: 'adversaire.ville', type: 'string', required: true },
      { name: 'juridiction_premiere_instance', type: 'string', required: true },
      { name: 'ville_premiere_instance', type: 'string', required: true },
      { name: 'date_decision', type: 'date', required: true },
      { name: 'numero_rg_premiere_instance', type: 'string', required: true },
      { name: 'appel_total', type: 'boolean' },
      { name: 'chefs_appel', type: 'text' },
    ],
    tags: ['appel', 'declaration', 'introduction', 'cour_appel'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 11,
  },
  {
    category: BlockCategory.INTRO,
    title: 'En-tete conclusions appel',
    content: `CONCLUSIONS D'APPELANT N°{{numero_conclusions}}

DEVANT LA COUR D'APPEL DE {{juridiction.ville}}
{{chambre}}

POUR :
{{client.civilite}} {{client.prenom}} {{client.nom}}
{{client.adresse}}, {{client.codePostal}} {{client.ville}}
APPELANT

Represente par Maitre {{avocat.nom}}, Avocat au Barreau de {{avocat.barreau}}

CONTRE :
{{adversaire.civilite}} {{adversaire.nom}}
{{adversaire.adresse}}, {{adversaire.codePostal}} {{adversaire.ville}}
INTIME

{{#if adversaire.avocat}}Represente par Maitre {{adversaire.avocat}}{{/if}}

N° RG : {{affaire.numero_rg}}
N° de repertoire : {{affaire.numero_repertoire}}

DECISION ENTREPRISE :
Jugement du {{juridiction_premiere_instance}} de {{ville_premiere_instance}} en date du {{date_decision}}

PLAISE A LA COUR`,
    variables: [
      { name: 'numero_conclusions', type: 'number', required: true },
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'chambre', type: 'string' },
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.prenom', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'client.adresse', type: 'string', required: true },
      { name: 'client.codePostal', type: 'string', required: true },
      { name: 'client.ville', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'adversaire.civilite', type: 'string', required: true },
      { name: 'adversaire.nom', type: 'string', required: true },
      { name: 'adversaire.adresse', type: 'string', required: true },
      { name: 'adversaire.codePostal', type: 'string', required: true },
      { name: 'adversaire.ville', type: 'string', required: true },
      { name: 'adversaire.avocat', type: 'string' },
      { name: 'affaire.numero_rg', type: 'string' },
      { name: 'affaire.numero_repertoire', type: 'string' },
      { name: 'juridiction_premiere_instance', type: 'string', required: true },
      { name: 'ville_premiere_instance', type: 'string', required: true },
      { name: 'date_decision', type: 'date', required: true },
    ],
    tags: ['conclusions', 'appel', 'appelant', 'introduction'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 12,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Courrier information client decision',
    content: `{{lieu}}, le {{date_courrier}}

{{client.civilite}} {{client.prenom}} {{client.nom}}
{{client.adresse}}
{{client.codePostal}} {{client.ville}}

Objet : Decision rendue - {{affaire.intitule}}
N° RG : {{affaire.numero_rg}}

{{client.civilite}},

J'ai l'honneur de vous informer que le {{juridiction.nom}} de {{juridiction.ville}} a rendu sa decision le {{date_decision}}.

{{#if decision_favorable}}
Je suis heureux de vous annoncer que la decision nous est favorable.
{{else}}
Je dois vous informer que la decision ne nous est pas entierement favorable.
{{/if}}

Resume de la decision :
{{resume_decision}}

{{#if delai_appel}}
Le delai pour interjeter appel est de {{delai_appel}} a compter de la notification de la decision.
{{/if}}

Je vous propose de nous rencontrer pour examiner les suites a donner a cette affaire.

Je reste a votre entiere disposition.

Veuillez agreer, {{client.civilite}}, l'expression de mes salutations distinguees.`,
    variables: [
      { name: 'lieu', type: 'string', required: true },
      { name: 'date_courrier', type: 'date', required: true },
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.prenom', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'client.adresse', type: 'string', required: true },
      { name: 'client.codePostal', type: 'string', required: true },
      { name: 'client.ville', type: 'string', required: true },
      { name: 'affaire.intitule', type: 'string', required: true },
      { name: 'affaire.numero_rg', type: 'string' },
      { name: 'juridiction.nom', type: 'string', required: true },
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'date_decision', type: 'date', required: true },
      { name: 'decision_favorable', type: 'boolean' },
      { name: 'resume_decision', type: 'text', required: true },
      { name: 'delai_appel', type: 'string' },
    ],
    tags: ['courrier', 'decision', 'client', 'information'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 13,
  },
  {
    category: BlockCategory.INTRO,
    title: 'En-tete note juridique',
    content: `NOTE JURIDIQUE

A l'attention de : {{destinataire}}
Redacteur : Maitre {{avocat.nom}}
Date : {{date_note}}
Objet : {{objet_note}}
{{#if reference}}Reference : {{reference}}{{/if}}

AVERTISSEMENT : La presente note est etablie sur la base des elements communiques et ne saurait constituer un avis juridique definitif. Elle a pour seul objet d'eclairer son destinataire sur les questions juridiques posees.

SOMMAIRE :
{{sommaire}}

---`,
    variables: [
      { name: 'destinataire', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'date_note', type: 'date', required: true },
      { name: 'objet_note', type: 'string', required: true },
      { name: 'reference', type: 'string' },
      { name: 'sommaire', type: 'text' },
    ],
    tags: ['note', 'juridique', 'introduction', 'consultation'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 14,
  },
  {
    category: BlockCategory.INTRO,
    title: 'En-tete protocole transactionnel',
    content: `PROTOCOLE TRANSACTIONNEL

ENTRE LES SOUSSIGNES :

{{#if partie1.societe}}
{{partie1.societe}}, {{partie1.forme_juridique}}
RCS {{partie1.rcs_ville}} {{partie1.siren}}
Siege social : {{partie1.adresse}}, {{partie1.codePostal}} {{partie1.ville}}
Representee par {{partie1.representant}}, {{partie1.qualite_representant}}
{{else}}
{{partie1.civilite}} {{partie1.prenom}} {{partie1.nom}}
Demeurant {{partie1.adresse}}, {{partie1.codePostal}} {{partie1.ville}}
{{/if}}
Ci-apres denommee "{{partie1.denomination}}"

D'UNE PART,

ET :

{{#if partie2.societe}}
{{partie2.societe}}, {{partie2.forme_juridique}}
RCS {{partie2.rcs_ville}} {{partie2.siren}}
Siege social : {{partie2.adresse}}, {{partie2.codePostal}} {{partie2.ville}}
Representee par {{partie2.representant}}, {{partie2.qualite_representant}}
{{else}}
{{partie2.civilite}} {{partie2.prenom}} {{partie2.nom}}
Demeurant {{partie2.adresse}}, {{partie2.codePostal}} {{partie2.ville}}
{{/if}}
Ci-apres denommee "{{partie2.denomination}}"

D'AUTRE PART,

Ci-apres collectivement denommees "les Parties"

IL A ETE PREALABLEMENT EXPOSE CE QUI SUIT :`,
    variables: [
      { name: 'partie1.societe', type: 'string' },
      { name: 'partie1.forme_juridique', type: 'string' },
      { name: 'partie1.rcs_ville', type: 'string' },
      { name: 'partie1.siren', type: 'string' },
      { name: 'partie1.representant', type: 'string' },
      { name: 'partie1.qualite_representant', type: 'string' },
      { name: 'partie1.civilite', type: 'string' },
      { name: 'partie1.prenom', type: 'string' },
      { name: 'partie1.nom', type: 'string' },
      { name: 'partie1.adresse', type: 'string', required: true },
      { name: 'partie1.codePostal', type: 'string', required: true },
      { name: 'partie1.ville', type: 'string', required: true },
      { name: 'partie1.denomination', type: 'string', required: true },
      { name: 'partie2.societe', type: 'string' },
      { name: 'partie2.forme_juridique', type: 'string' },
      { name: 'partie2.rcs_ville', type: 'string' },
      { name: 'partie2.siren', type: 'string' },
      { name: 'partie2.representant', type: 'string' },
      { name: 'partie2.qualite_representant', type: 'string' },
      { name: 'partie2.civilite', type: 'string' },
      { name: 'partie2.prenom', type: 'string' },
      { name: 'partie2.nom', type: 'string' },
      { name: 'partie2.adresse', type: 'string', required: true },
      { name: 'partie2.codePostal', type: 'string', required: true },
      { name: 'partie2.ville', type: 'string', required: true },
      { name: 'partie2.denomination', type: 'string', required: true },
    ],
    tags: ['protocole', 'transaction', 'introduction', 'accord'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 15,
  },
];

// ============================================
// FAITS BLOCKS (30)
// ============================================

const faitsBlocks: BlockSeed[] = [
  {
    category: BlockCategory.FAITS,
    title: 'Chronologie rupture contrat commercial',
    content: `I. RAPPEL DES FAITS

{{#if contrat.date_signature}}
Le {{contrat.date_signature}}, les parties ont conclu un contrat de {{contrat.type}} portant sur {{contrat.objet}}.
{{/if}}

{{#if contrat.duree}}
Ce contrat a ete conclu pour une duree de {{contrat.duree}}, {{#if contrat.renouvelable}}renouvelable par tacite reconduction{{/if}}.
{{/if}}

{{#if contrat.conditions_particulieres}}
Les conditions particulieres suivantes ont ete convenues :
{{contrat.conditions_particulieres}}
{{/if}}

{{#if contrat.date_rupture}}
Le {{contrat.date_rupture}}, {{partie_adverse}} a notifie la rupture du contrat {{#if preavis_respecte}}en respectant{{else}}sans respecter{{/if}} le preavis contractuel de {{preavis_contractuel}}.
{{/if}}

{{#if circonstances_rupture}}
Les circonstances de cette rupture sont les suivantes :
{{circonstances_rupture}}
{{/if}}`,
    variables: [
      { name: 'contrat.date_signature', type: 'date', required: true },
      { name: 'contrat.type', type: 'string', required: true },
      { name: 'contrat.objet', type: 'string', required: true },
      { name: 'contrat.duree', type: 'string' },
      { name: 'contrat.renouvelable', type: 'boolean' },
      { name: 'contrat.conditions_particulieres', type: 'text' },
      { name: 'contrat.date_rupture', type: 'date' },
      { name: 'partie_adverse', type: 'string', required: true },
      { name: 'preavis_respecte', type: 'boolean' },
      { name: 'preavis_contractuel', type: 'string' },
      { name: 'circonstances_rupture', type: 'text' },
    ],
    tags: ['faits', 'commercial', 'contrat', 'rupture'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 100,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose creance impayee',
    content: `I. RAPPEL DES FAITS

{{client.civilite}} {{client.nom}} est creancier de {{debiteur.nom}} au titre de {{origine_creance}}.

{{#if factures}}
Les factures suivantes sont demeurees impayees :
{{#each factures}}
- Facture n° {{this.numero}} du {{this.date}} : {{this.montant}} EUR {{#if this.echeance}}(echeance : {{this.echeance}}){{/if}}
{{/each}}

Soit un total de {{montant_total}} EUR TTC.
{{/if}}

{{#if relances}}
Malgre plusieurs relances en date des {{relances}}, {{debiteur.nom}} n'a pas procede au reglement de sa dette.
{{/if}}

{{#if mise_en_demeure_date}}
Une mise en demeure lui a ete adressee le {{mise_en_demeure_date}} par {{mise_en_demeure_mode}}, demeuree sans effet.
{{/if}}`,
    variables: [
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'debiteur.nom', type: 'string', required: true },
      { name: 'origine_creance', type: 'string', required: true },
      { name: 'factures', type: 'array' },
      { name: 'montant_total', type: 'number', required: true },
      { name: 'relances', type: 'string' },
      { name: 'mise_en_demeure_date', type: 'date' },
      { name: 'mise_en_demeure_mode', type: 'string' },
    ],
    tags: ['faits', 'creance', 'impaye', 'recouvrement'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 101,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose litige locatif impayes',
    content: `I. RAPPEL DES FAITS

Par bail en date du {{bail.date_signature}}, {{bailleur.civilite}} {{bailleur.nom}} a donne a bail a {{locataire.civilite}} {{locataire.nom}} un logement situe {{logement.adresse}}, {{logement.codePostal}} {{logement.ville}}.

Le loyer mensuel a ete fixe a {{loyer.montant}} EUR, {{#if loyer.charges}}charges comprises{{else}}hors charges (provisions pour charges : {{loyer.provisions_charges}} EUR){{/if}}.

{{#if impayes}}
Or, depuis le {{impayes.debut}}, le locataire ne s'acquitte plus regulierement de ses obligations.

A ce jour, l'arriere locatif s'eleve a la somme de {{impayes.montant}} EUR, correspondant a :
{{impayes.detail}}
{{/if}}

{{#if commandement_date}}
Un commandement de payer visant la clause resolutoire lui a ete delivre le {{commandement_date}}.
{{/if}}`,
    variables: [
      { name: 'bail.date_signature', type: 'date', required: true },
      { name: 'bailleur.civilite', type: 'string', required: true },
      { name: 'bailleur.nom', type: 'string', required: true },
      { name: 'locataire.civilite', type: 'string', required: true },
      { name: 'locataire.nom', type: 'string', required: true },
      { name: 'logement.adresse', type: 'string', required: true },
      { name: 'logement.codePostal', type: 'string', required: true },
      { name: 'logement.ville', type: 'string', required: true },
      { name: 'loyer.montant', type: 'number', required: true },
      { name: 'loyer.charges', type: 'boolean' },
      { name: 'loyer.provisions_charges', type: 'number' },
      { name: 'impayes.debut', type: 'date' },
      { name: 'impayes.montant', type: 'number' },
      { name: 'impayes.detail', type: 'text' },
      { name: 'commandement_date', type: 'date' },
    ],
    tags: ['faits', 'bail', 'locatif', 'impayes'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 102,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose licenciement conteste',
    content: `I. RAPPEL DES FAITS

{{salarie.civilite}} {{salarie.nom}} a ete embauche(e) par {{employeur.nom}} le {{contrat.date_embauche}} en qualite de {{contrat.poste}}, statut {{contrat.statut}}, moyennant une remuneration mensuelle brute de {{contrat.salaire}} EUR.

{{#if contrat.anciennete}}
Son anciennete dans l'entreprise est de {{contrat.anciennete}}.
{{/if}}

Le {{licenciement.date_notification}}, {{salarie.civilite}} {{salarie.nom}} a ete licencie(e) pour {{licenciement.motif}}.

{{#if licenciement.entretien_prealable}}
L'entretien prealable s'est tenu le {{licenciement.entretien_prealable}}.
{{/if}}

{{#if licenciement.contestation}}
{{salarie.civilite}} {{salarie.nom}} conteste ce licenciement pour les raisons suivantes :
{{licenciement.contestation}}
{{/if}}`,
    variables: [
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'contrat.date_embauche', type: 'date', required: true },
      { name: 'contrat.poste', type: 'string', required: true },
      { name: 'contrat.statut', type: 'string' },
      { name: 'contrat.salaire', type: 'number', required: true },
      { name: 'contrat.anciennete', type: 'string' },
      { name: 'licenciement.date_notification', type: 'date', required: true },
      { name: 'licenciement.motif', type: 'string', required: true },
      { name: 'licenciement.entretien_prealable', type: 'date' },
      { name: 'licenciement.contestation', type: 'text' },
    ],
    tags: ['faits', 'travail', 'licenciement', 'prudhommes'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 103,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose accident circulation',
    content: `I. RAPPEL DES FAITS

Le {{accident.date}} a {{accident.heure}}, un accident de la circulation est survenu {{accident.lieu}}.

Vehicules impliques :
- Vehicule de {{victime.nom}} : {{victime.vehicule}} immatricule {{victime.immatriculation}}
- Vehicule de {{responsable.nom}} : {{responsable.vehicule}} immatricule {{responsable.immatriculation}}

Circonstances :
{{accident.circonstances}}

{{#if accident.constat}}
Un constat amiable a ete etabli le {{accident.date_constat}}.
{{/if}}

{{#if accident.pv}}
Un proces-verbal a ete dresse par {{accident.autorite}} sous le numero {{accident.numero_pv}}.
{{/if}}

{{#if prejudices}}
{{victime.civilite}} {{victime.nom}} a subi les prejudices suivants :
{{prejudices}}
{{/if}}`,
    variables: [
      { name: 'accident.date', type: 'date', required: true },
      { name: 'accident.heure', type: 'string' },
      { name: 'accident.lieu', type: 'string', required: true },
      { name: 'victime.nom', type: 'string', required: true },
      { name: 'victime.civilite', type: 'string' },
      { name: 'victime.vehicule', type: 'string' },
      { name: 'victime.immatriculation', type: 'string' },
      { name: 'responsable.nom', type: 'string', required: true },
      { name: 'responsable.vehicule', type: 'string' },
      { name: 'responsable.immatriculation', type: 'string' },
      { name: 'accident.circonstances', type: 'text', required: true },
      { name: 'accident.constat', type: 'boolean' },
      { name: 'accident.date_constat', type: 'date' },
      { name: 'accident.pv', type: 'boolean' },
      { name: 'accident.autorite', type: 'string' },
      { name: 'accident.numero_pv', type: 'string' },
      { name: 'prejudices', type: 'text' },
    ],
    tags: ['faits', 'accident', 'circulation', 'responsabilite'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 104,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose vices caches immobilier',
    content: `I. RAPPEL DES FAITS

Par acte authentique en date du {{vente.date}}, {{vendeur.civilite}} {{vendeur.nom}} a vendu a {{acquereur.civilite}} {{acquereur.nom}} un bien immobilier situe {{bien.adresse}}, {{bien.codePostal}} {{bien.ville}}, moyennant le prix de {{vente.prix}} EUR.

{{#if diagnostics}}
Les diagnostics suivants ont ete annexes a l'acte de vente :
{{diagnostics}}
{{/if}}

Or, posterieurement a la vente, {{acquereur.civilite}} {{acquereur.nom}} a decouvert les vices suivants :

{{#each vices}}
- {{this.description}} (decouvert le {{this.date_decouverte}})
{{/each}}

{{#if expertise}}
Une expertise {{#if expertise.judiciaire}}judiciaire{{else}}amiable{{/if}} a ete realisee le {{expertise.date}} par {{expertise.expert}}. Elle conclut a :
{{expertise.conclusions}}
{{/if}}

Le cout des travaux de reprise est estime a {{cout_reparation}} EUR.`,
    variables: [
      { name: 'vente.date', type: 'date', required: true },
      { name: 'vendeur.civilite', type: 'string', required: true },
      { name: 'vendeur.nom', type: 'string', required: true },
      { name: 'acquereur.civilite', type: 'string', required: true },
      { name: 'acquereur.nom', type: 'string', required: true },
      { name: 'bien.adresse', type: 'string', required: true },
      { name: 'bien.codePostal', type: 'string', required: true },
      { name: 'bien.ville', type: 'string', required: true },
      { name: 'vente.prix', type: 'number', required: true },
      { name: 'diagnostics', type: 'text' },
      { name: 'vices', type: 'array', required: true },
      { name: 'expertise', type: 'object' },
      { name: 'expertise.judiciaire', type: 'boolean' },
      { name: 'expertise.date', type: 'date' },
      { name: 'expertise.expert', type: 'string' },
      { name: 'expertise.conclusions', type: 'text' },
      { name: 'cout_reparation', type: 'number', required: true },
    ],
    tags: ['faits', 'immobilier', 'vices_caches', 'vente'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 105,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose malfacons construction',
    content: `I. RAPPEL DES FAITS

{{#if marche.date}}
Le {{marche.date}}, {{maitre_ouvrage.civilite}} {{maitre_ouvrage.nom}} a confie a {{entreprise.nom}} la realisation de {{nature_travaux}} sur le bien situe {{bien.adresse}}, {{bien.codePostal}} {{bien.ville}}.
{{/if}}

Le marche portait sur un montant de {{marche.montant}} EUR {{#if marche.ht}}HT{{else}}TTC{{/if}}.

{{#if reception.date}}
La reception des travaux {{#if reception.reserves}}avec reserves{{else}}sans reserve{{/if}} est intervenue le {{reception.date}}.
{{/if}}

Or, les malfacons suivantes ont ete constatees :

{{#each malfacons}}
- {{this.description}}
{{/each}}

{{#if expertise}}
Une expertise a ete realisee par {{expertise.expert}} le {{expertise.date}}, concluant a :
{{expertise.conclusions}}
{{/if}}

{{#if mises_en_demeure}}
Malgre les mises en demeure adressees les {{mises_en_demeure}}, {{entreprise.nom}} n'a pas procede aux reprises necessaires.
{{/if}}`,
    variables: [
      { name: 'marche.date', type: 'date', required: true },
      { name: 'maitre_ouvrage.civilite', type: 'string', required: true },
      { name: 'maitre_ouvrage.nom', type: 'string', required: true },
      { name: 'entreprise.nom', type: 'string', required: true },
      { name: 'nature_travaux', type: 'string', required: true },
      { name: 'bien.adresse', type: 'string', required: true },
      { name: 'bien.codePostal', type: 'string', required: true },
      { name: 'bien.ville', type: 'string', required: true },
      { name: 'marche.montant', type: 'number', required: true },
      { name: 'marche.ht', type: 'boolean' },
      { name: 'reception.date', type: 'date' },
      { name: 'reception.reserves', type: 'boolean' },
      { name: 'malfacons', type: 'array', required: true },
      { name: 'expertise', type: 'object' },
      { name: 'expertise.expert', type: 'string' },
      { name: 'expertise.date', type: 'date' },
      { name: 'expertise.conclusions', type: 'text' },
      { name: 'mises_en_demeure', type: 'string' },
    ],
    tags: ['faits', 'construction', 'malfacons', 'travaux'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 106,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose divorce contentieux',
    content: `I. RAPPEL DES FAITS

{{epoux1.civilite}} {{epoux1.prenom}} {{epoux1.nom}} et {{epoux2.civilite}} {{epoux2.prenom}} {{epoux2.nom}} se sont maries le {{mariage.date}} a {{mariage.lieu}}, sous le regime {{mariage.regime}}.

{{#if enfants}}
De cette union sont issus {{nombre_enfants}} enfant(s) :
{{#each enfants}}
- {{this.prenom}} {{this.nom}}, ne(e) le {{this.date_naissance}}
{{/each}}
{{/if}}

{{#if domicile_conjugal}}
Le domicile conjugal est situe {{domicile_conjugal}}.
{{/if}}

{{separation.description}}

{{#if fautes}}
Les fautes reprochees a {{epoux_fautif}} sont les suivantes :
{{fautes}}
{{/if}}`,
    variables: [
      { name: 'epoux1.civilite', type: 'string', required: true },
      { name: 'epoux1.prenom', type: 'string', required: true },
      { name: 'epoux1.nom', type: 'string', required: true },
      { name: 'epoux2.civilite', type: 'string', required: true },
      { name: 'epoux2.prenom', type: 'string', required: true },
      { name: 'epoux2.nom', type: 'string', required: true },
      { name: 'mariage.date', type: 'date', required: true },
      { name: 'mariage.lieu', type: 'string', required: true },
      { name: 'mariage.regime', type: 'string', required: true },
      { name: 'enfants', type: 'array' },
      { name: 'nombre_enfants', type: 'number' },
      { name: 'domicile_conjugal', type: 'string' },
      { name: 'separation.description', type: 'text', required: true },
      { name: 'fautes', type: 'text' },
      { name: 'epoux_fautif', type: 'string' },
    ],
    tags: ['faits', 'famille', 'divorce', 'contentieux'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 107,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose succession contentieuse',
    content: `I. RAPPEL DES FAITS

{{defunt.civilite}} {{defunt.prenom}} {{defunt.nom}} est decede(e) le {{deces.date}} a {{deces.lieu}}, laissant pour lui succeder :

{{#each heritiers}}
- {{this.civilite}} {{this.prenom}} {{this.nom}}, {{this.qualite}}
{{/each}}

{{#if testament}}
Le defunt avait etabli un testament {{testament.type}} le {{testament.date}}{{#if testament.notaire}}, recu par Maitre {{testament.notaire}}{{/if}}.

Ce testament prevoit :
{{testament.dispositions}}
{{/if}}

{{#if actif_succession}}
L'actif de la succession comprend notamment :
{{actif_succession}}
{{/if}}

{{#if passif_succession}}
Le passif de la succession s'eleve a :
{{passif_succession}}
{{/if}}

{{litige.description}}`,
    variables: [
      { name: 'defunt.civilite', type: 'string', required: true },
      { name: 'defunt.prenom', type: 'string', required: true },
      { name: 'defunt.nom', type: 'string', required: true },
      { name: 'deces.date', type: 'date', required: true },
      { name: 'deces.lieu', type: 'string', required: true },
      { name: 'heritiers', type: 'array', required: true },
      { name: 'testament', type: 'object' },
      { name: 'testament.type', type: 'string' },
      { name: 'testament.date', type: 'date' },
      { name: 'testament.notaire', type: 'string' },
      { name: 'testament.dispositions', type: 'text' },
      { name: 'actif_succession', type: 'text' },
      { name: 'passif_succession', type: 'text' },
      { name: 'litige.description', type: 'text', required: true },
    ],
    tags: ['faits', 'succession', 'heritage', 'famille'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 108,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose concurrence deloyale',
    content: `I. RAPPEL DES FAITS

{{societe_victime.nom}} est une societe specialisee dans {{societe_victime.activite}}, immatriculee au RCS de {{societe_victime.rcs}} depuis le {{societe_victime.date_creation}}.

{{societe_concurrente.nom}} exerce une activite similaire sur le meme marche depuis {{societe_concurrente.date_creation}}.

{{#if ancienne_relation}}
Les societes ont entretenu une relation commerciale du {{ancienne_relation.debut}} au {{ancienne_relation.fin}}.
{{/if}}

Or, {{societe_concurrente.nom}} se livre aux actes de concurrence deloyale suivants :

{{#each actes_deloyaux}}
- {{this.description}} (constate le {{this.date}})
{{/each}}

{{#if preuves}}
Ces agissements sont etablis par les elements suivants :
{{preuves}}
{{/if}}

{{#if prejudice}}
Le prejudice subi par {{societe_victime.nom}} est le suivant :
{{prejudice}}
{{/if}}`,
    variables: [
      { name: 'societe_victime.nom', type: 'string', required: true },
      { name: 'societe_victime.activite', type: 'string', required: true },
      { name: 'societe_victime.rcs', type: 'string' },
      { name: 'societe_victime.date_creation', type: 'date' },
      { name: 'societe_concurrente.nom', type: 'string', required: true },
      { name: 'societe_concurrente.date_creation', type: 'date' },
      { name: 'ancienne_relation', type: 'object' },
      { name: 'ancienne_relation.debut', type: 'date' },
      { name: 'ancienne_relation.fin', type: 'date' },
      { name: 'actes_deloyaux', type: 'array', required: true },
      { name: 'preuves', type: 'text' },
      { name: 'prejudice', type: 'text' },
    ],
    tags: ['faits', 'commercial', 'concurrence_deloyale', 'societe'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 109,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose harcelement moral travail',
    content: `I. RAPPEL DES FAITS

{{salarie.civilite}} {{salarie.prenom}} {{salarie.nom}} a ete embauche(e) le {{embauche.date}} par {{employeur.nom}} en qualite de {{embauche.poste}}.

{{#if contexte}}
Le contexte professionnel est le suivant :
{{contexte}}
{{/if}}

A compter du {{debut_harcelement}}, {{salarie.civilite}} {{salarie.nom}} a ete victime d'agissements repetes de harcelement moral de la part de {{auteur_harcelement}} :

{{#each faits_harcelement}}
- Le {{this.date}} : {{this.description}}
{{/each}}

{{#if consequences_sante}}
Ces agissements ont eu les consequences suivantes sur la sante de {{salarie.civilite}} {{salarie.nom}} :
{{consequences_sante}}
{{/if}}

{{#if alertes}}
{{salarie.civilite}} {{salarie.nom}} a alerte :
{{alertes}}
{{/if}}

{{#if arrets_travail}}
Ces agissements ont entraine les arrets de travail suivants :
{{arrets_travail}}
{{/if}}`,
    variables: [
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.prenom', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'embauche.date', type: 'date', required: true },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'embauche.poste', type: 'string', required: true },
      { name: 'contexte', type: 'text' },
      { name: 'debut_harcelement', type: 'date', required: true },
      { name: 'auteur_harcelement', type: 'string', required: true },
      { name: 'faits_harcelement', type: 'array', required: true },
      { name: 'consequences_sante', type: 'text' },
      { name: 'alertes', type: 'text' },
      { name: 'arrets_travail', type: 'text' },
    ],
    tags: ['faits', 'travail', 'harcelement', 'moral'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 110,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose discrimination',
    content: `I. RAPPEL DES FAITS

{{victime.civilite}} {{victime.prenom}} {{victime.nom}} {{#if salarie}}est salarie(e) de {{employeur.nom}} depuis le {{embauche.date}}{{else}}a postule aupres de {{employeur.nom}} le {{candidature.date}}{{/if}}.

{{#if contexte}}
Le contexte est le suivant :
{{contexte}}
{{/if}}

{{victime.civilite}} {{victime.nom}} a fait l'objet d'une discrimination fondee sur {{critere_discrimination}} se manifestant par :

{{#each faits_discrimination}}
- {{this.description}} ({{this.date}})
{{/each}}

{{#if comparateurs}}
A titre de comparaison, les elements suivants etablissent la difference de traitement :
{{comparateurs}}
{{/if}}

{{#if prejudice}}
Cette discrimination a cause le prejudice suivant :
{{prejudice}}
{{/if}}`,
    variables: [
      { name: 'victime.civilite', type: 'string', required: true },
      { name: 'victime.prenom', type: 'string', required: true },
      { name: 'victime.nom', type: 'string', required: true },
      { name: 'salarie', type: 'boolean' },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'embauche.date', type: 'date' },
      { name: 'candidature.date', type: 'date' },
      { name: 'contexte', type: 'text' },
      { name: 'critere_discrimination', type: 'string', required: true },
      { name: 'faits_discrimination', type: 'array', required: true },
      { name: 'comparateurs', type: 'text' },
      { name: 'prejudice', type: 'text' },
    ],
    tags: ['faits', 'travail', 'discrimination', 'egalite'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 111,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose procedure collective',
    content: `I. RAPPEL DES FAITS

La societe {{societe.nom}}, {{societe.forme}} au capital de {{societe.capital}} EUR, immatriculee au RCS de {{societe.rcs}} sous le numero {{societe.siren}}, exerce une activite de {{societe.activite}}.

Le {{procedure.date_ouverture}}, le Tribunal de Commerce de {{procedure.tribunal}} a ouvert une procedure de {{procedure.type}} a l'encontre de la societe.

{{#if administrateur}}
Maitre {{administrateur}} a ete designe en qualite d'administrateur judiciaire.
{{/if}}

{{#if mandataire}}
Maitre {{mandataire}} a ete designe en qualite de mandataire judiciaire.
{{/if}}

{{#if creance}}
Notre client, {{creancier.nom}}, est titulaire d'une creance de {{creance.montant}} EUR au titre de {{creance.origine}}.

Cette creance a ete declaree le {{creance.date_declaration}}.
{{/if}}

{{#if contestation}}
La creance fait l'objet de la contestation suivante :
{{contestation}}
{{/if}}`,
    variables: [
      { name: 'societe.nom', type: 'string', required: true },
      { name: 'societe.forme', type: 'string', required: true },
      { name: 'societe.capital', type: 'number' },
      { name: 'societe.rcs', type: 'string' },
      { name: 'societe.siren', type: 'string' },
      { name: 'societe.activite', type: 'string' },
      { name: 'procedure.date_ouverture', type: 'date', required: true },
      { name: 'procedure.tribunal', type: 'string', required: true },
      { name: 'procedure.type', type: 'string', required: true },
      { name: 'administrateur', type: 'string' },
      { name: 'mandataire', type: 'string' },
      { name: 'creancier.nom', type: 'string' },
      { name: 'creance.montant', type: 'number' },
      { name: 'creance.origine', type: 'string' },
      { name: 'creance.date_declaration', type: 'date' },
      { name: 'contestation', type: 'text' },
    ],
    tags: ['faits', 'commercial', 'procedure_collective', 'creance'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 112,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose contrefacon marque',
    content: `I. RAPPEL DES FAITS

{{titulaire.nom}} est titulaire de la marque "{{marque.nom}}", enregistree le {{marque.date_enregistrement}} sous le numero {{marque.numero}} pour les classes {{marque.classes}}.

{{#if marque.renouvellement}}
Cette marque a ete renouvelee le {{marque.date_renouvellement}}.
{{/if}}

{{contrefacteur.nom}} commercialise des produits/services sous le signe "{{signe_contrefaisant}}" depuis le {{debut_contrefacon}}.

Les actes de contrefacon constates sont les suivants :

{{#each actes_contrefacon}}
- {{this.description}}
{{/each}}

{{#if constat}}
Un constat {{#if constat.huissier}}de commissaire de justice{{else}}d'achat{{/if}} a ete etabli le {{constat.date}}.
{{/if}}

{{#if prejudice}}
Le prejudice subi est estime a :
{{prejudice}}
{{/if}}`,
    variables: [
      { name: 'titulaire.nom', type: 'string', required: true },
      { name: 'marque.nom', type: 'string', required: true },
      { name: 'marque.date_enregistrement', type: 'date', required: true },
      { name: 'marque.numero', type: 'string', required: true },
      { name: 'marque.classes', type: 'string', required: true },
      { name: 'marque.renouvellement', type: 'boolean' },
      { name: 'marque.date_renouvellement', type: 'date' },
      { name: 'contrefacteur.nom', type: 'string', required: true },
      { name: 'signe_contrefaisant', type: 'string', required: true },
      { name: 'debut_contrefacon', type: 'date' },
      { name: 'actes_contrefacon', type: 'array', required: true },
      { name: 'constat', type: 'object' },
      { name: 'constat.huissier', type: 'boolean' },
      { name: 'constat.date', type: 'date' },
      { name: 'prejudice', type: 'text' },
    ],
    tags: ['faits', 'propriete_intellectuelle', 'contrefacon', 'marque'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 113,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose accident du travail',
    content: `I. RAPPEL DES FAITS

{{salarie.civilite}} {{salarie.prenom}} {{salarie.nom}}, salarie(e) de {{employeur.nom}} depuis le {{embauche.date}} en qualite de {{embauche.poste}}, a ete victime d'un accident du travail le {{accident.date}} a {{accident.heure}}.

Circonstances de l'accident :
{{accident.circonstances}}

{{#if accident.lieu}}
L'accident s'est produit {{accident.lieu}}.
{{/if}}

{{#if temoins}}
Les temoins de l'accident sont :
{{#each temoins}}
- {{this.nom}} ({{this.qualite}})
{{/each}}
{{/if}}

{{#if declaration}}
L'accident a ete declare le {{declaration.date}} aupres de {{declaration.organisme}}.
{{/if}}

{{#if lesions}}
Les lesions constatees sont les suivantes :
{{lesions}}
{{/if}}

{{#if consolidation}}
La date de consolidation a ete fixee au {{consolidation.date}} avec un taux d'IPP de {{consolidation.taux}}%.
{{/if}}

{{#if faute_employeur}}
La faute inexcusable de l'employeur est caracterisee par :
{{faute_employeur}}
{{/if}}`,
    variables: [
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.prenom', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'embauche.date', type: 'date', required: true },
      { name: 'embauche.poste', type: 'string', required: true },
      { name: 'accident.date', type: 'date', required: true },
      { name: 'accident.heure', type: 'string' },
      { name: 'accident.circonstances', type: 'text', required: true },
      { name: 'accident.lieu', type: 'string' },
      { name: 'temoins', type: 'array' },
      { name: 'declaration', type: 'object' },
      { name: 'declaration.date', type: 'date' },
      { name: 'declaration.organisme', type: 'string' },
      { name: 'lesions', type: 'text' },
      { name: 'consolidation', type: 'object' },
      { name: 'consolidation.date', type: 'date' },
      { name: 'consolidation.taux', type: 'number' },
      { name: 'faute_employeur', type: 'text' },
    ],
    tags: ['faits', 'travail', 'accident', 'securite_sociale'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 114,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose troubles voisinage',
    content: `I. RAPPEL DES FAITS

{{victime.civilite}} {{victime.prenom}} {{victime.nom}} est proprietaire/locataire d'un bien situe {{victime.adresse}}, {{victime.codePostal}} {{victime.ville}} depuis le {{victime.date_entree}}.

{{auteur.civilite}} {{auteur.nom}} occupe le bien {{#if auteur.adjacent}}adjacent{{else}}situe {{auteur.adresse}}{{/if}}.

Depuis le {{debut_troubles}}, {{victime.civilite}} {{victime.nom}} subit les troubles anormaux de voisinage suivants :

{{#each troubles}}
- {{this.description}} (frequence : {{this.frequence}})
{{/each}}

{{#if constats}}
Ces troubles ont ete constates par :
{{constats}}
{{/if}}

{{#if demarches_amiables}}
Les demarches amiables suivantes ont ete entreprises sans succes :
{{demarches_amiables}}
{{/if}}

{{#if prejudice}}
Le prejudice subi est le suivant :
{{prejudice}}
{{/if}}`,
    variables: [
      { name: 'victime.civilite', type: 'string', required: true },
      { name: 'victime.prenom', type: 'string', required: true },
      { name: 'victime.nom', type: 'string', required: true },
      { name: 'victime.adresse', type: 'string', required: true },
      { name: 'victime.codePostal', type: 'string', required: true },
      { name: 'victime.ville', type: 'string', required: true },
      { name: 'victime.date_entree', type: 'date' },
      { name: 'auteur.civilite', type: 'string', required: true },
      { name: 'auteur.nom', type: 'string', required: true },
      { name: 'auteur.adjacent', type: 'boolean' },
      { name: 'auteur.adresse', type: 'string' },
      { name: 'debut_troubles', type: 'date', required: true },
      { name: 'troubles', type: 'array', required: true },
      { name: 'constats', type: 'text' },
      { name: 'demarches_amiables', type: 'text' },
      { name: 'prejudice', type: 'text' },
    ],
    tags: ['faits', 'voisinage', 'troubles', 'immobilier'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 115,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose heures supplementaires impayees',
    content: `I. RAPPEL DES FAITS

{{salarie.civilite}} {{salarie.prenom}} {{salarie.nom}} a ete embauche(e) par {{employeur.nom}} le {{embauche.date}} en qualite de {{embauche.poste}}.

Le contrat de travail prevoit une duree hebdomadaire de travail de {{duree_contractuelle}} heures.

Or, {{salarie.civilite}} {{salarie.nom}} a regulierement effectue des heures supplementaires qui n'ont pas ete remunerees :

{{#each periodes}}
- Du {{this.debut}} au {{this.fin}} : {{this.heures}} heures supplementaires
{{/each}}

{{#if preuves}}
Ces heures supplementaires sont etablies par :
{{preuves}}
{{/if}}

Le rappel de salaire du au titre des heures supplementaires s'eleve a :
- Heures supplementaires majorees a 25% : {{montant_25}} EUR
- Heures supplementaires majorees a 50% : {{montant_50}} EUR
{{#if repos_compensateur}}
- Contrepartie obligatoire en repos : {{repos_compensateur}} heures
{{/if}}

Soit un total de {{montant_total}} EUR brut.`,
    variables: [
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.prenom', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'embauche.date', type: 'date', required: true },
      { name: 'embauche.poste', type: 'string', required: true },
      { name: 'duree_contractuelle', type: 'number', required: true },
      { name: 'periodes', type: 'array', required: true },
      { name: 'preuves', type: 'text' },
      { name: 'montant_25', type: 'number' },
      { name: 'montant_50', type: 'number' },
      { name: 'repos_compensateur', type: 'number' },
      { name: 'montant_total', type: 'number', required: true },
    ],
    tags: ['faits', 'travail', 'heures_supplementaires', 'salaire'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 116,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose rupture brutale relations commerciales',
    content: `I. RAPPEL DES FAITS

{{victime.nom}} entretient des relations commerciales avec {{auteur.nom}} depuis le {{debut_relation}}.

Ces relations portaient sur {{objet_relation}}.

Le chiffre d'affaires realise avec {{auteur.nom}} representait :
{{#each ca_annees}}
- {{this.annee}} : {{this.montant}} EUR (soit {{this.pourcentage}}% du CA total)
{{/each}}

Le {{date_rupture}}, {{auteur.nom}} a rompu les relations commerciales {{#if preavis}}avec un preavis de {{preavis}}{{else}}sans preavis{{/if}}.

{{#if circonstances_rupture}}
Les circonstances de cette rupture sont les suivantes :
{{circonstances_rupture}}
{{/if}}

{{#if dependance_economique}}
La dependance economique de {{victime.nom}} envers {{auteur.nom}} est caracterisee par :
{{dependance_economique}}
{{/if}}

Compte tenu de la duree de la relation ({{duree_relation}}), le preavis raisonnable aurait du etre de {{preavis_raisonnable}}.`,
    variables: [
      { name: 'victime.nom', type: 'string', required: true },
      { name: 'auteur.nom', type: 'string', required: true },
      { name: 'debut_relation', type: 'date', required: true },
      { name: 'objet_relation', type: 'string', required: true },
      { name: 'ca_annees', type: 'array' },
      { name: 'date_rupture', type: 'date', required: true },
      { name: 'preavis', type: 'string' },
      { name: 'circonstances_rupture', type: 'text' },
      { name: 'dependance_economique', type: 'text' },
      { name: 'duree_relation', type: 'string', required: true },
      { name: 'preavis_raisonnable', type: 'string', required: true },
    ],
    tags: ['faits', 'commercial', 'rupture_brutale', 'relations_commerciales'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 117,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose droit de visite et hebergement',
    content: `I. RAPPEL DES FAITS

{{parent1.civilite}} {{parent1.prenom}} {{parent1.nom}} et {{parent2.civilite}} {{parent2.prenom}} {{parent2.nom}} sont les parents de :

{{#each enfants}}
- {{this.prenom}}, ne(e) le {{this.date_naissance}}
{{/each}}

{{#if separation}}
Les parents se sont separes le {{separation.date}}.
{{/if}}

{{#if decision_anterieure}}
Par decision du {{decision_anterieure.date}}, le {{decision_anterieure.juridiction}} a fixe la residence des enfants chez {{decision_anterieure.residence}} et accorde un droit de visite et d'hebergement a {{decision_anterieure.dvh_parent}}.
{{/if}}

{{#if non_respect}}
Or, depuis le {{non_respect.date}}, {{parent_fautif}} :
{{non_respect.description}}
{{/if}}

{{#if evolution}}
En raison de l'evolution de la situation :
{{evolution}}
{{/if}}`,
    variables: [
      { name: 'parent1.civilite', type: 'string', required: true },
      { name: 'parent1.prenom', type: 'string', required: true },
      { name: 'parent1.nom', type: 'string', required: true },
      { name: 'parent2.civilite', type: 'string', required: true },
      { name: 'parent2.prenom', type: 'string', required: true },
      { name: 'parent2.nom', type: 'string', required: true },
      { name: 'enfants', type: 'array', required: true },
      { name: 'separation', type: 'object' },
      { name: 'separation.date', type: 'date' },
      { name: 'decision_anterieure', type: 'object' },
      { name: 'decision_anterieure.date', type: 'date' },
      { name: 'decision_anterieure.juridiction', type: 'string' },
      { name: 'decision_anterieure.residence', type: 'string' },
      { name: 'decision_anterieure.dvh_parent', type: 'string' },
      { name: 'non_respect', type: 'object' },
      { name: 'non_respect.date', type: 'date' },
      { name: 'parent_fautif', type: 'string' },
      { name: 'non_respect.description', type: 'text' },
      { name: 'evolution', type: 'text' },
    ],
    tags: ['faits', 'famille', 'dvh', 'enfants'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 118,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose pension alimentaire',
    content: `I. RAPPEL DES FAITS

{{debiteur.civilite}} {{debiteur.prenom}} {{debiteur.nom}} est redevable d'une pension alimentaire envers {{creancier.civilite}} {{creancier.prenom}} {{creancier.nom}} au titre de {{beneficiaire}}.

{{#if decision}}
Cette pension a ete fixee par {{decision.juridiction}} le {{decision.date}} a la somme de {{decision.montant}} EUR par mois.
{{/if}}

{{#if indexation}}
La pension est indexee sur {{indexation.indice}}.
{{/if}}

{{#if impayes}}
Or, depuis le {{impayes.debut}}, {{debiteur.civilite}} {{debiteur.nom}} ne s'acquitte plus de cette obligation.

L'arriere s'eleve au {{impayes.date_arrete}} a la somme de {{impayes.montant}} EUR, correspondant a {{impayes.nombre_mois}} mois d'impayes.
{{/if}}

{{#if mises_en_demeure}}
Des mises en demeure ont ete adressees les {{mises_en_demeure}}, restees sans effet.
{{/if}}

{{#if moyens_debiteur}}
Il est etabli que {{debiteur.civilite}} {{debiteur.nom}} dispose des moyens suivants :
{{moyens_debiteur}}
{{/if}}`,
    variables: [
      { name: 'debiteur.civilite', type: 'string', required: true },
      { name: 'debiteur.prenom', type: 'string', required: true },
      { name: 'debiteur.nom', type: 'string', required: true },
      { name: 'creancier.civilite', type: 'string', required: true },
      { name: 'creancier.prenom', type: 'string', required: true },
      { name: 'creancier.nom', type: 'string', required: true },
      { name: 'beneficiaire', type: 'string', required: true },
      { name: 'decision', type: 'object' },
      { name: 'decision.juridiction', type: 'string' },
      { name: 'decision.date', type: 'date' },
      { name: 'decision.montant', type: 'number' },
      { name: 'indexation', type: 'object' },
      { name: 'indexation.indice', type: 'string' },
      { name: 'impayes', type: 'object' },
      { name: 'impayes.debut', type: 'date' },
      { name: 'impayes.date_arrete', type: 'date' },
      { name: 'impayes.montant', type: 'number' },
      { name: 'impayes.nombre_mois', type: 'number' },
      { name: 'mises_en_demeure', type: 'string' },
      { name: 'moyens_debiteur', type: 'text' },
    ],
    tags: ['faits', 'famille', 'pension_alimentaire', 'impayes'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 119,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose responsabilite medicale',
    content: `I. RAPPEL DES FAITS

{{patient.civilite}} {{patient.prenom}} {{patient.nom}} a consulte {{praticien.titre}} {{praticien.nom}}, {{praticien.specialite}}, le {{consultation.date}} pour {{consultation.motif}}.

{{#if antecedents}}
Ses antecedents medicaux etaient les suivants :
{{antecedents}}
{{/if}}

{{#if acte_medical}}
Le {{acte_medical.date}}, {{praticien.titre}} {{praticien.nom}} a pratique {{acte_medical.description}}.
{{/if}}

{{#if complication}}
Suite a cet acte, {{patient.civilite}} {{patient.nom}} a presente les complications suivantes :
{{complication}}
{{/if}}

{{#if expertise}}
Une expertise medicale a ete realisee le {{expertise.date}} par {{expertise.expert}}.
Les conclusions de l'expert sont les suivantes :
{{expertise.conclusions}}
{{/if}}

{{#if prejudices}}
Les prejudices subis sont les suivants :
{{prejudices}}
{{/if}}`,
    variables: [
      { name: 'patient.civilite', type: 'string', required: true },
      { name: 'patient.prenom', type: 'string', required: true },
      { name: 'patient.nom', type: 'string', required: true },
      { name: 'praticien.titre', type: 'string', required: true },
      { name: 'praticien.nom', type: 'string', required: true },
      { name: 'praticien.specialite', type: 'string' },
      { name: 'consultation.date', type: 'date', required: true },
      { name: 'consultation.motif', type: 'string', required: true },
      { name: 'antecedents', type: 'text' },
      { name: 'acte_medical', type: 'object' },
      { name: 'acte_medical.date', type: 'date' },
      { name: 'acte_medical.description', type: 'string' },
      { name: 'complication', type: 'text' },
      { name: 'expertise', type: 'object' },
      { name: 'expertise.date', type: 'date' },
      { name: 'expertise.expert', type: 'string' },
      { name: 'expertise.conclusions', type: 'text' },
      { name: 'prejudices', type: 'text' },
    ],
    tags: ['faits', 'medical', 'responsabilite', 'prejudice_corporel'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 120,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose pret non rembourse',
    content: `I. RAPPEL DES FAITS

Par acte {{#if acte_notarie}}notarie en date du {{acte.date}}, recu par Maitre {{notaire}}{{else}}sous seing prive en date du {{acte.date}}{{/if}}, {{preteur.civilite}} {{preteur.nom}} a consenti a {{emprunteur.civilite}} {{emprunteur.nom}} un pret d'un montant de {{pret.montant}} EUR.

{{#if pret.objet}}
Ce pret etait destine a {{pret.objet}}.
{{/if}}

Les conditions du pret etaient les suivantes :
- Taux d'interet : {{pret.taux}}%
- Duree : {{pret.duree}}
- Echeances : {{pret.echeances}} EUR par mois
{{#if pret.garanties}}
- Garanties : {{pret.garanties}}
{{/if}}

{{#if remboursements}}
{{emprunteur.civilite}} {{emprunteur.nom}} a rembourse la somme de {{remboursements.montant}} EUR jusqu'au {{remboursements.date_dernier}}.
{{/if}}

A ce jour, le capital restant du s'eleve a {{capital_restant}} EUR.
{{#if interets_retard}}
Les interets de retard s'elevent a {{interets_retard}} EUR.
{{/if}}

{{#if mise_en_demeure}}
Une mise en demeure a ete adressee le {{mise_en_demeure.date}}, restee sans effet.
{{/if}}`,
    variables: [
      { name: 'acte_notarie', type: 'boolean' },
      { name: 'acte.date', type: 'date', required: true },
      { name: 'notaire', type: 'string' },
      { name: 'preteur.civilite', type: 'string', required: true },
      { name: 'preteur.nom', type: 'string', required: true },
      { name: 'emprunteur.civilite', type: 'string', required: true },
      { name: 'emprunteur.nom', type: 'string', required: true },
      { name: 'pret.montant', type: 'number', required: true },
      { name: 'pret.objet', type: 'string' },
      { name: 'pret.taux', type: 'number', required: true },
      { name: 'pret.duree', type: 'string', required: true },
      { name: 'pret.echeances', type: 'number' },
      { name: 'pret.garanties', type: 'string' },
      { name: 'remboursements', type: 'object' },
      { name: 'remboursements.montant', type: 'number' },
      { name: 'remboursements.date_dernier', type: 'date' },
      { name: 'capital_restant', type: 'number', required: true },
      { name: 'interets_retard', type: 'number' },
      { name: 'mise_en_demeure', type: 'object' },
      { name: 'mise_en_demeure.date', type: 'date' },
    ],
    tags: ['faits', 'civil', 'pret', 'creance'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 121,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose servitude',
    content: `I. RAPPEL DES FAITS

{{proprietaire.civilite}} {{proprietaire.prenom}} {{proprietaire.nom}} est proprietaire d'un bien situe {{bien.adresse}}, {{bien.codePostal}} {{bien.ville}}, cadastre section {{bien.section}} numero {{bien.numero}}.

{{voisin.civilite}} {{voisin.nom}} est proprietaire du fonds {{#if fonds_servant}}servant{{else}}dominant{{/if}} situe {{voisin.adresse}}.

{{#if servitude_titre}}
Une servitude de {{servitude.nature}} a ete etablie par acte du {{servitude.date_creation}}{{#if servitude.notaire}}, recu par Maitre {{servitude.notaire}}{{/if}}.

Cette servitude prevoit :
{{servitude.description}}
{{/if}}

{{#if servitude_prescription}}
Une servitude s'est etablie par prescription trentenaire depuis le {{servitude.date_debut}}.
{{/if}}

{{#if litige}}
Le litige est le suivant :
{{litige}}
{{/if}}`,
    variables: [
      { name: 'proprietaire.civilite', type: 'string', required: true },
      { name: 'proprietaire.prenom', type: 'string', required: true },
      { name: 'proprietaire.nom', type: 'string', required: true },
      { name: 'bien.adresse', type: 'string', required: true },
      { name: 'bien.codePostal', type: 'string', required: true },
      { name: 'bien.ville', type: 'string', required: true },
      { name: 'bien.section', type: 'string' },
      { name: 'bien.numero', type: 'string' },
      { name: 'voisin.civilite', type: 'string', required: true },
      { name: 'voisin.nom', type: 'string', required: true },
      { name: 'fonds_servant', type: 'boolean' },
      { name: 'voisin.adresse', type: 'string', required: true },
      { name: 'servitude_titre', type: 'boolean' },
      { name: 'servitude.nature', type: 'string' },
      { name: 'servitude.date_creation', type: 'date' },
      { name: 'servitude.notaire', type: 'string' },
      { name: 'servitude.description', type: 'text' },
      { name: 'servitude_prescription', type: 'boolean' },
      { name: 'servitude.date_debut', type: 'date' },
      { name: 'litige', type: 'text' },
    ],
    tags: ['faits', 'immobilier', 'servitude', 'propriete'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 122,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose assurance refus indemnisation',
    content: `I. RAPPEL DES FAITS

{{assure.civilite}} {{assure.prenom}} {{assure.nom}} a souscrit aupres de {{assureur.nom}} un contrat d'assurance {{contrat.type}} sous le numero {{contrat.numero}}, prenant effet le {{contrat.date_effet}}.

{{#if garanties}}
Ce contrat garantit notamment :
{{garanties}}
{{/if}}

Le {{sinistre.date}}, {{assure.civilite}} {{assure.nom}} a ete victime du sinistre suivant :
{{sinistre.description}}

{{#if declaration}}
Le sinistre a ete declare le {{declaration.date}} par {{declaration.mode}}.
{{/if}}

{{#if expertise_assurance}}
L'expert missionne par l'assurance, {{expertise_assurance.expert}}, a evalue le prejudice a {{expertise_assurance.montant}} EUR.
{{/if}}

Or, par courrier du {{refus.date}}, {{assureur.nom}} a refuse de prendre en charge le sinistre aux motifs suivants :
{{refus.motifs}}

{{#if contestation}}
Cette position est contestable car :
{{contestation}}
{{/if}}`,
    variables: [
      { name: 'assure.civilite', type: 'string', required: true },
      { name: 'assure.prenom', type: 'string', required: true },
      { name: 'assure.nom', type: 'string', required: true },
      { name: 'assureur.nom', type: 'string', required: true },
      { name: 'contrat.type', type: 'string', required: true },
      { name: 'contrat.numero', type: 'string', required: true },
      { name: 'contrat.date_effet', type: 'date' },
      { name: 'garanties', type: 'text' },
      { name: 'sinistre.date', type: 'date', required: true },
      { name: 'sinistre.description', type: 'text', required: true },
      { name: 'declaration', type: 'object' },
      { name: 'declaration.date', type: 'date' },
      { name: 'declaration.mode', type: 'string' },
      { name: 'expertise_assurance', type: 'object' },
      { name: 'expertise_assurance.expert', type: 'string' },
      { name: 'expertise_assurance.montant', type: 'number' },
      { name: 'refus.date', type: 'date', required: true },
      { name: 'refus.motifs', type: 'text', required: true },
      { name: 'contestation', type: 'text' },
    ],
    tags: ['faits', 'assurance', 'sinistre', 'refus'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 123,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose copropriete litige syndic',
    content: `I. RAPPEL DES FAITS

{{coproprietaire.civilite}} {{coproprietaire.prenom}} {{coproprietaire.nom}} est proprietaire du lot n°{{lot.numero}} ({{lot.description}}) au sein de la copropriete situee {{copropriete.adresse}}, {{copropriete.codePostal}} {{copropriete.ville}}.

La copropriete est administree par le syndic {{syndic.nom}}, {{syndic.adresse}}.

{{#if tantièmes}}
Le lot represente {{tantiemes}}/10000emes des parties communes.
{{/if}}

{{#if contexte}}
Le contexte est le suivant :
{{contexte}}
{{/if}}

Le litige porte sur :
{{litige.description}}

{{#if assemblees}}
Lors de l'assemblee generale du {{assemblees.date}}, les resolutions suivantes ont ete adoptees :
{{assemblees.resolutions}}
{{/if}}

{{#if mise_en_demeure}}
Une mise en demeure a ete adressee au syndic le {{mise_en_demeure.date}}.
{{/if}}`,
    variables: [
      { name: 'coproprietaire.civilite', type: 'string', required: true },
      { name: 'coproprietaire.prenom', type: 'string', required: true },
      { name: 'coproprietaire.nom', type: 'string', required: true },
      { name: 'lot.numero', type: 'string', required: true },
      { name: 'lot.description', type: 'string' },
      { name: 'copropriete.adresse', type: 'string', required: true },
      { name: 'copropriete.codePostal', type: 'string', required: true },
      { name: 'copropriete.ville', type: 'string', required: true },
      { name: 'syndic.nom', type: 'string', required: true },
      { name: 'syndic.adresse', type: 'string' },
      { name: 'tantiemes', type: 'number' },
      { name: 'contexte', type: 'text' },
      { name: 'litige.description', type: 'text', required: true },
      { name: 'assemblees', type: 'object' },
      { name: 'assemblees.date', type: 'date' },
      { name: 'assemblees.resolutions', type: 'text' },
      { name: 'mise_en_demeure', type: 'object' },
      { name: 'mise_en_demeure.date', type: 'date' },
    ],
    tags: ['faits', 'copropriete', 'syndic', 'immobilier'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 124,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose resiliation abusive contrat',
    content: `I. RAPPEL DES FAITS

Le {{contrat.date_signature}}, {{partie1.nom}} et {{partie2.nom}} ont conclu un contrat de {{contrat.type}} portant sur {{contrat.objet}}.

{{#if contrat.duree}}
Ce contrat a ete conclu pour une duree de {{contrat.duree}}.
{{/if}}

{{#if contrat.conditions}}
Les principales conditions contractuelles sont les suivantes :
{{contrat.conditions}}
{{/if}}

Le {{resiliation.date}}, {{partie_resiliant}} a notifie la resiliation du contrat par {{resiliation.mode}}.

{{#if resiliation.motifs_invoques}}
Les motifs invoques etaient les suivants :
{{resiliation.motifs_invoques}}
{{/if}}

Cette resiliation est abusive car :
{{resiliation.caractere_abusif}}

{{#if prejudice}}
Le prejudice subi est le suivant :
{{prejudice}}
{{/if}}`,
    variables: [
      { name: 'contrat.date_signature', type: 'date', required: true },
      { name: 'partie1.nom', type: 'string', required: true },
      { name: 'partie2.nom', type: 'string', required: true },
      { name: 'contrat.type', type: 'string', required: true },
      { name: 'contrat.objet', type: 'string', required: true },
      { name: 'contrat.duree', type: 'string' },
      { name: 'contrat.conditions', type: 'text' },
      { name: 'resiliation.date', type: 'date', required: true },
      { name: 'partie_resiliant', type: 'string', required: true },
      { name: 'resiliation.mode', type: 'string' },
      { name: 'resiliation.motifs_invoques', type: 'text' },
      { name: 'resiliation.caractere_abusif', type: 'text', required: true },
      { name: 'prejudice', type: 'text' },
    ],
    tags: ['faits', 'contrat', 'resiliation', 'abusif'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 125,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose recours administratif',
    content: `I. RAPPEL DES FAITS

{{requerant.civilite}} {{requerant.prenom}} {{requerant.nom}}{{#if requerant.societe}}, agissant pour le compte de {{requerant.societe}}{{/if}}, a presente une demande de {{demande.objet}} aupres de {{administration.nom}} le {{demande.date}}.

{{#if demande.contexte}}
Le contexte de cette demande est le suivant :
{{demande.contexte}}
{{/if}}

Par decision du {{decision.date}}, {{administration.nom}} a {{#if decision.rejet}}rejete{{else}}partiellement fait droit a{{/if}} cette demande.

{{#if decision.motifs}}
Les motifs de la decision sont les suivants :
{{decision.motifs}}
{{/if}}

{{#if recours_gracieux}}
Un recours gracieux a ete forme le {{recours_gracieux.date}}.
{{#if recours_gracieux.reponse}}
Par decision du {{recours_gracieux.date_reponse}}, ce recours a ete {{recours_gracieux.reponse}}.
{{else}}
Ce recours est reste sans reponse, faisant naitre une decision implicite de rejet.
{{/if}}
{{/if}}

{{#if moyen_illegralite}}
Cette decision est entachee d'illegalite :
{{moyen_illegralite}}
{{/if}}`,
    variables: [
      { name: 'requerant.civilite', type: 'string', required: true },
      { name: 'requerant.prenom', type: 'string', required: true },
      { name: 'requerant.nom', type: 'string', required: true },
      { name: 'requerant.societe', type: 'string' },
      { name: 'demande.objet', type: 'string', required: true },
      { name: 'administration.nom', type: 'string', required: true },
      { name: 'demande.date', type: 'date', required: true },
      { name: 'demande.contexte', type: 'text' },
      { name: 'decision.date', type: 'date', required: true },
      { name: 'decision.rejet', type: 'boolean' },
      { name: 'decision.motifs', type: 'text' },
      { name: 'recours_gracieux', type: 'object' },
      { name: 'recours_gracieux.date', type: 'date' },
      { name: 'recours_gracieux.reponse', type: 'string' },
      { name: 'recours_gracieux.date_reponse', type: 'date' },
      { name: 'moyen_illegralite', type: 'text' },
    ],
    tags: ['faits', 'administratif', 'recours', 'decision'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 126,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose bail commercial renouvellement',
    content: `I. RAPPEL DES FAITS

Par acte du {{bail.date_signature}}, {{bailleur.civilite}} {{bailleur.nom}} a consenti a {{preneur.nom}} un bail commercial portant sur des locaux situes {{locaux.adresse}}, {{locaux.codePostal}} {{locaux.ville}}.

Le bail a ete conclu pour une duree de {{bail.duree}} a compter du {{bail.date_effet}}, moyennant un loyer annuel de {{bail.loyer}} EUR HT.

{{#if activite}}
L'activite autorisee est : {{activite}}.
{{/if}}

Le bail est arrive a echeance le {{bail.date_echeance}}.

{{#if conge}}
Le bailleur a delivre un conge le {{conge.date}} par {{conge.mode}}.
{{#if conge.motif}}
Le motif invoque est : {{conge.motif}}.
{{/if}}
{{/if}}

{{#if demande_renouvellement}}
Le preneur a sollicite le renouvellement du bail par acte du {{demande_renouvellement.date}}.
{{/if}}

{{#if indemnite_eviction}}
Une indemnite d'eviction est due, evaluee a {{indemnite_eviction}} EUR.
{{/if}}

{{#if desaccord}}
Le desaccord porte sur :
{{desaccord}}
{{/if}}`,
    variables: [
      { name: 'bail.date_signature', type: 'date', required: true },
      { name: 'bailleur.civilite', type: 'string', required: true },
      { name: 'bailleur.nom', type: 'string', required: true },
      { name: 'preneur.nom', type: 'string', required: true },
      { name: 'locaux.adresse', type: 'string', required: true },
      { name: 'locaux.codePostal', type: 'string', required: true },
      { name: 'locaux.ville', type: 'string', required: true },
      { name: 'bail.duree', type: 'string', required: true },
      { name: 'bail.date_effet', type: 'date', required: true },
      { name: 'bail.loyer', type: 'number', required: true },
      { name: 'activite', type: 'string' },
      { name: 'bail.date_echeance', type: 'date', required: true },
      { name: 'conge', type: 'object' },
      { name: 'conge.date', type: 'date' },
      { name: 'conge.mode', type: 'string' },
      { name: 'conge.motif', type: 'string' },
      { name: 'demande_renouvellement', type: 'object' },
      { name: 'demande_renouvellement.date', type: 'date' },
      { name: 'indemnite_eviction', type: 'number' },
      { name: 'desaccord', type: 'text' },
    ],
    tags: ['faits', 'commercial', 'bail', 'renouvellement'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 127,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Expose protection consommateur',
    content: `I. RAPPEL DES FAITS

Le {{achat.date}}, {{consommateur.civilite}} {{consommateur.prenom}} {{consommateur.nom}} a {{#if en_ligne}}commande en ligne{{else}}acquis{{/if}} aupres de {{professionnel.nom}} {{produit.description}} au prix de {{produit.prix}} EUR.

{{#if achat.mode_paiement}}
Le reglement a ete effectue par {{achat.mode_paiement}}.
{{/if}}

{{#if livraison}}
La livraison est intervenue le {{livraison.date}}.
{{/if}}

{{#if probleme}}
Le probleme rencontre est le suivant :
{{probleme}}
{{/if}}

{{#if retractation}}
{{consommateur.civilite}} {{consommateur.nom}} a exerce son droit de retractation le {{retractation.date}} dans le delai legal de 14 jours.
{{/if}}

{{#if garantie}}
Le produit beneficie d'une garantie {{garantie.type}} de {{garantie.duree}}.
{{/if}}

{{#if demarches}}
Les demarches suivantes ont ete effectuees :
{{demarches}}
{{/if}}

{{#if refus_professionnel}}
Le professionnel refuse de :
{{refus_professionnel}}
{{/if}}`,
    variables: [
      { name: 'achat.date', type: 'date', required: true },
      { name: 'consommateur.civilite', type: 'string', required: true },
      { name: 'consommateur.prenom', type: 'string', required: true },
      { name: 'consommateur.nom', type: 'string', required: true },
      { name: 'en_ligne', type: 'boolean' },
      { name: 'professionnel.nom', type: 'string', required: true },
      { name: 'produit.description', type: 'string', required: true },
      { name: 'produit.prix', type: 'number', required: true },
      { name: 'achat.mode_paiement', type: 'string' },
      { name: 'livraison', type: 'object' },
      { name: 'livraison.date', type: 'date' },
      { name: 'probleme', type: 'text' },
      { name: 'retractation', type: 'object' },
      { name: 'retractation.date', type: 'date' },
      { name: 'garantie', type: 'object' },
      { name: 'garantie.type', type: 'string' },
      { name: 'garantie.duree', type: 'string' },
      { name: 'demarches', type: 'text' },
      { name: 'refus_professionnel', type: 'text' },
    ],
    tags: ['faits', 'consommation', 'protection', 'achat'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 128,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Rappel procedure anterieure',
    content: `II. RAPPEL DE LA PROCEDURE

Par assignation en date du {{assignation.date}}, {{demandeur.nom}} a saisi le {{juridiction_initiale}} de {{juridiction_initiale.ville}}.

{{#if premiere_instance}}
Par jugement du {{premiere_instance.date}}, le tribunal a :
{{premiere_instance.dispositif}}
{{/if}}

{{#if appel}}
{{appelant.nom}} a interjete appel le {{appel.date}}.

Par arret du {{appel.date_arret}}, la Cour d'appel de {{appel.cour}} a :
{{appel.dispositif}}
{{/if}}

{{#if cassation}}
Un pourvoi en cassation a ete forme le {{cassation.date}}.

Par arret du {{cassation.date_arret}}, la Cour de cassation a :
{{cassation.dispositif}}
{{/if}}

{{#if renvoi}}
L'affaire a ete renvoyee devant la {{renvoi.juridiction}}.
{{/if}}`,
    variables: [
      { name: 'assignation.date', type: 'date', required: true },
      { name: 'demandeur.nom', type: 'string', required: true },
      { name: 'juridiction_initiale', type: 'string', required: true },
      { name: 'juridiction_initiale.ville', type: 'string', required: true },
      { name: 'premiere_instance', type: 'object' },
      { name: 'premiere_instance.date', type: 'date' },
      { name: 'premiere_instance.dispositif', type: 'text' },
      { name: 'appel', type: 'object' },
      { name: 'appelant.nom', type: 'string' },
      { name: 'appel.date', type: 'date' },
      { name: 'appel.date_arret', type: 'date' },
      { name: 'appel.cour', type: 'string' },
      { name: 'appel.dispositif', type: 'text' },
      { name: 'cassation', type: 'object' },
      { name: 'cassation.date', type: 'date' },
      { name: 'cassation.date_arret', type: 'date' },
      { name: 'cassation.dispositif', type: 'text' },
      { name: 'renvoi', type: 'object' },
      { name: 'renvoi.juridiction', type: 'string' },
    ],
    tags: ['faits', 'procedure', 'rappel', 'historique'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 129,
  },
];

// ============================================
// MOYENS BLOCKS (40) - Part 1 (20 blocks)
// ============================================

const moyensBlocksPart1: BlockSeed[] = [
  {
    category: BlockCategory.MOYENS,
    title: 'Force obligatoire des contrats (art. 1103)',
    content: `II. DISCUSSION

A. Sur la force obligatoire du contrat

Aux termes de l'article 1103 du Code civil : "Les contrats legalement formes tiennent lieu de loi a ceux qui les ont faits."

En l'espece, le contrat conclu entre les parties le {{contrat.date_signature}} remplit toutes les conditions de validite requises par les articles 1128 et suivants du Code civil :
- Consentement des parties : {{argument_consentement}}
- Capacite de contracter : les parties etaient pleinement capables
- Contenu licite et certain : {{argument_contenu}}

Par consequent, ce contrat s'impose aux parties avec la meme force qu'une loi.

{{partie_adverse}} ne saurait donc s'affranchir unilateralement de ses obligations contractuelles.`,
    variables: [
      { name: 'contrat.date_signature', type: 'date', required: true },
      { name: 'argument_consentement', type: 'text' },
      { name: 'argument_contenu', type: 'text' },
      { name: 'partie_adverse', type: 'string', required: true },
    ],
    tags: ['moyens', 'code_civil', 'contrats', 'force_obligatoire'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 200,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Inexecution contractuelle (art. 1217)',
    content: `B. Sur l'inexecution contractuelle

L'article 1217 du Code civil dispose : "La partie envers laquelle l'engagement n'a pas ete execute, ou l'a ete imparfaitement, peut :
- refuser d'executer ou suspendre l'execution de sa propre obligation ;
- poursuivre l'execution forcee en nature de l'obligation ;
- obtenir une reduction du prix ;
- provoquer la resolution du contrat ;
- demander reparation des consequences de l'inexecution."

En l'espece, {{partie_adverse}} a manque a son obligation de {{obligation_violee}} prevue {{#if clause_reference}}a l'article {{clause_reference}} du contrat{{else}}par le contrat{{/if}}.

Cette inexecution est caracterisee par :
{{elements_inexecution}}

{{client.nom}} est donc fonde(e) a demander {{sanction_demandee}}.`,
    variables: [
      { name: 'partie_adverse', type: 'string', required: true },
      { name: 'obligation_violee', type: 'string', required: true },
      { name: 'clause_reference', type: 'string' },
      { name: 'elements_inexecution', type: 'text', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'sanction_demandee', type: 'string', required: true },
    ],
    tags: ['moyens', 'code_civil', 'inexecution', 'contrats'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 201,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Provision refere (art. 835 CPC)',
    content: `II. DISCUSSION

Sur le bien-fonde de la demande de provision

Aux termes de l'article 835 alinea 2 du Code de procedure civile, le President du tribunal judiciaire peut "accorder une provision au creancier" lorsque "l'existence de l'obligation n'est pas serieusement contestable".

En l'espece, l'obligation de {{debiteur.nom}} n'est pas serieusement contestable :

1. Elle est fondee sur {{fondement_obligation}}

2. Elle est certaine :
{{arguments_certitude}}

3. Elle est liquide : la creance s'eleve a {{montant_creance}} EUR

4. Elle est exigible depuis le {{date_exigibilite}}

Par consequent, il y a lieu d'accorder a {{creancier.nom}} une provision de {{montant_provision}} EUR a valoir sur l'indemnisation de son prejudice.`,
    variables: [
      { name: 'debiteur.nom', type: 'string', required: true },
      { name: 'fondement_obligation', type: 'string', required: true },
      { name: 'arguments_certitude', type: 'text', required: true },
      { name: 'montant_creance', type: 'number', required: true },
      { name: 'date_exigibilite', type: 'date', required: true },
      { name: 'creancier.nom', type: 'string', required: true },
      { name: 'montant_provision', type: 'number', required: true },
    ],
    tags: ['moyens', 'refere', 'provision', 'cpc'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 202,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Licenciement sans cause reelle et serieuse',
    content: `II. DISCUSSION

A. Sur l'absence de cause reelle et serieuse du licenciement

En application des articles L. 1232-1 et L. 1235-1 du Code du travail, tout licenciement pour motif personnel doit etre justifie par une cause reelle et serieuse.

La jurisprudence constante de la Cour de cassation (Soc., 14 mai 1996, n° 94-45.499) precise que la cause doit etre :
- Reelle : objective, exacte et verifiable
- Serieuse : suffisamment grave pour justifier la rupture

En l'espece, le motif invoque par l'employeur ne constitue pas une cause reelle et serieuse :

{{#if argument_realite}}
1. Sur le defaut de realite :
{{argument_realite}}
{{/if}}

{{#if argument_gravite}}
2. Sur le defaut de gravite suffisante :
{{argument_gravite}}
{{/if}}

Par consequent, le licenciement doit etre declare sans cause reelle et serieuse.`,
    variables: [
      { name: 'argument_realite', type: 'text' },
      { name: 'argument_gravite', type: 'text' },
    ],
    tags: ['moyens', 'travail', 'licenciement', 'cause_reelle_serieuse'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 203,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Clause resolutoire bail (art. 24 loi 1989)',
    content: `II. DISCUSSION

Sur l'acquisition de la clause resolutoire

L'article 24 de la loi n° 89-462 du 6 juillet 1989 dispose que toute clause prevoyant la resiliation de plein droit du bail pour defaut de paiement du loyer ou des charges ne produit effet que deux mois apres un commandement de payer demeure infructueux.

En l'espece :

1. Le bail contient une clause resolutoire (article {{clause_reference}})

2. Un commandement de payer a ete delivre le {{commandement_date}} pour un montant de {{commandement_montant}} EUR

3. Ce commandement est demeure infructueux au-dela du delai de deux mois

4. {{#if assignation_delai_respecte}}L'assignation a ete delivree plus de deux mois apres le commandement{{/if}}

Par consequent, la clause resolutoire est acquise et le bail doit etre resilie.`,
    variables: [
      { name: 'clause_reference', type: 'string' },
      { name: 'commandement_date', type: 'date', required: true },
      { name: 'commandement_montant', type: 'number', required: true },
      { name: 'assignation_delai_respecte', type: 'boolean' },
    ],
    tags: ['moyens', 'bail', 'clause_resolutoire', 'expulsion'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 204,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Responsabilite delictuelle (art. 1240)',
    content: `II. DISCUSSION

Sur la responsabilite delictuelle

L'article 1240 du Code civil dispose : "Tout fait quelconque de l'homme, qui cause a autrui un dommage, oblige celui par la faute duquel il est arrive a le reparer."

La mise en oeuvre de la responsabilite delictuelle suppose la reunion de trois conditions cumulatives :
- Une faute
- Un dommage
- Un lien de causalite entre la faute et le dommage

En l'espece :

1. Sur la faute :
{{argument_faute}}

2. Sur le dommage :
{{argument_dommage}}

3. Sur le lien de causalite :
{{argument_causalite}}

Ces trois conditions etant reunies, la responsabilite de {{responsable.nom}} est engagee.`,
    variables: [
      { name: 'argument_faute', type: 'text', required: true },
      { name: 'argument_dommage', type: 'text', required: true },
      { name: 'argument_causalite', type: 'text', required: true },
      { name: 'responsable.nom', type: 'string', required: true },
    ],
    tags: ['moyens', 'responsabilite', 'delictuelle', 'faute'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 205,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Garantie des vices caches (art. 1641)',
    content: `II. DISCUSSION

Sur la garantie des vices caches

L'article 1641 du Code civil dispose : "Le vendeur est tenu de la garantie a raison des defauts caches de la chose vendue qui la rendent impropre a l'usage auquel on la destine, ou qui diminuent tellement cet usage que l'acheteur ne l'aurait pas acquise, ou n'en aurait donne qu'un moindre prix, s'il les avait connus."

Les conditions de mise en oeuvre de la garantie sont reunies :

1. Le vice est cache :
{{argument_cache}}

2. Le vice est grave :
{{argument_gravite}}

3. Le vice est anterieur a la vente :
{{argument_anteriorite}}

4. L'action est recevable :
L'action a ete introduite dans le bref delai de l'article 1648 du Code civil ({{delai_action}}).

En application de l'article 1644 du Code civil, {{acquereur.nom}} est fonde(e) a demander {{#if resolution}}la resolution de la vente{{else}}une reduction du prix{{/if}}.`,
    variables: [
      { name: 'argument_cache', type: 'text', required: true },
      { name: 'argument_gravite', type: 'text', required: true },
      { name: 'argument_anteriorite', type: 'text', required: true },
      { name: 'delai_action', type: 'string' },
      { name: 'acquereur.nom', type: 'string', required: true },
      { name: 'resolution', type: 'boolean' },
    ],
    tags: ['moyens', 'vente', 'vices_caches', 'garantie'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 206,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Harcelement moral (art. L1152-1)',
    content: `II. DISCUSSION

Sur le harcelement moral

L'article L. 1152-1 du Code du travail dispose : "Aucun salarie ne doit subir les agissements repetes de harcelement moral qui ont pour objet ou pour effet une degradation de ses conditions de travail susceptible de porter atteinte a ses droits et a sa dignite, d'alterer sa sante physique ou mentale ou de compromettre son avenir professionnel."

Conformement a la jurisprudence (Soc., 24 sept. 2008, n° 06-45.579), le salarie doit etablir des faits qui permettent de presumer l'existence d'un harcelement.

En l'espece, les faits suivants permettent de presumer l'existence d'un harcelement moral :
{{faits_presumes}}

Ces agissements repetes ont eu pour effet :
{{#if degradation_conditions}}
- Une degradation des conditions de travail : {{degradation_conditions}}
{{/if}}
{{#if atteinte_droits}}
- Une atteinte aux droits et a la dignite : {{atteinte_droits}}
{{/if}}
{{#if alteration_sante}}
- Une alteration de la sante : {{alteration_sante}}
{{/if}}

Il appartient a l'employeur de prouver que ces agissements ne sont pas constitutifs de harcelement.`,
    variables: [
      { name: 'faits_presumes', type: 'text', required: true },
      { name: 'degradation_conditions', type: 'text' },
      { name: 'atteinte_droits', type: 'text' },
      { name: 'alteration_sante', type: 'text' },
    ],
    tags: ['moyens', 'travail', 'harcelement', 'moral'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 207,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Concurrence deloyale (action fondee sur 1240)',
    content: `II. DISCUSSION

Sur la concurrence deloyale

L'action en concurrence deloyale est fondee sur l'article 1240 du Code civil. Elle suppose la demonstration d'une faute, d'un prejudice et d'un lien de causalite.

Constituent des actes de concurrence deloyale, selon une jurisprudence constante :
- La confusion
- Le denigrement
- La desorganisation
- Le parasitisme

En l'espece, les actes de concurrence deloyale sont caracterises :

{{#if confusion}}
1. Sur la confusion :
{{confusion}}
{{/if}}

{{#if denigrement}}
2. Sur le denigrement :
{{denigrement}}
{{/if}}

{{#if desorganisation}}
3. Sur la desorganisation :
{{desorganisation}}
{{/if}}

{{#if parasitisme}}
4. Sur le parasitisme :
{{parasitisme}}
{{/if}}

Le prejudice subi est le suivant :
{{prejudice}}

Le lien de causalite est etabli car :
{{lien_causalite}}`,
    variables: [
      { name: 'confusion', type: 'text' },
      { name: 'denigrement', type: 'text' },
      { name: 'desorganisation', type: 'text' },
      { name: 'parasitisme', type: 'text' },
      { name: 'prejudice', type: 'text', required: true },
      { name: 'lien_causalite', type: 'text', required: true },
    ],
    tags: ['moyens', 'commercial', 'concurrence_deloyale', 'responsabilite'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 208,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Prescription extinctive (art. 2224)',
    content: `II. DISCUSSION

Sur la prescription

{{#if moyen_defense}}
A titre principal, sur la fin de non-recevoir tiree de la prescription
{{else}}
A titre liminaire, sur l'absence de prescription
{{/if}}

L'article 2224 du Code civil dispose : "Les actions personnelles ou mobilieres se prescrivent par cinq ans a compter du jour ou le titulaire d'un droit a connu ou aurait du connaitre les faits lui permettant de l'exercer."

{{#if prescription_speciale}}
Toutefois, en l'espece, la prescription applicable est celle de {{prescription_speciale.duree}} ans prevue par {{prescription_speciale.texte}}.
{{/if}}

En l'espece :
- Le point de depart de la prescription est le {{point_depart}}
- {{#if interruption}}La prescription a ete interrompue le {{interruption.date}} par {{interruption.cause}}{{/if}}
- {{#if suspension}}La prescription a ete suspendue du {{suspension.debut}} au {{suspension.fin}} en raison de {{suspension.cause}}{{/if}}

{{#if moyen_defense}}
L'action ayant ete introduite le {{date_action}}, soit plus de {{delai_ecoule}} apres le point de depart, elle est prescrite.
{{else}}
L'action ayant ete introduite le {{date_action}}, soit avant l'expiration du delai, elle n'est pas prescrite.
{{/if}}`,
    variables: [
      { name: 'moyen_defense', type: 'boolean' },
      { name: 'prescription_speciale', type: 'object' },
      { name: 'prescription_speciale.duree', type: 'number' },
      { name: 'prescription_speciale.texte', type: 'string' },
      { name: 'point_depart', type: 'date', required: true },
      { name: 'interruption', type: 'object' },
      { name: 'interruption.date', type: 'date' },
      { name: 'interruption.cause', type: 'string' },
      { name: 'suspension', type: 'object' },
      { name: 'suspension.debut', type: 'date' },
      { name: 'suspension.fin', type: 'date' },
      { name: 'suspension.cause', type: 'string' },
      { name: 'date_action', type: 'date', required: true },
      { name: 'delai_ecoule', type: 'string' },
    ],
    tags: ['moyens', 'prescription', 'fin_non_recevoir', 'procedure'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 209,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Rupture brutale relations commerciales (L442-1)',
    content: `II. DISCUSSION

Sur la rupture brutale des relations commerciales etablies

L'article L. 442-1, II du Code de commerce dispose qu'engage la responsabilite de son auteur le fait "de rompre brutalement, meme partiellement, une relation commerciale etablie, en l'absence d'un preavis ecrit qui tienne compte notamment de la duree de la relation commerciale".

1. Sur l'existence d'une relation commerciale etablie :
{{argument_relation_etablie}}

2. Sur la brutalite de la rupture :
{{argument_brutalite}}

3. Sur l'insuffisance du preavis :

Compte tenu de la duree de la relation ({{duree_relation}}), de l'importance du chiffre d'affaires ({{ca_percentage}}% du CA de {{victime.nom}}) et des usages commerciaux, un preavis de {{preavis_raisonnable}} aurait du etre accorde.

Or, le preavis effectif n'a ete que de {{preavis_effectif}}.

4. Sur le prejudice :
Le prejudice correspond a la marge brute perdue pendant la duree du preavis insuffisant, soit {{prejudice_montant}} EUR.`,
    variables: [
      { name: 'argument_relation_etablie', type: 'text', required: true },
      { name: 'argument_brutalite', type: 'text', required: true },
      { name: 'duree_relation', type: 'string', required: true },
      { name: 'ca_percentage', type: 'number' },
      { name: 'victime.nom', type: 'string', required: true },
      { name: 'preavis_raisonnable', type: 'string', required: true },
      { name: 'preavis_effectif', type: 'string', required: true },
      { name: 'prejudice_montant', type: 'number', required: true },
    ],
    tags: ['moyens', 'commercial', 'rupture_brutale', 'l442-1'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 210,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Prejudice corporel - nomenclature Dintilhac',
    content: `II. DISCUSSION

Sur l'evaluation du prejudice corporel

Conformement a la nomenclature Dintilhac, les prejudices de {{victime.nom}} s'evaluent comme suit :

A. PREJUDICES PATRIMONIAUX

1. Temporaires (avant consolidation) :
{{#if depenses_sante_actuelles}}
- Depenses de sante actuelles : {{depenses_sante_actuelles}} EUR
{{/if}}
{{#if perte_gains_actuels}}
- Perte de gains professionnels actuels : {{perte_gains_actuels}} EUR
{{/if}}

2. Permanents (apres consolidation) :
{{#if depenses_sante_futures}}
- Depenses de sante futures : {{depenses_sante_futures}} EUR
{{/if}}
{{#if perte_gains_futurs}}
- Perte de gains professionnels futurs : {{perte_gains_futurs}} EUR
{{/if}}
{{#if incidence_professionnelle}}
- Incidence professionnelle : {{incidence_professionnelle}} EUR
{{/if}}

B. PREJUDICES EXTRA-PATRIMONIAUX

1. Temporaires :
{{#if dfp}}
- Deficit fonctionnel temporaire : {{dfp}} EUR
{{/if}}
{{#if souffrances}}
- Souffrances endurees ({{souffrances_note}}/7) : {{souffrances}} EUR
{{/if}}

2. Permanents :
{{#if dfi}}
- Deficit fonctionnel permanent ({{dfi_taux}}%) : {{dfi}} EUR
{{/if}}
{{#if prejudice_agrement}}
- Prejudice d'agrement : {{prejudice_agrement}} EUR
{{/if}}
{{#if prejudice_esthetique}}
- Prejudice esthetique ({{prejudice_esthetique_note}}/7) : {{prejudice_esthetique}} EUR
{{/if}}

TOTAL : {{total_prejudice}} EUR`,
    variables: [
      { name: 'victime.nom', type: 'string', required: true },
      { name: 'depenses_sante_actuelles', type: 'number' },
      { name: 'perte_gains_actuels', type: 'number' },
      { name: 'depenses_sante_futures', type: 'number' },
      { name: 'perte_gains_futurs', type: 'number' },
      { name: 'incidence_professionnelle', type: 'number' },
      { name: 'dfp', type: 'number' },
      { name: 'souffrances_note', type: 'number' },
      { name: 'souffrances', type: 'number' },
      { name: 'dfi_taux', type: 'number' },
      { name: 'dfi', type: 'number' },
      { name: 'prejudice_agrement', type: 'number' },
      { name: 'prejudice_esthetique_note', type: 'number' },
      { name: 'prejudice_esthetique', type: 'number' },
      { name: 'total_prejudice', type: 'number', required: true },
    ],
    tags: ['moyens', 'prejudice', 'corporel', 'dintilhac'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 211,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Contrefacon de marque (art. L713-2)',
    content: `II. DISCUSSION

Sur la contrefacon de marque

L'article L. 713-2 du Code de la propriete intellectuelle interdit la reproduction, l'usage ou l'apposition d'une marque pour des produits ou services identiques a ceux designes dans l'enregistrement.

1. Sur la validite de la marque :
La marque "{{marque.nom}}" a ete regulierement enregistree sous le numero {{marque.numero}} le {{marque.date}} pour les classes {{marque.classes}}.
{{#if marque.usage}}Elle fait l'objet d'un usage serieux pour les produits/services designes.{{/if}}

2. Sur la contrefacon :
{{contrefacteur.nom}} utilise le signe "{{signe_litigieux}}" pour des {{produits_services_litigieux}}.

La contrefacon est caracterisee car :
{{#if identite}}
- Il y a identite ou quasi-identite des signes : {{argument_identite}}
{{/if}}
{{#if similarite}}
- Il y a similarite des produits/services : {{argument_similarite}}
{{/if}}
{{#if risque_confusion}}
- Il existe un risque de confusion dans l'esprit du public : {{argument_confusion}}
{{/if}}

3. Sur le prejudice :
{{prejudice}}`,
    variables: [
      { name: 'marque.nom', type: 'string', required: true },
      { name: 'marque.numero', type: 'string', required: true },
      { name: 'marque.date', type: 'date', required: true },
      { name: 'marque.classes', type: 'string', required: true },
      { name: 'marque.usage', type: 'boolean' },
      { name: 'contrefacteur.nom', type: 'string', required: true },
      { name: 'signe_litigieux', type: 'string', required: true },
      { name: 'produits_services_litigieux', type: 'string', required: true },
      { name: 'identite', type: 'boolean' },
      { name: 'argument_identite', type: 'text' },
      { name: 'similarite', type: 'boolean' },
      { name: 'argument_similarite', type: 'text' },
      { name: 'risque_confusion', type: 'boolean' },
      { name: 'argument_confusion', type: 'text' },
      { name: 'prejudice', type: 'text', required: true },
    ],
    tags: ['moyens', 'propriete_intellectuelle', 'contrefacon', 'marque'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 212,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Indemnite eviction bail commercial',
    content: `II. DISCUSSION

Sur l'indemnite d'eviction

L'article L. 145-14 du Code de commerce dispose : "Le bailleur peut refuser le renouvellement du bail. Toutefois, le bailleur doit, sauf exceptions prevues aux articles L. 145-17 et suivants, payer au locataire evince une indemnite dite d'eviction egale au prejudice cause par le defaut de renouvellement."

L'indemnite d'eviction comprend :

1. L'indemnite principale :
{{#if perte_fonds}}
En cas de perte du fonds de commerce :
- Valeur du fonds : {{valeur_fonds}} EUR
{{else}}
En cas de transfert :
- Indemnite de deplacement : {{indemnite_deplacement}} EUR
{{/if}}

2. Les indemnites accessoires :
{{#if frais_demenagement}}
- Frais de demenagement : {{frais_demenagement}} EUR
{{/if}}
{{#if frais_reinstallation}}
- Frais de reinstallation : {{frais_reinstallation}} EUR
{{/if}}
{{#if indemnite_trouble}}
- Trouble commercial : {{indemnite_trouble}} EUR
{{/if}}
{{#if perte_stock}}
- Perte sur stock : {{perte_stock}} EUR
{{/if}}

TOTAL : {{total_indemnite}} EUR`,
    variables: [
      { name: 'perte_fonds', type: 'boolean' },
      { name: 'valeur_fonds', type: 'number' },
      { name: 'indemnite_deplacement', type: 'number' },
      { name: 'frais_demenagement', type: 'number' },
      { name: 'frais_reinstallation', type: 'number' },
      { name: 'indemnite_trouble', type: 'number' },
      { name: 'perte_stock', type: 'number' },
      { name: 'total_indemnite', type: 'number', required: true },
    ],
    tags: ['moyens', 'commercial', 'bail', 'indemnite_eviction'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 213,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Discrimination (art. L1132-1)',
    content: `II. DISCUSSION

Sur la discrimination

L'article L. 1132-1 du Code du travail prohibe toute discrimination fondee notamment sur l'origine, le sexe, l'age, le handicap, les convictions religieuses, l'orientation sexuelle ou les activites syndicales.

Conformement a l'article L. 1134-1 du Code du travail, le salarie presente des elements de fait laissant supposer l'existence d'une discrimination directe ou indirecte.

En l'espece :

1. Sur les elements de fait laissant presumer la discrimination :
{{elements_presomption}}

2. Sur le critere prohibe :
La discrimination est fondee sur {{critere_prohibe}}.

3. Sur la comparaison avec des salaries places dans une situation comparable :
{{comparaison}}

Il appartient a l'employeur de prouver que sa decision est justifiee par des elements objectifs etrangers a toute discrimination.

En l'absence d'une telle justification, la discrimination est etablie.`,
    variables: [
      { name: 'elements_presomption', type: 'text', required: true },
      { name: 'critere_prohibe', type: 'string', required: true },
      { name: 'comparaison', type: 'text', required: true },
    ],
    tags: ['moyens', 'travail', 'discrimination', 'egalite'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 214,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Faute inexcusable employeur',
    content: `II. DISCUSSION

Sur la faute inexcusable de l'employeur

L'article L. 452-1 du Code de la securite sociale permet a la victime d'un accident du travail de rechercher la faute inexcusable de l'employeur.

La faute inexcusable est caracterisee lorsque l'employeur avait ou aurait du avoir conscience du danger auquel etait expose le salarie et qu'il n'a pas pris les mesures necessaires pour l'en preserver (Soc., 28 fevrier 2002, n° 00-10.051, arrets "amiante").

1. Sur la conscience du danger :
{{argument_conscience}}

2. Sur l'absence de mesures de prevention :
{{argument_absence_mesures}}

La faute inexcusable etant etablie, {{victime.nom}} est fonde(e) a obtenir :
- La majoration de la rente ou du capital (article L. 452-2 CSS)
- La reparation de ses prejudices non couverts par le livre IV du CSS :
{{prejudices_complementaires}}`,
    variables: [
      { name: 'argument_conscience', type: 'text', required: true },
      { name: 'argument_absence_mesures', type: 'text', required: true },
      { name: 'victime.nom', type: 'string', required: true },
      { name: 'prejudices_complementaires', type: 'text', required: true },
    ],
    tags: ['moyens', 'travail', 'accident', 'faute_inexcusable'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 215,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Troubles anormaux de voisinage',
    content: `II. DISCUSSION

Sur les troubles anormaux de voisinage

La theorie des troubles anormaux de voisinage, d'origine jurisprudentielle (Civ. 3e, 4 fevrier 1971), permet d'engager la responsabilite de l'auteur de nuisances excedant les inconvenients normaux du voisinage, sans avoir a prouver une faute.

Les conditions sont les suivantes :

1. Sur l'existence d'un trouble :
{{argument_trouble}}

2. Sur le caractere anormal du trouble :
Le trouble excede les inconvenients normaux du voisinage car :
{{argument_anormalite}}

3. Sur le prejudice :
{{prejudice}}

Il importe peu que {{auteur.nom}} ait ou non commis une faute. La seule demonstration de l'anormalite du trouble suffit a engager sa responsabilite.

{{victime.nom}} est donc fonde(e) a obtenir :
- La cessation du trouble
- La reparation du prejudice subi`,
    variables: [
      { name: 'argument_trouble', type: 'text', required: true },
      { name: 'argument_anormalite', type: 'text', required: true },
      { name: 'prejudice', type: 'text', required: true },
      { name: 'auteur.nom', type: 'string', required: true },
      { name: 'victime.nom', type: 'string', required: true },
    ],
    tags: ['moyens', 'voisinage', 'troubles', 'responsabilite'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 216,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Garantie decennale (art. 1792)',
    content: `II. DISCUSSION

Sur la garantie decennale

L'article 1792 du Code civil dispose : "Tout constructeur d'un ouvrage est responsable de plein droit, envers le maitre ou l'acquereur de l'ouvrage, des dommages, meme resultant d'un vice du sol, qui compromettent la solidite de l'ouvrage ou qui, l'affectant dans l'un de ses elements constitutifs ou l'un de ses elements d'equipement, le rendent impropre a sa destination."

1. Sur la qualite de constructeur :
{{constructeur.nom}} est un constructeur au sens de l'article 1792-1 du Code civil en tant que {{qualite_constructeur}}.

2. Sur la nature des desordres :
Les desordres constates {{#if solidite}}compromettent la solidite de l'ouvrage{{else}}rendent l'ouvrage impropre a sa destination{{/if}} :
{{description_desordres}}

3. Sur le delai :
La reception est intervenue le {{date_reception}}. L'action a ete introduite le {{date_action}}, soit dans le delai decennal.

4. Sur les dommages-interets :
Le cout des travaux de reprise s'eleve a {{cout_reparation}} EUR.`,
    variables: [
      { name: 'constructeur.nom', type: 'string', required: true },
      { name: 'qualite_constructeur', type: 'string', required: true },
      { name: 'solidite', type: 'boolean' },
      { name: 'description_desordres', type: 'text', required: true },
      { name: 'date_reception', type: 'date', required: true },
      { name: 'date_action', type: 'date', required: true },
      { name: 'cout_reparation', type: 'number', required: true },
    ],
    tags: ['moyens', 'construction', 'garantie_decennale', 'responsabilite'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 217,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Enrichissement injustifie (art. 1303)',
    content: `II. DISCUSSION

Sur l'enrichissement injustifie

L'article 1303 du Code civil dispose : "En dehors des cas de gestion d'affaires et de paiement de l'indu, celui qui beneficie d'un enrichissement injustifie au detriment d'autrui doit, a celui qui s'en trouve appauvri, une indemnite egale a la moindre des deux valeurs de l'enrichissement et de l'appauvrissement."

Les conditions de l'action de in rem verso sont reunies :

1. Sur l'enrichissement :
{{argument_enrichissement}}

2. Sur l'appauvrissement correlatif :
{{argument_appauvrissement}}

3. Sur l'absence de justification :
{{argument_absence_justification}}

4. Sur la subsidiarite de l'action :
{{argument_subsidiarite}}

L'indemnite due est egale a la moindre des deux valeurs :
- Enrichissement : {{montant_enrichissement}} EUR
- Appauvrissement : {{montant_appauvrissement}} EUR

Soit {{montant_indemnite}} EUR.`,
    variables: [
      { name: 'argument_enrichissement', type: 'text', required: true },
      { name: 'argument_appauvrissement', type: 'text', required: true },
      { name: 'argument_absence_justification', type: 'text', required: true },
      { name: 'argument_subsidiarite', type: 'text', required: true },
      { name: 'montant_enrichissement', type: 'number', required: true },
      { name: 'montant_appauvrissement', type: 'number', required: true },
      { name: 'montant_indemnite', type: 'number', required: true },
    ],
    tags: ['moyens', 'civil', 'enrichissement_injustifie', 'quasi_contrat'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 218,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Abus de droit (art. 1240)',
    content: `II. DISCUSSION

Sur l'abus de droit

L'exercice d'un droit peut degenerer en abus et engager la responsabilite de son titulaire sur le fondement de l'article 1240 du Code civil.

La jurisprudence caracterise l'abus de droit dans les hypotheses suivantes :
- L'intention de nuire
- Le detournement de la finalite du droit
- L'absence de tout interet legitime
- La disproportion entre l'interet poursuivi et le prejudice cause

En l'espece, {{titulaire_droit.nom}} a abuse de son droit de {{droit_exerce}} :

{{argument_abus}}

Cet abus a cause a {{victime.nom}} le prejudice suivant :
{{prejudice}}

{{titulaire_droit.nom}} doit donc etre condamne(e) a reparer ce prejudice.`,
    variables: [
      { name: 'titulaire_droit.nom', type: 'string', required: true },
      { name: 'droit_exerce', type: 'string', required: true },
      { name: 'argument_abus', type: 'text', required: true },
      { name: 'victime.nom', type: 'string', required: true },
      { name: 'prejudice', type: 'text', required: true },
    ],
    tags: ['moyens', 'civil', 'abus_droit', 'responsabilite'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 219,
  },
];

// ============================================
// MOYENS BLOCKS - Part 2 (20 blocks)
// ============================================

const moyensBlocksPart2: BlockSeed[] = [
  {
    category: BlockCategory.MOYENS,
    title: 'Obligation de securite employeur',
    content: `II. DISCUSSION

Sur l'obligation de securite de l'employeur

L'article L. 4121-1 du Code du travail impose a l'employeur de prendre les mesures necessaires pour assurer la securite et proteger la sante physique et mentale des travailleurs.

Cette obligation est une obligation de moyen renforcee (Soc., 25 novembre 2015, n° 14-24.444).

En l'espece, l'employeur a manque a son obligation de securite :

{{argument_manquement}}

Ce manquement est a l'origine {{#if accident}}de l'accident survenu le {{accident.date}}{{else}}de l'atteinte a la sante de {{salarie.nom}}{{/if}}.

{{salarie.nom}} est donc fonde(e) a obtenir reparation de son prejudice.`,
    variables: [
      { name: 'argument_manquement', type: 'text', required: true },
      { name: 'accident', type: 'object' },
      { name: 'accident.date', type: 'date' },
      { name: 'salarie.nom', type: 'string', required: true },
    ],
    tags: ['moyens', 'travail', 'securite', 'obligation'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 220,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Vice du consentement - dol (art. 1137)',
    content: `II. DISCUSSION

Sur le dol

L'article 1137 du Code civil dispose : "Le dol est le fait pour un contractant d'obtenir le consentement de l'autre par des manoeuvres ou des mensonges. Constitue egalement un dol la dissimulation intentionnelle par l'un des contractants d'une information dont il sait le caractere determinant pour l'autre partie."

En l'espece, le consentement de {{victime.nom}} a ete vicie par dol :

1. Sur l'element materiel :
{{#if manoeuvres}}
- Manoeuvres : {{manoeuvres}}
{{/if}}
{{#if mensonges}}
- Mensonges : {{mensonges}}
{{/if}}
{{#if reticence}}
- Reticence dolosive : {{reticence}}
{{/if}}

2. Sur l'element intentionnel :
{{argument_intention}}

3. Sur le caractere determinant :
{{argument_determinant}}

Le contrat doit donc etre annule avec toutes consequences de droit.`,
    variables: [
      { name: 'victime.nom', type: 'string', required: true },
      { name: 'manoeuvres', type: 'text' },
      { name: 'mensonges', type: 'text' },
      { name: 'reticence', type: 'text' },
      { name: 'argument_intention', type: 'text', required: true },
      { name: 'argument_determinant', type: 'text', required: true },
    ],
    tags: ['moyens', 'contrats', 'dol', 'nullite'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 221,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Clause penale - reduction judiciaire',
    content: `II. DISCUSSION

Sur la clause penale

L'article 1231-5 du Code civil dispose : "Lorsque le contrat stipule que celui qui manquera de l'executer paiera une certaine somme a titre de dommages et interets, il ne peut etre alloue a l'autre partie une somme plus forte ni moindre. Neanmoins, le juge peut, meme d'office, moderer ou augmenter la penalite ainsi convenue si elle est manifestement excessive ou derisoire."

En l'espece, la clause penale prevue a l'article {{clause_reference}} du contrat fixe une penalite de {{montant_penalite}} EUR.

Cette penalite est manifestement excessive car :
{{argument_excessif}}

Il y a lieu de la reduire a la somme de {{montant_reduit}} EUR, correspondant a :
{{justification_montant}}`,
    variables: [
      { name: 'clause_reference', type: 'string', required: true },
      { name: 'montant_penalite', type: 'number', required: true },
      { name: 'argument_excessif', type: 'text', required: true },
      { name: 'montant_reduit', type: 'number', required: true },
      { name: 'justification_montant', type: 'text', required: true },
    ],
    tags: ['moyens', 'contrats', 'clause_penale', 'moderation'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 222,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Resiliation judiciaire contrat travail',
    content: `II. DISCUSSION

Sur la resiliation judiciaire du contrat de travail

La resiliation judiciaire du contrat de travail peut etre demandee par le salarie lorsque l'employeur a commis des manquements graves a ses obligations.

En l'espece, les manquements suivants justifient la resiliation :

{{#each manquements}}
{{@index}}. {{this.description}}
{{/each}}

Ces manquements sont suffisamment graves pour empecher la poursuite du contrat de travail car :
{{argument_gravite}}

La resiliation doit produire les effets d'un licenciement sans cause reelle et serieuse, ouvrant droit a :
{{indemnites}}`,
    variables: [
      { name: 'manquements', type: 'array', required: true },
      { name: 'argument_gravite', type: 'text', required: true },
      { name: 'indemnites', type: 'text', required: true },
    ],
    tags: ['moyens', 'travail', 'resiliation_judiciaire', 'contrat'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 223,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Responsabilite du fait des choses (art. 1242)',
    content: `II. DISCUSSION

Sur la responsabilite du fait des choses

L'article 1242 alinea 1er du Code civil dispose : "On est responsable non seulement du dommage que l'on cause par son propre fait, mais encore de celui qui est cause par le fait des personnes dont on doit repondre, ou des choses que l'on a sous sa garde."

1. Sur la garde de la chose :
{{gardien.nom}} avait la garde de {{chose}} au moment des faits car il en avait l'usage, la direction et le controle.

2. Sur le fait de la chose :
{{argument_fait_chose}}

3. Sur le dommage :
{{dommage}}

4. Sur le lien de causalite :
{{lien_causalite}}

La responsabilite de {{gardien.nom}} est donc engagee de plein droit.`,
    variables: [
      { name: 'gardien.nom', type: 'string', required: true },
      { name: 'chose', type: 'string', required: true },
      { name: 'argument_fait_chose', type: 'text', required: true },
      { name: 'dommage', type: 'text', required: true },
      { name: 'lien_causalite', type: 'text', required: true },
    ],
    tags: ['moyens', 'responsabilite', 'fait_choses', 'garde'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 224,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Prise acte rupture contrat travail',
    content: `II. DISCUSSION

Sur la prise d'acte de la rupture

La prise d'acte est un mode de rupture du contrat de travail a l'initiative du salarie qui reproche a l'employeur des manquements graves a ses obligations.

Lorsque les manquements sont etablis et suffisamment graves, la prise d'acte produit les effets d'un licenciement sans cause reelle et serieuse.

En l'espece, les manquements reproches a l'employeur sont les suivants :

{{#each manquements}}
- {{this}}
{{/each}}

Ces manquements sont suffisamment graves pour justifier la prise d'acte car :
{{argument_gravite}}

En consequence, la prise d'acte doit produire les effets d'un licenciement sans cause reelle et serieuse.`,
    variables: [
      { name: 'manquements', type: 'array', required: true },
      { name: 'argument_gravite', type: 'text', required: true },
    ],
    tags: ['moyens', 'travail', 'prise_acte', 'rupture'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 225,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Prestation compensatoire (art. 270 CC)',
    content: `II. DISCUSSION

Sur la prestation compensatoire

L'article 270 du Code civil dispose que l'un des epoux peut etre tenu de verser a l'autre une prestation destinee a compenser, autant qu'il est possible, la disparite que la rupture du mariage cree dans les conditions de vie respectives.

Conformement a l'article 271 du Code civil, les criteres d'appreciation sont les suivants :

1. Duree du mariage : {{duree_mariage}}
2. Age et etat de sante des epoux : {{age_sante}}
3. Qualification et situation professionnelle : {{situation_professionnelle}}
4. Consequences des choix professionnels faits pendant le mariage : {{choix_professionnels}}
5. Patrimoine estime apres liquidation : {{patrimoine}}
6. Droits existants et previsibles : {{droits_previsibles}}
7. Situation respective en matiere de pensions de retraite : {{retraite}}

Au regard de ces elements, une prestation compensatoire de {{montant_prestation}} EUR est justifiee.`,
    variables: [
      { name: 'duree_mariage', type: 'string', required: true },
      { name: 'age_sante', type: 'text' },
      { name: 'situation_professionnelle', type: 'text', required: true },
      { name: 'choix_professionnels', type: 'text' },
      { name: 'patrimoine', type: 'text' },
      { name: 'droits_previsibles', type: 'text' },
      { name: 'retraite', type: 'text' },
      { name: 'montant_prestation', type: 'number', required: true },
    ],
    tags: ['moyens', 'famille', 'divorce', 'prestation_compensatoire'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 226,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Requalification CDD en CDI',
    content: `II. DISCUSSION

Sur la requalification du CDD en CDI

En application de l'article L. 1242-1 du Code du travail, le contrat a duree determinee ne peut avoir ni pour objet ni pour effet de pourvoir durablement un emploi lie a l'activite normale et permanente de l'entreprise.

En l'espece, la requalification s'impose pour les motifs suivants :

{{#if defaut_ecrit}}
1. Defaut d'ecrit : Le contrat n'a pas ete etabli par ecrit (article L. 1242-12).
{{/if}}

{{#if defaut_motif}}
2. Absence de motif precis : {{defaut_motif}}
{{/if}}

{{#if succession_irreguliere}}
3. Succession irreguliere de CDD : {{succession_irreguliere}}
{{/if}}

{{#if emploi_permanent}}
4. Poste lie a l'activite normale et permanente : {{emploi_permanent}}
{{/if}}

La requalification en CDI emporte les consequences suivantes :
- Indemnite de requalification (1 mois) : {{indemnite_requalification}} EUR
- La rupture s'analyse en un licenciement sans cause reelle et serieuse`,
    variables: [
      { name: 'defaut_ecrit', type: 'boolean' },
      { name: 'defaut_motif', type: 'text' },
      { name: 'succession_irreguliere', type: 'text' },
      { name: 'emploi_permanent', type: 'text' },
      { name: 'indemnite_requalification', type: 'number', required: true },
    ],
    tags: ['moyens', 'travail', 'cdd', 'requalification'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 227,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Competence juridiction',
    content: `II. DISCUSSION

A titre liminaire, sur la competence

{{#if competence_materielle}}
1. Sur la competence d'attribution :
{{competence_materielle}}
{{/if}}

{{#if competence_territoriale}}
2. Sur la competence territoriale :
En application de {{fondement_territorial}}, le tribunal territorialement competent est celui de {{tribunal_competent}} car :
{{argument_territorial}}
{{/if}}

{{#if clause_attributive}}
3. Sur la clause attributive de competence :
Le contrat contient une clause attributive de competence au profit du {{tribunal_clause}}.
{{#if clause_valide}}
Cette clause est valable car conclue entre commercants et clairement specifiee.
{{else}}
Cette clause est inopposable car {{argument_inopposabilite}}.
{{/if}}
{{/if}}

Le tribunal de ceans est donc competent pour connaitre du present litige.`,
    variables: [
      { name: 'competence_materielle', type: 'text' },
      { name: 'competence_territoriale', type: 'boolean' },
      { name: 'fondement_territorial', type: 'string' },
      { name: 'tribunal_competent', type: 'string' },
      { name: 'argument_territorial', type: 'text' },
      { name: 'clause_attributive', type: 'boolean' },
      { name: 'tribunal_clause', type: 'string' },
      { name: 'clause_valide', type: 'boolean' },
      { name: 'argument_inopposabilite', type: 'text' },
    ],
    tags: ['moyens', 'procedure', 'competence', 'juridiction'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 228,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Interets moratoires et capitalisation',
    content: `II. DISCUSSION

Sur les interets moratoires

En application de l'article 1231-6 du Code civil, les dommages et interets dus a raison du retard dans le paiement d'une obligation de somme d'argent consistent dans l'interet au taux legal.

Ces interets sont dus a compter de {{#if mise_en_demeure}}la mise en demeure du {{date_mise_en_demeure}}{{else}}l'assignation{{/if}}.

{{#if majoration}}
En application de l'article L. 313-3 du Code monetaire et financier, le taux d'interet legal sera majore de {{majoration_points}} points a l'expiration d'un delai de deux mois a compter du jour ou la decision de justice est devenue executoire.
{{/if}}

Sur la capitalisation des interets

En application de l'article 1343-2 du Code civil, il y a lieu d'ordonner la capitalisation des interets echus pour une annee entiere.

Les interets capitalises produiront eux-memes des interets.`,
    variables: [
      { name: 'mise_en_demeure', type: 'boolean' },
      { name: 'date_mise_en_demeure', type: 'date' },
      { name: 'majoration', type: 'boolean' },
      { name: 'majoration_points', type: 'number' },
    ],
    tags: ['moyens', 'interets', 'capitalisation', 'moratoires'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 229,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Article 700 CPC - frais irrepetibles',
    content: `II. DISCUSSION

Sur l'article 700 du Code de procedure civile

L'article 700 du Code de procedure civile dispose : "Le juge condamne la partie tenue aux depens ou qui perd son proces a payer a l'autre partie la somme qu'il determine, au titre des frais exposes et non compris dans les depens."

En l'espece, {{partie_gagnante.nom}} a ete contrainte d'engager des frais pour faire valoir ses droits, comprenant notamment :
{{frais_engages}}

Au regard de l'equite et de la situation economique des parties, il convient de condamner {{partie_perdante.nom}} a verser a {{partie_gagnante.nom}} la somme de {{montant_article_700}} EUR au titre de l'article 700 du Code de procedure civile.`,
    variables: [
      { name: 'partie_gagnante.nom', type: 'string', required: true },
      { name: 'frais_engages', type: 'text' },
      { name: 'partie_perdante.nom', type: 'string', required: true },
      { name: 'montant_article_700', type: 'number', required: true },
    ],
    tags: ['moyens', 'procedure', 'article_700', 'frais'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 230,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Execution provisoire',
    content: `II. DISCUSSION

Sur l'execution provisoire

{{#if droit}}
L'execution provisoire est de droit en application de l'article {{article_execution}}.
{{else}}
Il y a lieu d'ordonner l'execution provisoire en application de l'article 515 du Code de procedure civile.

En effet :
{{argument_execution_provisoire}}

L'execution provisoire se justifie par :
- L'anciennete de la creance
- La situation financiere des parties
- {{autres_arguments}}
{{/if}}

{{#if cantonnement}}
A titre subsidiaire, si le tribunal devait ordonner l'execution provisoire, il conviendrait de la cantonner a la somme de {{montant_cantonnement}} EUR.
{{/if}}`,
    variables: [
      { name: 'droit', type: 'boolean' },
      { name: 'article_execution', type: 'string' },
      { name: 'argument_execution_provisoire', type: 'text' },
      { name: 'autres_arguments', type: 'text' },
      { name: 'cantonnement', type: 'boolean' },
      { name: 'montant_cantonnement', type: 'number' },
    ],
    tags: ['moyens', 'procedure', 'execution_provisoire', 'cpc'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 231,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Astreinte',
    content: `II. DISCUSSION

Sur l'astreinte

En application des articles L. 131-1 et suivants du Code des procedures civiles d'execution, il convient d'assortir la condamnation d'une astreinte afin d'en garantir l'execution.

L'astreinte se justifie par :
{{justification_astreinte}}

Il convient de fixer l'astreinte a {{montant_astreinte}} EUR par {{periode_astreinte}} de retard, a compter de {{point_depart_astreinte}}.

{{#if astreinte_definitive}}
Cette astreinte sera definitive.
{{else}}
Cette astreinte sera provisoire et pourra etre liquidee par le juge de l'execution.
{{/if}}`,
    variables: [
      { name: 'justification_astreinte', type: 'text', required: true },
      { name: 'montant_astreinte', type: 'number', required: true },
      { name: 'periode_astreinte', type: 'string', required: true },
      { name: 'point_depart_astreinte', type: 'string', required: true },
      { name: 'astreinte_definitive', type: 'boolean' },
    ],
    tags: ['moyens', 'procedure', 'astreinte', 'execution'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 232,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Dommages-interets contractuels',
    content: `II. DISCUSSION

Sur les dommages-interets

En application de l'article 1231-1 du Code civil, le debiteur est condamne au paiement de dommages et interets a raison de l'inexecution de l'obligation.

1. Sur le principe de la reparation :
L'inexecution de {{obligation_inexecutee}} par {{debiteur.nom}} est etablie.

2. Sur l'etendue de la reparation :
Conformement a l'article 1231-2 du Code civil, les dommages et interets comprennent la perte eprouvee et le gain manque.

{{#if perte_eprouvee}}
a) Perte eprouvee (damnum emergens) :
{{perte_eprouvee}}
Montant : {{montant_perte}} EUR
{{/if}}

{{#if gain_manque}}
b) Gain manque (lucrum cessans) :
{{gain_manque}}
Montant : {{montant_gain_manque}} EUR
{{/if}}

3. Sur la previsibilite du dommage :
{{argument_previsibilite}}

TOTAL : {{total_dommages}} EUR`,
    variables: [
      { name: 'obligation_inexecutee', type: 'string', required: true },
      { name: 'debiteur.nom', type: 'string', required: true },
      { name: 'perte_eprouvee', type: 'text' },
      { name: 'montant_perte', type: 'number' },
      { name: 'gain_manque', type: 'text' },
      { name: 'montant_gain_manque', type: 'number' },
      { name: 'argument_previsibilite', type: 'text' },
      { name: 'total_dommages', type: 'number', required: true },
    ],
    tags: ['moyens', 'contrats', 'dommages_interets', 'reparation'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 233,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Clause limitative de responsabilite',
    content: `II. DISCUSSION

Sur la clause limitative de responsabilite

{{#if inopposabilite}}
La clause limitative de responsabilite invoquee par {{partie_adverse.nom}} est inopposable a {{client.nom}}.

En effet :
{{#if faute_lourde}}
- La clause ne peut etre invoquee en cas de faute lourde ou dolosive, or {{argument_faute_lourde}}
{{/if}}
{{#if obligation_essentielle}}
- La clause contredit l'obligation essentielle du contrat au sens de l'arret Chronopost (Com., 22 octobre 1996) car {{argument_obligation_essentielle}}
{{/if}}
{{#if clause_abusive}}
- La clause est abusive au sens de l'article L. 212-1 du Code de la consommation car {{argument_abusif}}
{{/if}}
{{else}}
La clause limitative de responsabilite prevue a l'article {{clause_reference}} du contrat est valable et opposable.

Cette clause limite la responsabilite de {{beneficiaire.nom}} a la somme de {{plafond}} EUR.
{{/if}}`,
    variables: [
      { name: 'inopposabilite', type: 'boolean' },
      { name: 'partie_adverse.nom', type: 'string' },
      { name: 'client.nom', type: 'string' },
      { name: 'faute_lourde', type: 'boolean' },
      { name: 'argument_faute_lourde', type: 'text' },
      { name: 'obligation_essentielle', type: 'boolean' },
      { name: 'argument_obligation_essentielle', type: 'text' },
      { name: 'clause_abusive', type: 'boolean' },
      { name: 'argument_abusif', type: 'text' },
      { name: 'clause_reference', type: 'string' },
      { name: 'beneficiaire.nom', type: 'string' },
      { name: 'plafond', type: 'number' },
    ],
    tags: ['moyens', 'contrats', 'clause_limitative', 'responsabilite'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 234,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Force majeure (art. 1218)',
    content: `II. DISCUSSION

Sur la force majeure

L'article 1218 du Code civil definit la force majeure comme un evenement echappant au controle du debiteur, qui ne pouvait etre raisonnablement prevu lors de la conclusion du contrat et dont les effets ne peuvent etre evites par des mesures appropriees.

{{#if exoneration}}
En l'espece, {{debiteur.nom}} est exonere de sa responsabilite car l'evenement invoque constitue un cas de force majeure :

1. Sur l'exteriorite :
{{argument_exteriorite}}

2. Sur l'imprevisibilite :
{{argument_imprevisibilite}}

3. Sur l'irresistibilite :
{{argument_irresistibilite}}
{{else}}
En l'espece, l'evenement invoque par {{debiteur.nom}} ne constitue pas un cas de force majeure :

{{#if pas_exterieur}}
- L'evenement n'est pas exterieur au debiteur : {{pas_exterieur}}
{{/if}}
{{#if pas_imprevisible}}
- L'evenement etait previsible : {{pas_imprevisible}}
{{/if}}
{{#if pas_irresistible}}
- L'evenement n'etait pas irresistible : {{pas_irresistible}}
{{/if}}

{{debiteur.nom}} reste donc tenu de son obligation.
{{/if}}`,
    variables: [
      { name: 'exoneration', type: 'boolean' },
      { name: 'debiteur.nom', type: 'string', required: true },
      { name: 'argument_exteriorite', type: 'text' },
      { name: 'argument_imprevisibilite', type: 'text' },
      { name: 'argument_irresistibilite', type: 'text' },
      { name: 'pas_exterieur', type: 'text' },
      { name: 'pas_imprevisible', type: 'text' },
      { name: 'pas_irresistible', type: 'text' },
    ],
    tags: ['moyens', 'contrats', 'force_majeure', 'exoneration'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 235,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Moyens de defense generiques',
    content: `II. EN DEFENSE

En reponse aux pretentions de {{demandeur.nom}}, {{defendeur.nom}} soutient que :

{{#if irrecevabilite}}
A TITRE PRINCIPAL, SUR L'IRRECEVABILITE DES DEMANDES :
{{irrecevabilite}}
{{/if}}

{{#if contestation_faits}}
SUR LES FAITS :
{{contestation_faits}}
{{/if}}

{{#if contestation_droit}}
EN DROIT :
{{contestation_droit}}
{{/if}}

{{#if absence_prejudice}}
SUR L'ABSENCE DE PREJUDICE :
{{absence_prejudice}}
{{/if}}

{{#if demande_reconventionnelle}}
A TITRE RECONVENTIONNEL :
{{demande_reconventionnelle}}
{{/if}}

Par consequent, {{demandeur.nom}} doit etre deboute de l'ensemble de ses demandes.`,
    variables: [
      { name: 'demandeur.nom', type: 'string', required: true },
      { name: 'defendeur.nom', type: 'string', required: true },
      { name: 'irrecevabilite', type: 'text' },
      { name: 'contestation_faits', type: 'text' },
      { name: 'contestation_droit', type: 'text' },
      { name: 'absence_prejudice', type: 'text' },
      { name: 'demande_reconventionnelle', type: 'text' },
    ],
    tags: ['moyens', 'defense', 'contestation', 'generique'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 236,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Indemnites licenciement calcul',
    content: `II. DISCUSSION

Sur le calcul des indemnites

1. Indemnite de licenciement (art. L. 1234-9 C. trav.) :
- Salaire de reference : {{salaire_reference}} EUR
- Anciennete : {{anciennete}} ans
- Calcul : {{calcul_indemnite_legale}}
- Montant : {{indemnite_legale}} EUR

2. Indemnite compensatrice de preavis (art. L. 1234-1 C. trav.) :
- Duree du preavis : {{duree_preavis}} mois
- Montant : {{indemnite_preavis}} EUR
- Conges payes sur preavis : {{cp_preavis}} EUR

{{#if sans_cause}}
3. Indemnite pour licenciement sans cause reelle et serieuse (art. L. 1235-3 C. trav.) :
- Anciennete : {{anciennete}} ans
- Bareme applicable : {{bareme_min}} a {{bareme_max}} mois
- Montant demande : {{indemnite_sans_cause}} EUR
{{/if}}

{{#if prejudice_moral}}
4. Prejudice moral distinct : {{prejudice_moral}} EUR
{{/if}}

TOTAL : {{total_indemnites}} EUR`,
    variables: [
      { name: 'salaire_reference', type: 'number', required: true },
      { name: 'anciennete', type: 'number', required: true },
      { name: 'calcul_indemnite_legale', type: 'text' },
      { name: 'indemnite_legale', type: 'number', required: true },
      { name: 'duree_preavis', type: 'number', required: true },
      { name: 'indemnite_preavis', type: 'number', required: true },
      { name: 'cp_preavis', type: 'number' },
      { name: 'sans_cause', type: 'boolean' },
      { name: 'bareme_min', type: 'number' },
      { name: 'bareme_max', type: 'number' },
      { name: 'indemnite_sans_cause', type: 'number' },
      { name: 'prejudice_moral', type: 'number' },
      { name: 'total_indemnites', type: 'number', required: true },
    ],
    tags: ['moyens', 'travail', 'licenciement', 'indemnites'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 237,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Inopposabilite clause contrat adhesion',
    content: `II. DISCUSSION

Sur l'inopposabilite de la clause

L'article 1171 du Code civil dispose : "Dans un contrat d'adhesion, toute clause non negociable, determinee a l'avance par l'une des parties, qui cree un desequilibre significatif entre les droits et obligations des parties au contrat est reputee non ecrite."

En l'espece, la clause {{clause_litigieuse}} est inopposable car :

1. Le contrat est un contrat d'adhesion :
{{argument_adhesion}}

2. La clause n'a pas ete negociee :
{{argument_non_negociee}}

3. La clause cree un desequilibre significatif :
{{argument_desequilibre}}

Cette clause doit donc etre reputee non ecrite.`,
    variables: [
      { name: 'clause_litigieuse', type: 'string', required: true },
      { name: 'argument_adhesion', type: 'text', required: true },
      { name: 'argument_non_negociee', type: 'text', required: true },
      { name: 'argument_desequilibre', type: 'text', required: true },
    ],
    tags: ['moyens', 'contrats', 'adhesion', 'clause_abusive'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 238,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Exception inexecution (art. 1219)',
    content: `II. DISCUSSION

Sur l'exception d'inexecution

L'article 1219 du Code civil dispose : "Une partie peut refuser d'executer son obligation, alors meme que celle-ci est exigible, si l'autre n'execute pas la sienne et si cette inexecution est suffisamment grave."

En l'espece, {{partie.nom}} est fonde(e) a suspendre l'execution de son obligation de {{obligation_suspendue}} car :

1. L'obligation de l'autre partie est exigible :
{{argument_exigibilite}}

2. L'autre partie n'execute pas son obligation :
{{argument_inexecution}}

3. Cette inexecution est suffisamment grave :
{{argument_gravite}}

L'exception d'inexecution opposee par {{partie.nom}} est donc justifiee.`,
    variables: [
      { name: 'partie.nom', type: 'string', required: true },
      { name: 'obligation_suspendue', type: 'string', required: true },
      { name: 'argument_exigibilite', type: 'text', required: true },
      { name: 'argument_inexecution', type: 'text', required: true },
      { name: 'argument_gravite', type: 'text', required: true },
    ],
    tags: ['moyens', 'contrats', 'exception_inexecution', 'suspension'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 239,
  },
];

// Combine all moyens blocks
const moyensBlocks = [...moyensBlocksPart1, ...moyensBlocksPart2];

// ============================================
// DISPOSITIF BLOCKS (25)
// ============================================

const dispositifBlocks: BlockSeed[] = [
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Condamnation au paiement de somme',
    content: `PAR CES MOTIFS

Vu les articles {{articles_vises}},
Vu les pieces versees aux debats,

PLAISE AU TRIBUNAL :

- DECLARER {{demandeur.nom}} recevable et bien fonde(e) en ses demandes ;

- CONDAMNER {{defendeur.nom}} a payer a {{demandeur.nom}} :
  * La somme de {{montant_principal}} EUR au titre de {{motif_principal}} ;
  {{#if montant_accessoire}}
  * La somme de {{montant_accessoire}} EUR au titre de {{motif_accessoire}} ;
  {{/if}}
  {{#if interets}}
  * Les interets au taux legal a compter du {{date_interets}} ;
  {{/if}}
  {{#if capitalisation}}
  * Ordonner la capitalisation des interets conformement a l'article 1343-2 du Code civil ;
  {{/if}}

- CONDAMNER {{defendeur.nom}} aux entiers depens ;

- CONDAMNER {{defendeur.nom}} a payer a {{demandeur.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du Code de procedure civile ;

{{#if execution_provisoire}}
- ORDONNER l'execution provisoire de la decision a intervenir ;
{{/if}}

- DEBOUTER {{defendeur.nom}} de l'ensemble de ses demandes, fins et conclusions.`,
    variables: [
      { name: 'articles_vises', type: 'string', required: true },
      { name: 'demandeur.nom', type: 'string', required: true },
      { name: 'defendeur.nom', type: 'string', required: true },
      { name: 'montant_principal', type: 'number', required: true },
      { name: 'motif_principal', type: 'string', required: true },
      { name: 'montant_accessoire', type: 'number' },
      { name: 'motif_accessoire', type: 'string' },
      { name: 'interets', type: 'boolean' },
      { name: 'date_interets', type: 'date' },
      { name: 'capitalisation', type: 'boolean' },
      { name: 'article_700', type: 'number', required: true },
      { name: 'execution_provisoire', type: 'boolean' },
    ],
    tags: ['dispositif', 'condamnation', 'paiement'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 300,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif refere provision',
    content: `PAR CES MOTIFS

Vu l'article 835 du Code de procedure civile,

PLAISE A MONSIEUR/MADAME LE PRESIDENT STATUANT EN REFERE :

- CONSTATER que l'obligation de {{debiteur.nom}} n'est pas serieusement contestable ;

- CONDAMNER {{debiteur.nom}} a payer a {{creancier.nom}} une PROVISION de {{montant_provision}} EUR a valoir sur l'indemnisation de son prejudice ;

- CONDAMNER {{debiteur.nom}} aux depens de l'instance ;

- CONDAMNER {{debiteur.nom}} a payer a {{creancier.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du Code de procedure civile ;

- RAPPELER que l'execution provisoire est de droit ;

- DEBOUTER {{debiteur.nom}} de l'ensemble de ses demandes.`,
    variables: [
      { name: 'debiteur.nom', type: 'string', required: true },
      { name: 'creancier.nom', type: 'string', required: true },
      { name: 'montant_provision', type: 'number', required: true },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'refere', 'provision'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 301,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif expulsion locataire',
    content: `PAR CES MOTIFS

Vu les articles 24 et suivants de la loi n° 89-462 du 6 juillet 1989,
Vu les articles L. 412-1 et suivants du Code des procedures civiles d'execution,

PLAISE AU TRIBUNAL :

- CONSTATER l'acquisition de la clause resolutoire inseree au bail ;

- PRONONCER en consequence la resiliation du bail liant les parties ;

- ORDONNER l'expulsion de {{locataire.nom}} et de tous occupants de son chef des lieux sis {{logement.adresse}}, {{logement.codePostal}} {{logement.ville}}, avec si besoin le concours de la force publique ;

- CONDAMNER {{locataire.nom}} au paiement de la somme de {{arrieres}} EUR au titre des arrieres locatifs arretes au {{date_arrete}} ;

- CONDAMNER {{locataire.nom}} au paiement d'une indemnite d'occupation egale au montant du loyer et des charges, soit {{indemnite_occupation}} EUR par mois, jusqu'a la liberation effective des lieux ;

- CONDAMNER {{locataire.nom}} aux entiers depens ;

- CONDAMNER {{locataire.nom}} a payer a {{bailleur.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du CPC ;

- ORDONNER l'execution provisoire de la presente decision.`,
    variables: [
      { name: 'locataire.nom', type: 'string', required: true },
      { name: 'logement.adresse', type: 'string', required: true },
      { name: 'logement.codePostal', type: 'string', required: true },
      { name: 'logement.ville', type: 'string', required: true },
      { name: 'arrieres', type: 'number', required: true },
      { name: 'date_arrete', type: 'date', required: true },
      { name: 'indemnite_occupation', type: 'number', required: true },
      { name: 'bailleur.nom', type: 'string', required: true },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'expulsion', 'bail', 'locatif'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 302,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif licenciement sans cause',
    content: `PAR CES MOTIFS

Vu les articles L. 1232-1, L. 1235-1 et L. 1235-3 du Code du travail,

PLAISE AU CONSEIL DE PRUD'HOMMES :

- DIRE ET JUGER que le licenciement de {{salarie.nom}} est depourvu de cause reelle et serieuse ;

- CONDAMNER {{employeur.nom}} a payer a {{salarie.nom}} :
  * {{indemnite_licenciement}} EUR a titre d'indemnite de licenciement ;
  * {{indemnite_preavis}} EUR a titre d'indemnite compensatrice de preavis ;
  * {{cp_preavis}} EUR au titre des conges payes afferents ;
  * {{indemnite_sans_cause}} EUR a titre de dommages et interets pour licenciement sans cause reelle et serieuse ;
  {{#if rappel_salaire}}
  * {{rappel_salaire}} EUR a titre de rappel de salaire ;
  * {{cp_rappel}} EUR au titre des conges payes afferents ;
  {{/if}}

- ORDONNER la remise des documents de fin de contrat (certificat de travail, attestation Pole emploi, solde de tout compte) conformes ;

- CONDAMNER {{employeur.nom}} aux entiers depens ;

- CONDAMNER {{employeur.nom}} a payer a {{salarie.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du CPC ;

- ORDONNER l'execution provisoire.`,
    variables: [
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'indemnite_licenciement', type: 'number', required: true },
      { name: 'indemnite_preavis', type: 'number', required: true },
      { name: 'cp_preavis', type: 'number', required: true },
      { name: 'indemnite_sans_cause', type: 'number', required: true },
      { name: 'rappel_salaire', type: 'number' },
      { name: 'cp_rappel', type: 'number' },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'travail', 'licenciement', 'prudhommes'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 303,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif responsabilite civile',
    content: `PAR CES MOTIFS

Vu l'article {{article_responsabilite}} du Code civil,

PLAISE AU TRIBUNAL :

- DECLARER {{demandeur.nom}} recevable et bien fonde(e) en son action ;

- DIRE ET JUGER que {{responsable.nom}} a engage sa responsabilite ;

- CONDAMNER {{responsable.nom}} a payer a {{demandeur.nom}} la somme de {{montant_dommages}} EUR a titre de dommages et interets en reparation de son prejudice ;

{{#if reparation_nature}}
- ORDONNER {{reparation_nature}} ;
{{/if}}

- ASSORTIR cette condamnation des interets au taux legal a compter de {{date_interets}} ;

- ORDONNER la capitalisation des interets ;

- CONDAMNER {{responsable.nom}} aux entiers depens ;

- CONDAMNER {{responsable.nom}} a payer a {{demandeur.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du CPC ;

{{#if execution_provisoire}}
- ORDONNER l'execution provisoire ;
{{/if}}

- DEBOUTER {{responsable.nom}} de ses demandes.`,
    variables: [
      { name: 'article_responsabilite', type: 'string', required: true },
      { name: 'demandeur.nom', type: 'string', required: true },
      { name: 'responsable.nom', type: 'string', required: true },
      { name: 'montant_dommages', type: 'number', required: true },
      { name: 'reparation_nature', type: 'string' },
      { name: 'date_interets', type: 'date', required: true },
      { name: 'article_700', type: 'number', required: true },
      { name: 'execution_provisoire', type: 'boolean' },
    ],
    tags: ['dispositif', 'responsabilite', 'dommages_interets'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 304,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif divorce contentieux',
    content: `PAR CES MOTIFS

Vu les articles 229 et suivants du Code civil,

PLAISE AU JUGE AUX AFFAIRES FAMILIALES :

- PRONONCER le divorce entre {{epoux1.nom}} et {{epoux2.nom}} aux torts {{#if torts_partages}}partages{{else}}exclusifs de {{epoux_fautif}}{{/if}} ;

- FIXER les effets du divorce entre les epoux a la date du {{date_effets}} ;

{{#if prestation_compensatoire}}
- CONDAMNER {{debiteur_prestation}} a payer a {{creancier_prestation}} une prestation compensatoire de {{montant_prestation}} EUR ;
{{/if}}

{{#if residence_enfants}}
- FIXER la residence habituelle des enfants au domicile de {{parent_residence}} ;
{{/if}}

{{#if dvh}}
- ACCORDER a {{parent_dvh}} un droit de visite et d'hebergement s'exercant :
{{modalites_dvh}}
{{/if}}

{{#if pension_alimentaire}}
- CONDAMNER {{debiteur_pension}} a verser a {{creancier_pension}} une pension alimentaire de {{montant_pension}} EUR par mois et par enfant ;
{{/if}}

- RENVOYER les parties devant le notaire pour les operations de liquidation ;

- DIT n'y avoir lieu a condamnation au titre de l'article 700 du CPC ;

- DIT que chaque partie conservera la charge de ses propres depens.`,
    variables: [
      { name: 'epoux1.nom', type: 'string', required: true },
      { name: 'epoux2.nom', type: 'string', required: true },
      { name: 'torts_partages', type: 'boolean' },
      { name: 'epoux_fautif', type: 'string' },
      { name: 'date_effets', type: 'date', required: true },
      { name: 'prestation_compensatoire', type: 'boolean' },
      { name: 'debiteur_prestation', type: 'string' },
      { name: 'creancier_prestation', type: 'string' },
      { name: 'montant_prestation', type: 'number' },
      { name: 'residence_enfants', type: 'boolean' },
      { name: 'parent_residence', type: 'string' },
      { name: 'dvh', type: 'boolean' },
      { name: 'parent_dvh', type: 'string' },
      { name: 'modalites_dvh', type: 'text' },
      { name: 'pension_alimentaire', type: 'boolean' },
      { name: 'debiteur_pension', type: 'string' },
      { name: 'creancier_pension', type: 'string' },
      { name: 'montant_pension', type: 'number' },
    ],
    tags: ['dispositif', 'famille', 'divorce', 'jaf'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 305,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif injonction de payer',
    content: `PAR CES MOTIFS

Vu les articles 1405 et suivants du Code de procedure civile,

PLAISE A MONSIEUR/MADAME LE PRESIDENT :

- RENDRE une ordonnance portant injonction de payer a l'encontre de {{debiteur.nom}} ;

- ENJOINDRE a {{debiteur.nom}} de payer a {{creancier.nom}} :
  * La somme principale de {{montant_principal}} EUR
  {{#if interets_contractuels}}
  * Les interets contractuels au taux de {{taux_interets}}% a compter du {{date_interets}}
  {{/if}}
  {{#if clause_penale}}
  * La somme de {{montant_clause_penale}} EUR au titre de la clause penale
  {{/if}}

- CONDAMNER {{debiteur.nom}} aux depens.`,
    variables: [
      { name: 'debiteur.nom', type: 'string', required: true },
      { name: 'creancier.nom', type: 'string', required: true },
      { name: 'montant_principal', type: 'number', required: true },
      { name: 'interets_contractuels', type: 'boolean' },
      { name: 'taux_interets', type: 'number' },
      { name: 'date_interets', type: 'date' },
      { name: 'clause_penale', type: 'boolean' },
      { name: 'montant_clause_penale', type: 'number' },
    ],
    tags: ['dispositif', 'injonction', 'payer', 'creance'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 306,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif refere mesures conservatoires',
    content: `PAR CES MOTIFS

Vu l'article 835 alinea 1er du Code de procedure civile,

PLAISE A MONSIEUR/MADAME LE PRESIDENT STATUANT EN REFERE :

- CONSTATER l'existence d'un trouble manifestement illicite / d'un dommage imminent ;

- ORDONNER les mesures suivantes :
{{mesures_ordonnees}}

- ASSORTIR ces mesures d'une astreinte de {{montant_astreinte}} EUR par jour de retard a compter de la signification de l'ordonnance ;

{{#if provision}}
- CONDAMNER {{debiteur.nom}} a verser a {{creancier.nom}} une provision de {{montant_provision}} EUR ;
{{/if}}

- CONDAMNER {{partie_condamnee.nom}} aux depens ;

- CONDAMNER {{partie_condamnee.nom}} a payer a {{partie_gagnante.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du CPC ;

- RAPPELER que l'execution provisoire est de droit.`,
    variables: [
      { name: 'mesures_ordonnees', type: 'text', required: true },
      { name: 'montant_astreinte', type: 'number', required: true },
      { name: 'provision', type: 'boolean' },
      { name: 'debiteur.nom', type: 'string' },
      { name: 'creancier.nom', type: 'string' },
      { name: 'montant_provision', type: 'number' },
      { name: 'partie_condamnee.nom', type: 'string', required: true },
      { name: 'partie_gagnante.nom', type: 'string', required: true },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'refere', 'mesures_conservatoires', 'urgence'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 307,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif annulation contrat',
    content: `PAR CES MOTIFS

Vu les articles 1128 et suivants du Code civil,

PLAISE AU TRIBUNAL :

- PRONONCER la nullite du contrat conclu le {{date_contrat}} entre {{partie1.nom}} et {{partie2.nom}} ;

- ORDONNER la remise des parties en l'etat anterieur au contrat annule ;

- En consequence :
  {{#if restitution_somme}}
  * CONDAMNER {{partie_restituante.nom}} a restituer a {{partie_beneficiaire.nom}} la somme de {{montant_restitution}} EUR ;
  {{/if}}
  {{#if restitution_bien}}
  * ORDONNER la restitution de {{bien_restitue}} a {{proprietaire.nom}} ;
  {{/if}}

{{#if dommages_interets}}
- CONDAMNER {{partie_fautive.nom}} a payer a {{victime.nom}} la somme de {{montant_dommages}} EUR a titre de dommages et interets ;
{{/if}}

- CONDAMNER {{partie_perdante.nom}} aux entiers depens ;

- CONDAMNER {{partie_perdante.nom}} a payer a {{partie_gagnante.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du CPC.`,
    variables: [
      { name: 'date_contrat', type: 'date', required: true },
      { name: 'partie1.nom', type: 'string', required: true },
      { name: 'partie2.nom', type: 'string', required: true },
      { name: 'restitution_somme', type: 'boolean' },
      { name: 'partie_restituante.nom', type: 'string' },
      { name: 'partie_beneficiaire.nom', type: 'string' },
      { name: 'montant_restitution', type: 'number' },
      { name: 'restitution_bien', type: 'boolean' },
      { name: 'bien_restitue', type: 'string' },
      { name: 'proprietaire.nom', type: 'string' },
      { name: 'dommages_interets', type: 'boolean' },
      { name: 'partie_fautive.nom', type: 'string' },
      { name: 'victime.nom', type: 'string' },
      { name: 'montant_dommages', type: 'number' },
      { name: 'partie_perdante.nom', type: 'string', required: true },
      { name: 'partie_gagnante.nom', type: 'string', required: true },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'nullite', 'contrat', 'restitution'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 308,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif resolution contrat',
    content: `PAR CES MOTIFS

Vu les articles 1224 et suivants du Code civil,

PLAISE AU TRIBUNAL :

- PRONONCER la resolution du contrat conclu le {{date_contrat}} entre {{partie1.nom}} et {{partie2.nom}} aux torts exclusifs de {{partie_fautive.nom}} ;

- CONDAMNER {{partie_fautive.nom}} a payer a {{partie_lesee.nom}} :
  * La somme de {{montant_restitution}} EUR en restitution de {{motif_restitution}} ;
  * La somme de {{montant_dommages}} EUR a titre de dommages et interets ;

- ASSORTIR ces condamnations des interets au taux legal a compter de {{date_interets}} ;

- ORDONNER la capitalisation des interets ;

- CONDAMNER {{partie_fautive.nom}} aux entiers depens ;

- CONDAMNER {{partie_fautive.nom}} a payer a {{partie_lesee.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du CPC ;

{{#if execution_provisoire}}
- ORDONNER l'execution provisoire.
{{/if}}`,
    variables: [
      { name: 'date_contrat', type: 'date', required: true },
      { name: 'partie1.nom', type: 'string', required: true },
      { name: 'partie2.nom', type: 'string', required: true },
      { name: 'partie_fautive.nom', type: 'string', required: true },
      { name: 'partie_lesee.nom', type: 'string', required: true },
      { name: 'montant_restitution', type: 'number', required: true },
      { name: 'motif_restitution', type: 'string', required: true },
      { name: 'montant_dommages', type: 'number', required: true },
      { name: 'date_interets', type: 'date', required: true },
      { name: 'article_700', type: 'number', required: true },
      { name: 'execution_provisoire', type: 'boolean' },
    ],
    tags: ['dispositif', 'resolution', 'contrat', 'inexecution'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 309,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif conclusions en defense',
    content: `PAR CES MOTIFS

PLAISE AU TRIBUNAL :

A TITRE PRINCIPAL :
{{#if irrecevabilite}}
- DECLARER les demandes de {{demandeur.nom}} irrecevables ;
{{/if}}
- DEBOUTER {{demandeur.nom}} de l'ensemble de ses demandes, fins et conclusions ;

{{#if demande_reconventionnelle}}
A TITRE RECONVENTIONNEL :
- CONDAMNER {{demandeur.nom}} a payer a {{defendeur.nom}} la somme de {{montant_reconventionnel}} EUR au titre de {{motif_reconventionnel}} ;
{{/if}}

EN TOUT ETAT DE CAUSE :
- CONDAMNER {{demandeur.nom}} aux entiers depens ;
- CONDAMNER {{demandeur.nom}} a payer a {{defendeur.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du CPC.`,
    variables: [
      { name: 'demandeur.nom', type: 'string', required: true },
      { name: 'defendeur.nom', type: 'string', required: true },
      { name: 'irrecevabilite', type: 'boolean' },
      { name: 'demande_reconventionnelle', type: 'boolean' },
      { name: 'montant_reconventionnel', type: 'number' },
      { name: 'motif_reconventionnel', type: 'string' },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'defense', 'deboutement'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 310,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif garantie vices caches',
    content: `PAR CES MOTIFS

Vu les articles 1641 et suivants du Code civil,

PLAISE AU TRIBUNAL :

- DIRE ET JUGER que le bien vendu est affecte de vices caches ;

{{#if action_redhibitoire}}
- PRONONCER la resolution de la vente intervenue le {{date_vente}} ;
- ORDONNER la restitution du bien au vendeur contre remboursement du prix de {{prix_vente}} EUR ;
{{else}}
- PRONONCER une reduction du prix de vente a hauteur de {{reduction_prix}} EUR ;
- CONDAMNER {{vendeur.nom}} a rembourser a {{acquereur.nom}} la somme de {{reduction_prix}} EUR ;
{{/if}}

- CONDAMNER {{vendeur.nom}} a payer a {{acquereur.nom}} la somme de {{frais_reparation}} EUR au titre des frais de remise en etat ;

- CONDAMNER {{vendeur.nom}} aux entiers depens ;

- CONDAMNER {{vendeur.nom}} a payer a {{acquereur.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du CPC.`,
    variables: [
      { name: 'action_redhibitoire', type: 'boolean' },
      { name: 'date_vente', type: 'date', required: true },
      { name: 'prix_vente', type: 'number' },
      { name: 'reduction_prix', type: 'number' },
      { name: 'vendeur.nom', type: 'string', required: true },
      { name: 'acquereur.nom', type: 'string', required: true },
      { name: 'frais_reparation', type: 'number' },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'vices_caches', 'vente', 'garantie'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 311,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif harcelement moral travail',
    content: `PAR CES MOTIFS

Vu les articles L. 1152-1 et suivants du Code du travail,

PLAISE AU CONSEIL DE PRUD'HOMMES :

- DIRE ET JUGER que {{salarie.nom}} a ete victime de harcelement moral ;

- PRONONCER la nullite du licenciement de {{salarie.nom}} ;

- CONDAMNER {{employeur.nom}} a payer a {{salarie.nom}} :
  * {{indemnite_licenciement}} EUR a titre d'indemnite de licenciement ;
  * {{indemnite_preavis}} EUR a titre d'indemnite compensatrice de preavis ;
  * {{cp_preavis}} EUR au titre des conges payes afferents ;
  * {{indemnite_nullite}} EUR a titre d'indemnite pour licenciement nul (minimum 6 mois) ;
  * {{dommages_harcelement}} EUR a titre de dommages et interets pour harcelement moral ;

- ORDONNER la remise des documents de fin de contrat conformes ;

- CONDAMNER {{employeur.nom}} aux entiers depens ;

- CONDAMNER {{employeur.nom}} a payer a {{salarie.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du CPC.`,
    variables: [
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'indemnite_licenciement', type: 'number', required: true },
      { name: 'indemnite_preavis', type: 'number', required: true },
      { name: 'cp_preavis', type: 'number', required: true },
      { name: 'indemnite_nullite', type: 'number', required: true },
      { name: 'dommages_harcelement', type: 'number', required: true },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'travail', 'harcelement', 'nullite'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 312,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif appel - infirmation',
    content: `PAR CES MOTIFS

PLAISE A LA COUR :

- DECLARER {{appelant.nom}} recevable et bien fonde en son appel ;

- INFIRMER le jugement rendu par le {{juridiction}} de {{ville}} le {{date_jugement}} en ce qu'il a :
{{chefs_infirmes}}

STATUANT A NOUVEAU :
{{demandes_nouvelles}}

- CONFIRMER le jugement pour le surplus ;

- CONDAMNER {{intime.nom}} aux entiers depens de premiere instance et d'appel ;

- CONDAMNER {{intime.nom}} a payer a {{appelant.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du CPC pour les frais d'appel.`,
    variables: [
      { name: 'appelant.nom', type: 'string', required: true },
      { name: 'juridiction', type: 'string', required: true },
      { name: 'ville', type: 'string', required: true },
      { name: 'date_jugement', type: 'date', required: true },
      { name: 'chefs_infirmes', type: 'text', required: true },
      { name: 'demandes_nouvelles', type: 'text', required: true },
      { name: 'intime.nom', type: 'string', required: true },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'appel', 'infirmation', 'cour_appel'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 313,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif appel - confirmation',
    content: `PAR CES MOTIFS

PLAISE A LA COUR :

- DECLARER l'appel de {{appelant.nom}} mal fonde ;

- CONFIRMER le jugement rendu par le {{juridiction}} de {{ville}} le {{date_jugement}} en toutes ses dispositions ;

- Y AJOUTANT :

- CONDAMNER {{appelant.nom}} aux entiers depens d'appel ;

- CONDAMNER {{appelant.nom}} a payer a {{intime.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du CPC pour les frais d'appel.`,
    variables: [
      { name: 'appelant.nom', type: 'string', required: true },
      { name: 'juridiction', type: 'string', required: true },
      { name: 'ville', type: 'string', required: true },
      { name: 'date_jugement', type: 'date', required: true },
      { name: 'intime.nom', type: 'string', required: true },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'appel', 'confirmation', 'cour_appel'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 314,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif mesures provisoires JAF',
    content: `PAR CES MOTIFS

PLAISE AU JUGE AUX AFFAIRES FAMILIALES :

DANS L'ATTENTE DU JUGEMENT DE DIVORCE :

{{#if residence_separee}}
- AUTORISER les epoux a resider separement ;
- ATTRIBUER la jouissance du domicile conjugal a {{beneficiaire_domicile}} {{#if titre_gratuit}}a titre gratuit{{else}}moyennant une indemnite d'occupation de {{indemnite_occupation}} EUR par mois{{/if}} ;
{{/if}}

{{#if residence_enfants}}
- FIXER la residence des enfants au domicile de {{parent_residence}} ;
- ACCORDER a {{autre_parent}} un droit de visite et d'hebergement :
{{modalites_dvh}}
{{/if}}

{{#if pension_provisoire}}
- FIXER la contribution a l'entretien et a l'education des enfants a la charge de {{debiteur_pension}} a la somme de {{montant_pension}} EUR par mois et par enfant ;
{{/if}}

{{#if devoir_secours}}
- FIXER la pension au titre du devoir de secours due par {{debiteur_secours}} a {{creancier_secours}} a la somme de {{montant_secours}} EUR par mois ;
{{/if}}

- DIRE que ces mesures prendront effet a compter de {{date_effet}}.`,
    variables: [
      { name: 'residence_separee', type: 'boolean' },
      { name: 'beneficiaire_domicile', type: 'string' },
      { name: 'titre_gratuit', type: 'boolean' },
      { name: 'indemnite_occupation', type: 'number' },
      { name: 'residence_enfants', type: 'boolean' },
      { name: 'parent_residence', type: 'string' },
      { name: 'autre_parent', type: 'string' },
      { name: 'modalites_dvh', type: 'text' },
      { name: 'pension_provisoire', type: 'boolean' },
      { name: 'debiteur_pension', type: 'string' },
      { name: 'montant_pension', type: 'number' },
      { name: 'devoir_secours', type: 'boolean' },
      { name: 'debiteur_secours', type: 'string' },
      { name: 'creancier_secours', type: 'string' },
      { name: 'montant_secours', type: 'number' },
      { name: 'date_effet', type: 'date', required: true },
    ],
    tags: ['dispositif', 'famille', 'mesures_provisoires', 'jaf'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 315,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif contrefacon marque',
    content: `PAR CES MOTIFS

Vu les articles L. 713-2 et suivants du Code de la propriete intellectuelle,

PLAISE AU TRIBUNAL :

- DIRE ET JUGER que {{contrefacteur.nom}} s'est rendu coupable d'actes de contrefacon de la marque "{{marque.nom}}" ;

- INTERDIRE a {{contrefacteur.nom}} de faire usage du signe "{{signe_litigieux}}" sous astreinte de {{astreinte}} EUR par infraction constatee a compter de la signification du jugement ;

- ORDONNER le retrait des circuits commerciaux des produits contrefaisants ;

{{#if destruction}}
- ORDONNER la destruction des produits contrefaisants aux frais de {{contrefacteur.nom}} ;
{{/if}}

- CONDAMNER {{contrefacteur.nom}} a payer a {{titulaire.nom}} la somme de {{dommages}} EUR a titre de dommages et interets ;

{{#if publication}}
- ORDONNER la publication du dispositif du jugement dans {{supports_publication}} aux frais de {{contrefacteur.nom}} dans la limite de {{plafond_publication}} EUR ;
{{/if}}

- CONDAMNER {{contrefacteur.nom}} aux entiers depens ;

- CONDAMNER {{contrefacteur.nom}} a payer a {{titulaire.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du CPC.`,
    variables: [
      { name: 'contrefacteur.nom', type: 'string', required: true },
      { name: 'marque.nom', type: 'string', required: true },
      { name: 'signe_litigieux', type: 'string', required: true },
      { name: 'astreinte', type: 'number', required: true },
      { name: 'destruction', type: 'boolean' },
      { name: 'titulaire.nom', type: 'string', required: true },
      { name: 'dommages', type: 'number', required: true },
      { name: 'publication', type: 'boolean' },
      { name: 'supports_publication', type: 'string' },
      { name: 'plafond_publication', type: 'number' },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'contrefacon', 'marque', 'pi'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 316,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif concurrence deloyale',
    content: `PAR CES MOTIFS

Vu l'article 1240 du Code civil,

PLAISE AU TRIBUNAL :

- DIRE ET JUGER que {{auteur.nom}} s'est rendu coupable d'actes de concurrence deloyale ;

- ORDONNER la cessation des agissements litigieux sous astreinte de {{astreinte}} EUR par jour de retard ;

- CONDAMNER {{auteur.nom}} a payer a {{victime.nom}} :
  * {{dommages_materiels}} EUR au titre du prejudice materiel ;
  {{#if dommages_moraux}}
  * {{dommages_moraux}} EUR au titre du prejudice moral / d'image ;
  {{/if}}

{{#if mesures_reparation}}
- ORDONNER les mesures de reparation en nature suivantes :
{{mesures_reparation}}
{{/if}}

- CONDAMNER {{auteur.nom}} aux entiers depens ;

- CONDAMNER {{auteur.nom}} a payer a {{victime.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du CPC ;

- ORDONNER l'execution provisoire.`,
    variables: [
      { name: 'auteur.nom', type: 'string', required: true },
      { name: 'victime.nom', type: 'string', required: true },
      { name: 'astreinte', type: 'number', required: true },
      { name: 'dommages_materiels', type: 'number', required: true },
      { name: 'dommages_moraux', type: 'number' },
      { name: 'mesures_reparation', type: 'text' },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'concurrence_deloyale', 'commercial'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 317,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif garantie decennale',
    content: `PAR CES MOTIFS

Vu les articles 1792 et suivants du Code civil,

PLAISE AU TRIBUNAL :

- DECLARER {{maitre_ouvrage.nom}} recevable et bien fonde en ses demandes ;

- DIRE ET JUGER que les desordres affectant l'ouvrage engagent la garantie decennale de {{constructeur.nom}} ;

- CONDAMNER {{constructeur.nom}} {{#if in_solidum}}in solidum avec {{autres_condamnes}}{{/if}} a payer a {{maitre_ouvrage.nom}} la somme de {{cout_reparation}} EUR au titre du cout des travaux de reprise ;

{{#if prejudice_jouissance}}
- CONDAMNER {{constructeur.nom}} a payer a {{maitre_ouvrage.nom}} la somme de {{prejudice_jouissance}} EUR au titre du prejudice de jouissance ;
{{/if}}

{{#if appel_garantie}}
- CONDAMNER l'assureur {{assureur.nom}} a garantir {{constructeur.nom}} des condamnations prononcees a son encontre ;
{{/if}}

- CONDAMNER {{constructeur.nom}} aux entiers depens en ce compris les frais d'expertise ;

- CONDAMNER {{constructeur.nom}} a payer a {{maitre_ouvrage.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du CPC.`,
    variables: [
      { name: 'maitre_ouvrage.nom', type: 'string', required: true },
      { name: 'constructeur.nom', type: 'string', required: true },
      { name: 'in_solidum', type: 'boolean' },
      { name: 'autres_condamnes', type: 'string' },
      { name: 'cout_reparation', type: 'number', required: true },
      { name: 'prejudice_jouissance', type: 'number' },
      { name: 'appel_garantie', type: 'boolean' },
      { name: 'assureur.nom', type: 'string' },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'construction', 'garantie_decennale'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 318,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif expertise judiciaire',
    content: `PAR CES MOTIFS

Vu les articles 143 et suivants du Code de procedure civile,

PLAISE AU TRIBUNAL / AU JUGE DES REFERES :

- ORDONNER une expertise judiciaire ;

- DESIGNER pour y proceder {{expert.nom}}, {{expert.qualite}}, avec la mission suivante :
{{mission_expertise}}

- FIXER la provision a valoir sur les honoraires de l'expert a la somme de {{provision}} EUR, a consigner par {{partie_consignataire}} dans le delai de {{delai_consignation}} ;

- DIRE que l'expert deposera son rapport dans le delai de {{delai_rapport}} a compter de la consignation ;

- RESERVER les depens.`,
    variables: [
      { name: 'expert.nom', type: 'string', required: true },
      { name: 'expert.qualite', type: 'string', required: true },
      { name: 'mission_expertise', type: 'text', required: true },
      { name: 'provision', type: 'number', required: true },
      { name: 'partie_consignataire', type: 'string', required: true },
      { name: 'delai_consignation', type: 'string', required: true },
      { name: 'delai_rapport', type: 'string', required: true },
    ],
    tags: ['dispositif', 'expertise', 'judiciaire', 'mesure_instruction'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 319,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Demandes liminaires mise en demeure',
    content: `EN CONSEQUENCE,

Par la presente, nous mettons formellement {{destinataire.nom}} en demeure de :

{{#each demandes}}
- {{this}}
{{/each}}

Et ce, dans un delai de {{delai}} jours a compter de la reception de la presente.

A defaut de reponse satisfaisante dans ce delai, nous n'aurons d'autre choix que de saisir la juridiction competente afin de faire valoir les droits de notre client, et ce sans autre avis.

Dans cette hypothese, {{destinataire.nom}} serait expose(e) a :
- La condamnation au paiement des sommes reclamees
- Le paiement des interets legaux {{#if interets_majores}}majores{{/if}}
- La condamnation aux entiers depens
- La condamnation a une indemnite au titre de l'article 700 du CPC

Nous vous prions de considerer la presente comme valant mise en demeure au sens de l'article 1231 du Code civil.`,
    variables: [
      { name: 'destinataire.nom', type: 'string', required: true },
      { name: 'demandes', type: 'array', required: true },
      { name: 'delai', type: 'number', required: true },
      { name: 'interets_majores', type: 'boolean' },
    ],
    tags: ['dispositif', 'mise_en_demeure', 'demandes'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 320,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif procedure collective',
    content: `PAR CES MOTIFS

Vu les articles L. 622-1 et suivants / L. 631-1 et suivants / L. 640-1 et suivants du Code de commerce,

PLAISE AU TRIBUNAL DE COMMERCE :

{{#if admission_creance}}
- FIXER la creance de {{creancier.nom}} au passif de la procedure collective de {{debiteur.nom}} pour un montant de :
  * {{montant_principal}} EUR a titre {{nature_creance}} ;
  {{#if montant_accessoire}}
  * {{montant_accessoire}} EUR au titre de {{nature_accessoire}} ;
  {{/if}}
{{/if}}

{{#if contestation_creance}}
- REJETER la creance declaree par {{creancier.nom}} pour le motif suivant :
{{motif_rejet}}
{{/if}}

{{#if revendication}}
- ACCUEILLIR la demande de revendication de {{revendiquant.nom}} portant sur {{bien_revendique}} ;
{{/if}}

- CONDAMNER {{partie_adverse.nom}} aux depens.`,
    variables: [
      { name: 'admission_creance', type: 'boolean' },
      { name: 'creancier.nom', type: 'string' },
      { name: 'debiteur.nom', type: 'string' },
      { name: 'montant_principal', type: 'number' },
      { name: 'nature_creance', type: 'string' },
      { name: 'montant_accessoire', type: 'number' },
      { name: 'nature_accessoire', type: 'string' },
      { name: 'contestation_creance', type: 'boolean' },
      { name: 'motif_rejet', type: 'text' },
      { name: 'revendication', type: 'boolean' },
      { name: 'revendiquant.nom', type: 'string' },
      { name: 'bien_revendique', type: 'string' },
      { name: 'partie_adverse.nom', type: 'string', required: true },
    ],
    tags: ['dispositif', 'procedure_collective', 'commercial', 'creance'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 321,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif troubles voisinage',
    content: `PAR CES MOTIFS

Vu la theorie des troubles anormaux de voisinage,

PLAISE AU TRIBUNAL :

- CONSTATER l'existence de troubles anormaux de voisinage ;

- ORDONNER a {{auteur.nom}} de faire cesser les troubles, et notamment :
{{mesures_cessation}}

- ASSORTIR cette injonction d'une astreinte de {{astreinte}} EUR par jour de retard a compter de la signification du jugement ;

- CONDAMNER {{auteur.nom}} a payer a {{victime.nom}} la somme de {{dommages}} EUR a titre de dommages et interets en reparation de son prejudice ;

- CONDAMNER {{auteur.nom}} aux entiers depens ;

- CONDAMNER {{auteur.nom}} a payer a {{victime.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du CPC ;

{{#if execution_provisoire}}
- ORDONNER l'execution provisoire de la presente decision.
{{/if}}`,
    variables: [
      { name: 'auteur.nom', type: 'string', required: true },
      { name: 'mesures_cessation', type: 'text', required: true },
      { name: 'astreinte', type: 'number', required: true },
      { name: 'victime.nom', type: 'string', required: true },
      { name: 'dommages', type: 'number', required: true },
      { name: 'article_700', type: 'number', required: true },
      { name: 'execution_provisoire', type: 'boolean' },
    ],
    tags: ['dispositif', 'voisinage', 'troubles', 'cessation'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 322,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif pension alimentaire',
    content: `PAR CES MOTIFS

Vu les articles 203 et suivants du Code civil,

PLAISE AU JUGE AUX AFFAIRES FAMILIALES :

- CONDAMNER {{debiteur.nom}} a verser a {{creancier.nom}}, pour l'entretien et l'education de {{beneficiaire}}, une pension alimentaire mensuelle de {{montant}} EUR ;

- DIRE que cette pension sera indexee sur l'indice des prix a la consommation et revisee automatiquement chaque annee le 1er janvier ;

- DIRE que cette pension sera due a compter du {{date_effet}} ;

- CONDAMNER {{debiteur.nom}} a verser a {{creancier.nom}} la somme de {{arrieres}} EUR au titre de l'arriere de pension du {{date_debut_arrieres}} au {{date_fin_arrieres}} ;

- RAPPELER que le non-paiement de la pension alimentaire constitue le delit d'abandon de famille puni par l'article 227-3 du Code penal ;

- CONDAMNER {{debiteur.nom}} aux depens.`,
    variables: [
      { name: 'debiteur.nom', type: 'string', required: true },
      { name: 'creancier.nom', type: 'string', required: true },
      { name: 'beneficiaire', type: 'string', required: true },
      { name: 'montant', type: 'number', required: true },
      { name: 'date_effet', type: 'date', required: true },
      { name: 'arrieres', type: 'number' },
      { name: 'date_debut_arrieres', type: 'date' },
      { name: 'date_fin_arrieres', type: 'date' },
    ],
    tags: ['dispositif', 'famille', 'pension_alimentaire', 'jaf'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 323,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif bail commercial indemnite eviction',
    content: `PAR CES MOTIFS

Vu les articles L. 145-14 et suivants du Code de commerce,

PLAISE AU TRIBUNAL :

- DIRE ET JUGER que {{preneur.nom}} a droit a une indemnite d'eviction ;

- FIXER le montant de l'indemnite d'eviction due par {{bailleur.nom}} a {{preneur.nom}} a la somme de {{montant_total}} EUR, se decomposant comme suit :
  * Indemnite principale : {{indemnite_principale}} EUR
  * Frais de deplacement : {{frais_deplacement}} EUR
  * Frais de reinstallation : {{frais_reinstallation}} EUR
  * Trouble commercial : {{trouble_commercial}} EUR
  {{#if autres_indemnites}}
  * Autres : {{autres_indemnites}} EUR
  {{/if}}

- CONDAMNER {{bailleur.nom}} au paiement de cette somme ;

- DIRE que {{preneur.nom}} pourra se maintenir dans les lieux jusqu'au paiement de l'indemnite ;

- CONDAMNER {{bailleur.nom}} aux entiers depens ;

- CONDAMNER {{bailleur.nom}} a payer a {{preneur.nom}} la somme de {{article_700}} EUR au titre de l'article 700 du CPC.`,
    variables: [
      { name: 'preneur.nom', type: 'string', required: true },
      { name: 'bailleur.nom', type: 'string', required: true },
      { name: 'montant_total', type: 'number', required: true },
      { name: 'indemnite_principale', type: 'number', required: true },
      { name: 'frais_deplacement', type: 'number' },
      { name: 'frais_reinstallation', type: 'number' },
      { name: 'trouble_commercial', type: 'number' },
      { name: 'autres_indemnites', type: 'number' },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'bail_commercial', 'indemnite_eviction'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 324,
  },
];

// ============================================
// CLAUSES BLOCKS (20)
// ============================================

const clausesBlocks: BlockSeed[] = [
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de confidentialite',
    content: `ARTICLE {{numero}} - CONFIDENTIALITE

Les Parties s'engagent a conserver confidentielles toutes les informations, documents et donnees de quelque nature que ce soit, communiques ou portes a leur connaissance a l'occasion de l'execution du present contrat.

Cette obligation de confidentialite s'etend a l'ensemble des collaborateurs, sous-traitants et conseils des Parties.

Les Parties s'interdisent de divulguer ces informations a des tiers sans l'accord prealable et ecrit de l'autre Partie, sauf si la divulgation est requise par la loi ou une autorite competente.

Cette obligation de confidentialite restera en vigueur pendant une duree de {{duree_confidentialite}} ans a compter de la fin du present contrat.

En cas de violation de cette obligation, la Partie defaillante sera redevable d'une indemnite forfaitaire de {{montant_penalite}} EUR, sans prejudice de tous dommages et interets complementaires.`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'duree_confidentialite', type: 'number', required: true },
      { name: 'montant_penalite', type: 'number' },
    ],
    tags: ['clause', 'confidentialite', 'contrat'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 400,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de non-concurrence',
    content: `ARTICLE {{numero}} - NON-CONCURRENCE

{{partie_obligee.nom}} s'engage, pendant une duree de {{duree_non_concurrence}} a compter de {{point_depart}}, a ne pas :
- Exercer directement ou indirectement une activite concurrente de celle de {{partie_beneficiaire.nom}}
- S'interesser directement ou indirectement a une entreprise concurrente
- Solliciter, debaucher ou employer les salaries ou collaborateurs de {{partie_beneficiaire.nom}}

Cette interdiction est limitee au territoire suivant : {{territoire}}.

En contrepartie de cette obligation, {{partie_obligee.nom}} percevra une indemnite mensuelle de {{contrepartie}} EUR.

En cas de violation de cette clause, {{partie_obligee.nom}} sera redevable d'une penalite de {{penalite}} EUR par infraction constatee, sans prejudice du droit pour {{partie_beneficiaire.nom}} de demander des dommages et interets complementaires et la cessation du comportement fautif.`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'partie_obligee.nom', type: 'string', required: true },
      { name: 'duree_non_concurrence', type: 'string', required: true },
      { name: 'point_depart', type: 'string', required: true },
      { name: 'partie_beneficiaire.nom', type: 'string', required: true },
      { name: 'territoire', type: 'string', required: true },
      { name: 'contrepartie', type: 'number' },
      { name: 'penalite', type: 'number' },
    ],
    tags: ['clause', 'non_concurrence', 'contrat'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 401,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause penale',
    content: `ARTICLE {{numero}} - CLAUSE PENALE

En cas d'inexecution totale ou partielle de ses obligations par l'une des Parties, celle-ci sera redevable, de plein droit et sans mise en demeure prealable, d'une penalite forfaitaire de {{montant_penalite}} EUR.

Cette penalite est due independamment de tout prejudice effectivement subi par l'autre Partie et sans prejudice du droit pour celle-ci de demander l'execution forcee du contrat et/ou des dommages et interets complementaires.

Conformement a l'article 1231-5 du Code civil, le juge pourra moderer cette penalite s'il l'estime manifestement excessive.`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'montant_penalite', type: 'number', required: true },
    ],
    tags: ['clause', 'penale', 'contrat'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 402,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause resolutoire',
    content: `ARTICLE {{numero}} - CLAUSE RESOLUTOIRE

En cas de manquement par l'une des Parties a l'une quelconque de ses obligations au titre du present contrat, et notamment {{obligations_visees}}, l'autre Partie pourra, apres mise en demeure restee infructueuse pendant un delai de {{delai_mise_en_demeure}} jours, resoudre de plein droit le present contrat.

La resolution prendra effet a l'expiration du delai de mise en demeure.

Cette resolution se fera sans prejudice de tous dommages et interets que la Partie non defaillante pourrait reclamer.`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'obligations_visees', type: 'string', required: true },
      { name: 'delai_mise_en_demeure', type: 'number', required: true },
    ],
    tags: ['clause', 'resolutoire', 'contrat'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 403,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause attributive de competence',
    content: `ARTICLE {{numero}} - COMPETENCE JURIDICTIONNELLE

TOUT LITIGE RELATIF A LA VALIDITE, L'INTERPRETATION, L'EXECUTION OU LA RUPTURE DU PRESENT CONTRAT SERA SOUMIS A LA COMPETENCE EXCLUSIVE DU {{tribunal}} DE {{ville}}, ET CE MEME EN CAS D'APPEL EN GARANTIE OU DE PLURALITE DE DEFENDEURS.

{{#if clause_mediation}}
Prealablement a toute action en justice, les Parties s'engagent a rechercher une solution amiable et, a defaut d'accord, a soumettre leur differend a un mediateur agree.
{{/if}}`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'tribunal', type: 'string', required: true },
      { name: 'ville', type: 'string', required: true },
      { name: 'clause_mediation', type: 'boolean' },
    ],
    tags: ['clause', 'competence', 'juridiction'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 404,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de reserve de propriete',
    content: `ARTICLE {{numero}} - RESERVE DE PROPRIETE

En application de l'article 2367 du Code civil, {{vendeur.nom}} se reserve la propriete des biens vendus jusqu'au paiement integral du prix, en principal et accessoires.

Le transfert des risques s'opere des la livraison des biens.

A defaut de paiement a l'echeance, {{vendeur.nom}} pourra revendiquer les biens vendus, sans prejudice de son droit de resoudre la vente.

L'acheteur s'engage a ne pas revendre, transformer ou incorporer les biens avant paiement integral et a informer {{vendeur.nom}} de toute saisie ou procedure collective.`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'vendeur.nom', type: 'string', required: true },
    ],
    tags: ['clause', 'reserve_propriete', 'vente'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 405,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause limitative de responsabilite',
    content: `ARTICLE {{numero}} - LIMITATION DE RESPONSABILITE

La responsabilite de {{partie.nom}} au titre du present contrat est limitee au montant total des sommes effectivement percues au titre du contrat, et en tout etat de cause plafonnee a {{plafond}} EUR.

{{partie.nom}} ne pourra en aucun cas etre tenue responsable des dommages indirects tels que perte de chiffre d'affaires, perte de clientele, perte de donnees, atteinte a l'image ou prejudice commercial.

Cette limitation ne s'applique pas en cas de dol, faute lourde ou atteinte a l'integrite physique des personnes.`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'partie.nom', type: 'string', required: true },
      { name: 'plafond', type: 'number', required: true },
    ],
    tags: ['clause', 'limitation_responsabilite', 'contrat'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 406,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de force majeure',
    content: `ARTICLE {{numero}} - FORCE MAJEURE

Aucune des Parties ne sera responsable d'un manquement a ses obligations contractuelles si ce manquement resulte d'un evenement de force majeure au sens de l'article 1218 du Code civil.

Sont notamment consideres comme des cas de force majeure : {{exemples_force_majeure}}.

La Partie invoquant la force majeure devra notifier l'autre Partie dans les {{delai_notification}} jours de la survenance de l'evenement.

Si l'empechement est temporaire, l'execution de l'obligation est suspendue. Si l'empechement est definitif ou se prolonge au-dela de {{duree_max}} jours, le contrat pourra etre resilie de plein droit par l'une ou l'autre des Parties.`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'exemples_force_majeure', type: 'text', required: true },
      { name: 'delai_notification', type: 'number', required: true },
      { name: 'duree_max', type: 'number', required: true },
    ],
    tags: ['clause', 'force_majeure', 'contrat'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 407,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de cession',
    content: `ARTICLE {{numero}} - CESSION

Le present contrat est conclu intuitu personae.

{{partie.nom}} ne pourra ceder ou transferer le present contrat, en tout ou partie, sans l'accord prealable et ecrit de {{autre_partie.nom}}.

{{#if exception_cession}}
Par exception, {{partie.nom}} pourra librement ceder le present contrat a une societe de son groupe ou en cas de cession de son fonds de commerce ou d'activite, sous reserve d'en informer {{autre_partie.nom}} dans les {{delai_information}} jours.
{{/if}}

Toute cession effectuee en violation de la presente clause sera nulle et non avenue.`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'partie.nom', type: 'string', required: true },
      { name: 'autre_partie.nom', type: 'string', required: true },
      { name: 'exception_cession', type: 'boolean' },
      { name: 'delai_information', type: 'number' },
    ],
    tags: ['clause', 'cession', 'intuitu_personae'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 408,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de propriete intellectuelle',
    content: `ARTICLE {{numero}} - PROPRIETE INTELLECTUELLE

{{#if cession_droits}}
{{cedant.nom}} cede a {{cessionnaire.nom}}, a titre {{#if exclusif}}exclusif{{else}}non exclusif{{/if}}, l'ensemble des droits de propriete intellectuelle sur {{objet_cession}}, pour le monde entier et pour la duree de protection legale, comprenant notamment :
- Le droit de reproduction sur tout support
- Le droit de representation
- Le droit de modification et d'adaptation
- Le droit de distribution

Cette cession est consentie moyennant le prix de {{prix_cession}} EUR.
{{else}}
Chaque Partie reste proprietaire de ses droits de propriete intellectuelle preexistants.

Les droits de propriete intellectuelle sur les creations realisees dans le cadre du present contrat appartiennent a {{titulaire.nom}}.
{{/if}}`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'cession_droits', type: 'boolean' },
      { name: 'cedant.nom', type: 'string' },
      { name: 'cessionnaire.nom', type: 'string' },
      { name: 'exclusif', type: 'boolean' },
      { name: 'objet_cession', type: 'string' },
      { name: 'prix_cession', type: 'number' },
      { name: 'titulaire.nom', type: 'string' },
    ],
    tags: ['clause', 'propriete_intellectuelle', 'contrat'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 409,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de revision de prix',
    content: `ARTICLE {{numero}} - REVISION DU PRIX

Le prix convenu sera revise automatiquement chaque annee a la date anniversaire du contrat en fonction de la variation de l'indice {{indice_reference}} publie par {{organisme_publication}}.

La formule de revision est la suivante :
P1 = P0 x (I1 / I0)

Ou :
- P0 : prix initial
- P1 : prix revise
- I0 : valeur de l'indice a la date de signature
- I1 : valeur de l'indice a la date de revision

{{#if plafond_revision}}
La variation du prix ne pourra exceder {{plafond_revision}}% par an.
{{/if}}`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'indice_reference', type: 'string', required: true },
      { name: 'organisme_publication', type: 'string', required: true },
      { name: 'plafond_revision', type: 'number' },
    ],
    tags: ['clause', 'indexation', 'prix', 'contrat'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 410,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause RGPD - protection donnees',
    content: `ARTICLE {{numero}} - PROTECTION DES DONNEES PERSONNELLES

Conformement au Reglement (UE) 2016/679 du 27 avril 2016 (RGPD) et a la loi Informatique et Libertes du 6 janvier 1978 modifiee :

1. RESPONSABLE DU TRAITEMENT : {{responsable_traitement}}

2. FINALITES : Les donnees personnelles collectees sont traitees pour {{finalites_traitement}}.

3. BASE LEGALE : {{base_legale}}

4. DESTINATAIRES : {{destinataires}}

5. DUREE DE CONSERVATION : {{duree_conservation}}

6. DROITS DES PERSONNES : Conformement au RGPD, vous disposez d'un droit d'acces, de rectification, d'effacement, de limitation, de portabilite et d'opposition. Ces droits peuvent etre exerces par courrier a {{adresse_exercice_droits}} ou par email a {{email_exercice_droits}}.

7. RECLAMATION : Vous disposez du droit d'introduire une reclamation aupres de la CNIL.`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'responsable_traitement', type: 'string', required: true },
      { name: 'finalites_traitement', type: 'text', required: true },
      { name: 'base_legale', type: 'string', required: true },
      { name: 'destinataires', type: 'text', required: true },
      { name: 'duree_conservation', type: 'string', required: true },
      { name: 'adresse_exercice_droits', type: 'string', required: true },
      { name: 'email_exercice_droits', type: 'string', required: true },
    ],
    tags: ['clause', 'rgpd', 'donnees_personnelles'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 411,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de sous-traitance',
    content: `ARTICLE {{numero}} - SOUS-TRAITANCE

{{#if interdiction}}
Le present contrat etant conclu intuitu personae, {{partie.nom}} ne pourra en aucun cas sous-traiter l'execution de ses obligations sans l'accord prealable et ecrit de {{autre_partie.nom}}.
{{else}}
{{partie.nom}} est autorise(e) a sous-traiter partie de ses obligations, sous reserve :
- D'en informer prealablement {{autre_partie.nom}}
- De faire approuver le sous-traitant par {{autre_partie.nom}}
- De rester seul(e) responsable envers {{autre_partie.nom}} de la bonne execution du contrat
- De faire respecter par le sous-traitant les memes obligations que celles auxquelles il/elle est soumis(e)
{{/if}}`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'interdiction', type: 'boolean' },
      { name: 'partie.nom', type: 'string', required: true },
      { name: 'autre_partie.nom', type: 'string', required: true },
    ],
    tags: ['clause', 'sous_traitance', 'contrat'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 412,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de preavis de rupture',
    content: `ARTICLE {{numero}} - RESILIATION - PREAVIS

Le present contrat est conclu pour une duree {{#if duree_determinee}}determinee de {{duree_contrat}}{{else}}indeterminee{{/if}}.

Chaque Partie pourra mettre fin au contrat moyennant un preavis de {{duree_preavis}} {{#if preavis_mois}}mois{{else}}jours{{/if}}, notifie par lettre recommandee avec accuse de reception.

{{#if indemnite_rupture}}
En cas de rupture a l'initiative de {{partie.nom}}, une indemnite de {{montant_indemnite}} EUR sera due a {{autre_partie.nom}}.
{{/if}}

Pendant la duree du preavis, les Parties continueront a executer leurs obligations respectives.`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'duree_determinee', type: 'boolean' },
      { name: 'duree_contrat', type: 'string' },
      { name: 'duree_preavis', type: 'number', required: true },
      { name: 'preavis_mois', type: 'boolean' },
      { name: 'indemnite_rupture', type: 'boolean' },
      { name: 'partie.nom', type: 'string' },
      { name: 'autre_partie.nom', type: 'string' },
      { name: 'montant_indemnite', type: 'number' },
    ],
    tags: ['clause', 'resiliation', 'preavis', 'rupture'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 413,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de garantie',
    content: `ARTICLE {{numero}} - GARANTIE

{{garantisseur.nom}} garantit {{beneficiaire.nom}} contre tout vice cache, defaut de conformite ou malfacon affectant {{objet_garantie}}.

Cette garantie est consentie pour une duree de {{duree_garantie}} a compter de {{point_depart_garantie}}.

Au titre de cette garantie, {{garantisseur.nom}} s'engage a :
{{#each obligations_garantie}}
- {{this}}
{{/each}}

{{#if exclusions}}
Sont exclus de la presente garantie :
{{exclusions}}
{{/if}}

Pour beneficier de la garantie, {{beneficiaire.nom}} devra notifier le defaut a {{garantisseur.nom}} dans un delai de {{delai_notification}} jours a compter de sa decouverte.`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'garantisseur.nom', type: 'string', required: true },
      { name: 'beneficiaire.nom', type: 'string', required: true },
      { name: 'objet_garantie', type: 'string', required: true },
      { name: 'duree_garantie', type: 'string', required: true },
      { name: 'point_depart_garantie', type: 'string', required: true },
      { name: 'obligations_garantie', type: 'array', required: true },
      { name: 'exclusions', type: 'text' },
      { name: 'delai_notification', type: 'number', required: true },
    ],
    tags: ['clause', 'garantie', 'contrat'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 414,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de mediation prealable',
    content: `ARTICLE {{numero}} - MEDIATION PREALABLE

En cas de differend relatif a l'interpretation, l'execution ou la rupture du present contrat, les Parties conviennent de rechercher une solution amiable avant toute action en justice.

A cet effet, les Parties s'engagent a soumettre leur differend a un mediateur agree dans un delai de {{delai_saisine}} jours a compter de la notification du litige.

{{#if mediateur_designe}}
Le mediateur designe est {{mediateur.nom}}, {{mediateur.adresse}}.
{{else}}
A defaut d'accord sur le choix du mediateur, celui-ci sera designe par {{organisme_designation}}.
{{/if}}

La mediation devra s'achever dans un delai maximum de {{duree_mediation}} mois.

A defaut d'accord a l'issue de la mediation, les Parties seront libres de saisir la juridiction competente.`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'delai_saisine', type: 'number', required: true },
      { name: 'mediateur_designe', type: 'boolean' },
      { name: 'mediateur.nom', type: 'string' },
      { name: 'mediateur.adresse', type: 'string' },
      { name: 'organisme_designation', type: 'string' },
      { name: 'duree_mediation', type: 'number', required: true },
    ],
    tags: ['clause', 'mediation', 'litige', 'amiable'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 415,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de divisibilite',
    content: `ARTICLE {{numero}} - DIVISIBILITE

Si l'une quelconque des clauses du present contrat etait declaree nulle ou inapplicable par une juridiction competente, les autres clauses conserveraient toute leur force et leur portee.

Les Parties s'engagent, dans ce cas, a negocier de bonne foi pour remplacer la clause nulle par une clause valide ayant un effet economique equivalent.`,
    variables: [
      { name: 'numero', type: 'string', required: true },
    ],
    tags: ['clause', 'divisibilite', 'nullite'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 416,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de renonciation',
    content: `ARTICLE {{numero}} - NON-RENONCIATION

Le fait pour l'une des Parties de ne pas exercer ou de tarder a exercer un droit resultant du present contrat ne constituera pas une renonciation a ce droit.

De meme, l'exercice partiel d'un droit n'empechera pas l'exercice ulterieur de ce droit ou de tout autre droit.

Toute renonciation a un droit devra resulter d'une declaration expresse et ecrite.`,
    variables: [
      { name: 'numero', type: 'string', required: true },
    ],
    tags: ['clause', 'renonciation', 'droits'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 417,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de notifications',
    content: `ARTICLE {{numero}} - NOTIFICATIONS

Toute notification ou communication au titre du present contrat devra etre effectuee par ecrit et adressee :

Pour {{partie1.nom}} :
{{partie1.adresse_notification}}
Email : {{partie1.email}}

Pour {{partie2.nom}} :
{{partie2.adresse_notification}}
Email : {{partie2.email}}

Les notifications seront reputees recues :
- En cas d'envoi par lettre recommandee avec AR : a la date de premiere presentation
- En cas d'envoi par email : a la date d'envoi, sous reserve de confirmation de reception
{{#if remise_main_propre}}
- En cas de remise en main propre : a la date de remise contre recepisse
{{/if}}

Toute modification des coordonnees devra etre notifiee a l'autre Partie dans les meilleurs delais.`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'partie1.nom', type: 'string', required: true },
      { name: 'partie1.adresse_notification', type: 'string', required: true },
      { name: 'partie1.email', type: 'string', required: true },
      { name: 'partie2.nom', type: 'string', required: true },
      { name: 'partie2.adresse_notification', type: 'string', required: true },
      { name: 'partie2.email', type: 'string', required: true },
      { name: 'remise_main_propre', type: 'boolean' },
    ],
    tags: ['clause', 'notifications', 'communications'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 418,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de loi applicable',
    content: `ARTICLE {{numero}} - LOI APPLICABLE

Le present contrat est soumis au droit {{loi_applicable}}.

{{#if convention_internationale}}
En cas de litige international, les Parties excluent l'application de la Convention des Nations Unies sur les contrats de vente internationale de marchandises (Convention de Vienne du 11 avril 1980).
{{/if}}

Les Parties font election de domicile a leurs adresses respectives indiquees en tete du present contrat pour toute notification ou signification.`,
    variables: [
      { name: 'numero', type: 'string', required: true },
      { name: 'loi_applicable', type: 'string', required: true },
      { name: 'convention_internationale', type: 'boolean' },
    ],
    tags: ['clause', 'loi_applicable', 'droit_applicable'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 419,
  },
];

// ============================================
// SIGNATURE BLOCKS (10)
// ============================================

const signatureBlocks: BlockSeed[] = [
  {
    category: BlockCategory.SIGNATURE,
    title: 'Signature avocat standard',
    content: `Sous toutes reserves

Fait a {{cabinet.ville}}, le {{date_signature}}

Pour {{client.civilite}} {{client.nom}},
Son Conseil,

Maitre {{avocat.prenom}} {{avocat.nom}}
Avocat au Barreau de {{avocat.barreau}}
{{#if avocat.toque}}Toque n° {{avocat.toque}}{{/if}}`,
    variables: [
      { name: 'cabinet.ville', type: 'string', required: true },
      { name: 'date_signature', type: 'date', required: true },
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'avocat.prenom', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'avocat.toque', type: 'string' },
    ],
    tags: ['signature', 'avocat', 'standard'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 500,
  },
  {
    category: BlockCategory.SIGNATURE,
    title: 'Bordereau de pieces',
    content: `BORDEREAU DE COMMUNICATION DE PIECES

Affaire : {{affaire.intitule}}
N° RG : {{affaire.numero_rg}}

{{#each pieces}}
Piece n° {{this.numero}} : {{this.intitule}}
{{/each}}

Soit {{nombre_pieces}} piece(s) au total.

Dont il est certifie que copie a ete communiquee a {{#if adversaire.avocat}}Maitre {{adversaire.avocat}}, conseil de {{adversaire.nom}}{{else}}{{adversaire.nom}}{{/if}} par {{mode_communication}} le {{date_communication}}.

Fait a {{cabinet.ville}}, le {{date_signature}}

Maitre {{avocat.nom}}`,
    variables: [
      { name: 'affaire.intitule', type: 'string', required: true },
      { name: 'affaire.numero_rg', type: 'string' },
      { name: 'pieces', type: 'array', required: true },
      { name: 'nombre_pieces', type: 'number', required: true },
      { name: 'adversaire.avocat', type: 'string' },
      { name: 'adversaire.nom', type: 'string', required: true },
      { name: 'mode_communication', type: 'string', required: true },
      { name: 'date_communication', type: 'date', required: true },
      { name: 'cabinet.ville', type: 'string', required: true },
      { name: 'date_signature', type: 'date', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
    ],
    tags: ['signature', 'bordereau', 'pieces', 'communication'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 501,
  },
  {
    category: BlockCategory.SIGNATURE,
    title: 'Formule de politesse courrier client',
    content: `Je reste naturellement a votre entiere disposition pour tout renseignement complementaire.

Je vous prie d'agreer, {{client.civilite}}, l'expression de mes salutations distinguees.

{{avocat.prenom}} {{avocat.nom}}
Avocat au Barreau de {{avocat.barreau}}`,
    variables: [
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'avocat.prenom', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
    ],
    tags: ['signature', 'courrier', 'client', 'politesse'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 502,
  },
  {
    category: BlockCategory.SIGNATURE,
    title: 'Formule de politesse courrier confrere',
    content: `Je vous prie d'agreer, Cher Confrere, l'expression de mes sentiments distingues.

{{avocat.prenom}} {{avocat.nom}}
Avocat au Barreau de {{avocat.barreau}}`,
    variables: [
      { name: 'avocat.prenom', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
    ],
    tags: ['signature', 'courrier', 'confrere', 'politesse'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 503,
  },
  {
    category: BlockCategory.SIGNATURE,
    title: 'Signature contrat deux parties',
    content: `Fait en deux exemplaires originaux a {{lieu}}, le {{date_signature}}.

Pour {{partie1.nom}}                          Pour {{partie2.nom}}
{{#if partie1.representant}}                  {{#if partie2.representant}}
{{partie1.representant}}                      {{partie2.representant}}
{{partie1.qualite_representant}}              {{partie2.qualite_representant}}
{{/if}}                                       {{/if}}


_________________________                     _________________________
(Signature precedee de la mention             (Signature precedee de la mention
"Lu et approuve")                             "Lu et approuve")`,
    variables: [
      { name: 'lieu', type: 'string', required: true },
      { name: 'date_signature', type: 'date', required: true },
      { name: 'partie1.nom', type: 'string', required: true },
      { name: 'partie1.representant', type: 'string' },
      { name: 'partie1.qualite_representant', type: 'string' },
      { name: 'partie2.nom', type: 'string', required: true },
      { name: 'partie2.representant', type: 'string' },
      { name: 'partie2.qualite_representant', type: 'string' },
    ],
    tags: ['signature', 'contrat', 'deux_parties'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 504,
  },
  {
    category: BlockCategory.SIGNATURE,
    title: 'Paraphe et signature acte',
    content: `Le present acte comprend {{nombre_pages}} pages, paraphees par les parties et signees a la derniere page.

Fait a {{lieu}}, le {{date_signature}}

{{#each signataires}}
{{this.nom}}
{{#if this.qualite}}({{this.qualite}}){{/if}}

Signature :


{{/each}}`,
    variables: [
      { name: 'nombre_pages', type: 'number', required: true },
      { name: 'lieu', type: 'string', required: true },
      { name: 'date_signature', type: 'date', required: true },
      { name: 'signataires', type: 'array', required: true },
    ],
    tags: ['signature', 'acte', 'paraphe'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 505,
  },
  {
    category: BlockCategory.SIGNATURE,
    title: 'Formule de politesse formelle',
    content: `Dans l'attente de votre reponse, je vous prie d'agreer, {{destinataire.civilite}}, l'expression de ma consideration distinguee.

{{expediteur.prenom}} {{expediteur.nom}}
{{expediteur.fonction}}`,
    variables: [
      { name: 'destinataire.civilite', type: 'string', required: true },
      { name: 'expediteur.prenom', type: 'string', required: true },
      { name: 'expediteur.nom', type: 'string', required: true },
      { name: 'expediteur.fonction', type: 'string' },
    ],
    tags: ['signature', 'politesse', 'formelle'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 506,
  },
  {
    category: BlockCategory.SIGNATURE,
    title: 'Signature protocole transactionnel',
    content: `EN FOI DE QUOI, les Parties ont signe le present protocole en {{nombre_exemplaires}} exemplaires originaux.

Fait a {{lieu}}, le {{date_signature}}

Pour {{partie1.denomination}} :                Pour {{partie2.denomination}} :
{{partie1.representant}}                       {{partie2.representant}}
{{partie1.qualite}}                            {{partie2.qualite}}


_________________________                      _________________________
(Signature precedee de la mention              (Signature precedee de la mention
"Bon pour transaction")                        "Bon pour transaction")`,
    variables: [
      { name: 'nombre_exemplaires', type: 'number', required: true },
      { name: 'lieu', type: 'string', required: true },
      { name: 'date_signature', type: 'date', required: true },
      { name: 'partie1.denomination', type: 'string', required: true },
      { name: 'partie1.representant', type: 'string', required: true },
      { name: 'partie1.qualite', type: 'string' },
      { name: 'partie2.denomination', type: 'string', required: true },
      { name: 'partie2.representant', type: 'string', required: true },
      { name: 'partie2.qualite', type: 'string' },
    ],
    tags: ['signature', 'protocole', 'transaction'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 507,
  },
  {
    category: BlockCategory.SIGNATURE,
    title: 'Attestation sur honneur',
    content: `Je soussigne(e), {{declarant.civilite}} {{declarant.prenom}} {{declarant.nom}}, ne(e) le {{declarant.date_naissance}} a {{declarant.lieu_naissance}}, demeurant {{declarant.adresse}}, {{declarant.codePostal}} {{declarant.ville}},

Atteste sur l'honneur :

{{contenu_attestation}}

Fait pour servir et valoir ce que de droit.

Fait a {{lieu}}, le {{date_signature}}

Signature :


_________________________
{{declarant.prenom}} {{declarant.nom}}

(Joindre copie d'une piece d'identite en cours de validite)`,
    variables: [
      { name: 'declarant.civilite', type: 'string', required: true },
      { name: 'declarant.prenom', type: 'string', required: true },
      { name: 'declarant.nom', type: 'string', required: true },
      { name: 'declarant.date_naissance', type: 'date' },
      { name: 'declarant.lieu_naissance', type: 'string' },
      { name: 'declarant.adresse', type: 'string', required: true },
      { name: 'declarant.codePostal', type: 'string', required: true },
      { name: 'declarant.ville', type: 'string', required: true },
      { name: 'contenu_attestation', type: 'text', required: true },
      { name: 'lieu', type: 'string', required: true },
      { name: 'date_signature', type: 'date', required: true },
    ],
    tags: ['signature', 'attestation', 'honneur'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 508,
  },
  {
    category: BlockCategory.SIGNATURE,
    title: 'Certifie conforme',
    content: `Certifie conforme a l'original

Fait a {{lieu}}, le {{date}}

{{avocat.prenom}} {{avocat.nom}}
Avocat au Barreau de {{avocat.barreau}}

(Signature et cachet)`,
    variables: [
      { name: 'lieu', type: 'string', required: true },
      { name: 'date', type: 'date', required: true },
      { name: 'avocat.prenom', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
    ],
    tags: ['signature', 'certifie_conforme', 'copie'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 509,
  },
];

// ============================================
// MENTIONS LEGALES BLOCKS (10)
// ============================================

const mentionsLegalesBlocks: BlockSeed[] = [
  {
    category: BlockCategory.MENTION_LEGALE,
    title: 'Mentions legales cabinet avocat',
    content: `CABINET {{cabinet.nom}}
Avocats au Barreau de {{cabinet.barreau}}

{{cabinet.adresse}}
{{cabinet.codePostal}} {{cabinet.ville}}
Tel : {{cabinet.telephone}}
Email : {{cabinet.email}}

{{#if cabinet.site_web}}
Site web : {{cabinet.site_web}}
{{/if}}

SIRET : {{cabinet.siret}}
TVA intracommunautaire : {{cabinet.tva}}

Avocat(s) associe(s) :
{{#each avocats}}
- Maitre {{this.prenom}} {{this.nom}}, Toque n°{{this.toque}}
{{/each}}`,
    variables: [
      { name: 'cabinet.nom', type: 'string', required: true },
      { name: 'cabinet.barreau', type: 'string', required: true },
      { name: 'cabinet.adresse', type: 'string', required: true },
      { name: 'cabinet.codePostal', type: 'string', required: true },
      { name: 'cabinet.ville', type: 'string', required: true },
      { name: 'cabinet.telephone', type: 'string', required: true },
      { name: 'cabinet.email', type: 'string', required: true },
      { name: 'cabinet.site_web', type: 'string' },
      { name: 'cabinet.siret', type: 'string', required: true },
      { name: 'cabinet.tva', type: 'string' },
      { name: 'avocats', type: 'array' },
    ],
    tags: ['mentions_legales', 'cabinet', 'avocat'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 600,
  },
  {
    category: BlockCategory.MENTION_LEGALE,
    title: 'Avertissement confidentialite email',
    content: `---
AVERTISSEMENT : Ce message et ses pieces jointes sont confidentiels et destines exclusivement a la personne ou a l'entite a laquelle il est adresse. Toute utilisation, diffusion, copie ou divulgation de ce message par une personne autre que son destinataire est strictement interdite. Si vous avez recu ce message par erreur, merci de le detruire et d'en informer immediatement l'expediteur. Ce message ne constitue pas un avis juridique et ne saurait engager la responsabilite de son auteur.

Ce message est couvert par le secret professionnel conformement a l'article 66-5 de la loi du 31 decembre 1971.`,
    variables: [],
    tags: ['mentions_legales', 'confidentialite', 'email'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 601,
  },
  {
    category: BlockCategory.MENTION_LEGALE,
    title: 'Mention RPVA',
    content: `Document transmis par voie electronique via le RPVA (Reseau Prive Virtuel Avocat)

Date et heure d'envoi : {{date_envoi}} a {{heure_envoi}}
Expediteur : Maitre {{avocat.nom}}, Avocat au Barreau de {{avocat.barreau}}
Destinataire : {{destinataire}}

Ce document fait foi conformement aux dispositions de l'article 748-1 du Code de procedure civile.`,
    variables: [
      { name: 'date_envoi', type: 'date', required: true },
      { name: 'heure_envoi', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'destinataire', type: 'string', required: true },
    ],
    tags: ['mentions_legales', 'rpva', 'electronique'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 602,
  },
  {
    category: BlockCategory.MENTION_LEGALE,
    title: 'Mention convention honoraires',
    content: `Conformement aux dispositions de l'article 10 de la loi n° 71-1130 du 31 decembre 1971 et du decret n° 2005-790 du 12 juillet 2005, une convention d'honoraires a ete etablie.

Mode de facturation : {{mode_facturation}}
{{#if honoraire_forfait}}Honoraires forfaitaires : {{honoraire_forfait}} EUR HT{{/if}}
{{#if honoraire_horaire}}Taux horaire : {{honoraire_horaire}} EUR HT{{/if}}
{{#if honoraire_resultat}}Honoraire de resultat : {{honoraire_resultat}}% des sommes obtenues{{/if}}

TVA applicable : 20%

Les honoraires sont payables {{conditions_paiement}}.`,
    variables: [
      { name: 'mode_facturation', type: 'string', required: true },
      { name: 'honoraire_forfait', type: 'number' },
      { name: 'honoraire_horaire', type: 'number' },
      { name: 'honoraire_resultat', type: 'number' },
      { name: 'conditions_paiement', type: 'string', required: true },
    ],
    tags: ['mentions_legales', 'honoraires', 'convention'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 603,
  },
  {
    category: BlockCategory.MENTION_LEGALE,
    title: 'Mention aide juridictionnelle',
    content: `{{#if aj_totale}}
Le present dossier est traite dans le cadre de l'aide juridictionnelle totale, decision n°{{aj_numero}} du {{aj_date}}.

Maitre {{avocat.nom}} a ete designe(e) pour assister {{beneficiaire.nom}}.
{{else}}
Le present dossier est traite dans le cadre de l'aide juridictionnelle partielle ({{aj_pourcentage}}%), decision n°{{aj_numero}} du {{aj_date}}.

Contribution du client : {{aj_contribution}} EUR
{{/if}}

Bureau d'aide juridictionnelle de {{baj_ville}}`,
    variables: [
      { name: 'aj_totale', type: 'boolean' },
      { name: 'aj_numero', type: 'string', required: true },
      { name: 'aj_date', type: 'date', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'beneficiaire.nom', type: 'string', required: true },
      { name: 'aj_pourcentage', type: 'number' },
      { name: 'aj_contribution', type: 'number' },
      { name: 'baj_ville', type: 'string', required: true },
    ],
    tags: ['mentions_legales', 'aide_juridictionnelle', 'aj'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 604,
  },
  {
    category: BlockCategory.MENTION_LEGALE,
    title: 'Information mediation consommation',
    content: `INFORMATION SUR LA MEDIATION DE LA CONSOMMATION

Conformement aux articles L. 616-1 et R. 616-1 du Code de la consommation, notre cabinet a mis en place un dispositif de mediation de la consommation.

En cas de litige, vous pouvez deposer votre reclamation aupres de :

Mediateur de la Consommation de la Profession d'Avocat
{{mediateur_adresse}}

Site web : {{mediateur_site}}

Ce recours gratuit ne peut etre exerce qu'apres avoir adresse une reclamation ecrite prealable au cabinet.`,
    variables: [
      { name: 'mediateur_adresse', type: 'string', required: true },
      { name: 'mediateur_site', type: 'string' },
    ],
    tags: ['mentions_legales', 'mediation', 'consommation'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 605,
  },
  {
    category: BlockCategory.MENTION_LEGALE,
    title: 'Mention assurance professionnelle',
    content: `Le cabinet {{cabinet.nom}} est assure pour la responsabilite civile professionnelle aupres de {{assureur.nom}}, contrat n°{{assurance_numero}}, pour un montant de garantie de {{assurance_montant}} EUR par sinistre.

Adresse de l'assureur :
{{assureur.adresse}}
{{assureur.codePostal}} {{assureur.ville}}`,
    variables: [
      { name: 'cabinet.nom', type: 'string', required: true },
      { name: 'assureur.nom', type: 'string', required: true },
      { name: 'assurance_numero', type: 'string', required: true },
      { name: 'assurance_montant', type: 'number', required: true },
      { name: 'assureur.adresse', type: 'string', required: true },
      { name: 'assureur.codePostal', type: 'string', required: true },
      { name: 'assureur.ville', type: 'string', required: true },
    ],
    tags: ['mentions_legales', 'assurance', 'rcp'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 606,
  },
  {
    category: BlockCategory.MENTION_LEGALE,
    title: 'Mention CARPA',
    content: `Les fonds transitant par le cabinet sont deposes sur le compte CARPA (Caisse des Reglements Pecuniaires des Avocats) du Barreau de {{barreau}}.

CARPA du Barreau de {{barreau}}
{{carpa_adresse}}
{{carpa_codePostal}} {{carpa_ville}}

Les fonds detenus pour le compte des clients beneficient de la garantie de la CARPA.`,
    variables: [
      { name: 'barreau', type: 'string', required: true },
      { name: 'carpa_adresse', type: 'string', required: true },
      { name: 'carpa_codePostal', type: 'string', required: true },
      { name: 'carpa_ville', type: 'string', required: true },
    ],
    tags: ['mentions_legales', 'carpa', 'fonds'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 607,
  },
  {
    category: BlockCategory.MENTION_LEGALE,
    title: 'Mention delais voies recours',
    content: `DELAIS ET VOIES DE RECOURS

{{#if jugement}}
Le present jugement peut faire l'objet d'un appel dans le delai d'UN MOIS a compter de sa signification, aupres de la Cour d'appel de {{cour_appel}}.
{{/if}}

{{#if ordonnance_refere}}
La presente ordonnance de refere peut faire l'objet d'un appel dans le delai de QUINZE JOURS a compter de sa signification.
{{/if}}

{{#if injonction_payer}}
La presente ordonnance portant injonction de payer peut faire l'objet d'une opposition dans le delai d'UN MOIS a compter de sa signification.
{{/if}}

L'exercice d'une voie de recours ordinaire suspend l'execution de la decision, sauf execution provisoire.`,
    variables: [
      { name: 'jugement', type: 'boolean' },
      { name: 'ordonnance_refere', type: 'boolean' },
      { name: 'injonction_payer', type: 'boolean' },
      { name: 'cour_appel', type: 'string' },
    ],
    tags: ['mentions_legales', 'recours', 'delais'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 608,
  },
  {
    category: BlockCategory.MENTION_LEGALE,
    title: 'Pied de page conclusions',
    content: `---
N° RG : {{affaire.numero_rg}}
{{affaire.intitule}}
Conclusions {{type_conclusions}} pour {{client.nom}}
Page {{numero_page}} / {{total_pages}}

Maitre {{avocat.nom}} - Avocat au Barreau de {{avocat.barreau}}{{#if avocat.toque}} - Toque {{avocat.toque}}{{/if}}
{{cabinet.adresse}} - {{cabinet.codePostal}} {{cabinet.ville}}
Tel : {{cabinet.telephone}} - Email : {{cabinet.email}}`,
    variables: [
      { name: 'affaire.numero_rg', type: 'string' },
      { name: 'affaire.intitule', type: 'string', required: true },
      { name: 'type_conclusions', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'numero_page', type: 'number' },
      { name: 'total_pages', type: 'number' },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'avocat.toque', type: 'string' },
      { name: 'cabinet.adresse', type: 'string', required: true },
      { name: 'cabinet.codePostal', type: 'string', required: true },
      { name: 'cabinet.ville', type: 'string', required: true },
      { name: 'cabinet.telephone', type: 'string' },
      { name: 'cabinet.email', type: 'string' },
    ],
    tags: ['mentions_legales', 'pied_page', 'conclusions'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 609,
  },
];

// Combine all blocks
const allBlocks = [
  ...introBlocks,
  ...faitsBlocks,
  ...moyensBlocks,
  ...dispositifBlocks,
  ...clausesBlocks,
  ...signatureBlocks,
  ...mentionsLegalesBlocks,
];

// ============================================
// SYSTEM TEMPLATES (30 templates)
// ============================================

const systemTemplates: TemplateSeed[] = [
  // PROCEDURE CIVILE (10)
  {
    name: 'Assignation au fond Tribunal Judiciaire',
    documentType: BuilderDocumentType.ASSIGNATION_FOND,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blocksStructure: [
      { blockTitle: 'Introduction assignation Tribunal Judiciaire', order: 1, isOptional: false },
      { blockTitle: 'Expose creance impayee', order: 2, isOptional: true },
      { blockTitle: 'Force obligatoire des contrats (art. 1103)', order: 3, isOptional: true },
      { blockTitle: 'Inexecution contractuelle (art. 1217)', order: 4, isOptional: true },
      { blockTitle: 'Condamnation au paiement de somme', order: 5, isOptional: false },
      { blockTitle: 'Bordereau de pieces', order: 6, isOptional: true },
      { blockTitle: 'Signature avocat standard', order: 7, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: true, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Assignation en refere provision',
    documentType: BuilderDocumentType.ASSIGNATION_REFERE,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blocksStructure: [
      { blockTitle: 'Introduction assignation en refere', order: 1, isOptional: false },
      { blockTitle: 'Expose creance impayee', order: 2, isOptional: false },
      { blockTitle: 'Provision refere (art. 835 CPC)', order: 3, isOptional: false },
      { blockTitle: 'Dispositif refere provision', order: 4, isOptional: false },
      { blockTitle: 'Bordereau de pieces', order: 5, isOptional: true },
      { blockTitle: 'Signature avocat standard', order: 6, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: true, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Conclusions recapitulatives fond',
    documentType: BuilderDocumentType.CONCLUSIONS_RECAPITULATIVES,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blocksStructure: [
      { blockTitle: 'En-tete conclusions recapitulatives', order: 1, isOptional: false },
      { blockTitle: 'Chronologie rupture contrat commercial', order: 2, isOptional: true },
      { blockTitle: 'Force obligatoire des contrats (art. 1103)', order: 3, isOptional: true },
      { blockTitle: 'Inexecution contractuelle (art. 1217)', order: 4, isOptional: true },
      { blockTitle: 'Condamnation au paiement de somme', order: 5, isOptional: false },
      { blockTitle: 'Bordereau de pieces', order: 6, isOptional: false },
      { blockTitle: 'Signature avocat standard', order: 7, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: true, positionMentions: 'SIGNATURE' },
    isSystemTemplate: true,
  },
  {
    name: 'Conclusions en defense',
    documentType: BuilderDocumentType.CONCLUSIONS_RECAPITULATIVES,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blocksStructure: [
      { blockTitle: 'En-tete conclusions en reponse', order: 1, isOptional: false },
      { blockTitle: 'Moyens de defense generiques', order: 2, isOptional: false },
      { blockTitle: 'Dispositif conclusions en defense', order: 3, isOptional: false },
      { blockTitle: 'Bordereau de pieces', order: 4, isOptional: true },
      { blockTitle: 'Signature avocat standard', order: 5, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: true, positionMentions: 'SIGNATURE' },
    isSystemTemplate: true,
  },
  {
    name: 'Assignation expulsion locataire',
    documentType: BuilderDocumentType.ASSIGNATION_FOND,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blocksStructure: [
      { blockTitle: 'Introduction assignation Tribunal Judiciaire', order: 1, isOptional: false },
      { blockTitle: 'Expose litige locatif impayes', order: 2, isOptional: false },
      { blockTitle: 'Clause resolutoire bail (art. 24 loi 1989)', order: 3, isOptional: false },
      { blockTitle: 'Dispositif expulsion locataire', order: 4, isOptional: false },
      { blockTitle: 'Bordereau de pieces', order: 5, isOptional: true },
      { blockTitle: 'Signature avocat standard', order: 6, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: true, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Requete injonction de payer',
    documentType: BuilderDocumentType.ASSIGNATION_FOND,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blocksStructure: [
      { blockTitle: 'En-tete requete injonction de payer', order: 1, isOptional: false },
      { blockTitle: 'Expose creance impayee', order: 2, isOptional: false },
      { blockTitle: 'Dispositif injonction de payer', order: 3, isOptional: false },
      { blockTitle: 'Bordereau de pieces', order: 4, isOptional: false },
      { blockTitle: 'Signature avocat standard', order: 5, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: false, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Declaration appel',
    documentType: BuilderDocumentType.CONCLUSIONS_RECAPITULATIVES,
    juridiction: Juridiction.COUR_APPEL,
    blocksStructure: [
      { blockTitle: 'En-tete declaration appel', order: 1, isOptional: false },
      { blockTitle: 'Signature avocat standard', order: 2, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: true, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Conclusions appelant',
    documentType: BuilderDocumentType.CONCLUSIONS_RECAPITULATIVES,
    juridiction: Juridiction.COUR_APPEL,
    blocksStructure: [
      { blockTitle: 'En-tete conclusions appel', order: 1, isOptional: false },
      { blockTitle: 'Rappel procedure anterieure', order: 2, isOptional: false },
      { blockTitle: 'Force obligatoire des contrats (art. 1103)', order: 3, isOptional: true },
      { blockTitle: 'Dispositif appel - infirmation', order: 4, isOptional: false },
      { blockTitle: 'Bordereau de pieces', order: 5, isOptional: true },
      { blockTitle: 'Signature avocat standard', order: 6, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: true, positionMentions: 'SIGNATURE' },
    isSystemTemplate: true,
  },
  {
    name: 'Requete expertise judiciaire',
    documentType: BuilderDocumentType.ASSIGNATION_REFERE,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blocksStructure: [
      { blockTitle: 'Introduction assignation en refere', order: 1, isOptional: false },
      { blockTitle: 'Expose malfacons construction', order: 2, isOptional: true },
      { blockTitle: 'Dispositif expertise judiciaire', order: 3, isOptional: false },
      { blockTitle: 'Bordereau de pieces', order: 4, isOptional: true },
      { blockTitle: 'Signature avocat standard', order: 5, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: true, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Conclusions vices caches immobilier',
    documentType: BuilderDocumentType.CONCLUSIONS_RECAPITULATIVES,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blocksStructure: [
      { blockTitle: 'En-tete conclusions recapitulatives', order: 1, isOptional: false },
      { blockTitle: 'Expose vices caches immobilier', order: 2, isOptional: false },
      { blockTitle: 'Garantie des vices caches (art. 1641)', order: 3, isOptional: false },
      { blockTitle: 'Dispositif garantie vices caches', order: 4, isOptional: false },
      { blockTitle: 'Bordereau de pieces', order: 5, isOptional: false },
      { blockTitle: 'Signature avocat standard', order: 6, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: true, positionMentions: 'SIGNATURE' },
    isSystemTemplate: true,
  },

  // PROCEDURE COMMERCIALE (5)
  {
    name: 'Assignation Tribunal de Commerce',
    documentType: BuilderDocumentType.ASSIGNATION_FOND,
    juridiction: Juridiction.TRIBUNAL_COMMERCE,
    blocksStructure: [
      { blockTitle: 'Introduction assignation Tribunal de Commerce', order: 1, isOptional: false },
      { blockTitle: 'Expose creance impayee', order: 2, isOptional: false },
      { blockTitle: 'Force obligatoire des contrats (art. 1103)', order: 3, isOptional: true },
      { blockTitle: 'Condamnation au paiement de somme', order: 4, isOptional: false },
      { blockTitle: 'Bordereau de pieces', order: 5, isOptional: true },
      { blockTitle: 'Signature avocat standard', order: 6, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: false, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Conclusions rupture brutale relations commerciales',
    documentType: BuilderDocumentType.CONCLUSIONS_RECAPITULATIVES,
    juridiction: Juridiction.TRIBUNAL_COMMERCE,
    blocksStructure: [
      { blockTitle: 'En-tete conclusions recapitulatives', order: 1, isOptional: false },
      { blockTitle: 'Expose rupture brutale relations commerciales', order: 2, isOptional: false },
      { blockTitle: 'Rupture brutale relations commerciales (L442-1)', order: 3, isOptional: false },
      { blockTitle: 'Condamnation au paiement de somme', order: 4, isOptional: false },
      { blockTitle: 'Bordereau de pieces', order: 5, isOptional: false },
      { blockTitle: 'Signature avocat standard', order: 6, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: false, positionMentions: 'SIGNATURE' },
    isSystemTemplate: true,
  },
  {
    name: 'Conclusions concurrence deloyale',
    documentType: BuilderDocumentType.CONCLUSIONS_RECAPITULATIVES,
    juridiction: Juridiction.TRIBUNAL_COMMERCE,
    blocksStructure: [
      { blockTitle: 'En-tete conclusions recapitulatives', order: 1, isOptional: false },
      { blockTitle: 'Expose concurrence deloyale', order: 2, isOptional: false },
      { blockTitle: 'Concurrence deloyale (action fondee sur 1240)', order: 3, isOptional: false },
      { blockTitle: 'Dispositif concurrence deloyale', order: 4, isOptional: false },
      { blockTitle: 'Bordereau de pieces', order: 5, isOptional: false },
      { blockTitle: 'Signature avocat standard', order: 6, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: false, positionMentions: 'SIGNATURE' },
    isSystemTemplate: true,
  },
  {
    name: 'Conclusions bail commercial - indemnite eviction',
    documentType: BuilderDocumentType.CONCLUSIONS_RECAPITULATIVES,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blocksStructure: [
      { blockTitle: 'En-tete conclusions recapitulatives', order: 1, isOptional: false },
      { blockTitle: 'Expose bail commercial renouvellement', order: 2, isOptional: false },
      { blockTitle: 'Indemnite eviction bail commercial', order: 3, isOptional: false },
      { blockTitle: 'Dispositif bail commercial indemnite eviction', order: 4, isOptional: false },
      { blockTitle: 'Bordereau de pieces', order: 5, isOptional: false },
      { blockTitle: 'Signature avocat standard', order: 6, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: true, positionMentions: 'SIGNATURE' },
    isSystemTemplate: true,
  },
  {
    name: 'Conclusions contrefacon marque',
    documentType: BuilderDocumentType.CONCLUSIONS_RECAPITULATIVES,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blocksStructure: [
      { blockTitle: 'En-tete conclusions recapitulatives', order: 1, isOptional: false },
      { blockTitle: 'Expose contrefacon marque', order: 2, isOptional: false },
      { blockTitle: 'Contrefacon de marque (art. L713-2)', order: 3, isOptional: false },
      { blockTitle: 'Dispositif contrefacon marque', order: 4, isOptional: false },
      { blockTitle: 'Bordereau de pieces', order: 5, isOptional: false },
      { blockTitle: 'Signature avocat standard', order: 6, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: true, positionMentions: 'SIGNATURE' },
    isSystemTemplate: true,
  },

  // CORRESPONDANCE (10)
  {
    name: 'Mise en demeure paiement',
    documentType: BuilderDocumentType.MISE_EN_DEMEURE,
    juridiction: null,
    blocksStructure: [
      { blockTitle: 'En-tete mise en demeure', order: 1, isOptional: false },
      { blockTitle: 'Expose creance impayee', order: 2, isOptional: false },
      { blockTitle: 'Demandes liminaires mise en demeure', order: 3, isOptional: false },
      { blockTitle: 'Formule de politesse formelle', order: 4, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: false, lrar: true, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: false, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Convocation client audience',
    documentType: BuilderDocumentType.CONVOCATION_AUDIENCE,
    juridiction: null,
    blocksStructure: [
      { blockTitle: 'Convocation client audience', order: 1, isOptional: false },
      { blockTitle: 'Formule de politesse courrier client', order: 2, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: false, lrar: true, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: false, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Courrier information decision client',
    documentType: BuilderDocumentType.LETTRE_RECLAMATION,
    juridiction: null,
    blocksStructure: [
      { blockTitle: 'Courrier information client decision', order: 1, isOptional: false },
      { blockTitle: 'Formule de politesse courrier client', order: 2, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: false, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Transmission pieces confrere',
    documentType: BuilderDocumentType.LETTRE_RECLAMATION,
    juridiction: null,
    blocksStructure: [
      { blockTitle: 'Courrier transmission pieces adversaire', order: 1, isOptional: false },
      { blockTitle: 'Formule de politesse courrier confrere', order: 2, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: false, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Note juridique',
    documentType: BuilderDocumentType.LETTRE_RECLAMATION,
    juridiction: null,
    blocksStructure: [
      { blockTitle: 'En-tete note juridique', order: 1, isOptional: false },
      { blockTitle: 'Signature avocat standard', order: 2, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: false, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Mise en demeure troubles voisinage',
    documentType: BuilderDocumentType.MISE_EN_DEMEURE,
    juridiction: null,
    blocksStructure: [
      { blockTitle: 'En-tete mise en demeure', order: 1, isOptional: false },
      { blockTitle: 'Expose troubles voisinage', order: 2, isOptional: false },
      { blockTitle: 'Demandes liminaires mise en demeure', order: 3, isOptional: false },
      { blockTitle: 'Formule de politesse formelle', order: 4, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: false, lrar: true, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: false, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Mise en demeure malfacons',
    documentType: BuilderDocumentType.MISE_EN_DEMEURE,
    juridiction: null,
    blocksStructure: [
      { blockTitle: 'En-tete mise en demeure', order: 1, isOptional: false },
      { blockTitle: 'Expose malfacons construction', order: 2, isOptional: false },
      { blockTitle: 'Demandes liminaires mise en demeure', order: 3, isOptional: false },
      { blockTitle: 'Formule de politesse formelle', order: 4, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: false, lrar: true, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: false, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Mise en demeure execution contrat',
    documentType: BuilderDocumentType.MISE_EN_DEMEURE,
    juridiction: null,
    blocksStructure: [
      { blockTitle: 'En-tete mise en demeure', order: 1, isOptional: false },
      { blockTitle: 'Chronologie rupture contrat commercial', order: 2, isOptional: false },
      { blockTitle: 'Demandes liminaires mise en demeure', order: 3, isOptional: false },
      { blockTitle: 'Formule de politesse formelle', order: 4, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: false, lrar: true, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: false, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Attestation sur honneur',
    documentType: BuilderDocumentType.LETTRE_RECLAMATION,
    juridiction: null,
    blocksStructure: [
      { blockTitle: 'Attestation sur honneur', order: 1, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: true, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: false, afficherToque: false, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Mise en demeure pension alimentaire',
    documentType: BuilderDocumentType.MISE_EN_DEMEURE,
    juridiction: null,
    blocksStructure: [
      { blockTitle: 'En-tete mise en demeure', order: 1, isOptional: false },
      { blockTitle: 'Expose pension alimentaire', order: 2, isOptional: false },
      { blockTitle: 'Demandes liminaires mise en demeure', order: 3, isOptional: false },
      { blockTitle: 'Formule de politesse formelle', order: 4, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: false, lrar: true, autoStore: true },
    legalMentions: { afficherBarreau: true, afficherToque: false, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },

  // ACTES CONTRACTUELS (5)
  {
    name: 'Protocole transactionnel',
    documentType: BuilderDocumentType.PROTOCOLE_TRANSACTION,
    juridiction: null,
    blocksStructure: [
      { blockTitle: 'En-tete protocole transactionnel', order: 1, isOptional: false },
      { blockTitle: 'Clause de confidentialite', order: 2, isOptional: true },
      { blockTitle: 'Clause attributive de competence', order: 3, isOptional: false },
      { blockTitle: 'Clause de loi applicable', order: 4, isOptional: false },
      { blockTitle: 'Signature protocole transactionnel', order: 5, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: true, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: false, afficherToque: false, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Contrat de prestation de services',
    documentType: BuilderDocumentType.PROTOCOLE_TRANSACTION,
    juridiction: null,
    blocksStructure: [
      { blockTitle: 'Clause de confidentialite', order: 1, isOptional: true },
      { blockTitle: 'Clause de propriete intellectuelle', order: 2, isOptional: true },
      { blockTitle: 'Clause limitative de responsabilite', order: 3, isOptional: true },
      { blockTitle: 'Clause de force majeure', order: 4, isOptional: true },
      { blockTitle: 'Clause de preavis de rupture', order: 5, isOptional: true },
      { blockTitle: 'Clause RGPD - protection donnees', order: 6, isOptional: true },
      { blockTitle: 'Clause attributive de competence', order: 7, isOptional: false },
      { blockTitle: 'Clause de loi applicable', order: 8, isOptional: false },
      { blockTitle: 'Signature contrat deux parties', order: 9, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: true, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: false, afficherToque: false, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Contrat de distribution',
    documentType: BuilderDocumentType.PROTOCOLE_TRANSACTION,
    juridiction: null,
    blocksStructure: [
      { blockTitle: 'Clause de non-concurrence', order: 1, isOptional: true },
      { blockTitle: 'Clause de confidentialite', order: 2, isOptional: true },
      { blockTitle: 'Clause de revision de prix', order: 3, isOptional: true },
      { blockTitle: 'Clause de garantie', order: 4, isOptional: true },
      { blockTitle: 'Clause de preavis de rupture', order: 5, isOptional: false },
      { blockTitle: 'Clause resolutoire', order: 6, isOptional: true },
      { blockTitle: 'Clause attributive de competence', order: 7, isOptional: false },
      { blockTitle: 'Clause de loi applicable', order: 8, isOptional: false },
      { blockTitle: 'Signature contrat deux parties', order: 9, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: true, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: false, afficherToque: false, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Accord de confidentialite (NDA)',
    documentType: BuilderDocumentType.PROTOCOLE_TRANSACTION,
    juridiction: null,
    blocksStructure: [
      { blockTitle: 'Clause de confidentialite', order: 1, isOptional: false },
      { blockTitle: 'Clause penale', order: 2, isOptional: true },
      { blockTitle: 'Clause attributive de competence', order: 3, isOptional: false },
      { blockTitle: 'Clause de loi applicable', order: 4, isOptional: false },
      { blockTitle: 'Signature contrat deux parties', order: 5, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: true, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: false, afficherToque: false, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
  {
    name: 'Conditions generales de vente',
    documentType: BuilderDocumentType.PROTOCOLE_TRANSACTION,
    juridiction: null,
    blocksStructure: [
      { blockTitle: 'Clause de reserve de propriete', order: 1, isOptional: true },
      { blockTitle: 'Clause penale', order: 2, isOptional: true },
      { blockTitle: 'Clause limitative de responsabilite', order: 3, isOptional: true },
      { blockTitle: 'Clause de garantie', order: 4, isOptional: true },
      { blockTitle: 'Clause de force majeure', order: 5, isOptional: true },
      { blockTitle: 'Clause RGPD - protection donnees', order: 6, isOptional: true },
      { blockTitle: 'Clause de mediation prealable', order: 7, isOptional: true },
      { blockTitle: 'Clause attributive de competence', order: 8, isOptional: false },
      { blockTitle: 'Clause de loi applicable', order: 9, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: { afficherBarreau: false, afficherToque: false, positionMentions: 'FOOTER' },
    isSystemTemplate: true,
  },
];

// ============================================
// SEED FUNCTION
// ============================================

export async function seedCompleteDocumentLibrary(cabinetId: string, userId: string) {
  console.log('Seeding Complete Document Library (150 blocks + 30 templates)...');

  // Clean existing data
  await prisma.generatedDocument.deleteMany({ where: { cabinetId } });
  await prisma.builderTemplate.deleteMany({ where: { cabinetId } });
  await prisma.documentBlock.deleteMany({ where: { cabinetId } });

  // Create system blocks
  console.log('Creating system blocks...');
  const createdBlocks: Map<string, string> = new Map();

  let blockCount = 0;
  for (const block of allBlocks) {
    const created = await prisma.documentBlock.create({
      data: {
        cabinetId,
        createdById: userId,
        category: block.category,
        title: block.title,
        content: block.content,
        variables: block.variables,
        tags: block.tags,
        isSystemBlock: block.isSystemBlock,
        isMandatory: block.isMandatory,
        displayOrder: block.displayOrder,
      },
    });
    createdBlocks.set(block.title, created.id);
    blockCount++;
    if (blockCount % 25 === 0) {
      console.log(`  Created ${blockCount}/${allBlocks.length} blocks...`);
    }
  }

  console.log(`Created ${allBlocks.length} system blocks`);

  // Create system templates
  console.log('Creating system templates...');

  for (const template of systemTemplates) {
    // Build blocks structure with actual IDs
    const blocksStructure = template.blocksStructure
      .filter((bs) => createdBlocks.has(bs.blockTitle))
      .map((bs) => ({
        blockId: createdBlocks.get(bs.blockTitle) || '',
        order: bs.order,
        isOptional: bs.isOptional,
      }));

    // Collect required variables from all blocks
    const requiredVariables: Array<{ name: string; type: string; required?: boolean }> = [];
    for (const bs of template.blocksStructure) {
      const blockDef = allBlocks.find((b) => b.title === bs.blockTitle);
      if (blockDef) {
        for (const v of blockDef.variables) {
          if (!requiredVariables.find((rv) => rv.name === v.name)) {
            requiredVariables.push(v);
          }
        }
      }
    }

    await prisma.builderTemplate.create({
      data: {
        cabinetId,
        createdById: userId,
        name: template.name,
        documentType: template.documentType,
        juridiction: template.juridiction,
        blocksStructure,
        requiredVariables,
        outputFormat: template.outputFormat,
        workflowConfig: template.workflowConfig,
        legalMentions: template.legalMentions,
        isSystemTemplate: template.isSystemTemplate,
      },
    });
  }

  console.log(`Created ${systemTemplates.length} system templates`);

  console.log('Complete Document Library seeding completed!');
  console.log(`  Total blocks: ${allBlocks.length}`);
  console.log(`  Total templates: ${systemTemplates.length}`);
}

// Run if called directly
if (require.main === module) {
  const cabinetId = process.argv[2];
  const userId = process.argv[3];

  if (!cabinetId || !userId) {
    console.error('Usage: npx tsx prisma/seeds/complete-document-library.seed.ts <cabinetId> <userId>');
    process.exit(1);
  }

  seedCompleteDocumentLibrary(cabinetId, userId)
    .catch((e) => {
      console.error('Error during seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

// Export everything
export { introBlocks, faitsBlocks, moyensBlocks, dispositifBlocks, clausesBlocks, signatureBlocks, mentionsLegalesBlocks, allBlocks, systemTemplates };
