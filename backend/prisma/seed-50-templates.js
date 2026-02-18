const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ============================================================================
// 50 TEMPLATES JURIDIQUES SYSTÈME
// ============================================================================

const TEMPLATES = [

  // ========================================
  // CATÉGORIE : PROCÉDURE CIVILE (15 templates)
  // ========================================

  {
    name: 'Assignation en Paiement - Tribunal Judiciaire',
    documentType: 'ASSIGNATION',
    juridiction: 'Tribunal Judiciaire',
    category: 'PROCEDURE',
    description: 'Assignation devant le Tribunal Judiciaire pour demande de condamnation au paiement d\'une somme',
    blocksStructure: [
      { blockTitle: 'Intro Assignation Tribunal Judiciaire', order: 1, isOptional: false },
      { blockTitle: 'Rappel Contrat Commercial', order: 2, isOptional: false },
      { blockTitle: 'Inexécution Contractuelle Détaillée', order: 3, isOptional: false },
      { blockTitle: 'Article 1103 Code Civil - Force Obligatoire', order: 4, isOptional: false },
      { blockTitle: 'Article 1217 Code Civil - Inexécution', order: 5, isOptional: false },
      { blockTitle: 'Article 1231-1 Code Civil - Dommages-Intérêts', order: 6, isOptional: true },
      { blockTitle: 'Condamnation Paiement Somme', order: 7, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 8, isOptional: false },
    ],
    requiredVariables: [
      'date_assignation', 'client.nom', 'adversaire.nom', 'date_contrat',
      'objet_contrat', 'montant_principal', 'date_interets', 'montant_451',
      'avocat.nom', 'avocat.barreau', 'huissier.nom', 'juridiction', 'date_audience'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Assignation en Référé d\'Heure à Heure',
    documentType: 'ASSIGNATION',
    juridiction: 'Tribunal Judiciaire',
    category: 'PROCEDURE',
    description: 'Assignation en référé d\'urgence pour troubles manifestement illicites',
    blocksStructure: [
      { blockTitle: 'Intro Assignation Référé Urgence', order: 1, isOptional: false },
      { blockTitle: 'Chronologie Relation Contractuelle', order: 2, isOptional: false },
      { blockTitle: 'Article 1240 Code Civil - Responsabilité Délictuelle', order: 3, isOptional: false },
      { blockTitle: 'Condamnation Paiement Somme', order: 4, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 5, isOptional: false },
    ],
    requiredVariables: [
      'date_assignation', 'client.nom', 'adversaire.nom', 'motif_urgence',
      'date_audience', 'heure_audience', 'montant_principal'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Conclusions en Défense - Tribunal Judiciaire',
    documentType: 'CONCLUSIONS',
    juridiction: 'Tribunal Judiciaire',
    category: 'PROCEDURE',
    description: 'Conclusions en défense pour répondre à une assignation',
    blocksStructure: [
      { blockTitle: 'Intro Conclusions en Défense', order: 1, isOptional: false },
      { blockTitle: 'Chronologie Relation Contractuelle', order: 2, isOptional: false },
      { blockTitle: 'Article 1103 Code Civil - Force Obligatoire', order: 3, isOptional: false },
      { blockTitle: 'Résolution Contrat + Dommages-Intérêts', order: 4, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 5, isOptional: false },
    ],
    requiredVariables: [
      'client.nom', 'adversaire.nom', 'numero_rg', 'juridiction',
      'date_contrat', 'avocat.nom', 'avocat.barreau'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Requête en Référé - Mesures Conservatoires',
    documentType: 'REQUETE',
    juridiction: 'Tribunal Judiciaire',
    category: 'PROCEDURE',
    description: 'Requête en référé pour obtenir des mesures conservatoires',
    blocksStructure: [
      { blockTitle: 'Intro Requête en Référé', order: 1, isOptional: false },
      { blockTitle: 'Chronologie Relation Contractuelle', order: 2, isOptional: false },
      { blockTitle: 'Article 1240 Code Civil - Responsabilité Délictuelle', order: 3, isOptional: false },
      { blockTitle: 'Condamnation Paiement Somme', order: 4, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 5, isOptional: false },
    ],
    requiredVariables: [
      'client.nom', 'adversaire.nom', 'juridiction', 'avocat.nom'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Conclusions d\'Appel - Cour d\'Appel',
    documentType: 'CONCLUSIONS',
    juridiction: 'Cour d\'Appel',
    category: 'PROCEDURE',
    description: 'Conclusions d\'appelant devant la Cour d\'Appel',
    blocksStructure: [
      { blockTitle: 'Intro Conclusions Appel', order: 1, isOptional: false },
      { blockTitle: 'Rappel Contrat Commercial', order: 2, isOptional: false },
      { blockTitle: 'Article 1217 Code Civil - Inexécution', order: 3, isOptional: false },
      { blockTitle: 'Condamnation Paiement Somme', order: 4, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 5, isOptional: false },
    ],
    requiredVariables: [
      'client.nom', 'adversaire.nom', 'numero_rg', 'juridiction'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Contredit - Déclinatoire de Compétence',
    documentType: 'CONTREDIT',
    juridiction: 'Tribunal Judiciaire',
    category: 'PROCEDURE',
    description: 'Contredit contestant la compétence du tribunal',
    blocksStructure: [
      { blockTitle: 'Intro Contredit', order: 1, isOptional: false },
      { blockTitle: 'Chronologie Relation Contractuelle', order: 2, isOptional: false },
      { blockTitle: 'Article 1103 Code Civil - Force Obligatoire', order: 3, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 4, isOptional: false },
    ],
    requiredVariables: [
      'client.nom', 'numero_rg', 'juridiction'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Assignation à Jour Fixe',
    documentType: 'ASSIGNATION',
    juridiction: 'Tribunal Judiciaire',
    category: 'PROCEDURE',
    description: 'Assignation à jour fixe avec ordonnance préalable du président',
    blocksStructure: [
      { blockTitle: 'Intro Assignation Jour Fixe', order: 1, isOptional: false },
      { blockTitle: 'Rappel Contrat Commercial', order: 2, isOptional: false },
      { blockTitle: 'Article 1217 Code Civil - Inexécution', order: 3, isOptional: false },
      { blockTitle: 'Condamnation Paiement Somme', order: 4, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 5, isOptional: false },
    ],
    requiredVariables: [
      'date_assignation', 'client.nom', 'adversaire.nom', 'date_ordonnance',
      'juridiction', 'date_audience', 'heure_audience'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Conclusions Référé-Provision',
    documentType: 'CONCLUSIONS',
    juridiction: 'Tribunal Judiciaire',
    category: 'PROCEDURE',
    description: 'Conclusions en référé-provision pour créance non sérieusement contestable',
    blocksStructure: [
      { blockTitle: 'Intro Conclusions Référé-Provision', order: 1, isOptional: false },
      { blockTitle: 'Rappel Contrat Commercial', order: 2, isOptional: false },
      { blockTitle: 'Article 1103 Code Civil - Force Obligatoire', order: 3, isOptional: false },
      { blockTitle: 'Condamnation Paiement Somme', order: 4, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 5, isOptional: false },
    ],
    requiredVariables: [
      'client.nom', 'adversaire.nom', 'montant_principal'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Conclusions Intervention Volontaire',
    documentType: 'CONCLUSIONS',
    juridiction: 'Tribunal Judiciaire',
    category: 'PROCEDURE',
    description: 'Conclusions d\'intervention volontaire dans une instance en cours',
    blocksStructure: [
      { blockTitle: 'Intro Conclusions Intervention Volontaire', order: 1, isOptional: false },
      { blockTitle: 'Chronologie Relation Contractuelle', order: 2, isOptional: false },
      { blockTitle: 'Article 1103 Code Civil - Force Obligatoire', order: 3, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 4, isOptional: false },
    ],
    requiredVariables: [
      'client.nom', 'demandeur.nom', 'defendeur.nom', 'numero_rg'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Conclusions Appel en Garantie',
    documentType: 'CONCLUSIONS',
    juridiction: 'Tribunal Judiciaire',
    category: 'PROCEDURE',
    description: 'Conclusions pour appeler un tiers en garantie',
    blocksStructure: [
      { blockTitle: 'Intro Conclusions Appel en Garantie', order: 1, isOptional: false },
      { blockTitle: 'Chronologie Relation Contractuelle', order: 2, isOptional: false },
      { blockTitle: 'Article 1240 Code Civil - Responsabilité Délictuelle', order: 3, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 4, isOptional: false },
    ],
    requiredVariables: [
      'client.nom', 'garant.nom'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Ordonnance sur Requête - Saisie Conservatoire',
    documentType: 'REQUETE',
    juridiction: 'Tribunal Judiciaire',
    category: 'PROCEDURE',
    description: 'Requête aux fins d\'ordonnance sur requête pour saisie conservatoire',
    blocksStructure: [
      { blockTitle: 'Intro Requête Ordonnance sur Requête', order: 1, isOptional: false },
      { blockTitle: 'Rappel Contrat Commercial', order: 2, isOptional: false },
      { blockTitle: 'Inexécution Contractuelle Détaillée', order: 3, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 4, isOptional: false },
    ],
    requiredVariables: [
      'client.nom', 'juridiction'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Conclusions Rétractation Ordonnance',
    documentType: 'CONCLUSIONS',
    juridiction: 'Tribunal Judiciaire',
    category: 'PROCEDURE',
    description: 'Conclusions aux fins de rétractation d\'une ordonnance sur requête',
    blocksStructure: [
      { blockTitle: 'Intro Conclusions Rétractation', order: 1, isOptional: false },
      { blockTitle: 'Chronologie Relation Contractuelle', order: 2, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 3, isOptional: false },
    ],
    requiredVariables: [
      'client.nom', 'adversaire.nom', 'date_ordonnance'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Conclusions Récusation Juge',
    documentType: 'CONCLUSIONS',
    juridiction: 'Tribunal Judiciaire',
    category: 'PROCEDURE',
    description: 'Conclusions aux fins de récusation d\'un magistrat',
    blocksStructure: [
      { blockTitle: 'Intro Conclusions Récusation', order: 1, isOptional: false },
      { blockTitle: 'Chronologie Relation Contractuelle', order: 2, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 3, isOptional: false },
    ],
    requiredVariables: [
      'client.nom', 'juge.nom', 'juridiction'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Mémoire en Réplique',
    documentType: 'MEMOIRE',
    juridiction: 'Tribunal Judiciaire',
    category: 'PROCEDURE',
    description: 'Mémoire en réplique suite aux conclusions adverses',
    blocksStructure: [
      { blockTitle: 'Intro Mémoire en Réplique', order: 1, isOptional: false },
      { blockTitle: 'Rappel Contrat Commercial', order: 2, isOptional: false },
      { blockTitle: 'Article 1103 Code Civil - Force Obligatoire', order: 3, isOptional: false },
      { blockTitle: 'Condamnation Paiement Somme', order: 4, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 5, isOptional: false },
    ],
    requiredVariables: [
      'client.nom', 'adversaire.nom', 'numero_rg', 'date_conclusions_adversaire'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Conclusions sur Incident',
    documentType: 'CONCLUSIONS',
    juridiction: 'Tribunal Judiciaire',
    category: 'PROCEDURE',
    description: 'Conclusions sur incident soulevé en cours d\'instance',
    blocksStructure: [
      { blockTitle: 'Intro Conclusions Incident', order: 1, isOptional: false },
      { blockTitle: 'Chronologie Relation Contractuelle', order: 2, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 3, isOptional: false },
    ],
    requiredVariables: [
      'client.nom', 'adversaire.nom', 'numero_rg'
    ],
    outputFormat: 'DOCX',
  },

  // ========================================
  // CATÉGORIE : CONTRATS (10 templates)
  // ========================================

  {
    name: 'Contrat de Vente - Bien Mobilier',
    documentType: 'CONTRAT',
    category: 'CONTRAT',
    description: 'Contrat de vente d\'un bien mobilier corporel',
    blocksStructure: [
      { blockTitle: 'Intro Assignation Tribunal Judiciaire', order: 1, isOptional: false },
      { blockTitle: 'Rappel Contrat Commercial', order: 2, isOptional: false },
      { blockTitle: 'Clause Résolutoire Standard', order: 3, isOptional: false },
      { blockTitle: 'Clause Pénale', order: 4, isOptional: true },
      { blockTitle: 'Signature Standard Avocat', order: 5, isOptional: false },
    ],
    requiredVariables: [
      'vendeur.nom', 'acquereur.nom', 'prix_vente', 'description_bien'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Contrat de Prestation de Services',
    documentType: 'CONTRAT',
    category: 'CONTRAT',
    description: 'Contrat de prestation de services entre professionnels',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Clause Résolutoire Standard', order: 2, isOptional: false },
      { blockTitle: 'Clause Pénale', order: 3, isOptional: true },
      { blockTitle: 'Signature Standard Avocat', order: 4, isOptional: false },
    ],
    requiredVariables: [
      'prestataire.nom', 'client.nom', 'objet_prestation', 'prix'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Bail Commercial',
    documentType: 'CONTRAT',
    category: 'CONTRAT',
    description: 'Bail commercial 3-6-9 pour locaux professionnels',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Clause Résolutoire Standard', order: 2, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 3, isOptional: false },
    ],
    requiredVariables: [
      'bailleur.nom', 'preneur.nom', 'adresse_locaux', 'montant_loyer'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Contrat de Mandat',
    documentType: 'CONTRAT',
    category: 'CONTRAT',
    description: 'Contrat de mandat général ou spécial',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Clause Résolutoire Standard', order: 2, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 3, isOptional: false },
    ],
    requiredVariables: [
      'mandant.nom', 'mandataire.nom', 'objet_mandat'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Contrat de Sous-Traitance',
    documentType: 'CONTRAT',
    category: 'CONTRAT',
    description: 'Contrat de sous-traitance industrielle ou commerciale',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Clause Résolutoire Standard', order: 2, isOptional: false },
      { blockTitle: 'Clause Pénale', order: 3, isOptional: true },
      { blockTitle: 'Signature Standard Avocat', order: 4, isOptional: false },
    ],
    requiredVariables: [
      'entrepreneur.nom', 'soustraitant.nom', 'objet'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Contrat de Distribution',
    documentType: 'CONTRAT',
    category: 'CONTRAT',
    description: 'Contrat de distribution exclusive ou sélective',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Clause Résolutoire Standard', order: 2, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 3, isOptional: false },
    ],
    requiredVariables: [
      'fournisseur.nom', 'distributeur.nom', 'territoire'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Contrat de Franchise',
    documentType: 'CONTRAT',
    category: 'CONTRAT',
    description: 'Contrat de franchise commerciale',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Clause Résolutoire Standard', order: 2, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 3, isOptional: false },
    ],
    requiredVariables: [
      'franchiseur.nom', 'franchise.nom', 'redevance'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Promesse Unilatérale de Vente',
    documentType: 'CONTRAT',
    category: 'CONTRAT',
    description: 'Promesse unilatérale de vente immobilière',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Clause Résolutoire Standard', order: 2, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 3, isOptional: false },
    ],
    requiredVariables: [
      'promettant.nom', 'beneficiaire.nom', 'prix', 'delai_option'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Compromis de Vente Immobilier',
    documentType: 'CONTRAT',
    category: 'CONTRAT',
    description: 'Compromis de vente pour bien immobilier',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Clause Résolutoire Standard', order: 2, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 3, isOptional: false },
    ],
    requiredVariables: [
      'vendeur.nom', 'acquereur.nom', 'adresse_bien', 'prix'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Avenant Contrat Commercial',
    documentType: 'AVENANT',
    category: 'CONTRAT',
    description: 'Avenant modificatif à un contrat commercial existant',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 2, isOptional: false },
    ],
    requiredVariables: [
      'partie1.nom', 'partie2.nom', 'date_contrat_initial', 'modifications'
    ],
    outputFormat: 'DOCX',
  },

  // ========================================
  // CATÉGORIE : DROIT DES AFFAIRES (10 templates)
  // ========================================

  {
    name: 'Protocole de Cession de Parts Sociales',
    documentType: 'PROTOCOLE',
    category: 'DROIT_AFFAIRES',
    description: 'Protocole de cession de parts sociales avec garantie d\'actif et de passif',
    blocksStructure: [
      { blockTitle: 'Contexte Cession Parts Sociales', order: 1, isOptional: false },
      { blockTitle: 'Clause GAP (Garantie Actif Passif)', order: 2, isOptional: false },
      { blockTitle: 'Clause Résolutoire Standard', order: 3, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 4, isOptional: false },
    ],
    requiredVariables: [
      'cedant.nom', 'cessionnaire.nom', 'societe_cible', 'prix_cession',
      'nombre_parts', 'pourcentage', 'montant_gap', 'duree_gap'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Statuts SARL',
    documentType: 'STATUTS',
    category: 'DROIT_AFFAIRES',
    description: 'Statuts constitutifs d\'une SARL',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 2, isOptional: false },
    ],
    requiredVariables: [
      'denomination', 'siege', 'objet', 'capital', 'associes'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Statuts SAS',
    documentType: 'STATUTS',
    category: 'DROIT_AFFAIRES',
    description: 'Statuts constitutifs d\'une SAS',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 2, isOptional: false },
    ],
    requiredVariables: [
      'denomination', 'siege', 'objet', 'capital', 'president.nom'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Pacte d\'Associés',
    documentType: 'PACTE',
    category: 'DROIT_AFFAIRES',
    description: 'Pacte d\'associés extra-statutaire',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Clause Résolutoire Standard', order: 2, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 3, isOptional: false },
    ],
    requiredVariables: [
      'societe', 'associes', 'date_statuts'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'PV Assemblée Générale Ordinaire',
    documentType: 'PV_AG',
    category: 'DROIT_AFFAIRES',
    description: 'Procès-verbal d\'assemblée générale ordinaire annuelle',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 2, isOptional: false },
    ],
    requiredVariables: [
      'societe', 'date_ag', 'president_seance', 'resolutions'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'PV Assemblée Générale Extraordinaire',
    documentType: 'PV_AG',
    category: 'DROIT_AFFAIRES',
    description: 'Procès-verbal d\'AGE pour modification statutaire',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 2, isOptional: false },
    ],
    requiredVariables: [
      'societe', 'date_age', 'modifications_statutaires'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Augmentation de Capital',
    documentType: 'PV_AG',
    category: 'DROIT_AFFAIRES',
    description: 'Résolution d\'augmentation de capital social',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 2, isOptional: false },
    ],
    requiredVariables: [
      'societe', 'capital_actuel', 'montant_augmentation', 'modalites'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Dissolution Anticipée',
    documentType: 'PV_AG',
    category: 'DROIT_AFFAIRES',
    description: 'Résolution de dissolution anticipée de société',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 2, isOptional: false },
    ],
    requiredVariables: [
      'societe', 'motif_dissolution', 'liquidateur.nom'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Cession de Fonds de Commerce',
    documentType: 'ACTE',
    category: 'DROIT_AFFAIRES',
    description: 'Acte de cession de fonds de commerce',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Clause Résolutoire Standard', order: 2, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 3, isOptional: false },
    ],
    requiredVariables: [
      'vendeur.nom', 'acquereur.nom', 'fonds', 'prix'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Fusion-Absorption',
    documentType: 'PROJET',
    category: 'DROIT_AFFAIRES',
    description: 'Projet de fusion par absorption entre deux sociétés',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 2, isOptional: false },
    ],
    requiredVariables: [
      'societe_absorbante', 'societe_absorbee', 'parite_echange'
    ],
    outputFormat: 'DOCX',
  },

  // ========================================
  // CATÉGORIE : COURRIERS (10 templates)
  // ========================================

  {
    name: 'Mise en Demeure de Payer',
    documentType: 'COURRIER',
    category: 'COURRIER',
    description: 'Lettre de mise en demeure pour impayés',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Inexécution Contractuelle Détaillée', order: 2, isOptional: false },
      { blockTitle: 'Article 1217 Code Civil - Inexécution', order: 3, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 4, isOptional: false },
    ],
    requiredVariables: [
      'destinataire.nom', 'client.nom', 'montant_du', 'delai_paiement'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Mise en Demeure d\'Exécuter',
    documentType: 'COURRIER',
    category: 'COURRIER',
    description: 'Mise en demeure d\'exécuter une obligation contractuelle',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Inexécution Contractuelle Détaillée', order: 2, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 3, isOptional: false },
    ],
    requiredVariables: [
      'destinataire.nom', 'obligation', 'delai'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Notification de Résiliation',
    documentType: 'COURRIER',
    category: 'COURRIER',
    description: 'Courrier de notification de résiliation de contrat',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Inexécution Contractuelle Détaillée', order: 2, isOptional: false },
      { blockTitle: 'Article 1217 Code Civil - Inexécution', order: 3, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 4, isOptional: false },
    ],
    requiredVariables: [
      'destinataire.nom', 'date_contrat', 'motif_resiliation', 'date_effet'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Convocation Assemblée Générale',
    documentType: 'COURRIER',
    category: 'COURRIER',
    description: 'Convocation à une assemblée générale d\'associés',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 2, isOptional: false },
    ],
    requiredVariables: [
      'societe', 'date_ag', 'lieu', 'ordre_du_jour'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Réclamation Livraison Non-Conforme',
    documentType: 'COURRIER',
    category: 'COURRIER',
    description: 'Réclamation pour livraison non conforme à la commande',
    blocksStructure: [
      { blockTitle: 'Litige Livraison Marchandises', order: 1, isOptional: false },
      { blockTitle: 'Article 1217 Code Civil - Inexécution', order: 2, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 3, isOptional: false },
    ],
    requiredVariables: [
      'destinataire.nom', 'numero_commande', 'date_livraison', 'non_conformites'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Protestation Refus de Livraison',
    documentType: 'COURRIER',
    category: 'COURRIER',
    description: 'Protestation suite à un refus de livraison',
    blocksStructure: [
      { blockTitle: 'Litige Livraison Marchandises', order: 1, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 2, isOptional: false },
    ],
    requiredVariables: [
      'destinataire.nom', 'date_refus', 'motif_refus'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Demande d\'Indemnisation Assurance',
    documentType: 'COURRIER',
    category: 'COURRIER',
    description: 'Demande d\'indemnisation auprès d\'une compagnie d\'assurance',
    blocksStructure: [
      { blockTitle: 'Accident Circulation Détaillé', order: 1, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 2, isOptional: false },
    ],
    requiredVariables: [
      'compagnie', 'numero_police', 'date_sinistre', 'montant_demande'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Contestation Licenciement',
    documentType: 'COURRIER',
    category: 'COURRIER',
    description: 'Courrier de contestation d\'un licenciement',
    blocksStructure: [
      { blockTitle: 'Rupture Abusive Contrat Travail', order: 1, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 2, isOptional: false },
    ],
    requiredVariables: [
      'employeur', 'date_licenciement', 'arguments_contestation'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Demande de Documents',
    documentType: 'COURRIER',
    category: 'COURRIER',
    description: 'Demande de communication de documents ou pièces',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 2, isOptional: false },
    ],
    requiredVariables: [
      'destinataire.nom', 'documents_demandes', 'delai'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Réponse à Mise en Demeure',
    documentType: 'COURRIER',
    category: 'COURRIER',
    description: 'Réponse à une mise en demeure reçue',
    blocksStructure: [
      { blockTitle: 'Chronologie Relation Contractuelle', order: 1, isOptional: false },
      { blockTitle: 'Article 1103 Code Civil - Force Obligatoire', order: 2, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 3, isOptional: false },
    ],
    requiredVariables: [
      'destinataire.nom', 'date_mise_en_demeure', 'reponse'
    ],
    outputFormat: 'DOCX',
  },

  // ========================================
  // CATÉGORIE : IMMOBILIER (5 templates)
  // ========================================

  {
    name: 'Assignation Vice Caché Immobilier',
    documentType: 'ASSIGNATION',
    juridiction: 'Tribunal Judiciaire',
    category: 'IMMOBILIER',
    description: 'Assignation en garantie des vices cachés suite à une vente immobilière',
    blocksStructure: [
      { blockTitle: 'Intro Assignation Tribunal Judiciaire', order: 1, isOptional: false },
      { blockTitle: 'Vice Caché Vente Immobilière', order: 2, isOptional: false },
      { blockTitle: 'Article 1240 Code Civil - Responsabilité Délictuelle', order: 3, isOptional: false },
      { blockTitle: 'Résolution Contrat + Dommages-Intérêts', order: 4, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 5, isOptional: false },
    ],
    requiredVariables: [
      'date_assignation', 'acquereur.nom', 'vendeur.nom', 'adresse_bien',
      'date_vente', 'prix_vente', 'description_vices', 'expert.nom'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Assignation Troubles de Voisinage',
    documentType: 'ASSIGNATION',
    juridiction: 'Tribunal Judiciaire',
    category: 'IMMOBILIER',
    description: 'Assignation pour troubles anormaux de voisinage',
    blocksStructure: [
      { blockTitle: 'Intro Assignation Tribunal Judiciaire', order: 1, isOptional: false },
      { blockTitle: 'Troubles Voisinage', order: 2, isOptional: false },
      { blockTitle: 'Article 1240 Code Civil - Responsabilité Délictuelle', order: 3, isOptional: false },
      { blockTitle: 'Condamnation Paiement Somme', order: 4, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 5, isOptional: false },
    ],
    requiredVariables: [
      'demandeur.nom', 'defendeur.nom', 'adresse_demandeur', 'adresse_defendeur',
      'description_troubles', 'date_debut_troubles'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Assignation Expulsion Impayés Loyers',
    documentType: 'ASSIGNATION',
    juridiction: 'Tribunal Judiciaire',
    category: 'IMMOBILIER',
    description: 'Assignation en expulsion pour impayés de loyers avec clause résolutoire',
    blocksStructure: [
      { blockTitle: 'Intro Assignation Tribunal Judiciaire', order: 1, isOptional: false },
      { blockTitle: 'Impayés Loyers Commercial', order: 2, isOptional: false },
      { blockTitle: 'Article 1217 Code Civil - Inexécution', order: 3, isOptional: false },
      { blockTitle: 'Résolution Contrat + Dommages-Intérêts', order: 4, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 5, isOptional: false },
    ],
    requiredVariables: [
      'bailleur.nom', 'preneur.nom', 'adresse_locaux',
      'montant_loyer', 'montant_total_impaye', 'nombre_mois', 'date_commandement'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'Bail d\'Habitation',
    documentType: 'CONTRAT',
    category: 'IMMOBILIER',
    description: 'Contrat de bail d\'habitation meublée ou non meublée',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Clause Résolutoire Standard', order: 2, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 3, isOptional: false },
    ],
    requiredVariables: [
      'bailleur.nom', 'locataire.nom', 'adresse_logement', 'loyer', 'charges', 'depot_garantie'
    ],
    outputFormat: 'DOCX',
  },

  {
    name: 'État des Lieux Contradictoire',
    documentType: 'ETAT_LIEUX',
    category: 'IMMOBILIER',
    description: 'État des lieux d\'entrée ou de sortie de location',
    blocksStructure: [
      { blockTitle: 'Rappel Contrat Commercial', order: 1, isOptional: false },
      { blockTitle: 'Signature Standard Avocat', order: 2, isOptional: false },
    ],
    requiredVariables: [
      'type_etat_lieux', 'date', 'adresse_logement', 'bailleur.nom', 'locataire.nom'
    ],
    outputFormat: 'DOCX',
  },
];

// ============================================================================
// FONCTION DE SEED
// ============================================================================

async function seed50Templates() {
  console.log('🌱 Seeding 50 templates juridiques système...');

  // Récupérer ou créer le tenant système
  let systemTenant = await prisma.tenant.findFirst({
    where: { email: 'system@lexdoc.fr' },
  });

  if (!systemTenant) {
    systemTenant = await prisma.tenant.create({
      data: {
        name: 'LexDoc Système',
        email: 'system@lexdoc.fr',
        isActive: true,
      },
    });
    console.log(`✅ Tenant système créé : ${systemTenant.id}`);
  } else {
    console.log(`✅ Tenant système existant : ${systemTenant.id}`);
  }

  // Récupérer tous les blocs système
  const allBlocks = await prisma.builderBlock.findMany({
    where: {
      tenantId: systemTenant.id,
      isSystem: true,
    },
  });

  console.log(`📦 ${allBlocks.length} blocs système disponibles`);

  if (allBlocks.length === 0) {
    console.error('❌ Aucun bloc système trouvé ! Exécutez d\'abord seed-150-blocks.js');
    process.exit(1);
  }

  // Supprimer les anciens templates système
  const deleted = await prisma.builderTemplate.deleteMany({
    where: {
      tenantId: systemTenant.id,
      isSystem: true,
    },
  });
  console.log(`🗑️  ${deleted.count} anciens templates système supprimés`);

  let created = 0;
  let skipped = 0;

  for (const templateConfig of TEMPLATES) {
    try {
      // Construire la structure avec les IDs réels des blocs
      const blocksStructure = [];

      for (const blockRef of templateConfig.blocksStructure) {
        const block = allBlocks.find(b => b.title === blockRef.blockTitle);
        if (block) {
          blocksStructure.push({
            blockId: block.id,
            title: block.title,
            order: blockRef.order,
            isOptional: blockRef.isOptional,
          });
        } else {
          console.warn(`   ⚠️  Bloc non trouvé : "${blockRef.blockTitle}"`);
        }
      }

      if (blocksStructure.length === 0) {
        console.warn(`   ⚠️  Template "${templateConfig.name}" ignoré (aucun bloc trouvé)`);
        skipped++;
        continue;
      }

      // Créer le template
      await prisma.builderTemplate.create({
        data: {
          tenantId: systemTenant.id,
          name: templateConfig.name,
          description: templateConfig.description,
          documentType: templateConfig.documentType,
          juridiction: templateConfig.juridiction || null,
          category: templateConfig.category,
          blocksStructure,
          requiredVariables: templateConfig.requiredVariables,
          outputFormat: templateConfig.outputFormat,
          isSystem: true,
          workflowConfig: {
            description: templateConfig.description,
            category: templateConfig.category,
          },
        },
      });

      created++;

      if (created % 5 === 0) {
        console.log(`   ${created} templates créés...`);
      }
    } catch (error) {
      console.error(`   ❌ Erreur template "${templateConfig.name}":`, error.message);
      skipped++;
    }
  }

  console.log(`\n✅ ${created} templates système créés avec succès !`);
  if (skipped > 0) {
    console.log(`⚠️  ${skipped} templates ignorés (blocs manquants ou erreurs)`);
  }

  // Statistiques par catégorie
  const templates = await prisma.builderTemplate.findMany({
    where: {
      tenantId: systemTenant.id,
      isSystem: true,
    },
  });

  const categories = {};
  templates.forEach(t => {
    const cat = t.category || 'AUTRE';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  console.log(`\n📊 Répartition par catégorie :`);
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`   - ${cat}: ${count} templates`);
  });
  console.log(`   TOTAL: ${templates.length} templates`);
}

seed50Templates()
  .catch((error) => {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
