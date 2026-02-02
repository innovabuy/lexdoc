import { PrismaClient, BlockCategory } from '@prisma/client';

const prisma = new PrismaClient();

interface DroitAffaireBlockSeed {
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
// BLOCS DROIT DES AFFAIRES ET CESSIONS (60 blocs)
// ============================================

const droitAffairesBlocks: DroitAffaireBlockSeed[] = [
  // ============================================
  // CATÉGORIE INTRO (10 blocs) - 151-160
  // ============================================
  {
    category: BlockCategory.INTRO,
    title: "Intro lettre d'intention (LOI)",
    content: `Objet : Lettre d'intention - Acquisition {{societe_cible.denomination}}

{{lieu}}, le {{date_courrier}}

Madame, Monsieur,

La société {{acquereur.denomination}}, {{acquereur.forme_juridique}} au capital de {{acquereur.capital}} euros, immatriculée au RCS de {{acquereur.rcs_ville}} sous le numéro {{acquereur.siret}}, dont le siège social est situé {{acquereur.siege_social}}, représentée par {{acquereur.representant}} en sa qualité de {{acquereur.qualite_representant}},

Ci-après dénommée "l'Acquéreur potentiel",

A l'honneur de vous faire part de son intérêt pour l'acquisition de la société {{societe_cible.denomination}}.

Dans le cadre de ce projet, nous vous confirmons notre intention d'acquérir {{pourcentage_acquisition}}% du capital social de {{societe_cible.denomination}} pour un prix estimé de {{prix_estime}} euros, sous réserve des résultats de l'audit préalable.`,
    variables: [
      { name: 'lieu', type: 'string', required: true },
      { name: 'date_courrier', type: 'date', required: true },
      { name: 'acquereur.denomination', type: 'string', required: true },
      { name: 'acquereur.forme_juridique', type: 'string', required: true },
      { name: 'acquereur.capital', type: 'number', required: true },
      { name: 'acquereur.rcs_ville', type: 'string', required: true },
      { name: 'acquereur.siret', type: 'string', required: true },
      { name: 'acquereur.siege_social', type: 'string', required: true },
      { name: 'acquereur.representant', type: 'string', required: true },
      { name: 'acquereur.qualite_representant', type: 'string', required: true },
      { name: 'societe_cible.denomination', type: 'string', required: true },
      { name: 'pourcentage_acquisition', type: 'number', required: true },
      { name: 'prix_estime', type: 'number', required: true },
    ],
    tags: ['droit_affaires', 'cession', 'loi', 'lettre_intention', 'intro'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 151,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Intro protocole cession fonds de commerce',
    content: `PROTOCOLE DE CESSION DE FONDS DE COMMERCE

ENTRE LES SOUSSIGNÉS :

{{cedant.civilite}} {{cedant.prenom}} {{cedant.nom}}
{{#if cedant.denomination}}Agissant pour le compte de la société {{cedant.denomination}}, {{cedant.forme_juridique}}{{/if}}
Demeurant/Siège social : {{cedant.adresse}}, {{cedant.code_postal}} {{cedant.ville}}
{{#if cedant.siret}}RCS {{cedant.rcs_ville}} - SIRET : {{cedant.siret}}{{/if}}

Ci-après dénommé "le Cédant",

D'UNE PART,

ET :

{{cessionnaire.civilite}} {{cessionnaire.prenom}} {{cessionnaire.nom}}
{{#if cessionnaire.denomination}}Agissant pour le compte de la société {{cessionnaire.denomination}}, {{cessionnaire.forme_juridique}}{{/if}}
Demeurant/Siège social : {{cessionnaire.adresse}}, {{cessionnaire.code_postal}} {{cessionnaire.ville}}
{{#if cessionnaire.siret}}RCS {{cessionnaire.rcs_ville}} - SIRET : {{cessionnaire.siret}}{{/if}}

Ci-après dénommé "le Cessionnaire",

D'AUTRE PART,

IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :`,
    variables: [
      { name: 'cedant.civilite', type: 'string' },
      { name: 'cedant.prenom', type: 'string' },
      { name: 'cedant.nom', type: 'string', required: true },
      { name: 'cedant.denomination', type: 'string' },
      { name: 'cedant.forme_juridique', type: 'string' },
      { name: 'cedant.adresse', type: 'string', required: true },
      { name: 'cedant.code_postal', type: 'string', required: true },
      { name: 'cedant.ville', type: 'string', required: true },
      { name: 'cedant.rcs_ville', type: 'string' },
      { name: 'cedant.siret', type: 'string' },
      { name: 'cessionnaire.civilite', type: 'string' },
      { name: 'cessionnaire.prenom', type: 'string' },
      { name: 'cessionnaire.nom', type: 'string', required: true },
      { name: 'cessionnaire.denomination', type: 'string' },
      { name: 'cessionnaire.forme_juridique', type: 'string' },
      { name: 'cessionnaire.adresse', type: 'string', required: true },
      { name: 'cessionnaire.code_postal', type: 'string', required: true },
      { name: 'cessionnaire.ville', type: 'string', required: true },
      { name: 'cessionnaire.rcs_ville', type: 'string' },
      { name: 'cessionnaire.siret', type: 'string' },
    ],
    tags: ['droit_affaires', 'cession', 'fonds_commerce', 'protocole', 'intro'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 152,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Intro protocole cession parts sociales',
    content: `PROTOCOLE DE CESSION DE PARTS SOCIALES

ENTRE LES SOUSSIGNÉS :

{{cedant.civilite}} {{cedant.prenom}} {{cedant.nom}}
Né(e) le {{cedant.date_naissance}} à {{cedant.lieu_naissance}}
Demeurant : {{cedant.adresse}}, {{cedant.code_postal}} {{cedant.ville}}
De nationalité {{cedant.nationalite}}

Propriétaire de {{nombre_parts_cedees}} parts sociales de la société {{societe.denomination}}, numérotées de {{numero_debut}} à {{numero_fin}},

Ci-après dénommé "le Cédant",

D'UNE PART,

ET :

{{cessionnaire.civilite}} {{cessionnaire.prenom}} {{cessionnaire.nom}}
{{#if cessionnaire.denomination}}La société {{cessionnaire.denomination}}, {{cessionnaire.forme_juridique}}, RCS {{cessionnaire.rcs_ville}} n° {{cessionnaire.siret}}{{/if}}
Demeurant/Siège : {{cessionnaire.adresse}}, {{cessionnaire.code_postal}} {{cessionnaire.ville}}

Ci-après dénommé "le Cessionnaire",

D'AUTRE PART,

PRÉAMBULE :

La société {{societe.denomination}}, {{societe.forme_juridique}} au capital de {{societe.capital}} euros, immatriculée au RCS de {{societe.rcs_ville}} sous le numéro {{societe.siret}}, dont le siège social est situé {{societe.siege_social}},

IL A ÉTÉ EXPOSÉ ET CONVENU CE QUI SUIT :`,
    variables: [
      { name: 'cedant.civilite', type: 'string', required: true },
      { name: 'cedant.prenom', type: 'string', required: true },
      { name: 'cedant.nom', type: 'string', required: true },
      { name: 'cedant.date_naissance', type: 'date', required: true },
      { name: 'cedant.lieu_naissance', type: 'string', required: true },
      { name: 'cedant.adresse', type: 'string', required: true },
      { name: 'cedant.code_postal', type: 'string', required: true },
      { name: 'cedant.ville', type: 'string', required: true },
      { name: 'cedant.nationalite', type: 'string', required: true },
      { name: 'nombre_parts_cedees', type: 'number', required: true },
      { name: 'numero_debut', type: 'number', required: true },
      { name: 'numero_fin', type: 'number', required: true },
      { name: 'cessionnaire.civilite', type: 'string' },
      { name: 'cessionnaire.prenom', type: 'string' },
      { name: 'cessionnaire.nom', type: 'string', required: true },
      { name: 'cessionnaire.denomination', type: 'string' },
      { name: 'cessionnaire.forme_juridique', type: 'string' },
      { name: 'cessionnaire.rcs_ville', type: 'string' },
      { name: 'cessionnaire.siret', type: 'string' },
      { name: 'cessionnaire.adresse', type: 'string', required: true },
      { name: 'cessionnaire.code_postal', type: 'string', required: true },
      { name: 'cessionnaire.ville', type: 'string', required: true },
      { name: 'societe.denomination', type: 'string', required: true },
      { name: 'societe.forme_juridique', type: 'string', required: true },
      { name: 'societe.capital', type: 'number', required: true },
      { name: 'societe.rcs_ville', type: 'string', required: true },
      { name: 'societe.siret', type: 'string', required: true },
      { name: 'societe.siege_social', type: 'string', required: true },
    ],
    tags: ['droit_affaires', 'cession', 'parts_sociales', 'protocole', 'intro'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 153,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Intro statuts SAS',
    content: `STATUTS

{{societe.denomination}}

Société par Actions Simplifiée
au capital de {{societe.capital}} euros

Siège social : {{societe.siege_social}}

Les soussignés :

{{#each fondateurs}}
- {{this.civilite}} {{this.prenom}} {{this.nom}}, né(e) le {{this.date_naissance}} à {{this.lieu_naissance}}, de nationalité {{this.nationalite}}, demeurant {{this.adresse}}, {{this.code_postal}} {{this.ville}}, souscrivant {{this.nombre_actions}} actions de {{../valeur_nominale}} euros chacune, soit {{this.apport}} euros ;
{{/each}}

Ont établi ainsi qu'il suit les statuts de la société par actions simplifiée qu'ils ont décidé de constituer.`,
    variables: [
      { name: 'societe.denomination', type: 'string', required: true },
      { name: 'societe.capital', type: 'number', required: true },
      { name: 'societe.siege_social', type: 'string', required: true },
      { name: 'valeur_nominale', type: 'number', required: true },
      { name: 'fondateurs', type: 'array', required: true },
    ],
    tags: ['droit_affaires', 'societes', 'sas', 'statuts', 'intro'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 154,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Intro statuts SARL',
    content: `STATUTS

{{societe.denomination}}

Société à Responsabilité Limitée
au capital de {{societe.capital}} euros

Siège social : {{societe.siege_social}}

Les soussignés :

{{#each associes}}
- {{this.civilite}} {{this.prenom}} {{this.nom}}, né(e) le {{this.date_naissance}} à {{this.lieu_naissance}}, de nationalité {{this.nationalite}}, demeurant {{this.adresse}}, {{this.code_postal}} {{this.ville}}, souscrivant {{this.nombre_parts}} parts sociales de {{../valeur_nominale}} euros chacune, soit {{this.apport}} euros ;
{{/each}}

Ont établi ainsi qu'il suit les statuts de la société à responsabilité limitée qu'ils ont décidé de constituer entre eux.`,
    variables: [
      { name: 'societe.denomination', type: 'string', required: true },
      { name: 'societe.capital', type: 'number', required: true },
      { name: 'societe.siege_social', type: 'string', required: true },
      { name: 'valeur_nominale', type: 'number', required: true },
      { name: 'associes', type: 'array', required: true },
    ],
    tags: ['droit_affaires', 'societes', 'sarl', 'statuts', 'intro'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 155,
  },
  {
    category: BlockCategory.INTRO,
    title: "Intro pacte d'associés",
    content: `PACTE D'ASSOCIÉS

{{societe.denomination}}

ENTRE LES SOUSSIGNÉS :

{{#each associes}}
{{this.civilite}} {{this.prenom}} {{this.nom}}{{#if this.denomination}}, représentant la société {{this.denomination}}{{/if}}
Demeurant/Siège : {{this.adresse}}, {{this.code_postal}} {{this.ville}}
Détenant {{this.pourcentage}}% du capital social, soit {{this.nombre_titres}} {{../type_titres}}
{{/each}}

Ci-après dénommés ensemble "les Associés" ou "les Parties",

PRÉAMBULE :

Les Parties sont associées au sein de la société {{societe.denomination}}, {{societe.forme_juridique}} au capital de {{societe.capital}} euros, immatriculée au RCS de {{societe.rcs_ville}} sous le numéro {{societe.siret}} (ci-après la "Société").

Les Parties ont souhaité organiser leurs relations au sein de la Société en complétant les dispositions statutaires par le présent pacte.

IL A ÉTÉ CONVENU CE QUI SUIT :`,
    variables: [
      { name: 'societe.denomination', type: 'string', required: true },
      { name: 'societe.forme_juridique', type: 'string', required: true },
      { name: 'societe.capital', type: 'number', required: true },
      { name: 'societe.rcs_ville', type: 'string', required: true },
      { name: 'societe.siret', type: 'string', required: true },
      { name: 'type_titres', type: 'string', required: true },
      { name: 'associes', type: 'array', required: true },
    ],
    tags: ['droit_affaires', 'societes', 'pacte_associes', 'intro'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 156,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Intro PV assemblée générale',
    content: `{{societe.denomination}}
{{societe.forme_juridique}} au capital de {{societe.capital}} euros
Siège social : {{societe.siege_social}}
RCS {{societe.rcs_ville}} {{societe.siret}}

PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE {{type_ag}}
DU {{date_ag}}

L'an {{annee}}, le {{date_ag}} à {{heure_ag}},

Les {{type_associes}} de la société {{societe.denomination}} se sont réunis en Assemblée Générale {{type_ag}} au siège social{{#if autre_lieu}}, {{autre_lieu}}{{/if}}, sur convocation du {{convocateur}} en date du {{date_convocation}}.

Il a été établi une feuille de présence, signée par chaque {{type_associe_singulier}} présent ou représenté.

{{#if quorum_atteint}}
Le quorum étant atteint, l'Assemblée peut valablement délibérer.
{{else}}
Le quorum n'étant pas atteint, une nouvelle assemblée devra être convoquée.
{{/if}}

L'Assemblée est présidée par {{president_seance}}, {{qualite_president}}.

{{#if scrutateurs}}Le Président désigne comme scrutateurs : {{scrutateurs}}.{{/if}}

{{secretaire}} est désigné(e) comme secrétaire de séance.

Le Président dépose sur le bureau et met à la disposition des {{type_associes}} :
- Les copies des lettres de convocation adressées aux {{type_associes}}
- La feuille de présence
- {{#if rapport_gestion}}Le rapport de gestion du {{organe_direction}}{{/if}}
- {{#if rapport_cac}}Le rapport du Commissaire aux comptes{{/if}}
- Le texte des résolutions proposées

ORDRE DU JOUR :
{{ordre_du_jour}}`,
    variables: [
      { name: 'societe.denomination', type: 'string', required: true },
      { name: 'societe.forme_juridique', type: 'string', required: true },
      { name: 'societe.capital', type: 'number', required: true },
      { name: 'societe.siege_social', type: 'string', required: true },
      { name: 'societe.rcs_ville', type: 'string', required: true },
      { name: 'societe.siret', type: 'string', required: true },
      { name: 'type_ag', type: 'string', required: true },
      { name: 'date_ag', type: 'date', required: true },
      { name: 'annee', type: 'string', required: true },
      { name: 'heure_ag', type: 'string', required: true },
      { name: 'type_associes', type: 'string', required: true },
      { name: 'type_associe_singulier', type: 'string', required: true },
      { name: 'autre_lieu', type: 'string' },
      { name: 'convocateur', type: 'string', required: true },
      { name: 'date_convocation', type: 'date', required: true },
      { name: 'quorum_atteint', type: 'boolean', required: true },
      { name: 'president_seance', type: 'string', required: true },
      { name: 'qualite_president', type: 'string', required: true },
      { name: 'scrutateurs', type: 'string' },
      { name: 'secretaire', type: 'string', required: true },
      { name: 'rapport_gestion', type: 'boolean' },
      { name: 'organe_direction', type: 'string' },
      { name: 'rapport_cac', type: 'boolean' },
      { name: 'ordre_du_jour', type: 'text', required: true },
    ],
    tags: ['droit_affaires', 'societes', 'assemblee_generale', 'pv', 'intro'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 157,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Intro contrat de distribution',
    content: `CONTRAT DE DISTRIBUTION {{#if exclusif}}EXCLUSIVE{{/if}}

ENTRE LES SOUSSIGNÉS :

La société {{fournisseur.denomination}}, {{fournisseur.forme_juridique}} au capital de {{fournisseur.capital}} euros, immatriculée au RCS de {{fournisseur.rcs_ville}} sous le numéro {{fournisseur.siret}}, dont le siège social est situé {{fournisseur.siege_social}}, représentée par {{fournisseur.representant}}, dûment habilité(e) aux fins des présentes,

Ci-après dénommée "le Fournisseur",

D'UNE PART,

ET :

La société {{distributeur.denomination}}, {{distributeur.forme_juridique}} au capital de {{distributeur.capital}} euros, immatriculée au RCS de {{distributeur.rcs_ville}} sous le numéro {{distributeur.siret}}, dont le siège social est situé {{distributeur.siege_social}}, représentée par {{distributeur.representant}}, dûment habilité(e) aux fins des présentes,

Ci-après dénommée "le Distributeur",

D'AUTRE PART,

Ci-après dénommées ensemble "les Parties",

PRÉAMBULE :

Le Fournisseur exerce une activité de {{activite_fournisseur}} et commercialise notamment les produits suivants : {{produits_concernes}}.

Le Distributeur exerce une activité de {{activite_distributeur}} et souhaite distribuer les produits du Fournisseur sur le territoire défini ci-après.

IL A ÉTÉ CONVENU CE QUI SUIT :`,
    variables: [
      { name: 'exclusif', type: 'boolean' },
      { name: 'fournisseur.denomination', type: 'string', required: true },
      { name: 'fournisseur.forme_juridique', type: 'string', required: true },
      { name: 'fournisseur.capital', type: 'number', required: true },
      { name: 'fournisseur.rcs_ville', type: 'string', required: true },
      { name: 'fournisseur.siret', type: 'string', required: true },
      { name: 'fournisseur.siege_social', type: 'string', required: true },
      { name: 'fournisseur.representant', type: 'string', required: true },
      { name: 'distributeur.denomination', type: 'string', required: true },
      { name: 'distributeur.forme_juridique', type: 'string', required: true },
      { name: 'distributeur.capital', type: 'number', required: true },
      { name: 'distributeur.rcs_ville', type: 'string', required: true },
      { name: 'distributeur.siret', type: 'string', required: true },
      { name: 'distributeur.siege_social', type: 'string', required: true },
      { name: 'distributeur.representant', type: 'string', required: true },
      { name: 'activite_fournisseur', type: 'string', required: true },
      { name: 'produits_concernes', type: 'text', required: true },
      { name: 'activite_distributeur', type: 'string', required: true },
    ],
    tags: ['droit_affaires', 'commercial', 'distribution', 'contrat', 'intro'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 158,
  },
  {
    category: BlockCategory.INTRO,
    title: 'Intro contrat de franchise',
    content: `CONTRAT DE FRANCHISE

ENTRE LES SOUSSIGNÉS :

La société {{franchiseur.denomination}}, {{franchiseur.forme_juridique}} au capital de {{franchiseur.capital}} euros, immatriculée au RCS de {{franchiseur.rcs_ville}} sous le numéro {{franchiseur.siret}}, dont le siège social est situé {{franchiseur.siege_social}}, représentée par {{franchiseur.representant}},

Propriétaire de la marque "{{marque}}" déposée auprès de l'INPI sous le numéro {{numero_depot_marque}},

Ci-après dénommée "le Franchiseur",

D'UNE PART,

ET :

{{#if franchise.denomination}}La société {{franchise.denomination}}, {{franchise.forme_juridique}}{{else}}{{franchise.civilite}} {{franchise.prenom}} {{franchise.nom}}{{/if}}
{{#if franchise.siret}}Immatriculée au RCS de {{franchise.rcs_ville}} sous le numéro {{franchise.siret}}{{/if}}
Siège/Domicile : {{franchise.adresse}}, {{franchise.code_postal}} {{franchise.ville}}
{{#if franchise.representant}}Représentée par {{franchise.representant}}{{/if}}

Ci-après dénommé(e) "le Franchisé",

D'AUTRE PART,

PRÉAMBULE :

Le Franchiseur a développé un concept commercial original sous l'enseigne "{{enseigne}}", comprenant notamment :
- Un savoir-faire spécifique transmissible
- Une assistance technique et commerciale
- Des signes distinctifs (marque, enseigne, logo)

Le Franchisé souhaite exploiter ce concept dans le cadre d'un point de vente situé {{adresse_point_vente}}.

IL A ÉTÉ CONVENU CE QUI SUIT :`,
    variables: [
      { name: 'franchiseur.denomination', type: 'string', required: true },
      { name: 'franchiseur.forme_juridique', type: 'string', required: true },
      { name: 'franchiseur.capital', type: 'number', required: true },
      { name: 'franchiseur.rcs_ville', type: 'string', required: true },
      { name: 'franchiseur.siret', type: 'string', required: true },
      { name: 'franchiseur.siege_social', type: 'string', required: true },
      { name: 'franchiseur.representant', type: 'string', required: true },
      { name: 'marque', type: 'string', required: true },
      { name: 'numero_depot_marque', type: 'string', required: true },
      { name: 'enseigne', type: 'string', required: true },
      { name: 'franchise.denomination', type: 'string' },
      { name: 'franchise.forme_juridique', type: 'string' },
      { name: 'franchise.civilite', type: 'string' },
      { name: 'franchise.prenom', type: 'string' },
      { name: 'franchise.nom', type: 'string' },
      { name: 'franchise.siret', type: 'string' },
      { name: 'franchise.rcs_ville', type: 'string' },
      { name: 'franchise.adresse', type: 'string', required: true },
      { name: 'franchise.code_postal', type: 'string', required: true },
      { name: 'franchise.ville', type: 'string', required: true },
      { name: 'franchise.representant', type: 'string' },
      { name: 'adresse_point_vente', type: 'string', required: true },
    ],
    tags: ['droit_affaires', 'commercial', 'franchise', 'contrat', 'intro'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 159,
  },
  {
    category: BlockCategory.INTRO,
    title: "Intro garantie d'actif-passif",
    content: `CONVENTION DE GARANTIE D'ACTIF ET DE PASSIF

ENTRE LES SOUSSIGNÉS :

{{garant.civilite}} {{garant.prenom}} {{garant.nom}}
{{#if garant.denomination}}Agissant au nom et pour le compte de {{garant.denomination}}, {{garant.forme_juridique}}{{/if}}
Demeurant/Siège : {{garant.adresse}}, {{garant.code_postal}} {{garant.ville}}

Ci-après dénommé "le Garant" ou "le Cédant",

D'UNE PART,

ET :

{{beneficiaire.denomination}}, {{beneficiaire.forme_juridique}} au capital de {{beneficiaire.capital}} euros, immatriculée au RCS de {{beneficiaire.rcs_ville}} sous le numéro {{beneficiaire.siret}}, dont le siège social est situé {{beneficiaire.siege_social}}, représentée par {{beneficiaire.representant}},

Ci-après dénommé "le Bénéficiaire" ou "l'Acquéreur",

D'AUTRE PART,

PRÉAMBULE :

Par acte en date du {{date_cession}}, le Garant a cédé au Bénéficiaire {{nombre_titres}} {{type_titres}} de la société {{societe_cible.denomination}}, {{societe_cible.forme_juridique}}, représentant {{pourcentage_cede}}% du capital social, pour un prix de {{prix_cession}} euros.

Dans le cadre de cette cession, le Garant a accepté de consentir au Bénéficiaire la présente garantie d'actif et de passif.

IL A ÉTÉ CONVENU CE QUI SUIT :`,
    variables: [
      { name: 'garant.civilite', type: 'string' },
      { name: 'garant.prenom', type: 'string' },
      { name: 'garant.nom', type: 'string', required: true },
      { name: 'garant.denomination', type: 'string' },
      { name: 'garant.forme_juridique', type: 'string' },
      { name: 'garant.adresse', type: 'string', required: true },
      { name: 'garant.code_postal', type: 'string', required: true },
      { name: 'garant.ville', type: 'string', required: true },
      { name: 'beneficiaire.denomination', type: 'string', required: true },
      { name: 'beneficiaire.forme_juridique', type: 'string', required: true },
      { name: 'beneficiaire.capital', type: 'number', required: true },
      { name: 'beneficiaire.rcs_ville', type: 'string', required: true },
      { name: 'beneficiaire.siret', type: 'string', required: true },
      { name: 'beneficiaire.siege_social', type: 'string', required: true },
      { name: 'beneficiaire.representant', type: 'string', required: true },
      { name: 'date_cession', type: 'date', required: true },
      { name: 'nombre_titres', type: 'number', required: true },
      { name: 'type_titres', type: 'string', required: true },
      { name: 'societe_cible.denomination', type: 'string', required: true },
      { name: 'societe_cible.forme_juridique', type: 'string', required: true },
      { name: 'pourcentage_cede', type: 'number', required: true },
      { name: 'prix_cession', type: 'number', required: true },
    ],
    tags: ['droit_affaires', 'cession', 'garantie_actif_passif', 'gap', 'intro'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 160,
  },

  // ============================================
  // CATÉGORIE FAITS (15 blocs) - 161-175
  // ============================================
  {
    category: BlockCategory.FAITS,
    title: 'Chronologie négociation cession',
    content: `HISTORIQUE DES NÉGOCIATIONS

Le {{date_premier_contact}}, premier contact entre les parties concernant une éventuelle cession de {{objet_cession}}.

{{#if date_accord_confidentialite}}Le {{date_accord_confidentialite}}, signature d'un accord de confidentialité entre les parties.{{/if}}

Le {{date_loi}}, signature d'une lettre d'intention non engageante fixant les grandes lignes de l'opération envisagée :
- Prix indicatif : {{prix_indicatif}} euros
- Périmètre : {{perimetre_operation}}
- Principales conditions : {{conditions_principales}}

Du {{date_debut_due_diligence}} au {{date_fin_due_diligence}}, réalisation d'une due diligence {{type_due_diligence}} par {{prestataire_due_diligence}}.

{{#if anomalies_due_diligence}}
Les travaux d'audit ont révélé les points d'attention suivants :
{{anomalies_due_diligence}}
{{/if}}

Le {{date_protocole}}, après négociations, signature du protocole d'accord définitif pour un prix de {{prix_cession}} euros{{#if ajustement_prix}}, sous réserve d'un mécanisme d'ajustement de prix{{/if}}.

{{#if date_realisation}}Le {{date_realisation}}, réalisation définitive de l'opération (closing).{{/if}}`,
    variables: [
      { name: 'date_premier_contact', type: 'date', required: true },
      { name: 'objet_cession', type: 'string', required: true },
      { name: 'date_accord_confidentialite', type: 'date' },
      { name: 'date_loi', type: 'date', required: true },
      { name: 'prix_indicatif', type: 'number', required: true },
      { name: 'perimetre_operation', type: 'string', required: true },
      { name: 'conditions_principales', type: 'text' },
      { name: 'date_debut_due_diligence', type: 'date', required: true },
      { name: 'date_fin_due_diligence', type: 'date', required: true },
      { name: 'type_due_diligence', type: 'string', required: true },
      { name: 'prestataire_due_diligence', type: 'string' },
      { name: 'anomalies_due_diligence', type: 'text' },
      { name: 'date_protocole', type: 'date', required: true },
      { name: 'prix_cession', type: 'number', required: true },
      { name: 'ajustement_prix', type: 'boolean' },
      { name: 'date_realisation', type: 'date' },
    ],
    tags: ['droit_affaires', 'cession', 'negociation', 'chronologie', 'faits'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 161,
  },
  {
    category: BlockCategory.FAITS,
    title: 'État du fonds de commerce',
    content: `DÉSIGNATION DU FONDS DE COMMERCE

Le fonds de commerce objet de la présente cession est exploité sous l'enseigne "{{enseigne}}" à l'adresse suivante : {{adresse_fonds}}, {{code_postal_fonds}} {{ville_fonds}}.

Il comprend les éléments suivants :

1. ÉLÉMENTS INCORPORELS :
- L'enseigne et le nom commercial "{{enseigne}}"
- La clientèle et l'achalandage attachés au fonds
- Le droit au bail des locaux dans lesquels le fonds est exploité
{{#if marques}}- Les marques déposées : {{marques}}{{/if}}
{{#if licences}}- Les licences et autorisations : {{licences}}{{/if}}
{{#if contrats_inclus}}- Les contrats suivants : {{contrats_inclus}}{{/if}}

2. ÉLÉMENTS CORPORELS :
- Le matériel et outillage d'une valeur de {{valeur_materiel}} euros
- Le mobilier commercial d'une valeur de {{valeur_mobilier}} euros
{{#if stock}}- Le stock de marchandises d'une valeur de {{valeur_stock}} euros (à inventorier au jour de la cession){{/if}}

3. ÉLÉMENTS EXCLUS DE LA CESSION :
{{elements_exclus}}

ORIGINE DE PROPRIÉTÉ :
Le Cédant est propriétaire du fonds depuis le {{date_acquisition}} suite à {{origine_propriete}}.`,
    variables: [
      { name: 'enseigne', type: 'string', required: true },
      { name: 'adresse_fonds', type: 'string', required: true },
      { name: 'code_postal_fonds', type: 'string', required: true },
      { name: 'ville_fonds', type: 'string', required: true },
      { name: 'marques', type: 'string' },
      { name: 'licences', type: 'string' },
      { name: 'contrats_inclus', type: 'text' },
      { name: 'valeur_materiel', type: 'number', required: true },
      { name: 'valeur_mobilier', type: 'number', required: true },
      { name: 'stock', type: 'boolean' },
      { name: 'valeur_stock', type: 'number' },
      { name: 'elements_exclus', type: 'text' },
      { name: 'date_acquisition', type: 'date', required: true },
      { name: 'origine_propriete', type: 'string', required: true },
    ],
    tags: ['droit_affaires', 'cession', 'fonds_commerce', 'designation', 'faits'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 162,
  },
  {
    category: BlockCategory.FAITS,
    title: 'État des parts sociales cédées',
    content: `DÉSIGNATION DES PARTS SOCIALES CÉDÉES

Les présentes ont pour objet la cession de {{nombre_parts}} parts sociales de la société {{societe.denomination}}, d'une valeur nominale de {{valeur_nominale}} euros chacune, numérotées de {{numero_debut}} à {{numero_fin}}, représentant {{pourcentage}}% du capital social.

CARACTÉRISTIQUES DES PARTS :
- Entièrement libérées : {{#if liberees}}Oui{{else}}Non - Montant restant à libérer : {{montant_non_libere}} euros{{/if}}
- Catégorie : {{categorie_parts}}
- Droits attachés : {{droits_attaches}}

ORIGINE DE PROPRIÉTÉ :
Le Cédant a acquis les parts sociales objet de la présente cession :
{{origine_propriete}}

SITUATION DES PARTS :
Le Cédant déclare que les parts cédées :
- Sont libres de tout nantissement, gage ou sûreté quelconque{{#if nantissement}} à l'exception de {{nantissement}}{{/if}}
- Ne font l'objet d'aucune promesse de vente ou d'achat
- Ne font l'objet d'aucune clause d'inaliénabilité{{#if inalienabilite}} à l'exception de {{inalienabilite}}{{/if}}

AGRÉMENT :
{{#if agrement_requis}}La cession a été agréée par décision {{organe_agrement}} en date du {{date_agrement}}.{{else}}Aucun agrément n'est requis pour la présente cession.{{/if}}`,
    variables: [
      { name: 'nombre_parts', type: 'number', required: true },
      { name: 'societe.denomination', type: 'string', required: true },
      { name: 'valeur_nominale', type: 'number', required: true },
      { name: 'numero_debut', type: 'number', required: true },
      { name: 'numero_fin', type: 'number', required: true },
      { name: 'pourcentage', type: 'number', required: true },
      { name: 'liberees', type: 'boolean', required: true },
      { name: 'montant_non_libere', type: 'number' },
      { name: 'categorie_parts', type: 'string' },
      { name: 'droits_attaches', type: 'text' },
      { name: 'origine_propriete', type: 'text', required: true },
      { name: 'nantissement', type: 'string' },
      { name: 'inalienabilite', type: 'string' },
      { name: 'agrement_requis', type: 'boolean', required: true },
      { name: 'organe_agrement', type: 'string' },
      { name: 'date_agrement', type: 'date' },
    ],
    tags: ['droit_affaires', 'cession', 'parts_sociales', 'designation', 'faits'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 163,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Composition du capital social',
    content: `COMPOSITION DU CAPITAL SOCIAL

Le capital social de la société {{societe.denomination}} s'élève à {{societe.capital}} euros, divisé en {{nombre_total_titres}} {{type_titres}} de {{valeur_nominale}} euros de valeur nominale chacun(e), entièrement souscrit(e)s et libéré(e)s.

RÉPARTITION DU CAPITAL AVANT CESSION :

{{#each actionnariat_avant}}
- {{this.nom}} : {{this.nombre_titres}} {{../type_titres}} soit {{this.pourcentage}}%
{{/each}}

RÉPARTITION DU CAPITAL APRÈS CESSION :

{{#each actionnariat_apres}}
- {{this.nom}} : {{this.nombre_titres}} {{../type_titres}} soit {{this.pourcentage}}%
{{/each}}

{{#if droits_vote_differents}}
DROITS DE VOTE :
Les droits de vote ne sont pas proportionnels au capital :
{{detail_droits_vote}}
{{/if}}

{{#if titres_speciaux}}
TITRES SPÉCIAUX :
{{detail_titres_speciaux}}
{{/if}}`,
    variables: [
      { name: 'societe.denomination', type: 'string', required: true },
      { name: 'societe.capital', type: 'number', required: true },
      { name: 'nombre_total_titres', type: 'number', required: true },
      { name: 'type_titres', type: 'string', required: true },
      { name: 'valeur_nominale', type: 'number', required: true },
      { name: 'actionnariat_avant', type: 'array', required: true },
      { name: 'actionnariat_apres', type: 'array', required: true },
      { name: 'droits_vote_differents', type: 'boolean' },
      { name: 'detail_droits_vote', type: 'text' },
      { name: 'titres_speciaux', type: 'boolean' },
      { name: 'detail_titres_speciaux', type: 'text' },
    ],
    tags: ['droit_affaires', 'societes', 'capital', 'actionnariat', 'faits'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 164,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Activité et chiffre d\'affaires',
    content: `ACTIVITÉ ET DONNÉES FINANCIÈRES

1. ACTIVITÉ :

La société {{societe.denomination}} a pour activité principale : {{activite_principale}}.

{{#if activites_secondaires}}Activités secondaires : {{activites_secondaires}}{{/if}}

Code APE : {{code_ape}}

2. DONNÉES FINANCIÈRES DES TROIS DERNIERS EXERCICES :

Exercice clos le {{date_cloture_n}} (N) :
- Chiffre d'affaires : {{ca_n}} euros
- Résultat d'exploitation : {{rex_n}} euros
- Résultat net : {{rn_n}} euros
- Capitaux propres : {{cp_n}} euros
- Effectif moyen : {{effectif_n}} salariés

Exercice clos le {{date_cloture_n1}} (N-1) :
- Chiffre d'affaires : {{ca_n1}} euros
- Résultat d'exploitation : {{rex_n1}} euros
- Résultat net : {{rn_n1}} euros

Exercice clos le {{date_cloture_n2}} (N-2) :
- Chiffre d'affaires : {{ca_n2}} euros
- Résultat d'exploitation : {{rex_n2}} euros
- Résultat net : {{rn_n2}} euros

{{#if commentaire_evolution}}
COMMENTAIRE SUR L'ÉVOLUTION :
{{commentaire_evolution}}
{{/if}}`,
    variables: [
      { name: 'societe.denomination', type: 'string', required: true },
      { name: 'activite_principale', type: 'string', required: true },
      { name: 'activites_secondaires', type: 'string' },
      { name: 'code_ape', type: 'string', required: true },
      { name: 'date_cloture_n', type: 'date', required: true },
      { name: 'ca_n', type: 'number', required: true },
      { name: 'rex_n', type: 'number', required: true },
      { name: 'rn_n', type: 'number', required: true },
      { name: 'cp_n', type: 'number', required: true },
      { name: 'effectif_n', type: 'number', required: true },
      { name: 'date_cloture_n1', type: 'date', required: true },
      { name: 'ca_n1', type: 'number', required: true },
      { name: 'rex_n1', type: 'number', required: true },
      { name: 'rn_n1', type: 'number', required: true },
      { name: 'date_cloture_n2', type: 'date', required: true },
      { name: 'ca_n2', type: 'number', required: true },
      { name: 'rex_n2', type: 'number', required: true },
      { name: 'rn_n2', type: 'number', required: true },
      { name: 'commentaire_evolution', type: 'text' },
    ],
    tags: ['droit_affaires', 'cession', 'chiffre_affaires', 'financier', 'faits'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 165,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Situation contentieux en cours',
    content: `LITIGES ET CONTENTIEUX

Le Cédant déclare que la société {{societe.denomination}} est {{#if contentieux_actifs}}impliquée dans les litiges suivants{{else}}n'est impliquée dans aucun litige significatif{{/if}} :

{{#if contentieux_actifs}}
CONTENTIEUX EN COURS :

{{#each contentieux}}
{{@index}}. {{this.intitule}}
- Nature : {{this.nature}}
- Juridiction : {{this.juridiction}}
- Parties adverses : {{this.parties_adverses}}
- Enjeu financier : {{this.enjeu}} euros
- Provision constituée : {{this.provision}} euros
- État d'avancement : {{this.etat}}
- Risque estimé : {{this.risque}}
{{/each}}
{{/if}}

{{#if contentieux_potentiels}}
RISQUES CONTENTIEUX POTENTIELS :
{{contentieux_potentiels}}
{{/if}}

{{#if contentieux_clos}}
CONTENTIEUX RÉCEMMENT CLOS (moins de 3 ans) :
{{contentieux_clos}}
{{/if}}

Le Cédant s'engage à informer sans délai le Cessionnaire de tout nouveau litige ou de toute évolution significative des litiges en cours.`,
    variables: [
      { name: 'societe.denomination', type: 'string', required: true },
      { name: 'contentieux_actifs', type: 'boolean', required: true },
      { name: 'contentieux', type: 'array' },
      { name: 'contentieux_potentiels', type: 'text' },
      { name: 'contentieux_clos', type: 'text' },
    ],
    tags: ['droit_affaires', 'cession', 'contentieux', 'litiges', 'faits'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 166,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Passif social et fiscal',
    content: `SITUATION SOCIALE ET FISCALE

1. SITUATION FISCALE :

La société {{societe.denomination}} déclare être à jour de ses obligations fiscales.

Dernier exercice vérifié : {{exercice_verifie}}
{{#if controle_fiscal}}
Un contrôle fiscal a eu lieu du {{date_debut_controle}} au {{date_fin_controle}}.
Résultat : {{resultat_controle}}
{{#if redressement}}Montant du redressement : {{montant_redressement}} euros{{/if}}
{{else}}
Aucun contrôle fiscal n'est en cours ou n'a été notifié.
{{/if}}

Déficits reportables : {{deficits_reportables}} euros
Créances fiscales : {{creances_fiscales}} euros

2. SITUATION SOCIALE :

Effectif au {{date_effectif}} : {{effectif}} salariés
Masse salariale annuelle : {{masse_salariale}} euros

{{#if controle_urssaf}}
Un contrôle URSSAF a eu lieu du {{date_debut_urssaf}} au {{date_fin_urssaf}}.
Résultat : {{resultat_urssaf}}
{{#if redressement_urssaf}}Montant du redressement : {{montant_redressement_urssaf}} euros{{/if}}
{{else}}
Aucun contrôle URSSAF n'est en cours ou n'a été notifié.
{{/if}}

Engagements de retraite : {{engagements_retraite}} euros
Provisions pour risques sociaux : {{provisions_sociales}} euros`,
    variables: [
      { name: 'societe.denomination', type: 'string', required: true },
      { name: 'exercice_verifie', type: 'string', required: true },
      { name: 'controle_fiscal', type: 'boolean', required: true },
      { name: 'date_debut_controle', type: 'date' },
      { name: 'date_fin_controle', type: 'date' },
      { name: 'resultat_controle', type: 'string' },
      { name: 'redressement', type: 'boolean' },
      { name: 'montant_redressement', type: 'number' },
      { name: 'deficits_reportables', type: 'number' },
      { name: 'creances_fiscales', type: 'number' },
      { name: 'date_effectif', type: 'date', required: true },
      { name: 'effectif', type: 'number', required: true },
      { name: 'masse_salariale', type: 'number', required: true },
      { name: 'controle_urssaf', type: 'boolean', required: true },
      { name: 'date_debut_urssaf', type: 'date' },
      { name: 'date_fin_urssaf', type: 'date' },
      { name: 'resultat_urssaf', type: 'string' },
      { name: 'redressement_urssaf', type: 'boolean' },
      { name: 'montant_redressement_urssaf', type: 'number' },
      { name: 'engagements_retraite', type: 'number' },
      { name: 'provisions_sociales', type: 'number' },
    ],
    tags: ['droit_affaires', 'cession', 'fiscal', 'social', 'passif', 'faits'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 167,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Contrats en cours',
    content: `CONTRATS EN COURS

1. PRINCIPAUX CLIENTS :

{{#each clients_principaux}}
- {{this.nom}} : CA annuel {{this.ca}} euros ({{this.pourcentage_ca}}% du CA total)
  Contrat : {{this.type_contrat}} - Échéance : {{this.echeance}}
{{/each}}

Concentration client : le premier client représente {{concentration_premier_client}}% du CA.

2. PRINCIPAUX FOURNISSEURS :

{{#each fournisseurs_principaux}}
- {{this.nom}} : Volume annuel {{this.volume}} euros
  Contrat : {{this.type_contrat}} - Échéance : {{this.echeance}}
{{/each}}

3. AUTRES CONTRATS SIGNIFICATIFS :

{{#if contrats_significatifs}}
{{#each contrats_significatifs}}
- {{this.intitule}} avec {{this.cocontractant}}
  Nature : {{this.nature}}
  Durée : {{this.duree}} - Échéance : {{this.echeance}}
  {{#if this.clause_changement_controle}}⚠ Clause de changement de contrôle{{/if}}
{{/each}}
{{else}}
Aucun autre contrat significatif à signaler.
{{/if}}

4. CONTRATS AVEC CLAUSE DE CHANGEMENT DE CONTRÔLE :

{{#if contrats_changement_controle}}
Les contrats suivants comportent une clause de changement de contrôle nécessitant une notification ou un accord du cocontractant :
{{contrats_changement_controle}}
{{else}}
Aucun contrat ne comporte de clause de changement de contrôle.
{{/if}}`,
    variables: [
      { name: 'clients_principaux', type: 'array', required: true },
      { name: 'concentration_premier_client', type: 'number', required: true },
      { name: 'fournisseurs_principaux', type: 'array', required: true },
      { name: 'contrats_significatifs', type: 'array' },
      { name: 'contrats_changement_controle', type: 'text' },
    ],
    tags: ['droit_affaires', 'cession', 'contrats', 'clients', 'fournisseurs', 'faits'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 168,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Baux commerciaux',
    content: `BAUX COMMERCIAUX

{{#if bail_principal}}
1. BAIL PRINCIPAL (Siège social / Établissement principal) :

Locaux situés : {{bail_principal.adresse}}, {{bail_principal.code_postal}} {{bail_principal.ville}}
Surface : {{bail_principal.surface}} m²
Bailleur : {{bail_principal.bailleur}}
Date du bail : {{bail_principal.date_bail}}
Durée : {{bail_principal.duree}} ans
Échéance : {{bail_principal.echeance}}
Loyer annuel HT : {{bail_principal.loyer}} euros
Charges annuelles : {{bail_principal.charges}} euros
Dépôt de garantie : {{bail_principal.depot_garantie}} euros
Destination : {{bail_principal.destination}}
{{#if bail_principal.clause_particuliere}}Clauses particulières : {{bail_principal.clause_particuliere}}{{/if}}
{{/if}}

{{#if baux_secondaires}}
2. BAUX SECONDAIRES :

{{#each baux_secondaires}}
{{@index}}. {{this.adresse}}, {{this.code_postal}} {{this.ville}}
   Surface : {{this.surface}} m² - Loyer : {{this.loyer}} euros/an
   Échéance : {{this.echeance}}
{{/each}}
{{/if}}

CLAUSE DE CESSION :
{{#if autorisation_bailleur_requise}}
La cession du bail requiert l'autorisation préalable du bailleur conformément aux stipulations du bail.
{{else}}
Le bail autorise la cession dans le cadre d'une cession du fonds de commerce.
{{/if}}`,
    variables: [
      { name: 'bail_principal.adresse', type: 'string', required: true },
      { name: 'bail_principal.code_postal', type: 'string', required: true },
      { name: 'bail_principal.ville', type: 'string', required: true },
      { name: 'bail_principal.surface', type: 'number', required: true },
      { name: 'bail_principal.bailleur', type: 'string', required: true },
      { name: 'bail_principal.date_bail', type: 'date', required: true },
      { name: 'bail_principal.duree', type: 'number', required: true },
      { name: 'bail_principal.echeance', type: 'date', required: true },
      { name: 'bail_principal.loyer', type: 'number', required: true },
      { name: 'bail_principal.charges', type: 'number' },
      { name: 'bail_principal.depot_garantie', type: 'number' },
      { name: 'bail_principal.destination', type: 'string', required: true },
      { name: 'bail_principal.clause_particuliere', type: 'text' },
      { name: 'baux_secondaires', type: 'array' },
      { name: 'autorisation_bailleur_requise', type: 'boolean', required: true },
    ],
    tags: ['droit_affaires', 'cession', 'bail_commercial', 'immobilier', 'faits'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 169,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Personnel salarié',
    content: `PERSONNEL SALARIÉ

1. EFFECTIF AU {{date_reference}} :

Effectif total : {{effectif_total}} salariés
- CDI : {{effectif_cdi}}
- CDD : {{effectif_cdd}}
- Temps plein : {{effectif_temps_plein}}
- Temps partiel : {{effectif_temps_partiel}}

Répartition par catégorie :
- Cadres : {{effectif_cadres}}
- Agents de maîtrise : {{effectif_maitrise}}
- Employés : {{effectif_employes}}
- Ouvriers : {{effectif_ouvriers}}

Ancienneté moyenne : {{anciennete_moyenne}} ans
Âge moyen : {{age_moyen}} ans

2. MASSE SALARIALE :

Masse salariale brute annuelle : {{masse_salariale_brute}} euros
Charges sociales patronales : {{charges_patronales}} euros
Coût total : {{cout_total_salaries}} euros

3. REPRÉSENTATION DU PERSONNEL :

{{#if cse}}CSE en place - {{nombre_elus_cse}} élus - Prochaines élections : {{date_elections_cse}}{{else}}Pas de CSE (effectif < 11 salariés){{/if}}
{{#if delegue_syndical}}Délégué syndical : {{delegue_syndical}}{{/if}}

4. ACCORDS COLLECTIFS :

Convention collective applicable : {{convention_collective}}
{{#if accords_entreprise}}
Accords d'entreprise en vigueur :
{{accords_entreprise}}
{{/if}}

5. CONTENTIEUX PRUD'HOMAL :

{{#if contentieux_prudhommal}}
{{contentieux_prudhommal}}
{{else}}
Aucun contentieux prud'homal en cours.
{{/if}}`,
    variables: [
      { name: 'date_reference', type: 'date', required: true },
      { name: 'effectif_total', type: 'number', required: true },
      { name: 'effectif_cdi', type: 'number', required: true },
      { name: 'effectif_cdd', type: 'number', required: true },
      { name: 'effectif_temps_plein', type: 'number', required: true },
      { name: 'effectif_temps_partiel', type: 'number', required: true },
      { name: 'effectif_cadres', type: 'number', required: true },
      { name: 'effectif_maitrise', type: 'number' },
      { name: 'effectif_employes', type: 'number' },
      { name: 'effectif_ouvriers', type: 'number' },
      { name: 'anciennete_moyenne', type: 'number' },
      { name: 'age_moyen', type: 'number' },
      { name: 'masse_salariale_brute', type: 'number', required: true },
      { name: 'charges_patronales', type: 'number', required: true },
      { name: 'cout_total_salaries', type: 'number', required: true },
      { name: 'cse', type: 'boolean', required: true },
      { name: 'nombre_elus_cse', type: 'number' },
      { name: 'date_elections_cse', type: 'date' },
      { name: 'delegue_syndical', type: 'string' },
      { name: 'convention_collective', type: 'string', required: true },
      { name: 'accords_entreprise', type: 'text' },
      { name: 'contentieux_prudhommal', type: 'text' },
    ],
    tags: ['droit_affaires', 'cession', 'salaries', 'personnel', 'social', 'faits'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 170,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Propriété intellectuelle',
    content: `PROPRIÉTÉ INTELLECTUELLE

1. MARQUES :

{{#if marques}}
{{#each marques}}
- "{{this.nom}}" - N° {{this.numero}} - Déposée le {{this.date_depot}}
  Classes : {{this.classes}}
  Territoire : {{this.territoire}}
  Échéance renouvellement : {{this.echeance}}
  {{#if this.licence}}Licence accordée à : {{this.licence}}{{/if}}
{{/each}}
{{else}}
Aucune marque déposée.
{{/if}}

2. BREVETS :

{{#if brevets}}
{{#each brevets}}
- {{this.titre}} - N° {{this.numero}} - Déposé le {{this.date_depot}}
  Inventeur(s) : {{this.inventeurs}}
  Territoire : {{this.territoire}}
  Échéance : {{this.echeance}}
  Annuités à jour : {{#if this.annuites_jour}}Oui{{else}}Non{{/if}}
{{/each}}
{{else}}
Aucun brevet.
{{/if}}

3. NOMS DE DOMAINE :

{{#if noms_domaine}}
{{#each noms_domaine}}
- {{this.nom}} - Échéance : {{this.echeance}}
{{/each}}
{{else}}
Aucun nom de domaine.
{{/if}}

4. AUTRES DROITS :

{{#if autres_droits_pi}}
{{autres_droits_pi}}
{{else}}
Aucun autre droit de propriété intellectuelle significatif.
{{/if}}

5. LITIGES EN MATIÈRE DE PI :

{{#if litiges_pi}}
{{litiges_pi}}
{{else}}
Aucun litige en matière de propriété intellectuelle.
{{/if}}`,
    variables: [
      { name: 'marques', type: 'array' },
      { name: 'brevets', type: 'array' },
      { name: 'noms_domaine', type: 'array' },
      { name: 'autres_droits_pi', type: 'text' },
      { name: 'litiges_pi', type: 'text' },
    ],
    tags: ['droit_affaires', 'cession', 'propriete_intellectuelle', 'marques', 'brevets', 'faits'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 171,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Rupture relation commerciale établie',
    content: `EXPOSÉ DES FAITS - RUPTURE DE RELATION COMMERCIALE ÉTABLIE

1. HISTORIQUE DE LA RELATION :

Les parties entretiennent une relation commerciale depuis le {{date_debut_relation}}, soit une durée de {{duree_relation}} ans.

Nature de la relation : {{nature_relation}}
Volume d'affaires annuel moyen : {{volume_affaires_moyen}} euros
Part dans le chiffre d'affaires du demandeur : {{part_ca}}%

2. CARACTÈRE ÉTABLI DE LA RELATION :

La relation commerciale était caractérisée par :
{{caracteristiques_relation}}

Cette relation présentait un caractère de stabilité et de régularité démontré par :
{{elements_stabilite}}

3. CIRCONSTANCES DE LA RUPTURE :

Le {{date_notification_rupture}}, {{auteur_rupture}} a notifié la rupture de la relation commerciale.

Motifs invoqués : {{motifs_rupture}}

Préavis accordé : {{preavis_accorde}}

4. CARACTÈRE BRUTAL DE LA RUPTURE :

La rupture présente un caractère brutal en raison de :
{{elements_brutalite}}

Le préavis accordé de {{preavis_accorde}} est manifestement insuffisant au regard :
- De la durée de la relation ({{duree_relation}} ans)
- De la dépendance économique ({{part_ca}}% du CA)
- Des investissements réalisés
- Des difficultés de reconversion`,
    variables: [
      { name: 'date_debut_relation', type: 'date', required: true },
      { name: 'duree_relation', type: 'number', required: true },
      { name: 'nature_relation', type: 'string', required: true },
      { name: 'volume_affaires_moyen', type: 'number', required: true },
      { name: 'part_ca', type: 'number', required: true },
      { name: 'caracteristiques_relation', type: 'text', required: true },
      { name: 'elements_stabilite', type: 'text', required: true },
      { name: 'date_notification_rupture', type: 'date', required: true },
      { name: 'auteur_rupture', type: 'string', required: true },
      { name: 'motifs_rupture', type: 'text' },
      { name: 'preavis_accorde', type: 'string', required: true },
      { name: 'elements_brutalite', type: 'text', required: true },
    ],
    tags: ['droit_affaires', 'commercial', 'rupture_brutale', 'L442-1', 'faits'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 172,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Manquements contractuels distributeur',
    content: `EXPOSÉ DES FAITS - MANQUEMENTS DU DISTRIBUTEUR

1. CONTEXTE CONTRACTUEL :

Par contrat de distribution {{#if exclusif}}exclusive {{/if}}en date du {{date_contrat}}, {{fournisseur.denomination}} a confié à {{distributeur.denomination}} la distribution de ses produits sur le territoire {{territoire}}.

Principales obligations du Distributeur :
{{obligations_distributeur}}

2. MANQUEMENTS CONSTATÉS :

{{#each manquements}}
{{@index}}. {{this.intitule}}

Date(s) : {{this.dates}}
Description : {{this.description}}
Clause contractuelle violée : {{this.clause_violee}}
Préjudice : {{this.prejudice}}

{{/each}}

3. MISES EN DEMEURE :

{{#if mises_en_demeure}}
Des mises en demeure ont été adressées aux dates suivantes :
{{#each mises_en_demeure}}
- {{this.date}} : {{this.objet}} - Réponse : {{this.reponse}}
{{/each}}
{{else}}
Aucune mise en demeure préalable n'a été nécessaire, les manquements étant d'une gravité telle qu'ils justifient la résiliation immédiate.
{{/if}}

4. PRÉJUDICE SUBI :

Le Fournisseur a subi un préjudice total estimé à {{prejudice_total}} euros, comprenant :
{{detail_prejudice}}`,
    variables: [
      { name: 'exclusif', type: 'boolean' },
      { name: 'date_contrat', type: 'date', required: true },
      { name: 'fournisseur.denomination', type: 'string', required: true },
      { name: 'distributeur.denomination', type: 'string', required: true },
      { name: 'territoire', type: 'string', required: true },
      { name: 'obligations_distributeur', type: 'text', required: true },
      { name: 'manquements', type: 'array', required: true },
      { name: 'mises_en_demeure', type: 'array' },
      { name: 'prejudice_total', type: 'number', required: true },
      { name: 'detail_prejudice', type: 'text', required: true },
    ],
    tags: ['droit_affaires', 'commercial', 'distribution', 'manquements', 'faits'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 173,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Faute de gestion dirigeant',
    content: `EXPOSÉ DES FAITS - FAUTE DE GESTION DU DIRIGEANT

1. QUALITÉ DU DIRIGEANT :

{{dirigeant.civilite}} {{dirigeant.prenom}} {{dirigeant.nom}} exerce les fonctions de {{dirigeant.fonction}} de la société {{societe.denomination}} depuis le {{date_nomination}}.

2. FAITS REPROCHÉS :

{{#each fautes}}
{{@index}}. {{this.intitule}}

Période : {{this.periode}}
Description des faits : {{this.description}}
Éléments de preuve : {{this.preuves}}

{{/each}}

3. QUALIFICATION JURIDIQUE :

Ces faits constituent une faute de gestion au sens de l'article {{#if sarl}}L. 223-22{{else}}L. 225-251{{/if}} du Code de commerce en ce qu'ils caractérisent :
{{qualification_faute}}

4. PRÉJUDICE CAUSÉ À LA SOCIÉTÉ :

La société a subi un préjudice direct et certain évalué à {{montant_prejudice}} euros, comprenant :
{{detail_prejudice}}

5. LIEN DE CAUSALITÉ :

Le préjudice subi par la société résulte directement des fautes de gestion commises par le dirigeant :
{{lien_causalite}}`,
    variables: [
      { name: 'dirigeant.civilite', type: 'string', required: true },
      { name: 'dirigeant.prenom', type: 'string', required: true },
      { name: 'dirigeant.nom', type: 'string', required: true },
      { name: 'dirigeant.fonction', type: 'string', required: true },
      { name: 'societe.denomination', type: 'string', required: true },
      { name: 'date_nomination', type: 'date', required: true },
      { name: 'fautes', type: 'array', required: true },
      { name: 'sarl', type: 'boolean', required: true },
      { name: 'qualification_faute', type: 'text', required: true },
      { name: 'montant_prejudice', type: 'number', required: true },
      { name: 'detail_prejudice', type: 'text', required: true },
      { name: 'lien_causalite', type: 'text', required: true },
    ],
    tags: ['droit_affaires', 'societes', 'responsabilite_dirigeant', 'faute_gestion', 'faits'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 174,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Abus de majorité/minorité',
    content: `EXPOSÉ DES FAITS - ABUS DE {{#if abus_majorite}}MAJORITÉ{{else}}MINORITÉ{{/if}}

1. CONTEXTE :

La société {{societe.denomination}} est détenue par les associés suivants :
{{#each actionnariat}}
- {{this.nom}} : {{this.pourcentage}}% du capital
{{/each}}

{{demandeur.nom}}, détenant {{demandeur.pourcentage}}% du capital, agit en qualité d'associé {{#if abus_majorite}}minoritaire{{else}}majoritaire{{/if}}.

2. DÉCISIONS LITIGIEUSES :

{{#each decisions_litigieuses}}
- Assemblée du {{this.date}} : {{this.objet}}
  Résolution n°{{this.numero}} : {{this.contenu}}
  Vote : {{this.vote}}
{{/each}}

3. CARACTÉRISATION DE L'ABUS :

{{#if abus_majorite}}
Les décisions litigieuses caractérisent un abus de majorité en ce qu'elles ont été prises :
- Contrairement à l'intérêt social : {{argument_interet_social}}
- Dans l'unique dessein de favoriser les majoritaires au détriment des minoritaires : {{argument_rupture_egalite}}
{{else}}
Le blocage des décisions par les minoritaires caractérise un abus de minorité en ce qu'il :
- Empêche la réalisation d'une opération essentielle pour la société : {{operation_bloquee}}
- N'est motivé que par des considérations personnelles contraires à l'intérêt social : {{motivation_blocage}}
{{/if}}

4. PRÉJUDICE :

Ce comportement abusif a causé un préjudice évalué à {{montant_prejudice}} euros :
{{detail_prejudice}}`,
    variables: [
      { name: 'abus_majorite', type: 'boolean', required: true },
      { name: 'societe.denomination', type: 'string', required: true },
      { name: 'actionnariat', type: 'array', required: true },
      { name: 'demandeur.nom', type: 'string', required: true },
      { name: 'demandeur.pourcentage', type: 'number', required: true },
      { name: 'decisions_litigieuses', type: 'array', required: true },
      { name: 'argument_interet_social', type: 'text' },
      { name: 'argument_rupture_egalite', type: 'text' },
      { name: 'operation_bloquee', type: 'text' },
      { name: 'motivation_blocage', type: 'text' },
      { name: 'montant_prejudice', type: 'number', required: true },
      { name: 'detail_prejudice', type: 'text', required: true },
    ],
    tags: ['droit_affaires', 'societes', 'abus_majorite', 'abus_minorite', 'faits'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 175,
  },

  // ============================================
  // CATÉGORIE MOYENS - CLAUSES CESSION (20 blocs) - 176-195
  // ============================================
  {
    category: BlockCategory.MOYENS,
    title: 'Clause de prix (cession)',
    content: `ARTICLE {{numero_article}} - PRIX DE CESSION

Le prix de cession des {{nombre_titres}} {{type_titres}} représentant {{pourcentage}}% du capital social est fixé à la somme de {{prix_total}} euros ({{prix_lettres}} euros).

Ce prix a été déterminé sur la base d'une valorisation de l'entreprise de {{valeur_entreprise}} euros, selon la méthode {{methode_valorisation}}{{#if decote}}, après application d'une décote de {{decote}}% pour {{motif_decote}}{{/if}}.

Le prix sera payé comme suit :
{{#if paiement_comptant}}
- Intégralité du prix à la signature des présentes
{{else}}
- {{acompte}} euros à la signature des présentes ({{pourcentage_acompte}}%)
- Le solde de {{solde}} euros au plus tard le {{date_solde}}{{#if echeancier}}, selon l'échéancier suivant :
{{echeancier}}{{/if}}
{{/if}}

{{#if garantie_paiement}}
Le paiement du solde est garanti par {{garantie_paiement}}.
{{/if}}

{{#if clause_revision}}
Le prix est susceptible de révision dans les conditions prévues à l'article {{article_revision}} des présentes.
{{/if}}`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'nombre_titres', type: 'number', required: true },
      { name: 'type_titres', type: 'string', required: true },
      { name: 'pourcentage', type: 'number', required: true },
      { name: 'prix_total', type: 'number', required: true },
      { name: 'prix_lettres', type: 'string', required: true },
      { name: 'valeur_entreprise', type: 'number', required: true },
      { name: 'methode_valorisation', type: 'string', required: true },
      { name: 'decote', type: 'number' },
      { name: 'motif_decote', type: 'string' },
      { name: 'paiement_comptant', type: 'boolean', required: true },
      { name: 'acompte', type: 'number' },
      { name: 'pourcentage_acompte', type: 'number' },
      { name: 'solde', type: 'number' },
      { name: 'date_solde', type: 'date' },
      { name: 'echeancier', type: 'text' },
      { name: 'garantie_paiement', type: 'string' },
      { name: 'clause_revision', type: 'boolean' },
      { name: 'article_revision', type: 'string' },
    ],
    tags: ['droit_affaires', 'cession', 'prix', 'clause', 'moyens'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 176,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Clause de garantie de passif',
    content: `ARTICLE {{numero_article}} - GARANTIE DE PASSIF

{{garant.nom}} (ci-après "le Garant") garantit {{beneficiaire.nom}} (ci-après "le Bénéficiaire") contre tout passif non inscrit au bilan de référence arrêté au {{date_bilan}}, qui viendrait à se révéler postérieurement à la cession.

1. ÉTENDUE DE LA GARANTIE :

Cette garantie couvre notamment :
- Les redressements fiscaux de toute nature (impôt sur les sociétés, TVA, taxes diverses)
- Les redressements sociaux (URSSAF, caisses de retraite)
- Les litiges, réclamations ou procédures non provisionnés ou insuffisamment provisionnés
- Les engagements hors bilan non mentionnés dans l'annexe aux comptes
- Toute dette ou obligation née antérieurement à la cession et non inscrite au bilan
- Les garanties accordées à des tiers

2. LIMITES DE LA GARANTIE :

Plafond global : {{plafond_garantie}} euros ({{pourcentage_plafond}}% du prix de cession)
Franchise (seuil de déclenchement) : {{franchise}} euros
Mini de réclamation individuelle : {{mini_reclamation}} euros

3. DURÉE :

La présente garantie est consentie pour une durée de {{duree_garantie}} ans à compter de la date de réalisation de la cession, sauf pour :
- Les matières fiscales : {{duree_fiscale}} ans
- Les matières sociales : {{duree_sociale}} ans
- Les matières environnementales : {{duree_environnement}} ans

4. PROCÉDURE DE MISE EN ŒUVRE :

Le Bénéficiaire devra notifier toute réclamation au Garant par lettre recommandée avec AR dans un délai de {{delai_notification}} jours à compter de la survenance ou de la connaissance du fait générateur.

{{#if garantie_premiere_demande}}
5. GARANTIE À PREMIÈRE DEMANDE :

En garantie de ses obligations, le Garant remet au Bénéficiaire une garantie bancaire à première demande d'un montant de {{montant_garantie_bancaire}} euros.
{{/if}}`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'garant.nom', type: 'string', required: true },
      { name: 'beneficiaire.nom', type: 'string', required: true },
      { name: 'date_bilan', type: 'date', required: true },
      { name: 'plafond_garantie', type: 'number', required: true },
      { name: 'pourcentage_plafond', type: 'number', required: true },
      { name: 'franchise', type: 'number', required: true },
      { name: 'mini_reclamation', type: 'number' },
      { name: 'duree_garantie', type: 'number', required: true },
      { name: 'duree_fiscale', type: 'number' },
      { name: 'duree_sociale', type: 'number' },
      { name: 'duree_environnement', type: 'number' },
      { name: 'delai_notification', type: 'number', required: true },
      { name: 'garantie_premiere_demande', type: 'boolean' },
      { name: 'montant_garantie_bancaire', type: 'number' },
    ],
    tags: ['droit_affaires', 'cession', 'garantie_passif', 'gap', 'clause', 'moyens'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 177,
  },
  {
    category: BlockCategory.MOYENS,
    title: "Clause d'earn-out",
    content: `ARTICLE {{numero_article}} - COMPLÉMENT DE PRIX (EARN-OUT)

En sus du prix de base défini à l'article {{article_prix}}, un complément de prix sera versé au Cédant si les objectifs suivants sont atteints :

1. OBJECTIFS ET MONTANTS :

{{#each objectifs}}
- Si {{this.critere}} atteint {{this.seuil}} : complément de {{this.montant}} euros
{{/each}}

2. PÉRIODE DE RÉFÉRENCE :

Les objectifs seront mesurés sur la période du {{date_debut_earn_out}} au {{date_fin_earn_out}}.

3. MODALITÉS DE CALCUL :

Base de calcul : {{base_calcul}}
Méthode de calcul : {{methode_calcul}}

Les comptes servant de base au calcul seront {{#if audit_externe}}audités par {{nom_auditeur}}{{else}}arrêtés par la direction de la société{{/if}}.

4. PAIEMENT :

Le complément de prix sera versé dans les {{delai_paiement}} jours suivant la validation définitive des comptes.

5. ENGAGEMENTS DU CESSIONNAIRE :

Le Cessionnaire s'engage à :
- Maintenir l'activité dans des conditions normales d'exploitation
- Ne pas prendre de décision de nature à compromettre artificiellement l'atteinte des objectifs
- Permettre au Cédant d'accéder aux informations nécessaires au suivi des objectifs

{{#if mandat_cession}}
Le Cédant conservera un mandat de {{fonction_mandat}} pendant la période d'earn-out.
{{/if}}`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'article_prix', type: 'string', required: true },
      { name: 'objectifs', type: 'array', required: true },
      { name: 'date_debut_earn_out', type: 'date', required: true },
      { name: 'date_fin_earn_out', type: 'date', required: true },
      { name: 'base_calcul', type: 'string', required: true },
      { name: 'methode_calcul', type: 'text', required: true },
      { name: 'audit_externe', type: 'boolean' },
      { name: 'nom_auditeur', type: 'string' },
      { name: 'delai_paiement', type: 'number', required: true },
      { name: 'mandat_cession', type: 'boolean' },
      { name: 'fonction_mandat', type: 'string' },
    ],
    tags: ['droit_affaires', 'cession', 'earn_out', 'complement_prix', 'clause', 'moyens'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 178,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Clause de révision de prix',
    content: `ARTICLE {{numero_article}} - RÉVISION DE PRIX

Le prix de cession fixé à l'article {{article_prix}} fera l'objet d'un ajustement selon les modalités suivantes :

1. PRINCIPE DE L'AJUSTEMENT :

Le prix sera ajusté sur la base de la {{base_ajustement}} constatée à la date de réalisation de la cession, par comparaison avec la {{base_reference}} du bilan de référence au {{date_bilan_reference}}.

2. MÉCANISME D'AJUSTEMENT :

Prix ajusté = Prix de base {{#if ajustement_euro_pour_euro}}+/- ({{base_ajustement}} réelle - {{base_reference}} de référence){{else}}x ({{base_ajustement}} réelle / {{base_reference}} de référence){{/if}}

3. ÉTABLISSEMENT DES COMPTES DE CLOSING :

Les comptes à la date de réalisation seront établis selon les mêmes principes comptables que le bilan de référence.

Délai d'établissement : {{delai_comptes}} jours après la date de réalisation
{{#if expert_comptable}}Établis par : {{expert_comptable}}{{/if}}

4. PROCÉDURE DE VALIDATION :

- Transmission des comptes au Cédant : {{delai_transmission}} jours
- Délai de contestation : {{delai_contestation}} jours
- En cas de désaccord : {{procedure_desaccord}}

5. PAIEMENT DE L'AJUSTEMENT :

L'ajustement sera réglé dans les {{delai_reglement}} jours suivant la validation définitive des comptes.
- Si ajustement positif : versement par le Cessionnaire au Cédant
- Si ajustement négatif : remboursement par le Cédant au Cessionnaire`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'article_prix', type: 'string', required: true },
      { name: 'base_ajustement', type: 'string', required: true },
      { name: 'base_reference', type: 'string', required: true },
      { name: 'date_bilan_reference', type: 'date', required: true },
      { name: 'ajustement_euro_pour_euro', type: 'boolean', required: true },
      { name: 'delai_comptes', type: 'number', required: true },
      { name: 'expert_comptable', type: 'string' },
      { name: 'delai_transmission', type: 'number', required: true },
      { name: 'delai_contestation', type: 'number', required: true },
      { name: 'procedure_desaccord', type: 'string', required: true },
      { name: 'delai_reglement', type: 'number', required: true },
    ],
    tags: ['droit_affaires', 'cession', 'revision_prix', 'ajustement', 'clause', 'moyens'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 179,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Clause conditions suspensives',
    content: `ARTICLE {{numero_article}} - CONDITIONS SUSPENSIVES

La présente cession est conclue sous les conditions suspensives suivantes :

{{#each conditions}}
{{@index}}. {{this.intitule}}
   {{this.description}}
   Date limite de réalisation : {{this.date_limite}}
   Partie responsable : {{this.partie_responsable}}
{{/each}}

RÉALISATION DES CONDITIONS :

Chaque partie s'engage à accomplir toutes les diligences nécessaires à la réalisation des conditions suspensives dont elle a la charge.

La réalisation de chaque condition sera constatée par écrit. La partie bénéficiaire pourra renoncer à une condition stipulée dans son intérêt.

NON-RÉALISATION :

Si l'une quelconque des conditions suspensives n'est pas réalisée au plus tard le {{date_limite_globale}}, {{#if caducite_automatique}}le présent acte sera automatiquement caduc{{else}}la partie la plus diligente pourra notifier la caducité du présent acte{{/if}}, sans qu'aucune indemnité ne soit due de part et d'autre, sauf en cas de faute d'une partie.

{{#if indemnite_immobilisation}}
INDEMNITÉ D'IMMOBILISATION :

En cas de non-réalisation des conditions du fait exclusif du Cessionnaire, celui-ci versera au Cédant une indemnité d'immobilisation de {{montant_indemnite}} euros.
{{/if}}`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'conditions', type: 'array', required: true },
      { name: 'date_limite_globale', type: 'date', required: true },
      { name: 'caducite_automatique', type: 'boolean', required: true },
      { name: 'indemnite_immobilisation', type: 'boolean' },
      { name: 'montant_indemnite', type: 'number' },
    ],
    tags: ['droit_affaires', 'cession', 'conditions_suspensives', 'clause', 'moyens'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 180,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Clause agrément cessionnaire',
    content: `ARTICLE {{numero_article}} - AGRÉMENT

Conformément aux statuts de la société, la cession des {{type_titres}} à un tiers non associé requiert l'agrément préalable {{organe_agrement}}.

PROCÉDURE :

1. Le projet de cession a été notifié à la société le {{date_notification}} par lettre recommandée avec AR, indiquant :
   - L'identité du cessionnaire
   - Le nombre de {{type_titres}} dont la cession est envisagée
   - Le prix proposé
   - Les modalités de paiement

2. {{#if agrement_obtenu}}L'agrément a été accordé par {{organe_agrement}} le {{date_agrement}}.{{else}}La société dispose d'un délai de {{delai_agrement}} mois pour se prononcer.{{/if}}

{{#if agrement_obtenu}}
La société {{societe.denomination}} déclare avoir agréé {{cessionnaire.nom}} en qualité de nouvel associé.
{{/if}}

{{#if refus_agrement}}
CONSÉQUENCES D'UN REFUS D'AGRÉMENT :

En cas de refus d'agrément, les associés sont tenus, dans un délai de {{delai_rachat}} mois à compter de la notification du refus, d'acquérir ou de faire acquérir les {{type_titres}} à un prix fixé {{mode_fixation_prix}}.

À défaut de rachat dans ce délai, l'agrément est réputé acquis.
{{/if}}`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'type_titres', type: 'string', required: true },
      { name: 'organe_agrement', type: 'string', required: true },
      { name: 'date_notification', type: 'date', required: true },
      { name: 'agrement_obtenu', type: 'boolean', required: true },
      { name: 'date_agrement', type: 'date' },
      { name: 'delai_agrement', type: 'number' },
      { name: 'societe.denomination', type: 'string', required: true },
      { name: 'cessionnaire.nom', type: 'string' },
      { name: 'refus_agrement', type: 'boolean' },
      { name: 'delai_rachat', type: 'number' },
      { name: 'mode_fixation_prix', type: 'string' },
    ],
    tags: ['droit_affaires', 'cession', 'agrement', 'clause', 'moyens'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 181,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Clause préemption associés',
    content: `ARTICLE {{numero_article}} - DROIT DE PRÉEMPTION

Conformément {{#if statutaire}}aux statuts{{else}}au pacte d'associés{{/if}}, les associés bénéficient d'un droit de préemption en cas de cession de {{type_titres}}.

1. NOTIFICATION DU PROJET DE CESSION :

Le Cédant a notifié son projet de cession le {{date_notification}} à :
- La société
- Chacun des associés

Cette notification comprenait :
- L'identité du cessionnaire pressenti : {{cessionnaire_pressenti}}
- Le nombre de {{type_titres}} : {{nombre_titres}}
- Le prix de cession : {{prix_cession}} euros
- Les conditions de la cession

2. EXERCICE DU DROIT DE PRÉEMPTION :

Les associés disposent d'un délai de {{delai_preemption}} jours pour exercer leur droit de préemption.

{{#if preemption_exercee}}
{{preempteur}} a exercé son droit de préemption le {{date_exercice}} pour {{nombre_titres_preemptes}} {{type_titres}} au prix de {{prix_preemption}} euros.
{{else}}
À défaut d'exercice dans le délai imparti, le Cédant est libre de céder ses {{type_titres}} au cessionnaire de son choix, aux conditions notifiées.
{{/if}}

3. RÉPARTITION EN CAS DE PLURALITÉ :

En cas d'exercice par plusieurs associés, les {{type_titres}} seront répartis {{mode_repartition}}.`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'statutaire', type: 'boolean', required: true },
      { name: 'type_titres', type: 'string', required: true },
      { name: 'date_notification', type: 'date', required: true },
      { name: 'cessionnaire_pressenti', type: 'string', required: true },
      { name: 'nombre_titres', type: 'number', required: true },
      { name: 'prix_cession', type: 'number', required: true },
      { name: 'delai_preemption', type: 'number', required: true },
      { name: 'preemption_exercee', type: 'boolean', required: true },
      { name: 'preempteur', type: 'string' },
      { name: 'date_exercice', type: 'date' },
      { name: 'nombre_titres_preemptes', type: 'number' },
      { name: 'prix_preemption', type: 'number' },
      { name: 'mode_repartition', type: 'string' },
    ],
    tags: ['droit_affaires', 'cession', 'preemption', 'clause', 'moyens'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 182,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Clause inaliénabilité temporaire',
    content: `ARTICLE {{numero_article}} - INALIÉNABILITÉ

Les parties conviennent que le Cessionnaire s'interdit de céder, directement ou indirectement, tout ou partie des {{type_titres}} acquis aux termes des présentes pendant une durée de {{duree_inalienabilite}} ans à compter de la date de réalisation de la cession.

1. ÉTENDUE DE L'INTERDICTION :

Cette interdiction s'applique à :
- Toute cession à titre onéreux ou gratuit
- Tout apport en société
- Toute constitution de nantissement ou sûreté
- Toute promesse de cession
{{#if operations_exclues}}

Sont toutefois exclues de cette interdiction :
{{operations_exclues}}
{{/if}}

2. JUSTIFICATION :

Cette clause d'inaliénabilité est justifiée par {{justification}}.

3. SANCTION :

Toute cession intervenue en violation de la présente clause serait {{#if nullite}}nulle et de nul effet{{else}}inopposable aux parties{{/if}}.

{{#if indemnite_violation}}
En outre, le Cessionnaire serait redevable d'une indemnité forfaitaire de {{montant_indemnite}} euros envers le Cédant.
{{/if}}`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'type_titres', type: 'string', required: true },
      { name: 'duree_inalienabilite', type: 'number', required: true },
      { name: 'operations_exclues', type: 'text' },
      { name: 'justification', type: 'text', required: true },
      { name: 'nullite', type: 'boolean', required: true },
      { name: 'indemnite_violation', type: 'boolean' },
      { name: 'montant_indemnite', type: 'number' },
    ],
    tags: ['droit_affaires', 'cession', 'inalienabilite', 'clause', 'moyens'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 183,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Clause non-concurrence cédant',
    content: `ARTICLE {{numero_article}} - NON-CONCURRENCE

Le Cédant s'engage, pendant une durée de {{duree_non_concurrence}} ans à compter de la réalisation de la cession, à ne pas :

1. ACTIVITÉS INTERDITES :

- Exercer, directement ou indirectement, une activité concurrente de celle de {{societe.denomination}}
- Créer, acquérir, gérer ou prendre une participation dans une entreprise exerçant une activité concurrente
- Travailler en qualité de salarié, consultant ou mandataire social pour une entreprise concurrente
- Démarcher ou solliciter les clients de {{societe.denomination}}

2. CHAMP D'APPLICATION :

Territoire concerné : {{territoire}}
Activités concernées : {{activites_concernees}}

3. CONTREPARTIE :

{{#if contrepartie_financiere}}
En contrepartie de cet engagement, le Cessionnaire versera au Cédant une indemnité de {{montant_contrepartie}} euros, payable {{modalites_paiement_contrepartie}}.
{{else}}
Le Cédant reconnaît que cet engagement de non-concurrence a été pris en considération dans la détermination du prix de cession et ne donne lieu à aucune indemnité spécifique.
{{/if}}

4. SANCTIONS :

En cas de violation de la présente clause, le Cédant sera redevable d'une pénalité de {{penalite_violation}} euros par infraction constatée, sans préjudice du droit pour le Cessionnaire de demander réparation de son préjudice réel et/ou la cessation de l'activité concurrente.`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'duree_non_concurrence', type: 'number', required: true },
      { name: 'societe.denomination', type: 'string', required: true },
      { name: 'territoire', type: 'string', required: true },
      { name: 'activites_concernees', type: 'text', required: true },
      { name: 'contrepartie_financiere', type: 'boolean', required: true },
      { name: 'montant_contrepartie', type: 'number' },
      { name: 'modalites_paiement_contrepartie', type: 'string' },
      { name: 'penalite_violation', type: 'number', required: true },
    ],
    tags: ['droit_affaires', 'cession', 'non_concurrence', 'clause', 'moyens'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 184,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Clause déclarations et garanties',
    content: `ARTICLE {{numero_article}} - DÉCLARATIONS ET GARANTIES DU CÉDANT

Le Cédant déclare et garantit au Cessionnaire ce qui suit :

1. CAPACITÉ ET POUVOIRS :
- Il a la pleine capacité juridique pour conclure le présent acte
- Il dispose de tous les pouvoirs nécessaires à la cession
- Il n'existe aucun accord restreignant sa faculté de céder les {{type_titres}}

2. PROPRIÉTÉ DES TITRES :
- Il est seul et unique propriétaire des {{type_titres}} cédés
- Les {{type_titres}} sont libres de tout nantissement, gage ou sûreté
- Il n'existe aucune promesse de cession consentie à un tiers

3. SITUATION DE LA SOCIÉTÉ :
- Les comptes sociaux arrêtés au {{date_comptes}} sont sincères et réguliers
- Il n'existe pas de passif non comptabilisé
- La société est à jour de ses obligations fiscales et sociales
- Il n'existe pas de litige susceptible d'affecter significativement la société

4. ACTIVITÉ :
- L'activité est exercée conformément aux lois et règlements
- Tous les contrats significatifs ont été communiqués
- Il n'existe pas de fait susceptible d'affecter la continuité de l'exploitation

5. INFORMATION :
- Toutes les informations communiquées au Cessionnaire sont exactes et complètes
- Il n'a pas omis de communiquer un élément significatif

Ces déclarations et garanties sont exactes à la date des présentes et le resteront à la date de réalisation.`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'type_titres', type: 'string', required: true },
      { name: 'date_comptes', type: 'date', required: true },
    ],
    tags: ['droit_affaires', 'cession', 'declarations_garanties', 'representations_warranties', 'clause', 'moyens'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 185,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Clause de confidentialité acquisition',
    content: `ARTICLE {{numero_article}} - CONFIDENTIALITÉ

1. OBLIGATIONS DE CONFIDENTIALITÉ :

Les parties s'engagent à conserver strictement confidentielles toutes les informations échangées dans le cadre des présentes négociations et de la réalisation de la cession.

Sont considérées comme confidentielles :
- Les termes et conditions de la cession
- Toute information financière, commerciale ou technique relative à la société
- Le contenu des audits et due diligence
- Toute autre information désignée comme confidentielle

2. EXCEPTIONS :

Ne sont pas soumises à cette obligation les informations :
- Déjà connues du public au moment de leur communication
- Devenues publiques sans faute de la partie réceptrice
- Dont la communication est requise par la loi ou une autorité compétente

3. DURÉE :

Cette obligation de confidentialité perdurera pendant {{duree_confidentialite}} ans après {{#if apres_realisation}}la réalisation de la cession{{else}}la signature des présentes{{/if}}.

4. COMMUNICATION AUTORISÉE :

Les parties peuvent communiquer les informations confidentielles à leurs conseils (avocats, experts-comptables) sous réserve que ceux-ci soient tenus à une obligation de confidentialité équivalente.

5. SANCTIONS :

Toute violation de la présente clause exposera son auteur à des dommages-intérêts.`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'duree_confidentialite', type: 'number', required: true },
      { name: 'apres_realisation', type: 'boolean', required: true },
    ],
    tags: ['droit_affaires', 'cession', 'confidentialite', 'nda', 'clause', 'moyens'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 186,
  },
  {
    category: BlockCategory.MOYENS,
    title: "Clause d'exclusivité négociation",
    content: `ARTICLE {{numero_article}} - EXCLUSIVITÉ DES NÉGOCIATIONS

Le Cédant s'engage, pendant une durée de {{duree_exclusivite}} mois à compter de la signature des présentes, à négocier exclusivement avec l'Acquéreur potentiel et à s'abstenir de :

1. ENGAGEMENTS DU CÉDANT :

- Solliciter, rechercher ou accepter des offres d'acquisition émanant de tiers
- Poursuivre des discussions ou négociations avec d'autres acquéreurs potentiels
- Communiquer à des tiers des informations relatives à la société en vue d'une cession
- Conclure tout accord préliminaire ou définitif de cession avec un tiers

2. OBLIGATIONS DE L'ACQUÉREUR :

En contrepartie, l'Acquéreur s'engage à :
- Mener les travaux de due diligence dans les meilleurs délais
- Faire connaître sa position définitive au plus tard le {{date_limite_offre}}
{{#if indemnite_exclusivite}}
- Verser une indemnité d'exclusivité de {{montant_indemnite}} euros à la signature des présentes
{{/if}}

3. FIN DE L'EXCLUSIVITÉ :

L'exclusivité prendra fin automatiquement :
- À l'expiration du délai de {{duree_exclusivite}} mois
- En cas de renonciation écrite de l'Acquéreur
- En cas de signature du protocole de cession définitif

4. VIOLATION :

En cas de violation de l'exclusivité par le Cédant, celui-ci sera redevable d'une indemnité forfaitaire de {{indemnite_violation}} euros.`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'duree_exclusivite', type: 'number', required: true },
      { name: 'date_limite_offre', type: 'date', required: true },
      { name: 'indemnite_exclusivite', type: 'boolean' },
      { name: 'montant_indemnite', type: 'number' },
      { name: 'indemnite_violation', type: 'number', required: true },
    ],
    tags: ['droit_affaires', 'cession', 'exclusivite', 'loi', 'clause', 'moyens'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 187,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Clause break-up fee',
    content: `ARTICLE {{numero_article}} - INDEMNITÉ DE RUPTURE (BREAK-UP FEE)

1. HYPOTHÈSES D'APPLICATION :

{{#if payable_par_acquereur}}
L'Acquéreur s'engage à verser au Cédant une indemnité de rupture de {{montant_break_fee}} euros ({{pourcentage_prix}}% du prix) dans les hypothèses suivantes :
{{hypotheses_acquereur}}
{{/if}}

{{#if payable_par_cedant}}
Le Cédant s'engage à verser à l'Acquéreur une indemnité de rupture de {{montant_break_fee_reverse}} euros dans les hypothèses suivantes :
{{hypotheses_cedant}}
{{/if}}

2. NATURE DE L'INDEMNITÉ :

Cette indemnité est forfaitaire et libératoire. Elle vise à compenser :
- Les frais engagés par la partie bénéficiaire (conseils, audits)
- Le temps consacré aux négociations
- Le manque à gagner résultant de l'immobilisation de l'opération

3. PAIEMENT :

L'indemnité sera payable dans les {{delai_paiement}} jours suivant la survenance du fait générateur.

4. EXCLUSIONS :

Aucune indemnité ne sera due si la rupture résulte :
- De la non-réalisation d'une condition suspensive (sauf faute)
- D'un commun accord des parties
- {{exclusions_supplementaires}}`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'payable_par_acquereur', type: 'boolean', required: true },
      { name: 'montant_break_fee', type: 'number' },
      { name: 'pourcentage_prix', type: 'number' },
      { name: 'hypotheses_acquereur', type: 'text' },
      { name: 'payable_par_cedant', type: 'boolean', required: true },
      { name: 'montant_break_fee_reverse', type: 'number' },
      { name: 'hypotheses_cedant', type: 'text' },
      { name: 'delai_paiement', type: 'number', required: true },
      { name: 'exclusions_supplementaires', type: 'text' },
    ],
    tags: ['droit_affaires', 'cession', 'break_up_fee', 'indemnite_rupture', 'clause', 'moyens'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 188,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Clause tag along (sortie conjointe)',
    content: `ARTICLE {{numero_article}} - DROIT DE SORTIE CONJOINTE (TAG ALONG)

1. BÉNÉFICIAIRES :

Le droit de sortie conjointe est accordé à {{beneficiaires_tag}}.

2. CONDITIONS DE DÉCLENCHEMENT :

Ce droit pourra être exercé en cas de projet de cession par {{cedants_declencheurs}} représentant au moins {{seuil_declenchement}}% du capital social à un tiers acquéreur.

3. PROCÉDURE :

a) Notification du projet de cession :
Le cédant notifie aux bénéficiaires du tag along le projet de cession, en indiquant l'identité de l'acquéreur, le prix et les conditions de la cession.

b) Exercice du droit :
Les bénéficiaires disposent d'un délai de {{delai_exercice}} jours pour notifier leur intention d'exercer leur droit de sortie conjointe.

c) Conditions de sortie :
Les bénéficiaires pourront céder leurs {{type_titres}} au même prix et aux mêmes conditions que le cédant principal, à proportion de leur participation.

4. OBLIGATION DU CÉDANT :

Le cédant s'engage à faire reprendre l'intégralité des {{type_titres}} dont les bénéficiaires souhaitent se défaire, à défaut de quoi il ne pourra réaliser sa propre cession.

5. RENONCIATION :

Le défaut d'exercice dans le délai imparti vaut renonciation au droit de sortie conjointe pour l'opération concernée.`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'beneficiaires_tag', type: 'string', required: true },
      { name: 'cedants_declencheurs', type: 'string', required: true },
      { name: 'seuil_declenchement', type: 'number', required: true },
      { name: 'delai_exercice', type: 'number', required: true },
      { name: 'type_titres', type: 'string', required: true },
    ],
    tags: ['droit_affaires', 'societes', 'pacte', 'tag_along', 'sortie_conjointe', 'clause', 'moyens'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 189,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Clause drag along (sortie forcée)',
    content: `ARTICLE {{numero_article}} - DROIT DE SORTIE FORCÉE (DRAG ALONG)

1. BÉNÉFICIAIRES :

Le droit de sortie forcée est accordé à {{beneficiaires_drag}} (ci-après "les Majoritaires").

2. CONDITIONS DE DÉCLENCHEMENT :

Les Majoritaires pourront obliger les autres associés à céder la totalité de leurs {{type_titres}} dans les conditions suivantes :
- Détention d'au moins {{seuil_detention}}% du capital
- Offre ferme d'un tiers pour {{seuil_offre}}% minimum du capital
- Prix minimum de {{prix_minimum}} euros par {{type_titre_singulier}}{{#if formule_prix}} ou valorisation selon {{formule_prix}}{{/if}}

3. PROCÉDURE :

a) Notification :
Les Majoritaires notifient aux autres associés leur intention d'exercer le drag along, en précisant l'identité de l'acquéreur, le prix et les conditions de l'offre.

b) Délai :
Les associés disposeront d'un délai de {{delai_transfert}} jours pour transférer leurs {{type_titres}}.

4. CONDITIONS DE CESSION :

La cession se fera :
- Au même prix par {{type_titre_singulier}} que celui convenu par les Majoritaires
- Aux mêmes conditions (sauf garanties spécifiques aux Majoritaires)

5. DÉFAUT DE TRANSFERT :

En cas de refus ou de défaut de transfert, les Majoritaires sont irrévocablement mandatés pour signer l'ordre de mouvement pour le compte des associés défaillants.`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'beneficiaires_drag', type: 'string', required: true },
      { name: 'type_titres', type: 'string', required: true },
      { name: 'type_titre_singulier', type: 'string', required: true },
      { name: 'seuil_detention', type: 'number', required: true },
      { name: 'seuil_offre', type: 'number', required: true },
      { name: 'prix_minimum', type: 'number' },
      { name: 'formule_prix', type: 'string' },
      { name: 'delai_transfert', type: 'number', required: true },
    ],
    tags: ['droit_affaires', 'societes', 'pacte', 'drag_along', 'sortie_forcee', 'clause', 'moyens'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 190,
  },

  // ============================================
  // CATÉGORIE CLAUSES STATUTS/PACTES (15 blocs) - 196-210
  // ============================================
  {
    category: BlockCategory.CLAUSE,
    title: "Clause d'agrément statutaire",
    content: `ARTICLE {{numero_article}} - AGRÉMENT

Toute cession de {{type_titres}} à un tiers non associé est soumise à l'agrément préalable des associés.

1. NOTIFICATION DU PROJET :

Le projet de cession est notifié à la société et à chacun des associés par lettre recommandée avec accusé de réception, indiquant :
- Le nombre de {{type_titres}} dont la cession est envisagée
- L'identité du cessionnaire pressenti
- Le prix et les conditions de la cession

2. DÉCISION D'AGRÉMENT :

L'agrément résulte d'une décision collective des associés représentant au moins {{seuil_agrement}}% {{base_majorite}}.

La décision doit intervenir dans un délai de {{delai_agrement}} mois à compter de la notification. À défaut de réponse dans ce délai, l'agrément est réputé acquis.

3. REFUS D'AGRÉMENT :

En cas de refus d'agrément, les associés sont tenus, dans un délai de {{delai_rachat}} mois à compter de la notification du refus, d'acquérir ou de faire acquérir les {{type_titres}} au prix convenu entre les parties ou, à défaut d'accord, au prix déterminé {{mode_determination_prix}}.

Si les {{type_titres}} ne sont pas acquis dans ce délai, l'agrément est réputé acquis.

4. CESSIONS LIBRES :

Sont libres les cessions entre {{cessions_libres}}.`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'type_titres', type: 'string', required: true },
      { name: 'seuil_agrement', type: 'number', required: true },
      { name: 'base_majorite', type: 'string', required: true },
      { name: 'delai_agrement', type: 'number', required: true },
      { name: 'delai_rachat', type: 'number', required: true },
      { name: 'mode_determination_prix', type: 'string', required: true },
      { name: 'cessions_libres', type: 'string', required: true },
    ],
    tags: ['droit_affaires', 'societes', 'statuts', 'agrement', 'clause'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 196,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de préférence',
    content: `ARTICLE {{numero_article}} - DROIT DE PRÉFÉRENCE

1. PRINCIPE :

En cas de projet de cession de {{type_titres}} à titre onéreux, les autres associés bénéficient d'un droit de préférence.

2. NOTIFICATION :

Le cédant notifie son projet de cession aux autres associés par lettre recommandée avec AR, indiquant :
- Le nombre de {{type_titres}} à céder
- Le prix unitaire proposé
- L'identité du cessionnaire pressenti (le cas échéant)
- Les conditions de la cession

3. EXERCICE DU DROIT :

Les associés disposent d'un délai de {{delai_preference}} jours à compter de la notification pour faire connaître leur intention d'acquérir les {{type_titres}}.

En cas de pluralité de demandes, les {{type_titres}} sont répartis {{mode_repartition}}.

4. PRIX :

L'acquisition s'effectue au prix proposé par le cédant.
{{#if prix_expert}}
Si ce prix est considéré comme manifestement excessif, il pourra être déterminé par un expert désigné {{mode_designation_expert}}.
{{/if}}

5. DÉFAUT D'EXERCICE :

À défaut d'exercice du droit de préférence dans le délai imparti, le cédant est libre de céder ses {{type_titres}} au cessionnaire de son choix, à un prix au moins égal à celui notifié.`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'type_titres', type: 'string', required: true },
      { name: 'delai_preference', type: 'number', required: true },
      { name: 'mode_repartition', type: 'string', required: true },
      { name: 'prix_expert', type: 'boolean' },
      { name: 'mode_designation_expert', type: 'string' },
    ],
    tags: ['droit_affaires', 'societes', 'statuts', 'pacte', 'preference', 'clause'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 197,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause anti-dilution',
    content: `ARTICLE {{numero_article}} - PROTECTION ANTI-DILUTION

1. OBJET :

La présente clause a pour objet de protéger {{beneficiaires_antidilution}} contre une dilution de leur participation en cas d'émission de nouveaux {{type_titres}} à un prix inférieur au prix payé lors de leur investissement.

2. SEUIL DE DÉCLENCHEMENT :

Le mécanisme s'applique si de nouveaux {{type_titres}} sont émis à un prix par {{type_titre_singulier}} inférieur à {{prix_reference}} euros (le "Prix de Référence").

3. MÉCANISME D'AJUSTEMENT :

{{#if full_ratchet}}
Full Ratchet : Le Prix de Référence est ramené au prix d'émission des nouveaux {{type_titres}}, et des {{type_titres}} supplémentaires sont émis au profit des Bénéficiaires pour maintenir leur pourcentage de détention.
{{else}}
Weighted Average : Le Prix de Référence est ajusté selon la formule suivante :
Nouveau Prix = (CP × PA + CA) / (CP + NE)
Où : CP = Capital avant émission, PA = Prix ajusté, CA = Capitaux apportés, NE = Nombre de {{type_titres}} émis
{{/if}}

4. EXCLUSIONS :

Ne déclenchent pas le mécanisme :
{{exclusions_antidilution}}

5. DURÉE :

Cette protection est consentie pour une durée de {{duree_protection}} ans.`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'beneficiaires_antidilution', type: 'string', required: true },
      { name: 'type_titres', type: 'string', required: true },
      { name: 'type_titre_singulier', type: 'string', required: true },
      { name: 'prix_reference', type: 'number', required: true },
      { name: 'full_ratchet', type: 'boolean', required: true },
      { name: 'exclusions_antidilution', type: 'text', required: true },
      { name: 'duree_protection', type: 'number', required: true },
    ],
    tags: ['droit_affaires', 'societes', 'pacte', 'antidilution', 'investisseur', 'clause'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 198,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de liquidation préférentielle',
    content: `ARTICLE {{numero_article}} - LIQUIDATION PRÉFÉRENTIELLE

1. BÉNÉFICIAIRES :

{{beneficiaires_liquidation}} bénéficient d'une liquidation préférentielle en cas d'événement de liquidité.

2. ÉVÉNEMENTS DE LIQUIDITÉ :

Constituent des événements de liquidité :
- La dissolution de la Société
- La cession de la totalité du capital social
- La cession d'une branche d'activité significative
- L'introduction en bourse
{{#if autres_evenements}}
- {{autres_evenements}}
{{/if}}

3. MONTANT DE LA PRÉFÉRENCE :

Les Bénéficiaires percevront en priorité :
{{#if multiple}}
Un montant égal à {{multiple}}x leur investissement initial, soit {{montant_preference}} euros.
{{else}}
Le remboursement de leur investissement initial, soit {{montant_preference}} euros, majoré d'un intérêt de {{taux_interet}}% par an.
{{/if}}

4. PARTICIPATION AU SOLDE :

{{#if participation_solde}}
Après paiement de la préférence, les Bénéficiaires participent à la distribution du solde à hauteur de leur pourcentage de détention ("participating preferred").
{{else}}
Après paiement de la préférence, les Bénéficiaires ne participent pas à la distribution du solde ("non-participating preferred").
{{/if}}

5. RANG :

La présente liquidation préférentielle est de rang {{rang}} (pari passu avec {{rang_pari_passu}} / senior par rapport à {{rang_junior}}).`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'beneficiaires_liquidation', type: 'string', required: true },
      { name: 'autres_evenements', type: 'text' },
      { name: 'multiple', type: 'number' },
      { name: 'montant_preference', type: 'number', required: true },
      { name: 'taux_interet', type: 'number' },
      { name: 'participation_solde', type: 'boolean', required: true },
      { name: 'rang', type: 'string', required: true },
      { name: 'rang_pari_passu', type: 'string' },
      { name: 'rang_junior', type: 'string' },
    ],
    tags: ['droit_affaires', 'societes', 'pacte', 'liquidation_preferentielle', 'investisseur', 'clause'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 199,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause bad leaver / good leaver',
    content: `ARTICLE {{numero_article}} - DÉPART DES MANAGERS (LEAVER)

1. DÉFINITIONS :

"Good Leaver" : Départ résultant de :
{{definitions_good_leaver}}

"Bad Leaver" : Tout autre cas de départ, notamment :
{{definitions_bad_leaver}}

2. OBLIGATION DE CESSION :

En cas de départ, le Manager s'engage à céder ses {{type_titres}} dans les conditions suivantes :

a) Cas de Good Leaver :
- {{type_titres}} acquis avant le départ : cession à la valeur de marché{{#if formule_valeur_marche}}, déterminée selon {{formule_valeur_marche}}{{/if}}
- {{type_titres}} en cours de vesting : annulation

b) Cas de Bad Leaver :
- Totalité des {{type_titres}} : cession au prix d'acquisition initial{{#if decote_bad_leaver}}, avec une décote de {{decote_bad_leaver}}%{{/if}}

3. PROMESSE D'ACHAT :

{{acheteurs_promesse}} s'engagent irrévocablement à acquérir les {{type_titres}} du Manager partant.

4. VESTING :

Les {{type_titres}} sont soumis à un vesting de {{duree_vesting}} ans :
{{calendrier_vesting}}

5. PROCÉDURE :

Le départ est notifié dans les {{delai_notification}} jours. La cession intervient dans les {{delai_cession}} jours suivants.`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'definitions_good_leaver', type: 'text', required: true },
      { name: 'definitions_bad_leaver', type: 'text', required: true },
      { name: 'type_titres', type: 'string', required: true },
      { name: 'formule_valeur_marche', type: 'string' },
      { name: 'decote_bad_leaver', type: 'number' },
      { name: 'acheteurs_promesse', type: 'string', required: true },
      { name: 'duree_vesting', type: 'number', required: true },
      { name: 'calendrier_vesting', type: 'text', required: true },
      { name: 'delai_notification', type: 'number', required: true },
      { name: 'delai_cession', type: 'number', required: true },
    ],
    tags: ['droit_affaires', 'societes', 'pacte', 'bad_leaver', 'good_leaver', 'management', 'clause'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 200,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de gouvernance',
    content: `ARTICLE {{numero_article}} - GOUVERNANCE

1. ORGANE DE DIRECTION :

La Société est {{#if president_unique}}dirigée par un Président unique{{else}}dirigée par un Président et un Directeur Général{{/if}}.

{{#if comite_direction}}
Un comité de direction est institué, composé de {{composition_comdir}}.
{{/if}}

2. CONSEIL D'ADMINISTRATION / COMITÉ STRATÉGIQUE :

{{#if conseil}}
Il est institué un {{type_conseil}} composé de {{nombre_membres}} membres :
{{composition_conseil}}

Le {{type_conseil}} se réunit au moins {{frequence_reunions}} et est compétent pour :
{{competences_conseil}}
{{/if}}

3. DÉCISIONS SOUMISES À AGRÉMENT PRÉALABLE :

Les décisions suivantes requièrent l'accord préalable de {{organe_agrement_decisions}} :

{{#each decisions_agreees}}
- {{this}}
{{/each}}

4. INFORMATION DES ASSOCIÉS :

Les associés reçoivent {{frequence_reporting}} :
{{contenu_reporting}}

5. DROIT DE VETO :

{{#if droit_veto}}
{{titulaires_veto}} disposent d'un droit de veto sur les décisions suivantes :
{{decisions_veto}}
{{/if}}`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'president_unique', type: 'boolean', required: true },
      { name: 'comite_direction', type: 'boolean' },
      { name: 'composition_comdir', type: 'string' },
      { name: 'conseil', type: 'boolean', required: true },
      { name: 'type_conseil', type: 'string' },
      { name: 'nombre_membres', type: 'number' },
      { name: 'composition_conseil', type: 'text' },
      { name: 'frequence_reunions', type: 'string' },
      { name: 'competences_conseil', type: 'text' },
      { name: 'organe_agrement_decisions', type: 'string', required: true },
      { name: 'decisions_agreees', type: 'array', required: true },
      { name: 'frequence_reporting', type: 'string', required: true },
      { name: 'contenu_reporting', type: 'text', required: true },
      { name: 'droit_veto', type: 'boolean' },
      { name: 'titulaires_veto', type: 'string' },
      { name: 'decisions_veto', type: 'text' },
    ],
    tags: ['droit_affaires', 'societes', 'statuts', 'pacte', 'gouvernance', 'clause'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 201,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause résolution conflits associés',
    content: `ARTICLE {{numero_article}} - RÉSOLUTION DES CONFLITS ENTRE ASSOCIÉS

1. NÉGOCIATION AMIABLE :

En cas de différend entre associés relatif à l'interprétation ou l'exécution {{#if pacte}}du présent pacte{{else}}des présents statuts{{/if}}, les parties s'efforceront de le résoudre à l'amiable.

À cette fin, la partie la plus diligente notifiera le différend aux autres parties par lettre recommandée. Les parties se réuniront dans un délai de {{delai_reunion}} jours pour tenter de trouver une solution amiable.

2. MÉDIATION :

{{#if mediation}}
À défaut d'accord dans un délai de {{delai_negociation}} jours, les parties s'engagent à soumettre le différend à un médiateur désigné d'un commun accord ou, à défaut, par {{organisme_mediation}}.

La médiation se déroulera à {{lieu_mediation}} et ne pourra excéder {{duree_mediation}} mois.
{{/if}}

3. EXPERTISE :

{{#if expertise}}
Pour les questions techniques (notamment valorisation), les parties pourront saisir un expert désigné d'un commun accord ou, à défaut, par le Président du Tribunal de commerce de {{tribunal_expert}}.
{{/if}}

4. ARBITRAGE / JURIDICTION :

{{#if arbitrage}}
Tout litige sera tranché définitivement par arbitrage selon le Règlement {{reglement_arbitrage}}.
Siège : {{siege_arbitrage}}
Nombre d'arbitres : {{nombre_arbitres}}
{{else}}
À défaut de solution amiable, les tribunaux de {{juridiction_competente}} seront seuls compétents.
{{/if}}

5. MÉCANISME DE SORTIE :

{{#if sortie_deadlock}}
En cas de blocage persistant ("deadlock"), {{mecanisme_sortie}}.
{{/if}}`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'pacte', type: 'boolean', required: true },
      { name: 'delai_reunion', type: 'number', required: true },
      { name: 'mediation', type: 'boolean', required: true },
      { name: 'delai_negociation', type: 'number' },
      { name: 'organisme_mediation', type: 'string' },
      { name: 'lieu_mediation', type: 'string' },
      { name: 'duree_mediation', type: 'number' },
      { name: 'expertise', type: 'boolean' },
      { name: 'tribunal_expert', type: 'string' },
      { name: 'arbitrage', type: 'boolean', required: true },
      { name: 'reglement_arbitrage', type: 'string' },
      { name: 'siege_arbitrage', type: 'string' },
      { name: 'nombre_arbitres', type: 'number' },
      { name: 'juridiction_competente', type: 'string' },
      { name: 'sortie_deadlock', type: 'boolean' },
      { name: 'mecanisme_sortie', type: 'text' },
    ],
    tags: ['droit_affaires', 'societes', 'pacte', 'conflits', 'resolution', 'clause'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 202,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de sortie forcée (squeeze-out)',
    content: `ARTICLE {{numero_article}} - SORTIE FORCÉE (SQUEEZE-OUT)

1. OBJET :

La présente clause a pour objet de permettre aux Associés Majoritaires d'obliger les Associés Minoritaires à céder leurs {{type_titres}} dans certaines circonstances.

2. CONDITIONS DE MISE EN ŒUVRE :

Le droit de sortie forcée peut être exercé :
{{#if seuil_detention}}
- Lorsque les Associés Majoritaires détiennent au moins {{seuil_detention}}% du capital social
{{/if}}
{{#if operation_declenchement}}
- En cas de {{operation_declenchement}}
{{/if}}

3. PRIX DE CESSION :

Le prix de rachat des {{type_titres}} sera déterminé :
{{#if prix_operation}}
Au prix de l'opération déclenchant la sortie forcée.
{{else}}
Selon la formule suivante : {{formule_prix}}
{{/if}}

4. PROCÉDURE :

a) Notification aux Associés Minoritaires par LRAR avec {{delai_preavis}} jours de préavis
b) Les Associés Minoritaires disposeront d'un délai de {{delai_cession}} jours pour régulariser la cession
c) À défaut, les Associés Majoritaires pourront faire procéder à la cession d'office

5. GARANTIES :

{{#if sequestre}}
Le prix sera consigné auprès de {{sequestre}} jusqu'à régularisation de la cession.
{{/if}}`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'type_titres', type: 'string', required: true },
      { name: 'seuil_detention', type: 'number' },
      { name: 'operation_declenchement', type: 'string' },
      { name: 'prix_operation', type: 'boolean', required: true },
      { name: 'formule_prix', type: 'text' },
      { name: 'delai_preavis', type: 'number', required: true },
      { name: 'delai_cession', type: 'number', required: true },
      { name: 'sequestre', type: 'string' },
    ],
    tags: ['droit_affaires', 'societes', 'pacte', 'squeeze_out', 'sortie_forcee', 'clause'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 203,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause de répartition des résultats',
    content: `ARTICLE {{numero_article}} - RÉPARTITION DES RÉSULTATS

1. BÉNÉFICE DISTRIBUABLE :

Le bénéfice distribuable est constitué du bénéfice de l'exercice, diminué des pertes antérieures et des sommes portées en réserve en application de la loi ou des statuts, augmenté du report bénéficiaire.

2. RÉSERVE LÉGALE :

Une fraction égale à {{pourcentage_reserve_legale}}% du bénéfice de l'exercice, diminué le cas échéant des pertes antérieures, est affectée à la réserve légale. Cette affectation cesse d'être obligatoire lorsque la réserve atteint {{seuil_reserve_legale}}% du capital social.

3. AFFECTATION DU RÉSULTAT :

L'assemblée générale peut décider :
{{#each affectations}}
- {{this.description}} : {{this.pourcentage}}%
{{/each}}

4. DIVIDENDES PRIORITAIRES :

{{#if dividende_prioritaire}}
{{beneficiaires_prioritaires}} bénéficient d'un dividende prioritaire de {{montant_prioritaire}} euros par {{type_titre}}, prélevé en priorité sur le bénéfice distribuable.

{{#if cumul}}Ce dividende est cumulatif d'un exercice sur l'autre.{{/if}}
{{/if}}

5. ACOMPTES SUR DIVIDENDES :

{{#if acomptes_autorises}}
Le Président / Gérant peut décider la distribution d'acomptes sur dividendes, sous réserve des dispositions légales.
{{/if}}

6. MODALITÉS DE PAIEMENT :

Le paiement des dividendes intervient dans un délai maximum de {{delai_paiement}} mois à compter de la décision de distribution.`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'pourcentage_reserve_legale', type: 'number', required: true },
      { name: 'seuil_reserve_legale', type: 'number', required: true },
      { name: 'affectations', type: 'array' },
      { name: 'dividende_prioritaire', type: 'boolean' },
      { name: 'beneficiaires_prioritaires', type: 'string' },
      { name: 'montant_prioritaire', type: 'number' },
      { name: 'type_titre', type: 'string' },
      { name: 'cumul', type: 'boolean' },
      { name: 'acomptes_autorises', type: 'boolean' },
      { name: 'delai_paiement', type: 'number', required: true },
    ],
    tags: ['droit_affaires', 'societes', 'statuts', 'dividendes', 'repartition', 'clause'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 204,
  },
  {
    category: BlockCategory.CLAUSE,
    title: "Clause d'augmentation de capital",
    content: `ARTICLE {{numero_article}} - AUGMENTATION DE CAPITAL

1. MODALITÉS D'AUGMENTATION :

Le capital social peut être augmenté par décision {{organe_decision}}, notamment par :
- Émission de {{type_titres}} nouveaux
- Majoration de la valeur nominale des {{type_titres}} existants
- Incorporation de réserves, bénéfices ou primes d'émission

2. DROIT PRÉFÉRENTIEL DE SOUSCRIPTION :

{{#if dps}}
Les associés bénéficient d'un droit préférentiel de souscription aux {{type_titres}} nouveaux émis contre numéraire, proportionnellement au nombre de {{type_titres}} qu'ils possèdent.

Délai d'exercice : {{delai_dps}} jours à compter de l'ouverture de la souscription.

{{#if renonciation_dps}}
{{organe_decision}} peut décider de supprimer le DPS dans les conditions prévues par la loi.
{{/if}}
{{/if}}

3. PRIME D'ÉMISSION :

{{#if prime_emission}}
Les {{type_titres}} nouveaux peuvent être émis avec une prime d'émission fixée par {{organe_fixation_prime}}.
{{/if}}

4. LIBÉRATION :

Les {{type_titres}} nouveaux souscrits en numéraire doivent être libérés :
- D'au moins {{liberation_minimale}}% de leur valeur nominale lors de la souscription
- Le solde dans un délai de {{delai_liberation}} ans

5. APPORTS EN NATURE :

{{#if apports_nature}}
L'augmentation de capital par apports en nature est soumise à l'évaluation d'un commissaire aux apports désigné par {{autorite_designation}}.
{{/if}}`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'organe_decision', type: 'string', required: true },
      { name: 'type_titres', type: 'string', required: true },
      { name: 'dps', type: 'boolean', required: true },
      { name: 'delai_dps', type: 'number' },
      { name: 'renonciation_dps', type: 'boolean' },
      { name: 'prime_emission', type: 'boolean' },
      { name: 'organe_fixation_prime', type: 'string' },
      { name: 'liberation_minimale', type: 'number', required: true },
      { name: 'delai_liberation', type: 'number', required: true },
      { name: 'apports_nature', type: 'boolean' },
      { name: 'autorite_designation', type: 'string' },
    ],
    tags: ['droit_affaires', 'societes', 'statuts', 'capital', 'augmentation', 'clause'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 205,
  },
  {
    category: BlockCategory.CLAUSE,
    title: 'Clause audit préalable (due diligence)',
    content: `ARTICLE {{numero_article}} - AUDIT PRÉALABLE (DUE DILIGENCE)

1. OBJET :

Le Cessionnaire a procédé, préalablement à la signature {{#if promesse}}de la promesse de cession{{else}}du présent acte{{/if}}, à un audit de la Société portant sur les domaines suivants :

{{#each domaines_audit}}
- {{this.domaine}} : réalisé par {{this.cabinet}}
{{/each}}

2. DOCUMENTS MIS À DISPOSITION :

Le Cédant a mis à disposition du Cessionnaire une data room comprenant les documents listés en Annexe {{annexe_data_room}}.

3. DÉCLARATIONS DU CÉDANT :

Le Cédant déclare que :
- Les documents communiqués sont sincères et complets
- Aucun document significatif n'a été volontairement omis
- Les informations fournies reflètent fidèlement la situation de la Société

4. RÉSERVES DU CESSIONNAIRE :

{{#if reserves}}
Le Cessionnaire a formulé les réserves suivantes, qui ont fait l'objet d'ajustements :
{{reserves_details}}
{{else}}
Le Cessionnaire déclare avoir obtenu toutes les informations souhaitées et n'avoir formulé aucune réserve.
{{/if}}

5. GARANTIE :

{{#if garantie_completude}}
Le Cédant garantit le Cessionnaire contre toute conséquence dommageable résultant d'une information significative qui n'aurait pas été portée à sa connaissance.
{{/if}}

6. CONFIDENTIALITÉ :

Les informations obtenues dans le cadre de l'audit demeurent strictement confidentielles et ne peuvent être utilisées qu'aux fins de l'opération.`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'promesse', type: 'boolean', required: true },
      { name: 'domaines_audit', type: 'array', required: true },
      { name: 'annexe_data_room', type: 'string', required: true },
      { name: 'reserves', type: 'boolean', required: true },
      { name: 'reserves_details', type: 'text' },
      { name: 'garantie_completude', type: 'boolean' },
    ],
    tags: ['droit_affaires', 'cession', 'due_diligence', 'audit', 'clause'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 206,
  },
  {
    category: BlockCategory.CLAUSE,
    title: "Clause de garantie d'emploi",
    content: `ARTICLE {{numero_article}} - GARANTIE D'EMPLOI

1. ENGAGEMENT :

Le Cessionnaire s'engage, pendant une durée de {{duree_garantie}} mois à compter de la date de réalisation de la cession, à :

a) Maintenir l'emploi des salariés de la Société présents à la date de cession
b) Ne procéder à aucun licenciement économique
c) Maintenir les conditions de travail existantes

2. SALARIÉS CONCERNÉS :

{{#if liste_nominative}}
La présente garantie concerne les salariés suivants :
{{liste_salaries}}
{{else}}
La présente garantie concerne l'ensemble des {{nombre_salaries}} salariés de la Société à la date de cession.
{{/if}}

3. EXCLUSIONS :

Ne sont pas concernés par la présente garantie :
- Les licenciements pour faute grave ou lourde
- Les licenciements pour inaptitude physique
- Les départs volontaires (démission, départ à la retraite)
- Les ruptures conventionnelles à l'initiative du salarié

4. SANCTION :

{{#if indemnite_violation}}
En cas de violation de la présente clause, le Cessionnaire sera redevable envers le Cédant d'une indemnité de {{montant_indemnite}} euros par salarié licencié en violation de cet engagement.
{{/if}}

5. INFORMATION :

Le Cessionnaire s'engage à informer le Cédant de tout projet de restructuration susceptible d'affecter l'emploi.`,
    variables: [
      { name: 'numero_article', type: 'string', required: true },
      { name: 'duree_garantie', type: 'number', required: true },
      { name: 'liste_nominative', type: 'boolean', required: true },
      { name: 'liste_salaries', type: 'text' },
      { name: 'nombre_salaries', type: 'number' },
      { name: 'indemnite_violation', type: 'boolean' },
      { name: 'montant_indemnite', type: 'number' },
    ],
    tags: ['droit_affaires', 'cession', 'emploi', 'garantie', 'salaries', 'clause'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 207,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif - Dissolution anticipée société',
    content: `PAR CES MOTIFS

Le Tribunal, statuant publiquement, contradictoirement et en premier ressort,

{{#if recevabilite}}
DÉCLARE l'action de {{demandeur.nom}} recevable ;
{{/if}}

{{#if dissolution_prononcee}}
PRONONCE la dissolution anticipée de la société {{societe.denomination}}, {{societe.forme_juridique}} au capital de {{societe.capital}} euros, immatriculée au RCS de {{societe.rcs}} sous le numéro {{societe.siren}}, ayant son siège social {{societe.siege}} ;

{{#if justes_motifs}}
DIT que cette dissolution est prononcée pour justes motifs, à savoir :
{{motifs_dissolution}} ;
{{/if}}

DÉSIGNE {{liquidateur.nom}}, {{liquidateur.qualite}}, demeurant {{liquidateur.adresse}}, en qualité de liquidateur ;

FIXE la rémunération du liquidateur à {{remuneration_liquidateur}} ;

DIT que le liquidateur aura les pouvoirs les plus étendus pour procéder aux opérations de liquidation ;

ORDONNE la publication du présent jugement au BODACC et dans un journal d'annonces légales du département du siège social ;
{{else}}
DÉBOUTE {{demandeur.nom}} de sa demande de dissolution ;
{{/if}}

{{#if dommages_interets}}
CONDAMNE {{condamne.nom}} à payer à {{beneficiaire_di.nom}} la somme de {{montant_di}} euros à titre de dommages et intérêts ;
{{/if}}

{{#if article_700}}
CONDAMNE {{condamne_700.nom}} à payer à {{beneficiaire_700.nom}} la somme de {{montant_700}} euros au titre de l'article 700 du Code de procédure civile ;
{{/if}}

{{#if execution_provisoire}}
ORDONNE l'exécution provisoire du présent jugement ;
{{/if}}

CONDAMNE {{condamne_depens.nom}} aux entiers dépens.`,
    variables: [
      { name: 'recevabilite', type: 'boolean' },
      { name: 'demandeur.nom', type: 'string', required: true },
      { name: 'dissolution_prononcee', type: 'boolean', required: true },
      { name: 'societe.denomination', type: 'string', required: true },
      { name: 'societe.forme_juridique', type: 'string', required: true },
      { name: 'societe.capital', type: 'number', required: true },
      { name: 'societe.rcs', type: 'string', required: true },
      { name: 'societe.siren', type: 'string', required: true },
      { name: 'societe.siege', type: 'string', required: true },
      { name: 'justes_motifs', type: 'boolean' },
      { name: 'motifs_dissolution', type: 'text' },
      { name: 'liquidateur.nom', type: 'string' },
      { name: 'liquidateur.qualite', type: 'string' },
      { name: 'liquidateur.adresse', type: 'string' },
      { name: 'remuneration_liquidateur', type: 'string' },
      { name: 'dommages_interets', type: 'boolean' },
      { name: 'condamne.nom', type: 'string' },
      { name: 'beneficiaire_di.nom', type: 'string' },
      { name: 'montant_di', type: 'number' },
      { name: 'article_700', type: 'boolean' },
      { name: 'condamne_700.nom', type: 'string' },
      { name: 'beneficiaire_700.nom', type: 'string' },
      { name: 'montant_700', type: 'number' },
      { name: 'execution_provisoire', type: 'boolean' },
      { name: 'condamne_depens.nom', type: 'string', required: true },
    ],
    tags: ['droit_affaires', 'societes', 'dissolution', 'liquidation', 'dispositif'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 208,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif - Responsabilité dirigeant social',
    content: `PAR CES MOTIFS

Le Tribunal, statuant publiquement, contradictoirement et en premier ressort,

{{#if recevabilite}}
DÉCLARE l'action de {{demandeur.nom}} recevable ;
{{/if}}

Sur la responsabilité :

{{#if responsabilite_retenue}}
DIT que {{dirigeant.nom}}, en sa qualité de {{dirigeant.fonction}} de la société {{societe.denomination}}, a commis {{#if faute_gestion}}une faute de gestion{{/if}}{{#if violation_statuts}}une violation des statuts{{/if}}{{#if violation_loi}}une violation des dispositions légales applicables{{/if}} ;

RETIENT sa responsabilité {{#if responsabilite_solidaire}}solidaire avec {{coresponsables}}{{/if}} ;

{{#if fautes_caracterisees}}
DIT que les fautes caractérisées sont les suivantes :
{{description_fautes}} ;
{{/if}}
{{else}}
DIT que {{dirigeant.nom}} n'a commis aucune faute dans l'exercice de ses fonctions de {{dirigeant.fonction}} ;

DÉBOUTE {{demandeur.nom}} de l'ensemble de ses demandes ;
{{/if}}

Sur la réparation :

{{#if condamnation}}
CONDAMNE {{dirigeant.nom}} à payer {{#if societe_beneficiaire}}à la société {{societe.denomination}}{{else}}à {{beneficiaire.nom}}{{/if}} :

- La somme de {{montant_principal}} euros en réparation du préjudice {{type_prejudice}} ;
{{#if interets}}
- Avec intérêts au taux légal à compter du {{date_interets}} ;
{{/if}}
{{#if capitalisation}}
- Avec capitalisation des intérêts conformément à l'article 1343-2 du Code civil ;
{{/if}}
{{/if}}

{{#if mesure_complementaire}}
{{mesure_complementaire_detail}} ;
{{/if}}

{{#if article_700}}
CONDAMNE {{condamne_700.nom}} à payer à {{beneficiaire_700.nom}} la somme de {{montant_700}} euros au titre de l'article 700 du Code de procédure civile ;
{{/if}}

{{#if execution_provisoire}}
ORDONNE l'exécution provisoire du présent jugement ;
{{/if}}

CONDAMNE {{condamne_depens.nom}} aux entiers dépens.`,
    variables: [
      { name: 'recevabilite', type: 'boolean' },
      { name: 'demandeur.nom', type: 'string', required: true },
      { name: 'dirigeant.nom', type: 'string', required: true },
      { name: 'dirigeant.fonction', type: 'string', required: true },
      { name: 'societe.denomination', type: 'string', required: true },
      { name: 'responsabilite_retenue', type: 'boolean', required: true },
      { name: 'faute_gestion', type: 'boolean' },
      { name: 'violation_statuts', type: 'boolean' },
      { name: 'violation_loi', type: 'boolean' },
      { name: 'responsabilite_solidaire', type: 'boolean' },
      { name: 'coresponsables', type: 'string' },
      { name: 'fautes_caracterisees', type: 'boolean' },
      { name: 'description_fautes', type: 'text' },
      { name: 'condamnation', type: 'boolean' },
      { name: 'societe_beneficiaire', type: 'boolean' },
      { name: 'beneficiaire.nom', type: 'string' },
      { name: 'montant_principal', type: 'number' },
      { name: 'type_prejudice', type: 'string' },
      { name: 'interets', type: 'boolean' },
      { name: 'date_interets', type: 'date' },
      { name: 'capitalisation', type: 'boolean' },
      { name: 'mesure_complementaire', type: 'boolean' },
      { name: 'mesure_complementaire_detail', type: 'text' },
      { name: 'article_700', type: 'boolean' },
      { name: 'condamne_700.nom', type: 'string' },
      { name: 'beneficiaire_700.nom', type: 'string' },
      { name: 'montant_700', type: 'number' },
      { name: 'execution_provisoire', type: 'boolean' },
      { name: 'condamne_depens.nom', type: 'string', required: true },
    ],
    tags: ['droit_affaires', 'societes', 'responsabilite', 'dirigeant', 'dispositif'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 209,
  },
  {
    category: BlockCategory.SIGNATURE,
    title: 'Signature - Acte de cession',
    content: `Fait à {{lieu_signature}}, le {{date_signature}}

En {{nombre_exemplaires}} exemplaires originaux.

{{#if signature_electronique}}
Le présent acte est signé par voie électronique conformément aux dispositions du règlement (UE) n° 910/2014 du 23 juillet 2014 (eIDAS).
{{/if}}

---

LE CÉDANT :

{{cedant.nom}}
{{#if cedant.qualite}}Agissant en qualité de {{cedant.qualite}}{{/if}}
{{#if cedant.representant}}Représenté par {{cedant.representant}}{{/if}}

{{#if mention_lu_approuve}}
Mention manuscrite : "Lu et approuvé"
{{/if}}

Signature :


---

LE CESSIONNAIRE :

{{cessionnaire.nom}}
{{#if cessionnaire.qualite}}Agissant en qualité de {{cessionnaire.qualite}}{{/if}}
{{#if cessionnaire.representant}}Représenté par {{cessionnaire.representant}}{{/if}}

{{#if mention_lu_approuve}}
Mention manuscrite : "Lu et approuvé"
{{/if}}

Signature :


{{#if garant}}
---

LE GARANT :

{{garant.nom}}
{{#if garant.qualite}}Agissant en qualité de {{garant.qualite}}{{/if}}

Signature :

{{/if}}`,
    variables: [
      { name: 'lieu_signature', type: 'string', required: true },
      { name: 'date_signature', type: 'date', required: true },
      { name: 'nombre_exemplaires', type: 'number', required: true },
      { name: 'signature_electronique', type: 'boolean' },
      { name: 'cedant.nom', type: 'string', required: true },
      { name: 'cedant.qualite', type: 'string' },
      { name: 'cedant.representant', type: 'string' },
      { name: 'cessionnaire.nom', type: 'string', required: true },
      { name: 'cessionnaire.qualite', type: 'string' },
      { name: 'cessionnaire.representant', type: 'string' },
      { name: 'mention_lu_approuve', type: 'boolean' },
      { name: 'garant', type: 'boolean' },
      { name: 'garant.nom', type: 'string' },
      { name: 'garant.qualite', type: 'string' },
    ],
    tags: ['droit_affaires', 'cession', 'signature', 'acte'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 210,
  },
  {
    category: BlockCategory.SIGNATURE,
    title: "Signature - Pacte d'associés",
    content: `Fait à {{lieu_signature}}, le {{date_signature}}

En {{nombre_exemplaires}} exemplaires originaux, un pour chaque partie et un pour être déposé au siège social de la Société.

{{#if signature_electronique}}
Le présent pacte est signé par voie électronique conformément aux dispositions du règlement (UE) n° 910/2014 (eIDAS).
{{/if}}

{{#if paraphe}}
Chaque page du présent pacte a été paraphée par l'ensemble des parties.
{{/if}}

---

LES PARTIES :

{{#each signataires}}
{{this.nom}}
{{#if this.qualite}}{{this.qualite}}{{/if}}
{{#if this.representant}}Représenté(e) par {{this.representant}}, dûment habilité(e){{/if}}
Détenant {{this.pourcentage}}% du capital

Signature :


---
{{/each}}

{{#if notification_societe}}
POUR INFORMATION ET PRISE D'ACTE :

{{societe.denomination}}
Représentée par {{societe.representant}}, {{societe.qualite_representant}}

Signature :

{{/if}}`,
    variables: [
      { name: 'lieu_signature', type: 'string', required: true },
      { name: 'date_signature', type: 'date', required: true },
      { name: 'nombre_exemplaires', type: 'number', required: true },
      { name: 'signature_electronique', type: 'boolean' },
      { name: 'paraphe', type: 'boolean' },
      { name: 'signataires', type: 'array', required: true },
      { name: 'notification_societe', type: 'boolean' },
      { name: 'societe.denomination', type: 'string' },
      { name: 'societe.representant', type: 'string' },
      { name: 'societe.qualite_representant', type: 'string' },
    ],
    tags: ['droit_affaires', 'societes', 'pacte', 'signature'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 211,
  },
  {
    category: BlockCategory.MENTION_LEGALE,
    title: 'Mention - Registre mouvements de titres',
    content: `INSCRIPTION AU REGISTRE DES MOUVEMENTS DE TITRES

Le présent acte de cession sera inscrit au registre des mouvements de titres de la société {{societe.denomination}}.

{{#if ordre_mouvement}}
Ordre de mouvement n° {{numero_ordre}} établi le {{date_ordre}}.
{{/if}}

{{#if attestation_inscription}}
La société {{societe.denomination}} atteste que la présente cession a été inscrite au registre des mouvements de titres à la date du {{date_inscription}}.

{{societe.denomination}}
Représentée par {{representant.nom}}, {{representant.qualite}}

Signature :

{{/if}}

---

MISE À JOUR DU COMPTE D'ASSOCIÉ

{{#if compte_cedant}}
Compte de {{cedant.nom}} débité de {{nombre_titres}} {{type_titres}}.
Solde après mouvement : {{solde_cedant}} {{type_titres}}.
{{/if}}

{{#if compte_cessionnaire}}
Compte de {{cessionnaire.nom}} crédité de {{nombre_titres}} {{type_titres}}.
Solde après mouvement : {{solde_cessionnaire}} {{type_titres}}.
{{/if}}`,
    variables: [
      { name: 'societe.denomination', type: 'string', required: true },
      { name: 'ordre_mouvement', type: 'boolean' },
      { name: 'numero_ordre', type: 'string' },
      { name: 'date_ordre', type: 'date' },
      { name: 'attestation_inscription', type: 'boolean' },
      { name: 'date_inscription', type: 'date' },
      { name: 'representant.nom', type: 'string' },
      { name: 'representant.qualite', type: 'string' },
      { name: 'compte_cedant', type: 'boolean' },
      { name: 'cedant.nom', type: 'string' },
      { name: 'nombre_titres', type: 'number', required: true },
      { name: 'type_titres', type: 'string', required: true },
      { name: 'solde_cedant', type: 'number' },
      { name: 'compte_cessionnaire', type: 'boolean' },
      { name: 'cessionnaire.nom', type: 'string' },
      { name: 'solde_cessionnaire', type: 'number' },
    ],
    tags: ['droit_affaires', 'cession', 'registre', 'titres', 'mention_legale'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 212,
  },
  {
    category: BlockCategory.MENTION_LEGALE,
    title: 'Mention - Formalités cession fonds de commerce',
    content: `FORMALITÉS LÉGALES DE PUBLICITÉ

En application des articles L. 141-12 et suivants du Code de commerce, les formalités suivantes seront accomplies :

1. ENREGISTREMENT :

Le présent acte sera soumis à la formalité de l'enregistrement auprès du service des impôts des entreprises dans le délai d'un mois.

Droits d'enregistrement : {{#if montant_droits}}{{montant_droits}} euros{{else}}à calculer selon le barème en vigueur{{/if}}.
À la charge de : {{charge_droits}}.

2. PUBLICATIONS LÉGALES :

a) Publication dans un journal d'annonces légales du département du lieu du fonds :
{{#if publication_jal}}
Journal : {{nom_journal}}
Date de publication : {{date_publication_jal}}
{{/if}}

b) Publication au BODACC (Bulletin Officiel des Annonces Civiles et Commerciales) :
{{#if publication_bodacc}}
Inscription n° {{numero_bodacc}} du {{date_publication_bodacc}}
{{/if}}

3. OPPOSITION DES CRÉANCIERS :

Les créanciers du vendeur peuvent former opposition au paiement du prix dans un délai de {{delai_opposition}} jours à compter de la dernière publication.

{{#if sequestre}}
Le prix de vente est séquestré entre les mains de {{nom_sequestre}} pendant le délai d'opposition.
{{/if}}

4. DÉCLARATIONS FISCALES :

Le vendeur doit souscrire les déclarations fiscales suivantes :
- Déclaration de résultat dans les {{delai_declaration}} jours
- Déclaration de TVA
- Le cas échéant, déclaration de plus-value

5. FORMALITÉS COMPLÉMENTAIRES :

{{#each formalites_complementaires}}
- {{this}}
{{/each}}`,
    variables: [
      { name: 'montant_droits', type: 'number' },
      { name: 'charge_droits', type: 'string', required: true },
      { name: 'publication_jal', type: 'boolean' },
      { name: 'nom_journal', type: 'string' },
      { name: 'date_publication_jal', type: 'date' },
      { name: 'publication_bodacc', type: 'boolean' },
      { name: 'numero_bodacc', type: 'string' },
      { name: 'date_publication_bodacc', type: 'date' },
      { name: 'delai_opposition', type: 'number', required: true },
      { name: 'sequestre', type: 'boolean' },
      { name: 'nom_sequestre', type: 'string' },
      { name: 'delai_declaration', type: 'number', required: true },
      { name: 'formalites_complementaires', type: 'array' },
    ],
    tags: ['droit_affaires', 'cession', 'fonds_commerce', 'formalites', 'mention_legale'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 213,
  },
];

/**
 * Seeds business law blocks
 */
export async function seedDroitAffairesBlocks(cabinetId: string, userId: string): Promise<number> {
  console.log('Seeding business law blocks (droit des affaires)...');

  let createdCount = 0;

  for (const block of droitAffairesBlocks) {
    // Check if block already exists
    const existing = await prisma.documentBlock.findFirst({
      where: {
        title: block.title,
        isSystemBlock: true,
      },
    });

    if (existing) {
      console.log(`  Block already exists: "${block.title}"`);
      continue;
    }

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
  }

  console.log(`Created ${createdCount} business law blocks`);
  return createdCount;
}

// Export pour utilisation dans seed.ts
export { droitAffairesBlocks };
export type { DroitAffaireBlockSeed };
