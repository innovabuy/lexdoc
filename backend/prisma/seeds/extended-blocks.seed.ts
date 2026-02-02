import { PrismaClient, BlockCategory } from '@prisma/client';

const prisma = new PrismaClient();

interface ExtendedBlockSeed {
  category: BlockCategory;
  title: string;
  content: string;
  variables: Array<{ name: string; type: string; required?: boolean }>;
  tags: string[];
  isSystemBlock: boolean;
  isMandatory: boolean;
  displayOrder: number;
}

// ============================================
// EXTENDED SYSTEM BLOCKS (130 blocs additionnels)
// ============================================

const extendedBlocks: ExtendedBlockSeed[] = [
  // ============================================
  // INTRO BLOCKS (10 nouveaux, displayOrder 21-30)
  // ============================================
  {
    category: BlockCategory.INTRO,
    title: "Introduction assignation Cour d'Appel",
    content: `L'AN DEUX MILLE VINGT-SIX
Et le {{date_assignation}}

DEVANT LA COUR D'APPEL DE {{juridiction.ville}}

COMPARAIT :

{{appelant.civilite}} {{appelant.nom}} {{appelant.prenom}}
Demeurant {{appelant.adresse}}
{{appelant.codePostal}} {{appelant.ville}}

Représenté par Maître {{avocat.nom}} {{avocat.prenom}}
Avocat au Barreau de {{avocat.barreau}}
Plaidant et postulant

QUI INTERJETTE APPEL du jugement rendu le {{date_jugement}} par le {{juridiction_premiere_instance}}

CONTRE :

{{intime.civilite}} {{intime.nom}} {{intime.prenom}}
Demeurant {{intime.adresse}}
{{intime.codePostal}} {{intime.ville}}

{{#if intime.avocat}}Représenté par Maître {{intime.avocat}}{{/if}}`,
    variables: [
      { name: 'date_assignation', type: 'date', required: true },
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'appelant.civilite', type: 'string', required: true },
      { name: 'appelant.nom', type: 'string', required: true },
      { name: 'appelant.prenom', type: 'string', required: true },
      { name: 'appelant.adresse', type: 'string', required: true },
      { name: 'appelant.codePostal', type: 'string', required: true },
      { name: 'appelant.ville', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.prenom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'date_jugement', type: 'date', required: true },
      { name: 'juridiction_premiere_instance', type: 'string', required: true },
      { name: 'intime.civilite', type: 'string', required: true },
      { name: 'intime.nom', type: 'string', required: true },
      { name: 'intime.prenom', type: 'string' },
      { name: 'intime.adresse', type: 'string', required: true },
      { name: 'intime.codePostal', type: 'string', required: true },
      { name: 'intime.ville', type: 'string', required: true },
      { name: 'intime.avocat', type: 'string' },
    ],
    tags: ['assignation', 'cour_appel', 'intro', 'appel'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 21,
  },
  {
    category: BlockCategory.INTRO,
    title: "Introduction saisine Conseil de Prud'hommes",
    content: `CONSEIL DE PRUD'HOMMES DE {{juridiction.ville}}
Section {{section}}

REQUÊTE AUX FINS DE SAISINE

{{salarie.civilite}} {{salarie.prenom}} {{salarie.nom}}
Né(e) le {{salarie.date_naissance}} à {{salarie.lieu_naissance}}
De nationalité {{salarie.nationalite}}
Demeurant {{salarie.adresse}}
{{salarie.codePostal}} {{salarie.ville}}

Représenté(e) par Maître {{avocat.nom}} {{avocat.prenom}}
Avocat au Barreau de {{avocat.barreau}}

DEMANDEUR

CONTRE :

{{employeur.raison_sociale}}
{{employeur.forme_juridique}} au capital de {{employeur.capital}} €
Immatriculée au RCS de {{employeur.rcs}} sous le numéro {{employeur.siret}}
Dont le siège social est situé {{employeur.adresse}}
{{employeur.codePostal}} {{employeur.ville}}

Prise en la personne de son représentant légal

DÉFENDERESSE`,
    variables: [
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'section', type: 'string', required: true },
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.prenom', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'salarie.date_naissance', type: 'date', required: true },
      { name: 'salarie.lieu_naissance', type: 'string', required: true },
      { name: 'salarie.nationalite', type: 'string', required: true },
      { name: 'salarie.adresse', type: 'string', required: true },
      { name: 'salarie.codePostal', type: 'string', required: true },
      { name: 'salarie.ville', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.prenom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'employeur.raison_sociale', type: 'string', required: true },
      { name: 'employeur.forme_juridique', type: 'string', required: true },
      { name: 'employeur.capital', type: 'number' },
      { name: 'employeur.rcs', type: 'string', required: true },
      { name: 'employeur.siret', type: 'string', required: true },
      { name: 'employeur.adresse', type: 'string', required: true },
      { name: 'employeur.codePostal', type: 'string', required: true },
      { name: 'employeur.ville', type: 'string', required: true },
    ],
    tags: ['prudhommes', 'intro', 'travail', 'requete'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 22,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Introduction requête JAF',
    content: `TRIBUNAL JUDICIAIRE DE {{juridiction.ville}}
JUGE AUX AFFAIRES FAMILIALES

REQUÊTE

{{requerant.civilite}} {{requerant.prenom}} {{requerant.nom}}
Né(e) le {{requerant.date_naissance}} à {{requerant.lieu_naissance}}
Demeurant {{requerant.adresse}}
{{requerant.codePostal}} {{requerant.ville}}
Profession : {{requerant.profession}}

Représenté(e) par Maître {{avocat.nom}} {{avocat.prenom}}
Avocat au Barreau de {{avocat.barreau}}

A l'honneur d'exposer à Monsieur/Madame le Juge aux affaires familiales ce qui suit :

Marié(e) le {{mariage.date}} à {{mariage.lieu}} avec :

{{conjoint.civilite}} {{conjoint.prenom}} {{conjoint.nom}}
Né(e) le {{conjoint.date_naissance}} à {{conjoint.lieu_naissance}}
Demeurant {{conjoint.adresse}}
{{conjoint.codePostal}} {{conjoint.ville}}

{{#if enfants}}
De cette union sont issus {{nombre_enfants}} enfant(s) :
{{#each enfants}}
- {{this.prenom}} {{this.nom}}, né(e) le {{this.date_naissance}}
{{/each}}
{{/if}}`,
    variables: [
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'requerant.civilite', type: 'string', required: true },
      { name: 'requerant.prenom', type: 'string', required: true },
      { name: 'requerant.nom', type: 'string', required: true },
      { name: 'requerant.date_naissance', type: 'date', required: true },
      { name: 'requerant.lieu_naissance', type: 'string', required: true },
      { name: 'requerant.adresse', type: 'string', required: true },
      { name: 'requerant.codePostal', type: 'string', required: true },
      { name: 'requerant.ville', type: 'string', required: true },
      { name: 'requerant.profession', type: 'string' },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.prenom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'mariage.date', type: 'date', required: true },
      { name: 'mariage.lieu', type: 'string', required: true },
      { name: 'conjoint.civilite', type: 'string', required: true },
      { name: 'conjoint.prenom', type: 'string', required: true },
      { name: 'conjoint.nom', type: 'string', required: true },
      { name: 'conjoint.date_naissance', type: 'date', required: true },
      { name: 'conjoint.lieu_naissance', type: 'string', required: true },
      { name: 'conjoint.adresse', type: 'string', required: true },
      { name: 'conjoint.codePostal', type: 'string', required: true },
      { name: 'conjoint.ville', type: 'string', required: true },
      { name: 'enfants', type: 'array' },
      { name: 'nombre_enfants', type: 'number' },
    ],
    tags: ['jaf', 'famille', 'intro', 'requete', 'divorce'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 23,
  },
  {
    category: BlockCategory.INTRO,
    title: "Introduction requête JEX",
    content: `TRIBUNAL JUDICIAIRE DE {{juridiction.ville}}
JUGE DE L'EXÉCUTION

REQUÊTE

{{creancier.civilite}} {{creancier.prenom}} {{creancier.nom}}
Demeurant {{creancier.adresse}}
{{creancier.codePostal}} {{creancier.ville}}

Représenté(e) par Maître {{avocat.nom}} {{avocat.prenom}}
Avocat au Barreau de {{avocat.barreau}}

DEMANDEUR à l'exécution

Titulaire d'un titre exécutoire constitué par :
{{titre_executoire.nature}} du {{titre_executoire.date}}
rendu par {{titre_executoire.juridiction}}
N° RG : {{titre_executoire.numero_rg}}

CONTRE :

{{debiteur.civilite}} {{debiteur.prenom}} {{debiteur.nom}}
Demeurant {{debiteur.adresse}}
{{debiteur.codePostal}} {{debiteur.ville}}

DÉFENDEUR à l'exécution

A l'honneur d'exposer à Monsieur/Madame le Juge de l'exécution ce qui suit :`,
    variables: [
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'creancier.civilite', type: 'string', required: true },
      { name: 'creancier.prenom', type: 'string', required: true },
      { name: 'creancier.nom', type: 'string', required: true },
      { name: 'creancier.adresse', type: 'string', required: true },
      { name: 'creancier.codePostal', type: 'string', required: true },
      { name: 'creancier.ville', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.prenom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'titre_executoire.nature', type: 'string', required: true },
      { name: 'titre_executoire.date', type: 'date', required: true },
      { name: 'titre_executoire.juridiction', type: 'string', required: true },
      { name: 'titre_executoire.numero_rg', type: 'string', required: true },
      { name: 'debiteur.civilite', type: 'string', required: true },
      { name: 'debiteur.prenom', type: 'string', required: true },
      { name: 'debiteur.nom', type: 'string', required: true },
      { name: 'debiteur.adresse', type: 'string', required: true },
      { name: 'debiteur.codePostal', type: 'string', required: true },
      { name: 'debiteur.ville', type: 'string', required: true },
    ],
    tags: ['jex', 'execution', 'intro', 'requete'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 24,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Introduction citation directe tribunal correctionnel',
    content: `CITATION DIRECTE DEVANT LE TRIBUNAL CORRECTIONNEL

L'AN DEUX MILLE VINGT-SIX
Et le {{date_citation}}

À LA REQUÊTE DE :

{{partie_civile.civilite}} {{partie_civile.prenom}} {{partie_civile.nom}}
Demeurant {{partie_civile.adresse}}
{{partie_civile.codePostal}} {{partie_civile.ville}}

Se constituant PARTIE CIVILE

Représenté(e) par Maître {{avocat.nom}} {{avocat.prenom}}
Avocat au Barreau de {{avocat.barreau}}

J'AI, {{huissier.nom}}, Commissaire de Justice,

DONNÉ CITATION À :

{{prevenu.civilite}} {{prevenu.prenom}} {{prevenu.nom}}
Né(e) le {{prevenu.date_naissance}} à {{prevenu.lieu_naissance}}
De nationalité {{prevenu.nationalite}}
Profession : {{prevenu.profession}}
Demeurant {{prevenu.adresse}}
{{prevenu.codePostal}} {{prevenu.ville}}

À COMPARAÎTRE devant le Tribunal Correctionnel de {{juridiction.ville}}
Le {{date_audience}} à {{heure_audience}}
{{juridiction.adresse}}

Pour y être jugé(e) comme prévenu(e) des faits suivants :`,
    variables: [
      { name: 'date_citation', type: 'date', required: true },
      { name: 'partie_civile.civilite', type: 'string', required: true },
      { name: 'partie_civile.prenom', type: 'string', required: true },
      { name: 'partie_civile.nom', type: 'string', required: true },
      { name: 'partie_civile.adresse', type: 'string', required: true },
      { name: 'partie_civile.codePostal', type: 'string', required: true },
      { name: 'partie_civile.ville', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.prenom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'huissier.nom', type: 'string', required: true },
      { name: 'prevenu.civilite', type: 'string', required: true },
      { name: 'prevenu.prenom', type: 'string', required: true },
      { name: 'prevenu.nom', type: 'string', required: true },
      { name: 'prevenu.date_naissance', type: 'date', required: true },
      { name: 'prevenu.lieu_naissance', type: 'string', required: true },
      { name: 'prevenu.nationalite', type: 'string', required: true },
      { name: 'prevenu.profession', type: 'string' },
      { name: 'prevenu.adresse', type: 'string', required: true },
      { name: 'prevenu.codePostal', type: 'string', required: true },
      { name: 'prevenu.ville', type: 'string', required: true },
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'juridiction.adresse', type: 'string', required: true },
      { name: 'date_audience', type: 'date', required: true },
      { name: 'heure_audience', type: 'string', required: true },
    ],
    tags: ['citation_directe', 'correctionnel', 'penal', 'intro'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 25,
  },
  {
    category: BlockCategory.INTRO,
    title: "Introduction opposition injonction de payer",
    content: `TRIBUNAL JUDICIAIRE DE {{juridiction.ville}}

OPPOSITION À INJONCTION DE PAYER

{{opposant.civilite}} {{opposant.prenom}} {{opposant.nom}}
{{#if opposant.societe}}{{opposant.societe}}{{/if}}
Demeurant {{opposant.adresse}}
{{opposant.codePostal}} {{opposant.ville}}

Représenté(e) par Maître {{avocat.nom}} {{avocat.prenom}}
Avocat au Barreau de {{avocat.barreau}}

OPPOSANT

A l'honneur de former OPPOSITION à l'ordonnance d'injonction de payer rendue le {{ordonnance.date}} par le Président du Tribunal judiciaire de {{juridiction.ville}} sous le numéro {{ordonnance.numero}}.

Cette ordonnance a été signifiée le {{signification.date}} par acte de {{signification.huissier}}.

La présente opposition est formée dans le délai d'un mois prévu par l'article 1416 du Code de procédure civile.

CONTRE :

{{creancier.civilite}} {{creancier.nom}}
{{#if creancier.societe}}{{creancier.societe}}{{/if}}
Demeurant {{creancier.adresse}}
{{creancier.codePostal}} {{creancier.ville}}

CRÉANCIER`,
    variables: [
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'opposant.civilite', type: 'string', required: true },
      { name: 'opposant.prenom', type: 'string', required: true },
      { name: 'opposant.nom', type: 'string', required: true },
      { name: 'opposant.societe', type: 'string' },
      { name: 'opposant.adresse', type: 'string', required: true },
      { name: 'opposant.codePostal', type: 'string', required: true },
      { name: 'opposant.ville', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.prenom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'ordonnance.date', type: 'date', required: true },
      { name: 'ordonnance.numero', type: 'string', required: true },
      { name: 'signification.date', type: 'date', required: true },
      { name: 'signification.huissier', type: 'string', required: true },
      { name: 'creancier.civilite', type: 'string', required: true },
      { name: 'creancier.nom', type: 'string', required: true },
      { name: 'creancier.societe', type: 'string' },
      { name: 'creancier.adresse', type: 'string', required: true },
      { name: 'creancier.codePostal', type: 'string', required: true },
      { name: 'creancier.ville', type: 'string', required: true },
    ],
    tags: ['opposition', 'injonction_payer', 'intro', 'recouvrement'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 26,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Introduction mémoire ampliatif cassation',
    content: `COUR DE CASSATION
{{chambre}}

Pourvoi n° {{pourvoi.numero}}

MÉMOIRE AMPLIATIF

POUR :

{{demandeur.civilite}} {{demandeur.prenom}} {{demandeur.nom}}
Demeurant {{demandeur.adresse}}
{{demandeur.codePostal}} {{demandeur.ville}}

DEMANDEUR AU POURVOI

Représenté par la SCP {{avocat_cassation.scp}}, Avocats au Conseil d'État et à la Cour de cassation

CONTRE :

{{defendeur.civilite}} {{defendeur.prenom}} {{defendeur.nom}}
Demeurant {{defendeur.adresse}}
{{defendeur.codePostal}} {{defendeur.ville}}

DÉFENDEUR AU POURVOI

{{#if defendeur.avocat_cassation}}Représenté par {{defendeur.avocat_cassation}}{{/if}}

*

{{demandeur.civilite}} {{demandeur.nom}} a formé un pourvoi en cassation contre l'arrêt rendu le {{arret.date}} par la {{arret.juridiction}}.`,
    variables: [
      { name: 'chambre', type: 'string', required: true },
      { name: 'pourvoi.numero', type: 'string', required: true },
      { name: 'demandeur.civilite', type: 'string', required: true },
      { name: 'demandeur.prenom', type: 'string', required: true },
      { name: 'demandeur.nom', type: 'string', required: true },
      { name: 'demandeur.adresse', type: 'string', required: true },
      { name: 'demandeur.codePostal', type: 'string', required: true },
      { name: 'demandeur.ville', type: 'string', required: true },
      { name: 'avocat_cassation.scp', type: 'string', required: true },
      { name: 'defendeur.civilite', type: 'string', required: true },
      { name: 'defendeur.prenom', type: 'string', required: true },
      { name: 'defendeur.nom', type: 'string', required: true },
      { name: 'defendeur.adresse', type: 'string', required: true },
      { name: 'defendeur.codePostal', type: 'string', required: true },
      { name: 'defendeur.ville', type: 'string', required: true },
      { name: 'defendeur.avocat_cassation', type: 'string' },
      { name: 'arret.date', type: 'date', required: true },
      { name: 'arret.juridiction', type: 'string', required: true },
    ],
    tags: ['cassation', 'pourvoi', 'intro', 'memoire'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 27,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Introduction dires à expert',
    content: `{{lieu}}, le {{date_courrier}}

Maître {{expert.prenom}} {{expert.nom}}
Expert judiciaire près la Cour d'Appel de {{expert.cour_appel}}
{{expert.adresse}}
{{expert.codePostal}} {{expert.ville}}

Objet : Dires - Expertise judiciaire
Dossier : {{affaire.intitule}}
N° RG : {{affaire.numero_rg}}
Votre réf. : {{expert.reference}}

Maître,

J'ai l'honneur d'intervenir en ma qualité de conseil de {{client.civilite}} {{client.prenom}} {{client.nom}}, partie à l'expertise ordonnée par {{ordonnance.juridiction}} le {{ordonnance.date}}.

Conformément aux dispositions de l'article 276 du Code de procédure civile, je vous prie de bien vouloir prendre acte des dires et observations suivants :`,
    variables: [
      { name: 'lieu', type: 'string', required: true },
      { name: 'date_courrier', type: 'date', required: true },
      { name: 'expert.prenom', type: 'string', required: true },
      { name: 'expert.nom', type: 'string', required: true },
      { name: 'expert.cour_appel', type: 'string', required: true },
      { name: 'expert.adresse', type: 'string', required: true },
      { name: 'expert.codePostal', type: 'string', required: true },
      { name: 'expert.ville', type: 'string', required: true },
      { name: 'expert.reference', type: 'string' },
      { name: 'affaire.intitule', type: 'string', required: true },
      { name: 'affaire.numero_rg', type: 'string', required: true },
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.prenom', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'ordonnance.juridiction', type: 'string', required: true },
      { name: 'ordonnance.date', type: 'date', required: true },
    ],
    tags: ['dires', 'expertise', 'intro', 'expert'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 28,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Introduction observations écrites',
    content: `TRIBUNAL JUDICIAIRE DE {{juridiction.ville}}
{{#if chambre}}{{chambre}}{{/if}}

N° RG : {{affaire.numero_rg}}

OBSERVATIONS ÉCRITES

POUR :

{{client.civilite}} {{client.prenom}} {{client.nom}}
{{client.adresse}}
{{client.codePostal}} {{client.ville}}

{{client.qualite}}

Représenté(e) par Maître {{avocat.nom}} {{avocat.prenom}}
Avocat au Barreau de {{avocat.barreau}}

CONTRE :

{{adversaire.civilite}} {{adversaire.nom}}
{{adversaire.adresse}}
{{adversaire.codePostal}} {{adversaire.ville}}

{{adversaire.qualite}}

{{#if adversaire.avocat}}Représenté(e) par Maître {{adversaire.avocat}}{{/if}}

*

En réponse aux dernières conclusions adverses notifiées le {{conclusions_adverses.date}}, {{client.civilite}} {{client.nom}} a l'honneur de présenter les observations suivantes :`,
    variables: [
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'chambre', type: 'string' },
      { name: 'affaire.numero_rg', type: 'string', required: true },
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.prenom', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'client.adresse', type: 'string', required: true },
      { name: 'client.codePostal', type: 'string', required: true },
      { name: 'client.ville', type: 'string', required: true },
      { name: 'client.qualite', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.prenom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'adversaire.civilite', type: 'string', required: true },
      { name: 'adversaire.nom', type: 'string', required: true },
      { name: 'adversaire.adresse', type: 'string', required: true },
      { name: 'adversaire.codePostal', type: 'string', required: true },
      { name: 'adversaire.ville', type: 'string', required: true },
      { name: 'adversaire.qualite', type: 'string', required: true },
      { name: 'adversaire.avocat', type: 'string' },
      { name: 'conclusions_adverses.date', type: 'date', required: true },
    ],
    tags: ['observations', 'intro', 'reponse', 'conclusions'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 29,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Introduction lettre avant poursuites',
    content: `{{lieu}}, le {{date_courrier}}

LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION

{{destinataire.civilite}} {{destinataire.prenom}} {{destinataire.nom}}
{{#if destinataire.societe}}{{destinataire.societe}}{{/if}}
{{destinataire.adresse}}
{{destinataire.codePostal}} {{destinataire.ville}}

Objet : Dernier avis avant poursuites judiciaires
{{#if reference}}Notre réf. : {{reference}}{{/if}}

{{destinataire.civilite}},

Nous avons l'honneur d'intervenir en qualité de conseil de {{client.civilite}} {{client.prenom}} {{client.nom}}.

Par la présente, nous vous adressons un ULTIME AVIS avant engagement de poursuites judiciaires.

En effet, malgré nos précédentes correspondances demeurées sans effet, et notamment :
{{#if courriers_precedents}}
{{#each courriers_precedents}}
- Courrier du {{this.date}} : {{this.objet}}
{{/each}}
{{/if}}

Vous restez redevable envers notre client de la somme de {{montant_du}} €.`,
    variables: [
      { name: 'lieu', type: 'string', required: true },
      { name: 'date_courrier', type: 'date', required: true },
      { name: 'destinataire.civilite', type: 'string', required: true },
      { name: 'destinataire.prenom', type: 'string' },
      { name: 'destinataire.nom', type: 'string', required: true },
      { name: 'destinataire.societe', type: 'string' },
      { name: 'destinataire.adresse', type: 'string', required: true },
      { name: 'destinataire.codePostal', type: 'string', required: true },
      { name: 'destinataire.ville', type: 'string', required: true },
      { name: 'reference', type: 'string' },
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.prenom', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'courriers_precedents', type: 'array' },
      { name: 'montant_du', type: 'number', required: true },
    ],
    tags: ['lettre', 'poursuites', 'intro', 'recouvrement', 'avertissement'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 30,
  },

  // ============================================
  // FAITS BLOCKS - Droit du travail (8 blocs, displayOrder 31-38)
  // ============================================
  {
    category: BlockCategory.FAITS,
    title: 'Exposé harcèlement moral au travail',
    content: `I. RAPPEL DES FAITS

{{salarie.civilite}} {{salarie.nom}} a été embauché(e) par {{employeur.nom}} le {{contrat.date_embauche}} en qualité de {{contrat.poste}}.

A compter du {{harcelement.date_debut}}, {{salarie.civilite}} {{salarie.nom}} a été victime d'agissements répétés de harcèlement moral de la part de {{harceleur.qualite}} {{harceleur.nom}}.

Ces agissements se sont manifestés par :

{{#each faits_harcelement}}
- {{this.date}} : {{this.description}}
{{/each}}

Ces faits ont eu pour effet une dégradation des conditions de travail de {{salarie.civilite}} {{salarie.nom}}, caractérisée par :
{{consequences_professionnelles}}

{{#if arret_travail}}
{{salarie.civilite}} {{salarie.nom}} a été placé(e) en arrêt de travail à compter du {{arret_travail.debut}}{{#if arret_travail.fin}} jusqu'au {{arret_travail.fin}}{{/if}}.
{{/if}}

{{#if declaration_at}}
Une déclaration d'accident du travail / maladie professionnelle a été effectuée le {{declaration_at.date}}.
{{/if}}

{{#if signalement}}
Ces faits ont été signalés à {{signalement.destinataire}} le {{signalement.date}}.
{{/if}}`,
    variables: [
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'contrat.date_embauche', type: 'date', required: true },
      { name: 'contrat.poste', type: 'string', required: true },
      { name: 'harcelement.date_debut', type: 'date', required: true },
      { name: 'harceleur.qualite', type: 'string', required: true },
      { name: 'harceleur.nom', type: 'string', required: true },
      { name: 'faits_harcelement', type: 'array', required: true },
      { name: 'consequences_professionnelles', type: 'text', required: true },
      { name: 'arret_travail.debut', type: 'date' },
      { name: 'arret_travail.fin', type: 'date' },
      { name: 'declaration_at.date', type: 'date' },
      { name: 'signalement.destinataire', type: 'string' },
      { name: 'signalement.date', type: 'date' },
    ],
    tags: ['faits', 'harcelement', 'travail', 'moral'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 31,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé licenciement économique',
    content: `I. RAPPEL DES FAITS

{{salarie.civilite}} {{salarie.nom}} a été embauché(e) par {{employeur.nom}} le {{contrat.date_embauche}} en qualité de {{contrat.poste}}, statut {{contrat.statut}}.

Son ancienneté dans l'entreprise était de {{contrat.anciennete}} au moment de la rupture du contrat de travail.

Le {{licenciement.date_notification}}, {{salarie.civilite}} {{salarie.nom}} a été licencié(e) pour motif économique.

{{#if entretien_prealable}}
Un entretien préalable s'est tenu le {{entretien_prealable.date}}.
{{/if}}

Le motif économique invoqué par l'employeur est le suivant :
{{motif_economique}}

{{#if pse}}
Un Plan de Sauvegarde de l'Emploi a été mis en place. {{salarie.civilite}} {{salarie.nom}} {{#if pse.reclassement_propose}}s'est vu proposer un reclassement{{else}}ne s'est pas vu proposer de reclassement{{/if}}.
{{/if}}

{{#if csp}}
{{salarie.civilite}} {{salarie.nom}} a {{#if csp.accepte}}accepté{{else}}refusé{{/if}} le Contrat de Sécurisation Professionnelle.
{{/if}}

{{#if priorite_reembauche}}
{{salarie.civilite}} {{salarie.nom}} a été informé(e) de sa priorité de réembauche le {{priorite_reembauche.date}}.
{{/if}}`,
    variables: [
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'contrat.date_embauche', type: 'date', required: true },
      { name: 'contrat.poste', type: 'string', required: true },
      { name: 'contrat.statut', type: 'string' },
      { name: 'contrat.anciennete', type: 'string', required: true },
      { name: 'licenciement.date_notification', type: 'date', required: true },
      { name: 'entretien_prealable.date', type: 'date' },
      { name: 'motif_economique', type: 'text', required: true },
      { name: 'pse', type: 'boolean' },
      { name: 'pse.reclassement_propose', type: 'boolean' },
      { name: 'csp', type: 'boolean' },
      { name: 'csp.accepte', type: 'boolean' },
      { name: 'priorite_reembauche.date', type: 'date' },
    ],
    tags: ['faits', 'licenciement', 'economique', 'travail'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 32,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé licenciement pour faute grave',
    content: `I. RAPPEL DES FAITS

{{salarie.civilite}} {{salarie.nom}} a été embauché(e) par {{employeur.nom}} le {{contrat.date_embauche}} en qualité de {{contrat.poste}}.

Le {{mise_a_pied.date}}, {{salarie.civilite}} {{salarie.nom}} a fait l'objet d'une mise à pied conservatoire.

L'entretien préalable s'est tenu le {{entretien_prealable.date}}. {{salarie.civilite}} {{salarie.nom}} était {{#if entretien_prealable.assiste}}assisté(e) de {{entretien_prealable.assistant}}{{else}}non assisté(e){{/if}}.

Par lettre recommandée avec accusé de réception en date du {{licenciement.date_notification}}, {{employeur.nom}} a notifié à {{salarie.civilite}} {{salarie.nom}} son licenciement pour faute grave.

Les griefs formulés dans la lettre de licenciement sont les suivants :
{{griefs_lettre}}

{{salarie.civilite}} {{salarie.nom}} conteste fermement ces griefs pour les raisons suivantes :
{{contestation_griefs}}

{{#if sanctions_anterieures}}
Il convient de préciser que {{salarie.civilite}} {{salarie.nom}} avait fait l'objet des sanctions suivantes antérieurement :
{{#each sanctions_anterieures}}
- {{this.date}} : {{this.nature}} pour {{this.motif}}
{{/each}}
{{else}}
Il convient de souligner que {{salarie.civilite}} {{salarie.nom}} n'avait jamais fait l'objet d'aucune sanction disciplinaire au cours de sa carrière.
{{/if}}`,
    variables: [
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'contrat.date_embauche', type: 'date', required: true },
      { name: 'contrat.poste', type: 'string', required: true },
      { name: 'mise_a_pied.date', type: 'date', required: true },
      { name: 'entretien_prealable.date', type: 'date', required: true },
      { name: 'entretien_prealable.assiste', type: 'boolean' },
      { name: 'entretien_prealable.assistant', type: 'string' },
      { name: 'licenciement.date_notification', type: 'date', required: true },
      { name: 'griefs_lettre', type: 'text', required: true },
      { name: 'contestation_griefs', type: 'text', required: true },
      { name: 'sanctions_anterieures', type: 'array' },
    ],
    tags: ['faits', 'licenciement', 'faute_grave', 'travail', 'disciplinaire'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 33,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé prise acte de rupture',
    content: `I. RAPPEL DES FAITS

{{salarie.civilite}} {{salarie.nom}} a été embauché(e) par {{employeur.nom}} le {{contrat.date_embauche}} en qualité de {{contrat.poste}}, moyennant une rémunération mensuelle brute de {{contrat.salaire}} €.

Au cours de l'exécution du contrat de travail, {{salarie.civilite}} {{salarie.nom}} a été confronté(e) aux manquements suivants de la part de son employeur :

{{#each manquements}}
{{@index}}. {{this.nature}} :
{{this.description}}
Date(s) : {{this.dates}}
{{/each}}

Ces manquements, d'une particulière gravité, ont rendu impossible la poursuite du contrat de travail.

En conséquence, {{salarie.civilite}} {{salarie.nom}} a pris acte de la rupture de son contrat de travail par courrier du {{prise_acte.date}}, réceptionné par l'employeur le {{prise_acte.date_reception}}.

Cette prise d'acte doit produire les effets d'un licenciement sans cause réelle et sérieuse.`,
    variables: [
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'contrat.date_embauche', type: 'date', required: true },
      { name: 'contrat.poste', type: 'string', required: true },
      { name: 'contrat.salaire', type: 'number', required: true },
      { name: 'manquements', type: 'array', required: true },
      { name: 'prise_acte.date', type: 'date', required: true },
      { name: 'prise_acte.date_reception', type: 'date', required: true },
    ],
    tags: ['faits', 'prise_acte', 'rupture', 'travail'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 34,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé accident du travail',
    content: `I. RAPPEL DES FAITS

{{salarie.civilite}} {{salarie.nom}} est salarié(e) de {{employeur.nom}} depuis le {{contrat.date_embauche}} en qualité de {{contrat.poste}}.

Le {{accident.date}} à {{accident.heure}}, {{salarie.civilite}} {{salarie.nom}} a été victime d'un accident du travail survenu {{accident.lieu}}.

Les circonstances de l'accident sont les suivantes :
{{accident.circonstances}}

{{#if temoins}}
Cet accident s'est produit en présence de :
{{#each temoins}}
- {{this.nom}}, {{this.qualite}}
{{/each}}
{{/if}}

L'accident a été déclaré par l'employeur le {{declaration.date}}{{#if declaration.avec_reserves}} avec réserves{{/if}}.

{{#if cpam}}
La CPAM a {{#if cpam.prise_en_charge}}pris en charge{{else}}refusé la prise en charge de{{/if}} l'accident le {{cpam.date_decision}}.
{{/if}}

{{salarie.civilite}} {{salarie.nom}} a subi les préjudices corporels suivants :
{{prejudices_corporels}}

{{#if itt}}
L'incapacité temporaire totale de travail a été fixée à {{itt.duree}} jours.
{{/if}}

{{#if ipp}}
L'incapacité permanente partielle a été évaluée à {{ipp.taux}} %.
{{/if}}`,
    variables: [
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'contrat.date_embauche', type: 'date', required: true },
      { name: 'contrat.poste', type: 'string', required: true },
      { name: 'accident.date', type: 'date', required: true },
      { name: 'accident.heure', type: 'string', required: true },
      { name: 'accident.lieu', type: 'string', required: true },
      { name: 'accident.circonstances', type: 'text', required: true },
      { name: 'temoins', type: 'array' },
      { name: 'declaration.date', type: 'date', required: true },
      { name: 'declaration.avec_reserves', type: 'boolean' },
      { name: 'cpam.prise_en_charge', type: 'boolean' },
      { name: 'cpam.date_decision', type: 'date' },
      { name: 'prejudices_corporels', type: 'text', required: true },
      { name: 'itt.duree', type: 'number' },
      { name: 'ipp.taux', type: 'number' },
    ],
    tags: ['faits', 'accident', 'travail', 'at'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 35,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé discrimination',
    content: `I. RAPPEL DES FAITS

{{salarie.civilite}} {{salarie.nom}} a été embauché(e) par {{employeur.nom}} le {{contrat.date_embauche}} en qualité de {{contrat.poste}}.

{{salarie.civilite}} {{salarie.nom}} a fait l'objet d'une discrimination fondée sur {{discrimination.critere}}.

Cette discrimination s'est manifestée par :

{{#each faits_discriminatoires}}
{{@index}}. {{this.date}} : {{this.description}}
{{/each}}

{{#if comparaison}}
À titre de comparaison, les salariés suivants, placés dans une situation comparable mais ne présentant pas le critère discriminatoire, ont bénéficié d'un traitement plus favorable :
{{#each comparaison}}
- {{this.nom}} : {{this.avantage}}
{{/each}}
{{/if}}

{{#if signalement}}
Cette discrimination a été signalée {{signalement.destinataire}} le {{signalement.date}}.
{{/if}}

{{#if defenseur_droits}}
Le Défenseur des droits a été saisi le {{defenseur_droits.date}}.
{{/if}}`,
    variables: [
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'contrat.date_embauche', type: 'date', required: true },
      { name: 'contrat.poste', type: 'string', required: true },
      { name: 'discrimination.critere', type: 'string', required: true },
      { name: 'faits_discriminatoires', type: 'array', required: true },
      { name: 'comparaison', type: 'array' },
      { name: 'signalement.destinataire', type: 'string' },
      { name: 'signalement.date', type: 'date' },
      { name: 'defenseur_droits.date', type: 'date' },
    ],
    tags: ['faits', 'discrimination', 'travail', 'egalite'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 36,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé heures supplémentaires impayées',
    content: `I. RAPPEL DES FAITS

{{salarie.civilite}} {{salarie.nom}} a été embauché(e) par {{employeur.nom}} le {{contrat.date_embauche}} en qualité de {{contrat.poste}}, moyennant une rémunération mensuelle brute de {{contrat.salaire}} €.

Le contrat de travail prévoyait une durée hebdomadaire de travail de {{contrat.duree_hebdo}} heures.

Or, {{salarie.civilite}} {{salarie.nom}} a régulièrement effectué des heures supplémentaires qui ne lui ont pas été rémunérées.

Sur la période du {{periode.debut}} au {{periode.fin}}, les heures supplémentaires effectuées et non rémunérées se répartissent comme suit :

{{#each heures_sup}}
- {{this.periode}} : {{this.nombre}} heures supplémentaires {{this.majoration}}
{{/each}}

Ces heures supplémentaires sont justifiées par :
{{justificatifs}}

{{#if demande_paiement}}
{{salarie.civilite}} {{salarie.nom}} a réclamé le paiement de ces heures le {{demande_paiement.date}} par {{demande_paiement.mode}}.
Cette demande est restée sans réponse / a été refusée le {{demande_paiement.reponse_date}}.
{{/if}}

Le rappel de salaire au titre des heures supplémentaires s'élève à {{montant_rappel}} € brut.`,
    variables: [
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'contrat.date_embauche', type: 'date', required: true },
      { name: 'contrat.poste', type: 'string', required: true },
      { name: 'contrat.salaire', type: 'number', required: true },
      { name: 'contrat.duree_hebdo', type: 'number', required: true },
      { name: 'periode.debut', type: 'date', required: true },
      { name: 'periode.fin', type: 'date', required: true },
      { name: 'heures_sup', type: 'array', required: true },
      { name: 'justificatifs', type: 'text', required: true },
      { name: 'demande_paiement.date', type: 'date' },
      { name: 'demande_paiement.mode', type: 'string' },
      { name: 'demande_paiement.reponse_date', type: 'date' },
      { name: 'montant_rappel', type: 'number', required: true },
    ],
    tags: ['faits', 'heures_supplementaires', 'travail', 'salaire'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 37,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé rupture période essai abusive',
    content: `I. RAPPEL DES FAITS

{{salarie.civilite}} {{salarie.nom}} a été embauché(e) par {{employeur.nom}} le {{contrat.date_embauche}} en qualité de {{contrat.poste}} en contrat à durée {{contrat.type}}.

Le contrat de travail prévoyait une période d'essai de {{essai.duree_initiale}}{{#if essai.renouvellement}}, renouvelable une fois pour une durée de {{essai.duree_renouvellement}}{{/if}}.

Le {{rupture.date}}, alors que {{salarie.civilite}} {{salarie.nom}} n'avait effectué que {{essai.duree_effective}} de période d'essai, l'employeur a notifié la rupture de celle-ci.

{{#if rupture.motif}}
Le motif invoqué était le suivant : {{rupture.motif}}
{{else}}
Aucun motif n'a été indiqué.
{{/if}}

{{#if delai_prevenance}}
Le délai de prévenance {{#if delai_prevenance.respecte}}de {{delai_prevenance.duree}} a été respecté{{else}}n'a pas été respecté ({{delai_prevenance.duree}} requis){{/if}}.
{{/if}}

Cette rupture est abusive en ce que :
{{motifs_abus}}

{{#if evaluations}}
Il convient de préciser que les évaluations dont {{salarie.civilite}} {{salarie.nom}} a fait l'objet étaient les suivantes :
{{evaluations}}
{{/if}}`,
    variables: [
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'contrat.date_embauche', type: 'date', required: true },
      { name: 'contrat.poste', type: 'string', required: true },
      { name: 'contrat.type', type: 'string', required: true },
      { name: 'essai.duree_initiale', type: 'string', required: true },
      { name: 'essai.renouvellement', type: 'boolean' },
      { name: 'essai.duree_renouvellement', type: 'string' },
      { name: 'essai.duree_effective', type: 'string', required: true },
      { name: 'rupture.date', type: 'date', required: true },
      { name: 'rupture.motif', type: 'string' },
      { name: 'delai_prevenance.respecte', type: 'boolean' },
      { name: 'delai_prevenance.duree', type: 'string' },
      { name: 'motifs_abus', type: 'text', required: true },
      { name: 'evaluations', type: 'text' },
    ],
    tags: ['faits', 'periode_essai', 'rupture', 'travail', 'abus'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 38,
  },

  // ============================================
  // FAITS BLOCKS - Droit de la famille (4 blocs, displayOrder 39-42)
  // ============================================
  {
    category: BlockCategory.FAITS,
    title: 'Exposé séparation conjugale',
    content: `I. RAPPEL DES FAITS

{{epoux1.civilite}} {{epoux1.prenom}} {{epoux1.nom}} et {{epoux2.civilite}} {{epoux2.prenom}} {{epoux2.nom}} se sont mariés le {{mariage.date}} à {{mariage.lieu}}{{#if mariage.regime}}, sous le régime de la {{mariage.regime}}{{/if}}.

{{#if enfants}}
De cette union sont issus {{nombre_enfants}} enfant(s) :
{{#each enfants}}
- {{this.prenom}}, né(e) le {{this.date_naissance}}
{{/each}}
{{/if}}

La séparation des époux est intervenue le {{separation.date}}.

{{#if separation.circonstances}}
Les circonstances de la séparation sont les suivantes :
{{separation.circonstances}}
{{/if}}

{{#if domicile_conjugal}}
Le domicile conjugal était situé {{domicile_conjugal.adresse}}, {{domicile_conjugal.codePostal}} {{domicile_conjugal.ville}}.
Depuis la séparation, ce domicile est occupé par {{domicile_conjugal.occupant}}.
{{/if}}

{{#if mesures_provisoires}}
Des mesures provisoires ont été ordonnées par le Juge aux affaires familiales le {{mesures_provisoires.date}} :
{{mesures_provisoires.detail}}
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
      { name: 'mariage.regime', type: 'string' },
      { name: 'enfants', type: 'array' },
      { name: 'nombre_enfants', type: 'number' },
      { name: 'separation.date', type: 'date', required: true },
      { name: 'separation.circonstances', type: 'text' },
      { name: 'domicile_conjugal.adresse', type: 'string' },
      { name: 'domicile_conjugal.codePostal', type: 'string' },
      { name: 'domicile_conjugal.ville', type: 'string' },
      { name: 'domicile_conjugal.occupant', type: 'string' },
      { name: 'mesures_provisoires.date', type: 'date' },
      { name: 'mesures_provisoires.detail', type: 'text' },
    ],
    tags: ['faits', 'famille', 'separation', 'divorce'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 39,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé pension alimentaire impayée',
    content: `I. RAPPEL DES FAITS

Par {{decision.nature}} du {{decision.date}}, le {{decision.juridiction}} a condamné {{debiteur.civilite}} {{debiteur.nom}} à verser à {{creancier.civilite}} {{creancier.nom}} une pension alimentaire de {{pension.montant}} € par mois au titre de {{pension.objet}}.

Cette pension alimentaire est indexée sur {{pension.indexation}}.

Or, depuis le {{impayes.debut}}, {{debiteur.civilite}} {{debiteur.nom}} ne s'acquitte plus de cette obligation.

À ce jour, l'arriéré de pension alimentaire s'élève à {{impayes.montant}} €, correspondant à :
{{#each impayes.detail}}
- {{this.periode}} : {{this.montant}} € non versé
{{/each}}

{{#if relances}}
{{creancier.civilite}} {{creancier.nom}} a adressé des relances les {{relances}}, demeurées sans effet.
{{/if}}

{{#if huissier}}
Un commandement de payer a été délivré le {{huissier.date}} par {{huissier.nom}}.
{{/if}}

{{#if plainte}}
Une plainte pour abandon de famille a été déposée le {{plainte.date}}.
{{/if}}`,
    variables: [
      { name: 'decision.nature', type: 'string', required: true },
      { name: 'decision.date', type: 'date', required: true },
      { name: 'decision.juridiction', type: 'string', required: true },
      { name: 'debiteur.civilite', type: 'string', required: true },
      { name: 'debiteur.nom', type: 'string', required: true },
      { name: 'creancier.civilite', type: 'string', required: true },
      { name: 'creancier.nom', type: 'string', required: true },
      { name: 'pension.montant', type: 'number', required: true },
      { name: 'pension.objet', type: 'string', required: true },
      { name: 'pension.indexation', type: 'string' },
      { name: 'impayes.debut', type: 'date', required: true },
      { name: 'impayes.montant', type: 'number', required: true },
      { name: 'impayes.detail', type: 'array' },
      { name: 'relances', type: 'string' },
      { name: 'huissier.date', type: 'date' },
      { name: 'huissier.nom', type: 'string' },
      { name: 'plainte.date', type: 'date' },
    ],
    tags: ['faits', 'famille', 'pension', 'alimentaire', 'impayes'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 40,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé droit de visite non respecté',
    content: `I. RAPPEL DES FAITS

Par {{decision.nature}} du {{decision.date}}, le {{decision.juridiction}} a fixé les modalités d'exercice du droit de visite et d'hébergement de {{parent_visiteur.civilite}} {{parent_visiteur.nom}} sur {{enfant.prenom}}, né(e) le {{enfant.date_naissance}}.

Ce droit s'exerce comme suit :
{{dvh.modalites}}

Or, {{parent_gardien.civilite}} {{parent_gardien.nom}} ne respecte pas les modalités ainsi fixées.

Les incidents suivants ont été constatés :
{{#each incidents}}
- {{this.date}} : {{this.description}}
{{/each}}

{{#if main_courante}}
{{parent_visiteur.civilite}} {{parent_visiteur.nom}} a déposé une main courante le {{main_courante.date}} auprès de {{main_courante.commissariat}}.
{{/if}}

{{#if mise_en_demeure}}
Une mise en demeure a été adressée à {{parent_gardien.civilite}} {{parent_gardien.nom}} le {{mise_en_demeure.date}}, demeurée sans effet.
{{/if}}

Ces manquements privent {{enfant.prenom}} de son droit fondamental à entretenir des relations personnelles avec {{parent_visiteur.civilite}} {{parent_visiteur.nom}}.`,
    variables: [
      { name: 'decision.nature', type: 'string', required: true },
      { name: 'decision.date', type: 'date', required: true },
      { name: 'decision.juridiction', type: 'string', required: true },
      { name: 'parent_visiteur.civilite', type: 'string', required: true },
      { name: 'parent_visiteur.nom', type: 'string', required: true },
      { name: 'parent_gardien.civilite', type: 'string', required: true },
      { name: 'parent_gardien.nom', type: 'string', required: true },
      { name: 'enfant.prenom', type: 'string', required: true },
      { name: 'enfant.date_naissance', type: 'date', required: true },
      { name: 'dvh.modalites', type: 'text', required: true },
      { name: 'incidents', type: 'array', required: true },
      { name: 'main_courante.date', type: 'date' },
      { name: 'main_courante.commissariat', type: 'string' },
      { name: 'mise_en_demeure.date', type: 'date' },
    ],
    tags: ['faits', 'famille', 'dvh', 'visite', 'hebergement'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 41,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé contestation autorité parentale',
    content: `I. RAPPEL DES FAITS

{{enfant.prenom}} {{enfant.nom}}, né(e) le {{enfant.date_naissance}}, est l'enfant de {{parent1.civilite}} {{parent1.prenom}} {{parent1.nom}} et de {{parent2.civilite}} {{parent2.prenom}} {{parent2.nom}}.

L'autorité parentale est actuellement exercée {{autorite_parentale.actuelle}}.

{{#if residence}}
La résidence de l'enfant est fixée chez {{residence.parent}}.
{{/if}}

{{parent_demandeur.civilite}} {{parent_demandeur.nom}} sollicite la modification des modalités d'exercice de l'autorité parentale pour les motifs suivants :

{{#each motifs}}
{{@index}}. {{this.titre}}
{{this.description}}
{{/each}}

{{#if interet_enfant}}
Ces modifications sont conformes à l'intérêt supérieur de l'enfant en ce que :
{{interet_enfant}}
{{/if}}

{{#if audition_enfant}}
{{enfant.prenom}} {{#if audition_enfant.capacite_discernement}}est en âge d'être entendu(e){{else}}n'est pas en âge d'être entendu(e){{/if}} au sens de l'article 388-1 du Code civil.
{{/if}}`,
    variables: [
      { name: 'enfant.prenom', type: 'string', required: true },
      { name: 'enfant.nom', type: 'string', required: true },
      { name: 'enfant.date_naissance', type: 'date', required: true },
      { name: 'parent1.civilite', type: 'string', required: true },
      { name: 'parent1.prenom', type: 'string', required: true },
      { name: 'parent1.nom', type: 'string', required: true },
      { name: 'parent2.civilite', type: 'string', required: true },
      { name: 'parent2.prenom', type: 'string', required: true },
      { name: 'parent2.nom', type: 'string', required: true },
      { name: 'autorite_parentale.actuelle', type: 'string', required: true },
      { name: 'residence.parent', type: 'string' },
      { name: 'parent_demandeur.civilite', type: 'string', required: true },
      { name: 'parent_demandeur.nom', type: 'string', required: true },
      { name: 'motifs', type: 'array', required: true },
      { name: 'interet_enfant', type: 'text' },
      { name: 'audition_enfant.capacite_discernement', type: 'boolean' },
    ],
    tags: ['faits', 'famille', 'autorite_parentale', 'enfant'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 42,
  },

  // ============================================
  // FAITS BLOCKS - Droit immobilier (5 blocs, displayOrder 43-47)
  // ============================================
  {
    category: BlockCategory.FAITS,
    title: 'Exposé loyers impayés détaillé',
    content: `I. RAPPEL DES FAITS

Par contrat de bail en date du {{bail.date}}, {{bailleur.civilite}} {{bailleur.nom}} a donné à bail à {{locataire.civilite}} {{locataire.nom}} les locaux situés {{logement.adresse}}, {{logement.codePostal}} {{logement.ville}}.

Ce bail a été consenti moyennant un loyer mensuel de {{loyer.montant}} € {{#if loyer.charges_comprises}}charges comprises{{else}}hors charges, outre des provisions pour charges de {{loyer.provisions}} €{{/if}}.

Le dépôt de garantie versé lors de l'entrée dans les lieux s'élève à {{depot_garantie}} €.

À compter du {{impayes.debut}}, {{locataire.civilite}} {{locataire.nom}} a cessé de régler régulièrement ses loyers et charges.

Le détail des impayés est le suivant :
{{#each impayes.detail}}
- {{this.mois}} : Dû {{this.du}} € / Payé {{this.paye}} € / Reste dû {{this.reste_du}} €
{{/each}}

TOTAL ARRIÉRÉS AU {{impayes.date_arrete}} : {{impayes.total}} €

{{#if commandement}}
Un commandement de payer visant la clause résolutoire a été délivré le {{commandement.date}} par {{commandement.huissier}} pour un montant de {{commandement.montant}} €.
Ce commandement est demeuré infructueux.
{{/if}}`,
    variables: [
      { name: 'bail.date', type: 'date', required: true },
      { name: 'bailleur.civilite', type: 'string', required: true },
      { name: 'bailleur.nom', type: 'string', required: true },
      { name: 'locataire.civilite', type: 'string', required: true },
      { name: 'locataire.nom', type: 'string', required: true },
      { name: 'logement.adresse', type: 'string', required: true },
      { name: 'logement.codePostal', type: 'string', required: true },
      { name: 'logement.ville', type: 'string', required: true },
      { name: 'loyer.montant', type: 'number', required: true },
      { name: 'loyer.charges_comprises', type: 'boolean' },
      { name: 'loyer.provisions', type: 'number' },
      { name: 'depot_garantie', type: 'number', required: true },
      { name: 'impayes.debut', type: 'date', required: true },
      { name: 'impayes.detail', type: 'array', required: true },
      { name: 'impayes.date_arrete', type: 'date', required: true },
      { name: 'impayes.total', type: 'number', required: true },
      { name: 'commandement.date', type: 'date' },
      { name: 'commandement.huissier', type: 'string' },
      { name: 'commandement.montant', type: 'number' },
    ],
    tags: ['faits', 'immobilier', 'loyers', 'impayes', 'bail'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 43,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé dégradations locatives',
    content: `I. RAPPEL DES FAITS

Par contrat de bail en date du {{bail.date}}, {{bailleur.civilite}} {{bailleur.nom}} a donné à bail à {{locataire.civilite}} {{locataire.nom}} les locaux situés {{logement.adresse}}, {{logement.codePostal}} {{logement.ville}}.

Un état des lieux d'entrée a été établi contradictoirement le {{edl_entree.date}}. Le logement était en {{edl_entree.etat}}.

{{#if fin_bail}}
Le bail a pris fin le {{fin_bail.date}}. Un état des lieux de sortie a été établi le {{edl_sortie.date}}.
{{/if}}

Les dégradations suivantes ont été constatées :
{{#each degradations}}
{{@index}}. {{this.localisation}} :
   - Nature : {{this.description}}
   - Coût de remise en état : {{this.cout}} €
{{/each}}

Le coût total des réparations locatives s'élève à {{cout_total}} €.

{{#if expert}}
Un expert {{expert.nom}} a été mandaté pour évaluer les dégradations. Son rapport du {{expert.date}} confirme ces constatations.
{{/if}}

Le dépôt de garantie de {{depot_garantie}} € ne couvre pas ces dégradations.

Le solde restant dû par {{locataire.civilite}} {{locataire.nom}} s'élève à {{solde_du}} €.`,
    variables: [
      { name: 'bail.date', type: 'date', required: true },
      { name: 'bailleur.civilite', type: 'string', required: true },
      { name: 'bailleur.nom', type: 'string', required: true },
      { name: 'locataire.civilite', type: 'string', required: true },
      { name: 'locataire.nom', type: 'string', required: true },
      { name: 'logement.adresse', type: 'string', required: true },
      { name: 'logement.codePostal', type: 'string', required: true },
      { name: 'logement.ville', type: 'string', required: true },
      { name: 'edl_entree.date', type: 'date', required: true },
      { name: 'edl_entree.etat', type: 'string', required: true },
      { name: 'fin_bail.date', type: 'date' },
      { name: 'edl_sortie.date', type: 'date' },
      { name: 'degradations', type: 'array', required: true },
      { name: 'cout_total', type: 'number', required: true },
      { name: 'expert.nom', type: 'string' },
      { name: 'expert.date', type: 'date' },
      { name: 'depot_garantie', type: 'number', required: true },
      { name: 'solde_du', type: 'number', required: true },
    ],
    tags: ['faits', 'immobilier', 'degradations', 'locatives', 'bail'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 44,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé trouble de jouissance',
    content: `I. RAPPEL DES FAITS

{{victime.civilite}} {{victime.nom}} est {{victime.qualite}} du bien situé {{bien.adresse}}, {{bien.codePostal}} {{bien.ville}}{{#if bail}}, en vertu d'un bail conclu le {{bail.date}}{{/if}}.

Depuis le {{troubles.debut}}, {{victime.civilite}} {{victime.nom}} subit des troubles de jouissance du fait de {{auteur.civilite}} {{auteur.nom}}, {{auteur.qualite}}.

Ces troubles consistent en :
{{#each troubles.liste}}
- {{this.type}} : {{this.description}}
  Fréquence : {{this.frequence}}
  {{#if this.temoins}}Témoins : {{this.temoins}}{{/if}}
{{/each}}

{{#if constats}}
Les constats suivants ont été établis :
{{#each constats}}
- {{this.date}} : {{this.auteur}} - {{this.objet}}
{{/each}}
{{/if}}

{{#if plaintes}}
Des plaintes ont été déposées les {{plaintes}}.
{{/if}}

{{#if mise_en_demeure}}
Une mise en demeure de cesser ces troubles a été adressée le {{mise_en_demeure.date}}, demeurée sans effet.
{{/if}}

Ces troubles causent à {{victime.civilite}} {{victime.nom}} un préjudice de jouissance évalué à {{prejudice_jouissance}} € ainsi qu'un préjudice moral.`,
    variables: [
      { name: 'victime.civilite', type: 'string', required: true },
      { name: 'victime.nom', type: 'string', required: true },
      { name: 'victime.qualite', type: 'string', required: true },
      { name: 'bien.adresse', type: 'string', required: true },
      { name: 'bien.codePostal', type: 'string', required: true },
      { name: 'bien.ville', type: 'string', required: true },
      { name: 'bail.date', type: 'date' },
      { name: 'troubles.debut', type: 'date', required: true },
      { name: 'auteur.civilite', type: 'string', required: true },
      { name: 'auteur.nom', type: 'string', required: true },
      { name: 'auteur.qualite', type: 'string', required: true },
      { name: 'troubles.liste', type: 'array', required: true },
      { name: 'constats', type: 'array' },
      { name: 'plaintes', type: 'string' },
      { name: 'mise_en_demeure.date', type: 'date' },
      { name: 'prejudice_jouissance', type: 'number', required: true },
    ],
    tags: ['faits', 'immobilier', 'trouble', 'jouissance', 'voisinage'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 45,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé vente immobilière annulée',
    content: `I. RAPPEL DES FAITS

Par acte {{acte.type}} en date du {{acte.date}}, {{vendeur.civilite}} {{vendeur.nom}} a vendu à {{acquereur.civilite}} {{acquereur.nom}} le bien immobilier situé {{bien.adresse}}, {{bien.codePostal}} {{bien.ville}}, cadastré {{bien.cadastre}}.

Le prix de vente a été fixé à {{prix}} €.

{{#if notaire}}
L'acte authentique a été reçu par Maître {{notaire.nom}}, Notaire à {{notaire.ville}}.
{{/if}}

{{#if vices}}
Postérieurement à la vente, l'acquéreur a découvert les vices suivants :
{{#each vices}}
- {{this.nature}} : {{this.description}}
  Découvert le : {{this.date_decouverte}}
  Coût de réparation estimé : {{this.cout}} €
{{/each}}
{{/if}}

{{#if dol}}
L'acquéreur a été victime de manœuvres dolosives de la part du vendeur consistant en :
{{dol.description}}
{{/if}}

{{#if expertise}}
Une expertise a été réalisée par {{expertise.expert}} le {{expertise.date}}. Le rapport conclut :
{{expertise.conclusions}}
{{/if}}

Ces éléments justifient l'annulation de la vente et la restitution du prix.`,
    variables: [
      { name: 'acte.type', type: 'string', required: true },
      { name: 'acte.date', type: 'date', required: true },
      { name: 'vendeur.civilite', type: 'string', required: true },
      { name: 'vendeur.nom', type: 'string', required: true },
      { name: 'acquereur.civilite', type: 'string', required: true },
      { name: 'acquereur.nom', type: 'string', required: true },
      { name: 'bien.adresse', type: 'string', required: true },
      { name: 'bien.codePostal', type: 'string', required: true },
      { name: 'bien.ville', type: 'string', required: true },
      { name: 'bien.cadastre', type: 'string' },
      { name: 'prix', type: 'number', required: true },
      { name: 'notaire.nom', type: 'string' },
      { name: 'notaire.ville', type: 'string' },
      { name: 'vices', type: 'array' },
      { name: 'dol.description', type: 'text' },
      { name: 'expertise.expert', type: 'string' },
      { name: 'expertise.date', type: 'date' },
      { name: 'expertise.conclusions', type: 'text' },
    ],
    tags: ['faits', 'immobilier', 'vente', 'annulation', 'vices'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 46,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé copropriété - charges impayées',
    content: `I. RAPPEL DES FAITS

{{debiteur.civilite}} {{debiteur.nom}} est propriétaire du lot n° {{lot.numero}} de la copropriété située {{copropriete.adresse}}, {{copropriete.codePostal}} {{copropriete.ville}}.

Ce lot représente {{lot.tantiemes}} tantièmes de la copropriété.

Le règlement de copropriété a été établi le {{copropriete.date_reglement}}.

{{debiteur.civilite}} {{debiteur.nom}} n'a pas réglé les charges de copropriété suivantes :

{{#each impayes}}
- Appel du {{this.date}} : {{this.montant}} € ({{this.nature}})
{{/each}}

TOTAL DES IMPAYÉS AU {{date_arrete}} : {{total_impayes}} € en principal.

{{#if mise_en_demeure}}
Une mise en demeure a été adressée le {{mise_en_demeure.date}}, demeurée sans effet.
{{/if}}

{{#if relances}}
Des relances ont été adressées les {{relances}}.
{{/if}}

Conformément à l'article 19-2 de la loi du 10 juillet 1965, le syndicat des copropriétaires est fondé à poursuivre le recouvrement de cette créance.`,
    variables: [
      { name: 'debiteur.civilite', type: 'string', required: true },
      { name: 'debiteur.nom', type: 'string', required: true },
      { name: 'lot.numero', type: 'string', required: true },
      { name: 'lot.tantiemes', type: 'number', required: true },
      { name: 'copropriete.adresse', type: 'string', required: true },
      { name: 'copropriete.codePostal', type: 'string', required: true },
      { name: 'copropriete.ville', type: 'string', required: true },
      { name: 'copropriete.date_reglement', type: 'date' },
      { name: 'impayes', type: 'array', required: true },
      { name: 'date_arrete', type: 'date', required: true },
      { name: 'total_impayes', type: 'number', required: true },
      { name: 'mise_en_demeure.date', type: 'date' },
      { name: 'relances', type: 'string' },
    ],
    tags: ['faits', 'immobilier', 'copropriete', 'charges', 'impayes'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 47,
  },

  // ============================================
  // FAITS BLOCKS - Droit commercial (7 blocs, displayOrder 48-54)
  // ============================================
  {
    category: BlockCategory.FAITS,
    title: 'Exposé concurrence déloyale',
    content: `I. RAPPEL DES FAITS

{{victime.raison_sociale}} est une société {{victime.forme}} immatriculée au RCS de {{victime.rcs}} sous le numéro {{victime.siret}}, ayant pour activité {{victime.activite}}.

{{auteur.raison_sociale}} exerce une activité concurrente depuis {{auteur.debut_activite}}.

{{victime.raison_sociale}} a constaté que {{auteur.raison_sociale}} se livre à des actes de concurrence déloyale consistant en :

{{#each actes_deloyaux}}
{{@index}}. {{this.type}} :
{{this.description}}
Date des constatations : {{this.date}}
{{#if this.preuves}}Preuves : {{this.preuves}}{{/if}}
{{/each}}

{{#if constat_huissier}}
Un constat d'huissier a été établi le {{constat_huissier.date}} par {{constat_huissier.nom}}.
{{/if}}

Ces agissements ont causé à {{victime.raison_sociale}} un préjudice économique se décomposant comme suit :
- Perte de chiffre d'affaires : {{prejudice.perte_ca}} €
- Atteinte à l'image : {{prejudice.image}} €
{{#if prejudice.autres}}
- Autres préjudices : {{prejudice.autres}}
{{/if}}`,
    variables: [
      { name: 'victime.raison_sociale', type: 'string', required: true },
      { name: 'victime.forme', type: 'string', required: true },
      { name: 'victime.rcs', type: 'string', required: true },
      { name: 'victime.siret', type: 'string', required: true },
      { name: 'victime.activite', type: 'string', required: true },
      { name: 'auteur.raison_sociale', type: 'string', required: true },
      { name: 'auteur.debut_activite', type: 'date' },
      { name: 'actes_deloyaux', type: 'array', required: true },
      { name: 'constat_huissier.date', type: 'date' },
      { name: 'constat_huissier.nom', type: 'string' },
      { name: 'prejudice.perte_ca', type: 'number', required: true },
      { name: 'prejudice.image', type: 'number' },
      { name: 'prejudice.autres', type: 'text' },
    ],
    tags: ['faits', 'commercial', 'concurrence', 'deloyale'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 48,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé rupture brutale relation commerciale',
    content: `I. RAPPEL DES FAITS

{{victime.raison_sociale}} entretient des relations commerciales avec {{auteur.raison_sociale}} depuis {{relation.debut}}, soit une durée de {{relation.duree}}.

Ces relations se caractérisaient par :
{{relation.caracteristiques}}

Le chiffre d'affaires réalisé avec {{auteur.raison_sociale}} représentait {{relation.ca_moyen}} € en moyenne annuelle, soit {{relation.pourcentage_ca}} % du chiffre d'affaires total de {{victime.raison_sociale}}.

{{#if relation.investissements}}
{{victime.raison_sociale}} avait réalisé des investissements spécifiques pour cette relation commerciale :
{{relation.investissements}}
{{/if}}

Le {{rupture.date}}, {{auteur.raison_sociale}} a notifié la cessation de la relation commerciale avec un préavis de {{rupture.preavis_accorde}}.

Or, compte tenu de l'ancienneté et de l'intensité de la relation commerciale, un préavis de {{rupture.preavis_du}} aurait dû être respecté conformément à l'article L. 442-1 II du Code de commerce.

Le préjudice résultant de cette rupture brutale est évalué à :
- Marge brute pendant la durée du préavis manquant : {{prejudice.marge_brute}} €
- Perte de valeur des investissements : {{prejudice.investissements}} €
{{#if prejudice.autres}}
- {{prejudice.autres}}
{{/if}}`,
    variables: [
      { name: 'victime.raison_sociale', type: 'string', required: true },
      { name: 'auteur.raison_sociale', type: 'string', required: true },
      { name: 'relation.debut', type: 'date', required: true },
      { name: 'relation.duree', type: 'string', required: true },
      { name: 'relation.caracteristiques', type: 'text', required: true },
      { name: 'relation.ca_moyen', type: 'number', required: true },
      { name: 'relation.pourcentage_ca', type: 'number', required: true },
      { name: 'relation.investissements', type: 'text' },
      { name: 'rupture.date', type: 'date', required: true },
      { name: 'rupture.preavis_accorde', type: 'string', required: true },
      { name: 'rupture.preavis_du', type: 'string', required: true },
      { name: 'prejudice.marge_brute', type: 'number', required: true },
      { name: 'prejudice.investissements', type: 'number' },
      { name: 'prejudice.autres', type: 'text' },
    ],
    tags: ['faits', 'commercial', 'rupture', 'brutale', 'L442-1'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 49,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé impayés fournisseur',
    content: `I. RAPPEL DES FAITS

{{fournisseur.raison_sociale}} est une société {{fournisseur.forme}} ayant pour activité {{fournisseur.activite}}.

{{fournisseur.raison_sociale}} a fourni à {{client.raison_sociale}} les prestations/marchandises suivantes :

{{#each factures}}
- Facture n° {{this.numero}} du {{this.date}} : {{this.montant}} € HT
  Objet : {{this.objet}}
  Échéance : {{this.echeance}}
{{/each}}

TOTAL DES FACTURES : {{total_ht}} € HT, soit {{total_ttc}} € TTC.

Ces factures sont demeurées impayées malgré :
{{#if relances}}
- Les relances des {{relances}}
{{/if}}
{{#if mise_en_demeure}}
- La mise en demeure du {{mise_en_demeure.date}} adressée par {{mise_en_demeure.mode}}
{{/if}}

{{#if reconnaissance_dette}}
{{client.raison_sociale}} a reconnu sa dette par {{reconnaissance_dette.mode}} le {{reconnaissance_dette.date}}.
{{/if}}

{{#if paiements_partiels}}
Des paiements partiels ont été effectués :
{{#each paiements_partiels}}
- {{this.date}} : {{this.montant}} €
{{/each}}
{{/if}}

Le solde restant dû à ce jour s'élève à {{solde_du}} €, outre les intérêts de retard.`,
    variables: [
      { name: 'fournisseur.raison_sociale', type: 'string', required: true },
      { name: 'fournisseur.forme', type: 'string', required: true },
      { name: 'fournisseur.activite', type: 'string', required: true },
      { name: 'client.raison_sociale', type: 'string', required: true },
      { name: 'factures', type: 'array', required: true },
      { name: 'total_ht', type: 'number', required: true },
      { name: 'total_ttc', type: 'number', required: true },
      { name: 'relances', type: 'string' },
      { name: 'mise_en_demeure.date', type: 'date' },
      { name: 'mise_en_demeure.mode', type: 'string' },
      { name: 'reconnaissance_dette.mode', type: 'string' },
      { name: 'reconnaissance_dette.date', type: 'date' },
      { name: 'paiements_partiels', type: 'array' },
      { name: 'solde_du', type: 'number', required: true },
    ],
    tags: ['faits', 'commercial', 'impayes', 'fournisseur', 'recouvrement'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 50,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé défaut de livraison',
    content: `I. RAPPEL DES FAITS

Par {{contrat.nature}} du {{contrat.date}}, {{acheteur.raison_sociale}} a commandé auprès de {{vendeur.raison_sociale}} :
{{commande.description}}

pour un montant total de {{commande.montant}} € {{#if commande.ttc}}TTC{{else}}HT{{/if}}.

{{#if acompte}}
Un acompte de {{acompte.montant}} € a été versé le {{acompte.date}}.
{{/if}}

La livraison était prévue pour le {{livraison.date_prevue}} à {{livraison.lieu}}.

Or, à ce jour :
{{#if livraison.totale}}
Aucune livraison n'a été effectuée.
{{else}}
Seuls les éléments suivants ont été livrés :
{{livraison.partielle}}
{{/if}}

{{#if relances}}
{{acheteur.raison_sociale}} a relancé {{vendeur.raison_sociale}} les {{relances}}.
{{/if}}

{{#if mise_en_demeure}}
Une mise en demeure de livrer a été adressée le {{mise_en_demeure.date}}, demeurée sans effet.
{{/if}}

Ce défaut de livraison cause à {{acheteur.raison_sociale}} un préjudice évalué comme suit :
{{prejudice}}`,
    variables: [
      { name: 'contrat.nature', type: 'string', required: true },
      { name: 'contrat.date', type: 'date', required: true },
      { name: 'acheteur.raison_sociale', type: 'string', required: true },
      { name: 'vendeur.raison_sociale', type: 'string', required: true },
      { name: 'commande.description', type: 'text', required: true },
      { name: 'commande.montant', type: 'number', required: true },
      { name: 'commande.ttc', type: 'boolean' },
      { name: 'acompte.montant', type: 'number' },
      { name: 'acompte.date', type: 'date' },
      { name: 'livraison.date_prevue', type: 'date', required: true },
      { name: 'livraison.lieu', type: 'string', required: true },
      { name: 'livraison.totale', type: 'boolean', required: true },
      { name: 'livraison.partielle', type: 'text' },
      { name: 'relances', type: 'string' },
      { name: 'mise_en_demeure.date', type: 'date' },
      { name: 'prejudice', type: 'text', required: true },
    ],
    tags: ['faits', 'commercial', 'livraison', 'inexecution'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 51,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé non-conformité marchandises',
    content: `I. RAPPEL DES FAITS

Par {{contrat.nature}} du {{contrat.date}}, {{acheteur.raison_sociale}} a commandé à {{vendeur.raison_sociale}} :
{{commande.description}}

La livraison a été effectuée le {{livraison.date}}.

Lors de la réception / à l'usage, les non-conformités suivantes ont été constatées :
{{#each non_conformites}}
{{@index}}. {{this.description}}
   - Caractéristique attendue : {{this.attendu}}
   - Caractéristique constatée : {{this.constate}}
   {{#if this.photos}}Photos : {{this.photos}}{{/if}}
{{/each}}

{{#if reserves}}
Des réserves ont été émises lors de la livraison : {{reserves}}
{{/if}}

{{#if denonciation}}
Ces non-conformités ont été dénoncées par {{denonciation.mode}} le {{denonciation.date}}, soit dans le délai {{#if denonciation.dans_delai}}légal / contractuel{{else}}raisonnable{{/if}}.
{{/if}}

{{#if expertise}}
Une expertise a été réalisée par {{expertise.expert}} le {{expertise.date}}, confirmant les non-conformités.
{{/if}}

{{acheteur.raison_sociale}} sollicite {{action_demandee}}.`,
    variables: [
      { name: 'contrat.nature', type: 'string', required: true },
      { name: 'contrat.date', type: 'date', required: true },
      { name: 'acheteur.raison_sociale', type: 'string', required: true },
      { name: 'vendeur.raison_sociale', type: 'string', required: true },
      { name: 'commande.description', type: 'text', required: true },
      { name: 'livraison.date', type: 'date', required: true },
      { name: 'non_conformites', type: 'array', required: true },
      { name: 'reserves', type: 'text' },
      { name: 'denonciation.mode', type: 'string', required: true },
      { name: 'denonciation.date', type: 'date', required: true },
      { name: 'denonciation.dans_delai', type: 'boolean' },
      { name: 'expertise.expert', type: 'string' },
      { name: 'expertise.date', type: 'date' },
      { name: 'action_demandee', type: 'string', required: true },
    ],
    tags: ['faits', 'commercial', 'non_conformite', 'vente'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 52,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé contrefaçon marque',
    content: `I. RAPPEL DES FAITS

{{titulaire.raison_sociale}} est titulaire de la marque «{{marque.denomination}}», enregistrée auprès de l'INPI sous le numéro {{marque.numero}} le {{marque.date_depot}}, pour désigner les produits/services suivants :
{{marque.classes}}

Cette marque est valablement renouvelée jusqu'au {{marque.date_expiration}}.

{{titulaire.raison_sociale}} a constaté que {{contrefacteur.raison_sociale}} commercialise des produits/services sous un signe identique ou similaire :
{{contrefacon.description}}

Ces actes de contrefaçon ont été constatés :
{{#each actes_contrefacon}}
- {{this.date}} : {{this.lieu}} - {{this.description}}
{{/each}}

{{#if saisie_contrefacon}}
Une saisie-contrefaçon a été pratiquée le {{saisie_contrefacon.date}} par {{saisie_contrefacon.huissier}}.
{{/if}}

{{#if constat}}
Un constat d'huissier a été établi le {{constat.date}}.
{{/if}}

Le préjudice subi par {{titulaire.raison_sociale}} est évalué comme suit :
- Gains manqués : {{prejudice.gains_manques}} €
- Atteinte à l'image de marque : {{prejudice.image}} €
- Préjudice moral : {{prejudice.moral}} €`,
    variables: [
      { name: 'titulaire.raison_sociale', type: 'string', required: true },
      { name: 'marque.denomination', type: 'string', required: true },
      { name: 'marque.numero', type: 'string', required: true },
      { name: 'marque.date_depot', type: 'date', required: true },
      { name: 'marque.classes', type: 'text', required: true },
      { name: 'marque.date_expiration', type: 'date', required: true },
      { name: 'contrefacteur.raison_sociale', type: 'string', required: true },
      { name: 'contrefacon.description', type: 'text', required: true },
      { name: 'actes_contrefacon', type: 'array', required: true },
      { name: 'saisie_contrefacon.date', type: 'date' },
      { name: 'saisie_contrefacon.huissier', type: 'string' },
      { name: 'constat.date', type: 'date' },
      { name: 'prejudice.gains_manques', type: 'number', required: true },
      { name: 'prejudice.image', type: 'number' },
      { name: 'prejudice.moral', type: 'number' },
    ],
    tags: ['faits', 'commercial', 'contrefacon', 'marque', 'propriete_intellectuelle'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 53,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé garantie non respectée',
    content: `I. RAPPEL DES FAITS

Le {{achat.date}}, {{acheteur.civilite}} {{acheteur.nom}} a acquis auprès de {{vendeur.raison_sociale}} :
{{produit.description}}

pour un prix de {{produit.prix}} €.

Ce produit bénéficiait d'une garantie {{garantie.type}} d'une durée de {{garantie.duree}}, courant jusqu'au {{garantie.expiration}}.

Le {{panne.date}}, {{acheteur.civilite}} {{acheteur.nom}} a constaté le dysfonctionnement suivant :
{{panne.description}}

Le {{demande_garantie.date}}, {{acheteur.civilite}} {{acheteur.nom}} s'est adressé à {{vendeur.raison_sociale}} pour faire jouer la garantie.

{{vendeur.raison_sociale}} a refusé la prise en charge au motif suivant :
{{refus.motif}}

Or, ce refus est injustifié car :
{{refus.contestation}}

{{#if expertise}}
Une expertise a été réalisée par {{expertise.expert}} le {{expertise.date}}, concluant :
{{expertise.conclusions}}
{{/if}}

{{acheteur.civilite}} {{acheteur.nom}} sollicite {{demande}}.`,
    variables: [
      { name: 'achat.date', type: 'date', required: true },
      { name: 'acheteur.civilite', type: 'string', required: true },
      { name: 'acheteur.nom', type: 'string', required: true },
      { name: 'vendeur.raison_sociale', type: 'string', required: true },
      { name: 'produit.description', type: 'text', required: true },
      { name: 'produit.prix', type: 'number', required: true },
      { name: 'garantie.type', type: 'string', required: true },
      { name: 'garantie.duree', type: 'string', required: true },
      { name: 'garantie.expiration', type: 'date', required: true },
      { name: 'panne.date', type: 'date', required: true },
      { name: 'panne.description', type: 'text', required: true },
      { name: 'demande_garantie.date', type: 'date', required: true },
      { name: 'refus.motif', type: 'text', required: true },
      { name: 'refus.contestation', type: 'text', required: true },
      { name: 'expertise.expert', type: 'string' },
      { name: 'expertise.date', type: 'date' },
      { name: 'expertise.conclusions', type: 'text' },
      { name: 'demande', type: 'string', required: true },
    ],
    tags: ['faits', 'commercial', 'garantie', 'consommation'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 54,
  },

  // ============================================
  // FAITS BLOCKS - Droit des sociétés (3 blocs, displayOrder 55-57)
  // ============================================
  {
    category: BlockCategory.FAITS,
    title: 'Exposé abus de biens sociaux',
    content: `I. RAPPEL DES FAITS

{{societe.raison_sociale}} est une {{societe.forme}} au capital de {{societe.capital}} €, immatriculée au RCS de {{societe.rcs}} sous le numéro {{societe.siret}}.

{{dirigeant.civilite}} {{dirigeant.nom}} exerce les fonctions de {{dirigeant.fonction}} depuis le {{dirigeant.date_nomination}}.

Il a été constaté que {{dirigeant.civilite}} {{dirigeant.nom}} a commis les actes suivants, contraires à l'intérêt social :

{{#each actes_abus}}
{{@index}}. {{this.date}} : {{this.description}}
   Montant concerné : {{this.montant}} €
   {{#if this.preuves}}Preuves : {{this.preuves}}{{/if}}
{{/each}}

Ces actes constituent des abus de biens sociaux au sens de l'article {{article_applicable}} du Code de commerce.

{{#if commissaire_comptes}}
Le Commissaire aux comptes a été alerté le {{commissaire_comptes.date_alerte}}.
{{/if}}

{{#if plainte}}
Une plainte a été déposée le {{plainte.date}} auprès de {{plainte.autorite}}.
{{/if}}

Le préjudice subi par la société s'élève à {{prejudice_total}} €.`,
    variables: [
      { name: 'societe.raison_sociale', type: 'string', required: true },
      { name: 'societe.forme', type: 'string', required: true },
      { name: 'societe.capital', type: 'number', required: true },
      { name: 'societe.rcs', type: 'string', required: true },
      { name: 'societe.siret', type: 'string', required: true },
      { name: 'dirigeant.civilite', type: 'string', required: true },
      { name: 'dirigeant.nom', type: 'string', required: true },
      { name: 'dirigeant.fonction', type: 'string', required: true },
      { name: 'dirigeant.date_nomination', type: 'date', required: true },
      { name: 'actes_abus', type: 'array', required: true },
      { name: 'article_applicable', type: 'string', required: true },
      { name: 'commissaire_comptes.date_alerte', type: 'date' },
      { name: 'plainte.date', type: 'date' },
      { name: 'plainte.autorite', type: 'string' },
      { name: 'prejudice_total', type: 'number', required: true },
    ],
    tags: ['faits', 'societes', 'abus', 'biens_sociaux', 'dirigeant'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 55,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé conflit entre associés',
    content: `I. RAPPEL DES FAITS

{{societe.raison_sociale}} est une {{societe.forme}} au capital de {{societe.capital}} €, constituée le {{societe.date_constitution}}.

Le capital social est réparti comme suit :
{{#each associes}}
- {{this.nom}} : {{this.parts}} parts ({{this.pourcentage}} %)
{{/each}}

Un conflit oppose les associés depuis le {{conflit.debut}} concernant :
{{conflit.objet}}

Les faits générateurs de ce conflit sont les suivants :
{{#each faits_conflit}}
{{@index}}. {{this.date}} : {{this.description}}
{{/each}}

{{#if ag_contestees}}
Les assemblées générales suivantes sont contestées :
{{#each ag_contestees}}
- AG du {{this.date}} : {{this.motif_contestation}}
{{/each}}
{{/if}}

{{#if blocage}}
Ce conflit a entraîné un blocage de la société se manifestant par :
{{blocage}}
{{/if}}

{{#if mediations}}
Des tentatives de médiation ont eu lieu les {{mediations}}, sans succès.
{{/if}}`,
    variables: [
      { name: 'societe.raison_sociale', type: 'string', required: true },
      { name: 'societe.forme', type: 'string', required: true },
      { name: 'societe.capital', type: 'number', required: true },
      { name: 'societe.date_constitution', type: 'date', required: true },
      { name: 'associes', type: 'array', required: true },
      { name: 'conflit.debut', type: 'date', required: true },
      { name: 'conflit.objet', type: 'text', required: true },
      { name: 'faits_conflit', type: 'array', required: true },
      { name: 'ag_contestees', type: 'array' },
      { name: 'blocage', type: 'text' },
      { name: 'mediations', type: 'string' },
    ],
    tags: ['faits', 'societes', 'conflit', 'associes'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 56,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé révocation de gérant',
    content: `I. RAPPEL DES FAITS

{{societe.raison_sociale}} est une {{societe.forme}} au capital de {{societe.capital}} €.

{{gerant.civilite}} {{gerant.nom}} a été nommé(e) gérant(e) de la société le {{gerant.date_nomination}}{{#if gerant.duree}}, pour une durée de {{gerant.duree}}{{/if}}.

{{#if gerant.remuneration}}
Sa rémunération était fixée à {{gerant.remuneration}} € {{gerant.periodicite}}.
{{/if}}

Par décision de l'assemblée générale du {{revocation.date}}, {{gerant.civilite}} {{gerant.nom}} a été révoqué(e) de ses fonctions de gérant.

{{#if revocation.motifs}}
Les motifs invoqués pour cette révocation sont les suivants :
{{revocation.motifs}}
{{/if}}

{{gerant.civilite}} {{gerant.nom}} conteste cette révocation pour les raisons suivantes :

{{#if contestation.justes_motifs}}
1. Sur l'absence de justes motifs :
{{contestation.justes_motifs}}
{{/if}}

{{#if contestation.procedure}}
2. Sur l'irrégularité de la procédure :
{{contestation.procedure}}
{{/if}}

{{#if contestation.abus}}
3. Sur le caractère abusif de la révocation :
{{contestation.abus}}
{{/if}}

{{gerant.civilite}} {{gerant.nom}} sollicite réparation du préjudice subi.`,
    variables: [
      { name: 'societe.raison_sociale', type: 'string', required: true },
      { name: 'societe.forme', type: 'string', required: true },
      { name: 'societe.capital', type: 'number', required: true },
      { name: 'gerant.civilite', type: 'string', required: true },
      { name: 'gerant.nom', type: 'string', required: true },
      { name: 'gerant.date_nomination', type: 'date', required: true },
      { name: 'gerant.duree', type: 'string' },
      { name: 'gerant.remuneration', type: 'number' },
      { name: 'gerant.periodicite', type: 'string' },
      { name: 'revocation.date', type: 'date', required: true },
      { name: 'revocation.motifs', type: 'text' },
      { name: 'contestation.justes_motifs', type: 'text' },
      { name: 'contestation.procedure', type: 'text' },
      { name: 'contestation.abus', type: 'text' },
    ],
    tags: ['faits', 'societes', 'revocation', 'gerant', 'mandat'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 57,
  },

  // ============================================
  // MOYENS BLOCKS - Code civil (15 blocs, displayOrder 58-72)
  // ============================================
  {
    category: BlockCategory.MOYENS,
    title: 'Article 1104 CC - Bonne foi contractuelle',
    content: `II. DISCUSSION

Sur le manquement à l'obligation de bonne foi

Aux termes de l'article 1104 du Code civil : "Les contrats doivent être négociés, formés et exécutés de bonne foi. Cette disposition est d'ordre public."

La jurisprudence constante précise que l'obligation de bonne foi implique pour les parties de se comporter de manière loyale et honnête dans l'exécution du contrat, en s'abstenant de tout comportement de nature à nuire aux intérêts légitimes de l'autre partie.

En l'espèce, {{partie_adverse}} a manqué à son obligation de bonne foi en :
{{manquements_bonne_foi}}

Ce comportement est d'autant plus fautif que :
{{circonstances_aggravantes}}

En conséquence, {{partie_adverse}} a engagé sa responsabilité contractuelle et doit être condamné(e) à réparer le préjudice causé à {{client.nom}}.`,
    variables: [
      { name: 'partie_adverse', type: 'string', required: true },
      { name: 'manquements_bonne_foi', type: 'text', required: true },
      { name: 'circonstances_aggravantes', type: 'text' },
      { name: 'client.nom', type: 'string', required: true },
    ],
    tags: ['moyens', 'code_civil', 'bonne_foi', '1104'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 58,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Article 1231-1 CC - Dommages-intérêts contractuels',
    content: `II. DISCUSSION

Sur les dommages-intérêts pour inexécution contractuelle

L'article 1231-1 du Code civil dispose : "Le débiteur est condamné, s'il y a lieu, au paiement de dommages et intérêts soit à raison de l'inexécution de l'obligation, soit à raison du retard dans l'exécution, s'il ne justifie pas que l'exécution a été empêchée par la force majeure."

Les conditions de mise en œuvre de la responsabilité contractuelle sont réunies :

1. Une obligation contractuelle : {{obligation_contractuelle}}

2. Une inexécution ou mauvaise exécution : {{inexecution}}

3. Un préjudice : {{prejudice}}

4. Un lien de causalité : le préjudice découle directement de l'inexécution constatée.

{{partie_adverse}} ne peut invoquer aucune cause d'exonération de responsabilité, et notamment pas la force majeure, dès lors que {{absence_force_majeure}}.

En conséquence, {{partie_adverse}} doit être condamné(e) au paiement de dommages-intérêts d'un montant de {{montant_di}} €.`,
    variables: [
      { name: 'obligation_contractuelle', type: 'text', required: true },
      { name: 'inexecution', type: 'text', required: true },
      { name: 'prejudice', type: 'text', required: true },
      { name: 'partie_adverse', type: 'string', required: true },
      { name: 'absence_force_majeure', type: 'text', required: true },
      { name: 'montant_di', type: 'number', required: true },
    ],
    tags: ['moyens', 'code_civil', 'dommages_interets', '1231-1'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 59,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Article 1240 CC - Responsabilité délictuelle',
    content: `II. DISCUSSION

Sur la responsabilité civile délictuelle

L'article 1240 du Code civil dispose : "Tout fait quelconque de l'homme, qui cause à autrui un dommage, oblige celui par la faute duquel il est arrivé à le réparer."

Les conditions de mise en œuvre de la responsabilité délictuelle sont réunies :

1. Une faute :
{{faute}}

2. Un dommage :
Le préjudice subi par {{victime.nom}} se décompose comme suit :
{{#if prejudice_materiel}}- Préjudice matériel : {{prejudice_materiel}} €{{/if}}
{{#if prejudice_moral}}- Préjudice moral : {{prejudice_moral}} €{{/if}}
{{#if prejudice_corporel}}- Préjudice corporel : {{prejudice_corporel}}{{/if}}

3. Un lien de causalité :
{{lien_causalite}}

En conséquence, la responsabilité civile délictuelle de {{auteur_faute}} est engagée et il doit être condamné à réparer intégralement le préjudice causé.`,
    variables: [
      { name: 'faute', type: 'text', required: true },
      { name: 'victime.nom', type: 'string', required: true },
      { name: 'prejudice_materiel', type: 'number' },
      { name: 'prejudice_moral', type: 'number' },
      { name: 'prejudice_corporel', type: 'text' },
      { name: 'lien_causalite', type: 'text', required: true },
      { name: 'auteur_faute', type: 'string', required: true },
    ],
    tags: ['moyens', 'code_civil', 'responsabilite', 'delictuelle', '1240'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 60,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Article 1343-5 CC - Délais de grâce',
    content: `II. DISCUSSION

Sur la demande de délais de paiement

L'article 1343-5 du Code civil dispose : "Le juge peut, compte tenu de la situation du débiteur et en considération des besoins du créancier, reporter ou échelonner, dans la limite de deux années, le paiement des sommes dues."

{{debiteur.civilite}} {{debiteur.nom}} sollicite l'octroi de délais de paiement en raison de sa situation financière actuelle.

La situation du débiteur justifie cette demande :
{{situation_debiteur}}

{{#if revenus}}
Ses revenus mensuels s'élèvent à {{revenus}} €.
{{/if}}

{{#if charges}}
Ses charges mensuelles s'élèvent à {{charges}} €.
{{/if}}

{{#if capacite_remboursement}}
{{debiteur.civilite}} {{debiteur.nom}} est en mesure de rembourser {{capacite_remboursement}} € par mois.
{{/if}}

La situation du créancier permet l'octroi de ces délais car :
{{situation_creancier}}

En conséquence, il y a lieu d'accorder à {{debiteur.civilite}} {{debiteur.nom}} des délais de paiement de {{duree_delais}}, avec des mensualités de {{montant_mensualites}} €.`,
    variables: [
      { name: 'debiteur.civilite', type: 'string', required: true },
      { name: 'debiteur.nom', type: 'string', required: true },
      { name: 'situation_debiteur', type: 'text', required: true },
      { name: 'revenus', type: 'number' },
      { name: 'charges', type: 'number' },
      { name: 'capacite_remboursement', type: 'number' },
      { name: 'situation_creancier', type: 'text', required: true },
      { name: 'duree_delais', type: 'string', required: true },
      { name: 'montant_mensualites', type: 'number', required: true },
    ],
    tags: ['moyens', 'code_civil', 'delais', 'grace', '1343-5'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 61,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Article 1353 CC - Charge de la preuve',
    content: `II. DISCUSSION

Sur la charge de la preuve

L'article 1353 du Code civil dispose : "Celui qui réclame l'exécution d'une obligation doit la prouver. Réciproquement, celui qui se prétend libéré doit justifier le paiement ou le fait qui a produit l'extinction de son obligation."

En l'espèce, {{partie_invoquant}} invoque {{fait_allegue}}.

Il lui appartient donc de rapporter la preuve de ses allégations.

Or, {{partie_invoquant}} ne produit aucune pièce de nature à établir {{element_a_prouver}}.

{{#if pieces_produites}}
Les pièces produites ({{pieces_produites}}) sont insuffisantes à rapporter cette preuve car :
{{insuffisance_preuves}}
{{/if}}

En application du principe "actori incumbit probatio", il y a lieu de débouter {{partie_invoquant}} de ses demandes, faute de preuve suffisante.

{{#if renversement}}
À titre subsidiaire, il est à noter que {{client.nom}} verse aux débats les pièces suivantes qui démontrent le contraire :
{{preuves_contraires}}
{{/if}}`,
    variables: [
      { name: 'partie_invoquant', type: 'string', required: true },
      { name: 'fait_allegue', type: 'text', required: true },
      { name: 'element_a_prouver', type: 'text', required: true },
      { name: 'pieces_produites', type: 'string' },
      { name: 'insuffisance_preuves', type: 'text' },
      { name: 'client.nom', type: 'string' },
      { name: 'renversement', type: 'boolean' },
      { name: 'preuves_contraires', type: 'text' },
    ],
    tags: ['moyens', 'code_civil', 'preuve', 'charge', '1353'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 62,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Articles 212 et suivants CC - Obligations entre époux',
    content: `II. DISCUSSION

Sur les obligations découlant du mariage

L'article 212 du Code civil dispose : "Les époux se doivent mutuellement respect, fidélité, secours, assistance."

L'article 214 du Code civil ajoute : "Si les conventions matrimoniales ne règlent pas la contribution des époux aux charges du mariage, ils y contribuent à proportion de leurs facultés respectives."

En l'espèce, {{conjoint_fautif.civilite}} {{conjoint_fautif.nom}} a manqué à ses obligations matrimoniales :

{{#if manquement_fidelite}}
1. Sur le devoir de fidélité :
{{manquement_fidelite}}
{{/if}}

{{#if manquement_secours}}
2. Sur le devoir de secours :
{{manquement_secours}}
{{/if}}

{{#if manquement_assistance}}
3. Sur le devoir d'assistance :
{{manquement_assistance}}
{{/if}}

{{#if manquement_contribution}}
4. Sur la contribution aux charges du mariage :
{{manquement_contribution}}
{{/if}}

Ces manquements constituent des fautes au sens de l'article 242 du Code civil, justifiant le prononcé du divorce aux torts exclusifs de {{conjoint_fautif.civilite}} {{conjoint_fautif.nom}}.`,
    variables: [
      { name: 'conjoint_fautif.civilite', type: 'string', required: true },
      { name: 'conjoint_fautif.nom', type: 'string', required: true },
      { name: 'manquement_fidelite', type: 'text' },
      { name: 'manquement_secours', type: 'text' },
      { name: 'manquement_assistance', type: 'text' },
      { name: 'manquement_contribution', type: 'text' },
    ],
    tags: ['moyens', 'code_civil', 'mariage', 'obligations', '212'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 63,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Article 371-1 CC - Autorité parentale',
    content: `II. DISCUSSION

Sur l'exercice de l'autorité parentale

L'article 371-1 du Code civil dispose : "L'autorité parentale est un ensemble de droits et de devoirs ayant pour finalité l'intérêt de l'enfant. Elle appartient aux parents jusqu'à la majorité ou l'émancipation de l'enfant pour le protéger dans sa sécurité, sa santé et sa moralité, pour assurer son éducation et permettre son développement, dans le respect dû à sa personne."

L'article 373-2 précise que "La séparation des parents est sans incidence sur les règles de dévolution de l'exercice de l'autorité parentale."

En l'espèce, l'intérêt de l'enfant {{enfant.prenom}} commande que :
{{interet_enfant}}

{{#if residence}}
S'agissant de la résidence de l'enfant :
{{residence.arguments}}
{{/if}}

{{#if dvh}}
S'agissant du droit de visite et d'hébergement :
{{dvh.arguments}}
{{/if}}

{{#if pension}}
S'agissant de la contribution à l'entretien et l'éducation :
{{pension.arguments}}
{{/if}}

La jurisprudence constante rappelle que l'intérêt supérieur de l'enfant est le critère déterminant (Cass. 1re civ., 18 mai 2005, n° 02-20.613).`,
    variables: [
      { name: 'enfant.prenom', type: 'string', required: true },
      { name: 'interet_enfant', type: 'text', required: true },
      { name: 'residence.arguments', type: 'text' },
      { name: 'dvh.arguments', type: 'text' },
      { name: 'pension.arguments', type: 'text' },
    ],
    tags: ['moyens', 'code_civil', 'autorite_parentale', 'enfant', '371-1'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 64,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Article 1719 CC - Obligations du bailleur',
    content: `II. DISCUSSION

Sur les obligations du bailleur

L'article 1719 du Code civil dispose que le bailleur est obligé, par la nature du contrat :
"1° De délivrer au preneur la chose louée et, s'il s'agit de son habitation principale, un logement décent ;
2° D'entretenir cette chose en état de servir à l'usage pour lequel elle a été louée ;
3° D'en faire jouir paisiblement le preneur pendant la durée du bail ;
4° D'assurer également la permanence et la qualité des plantations."

En l'espèce, {{bailleur.civilite}} {{bailleur.nom}} a manqué à ses obligations :

{{#if manquement_delivrance}}
1. Sur l'obligation de délivrance :
{{manquement_delivrance}}
{{/if}}

{{#if manquement_entretien}}
2. Sur l'obligation d'entretien :
{{manquement_entretien}}
{{/if}}

{{#if manquement_jouissance}}
3. Sur l'obligation de jouissance paisible :
{{manquement_jouissance}}
{{/if}}

Ces manquements justifient {{sanction_demandee}}.`,
    variables: [
      { name: 'bailleur.civilite', type: 'string', required: true },
      { name: 'bailleur.nom', type: 'string', required: true },
      { name: 'manquement_delivrance', type: 'text' },
      { name: 'manquement_entretien', type: 'text' },
      { name: 'manquement_jouissance', type: 'text' },
      { name: 'sanction_demandee', type: 'string', required: true },
    ],
    tags: ['moyens', 'code_civil', 'bail', 'bailleur', '1719'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 65,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Article 1728 CC - Obligations du locataire',
    content: `II. DISCUSSION

Sur les obligations du preneur

L'article 1728 du Code civil dispose que le preneur est tenu de deux obligations principales :
"1° D'user de la chose louée raisonnablement, et suivant la destination qui lui a été donnée par le bail, ou suivant celle présumée d'après les circonstances, à défaut de convention ;
2° De payer le prix du bail aux termes convenus."

En l'espèce, {{locataire.civilite}} {{locataire.nom}} a manqué à ses obligations :

{{#if manquement_usage}}
1. Sur l'obligation d'user raisonnablement de la chose :
{{manquement_usage}}
{{/if}}

{{#if manquement_paiement}}
2. Sur l'obligation de payer le loyer :
{{manquement_paiement}}
{{/if}}

{{#if manquement_entretien}}
3. Sur l'obligation d'entretien courant (article 1754 du Code civil) :
{{manquement_entretien}}
{{/if}}

Ces manquements justifient {{sanction_demandee}}.`,
    variables: [
      { name: 'locataire.civilite', type: 'string', required: true },
      { name: 'locataire.nom', type: 'string', required: true },
      { name: 'manquement_usage', type: 'text' },
      { name: 'manquement_paiement', type: 'text' },
      { name: 'manquement_entretien', type: 'text' },
      { name: 'sanction_demandee', type: 'string', required: true },
    ],
    tags: ['moyens', 'code_civil', 'bail', 'locataire', '1728'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 66,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Article 260 CC - Effets du divorce',
    content: `II. DISCUSSION

Sur les effets du divorce

L'article 260 du Code civil dispose : "La décision qui prononce le divorce dissout le mariage à la date à laquelle elle prend force de chose jugée."

{{#if prestation_compensatoire}}
A. Sur la prestation compensatoire

L'article 270 du Code civil dispose que l'un des époux peut être tenu de verser à l'autre une prestation destinée à compenser, autant qu'il est possible, la disparité que la rupture du mariage crée dans les conditions de vie respectives.

En l'espèce, la disparité est caractérisée :
- Revenus de {{epoux1.nom}} : {{epoux1.revenus}} €
- Revenus de {{epoux2.nom}} : {{epoux2.revenus}} €
- Durée du mariage : {{mariage.duree}}
- Âge des époux : {{epoux1.age}} ans / {{epoux2.age}} ans

{{arguments_prestation}}
{{/if}}

{{#if liquidation}}
B. Sur la liquidation du régime matrimonial

{{arguments_liquidation}}
{{/if}}`,
    variables: [
      { name: 'prestation_compensatoire', type: 'boolean' },
      { name: 'epoux1.nom', type: 'string' },
      { name: 'epoux1.revenus', type: 'number' },
      { name: 'epoux1.age', type: 'number' },
      { name: 'epoux2.nom', type: 'string' },
      { name: 'epoux2.revenus', type: 'number' },
      { name: 'epoux2.age', type: 'number' },
      { name: 'mariage.duree', type: 'string' },
      { name: 'arguments_prestation', type: 'text' },
      { name: 'liquidation', type: 'boolean' },
      { name: 'arguments_liquidation', type: 'text' },
    ],
    tags: ['moyens', 'code_civil', 'divorce', 'effets', '260'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 67,
  },

  // ============================================
  // MOYENS BLOCKS - Code du travail (5 blocs, displayOrder 68-72)
  // ============================================
  {
    category: BlockCategory.MOYENS,
    title: 'Article L1152-1 CT - Harcèlement moral',
    content: `II. DISCUSSION

Sur le harcèlement moral

L'article L. 1152-1 du Code du travail dispose : "Aucun salarié ne doit subir les agissements répétés de harcèlement moral qui ont pour objet ou pour effet une dégradation de ses conditions de travail susceptible de porter atteinte à ses droits et à sa dignité, d'altérer sa santé physique ou mentale ou de compromettre son avenir professionnel."

La jurisprudence (Cass. soc., 24 juin 2009, n° 07-43.994) précise que le harcèlement moral est constitué indépendamment de l'intention de son auteur.

En l'espèce, {{salarie.civilite}} {{salarie.nom}} établit des faits qui permettent de présumer l'existence d'un harcèlement moral :

{{#each faits_presomption}}
- {{this}}
{{/each}}

Conformément à l'article L. 1154-1 du Code du travail, il appartient désormais à {{employeur.nom}} de prouver que ces agissements ne sont pas constitutifs d'un harcèlement.

Les éléments produits par l'employeur ne suffisent pas à écarter la qualification de harcèlement moral car :
{{insuffisance_defense}}

En conséquence, le harcèlement moral est caractérisé et {{employeur.nom}} doit être condamné à réparer le préjudice subi.`,
    variables: [
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'faits_presomption', type: 'array', required: true },
      { name: 'insuffisance_defense', type: 'text', required: true },
    ],
    tags: ['moyens', 'code_travail', 'harcelement', 'moral', 'L1152-1'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 68,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Article L1235-3 CT - Indemnité licenciement sans cause',
    content: `II. DISCUSSION

Sur l'indemnisation du licenciement sans cause réelle et sérieuse

L'article L. 1235-3 du Code du travail, dans sa rédaction issue de l'ordonnance n° 2017-1387 du 22 septembre 2017, fixe un barème d'indemnisation en cas de licenciement sans cause réelle et sérieuse.

{{salarie.civilite}} {{salarie.nom}} justifie d'une ancienneté de {{anciennete}} années complètes.

En application du barème, l'indemnité est comprise entre :
- Minimum : {{indemnite_min}} mois de salaire brut
- Maximum : {{indemnite_max}} mois de salaire brut

Le salaire mensuel brut de référence s'élève à {{salaire_reference}} €.

{{#if circonstances_aggravantes}}
Compte tenu des circonstances particulières de l'espèce :
{{circonstances_aggravantes}}

Il y a lieu de retenir une indemnité de {{mois_demandes}} mois de salaire, soit {{montant_demande}} €.
{{/if}}

{{#if ecart_bareme}}
À titre subsidiaire, si le Tribunal estimait devoir faire application du barème malgré la Charte sociale européenne, l'indemnité devrait être fixée au maximum du barème.
{{/if}}`,
    variables: [
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'anciennete', type: 'number', required: true },
      { name: 'indemnite_min', type: 'number', required: true },
      { name: 'indemnite_max', type: 'number', required: true },
      { name: 'salaire_reference', type: 'number', required: true },
      { name: 'circonstances_aggravantes', type: 'text' },
      { name: 'mois_demandes', type: 'number' },
      { name: 'montant_demande', type: 'number' },
      { name: 'ecart_bareme', type: 'boolean' },
    ],
    tags: ['moyens', 'code_travail', 'licenciement', 'indemnite', 'L1235-3'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 69,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Article L1237-11 CT - Rupture conventionnelle',
    content: `II. DISCUSSION

Sur la nullité de la rupture conventionnelle

L'article L. 1237-11 du Code du travail dispose que l'employeur et le salarié peuvent convenir en commun des conditions de la rupture du contrat de travail qui les lie, cette rupture ne pouvant être imposée par l'une ou l'autre des parties.

La jurisprudence exige un consentement libre et éclairé des deux parties (Cass. soc., 23 mai 2013, n° 12-13.865).

En l'espèce, le consentement de {{salarie.civilite}} {{salarie.nom}} a été vicié :

{{#if contrainte}}
1. Sur l'existence d'une contrainte :
{{contrainte}}
{{/if}}

{{#if harcelement}}
2. Sur le contexte de harcèlement :
{{harcelement}}
{{/if}}

{{#if erreur}}
3. Sur l'erreur :
{{erreur}}
{{/if}}

{{#if procedure}}
4. Sur les irrégularités de procédure :
{{procedure}}
{{/if}}

En conséquence, la rupture conventionnelle doit être annulée et produire les effets d'un licenciement sans cause réelle et sérieuse.`,
    variables: [
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'contrainte', type: 'text' },
      { name: 'harcelement', type: 'text' },
      { name: 'erreur', type: 'text' },
      { name: 'procedure', type: 'text' },
    ],
    tags: ['moyens', 'code_travail', 'rupture_conventionnelle', 'nullite', 'L1237-11'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 70,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Article 700 CPC - Frais irrépétibles',
    content: `II. DISCUSSION

Sur l'article 700 du Code de procédure civile

L'article 700 du Code de procédure civile dispose : "Le juge condamne la partie tenue aux dépens ou qui perd son procès à payer à l'autre partie la somme qu'il détermine, au titre des frais exposés et non compris dans les dépens."

Il serait inéquitable de laisser à la charge de {{beneficiaire.nom}} les frais exposés et non compris dans les dépens.

Ces frais comprennent notamment :
{{#each frais}}
- {{this.nature}} : {{this.montant}} €
{{/each}}

En conséquence, {{partie_condamnee}} doit être condamné(e) à payer à {{beneficiaire.nom}} la somme de {{montant_article_700}} € au titre de l'article 700 du Code de procédure civile.

Cette somme est justifiée au regard de la complexité de l'affaire, du volume des pièces et écritures, et des diligences accomplies.`,
    variables: [
      { name: 'beneficiaire.nom', type: 'string', required: true },
      { name: 'frais', type: 'array' },
      { name: 'partie_condamnee', type: 'string', required: true },
      { name: 'montant_article_700', type: 'number', required: true },
    ],
    tags: ['moyens', 'cpc', 'article_700', 'frais'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 71,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Article L442-1 C. com - Rupture brutale',
    content: `II. DISCUSSION

Sur la rupture brutale des relations commerciales établies

L'article L. 442-1 II du Code de commerce dispose : "Engage la responsabilité de son auteur et l'oblige à réparer le préjudice causé le fait, par toute personne exerçant des activités de production, de distribution ou de services de rompre brutalement, même partiellement, une relation commerciale établie, en l'absence d'un préavis écrit qui tienne compte notamment de la durée de la relation commerciale, en référence aux usages du commerce ou aux accords interprofessionnels."

Les conditions de l'article L. 442-1 II sont réunies :

1. Une relation commerciale établie :
La relation commerciale entre les parties existe depuis {{relation.duree}}, ce qui caractérise une relation établie au sens de la jurisprudence (CA Paris, 7 mars 2013, n° 10/22596).

2. Une rupture brutale :
{{rupture.circonstances}}

3. Un préavis insuffisant :
Le préavis accordé de {{preavis_accorde}} est insuffisant au regard de l'ancienneté de la relation et des usages du secteur. Un préavis de {{preavis_raisonnable}} aurait dû être respecté.

Le préjudice s'analyse en la marge brute qu'aurait réalisée {{victime.nom}} pendant la durée du préavis manquant, soit {{prejudice.montant}} €.`,
    variables: [
      { name: 'relation.duree', type: 'string', required: true },
      { name: 'rupture.circonstances', type: 'text', required: true },
      { name: 'preavis_accorde', type: 'string', required: true },
      { name: 'preavis_raisonnable', type: 'string', required: true },
      { name: 'victime.nom', type: 'string', required: true },
      { name: 'prejudice.montant', type: 'number', required: true },
    ],
    tags: ['moyens', 'code_commerce', 'rupture_brutale', 'L442-1'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 72,
  },

  // ============================================
  // DISPOSITIF BLOCKS (10 blocs, displayOrder 73-82)
  // ============================================
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif résolution contrat + restitutions',
    content: `PAR CES MOTIFS

Vu les articles 1224 et suivants du Code civil,

PLAISE AU TRIBUNAL :

- PRONONCER la résolution du contrat conclu le {{contrat.date}} entre {{demandeur.nom}} et {{defendeur.nom}} aux torts exclusifs de {{partie_fautive}} ;

- ORDONNER les restitutions réciproques et en conséquence :
  * CONDAMNER {{partie_restitution}} à restituer à {{beneficiaire_restitution}} {{objet_restitution}} ;
  {{#if somme_restituee}}
  * CONDAMNER {{partie_restitution}} à restituer la somme de {{somme_restituee}} € ;
  {{/if}}

- CONDAMNER {{defendeur.nom}} à payer à {{demandeur.nom}} la somme de {{dommages_interets}} € à titre de dommages-intérêts en réparation du préjudice subi ;

- CONDAMNER {{defendeur.nom}} aux entiers dépens ;

- CONDAMNER {{defendeur.nom}} à payer à {{demandeur.nom}} la somme de {{article_700}} € au titre de l'article 700 du CPC ;

{{#if execution_provisoire}}
- ORDONNER l'exécution provisoire de la présente décision ;
{{/if}}

- DÉBOUTER {{defendeur.nom}} de l'ensemble de ses demandes.`,
    variables: [
      { name: 'contrat.date', type: 'date', required: true },
      { name: 'demandeur.nom', type: 'string', required: true },
      { name: 'defendeur.nom', type: 'string', required: true },
      { name: 'partie_fautive', type: 'string', required: true },
      { name: 'partie_restitution', type: 'string', required: true },
      { name: 'beneficiaire_restitution', type: 'string', required: true },
      { name: 'objet_restitution', type: 'string', required: true },
      { name: 'somme_restituee', type: 'number' },
      { name: 'dommages_interets', type: 'number', required: true },
      { name: 'article_700', type: 'number', required: true },
      { name: 'execution_provisoire', type: 'boolean' },
    ],
    tags: ['dispositif', 'resolution', 'contrat', 'restitution'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 73,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif pension alimentaire',
    content: `PAR CES MOTIFS

Vu les articles 203, 371-2 et 373-2-2 du Code civil,

PLAISE AU JUGE AUX AFFAIRES FAMILIALES :

- FIXER la contribution de {{debiteur.civilite}} {{debiteur.nom}} à l'entretien et l'éducation de {{enfant.prenom}} à la somme mensuelle de {{pension.montant}} € ;

- DIRE que cette contribution sera versée au plus tard le {{pension.echeance}} de chaque mois à {{creancier.civilite}} {{creancier.nom}} ;

- DIRE que cette contribution sera indexée sur l'indice des prix à la consommation de l'ensemble des ménages (série France entière hors tabac) et réévaluée automatiquement chaque année au {{pension.date_revalorisation}} ;

- RAPPELER que cette contribution est due jusqu'à ce que l'enfant soit en mesure de subvenir seul à ses besoins ;

{{#if arrieres}}
- CONDAMNER {{debiteur.civilite}} {{debiteur.nom}} au paiement des arriérés de pension alimentaire d'un montant de {{arrieres.montant}} € ;
{{/if}}

- CONDAMNER {{debiteur.civilite}} {{debiteur.nom}} aux dépens ;

- CONDAMNER {{debiteur.civilite}} {{debiteur.nom}} à payer à {{creancier.civilite}} {{creancier.nom}} la somme de {{article_700}} € au titre de l'article 700 du CPC.`,
    variables: [
      { name: 'debiteur.civilite', type: 'string', required: true },
      { name: 'debiteur.nom', type: 'string', required: true },
      { name: 'creancier.civilite', type: 'string', required: true },
      { name: 'creancier.nom', type: 'string', required: true },
      { name: 'enfant.prenom', type: 'string', required: true },
      { name: 'pension.montant', type: 'number', required: true },
      { name: 'pension.echeance', type: 'string', required: true },
      { name: 'pension.date_revalorisation', type: 'string', required: true },
      { name: 'arrieres.montant', type: 'number' },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'pension', 'alimentaire', 'famille'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 74,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif prestation compensatoire',
    content: `PAR CES MOTIFS

Vu les articles 270 et suivants du Code civil,

PLAISE AU JUGE AUX AFFAIRES FAMILIALES :

{{#if capital}}
- CONDAMNER {{debiteur.civilite}} {{debiteur.nom}} à verser à {{creancier.civilite}} {{creancier.nom}} une prestation compensatoire sous forme de capital d'un montant de {{capital.montant}} € ;

{{#if capital.echelonnement}}
- AUTORISER le versement de ce capital selon l'échéancier suivant :
{{capital.echelonnement}}
{{/if}}
{{/if}}

{{#if rente}}
- CONDAMNER {{debiteur.civilite}} {{debiteur.nom}} à verser à {{creancier.civilite}} {{creancier.nom}} une prestation compensatoire sous forme de rente viagère d'un montant mensuel de {{rente.montant}} € ;

- DIRE que cette rente sera indexée sur l'indice des prix à la consommation ;
{{/if}}

{{#if attribution_bien}}
- ATTRIBUER à {{creancier.civilite}} {{creancier.nom}}, à titre de prestation compensatoire, la propriété de {{attribution_bien.description}}, évaluée à {{attribution_bien.valeur}} € ;
{{/if}}

- CONDAMNER {{debiteur.civilite}} {{debiteur.nom}} aux dépens ;

- CONDAMNER {{debiteur.civilite}} {{debiteur.nom}} à payer à {{creancier.civilite}} {{creancier.nom}} la somme de {{article_700}} € au titre de l'article 700 du CPC.`,
    variables: [
      { name: 'debiteur.civilite', type: 'string', required: true },
      { name: 'debiteur.nom', type: 'string', required: true },
      { name: 'creancier.civilite', type: 'string', required: true },
      { name: 'creancier.nom', type: 'string', required: true },
      { name: 'capital.montant', type: 'number' },
      { name: 'capital.echelonnement', type: 'text' },
      { name: 'rente.montant', type: 'number' },
      { name: 'attribution_bien.description', type: 'string' },
      { name: 'attribution_bien.valeur', type: 'number' },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'prestation', 'compensatoire', 'divorce'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 75,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif droit de visite et hébergement',
    content: `PAR CES MOTIFS

Vu les articles 373-2 et suivants du Code civil,

PLAISE AU JUGE AUX AFFAIRES FAMILIALES :

- FIXER la résidence habituelle de {{enfant.prenom}} chez {{parent_gardien.civilite}} {{parent_gardien.nom}} ;

- FIXER le droit de visite et d'hébergement de {{parent_visiteur.civilite}} {{parent_visiteur.nom}} comme suit :

  * En période scolaire : {{dvh.periode_scolaire}}

  * Pendant les petites vacances scolaires : {{dvh.petites_vacances}}

  * Pendant les grandes vacances : {{dvh.grandes_vacances}}

  * Pour les fêtes : {{dvh.fetes}}

- DIRE que les trajets seront à la charge de {{trajets.charge}} ;

- DIRE que le parent chez lequel l'enfant ne réside pas habituellement devra être informé de tout événement important concernant la vie de l'enfant ;

{{#if mesures_particulieres}}
- ORDONNER les mesures particulières suivantes :
{{mesures_particulieres}}
{{/if}}

- CONDAMNER {{partie_perdante}} aux dépens.`,
    variables: [
      { name: 'enfant.prenom', type: 'string', required: true },
      { name: 'parent_gardien.civilite', type: 'string', required: true },
      { name: 'parent_gardien.nom', type: 'string', required: true },
      { name: 'parent_visiteur.civilite', type: 'string', required: true },
      { name: 'parent_visiteur.nom', type: 'string', required: true },
      { name: 'dvh.periode_scolaire', type: 'text', required: true },
      { name: 'dvh.petites_vacances', type: 'text', required: true },
      { name: 'dvh.grandes_vacances', type: 'text', required: true },
      { name: 'dvh.fetes', type: 'text', required: true },
      { name: 'trajets.charge', type: 'string', required: true },
      { name: 'mesures_particulieres', type: 'text' },
      { name: 'partie_perdante', type: 'string', required: true },
    ],
    tags: ['dispositif', 'dvh', 'visite', 'hebergement', 'famille'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 76,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif indemnités prud\'homales',
    content: `PAR CES MOTIFS

Vu les articles L. 1234-1 et suivants, L. 1235-1 et suivants du Code du travail,

PLAISE AU CONSEIL DE PRUD'HOMMES :

- DIRE ET JUGER que le licenciement de {{salarie.civilite}} {{salarie.nom}} est dépourvu de cause réelle et sérieuse ;

- CONDAMNER {{employeur.nom}} à payer à {{salarie.civilite}} {{salarie.nom}} les sommes suivantes :

  * {{indemnite_licenciement}} € au titre de l'indemnité légale/conventionnelle de licenciement ;

  * {{indemnite_preavis}} € au titre de l'indemnité compensatrice de préavis, outre {{cp_preavis}} € au titre des congés payés afférents ;

  * {{indemnite_sans_cause}} € à titre de dommages-intérêts pour licenciement sans cause réelle et sérieuse ;

  {{#if rappel_salaire}}
  * {{rappel_salaire}} € à titre de rappel de salaire, outre {{cp_rappel}} € au titre des congés payés afférents ;
  {{/if}}

  {{#if indemnite_irregularite}}
  * {{indemnite_irregularite}} € au titre de l'irrégularité de la procédure ;
  {{/if}}

- ORDONNER la remise des documents de fin de contrat conformes (certificat de travail, attestation Pôle emploi, solde de tout compte) sous astreinte de {{astreinte}} € par jour de retard ;

- CONDAMNER {{employeur.nom}} aux entiers dépens ;

- CONDAMNER {{employeur.nom}} à payer à {{salarie.civilite}} {{salarie.nom}} la somme de {{article_700}} € au titre de l'article 700 du CPC.`,
    variables: [
      { name: 'salarie.civilite', type: 'string', required: true },
      { name: 'salarie.nom', type: 'string', required: true },
      { name: 'employeur.nom', type: 'string', required: true },
      { name: 'indemnite_licenciement', type: 'number', required: true },
      { name: 'indemnite_preavis', type: 'number', required: true },
      { name: 'cp_preavis', type: 'number', required: true },
      { name: 'indemnite_sans_cause', type: 'number', required: true },
      { name: 'rappel_salaire', type: 'number' },
      { name: 'cp_rappel', type: 'number' },
      { name: 'indemnite_irregularite', type: 'number' },
      { name: 'astreinte', type: 'number', required: true },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'prudhommes', 'licenciement', 'indemnites'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 77,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif expertise judiciaire',
    content: `PAR CES MOTIFS

Vu les articles 143 et suivants du Code de procédure civile,

PLAISE AU TRIBUNAL :

Avant dire droit sur le fond,

- ORDONNER une mesure d'expertise judiciaire et désigner pour y procéder :
  {{expert.nom}}
  {{expert.adresse}}
  {{expert.specialite}}

Avec pour mission de :
{{#each mission}}
{{@index}}. {{this}}
{{/each}}

- DIRE que l'expert devra :
  * Convoquer les parties et leurs conseils à toutes les opérations d'expertise ;
  * Recueillir leurs observations et y répondre ;
  * Déposer un pré-rapport et recueillir les dires des parties ;
  * Déposer son rapport définitif au greffe dans un délai de {{delai_rapport}} à compter de sa saisine ;

- FIXER à {{provision}} € la provision à valoir sur les honoraires de l'expert, qui devra être consignée par {{partie_consignation}} auprès du Régisseur du Tribunal dans un délai de {{delai_consignation}} à compter de la signification de la présente décision ;

- DIRE que faute de consignation dans ce délai, la désignation de l'expert sera caduque ;

- RÉSERVER les dépens.`,
    variables: [
      { name: 'expert.nom', type: 'string', required: true },
      { name: 'expert.adresse', type: 'string', required: true },
      { name: 'expert.specialite', type: 'string', required: true },
      { name: 'mission', type: 'array', required: true },
      { name: 'delai_rapport', type: 'string', required: true },
      { name: 'provision', type: 'number', required: true },
      { name: 'partie_consignation', type: 'string', required: true },
      { name: 'delai_consignation', type: 'string', required: true },
    ],
    tags: ['dispositif', 'expertise', 'judiciaire', 'avant_dire_droit'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 78,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif astreinte',
    content: `PAR CES MOTIFS

PLAISE AU TRIBUNAL :

- CONDAMNER {{partie_condamnee}} à {{obligation}} ;

- ASSORTIR cette condamnation d'une ASTREINTE de {{astreinte_montant}} € par {{astreinte_periodicite}} de retard à compter de {{astreinte_point_depart}} ;

{{#if astreinte_provisoire}}
- DIRE que cette astreinte est provisoire ;
{{else}}
- DIRE que cette astreinte est définitive ;
{{/if}}

{{#if delai_execution}}
- DIRE que {{partie_condamnee}} disposera d'un délai de {{delai_execution}} pour s'exécuter avant que l'astreinte ne commence à courir ;
{{/if}}

- SE RÉSERVER la liquidation de l'astreinte ;

- CONDAMNER {{partie_condamnee}} aux dépens ;

- CONDAMNER {{partie_condamnee}} à payer à {{beneficiaire}} la somme de {{article_700}} € au titre de l'article 700 du CPC.`,
    variables: [
      { name: 'partie_condamnee', type: 'string', required: true },
      { name: 'obligation', type: 'text', required: true },
      { name: 'astreinte_montant', type: 'number', required: true },
      { name: 'astreinte_periodicite', type: 'string', required: true },
      { name: 'astreinte_point_depart', type: 'string', required: true },
      { name: 'astreinte_provisoire', type: 'boolean' },
      { name: 'delai_execution', type: 'string' },
      { name: 'beneficiaire', type: 'string', required: true },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'astreinte', 'execution'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 79,
  },

  // ============================================
  // SIGNATURE BLOCKS (6 blocs, displayOrder 80-85)
  // ============================================
  {
    category: BlockCategory.SIGNATURE,
    title: 'Signature société représentant légal',
    content: `Sous toutes réserves

Fait à {{lieu}}, le {{date_signature}}

Pour {{societe.raison_sociale}}
{{societe.forme}}
Représentée par {{representant.civilite}} {{representant.prenom}} {{representant.nom}}
En sa qualité de {{representant.qualite}}

Son Conseil,

Maître {{avocat.prenom}} {{avocat.nom}}
Avocat au Barreau de {{avocat.barreau}}
{{#if avocat.toque}}Toque n° {{avocat.toque}}{{/if}}`,
    variables: [
      { name: 'lieu', type: 'string', required: true },
      { name: 'date_signature', type: 'date', required: true },
      { name: 'societe.raison_sociale', type: 'string', required: true },
      { name: 'societe.forme', type: 'string', required: true },
      { name: 'representant.civilite', type: 'string', required: true },
      { name: 'representant.prenom', type: 'string', required: true },
      { name: 'representant.nom', type: 'string', required: true },
      { name: 'representant.qualite', type: 'string', required: true },
      { name: 'avocat.prenom', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'avocat.toque', type: 'string' },
    ],
    tags: ['signature', 'societe', 'representant'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 80,
  },
  {
    category: BlockCategory.SIGNATURE,
    title: 'Signature pluralité d\'avocats',
    content: `Sous toutes réserves

Fait à {{lieu}}, le {{date_signature}}

Pour {{client.civilite}} {{client.nom}},
Ses Conseils,

{{#each avocats}}
Maître {{this.prenom}} {{this.nom}}
Avocat au Barreau de {{this.barreau}}
{{#if this.toque}}Toque n° {{this.toque}}{{/if}}
{{#if this.specialite}}{{this.specialite}}{{/if}}

{{/each}}`,
    variables: [
      { name: 'lieu', type: 'string', required: true },
      { name: 'date_signature', type: 'date', required: true },
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'avocats', type: 'array', required: true },
    ],
    tags: ['signature', 'avocats', 'pluralite'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 81,
  },
  {
    category: BlockCategory.SIGNATURE,
    title: 'Signature avec mention RGPD',
    content: `Sous toutes réserves

Fait à {{lieu}}, le {{date_signature}}

Pour {{client.civilite}} {{client.nom}},
Son Conseil,

Maître {{avocat.prenom}} {{avocat.nom}}
Avocat au Barreau de {{avocat.barreau}}
{{#if avocat.toque}}Toque n° {{avocat.toque}}{{/if}}

---
Conformément au Règlement Général sur la Protection des Données (RGPD), les données personnelles contenues dans ce document sont traitées par le Cabinet {{cabinet.nom}} aux seules fins de gestion du dossier. Vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ces droits, contactez-nous à l'adresse : {{cabinet.email}}.`,
    variables: [
      { name: 'lieu', type: 'string', required: true },
      { name: 'date_signature', type: 'date', required: true },
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'avocat.prenom', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'avocat.toque', type: 'string' },
      { name: 'cabinet.nom', type: 'string', required: true },
      { name: 'cabinet.email', type: 'string', required: true },
    ],
    tags: ['signature', 'rgpd', 'donnees'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 82,
  },

  // ============================================
  // PROCEDURE BLOCKS (5 blocs, displayOrder 83-87)
  // ============================================
  {
    category: BlockCategory.CUSTOM,
    title: 'Constitution d\'avocat',
    content: `CONSTITUTION D'AVOCAT

Dans l'affaire opposant :

{{demandeur.civilite}} {{demandeur.nom}}
{{demandeur.qualite}}

à

{{defendeur.civilite}} {{defendeur.nom}}
{{defendeur.qualite}}

N° RG : {{affaire.numero_rg}}

Maître {{avocat.prenom}} {{avocat.nom}}, Avocat au Barreau de {{avocat.barreau}}, déclare se constituer pour {{client.civilite}} {{client.nom}}.

Toutes significations et notifications devront être faites à l'adresse suivante :
{{avocat.adresse}}
{{avocat.codePostal}} {{avocat.ville}}
Tél : {{avocat.telephone}}
Email : {{avocat.email}}
{{#if avocat.rpva}}RPVA : {{avocat.rpva}}{{/if}}

Fait à {{lieu}}, le {{date}}

Maître {{avocat.prenom}} {{avocat.nom}}`,
    variables: [
      { name: 'demandeur.civilite', type: 'string', required: true },
      { name: 'demandeur.nom', type: 'string', required: true },
      { name: 'demandeur.qualite', type: 'string', required: true },
      { name: 'defendeur.civilite', type: 'string', required: true },
      { name: 'defendeur.nom', type: 'string', required: true },
      { name: 'defendeur.qualite', type: 'string', required: true },
      { name: 'affaire.numero_rg', type: 'string', required: true },
      { name: 'avocat.prenom', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.barreau', type: 'string', required: true },
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'avocat.adresse', type: 'string', required: true },
      { name: 'avocat.codePostal', type: 'string', required: true },
      { name: 'avocat.ville', type: 'string', required: true },
      { name: 'avocat.telephone', type: 'string', required: true },
      { name: 'avocat.email', type: 'string', required: true },
      { name: 'avocat.rpva', type: 'string' },
      { name: 'lieu', type: 'string', required: true },
      { name: 'date', type: 'date', required: true },
    ],
    tags: ['procedure', 'constitution', 'avocat'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 83,
  },
  {
    category: BlockCategory.CUSTOM,
    title: 'Demande de renvoi',
    content: `TRIBUNAL {{juridiction.type}} DE {{juridiction.ville}}

N° RG : {{affaire.numero_rg}}

DEMANDE DE RENVOI

{{client.civilite}} {{client.nom}}, {{client.qualite}}, représenté(e) par Maître {{avocat.nom}}, a l'honneur de solliciter le renvoi de l'audience fixée au {{audience_initiale.date}} à {{audience_initiale.heure}}.

Motif de la demande de renvoi :
{{motif_renvoi}}

{{#if pieces_justificatives}}
Pièces justificatives jointes :
{{#each pieces_justificatives}}
- {{this}}
{{/each}}
{{/if}}

{{#if accord_adverse}}
L'avocat de la partie adverse a donné son accord à ce renvoi.
{{else}}
Cette demande de renvoi est présentée sans l'accord de la partie adverse, laquelle {{#if opposition_adverse}}s'y oppose{{else}}n'a pas été consultée{{/if}}.
{{/if}}

Le conseil de {{client.civilite}} {{client.nom}} sera disponible aux dates suivantes :
{{disponibilites}}

Fait à {{lieu}}, le {{date}}

Maître {{avocat.prenom}} {{avocat.nom}}`,
    variables: [
      { name: 'juridiction.type', type: 'string', required: true },
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'affaire.numero_rg', type: 'string', required: true },
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'client.qualite', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.prenom', type: 'string', required: true },
      { name: 'audience_initiale.date', type: 'date', required: true },
      { name: 'audience_initiale.heure', type: 'string', required: true },
      { name: 'motif_renvoi', type: 'text', required: true },
      { name: 'pieces_justificatives', type: 'array' },
      { name: 'accord_adverse', type: 'boolean' },
      { name: 'opposition_adverse', type: 'boolean' },
      { name: 'disponibilites', type: 'text', required: true },
      { name: 'lieu', type: 'string', required: true },
      { name: 'date', type: 'date', required: true },
    ],
    tags: ['procedure', 'renvoi', 'audience'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 84,
  },
  {
    category: BlockCategory.CUSTOM,
    title: 'Incident de communication de pièces',
    content: `TRIBUNAL {{juridiction.type}} DE {{juridiction.ville}}
{{#if chambre}}{{chambre}}{{/if}}

N° RG : {{affaire.numero_rg}}

INCIDENT DE COMMUNICATION DE PIÈCES

{{client.civilite}} {{client.nom}}, {{client.qualite}}, représenté(e) par Maître {{avocat.nom}},

Soulève un incident de communication de pièces à l'encontre de {{adverse.civilite}} {{adverse.nom}}.

En effet, malgré les demandes formulées les {{demandes_anterieures}}, {{adverse.civilite}} {{adverse.nom}} n'a pas communiqué les pièces suivantes :

{{#each pieces_reclamees}}
{{@index}}. {{this.description}}
   Pertinence : {{this.pertinence}}
{{/each}}

Ces pièces sont nécessaires car :
{{arguments_necessite}}

En application de l'article 11 du Code de procédure civile, il est demandé au Tribunal d'enjoindre à {{adverse.civilite}} {{adverse.nom}} de communiquer ces pièces sous astreinte de {{astreinte}} € par jour de retard.

Fait à {{lieu}}, le {{date}}

Maître {{avocat.prenom}} {{avocat.nom}}`,
    variables: [
      { name: 'juridiction.type', type: 'string', required: true },
      { name: 'juridiction.ville', type: 'string', required: true },
      { name: 'chambre', type: 'string' },
      { name: 'affaire.numero_rg', type: 'string', required: true },
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'client.qualite', type: 'string', required: true },
      { name: 'avocat.nom', type: 'string', required: true },
      { name: 'avocat.prenom', type: 'string', required: true },
      { name: 'adverse.civilite', type: 'string', required: true },
      { name: 'adverse.nom', type: 'string', required: true },
      { name: 'demandes_anterieures', type: 'string', required: true },
      { name: 'pieces_reclamees', type: 'array', required: true },
      { name: 'arguments_necessite', type: 'text', required: true },
      { name: 'astreinte', type: 'number', required: true },
      { name: 'lieu', type: 'string', required: true },
      { name: 'date', type: 'date', required: true },
    ],
    tags: ['procedure', 'incident', 'communication', 'pieces'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 85,
  },
  {
    category: BlockCategory.CUSTOM,
    title: 'Exception d\'incompétence',
    content: `EXCEPTION D'INCOMPÉTENCE

Conformément aux articles 73 et suivants du Code de procédure civile, {{client.civilite}} {{client.nom}} soulève l'incompétence du {{juridiction_saisie.type}} de {{juridiction_saisie.ville}}.

Motif de l'incompétence :
{{motif_incompetence}}

{{#if competence_territoriale}}
A. Sur l'incompétence territoriale

En application de l'article {{article_competence}}, la juridiction territorialement compétente est le {{juridiction_competente.type}} de {{juridiction_competente.ville}}.

En effet :
{{arguments_territoriaux}}
{{/if}}

{{#if competence_materielle}}
B. Sur l'incompétence matérielle

Le litige relève de la compétence du {{juridiction_competente.type}} en application de l'article {{article_competence}}.

En effet :
{{arguments_materiels}}
{{/if}}

PAR CES MOTIFS

Il est demandé au Tribunal de :

- SE DÉCLARER INCOMPÉTENT au profit du {{juridiction_competente.type}} de {{juridiction_competente.ville}} ;

- RENVOYER les parties à mieux se pourvoir ;

- CONDAMNER {{adverse.nom}} aux dépens.`,
    variables: [
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'juridiction_saisie.type', type: 'string', required: true },
      { name: 'juridiction_saisie.ville', type: 'string', required: true },
      { name: 'motif_incompetence', type: 'text', required: true },
      { name: 'competence_territoriale', type: 'boolean' },
      { name: 'competence_materielle', type: 'boolean' },
      { name: 'article_competence', type: 'string', required: true },
      { name: 'juridiction_competente.type', type: 'string', required: true },
      { name: 'juridiction_competente.ville', type: 'string', required: true },
      { name: 'arguments_territoriaux', type: 'text' },
      { name: 'arguments_materiels', type: 'text' },
      { name: 'adverse.nom', type: 'string', required: true },
    ],
    tags: ['procedure', 'exception', 'incompetence'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 86,
  },
  {
    category: BlockCategory.CUSTOM,
    title: 'Fin de non-recevoir',
    content: `FIN DE NON-RECEVOIR

Conformément à l'article 122 du Code de procédure civile, {{client.civilite}} {{client.nom}} oppose une fin de non-recevoir aux demandes de {{adverse.civilite}} {{adverse.nom}}.

{{#if defaut_qualite}}
A. Sur le défaut de qualité à agir

{{adverse.civilite}} {{adverse.nom}} n'a pas qualité pour agir en ce que :
{{arguments_qualite}}
{{/if}}

{{#if defaut_interet}}
B. Sur le défaut d'intérêt à agir

{{adverse.civilite}} {{adverse.nom}} n'a pas d'intérêt légitime à agir car :
{{arguments_interet}}
{{/if}}

{{#if prescription}}
C. Sur la prescription

L'action est prescrite en application de l'article {{article_prescription}} qui prévoit un délai de prescription de {{delai_prescription}}.

Le point de départ de la prescription doit être fixé au {{point_depart_prescription}}.

La prescription était donc acquise le {{date_prescription}}, soit antérieurement à l'introduction de l'instance.
{{/if}}

{{#if chose_jugee}}
D. Sur l'autorité de la chose jugée

Les mêmes demandes ont déjà été tranchées par {{decision_anterieure.juridiction}} le {{decision_anterieure.date}} (N° RG : {{decision_anterieure.rg}}).
{{/if}}

PAR CES MOTIFS

Il est demandé au Tribunal de DÉCLARER les demandes de {{adverse.civilite}} {{adverse.nom}} IRRECEVABLES.`,
    variables: [
      { name: 'client.civilite', type: 'string', required: true },
      { name: 'client.nom', type: 'string', required: true },
      { name: 'adverse.civilite', type: 'string', required: true },
      { name: 'adverse.nom', type: 'string', required: true },
      { name: 'defaut_qualite', type: 'boolean' },
      { name: 'arguments_qualite', type: 'text' },
      { name: 'defaut_interet', type: 'boolean' },
      { name: 'arguments_interet', type: 'text' },
      { name: 'prescription', type: 'boolean' },
      { name: 'article_prescription', type: 'string' },
      { name: 'delai_prescription', type: 'string' },
      { name: 'point_depart_prescription', type: 'date' },
      { name: 'date_prescription', type: 'date' },
      { name: 'chose_jugee', type: 'boolean' },
      { name: 'decision_anterieure.juridiction', type: 'string' },
      { name: 'decision_anterieure.date', type: 'date' },
      { name: 'decision_anterieure.rg', type: 'string' },
    ],
    tags: ['procedure', 'fin_non_recevoir', 'irrecevabilite'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 87,
  },
];

// ============================================
// SEED FUNCTION
// ============================================

export async function seedExtendedBlocks(cabinetId: string, userId: string) {
  console.log('Seeding extended document blocks...');

  let createdCount = 0;

  for (const block of extendedBlocks) {
    try {
      await prisma.documentBlock.create({
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
      createdCount++;
    } catch (error) {
      console.error(`Error creating block "${block.title}":`, error);
    }
  }

  console.log(`Created ${createdCount} extended blocks`);
  return createdCount;
}

// Run if called directly
if (require.main === module) {
  const cabinetId = process.argv[2];
  const userId = process.argv[3];

  if (!cabinetId || !userId) {
    console.error('Usage: npx tsx prisma/seeds/extended-blocks.seed.ts <cabinetId> <userId>');
    process.exit(1);
  }

  seedExtendedBlocks(cabinetId, userId)
    .then((count) => {
      console.log(`Successfully created ${count} blocks`);
    })
    .catch((e) => {
      console.error('Error during seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { extendedBlocks };
export type { ExtendedBlockSeed };
