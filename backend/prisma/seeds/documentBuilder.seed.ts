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
// SYSTEM BLOCKS (20 blocs)
// ============================================

const systemBlocks: BlockSeed[] = [
  // ============================================
  // INTRO BLOCKS (5)
  // ============================================
  {
    category: BlockCategory.INTRO,
    title: 'Introduction assignation Tribunal Judiciaire',
    content: `L'AN DEUX MILLE VINGT-SIX
Et le {{date_assignation}}

À la requête de :
{{client.civilite}} {{client.nom}} {{client.prenom}}
Demeurant {{client.adresse}}
{{client.codePostal}} {{client.ville}}

Représenté par Maître {{avocat.nom}}, Avocat au Barreau de {{avocat.barreau}}
Toque n° {{avocat.toque}}
{{avocat.adresse}}
Tél : {{avocat.telephone}} - Email : {{avocat.email}}

J'AI, {{huissier.nom}}, Commissaire de Justice,
Demeurant {{huissier.adresse}}

DONNÉ ASSIGNATION À :

{{adversaire.civilite}} {{adversaire.nom}} {{adversaire.prenom}}
Demeurant {{adversaire.adresse}}
{{adversaire.codePostal}} {{adversaire.ville}}

À COMPARAÎTRE devant le Tribunal Judiciaire de {{juridiction.ville}}
Le {{date_audience}} à {{heure_audience}}
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
    title: 'Introduction assignation en référé',
    content: `L'AN DEUX MILLE VINGT-SIX
Et le {{date_assignation}}

À la requête de :
{{client.civilite}} {{client.nom}} {{client.prenom}}
{{client.adresse}}, {{client.codePostal}} {{client.ville}}

Représenté par Maître {{avocat.nom}}, Avocat au Barreau de {{avocat.barreau}}

J'AI, {{huissier.nom}}, Commissaire de Justice,

DONNÉ ASSIGNATION EN RÉFÉRÉ À :

{{adversaire.civilite}} {{adversaire.nom}}
{{adversaire.adresse}}, {{adversaire.codePostal}} {{adversaire.ville}}

À COMPARAÎTRE EN RÉFÉRÉ devant Monsieur/Madame le Président du Tribunal Judiciaire de {{juridiction.ville}}
Le {{date_audience}} à {{heure_audience}}
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
    title: 'Convocation client à audience',
    content: `{{lieu}}, le {{date_courrier}}

{{client.civilite}} {{client.prenom}} {{client.nom}}
{{client.adresse}}
{{client.codePostal}} {{client.ville}}

Objet : Convocation à l'audience du {{date_audience}}
Dossier : {{affaire.intitule}}
N° RG : {{affaire.numero_rg}}

{{client.civilite}},

J'ai l'honneur de vous informer que votre affaire sera appelée à l'audience du {{date_audience}} à {{heure_audience}}.

Juridiction : {{juridiction.nom}}
Adresse : {{juridiction.adresse}}
Salle : {{salle_audience}}

Votre présence est {{#if presence_obligatoire}}OBLIGATOIRE{{else}}souhaitée{{/if}}.

{{#if documents_apporter}}
Merci de vous munir des documents suivants :
{{documents_apporter}}
{{/if}}

Je reste à votre disposition pour tout renseignement complémentaire.

Veuillez agréer, {{client.civilite}}, l'expression de mes salutations distinguées.`,
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
    displayOrder: 3,
  },
  {
    category: BlockCategory.INTRO,
    title: 'En-tête conclusions récapitulatives',
    content: `CONCLUSIONS RÉCAPITULATIVES

POUR :
{{client.civilite}} {{client.prenom}} {{client.nom}}
{{client.adresse}}, {{client.codePostal}} {{client.ville}}
{{#if client.qualite}}{{client.qualite}}{{/if}}

Représenté par Maître {{avocat.nom}}
Avocat au Barreau de {{avocat.barreau}}

CONTRE :
{{adversaire.civilite}} {{adversaire.nom}}
{{adversaire.adresse}}, {{adversaire.codePostal}} {{adversaire.ville}}
{{#if adversaire.qualite}}{{adversaire.qualite}}{{/if}}

{{#if adversaire.avocat}}Représenté par Maître {{adversaire.avocat}}{{/if}}

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
    displayOrder: 4,
  },
  {
    category: BlockCategory.INTRO,
    title: 'En-tête mise en demeure',
    content: `{{lieu}}, le {{date_courrier}}

LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION
{{#if reference}}Réf. : {{reference}}{{/if}}

{{destinataire.civilite}} {{destinataire.nom}}
{{#if destinataire.societe}}{{destinataire.societe}}{{/if}}
{{destinataire.adresse}}
{{destinataire.codePostal}} {{destinataire.ville}}

Objet : MISE EN DEMEURE

{{destinataire.civilite}},

Nous intervenons en qualité de conseil de {{client.civilite}} {{client.prenom}} {{client.nom}}.`,
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
    displayOrder: 5,
  },

  // ============================================
  // FAITS BLOCKS (5)
  // ============================================
  {
    category: BlockCategory.FAITS,
    title: 'Chronologie rupture contrat commercial',
    content: `I. RAPPEL DES FAITS

{{#if contrat.date_signature}}
Le {{contrat.date_signature}}, les parties ont conclu un contrat de {{contrat.type}} portant sur {{contrat.objet}}.
{{/if}}

{{#if contrat.duree}}
Ce contrat a été conclu pour une durée de {{contrat.duree}}, {{#if contrat.renouvelable}}renouvelable par tacite reconduction{{/if}}.
{{/if}}

{{#if contrat.conditions_particulieres}}
Les conditions particulières suivantes ont été convenues :
{{contrat.conditions_particulieres}}
{{/if}}

{{#if contrat.date_rupture}}
Le {{contrat.date_rupture}}, {{partie_adverse}} a notifié la rupture du contrat {{#if preavis_respecte}}en respectant{{else}}sans respecter{{/if}} le préavis contractuel de {{preavis_contractuel}}.
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
    displayOrder: 10,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé créance impayée',
    content: `I. RAPPEL DES FAITS

{{client.civilite}} {{client.nom}} est créancier de {{debiteur.nom}} au titre de {{origine_creance}}.

{{#if factures}}
Les factures suivantes sont demeurées impayées :
{{#each factures}}
- Facture n° {{this.numero}} du {{this.date}} : {{this.montant}} € {{#if this.echeance}}(échéance : {{this.echeance}}){{/if}}
{{/each}}

Soit un total de {{montant_total}} € TTC.
{{/if}}

{{#if relances}}
Malgré plusieurs relances en date des {{relances}}, {{debiteur.nom}} n'a pas procédé au règlement de sa dette.
{{/if}}

{{#if mise_en_demeure_date}}
Une mise en demeure lui a été adressée le {{mise_en_demeure_date}} par {{mise_en_demeure_mode}}, demeurée sans effet.
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
    displayOrder: 11,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé litige locatif',
    content: `I. RAPPEL DES FAITS

Par bail en date du {{bail.date_signature}}, {{bailleur.civilite}} {{bailleur.nom}} a donné à bail à {{locataire.civilite}} {{locataire.nom}} un logement situé {{logement.adresse}}, {{logement.codePostal}} {{logement.ville}}.

Le loyer mensuel a été fixé à {{loyer.montant}} €, {{#if loyer.charges}}charges comprises{{else}}hors charges (provisions pour charges : {{loyer.provisions_charges}} €){{/if}}.

{{#if impayes}}
Or, depuis le {{impayes.debut}}, le locataire ne s'acquitte plus régulièrement de ses obligations.

À ce jour, l'arriéré locatif s'élève à la somme de {{impayes.montant}} €, correspondant à :
{{impayes.detail}}
{{/if}}

{{#if commandement_date}}
Un commandement de payer visant la clause résolutoire lui a été délivré le {{commandement_date}}.
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
    displayOrder: 12,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé licenciement contesté',
    content: `I. RAPPEL DES FAITS

{{salarie.civilite}} {{salarie.nom}} a été embauché(e) par {{employeur.nom}} le {{contrat.date_embauche}} en qualité de {{contrat.poste}}, statut {{contrat.statut}}, moyennant une rémunération mensuelle brute de {{contrat.salaire}} €.

{{#if contrat.anciennete}}
Son ancienneté dans l'entreprise est de {{contrat.anciennete}}.
{{/if}}

Le {{licenciement.date_notification}}, {{salarie.civilite}} {{salarie.nom}} a été licencié(e) pour {{licenciement.motif}}.

{{#if licenciement.entretien_prealable}}
L'entretien préalable s'est tenu le {{licenciement.entretien_prealable}}.
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
    displayOrder: 13,
  },
  {
    category: BlockCategory.FAITS,
    title: 'Exposé accident circulation',
    content: `I. RAPPEL DES FAITS

Le {{accident.date}} à {{accident.heure}}, un accident de la circulation est survenu {{accident.lieu}}.

Véhicules impliqués :
- Véhicule de {{victime.nom}} : {{victime.vehicule}} immatriculé {{victime.immatriculation}}
- Véhicule de {{responsable.nom}} : {{responsable.vehicule}} immatriculé {{responsable.immatriculation}}

Circonstances :
{{accident.circonstances}}

{{#if accident.constat}}
Un constat amiable a été établi le {{accident.date_constat}}.
{{/if}}

{{#if accident.pv}}
Un procès-verbal a été dressé par {{accident.autorite}} sous le numéro {{accident.numero_pv}}.
{{/if}}

{{#if prejudices}}
{{victime.civilite}} {{victime.nom}} a subi les préjudices suivants :
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
    displayOrder: 14,
  },

  // ============================================
  // MOYENS BLOCKS (5)
  // ============================================
  {
    category: BlockCategory.MOYENS,
    title: 'Force obligatoire des contrats (art. 1103)',
    content: `II. DISCUSSION

A. Sur la force obligatoire du contrat

Aux termes de l'article 1103 du Code civil : "Les contrats légalement formés tiennent lieu de loi à ceux qui les ont faits."

En l'espèce, le contrat conclu entre les parties le {{contrat.date_signature}} remplit toutes les conditions de validité requises par les articles 1128 et suivants du Code civil :
- Consentement des parties : {{argument_consentement}}
- Capacité de contracter : les parties étaient pleinement capables
- Contenu licite et certain : {{argument_contenu}}

Par conséquent, ce contrat s'impose aux parties avec la même force qu'une loi.

{{partie_adverse}} ne saurait donc s'affranchir unilatéralement de ses obligations contractuelles.`,
    variables: [
      { name: 'contrat.date_signature', type: 'date', required: true },
      { name: 'argument_consentement', type: 'text' },
      { name: 'argument_contenu', type: 'text' },
      { name: 'partie_adverse', type: 'string', required: true },
    ],
    tags: ['moyens', 'code_civil', 'contrats', 'force_obligatoire'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 20,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Inexécution contractuelle (art. 1217)',
    content: `B. Sur l'inexécution contractuelle

L'article 1217 du Code civil dispose : "La partie envers laquelle l'engagement n'a pas été exécuté, ou l'a été imparfaitement, peut :
- refuser d'exécuter ou suspendre l'exécution de sa propre obligation ;
- poursuivre l'exécution forcée en nature de l'obligation ;
- obtenir une réduction du prix ;
- provoquer la résolution du contrat ;
- demander réparation des conséquences de l'inexécution."

En l'espèce, {{partie_adverse}} a manqué à son obligation de {{obligation_violee}} prévue {{#if clause_reference}}à l'article {{clause_reference}} du contrat{{else}}par le contrat{{/if}}.

Cette inexécution est caractérisée par :
{{elements_inexecution}}

{{client.nom}} est donc fondé(e) à demander {{sanction_demandee}}.`,
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
    displayOrder: 21,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Provision référé (art. 835 CPC)',
    content: `II. DISCUSSION

Sur le bien-fondé de la demande de provision

Aux termes de l'article 835 alinéa 2 du Code de procédure civile, le Président du tribunal judiciaire peut "accorder une provision au créancier" lorsque "l'existence de l'obligation n'est pas sérieusement contestable".

En l'espèce, l'obligation de {{debiteur.nom}} n'est pas sérieusement contestable :

1. Elle est fondée sur {{fondement_obligation}}

2. Elle est certaine :
{{arguments_certitude}}

3. Elle est liquide : la créance s'élève à {{montant_creance}} €

4. Elle est exigible depuis le {{date_exigibilite}}

Par conséquent, il y a lieu d'accorder à {{creancier.nom}} une provision de {{montant_provision}} € à valoir sur l'indemnisation de son préjudice.`,
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
    displayOrder: 22,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Licenciement sans cause réelle et sérieuse',
    content: `II. DISCUSSION

A. Sur l'absence de cause réelle et sérieuse du licenciement

En application des articles L. 1232-1 et L. 1235-1 du Code du travail, tout licenciement pour motif personnel doit être justifié par une cause réelle et sérieuse.

La jurisprudence constante de la Cour de cassation (Soc., 14 mai 1996, n° 94-45.499) précise que la cause doit être :
- Réelle : objective, exacte et vérifiable
- Sérieuse : suffisamment grave pour justifier la rupture

En l'espèce, le motif invoqué par l'employeur ne constitue pas une cause réelle et sérieuse :

{{#if argument_realite}}
1. Sur le défaut de réalité :
{{argument_realite}}
{{/if}}

{{#if argument_gravite}}
2. Sur le défaut de gravité suffisante :
{{argument_gravite}}
{{/if}}

Par conséquent, le licenciement doit être déclaré sans cause réelle et sérieuse.`,
    variables: [
      { name: 'argument_realite', type: 'text' },
      { name: 'argument_gravite', type: 'text' },
    ],
    tags: ['moyens', 'travail', 'licenciement', 'cause_reelle_serieuse'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 23,
  },
  {
    category: BlockCategory.MOYENS,
    title: 'Clause résolutoire bail (art. 24 loi 1989)',
    content: `II. DISCUSSION

Sur l'acquisition de la clause résolutoire

L'article 24 de la loi n° 89-462 du 6 juillet 1989 dispose que toute clause prévoyant la résiliation de plein droit du bail pour défaut de paiement du loyer ou des charges ne produit effet que deux mois après un commandement de payer demeuré infructueux.

En l'espèce :

1. Le bail contient une clause résolutoire (article {{clause_reference}})

2. Un commandement de payer a été délivré le {{commandement_date}} pour un montant de {{commandement_montant}} €

3. Ce commandement est demeuré infructueux au-delà du délai de deux mois

4. {{#if assignation_delai_respecte}}L'assignation a été délivrée plus de deux mois après le commandement{{/if}}

Par conséquent, la clause résolutoire est acquise et le bail doit être résilié.`,
    variables: [
      { name: 'clause_reference', type: 'string' },
      { name: 'commandement_date', type: 'date', required: true },
      { name: 'commandement_montant', type: 'number', required: true },
      { name: 'assignation_delai_respecte', type: 'boolean' },
    ],
    tags: ['moyens', 'bail', 'clause_resolutoire', 'expulsion'],
    isSystemBlock: true,
    isMandatory: false,
    displayOrder: 24,
  },

  // ============================================
  // DISPOSITIF BLOCKS (3)
  // ============================================
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Condamnation au paiement de somme',
    content: `PAR CES MOTIFS

Vu les articles {{articles_vises}},
Vu les pièces versées aux débats,

PLAISE AU TRIBUNAL :

- DÉCLARER {{demandeur.nom}} recevable et bien fondé(e) en ses demandes ;

- CONDAMNER {{defendeur.nom}} à payer à {{demandeur.nom}} :
  * La somme de {{montant_principal}} € ({{montant_principal_lettres}} euros) au titre de {{motif_principal}} ;
  {{#if montant_accessoire}}
  * La somme de {{montant_accessoire}} € au titre de {{motif_accessoire}} ;
  {{/if}}
  {{#if interets}}
  * Les intérêts au taux légal à compter du {{date_interets}} ;
  {{/if}}
  {{#if capitalisation}}
  * Ordonner la capitalisation des intérêts conformément à l'article 1343-2 du Code civil ;
  {{/if}}

- CONDAMNER {{defendeur.nom}} aux entiers dépens ;

- CONDAMNER {{defendeur.nom}} à payer à {{demandeur.nom}} la somme de {{article_700}} € au titre de l'article 700 du Code de procédure civile ;

{{#if execution_provisoire}}
- ORDONNER l'exécution provisoire de la décision à intervenir ;
{{/if}}

- DÉBOUTER {{defendeur.nom}} de l'ensemble de ses demandes, fins et conclusions.`,
    variables: [
      { name: 'articles_vises', type: 'string', required: true },
      { name: 'demandeur.nom', type: 'string', required: true },
      { name: 'defendeur.nom', type: 'string', required: true },
      { name: 'montant_principal', type: 'number', required: true },
      { name: 'montant_principal_lettres', type: 'string' },
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
    displayOrder: 30,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif référé provision',
    content: `PAR CES MOTIFS

Vu l'article 835 du Code de procédure civile,

PLAISE À MONSIEUR/MADAME LE PRÉSIDENT STATUANT EN RÉFÉRÉ :

- CONSTATER que l'obligation de {{debiteur.nom}} n'est pas sérieusement contestable ;

- CONDAMNER {{debiteur.nom}} à payer à {{creancier.nom}} une PROVISION de {{montant_provision}} € ({{montant_provision_lettres}} euros) à valoir sur l'indemnisation de son préjudice ;

- CONDAMNER {{debiteur.nom}} aux dépens de l'instance ;

- CONDAMNER {{debiteur.nom}} à payer à {{creancier.nom}} la somme de {{article_700}} € au titre de l'article 700 du Code de procédure civile ;

- RAPPELER que l'exécution provisoire est de droit ;

- DÉBOUTER {{debiteur.nom}} de l'ensemble de ses demandes.`,
    variables: [
      { name: 'debiteur.nom', type: 'string', required: true },
      { name: 'creancier.nom', type: 'string', required: true },
      { name: 'montant_provision', type: 'number', required: true },
      { name: 'montant_provision_lettres', type: 'string' },
      { name: 'article_700', type: 'number', required: true },
    ],
    tags: ['dispositif', 'refere', 'provision'],
    isSystemBlock: true,
    isMandatory: true,
    displayOrder: 31,
  },
  {
    category: BlockCategory.DISPOSITIF,
    title: 'Dispositif expulsion locataire',
    content: `PAR CES MOTIFS

Vu les articles 24 et suivants de la loi n° 89-462 du 6 juillet 1989,
Vu les articles L. 412-1 et suivants du Code des procédures civiles d'exécution,

PLAISE AU TRIBUNAL :

- CONSTATER l'acquisition de la clause résolutoire insérée au bail ;

- PRONONCER en conséquence la résiliation du bail liant les parties ;

- ORDONNER l'expulsion de {{locataire.nom}} et de tous occupants de son chef des lieux sis {{logement.adresse}}, {{logement.codePostal}} {{logement.ville}}, avec si besoin le concours de la force publique ;

- CONDAMNER {{locataire.nom}} au paiement de la somme de {{arrieres}} € au titre des arriérés locatifs arrêtés au {{date_arrete}} ;

- CONDAMNER {{locataire.nom}} au paiement d'une indemnité d'occupation égale au montant du loyer et des charges, soit {{indemnite_occupation}} € par mois, jusqu'à la libération effective des lieux ;

- CONDAMNER {{locataire.nom}} aux entiers dépens, en ce compris le coût du commandement de payer ;

- CONDAMNER {{locataire.nom}} à payer à {{bailleur.nom}} la somme de {{article_700}} € au titre de l'article 700 du Code de procédure civile ;

- ORDONNER l'exécution provisoire de la présente décision.`,
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
    displayOrder: 32,
  },

  // ============================================
  // SIGNATURE BLOCKS (2)
  // ============================================
  {
    category: BlockCategory.SIGNATURE,
    title: 'Signature avocat standard',
    content: `Sous toutes réserves

Fait à {{cabinet.ville}}, le {{date_signature}}

Pour {{client.civilite}} {{client.nom}},
Son Conseil,

Maître {{avocat.prenom}} {{avocat.nom}}
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
    displayOrder: 40,
  },
  {
    category: BlockCategory.SIGNATURE,
    title: 'Bordereau de pièces',
    content: `BORDEREAU DE COMMUNICATION DE PIÈCES

Affaire : {{affaire.intitule}}
N° RG : {{affaire.numero_rg}}

{{#each pieces}}
Pièce n° {{this.numero}} : {{this.intitule}}
{{/each}}

Soit {{nombre_pieces}} pièce(s) au total.

Dont il est certifié que copie a été communiquée à {{#if adversaire.avocat}}Maître {{adversaire.avocat}}, conseil de {{adversaire.nom}}{{else}}{{adversaire.nom}}{{/if}} par {{mode_communication}} le {{date_communication}}.

Fait à {{cabinet.ville}}, le {{date_signature}}

Maître {{avocat.nom}}`,
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
    displayOrder: 41,
  },
];

// ============================================
// SYSTEM TEMPLATES (5 templates)
// ============================================

const systemTemplates: TemplateSeed[] = [
  {
    name: 'Convocation audience Tribunal Judiciaire',
    documentType: BuilderDocumentType.CONVOCATION_AUDIENCE,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blocksStructure: [
      { blockTitle: 'Convocation client à audience', order: 1, isOptional: false },
      { blockTitle: 'Signature avocat standard', order: 2, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: true, autoStore: true },
    legalMentions: {
      afficherBarreau: true,
      afficherToque: true,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: 'Assignation en référé provision',
    documentType: BuilderDocumentType.ASSIGNATION_REFERE,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blocksStructure: [
      { blockTitle: 'Introduction assignation en référé', order: 1, isOptional: false },
      { blockTitle: 'Exposé créance impayée', order: 2, isOptional: false },
      { blockTitle: 'Provision référé (art. 835 CPC)', order: 3, isOptional: false },
      { blockTitle: 'Dispositif référé provision', order: 4, isOptional: false },
      { blockTitle: 'Bordereau de pièces', order: 5, isOptional: true },
      { blockTitle: 'Signature avocat standard', order: 6, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: true,
      afficherToque: true,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: 'Conclusions récapitulatives fond',
    documentType: BuilderDocumentType.CONCLUSIONS_RECAPITULATIVES,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blocksStructure: [
      { blockTitle: 'En-tête conclusions récapitulatives', order: 1, isOptional: false },
      { blockTitle: 'Chronologie rupture contrat commercial', order: 2, isOptional: true },
      { blockTitle: 'Force obligatoire des contrats (art. 1103)', order: 3, isOptional: true },
      { blockTitle: 'Inexécution contractuelle (art. 1217)', order: 4, isOptional: true },
      { blockTitle: 'Condamnation au paiement de somme', order: 5, isOptional: false },
      { blockTitle: 'Bordereau de pièces', order: 6, isOptional: false },
      { blockTitle: 'Signature avocat standard', order: 7, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: true,
      afficherToque: true,
      positionMentions: 'SIGNATURE',
    },
    isSystemTemplate: true,
  },
  {
    name: 'Mise en demeure paiement',
    documentType: BuilderDocumentType.MISE_EN_DEMEURE,
    juridiction: null,
    blocksStructure: [
      { blockTitle: 'En-tête mise en demeure', order: 1, isOptional: false },
      { blockTitle: 'Exposé créance impayée', order: 2, isOptional: false },
      { blockTitle: 'Signature avocat standard', order: 3, isOptional: false },
    ],
    outputFormat: OutputFormat.PDF,
    workflowConfig: { signature: false, lrar: true, autoStore: true },
    legalMentions: {
      afficherBarreau: true,
      afficherToque: false,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
  {
    name: 'Assignation expulsion locataire',
    documentType: BuilderDocumentType.ASSIGNATION_FOND,
    juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
    blocksStructure: [
      { blockTitle: 'Introduction assignation Tribunal Judiciaire', order: 1, isOptional: false },
      { blockTitle: 'Exposé litige locatif', order: 2, isOptional: false },
      { blockTitle: 'Clause résolutoire bail (art. 24 loi 1989)', order: 3, isOptional: false },
      { blockTitle: 'Dispositif expulsion locataire', order: 4, isOptional: false },
      { blockTitle: 'Bordereau de pièces', order: 5, isOptional: true },
      { blockTitle: 'Signature avocat standard', order: 6, isOptional: false },
    ],
    outputFormat: OutputFormat.DOCX,
    workflowConfig: { signature: false, lrar: false, autoStore: true },
    legalMentions: {
      afficherBarreau: true,
      afficherToque: true,
      positionMentions: 'FOOTER',
    },
    isSystemTemplate: true,
  },
];

export async function seedDocumentBuilder(cabinetId: string, userId: string) {
  console.log('Seeding Document Builder module...');

  // Clean existing data
  await prisma.generatedDocument.deleteMany({ where: { cabinetId } });
  await prisma.builderTemplate.deleteMany({ where: { cabinetId } });
  await prisma.documentBlock.deleteMany({ where: { cabinetId } });

  // Create system blocks
  console.log('Creating system blocks...');
  const createdBlocks: Map<string, string> = new Map();

  for (const block of systemBlocks) {
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
  }

  console.log(`Created ${systemBlocks.length} system blocks`);

  // Create system templates
  console.log('Creating system templates...');

  for (const template of systemTemplates) {
    // Build blocks structure with actual IDs
    const blocksStructure = template.blocksStructure.map((bs) => ({
      blockId: createdBlocks.get(bs.blockTitle) || '',
      order: bs.order,
      isOptional: bs.isOptional,
    }));

    // Collect required variables from all blocks
    const requiredVariables: Array<{ name: string; type: string; required?: boolean }> = [];
    for (const bs of template.blocksStructure) {
      const blockDef = systemBlocks.find((b) => b.title === bs.blockTitle);
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

  console.log('Document Builder seeding completed!');
}

// Run if called directly
if (require.main === module) {
  const cabinetId = process.argv[2];
  const userId = process.argv[3];

  if (!cabinetId || !userId) {
    console.error('Usage: npx tsx prisma/seeds/documentBuilder.seed.ts <cabinetId> <userId>');
    process.exit(1);
  }

  seedDocumentBuilder(cabinetId, userId)
    .catch((e) => {
      console.error('Error during seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
