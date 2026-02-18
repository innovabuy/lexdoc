const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ============================================================================
// 150 BLOCS SYSTÈME COMPLETS
// ============================================================================

const SYSTEM_BLOCKS = [

  // ========================================
  // CATÉGORIE INTRO (15 blocs)
  // ========================================

  {
    category: 'INTRO',
    title: 'Intro Assignation Tribunal Judiciaire',
    content: `L'AN DEUX MILLE VINGT-SIX
Et le {{date_assignation}}

À la requête de :
{{client.civilite}} {{client.nom}} {{client.prenom}}
Demeurant {{client.adresse}}
{{client.code_postal}} {{client.ville}}

Représenté par Maître {{avocat.nom}} {{avocat.prenom}}
Avocat au Barreau de {{avocat.barreau}}
{{cabinet.adresse}}

J'ai, {{huissier.nom}} {{huissier.prenom}}, Huissier de Justice associé de la SCP {{huissier.scp}}, demeurant {{huissier.adresse}}, et exerçant en cette ville,

DONNÉ ASSIGNATION À :

{{adversaire.civilite}} {{adversaire.nom}} {{adversaire.prenom}}
Demeurant {{adversaire.adresse}}
{{adversaire.code_postal}} {{adversaire.ville}}

À COMPARAÎTRE devant le Tribunal Judiciaire de {{juridiction}}, Palais de Justice {{juridiction.adresse}}, le {{date_audience}} à {{heure_audience}}.`,
    tags: ['assignation', 'tribunal-judiciaire', 'intro'],
    displayOrder: 1,
  },

  {
    category: 'INTRO',
    title: 'Intro Assignation Référé Urgence',
    content: `L'AN DEUX MILLE VINGT-SIX
Et le {{date_assignation}}

EN RÉFÉRÉ D'HEURE À HEURE

À la requête de :
{{client.nom}}
Agissant en qualité de {{client.qualite}}

Ayant pour avocat :
Maître {{avocat.nom}}
Avocat au Barreau de {{avocat.barreau}}

J'ai {{huissier.nom}}, Huissier de Justice,

DONNÉ ASSIGNATION EN RÉFÉRÉ D'HEURE À HEURE À :

{{adversaire.nom}}

Pour voir statuer par le Président du Tribunal Judiciaire statuant en référé le {{date_audience}} à {{heure_audience}}.

IL Y A URGENCE car {{motif_urgence}}.`,
    tags: ['refere', 'urgence', 'intro'],
    displayOrder: 2,
  },

  {
    category: 'INTRO',
    title: 'Intro Conclusions en Défense',
    content: `TRIBUNAL JUDICIAIRE DE {{juridiction}}

CONCLUSIONS EN DÉFENSE

Pour :
{{client.civilite}} {{client.nom}} {{client.prenom}}
Demeurant {{client.adresse}}

Représenté par :
Maître {{avocat.nom}}
Avocat au Barreau de {{avocat.barreau}}

CONTRE :

{{adversaire.nom}}

Affaire RG nº {{numero_rg}}

PLAISE AU TRIBUNAL,`,
    tags: ['conclusions', 'defense', 'intro'],
    displayOrder: 3,
  },

  {
    category: 'INTRO',
    title: 'Intro Requête en Référé',
    content: `REQUÊTE EN RÉFÉRÉ

Présentée par :
{{client.nom}}
{{client.adresse}}

Représenté par Maître {{avocat.nom}}
Avocat au Barreau de {{avocat.barreau}}

CONTRE :

{{adversaire.nom}}
{{adversaire.adresse}}

Monsieur le Président du Tribunal Judiciaire de {{juridiction}},`,
    tags: ['requete', 'refere', 'intro'],
    displayOrder: 4,
  },

  {
    category: 'INTRO',
    title: 'Intro Conclusions Incident',
    content: `CONCLUSIONS SUR INCIDENT

Affaire RG nº {{numero_rg}}

Pour : {{client.nom}}

Contre : {{adversaire.nom}}

PLAISE AU TRIBUNAL,

Sur l'incident soulevé par la partie adverse,`,
    tags: ['conclusions', 'incident', 'intro'],
    displayOrder: 5,
  },

  {
    category: 'INTRO',
    title: 'Intro Mémoire en Réplique',
    content: `MÉMOIRE EN RÉPLIQUE

Pour : {{client.nom}}

Contre : {{adversaire.nom}}

Affaire : {{numero_rg}}

En réponse aux conclusions déposées par la partie adverse le {{date_conclusions_adversaire}},`,
    tags: ['replique', 'memoire', 'intro'],
    displayOrder: 6,
  },

  {
    category: 'INTRO',
    title: 'Intro Conclusions Appel',
    content: `COUR D'APPEL DE {{juridiction}}

CONCLUSIONS D'APPELANT

Pour : {{client.nom}}
APPELANT

Contre : {{adversaire.nom}}
INTIMÉ

Affaire nº {{numero_rg}}

PLAISE À LA COUR,`,
    tags: ['appel', 'conclusions', 'intro'],
    displayOrder: 7,
  },

  {
    category: 'INTRO',
    title: 'Intro Contredit',
    content: `CONTREDIT

Affaire RG nº {{numero_rg}}

Pour : {{client.nom}}

CONTESTE LA COMPÉTENCE DU TRIBUNAL

Au visa de l'article 75 du Code de procédure civile,`,
    tags: ['contredit', 'competence', 'intro'],
    displayOrder: 8,
  },

  {
    category: 'INTRO',
    title: 'Intro Conclusions Récusation',
    content: `CONCLUSIONS AUX FINS DE RÉCUSATION

Pour : {{client.nom}}

Demande la récusation de Monsieur/Madame {{juge.nom}}, juge au Tribunal Judiciaire de {{juridiction}}.`,
    tags: ['recusation', 'intro'],
    displayOrder: 9,
  },

  {
    category: 'INTRO',
    title: 'Intro Requête Ordonnance sur Requête',
    content: `REQUÊTE AUX FINS D'ORDONNANCE SUR REQUÊTE

Présentée par :
{{client.nom}}

À Monsieur le Président du Tribunal Judiciaire de {{juridiction}},

La présente requête est présentée sur le fondement de l'article 493 du Code de procédure civile.`,
    tags: ['ordonnance', 'requete', 'intro'],
    displayOrder: 10,
  },

  {
    category: 'INTRO',
    title: 'Intro Conclusions Rétractation',
    content: `CONCLUSIONS AUX FINS DE RÉTRACTATION

Pour : {{client.nom}}

Contre : {{adversaire.nom}}

Demande la rétractation de l'ordonnance rendue le {{date_ordonnance}} par le Président du Tribunal Judiciaire.`,
    tags: ['retractation', 'intro'],
    displayOrder: 11,
  },

  {
    category: 'INTRO',
    title: 'Intro Conclusions Référé-Provision',
    content: `CONCLUSIONS EN RÉFÉRÉ-PROVISION

Pour : {{client.nom}}

Contre : {{adversaire.nom}}

Sur le fondement de l'article 835 alinéa 2 du Code de procédure civile,

PLAISE AU PRÉSIDENT,`,
    tags: ['refere', 'provision', 'intro'],
    displayOrder: 12,
  },

  {
    category: 'INTRO',
    title: 'Intro Assignation Jour Fixe',
    content: `ASSIGNATION À JOUR FIXE

L'AN DEUX MILLE VINGT-SIX
Le {{date_assignation}}

À la requête de : {{client.nom}}

Muni d'une ordonnance rendue le {{date_ordonnance}} par le Président du Tribunal Judiciaire de {{juridiction}} autorisant l'assignation à jour fixe,

J'ai assigné : {{adversaire.nom}}

À comparaître le {{date_audience}} à {{heure_audience}}.`,
    tags: ['jour-fixe', 'assignation', 'intro'],
    displayOrder: 13,
  },

  {
    category: 'INTRO',
    title: 'Intro Conclusions Intervention Volontaire',
    content: `CONCLUSIONS D'INTERVENTION VOLONTAIRE

Pour : {{client.nom}}
INTERVENANT

Dans l'instance opposant :

{{demandeur.nom}}
DEMANDEUR

À

{{defendeur.nom}}
DÉFENDEUR

Affaire RG nº {{numero_rg}}

PLAISE AU TRIBUNAL recevoir l'intervention de {{client.nom}},`,
    tags: ['intervention', 'volontaire', 'intro'],
    displayOrder: 14,
  },

  {
    category: 'INTRO',
    title: 'Intro Conclusions Appel en Garantie',
    content: `CONCLUSIONS D'APPEL EN GARANTIE

Pour : {{client.nom}}
DÉFENDEUR ET DEMANDEUR À L'APPEL EN GARANTIE

Appelle en garantie :

{{garant.nom}}

En vue d'être relevé et garanti de toute condamnation qui pourrait être prononcée à son encontre.`,
    tags: ['garantie', 'appel-garantie', 'intro'],
    displayOrder: 15,
  },

  // ========================================
  // CATÉGORIE FAITS (25 blocs)
  // ========================================

  {
    category: 'FAITS',
    title: 'Chronologie Relation Contractuelle',
    content: `EXPOSÉ DES FAITS

La relation contractuelle entre les parties s'est établie selon la chronologie suivante :

- Le {{date_1}} : {{evenement_1}}
- Le {{date_2}} : {{evenement_2}}
- Le {{date_3}} : {{evenement_3}}
- Le {{date_4}} : {{evenement_4}}

Force est de constater que {{constatation_principale}}.`,
    tags: ['chronologie', 'contrat', 'faits'],
    displayOrder: 1,
  },

  {
    category: 'FAITS',
    title: 'Rappel Contrat Commercial',
    content: `Par contrat en date du {{date_contrat}}, la société {{client.nom}} et la société {{adversaire.nom}} ont conclu un accord commercial portant sur {{objet_contrat}}.

Aux termes de ce contrat, il était notamment prévu que :
- {{clause_1}}
- {{clause_2}}
- {{clause_3}}

Le contrat prévoyait une durée de {{duree_contrat}} et un montant total de {{montant_contrat}} euros.`,
    tags: ['contrat', 'commercial', 'faits'],
    displayOrder: 2,
  },

  {
    category: 'FAITS',
    title: 'Inexécution Contractuelle Détaillée',
    content: `Or, {{adversaire.nom}} n'a pas respecté ses obligations contractuelles, et ce à plusieurs égards :

1. {{manquement_1}} alors que le contrat prévoyait {{obligation_contractuelle_1}}

2. {{manquement_2}} en violation de l'article {{article_contrat_2}} du contrat

3. {{manquement_3}}

Malgré une mise en demeure adressée par lettre recommandée avec accusé de réception en date du {{date_mise_en_demeure}}, restée sans réponse, {{adversaire.nom}} persiste dans son inexécution.`,
    tags: ['inexecution', 'manquements', 'faits'],
    displayOrder: 3,
  },

  {
    category: 'FAITS',
    title: 'Contexte Cession Parts Sociales',
    content: `La société {{societe_cible}} est une société {{forme_juridique}} au capital de {{capital}} euros, immatriculée au RCS de {{ville_rcs}} sous le numéro {{numero_rcs}}.

Monsieur/Madame {{cedant.nom}} détenait {{nombre_parts}} parts sociales de la société {{societe_cible}}, représentant {{pourcentage}}% du capital social.

Par protocole de cession en date du {{date_protocole}}, Monsieur/Madame {{cedant.nom}} a cédé l'intégralité de ses parts sociales à Monsieur/Madame {{cessionnaire.nom}} pour un prix de {{prix_cession}} euros.`,
    tags: ['cession', 'parts-sociales', 'faits'],
    displayOrder: 4,
  },

  {
    category: 'FAITS',
    title: 'Litige Livraison Marchandises',
    content: `Le {{date_commande}}, {{client.nom}} a passé commande auprès de {{adversaire.nom}} pour l'achat de {{description_marchandises}}, pour un montant total de {{montant}} euros TTC.

La livraison devait intervenir le {{date_livraison_prevue}}.

Or, à ce jour, {{adversaire.nom}} n'a toujours pas procédé à la livraison des marchandises commandées, malgré le paiement intégral effectué par {{client.nom}} le {{date_paiement}}.`,
    tags: ['livraison', 'marchandises', 'vente', 'faits'],
    displayOrder: 5,
  },

  {
    category: 'FAITS',
    title: 'Accident Circulation Détaillé',
    content: `Le {{date_accident}} à {{heure_accident}}, un accident de la circulation s'est produit {{lieu_accident}}.

{{client.nom}}, qui circulait à bord du véhicule {{marque_vehicule_client}} immatriculé {{immatriculation_client}}, a été heurté par le véhicule conduit par {{adversaire.nom}}, de marque {{marque_vehicule_adversaire}} immatriculé {{immatriculation_adversaire}}.

Les circonstances de l'accident sont les suivantes : {{circonstances_detaillees}}.

Un constat amiable d'accident a été établi sur place.`,
    tags: ['accident', 'circulation', 'faits'],
    displayOrder: 6,
  },

  {
    category: 'FAITS',
    title: 'Rupture Abusive Contrat Travail',
    content: `{{client.nom}} a été embauché(e) par la société {{employeur}} en qualité de {{poste}} par contrat de travail à durée {{type_contrat}} en date du {{date_embauche}}.

Le {{date_licenciement}}, {{client.nom}} a été convoqué(e) à un entretien préalable au licenciement.

Par lettre recommandée en date du {{date_lettre_licenciement}}, {{employeur}} a notifié à {{client.nom}} son licenciement pour {{motif_licenciement}}.

Or, ce licenciement est dépourvu de cause réelle et sérieuse pour les raisons suivantes : {{arguments}}.`,
    tags: ['travail', 'licenciement', 'faits'],
    displayOrder: 7,
  },

  {
    category: 'FAITS',
    title: 'Troubles Voisinage',
    content: `{{client.nom}} est propriétaire d'un bien immobilier situé {{adresse_client}}, dont il/elle a fait l'acquisition le {{date_acquisition}}.

Depuis le {{date_debut_troubles}}, {{client.nom}} subit des troubles anormaux de voisinage causés par {{adversaire.nom}}, propriétaire du bien situé {{adresse_adversaire}}.

Ces troubles se manifestent notamment par : {{description_troubles}}.

Malgré plusieurs courriers de réclamation, dont le dernier en date du {{date_dernier_courrier}}, {{adversaire.nom}} n'a pris aucune mesure pour faire cesser ces nuisances.`,
    tags: ['voisinage', 'troubles', 'immobilier', 'faits'],
    displayOrder: 8,
  },

  {
    category: 'FAITS',
    title: 'Vice Caché Vente Immobilière',
    content: `Par acte authentique en date du {{date_vente}}, {{client.nom}} a acquis auprès de {{vendeur}} un bien immobilier situé {{adresse_bien}} pour un prix de {{prix_vente}} euros.

Postérieurement à la vente, {{client.nom}} a découvert que le bien était affecté des vices suivants : {{description_vices}}.

Ces vices, qui existaient au jour de la vente et qui n'étaient pas apparents lors de la visite, rendent le bien impropre à l'usage auquel il est destiné.

Un rapport d'expertise établi le {{date_expertise}} par {{expert}} confirme l'existence et la gravité de ces vices.`,
    tags: ['vice-cache', 'vente', 'immobilier', 'faits'],
    displayOrder: 9,
  },

  {
    category: 'FAITS',
    title: 'Impayés Loyers Commercial',
    content: `Par bail commercial en date du {{date_bail}}, {{bailleur}} a donné à bail à {{preneur}} des locaux à usage commercial situés {{adresse_locaux}}, moyennant un loyer mensuel de {{montant_loyer}} euros HT.

À compter du mois de {{mois_premier_impaye}}, {{preneur}} a cessé de régler les loyers et charges.

À ce jour, le montant total des impayés s'élève à {{montant_total_impaye}} euros, correspondant à {{nombre_mois}} mois de loyers impayés.

Malgré une mise en demeure par acte d'huissier en date du {{date_commandement}}, {{preneur}} n'a procédé à aucun règlement.`,
    tags: ['bail', 'commercial', 'impaye', 'faits'],
    displayOrder: 10,
  },

  {
    category: 'FAITS',
    title: 'Défaut Conformité Produit',
    content: `Le {{date_achat}}, {{client.nom}} a fait l'acquisition auprès de {{vendeur}} d'un {{produit}} pour un prix de {{prix}} euros.

Dès la première utilisation, {{client.nom}} a constaté que le produit ne présentait pas les caractéristiques annoncées, à savoir : {{non_conformites}}.

Le produit livré ne correspond donc pas à la description qui en avait été faite et ne possède pas les qualités essentielles attendues.`,
    tags: ['conformite', 'produit', 'consommation', 'faits'],
    displayOrder: 11,
  },

  {
    category: 'FAITS',
    title: 'Diffamation Publique',
    content: `Le {{date_publication}}, {{adversaire.nom}} a publié sur {{support_publication}} les propos suivants :

"{{propos_litigieux}}"

Ces propos, qui imputent à {{client.nom}} des faits précis portant atteinte à son honneur et à sa considération, constituent une diffamation publique au sens de l'article 29 de la loi du 29 juillet 1881.`,
    tags: ['diffamation', 'presse', 'faits'],
    displayOrder: 12,
  },

  {
    category: 'FAITS',
    title: 'Concurrence Déloyale',
    content: `{{client.nom}} exerce l'activité de {{activite}} depuis {{date_creation}}.

Or, {{adversaire.nom}}, ancien {{relation_anterieure}}, a commis les actes de concurrence déloyale suivants :

1. {{acte_deloyal_1}}
2. {{acte_deloyal_2}}
3. {{acte_deloyal_3}}

Ces agissements ont causé à {{client.nom}} un préjudice commercial considérable.`,
    tags: ['concurrence', 'deloyale', 'commercial', 'faits'],
    displayOrder: 13,
  },

  {
    category: 'FAITS',
    title: 'Divorce Contexte Familial',
    content: `{{client.nom}} et {{conjoint.nom}} se sont mariés le {{date_mariage}} à la mairie de {{lieu_mariage}}, sous le régime de {{regime_matrimonial}}.

De cette union sont issus {{nombre_enfants}} enfant(s) :
{{liste_enfants}}

La vie commune a cessé le {{date_separation}}, date à laquelle {{circonstances_separation}}.

Le divorce est demandé pour {{motif_divorce}}.`,
    tags: ['divorce', 'famille', 'faits'],
    displayOrder: 14,
  },

  {
    category: 'FAITS',
    title: 'Succession Litigieuse',
    content: `{{defunt.nom}} est décédé(e) le {{date_deces}} à {{lieu_deces}}, laissant pour lui/elle succéder :
{{liste_heritiers}}

Le patrimoine successoral comprend notamment :
{{liste_biens}}

Un désaccord est survenu entre les héritiers concernant {{objet_litige}}.`,
    tags: ['succession', 'heritage', 'faits'],
    displayOrder: 15,
  },

  {
    category: 'FAITS',
    title: 'Prêt Non Remboursé',
    content: `Par acte sous seing privé en date du {{date_pret}}, {{client.nom}} a consenti à {{emprunteur}} un prêt d'un montant de {{montant_pret}} euros.

Ce prêt devait être remboursé selon les modalités suivantes : {{modalites_remboursement}}.

Or, {{emprunteur}} n'a effectué que {{nombre_echeances}} échéances sur les {{total_echeances}} prévues.

Le solde restant dû s'élève à {{solde_du}} euros, outre les intérêts.`,
    tags: ['pret', 'creance', 'faits'],
    displayOrder: 16,
  },

  {
    category: 'FAITS',
    title: 'Malfaçons Construction',
    content: `{{client.nom}} a confié à {{constructeur}} la réalisation de {{travaux}} pour un montant de {{montant_travaux}} euros, selon devis accepté le {{date_devis}}.

La réception des travaux est intervenue le {{date_reception}}, avec les réserves suivantes : {{reserves}}.

Postérieurement à la réception, les désordres suivants sont apparus : {{desordres}}.

Une expertise judiciaire ordonnée le {{date_ordonnance_expertise}} a confirmé les malfaçons.`,
    tags: ['construction', 'malfacons', 'faits'],
    displayOrder: 17,
  },

  {
    category: 'FAITS',
    title: 'Contrefaçon Marque',
    content: `{{client.nom}} est titulaire de la marque "{{nom_marque}}" enregistrée à l'INPI sous le numéro {{numero_depot}} le {{date_depot}}, pour désigner les produits et services suivants : {{classes}}.

Or, {{adversaire.nom}} commercialise des produits/services sous le signe "{{signe_litigieux}}", reproduisant de manière identique/similaire la marque de {{client.nom}}.

Ces actes de contrefaçon portent gravement atteinte aux droits de propriété intellectuelle de {{client.nom}}.`,
    tags: ['contrefacon', 'marque', 'propriete-intellectuelle', 'faits'],
    displayOrder: 18,
  },

  {
    category: 'FAITS',
    title: 'Harcèlement Moral Travail',
    content: `{{client.nom}} occupe le poste de {{poste}} au sein de {{employeur}} depuis le {{date_embauche}}.

Depuis le {{date_debut_harcelement}}, {{client.nom}} est victime d'agissements répétés de harcèlement moral de la part de {{harceleur}}, se manifestant par :
{{agissements}}

Ces agissements ont eu pour effet une dégradation des conditions de travail et de l'état de santé de {{client.nom}}, ainsi qu'en attestent {{preuves}}.`,
    tags: ['harcelement', 'travail', 'faits'],
    displayOrder: 19,
  },

  {
    category: 'FAITS',
    title: 'Rupture Brutale Relations Commerciales',
    content: `{{client.nom}} et {{adversaire.nom}} entretenaient des relations commerciales établies depuis {{duree_relation}}.

Le chiffre d'affaires annuel moyen réalisé avec {{adversaire.nom}} s'élevait à {{ca_moyen}} euros, représentant {{pourcentage}}% du chiffre d'affaires total de {{client.nom}}.

Par courrier du {{date_rupture}}, {{adversaire.nom}} a notifié la cessation des relations commerciales avec effet au {{date_effet}}, soit un préavis de {{duree_preavis}} seulement.

Ce préavis est manifestement insuffisant au regard de la durée de la relation commerciale.`,
    tags: ['rupture', 'commercial', 'L442-1', 'faits'],
    displayOrder: 20,
  },

  {
    category: 'FAITS',
    title: 'Accident Médical',
    content: `Le {{date_intervention}}, {{client.nom}} a subi une intervention chirurgicale {{type_intervention}} pratiquée par le Docteur {{medecin}} au sein de {{etablissement}}.

Suite à cette intervention, {{client.nom}} a présenté les complications suivantes : {{complications}}.

L'expertise médicale diligentée par {{expert}} a mis en évidence {{conclusions_expertise}}.

Le taux d'IPP a été évalué à {{taux_ipp}}%.`,
    tags: ['medical', 'responsabilite', 'faits'],
    displayOrder: 21,
  },

  {
    category: 'FAITS',
    title: 'Non-paiement Factures',
    content: `Dans le cadre de relations commerciales habituelles, {{client.nom}} a établi les factures suivantes à l'attention de {{adversaire.nom}} :

{{liste_factures}}

Malgré plusieurs relances amiables, dont la dernière en date du {{date_derniere_relance}}, ces factures demeurent impayées.

Le montant total de la créance s'élève à {{montant_total}} euros TTC, outre les pénalités de retard.`,
    tags: ['factures', 'impaye', 'commercial', 'faits'],
    displayOrder: 22,
  },

  {
    category: 'FAITS',
    title: 'Expulsion Locataire',
    content: `Par bail d'habitation en date du {{date_bail}}, {{bailleur}} a donné à bail à {{locataire}} un logement situé {{adresse_logement}}.

{{locataire}} ne s'est pas acquitté de ses obligations locatives depuis le {{date_premier_impaye}}.

Un commandement de payer visant la clause résolutoire a été délivré le {{date_commandement}}.

Deux mois s'étant écoulés sans régularisation, le bail est résilié de plein droit.`,
    tags: ['expulsion', 'bail', 'habitation', 'faits'],
    displayOrder: 23,
  },

  {
    category: 'FAITS',
    title: 'Garantie Décennale',
    content: `{{client.nom}} a fait construire {{ouvrage}} par {{constructeur}}, la réception étant intervenue le {{date_reception}}.

Dans le délai de la garantie décennale, des désordres sont apparus, rendant l'ouvrage impropre à sa destination :
{{description_desordres}}

Ces désordres compromettent la solidité de l'ouvrage et/ou le rendent impropre à sa destination, engageant la responsabilité décennale du constructeur.`,
    tags: ['decennale', 'construction', 'faits'],
    displayOrder: 24,
  },

  {
    category: 'FAITS',
    title: 'Abus de Confiance',
    content: `{{client.nom}} a remis à {{adversaire.nom}} la somme de {{montant}} euros / les biens suivants : {{biens}}, à charge pour ce dernier de {{mission}}.

Or, {{adversaire.nom}} a détourné ces fonds/biens en les utilisant à des fins personnelles, à savoir : {{utilisation_frauduleuse}}.

Malgré mise en demeure, {{adversaire.nom}} refuse de restituer les sommes/biens détournés.`,
    tags: ['abus-confiance', 'penal', 'faits'],
    displayOrder: 25,
  },

  // ========================================
  // CATÉGORIE MOYENS (40 blocs)
  // ========================================

  {
    category: 'MOYENS',
    title: 'Article 1103 Code Civil - Force Obligatoire',
    content: `SUR LE FONDEMENT DE L'ARTICLE 1103 DU CODE CIVIL

Aux termes de l'article 1103 du Code civil, "les contrats légalement formés tiennent lieu de loi à ceux qui les ont faits".

En l'espèce, le contrat liant les parties, conclu le {{date_contrat}}, est parfaitement valide et produit tous ses effets.

{{adversaire.nom}} ne peut donc se soustraire unilatéralement à ses obligations contractuelles, sous peine de voir sa responsabilité contractuelle engagée.`,
    tags: ['article-1103', 'pacta-sunt-servanda', 'moyens'],
    displayOrder: 1,
  },

  {
    category: 'MOYENS',
    title: 'Article 1217 Code Civil - Inexécution',
    content: `SUR L'INEXÉCUTION CONTRACTUELLE

L'article 1217 du Code civil dispose que "la partie envers laquelle l'engagement n'a pas été exécuté, ou l'a été imparfaitement, peut :
- refuser d'exécuter ou suspendre l'exécution de sa propre obligation ;
- poursuivre l'exécution forcée en nature de l'obligation ;
- obtenir une réduction du prix ;
- provoquer la résolution du contrat ;
- demander réparation des conséquences de l'inexécution".

En l'espèce, l'inexécution par {{adversaire.nom}} de ses obligations contractuelles justifie que {{client.nom}} sollicite {{option_choisie}}.`,
    tags: ['article-1217', 'inexecution', 'moyens'],
    displayOrder: 2,
  },

  {
    category: 'MOYENS',
    title: 'Article 1231-1 Code Civil - Dommages-Intérêts',
    content: `SUR LES DOMMAGES-INTÉRÊTS

Aux termes de l'article 1231-1 du Code civil, "le débiteur est condamné, s'il y a lieu, au paiement de dommages et intérêts soit à raison de l'inexécution de l'obligation, soit à raison du retard dans l'exécution, s'il ne justifie pas que l'exécution a été empêchée par la force majeure".

En l'espèce, {{client.nom}} a subi un préjudice direct et certain du fait de l'inexécution par {{adversaire.nom}}, préjudice qu'il convient d'évaluer à {{montant_prejudice}} euros.`,
    tags: ['article-1231-1', 'dommages-interets', 'moyens'],
    displayOrder: 3,
  },

  {
    category: 'MOYENS',
    title: 'Article 1240 Code Civil - Responsabilité Délictuelle',
    content: `SUR LA RESPONSABILITÉ DÉLICTUELLE

L'article 1240 du Code civil dispose que "tout fait quelconque de l'homme, qui cause à autrui un dommage, oblige celui par la faute duquel il est arrivé à le réparer".

En l'espèce, la responsabilité de {{adversaire.nom}} est engagée dès lors que sont réunies les trois conditions :

1. Une faute : {{description_faute}}
2. Un dommage : {{description_dommage}}
3. Un lien de causalité : {{lien_causalite}}`,
    tags: ['article-1240', 'responsabilite', 'delictuelle', 'moyens'],
    displayOrder: 4,
  },

  {
    category: 'MOYENS',
    title: 'Article 1245 Code Civil - Produits Défectueux',
    content: `SUR LA RESPONSABILITÉ DU FAIT DES PRODUITS DÉFECTUEUX

Aux termes de l'article 1245 du Code civil, "le producteur est responsable du dommage causé par un défaut de son produit, qu'il soit ou non lié par un contrat avec la victime".

En l'espèce, le produit {{description_produit}} fabriqué par {{producteur}} présente un défaut de {{nature_defaut}} qui a causé {{dommage}}.

La responsabilité de {{producteur}} est donc engagée, sans qu'il soit besoin de prouver une faute de sa part.`,
    tags: ['article-1245', 'produits-defectueux', 'moyens'],
    displayOrder: 5,
  },

  {
    category: 'MOYENS',
    title: 'Article 1641 Code Civil - Garantie Vices Cachés',
    content: `SUR LA GARANTIE DES VICES CACHÉS

Aux termes de l'article 1641 du Code civil, "le vendeur est tenu de la garantie à raison des défauts cachés de la chose vendue qui la rendent impropre à l'usage auquel on la destine, ou qui diminuent tellement cet usage que l'acheteur ne l'aurait pas acquise, ou n'en aurait donné qu'un moindre prix, s'il les avait connus".

Le vice invoqué remplit les conditions légales :
- Il est caché : {{demonstration_caractere_cache}}
- Il est antérieur à la vente : {{demonstration_anteriorite}}
- Il est grave : {{demonstration_gravite}}`,
    tags: ['article-1641', 'vice-cache', 'moyens'],
    displayOrder: 6,
  },

  {
    category: 'MOYENS',
    title: 'Article 1792 Code Civil - Responsabilité Décennale',
    content: `SUR LA RESPONSABILITÉ DÉCENNALE

L'article 1792 du Code civil dispose que "tout constructeur d'un ouvrage est responsable de plein droit, envers le maître ou l'acquéreur de l'ouvrage, des dommages, même résultant d'un vice du sol, qui compromettent la solidité de l'ouvrage ou qui, l'affectant dans l'un de ses éléments constitutifs ou l'un de ses éléments d'équipement, le rendent impropre à sa destination".

Les désordres constatés compromettent la solidité de l'ouvrage / rendent l'ouvrage impropre à sa destination, engageant ainsi la responsabilité décennale de {{constructeur}}.`,
    tags: ['article-1792', 'decennale', 'construction', 'moyens'],
    displayOrder: 7,
  },

  {
    category: 'MOYENS',
    title: 'Article L.442-1 Code Commerce - Rupture Brutale',
    content: `SUR LA RUPTURE BRUTALE DES RELATIONS COMMERCIALES

L'article L.442-1 II du Code de commerce sanctionne "le fait, par toute personne exerçant des activités de production, de distribution ou de services de rompre brutalement, même partiellement, une relation commerciale établie, en l'absence d'un préavis écrit qui tienne compte notamment de la durée de la relation commerciale".

En l'espèce, la relation commerciale était établie depuis {{duree_relation}}, justifiant un préavis d'au moins {{duree_preavis_necessaire}}.

Le préavis accordé de {{duree_preavis_accorde}} est manifestement insuffisant.`,
    tags: ['L442-1', 'rupture-brutale', 'commercial', 'moyens'],
    displayOrder: 8,
  },

  {
    category: 'MOYENS',
    title: 'Article L.1232-1 Code Travail - Licenciement',
    content: `SUR L'ABSENCE DE CAUSE RÉELLE ET SÉRIEUSE

Aux termes de l'article L.1232-1 du Code du travail, "tout licenciement pour motif personnel est motivé" et doit reposer sur "une cause réelle et sérieuse".

En l'espèce, le motif invoqué par l'employeur ne constitue pas une cause réelle et sérieuse de licenciement car {{argumentation}}.

Le licenciement de {{client.nom}} est donc dépourvu de cause réelle et sérieuse.`,
    tags: ['L1232-1', 'licenciement', 'travail', 'moyens'],
    displayOrder: 9,
  },

  {
    category: 'MOYENS',
    title: 'Article 835 CPC - Référé Provision',
    content: `SUR LA PROVISION

L'article 835 alinéa 2 du Code de procédure civile dispose que "le président du tribunal judiciaire peut accorder une provision au créancier dans le cas où l'obligation n'est pas sérieusement contestable".

En l'espèce, l'obligation de {{adversaire.nom}} n'est pas sérieusement contestable dès lors que :
{{argumentation}}

Il y a donc lieu d'accorder à {{client.nom}} une provision de {{montant}} euros.`,
    tags: ['article-835', 'refere', 'provision', 'moyens'],
    displayOrder: 10,
  },

  {
    category: 'MOYENS',
    title: 'Article 834 CPC - Référé Trouble Illicite',
    content: `SUR LE TROUBLE MANIFESTEMENT ILLICITE

L'article 834 du Code de procédure civile dispose que "le président du tribunal judiciaire peut toujours, même en présence d'une contestation sérieuse, prescrire en référé les mesures conservatoires ou de remise en état qui s'imposent, soit pour prévenir un dommage imminent, soit pour faire cesser un trouble manifestement illicite".

En l'espèce, {{adversaire.nom}} commet un trouble manifestement illicite en {{description_trouble}}.

Il y a lieu d'ordonner {{mesure_sollicitee}}.`,
    tags: ['article-834', 'refere', 'trouble-illicite', 'moyens'],
    displayOrder: 11,
  },

  {
    category: 'MOYENS',
    title: 'Article 1195 Code Civil - Imprévision',
    content: `SUR L'IMPRÉVISION

Aux termes de l'article 1195 du Code civil, "si un changement de circonstances imprévisible lors de la conclusion du contrat rend l'exécution excessivement onéreuse pour une partie qui n'avait pas accepté d'en assumer le risque, celle-ci peut demander une renégociation du contrat à son cocontractant".

En l'espèce, {{evenement_imprevisible}} constitue un changement de circonstances imprévisible rendant l'exécution du contrat excessivement onéreuse pour {{client.nom}}.`,
    tags: ['article-1195', 'imprevision', 'moyens'],
    displayOrder: 12,
  },

  {
    category: 'MOYENS',
    title: 'Article 1178 Code Civil - Nullité Contrat',
    content: `SUR LA NULLITÉ DU CONTRAT

L'article 1178 du Code civil dispose qu'"un contrat qui ne remplit pas les conditions requises pour sa validité est nul".

En l'espèce, le contrat est nul pour {{cause_nullite}} :
{{argumentation}}

La nullité doit être prononcée avec toutes conséquences de droit.`,
    tags: ['article-1178', 'nullite', 'moyens'],
    displayOrder: 13,
  },

  {
    category: 'MOYENS',
    title: 'Article 1143 Code Civil - Violence Économique',
    content: `SUR LA VIOLENCE ÉCONOMIQUE

L'article 1143 du Code civil dispose qu'"il y a également violence lorsqu'une partie, abusant de l'état de dépendance dans lequel se trouve son cocontractant à son égard, obtient de lui un engagement qu'il n'aurait pas souscrit en l'absence d'une telle contrainte et en tire un avantage manifestement excessif".

En l'espèce, {{adversaire.nom}} a abusé de l'état de dépendance de {{client.nom}} pour obtenir {{avantage_excessif}}.`,
    tags: ['article-1143', 'violence-economique', 'moyens'],
    displayOrder: 14,
  },

  {
    category: 'MOYENS',
    title: 'Article 1137 Code Civil - Dol',
    content: `SUR LE DOL

Aux termes de l'article 1137 du Code civil, "le dol est le fait pour un contractant d'obtenir le consentement de l'autre par des manœuvres ou des mensonges" ou par "la dissimulation intentionnelle par l'un des contractants d'une information dont il sait le caractère déterminant pour l'autre partie".

En l'espèce, {{adversaire.nom}} a volontairement dissimulé/menti sur {{element_dolosif}}, information déterminante du consentement de {{client.nom}}.`,
    tags: ['article-1137', 'dol', 'moyens'],
    displayOrder: 15,
  },

  {
    category: 'MOYENS',
    title: 'Article 1104 Code Civil - Bonne Foi',
    content: `SUR L'OBLIGATION DE BONNE FOI

L'article 1104 du Code civil dispose que "les contrats doivent être négociés, formés et exécutés de bonne foi. Cette disposition est d'ordre public".

En l'espèce, {{adversaire.nom}} a manqué à son obligation de bonne foi en {{comportement_deloyal}}.

Ce comportement engage sa responsabilité contractuelle.`,
    tags: ['article-1104', 'bonne-foi', 'moyens'],
    displayOrder: 16,
  },

  {
    category: 'MOYENS',
    title: 'Article 1112-1 Code Civil - Devoir Information',
    content: `SUR LE DEVOIR D'INFORMATION PRÉCONTRACTUEL

L'article 1112-1 du Code civil dispose que "celle des parties qui connaît une information dont l'importance est déterminante pour le consentement de l'autre doit l'en informer dès lors que, légitimement, cette dernière ignore cette information ou fait confiance à son cocontractant".

{{adversaire.nom}} connaissait {{information_dissimilee}}, information déterminante, et n'en a pas informé {{client.nom}}.`,
    tags: ['article-1112-1', 'information', 'precontractuel', 'moyens'],
    displayOrder: 17,
  },

  {
    category: 'MOYENS',
    title: 'Article L.217-4 Code Consommation - Conformité',
    content: `SUR LE DÉFAUT DE CONFORMITÉ

L'article L.217-4 du Code de la consommation impose au vendeur de "livrer un bien conforme au contrat et répond des défauts de conformité existant lors de la délivrance".

Le produit livré n'est pas conforme car {{description_non_conformite}}.

{{client.nom}} est en droit de demander {{option_consommateur}}.`,
    tags: ['L217-4', 'conformite', 'consommation', 'moyens'],
    displayOrder: 18,
  },

  {
    category: 'MOYENS',
    title: 'Article L.121-16 Code Consommation - Rétractation',
    content: `SUR LE DROIT DE RÉTRACTATION

L'article L.221-18 du Code de la consommation dispose que "le consommateur dispose d'un délai de quatorze jours pour exercer son droit de rétractation d'un contrat conclu à distance".

En l'espèce, {{client.nom}} a exercé son droit de rétractation dans le délai légal par {{moyen_retractation}} en date du {{date_retractation}}.

{{adversaire.nom}} est tenu de rembourser l'intégralité des sommes versées.`,
    tags: ['L221-18', 'retractation', 'consommation', 'moyens'],
    displayOrder: 19,
  },

  {
    category: 'MOYENS',
    title: 'Article 544 Code Civil - Droit Propriété',
    content: `SUR L'ATTEINTE AU DROIT DE PROPRIÉTÉ

L'article 544 du Code civil dispose que "la propriété est le droit de jouir et disposer des choses de la manière la plus absolue, pourvu qu'on n'en fasse pas un usage prohibé par les lois ou par les règlements".

Les agissements de {{adversaire.nom}} constituent une atteinte au droit de propriété de {{client.nom}} en ce que {{atteinte}}.

Il y a lieu d'ordonner la cessation de ces atteintes sous astreinte.`,
    tags: ['article-544', 'propriete', 'moyens'],
    displayOrder: 20,
  },

  {
    category: 'MOYENS',
    title: 'Trouble Anormal de Voisinage',
    content: `SUR LE TROUBLE ANORMAL DE VOISINAGE

Le principe selon lequel "nul ne doit causer à autrui un trouble anormal de voisinage" est un principe général du droit consacré par la jurisprudence.

La responsabilité fondée sur les troubles de voisinage est une responsabilité objective, indépendante de toute faute.

En l'espèce, les nuisances causées par {{adversaire.nom}} excèdent les inconvénients normaux du voisinage en raison de {{caractere_anormal}}.`,
    tags: ['voisinage', 'trouble-anormal', 'moyens'],
    displayOrder: 21,
  },

  {
    category: 'MOYENS',
    title: 'Article L.713-2 CPI - Contrefaçon Marque',
    content: `SUR LA CONTREFAÇON DE MARQUE

L'article L.713-2 du Code de la propriété intellectuelle dispose que "sont interdits, sauf autorisation du titulaire de la marque, la reproduction, l'usage ou l'apposition d'une marque [...] pour des produits ou services identiques à ceux désignés dans l'enregistrement".

En l'espèce, {{adversaire.nom}} reproduit/imite la marque {{marque}} de {{client.nom}} sans autorisation, ce qui constitue un acte de contrefaçon.`,
    tags: ['L713-2', 'contrefacon', 'marque', 'moyens'],
    displayOrder: 22,
  },

  {
    category: 'MOYENS',
    title: 'Article L.122-4 CPI - Contrefaçon Droit Auteur',
    content: `SUR LA CONTREFAÇON DE DROIT D'AUTEUR

L'article L.122-4 du Code de la propriété intellectuelle dispose que "toute représentation ou reproduction intégrale ou partielle faite sans le consentement de l'auteur ou de ses ayants droit ou ayants cause est illicite".

En l'espèce, {{adversaire.nom}} a reproduit/représenté l'œuvre {{oeuvre}} de {{client.nom}} sans autorisation, ce qui constitue une contrefaçon.`,
    tags: ['L122-4', 'contrefacon', 'droit-auteur', 'moyens'],
    displayOrder: 23,
  },

  {
    category: 'MOYENS',
    title: 'Article 1242 alinéa 1 Code Civil - Responsabilité Fait Choses',
    content: `SUR LA RESPONSABILITÉ DU FAIT DES CHOSES

L'article 1242 alinéa 1 du Code civil dispose qu'"on est responsable non seulement du dommage que l'on cause par son propre fait, mais encore de celui qui est causé par le fait [...] des choses que l'on a sous sa garde".

{{adversaire.nom}} était gardien de {{chose}} au moment des faits.

Cette chose a été l'instrument du dommage, ce qui engage la responsabilité de plein droit de son gardien.`,
    tags: ['article-1242', 'fait-des-choses', 'garde', 'moyens'],
    displayOrder: 24,
  },

  {
    category: 'MOYENS',
    title: 'Article 1242 alinéa 4 Code Civil - Responsabilité Employeur',
    content: `SUR LA RESPONSABILITÉ DE L'EMPLOYEUR DU FAIT DE SES PRÉPOSÉS

L'article 1242 alinéa 5 du Code civil dispose que "les maîtres et les commettants sont responsables du dommage causé par leurs domestiques et préposés dans les fonctions auxquelles ils les ont employés".

Le dommage a été causé par {{prepose}}, salarié de {{commettant}}, dans l'exercice de ses fonctions.

{{commettant}} est donc responsable de ce dommage.`,
    tags: ['article-1242', 'prepose', 'employeur', 'moyens'],
    displayOrder: 25,
  },

  {
    category: 'MOYENS',
    title: 'Article 145 CPC - Mesures Instruction In Futurum',
    content: `SUR LA MESURE D'INSTRUCTION IN FUTURUM

L'article 145 du Code de procédure civile dispose que "s'il existe un motif légitime de conserver ou d'établir avant tout procès la preuve de faits dont pourrait dépendre la solution d'un litige, les mesures d'instruction légalement admissibles peuvent être ordonnées à la demande de tout intéressé".

En l'espèce, {{client.nom}} justifie d'un motif légitime tenant à {{motif}}.

La mesure sollicitée est nécessaire pour préserver la preuve de {{elements}}.`,
    tags: ['article-145', 'instruction', 'in-futurum', 'moyens'],
    displayOrder: 26,
  },

  {
    category: 'MOYENS',
    title: 'Article 700 CPC - Frais Irrépétibles',
    content: `SUR LES FRAIS IRRÉPÉTIBLES

L'article 700 du Code de procédure civile dispose que "le juge condamne la partie tenue aux dépens ou qui perd son procès à payer à l'autre partie la somme qu'il détermine, au titre des frais exposés et non compris dans les dépens".

En l'espèce, il serait inéquitable de laisser à la charge de {{client.nom}} les frais qu'il/elle a dû exposer pour assurer la défense de ses intérêts.

Il est demandé la somme de {{montant}} euros à ce titre.`,
    tags: ['article-700', 'frais', 'moyens'],
    displayOrder: 27,
  },

  {
    category: 'MOYENS',
    title: 'Article 514 CPC - Exécution Provisoire',
    content: `SUR L'EXÉCUTION PROVISOIRE

L'article 514 du Code de procédure civile dispose que "les décisions de première instance sont de droit exécutoires à titre provisoire".

L'exécution provisoire de droit est pleinement justifiée en l'espèce au regard de {{motifs}}.

Il n'y a pas lieu d'en écarter l'application.`,
    tags: ['article-514', 'execution-provisoire', 'moyens'],
    displayOrder: 28,
  },

  {
    category: 'MOYENS',
    title: 'Astreinte',
    content: `SUR L'ASTREINTE

Il est demandé au Tribunal d'assortir la condamnation d'une astreinte de {{montant_astreinte}} euros par jour de retard à compter de la signification de la décision à intervenir.

En effet, il y a lieu de craindre que {{adversaire.nom}} n'exécute pas spontanément la décision, compte tenu de {{motifs_crainte}}.

L'astreinte sollicitée est proportionnée à l'enjeu du litige.`,
    tags: ['astreinte', 'execution', 'moyens'],
    displayOrder: 29,
  },

  {
    category: 'MOYENS',
    title: 'Article L.1152-1 Code Travail - Harcèlement Moral',
    content: `SUR LE HARCÈLEMENT MORAL

L'article L.1152-1 du Code du travail dispose qu'"aucun salarié ne doit subir les agissements répétés de harcèlement moral qui ont pour objet ou pour effet une dégradation de ses conditions de travail susceptible de porter atteinte à ses droits et à sa dignité, d'altérer sa santé physique ou mentale ou de compromettre son avenir professionnel".

{{client.nom}} produit des éléments laissant supposer l'existence d'un harcèlement : {{elements_presumes}}.

Il appartient à l'employeur de prouver que ces agissements ne sont pas constitutifs d'un tel harcèlement.`,
    tags: ['L1152-1', 'harcelement', 'travail', 'moyens'],
    displayOrder: 30,
  },

  {
    category: 'MOYENS',
    title: 'Article 1224 Code Civil - Résolution',
    content: `SUR LA RÉSOLUTION DU CONTRAT

L'article 1224 du Code civil dispose que "la résolution résulte soit de l'application d'une clause résolutoire soit, en cas d'inexécution suffisamment grave, d'une notification du créancier au débiteur ou d'une décision de justice".

L'inexécution de {{adversaire.nom}} est suffisamment grave pour justifier la résolution judiciaire du contrat.

En effet, {{gravite_inexecution}}.`,
    tags: ['article-1224', 'resolution', 'moyens'],
    displayOrder: 31,
  },

  {
    category: 'MOYENS',
    title: 'Article 1347 Code Civil - Compensation',
    content: `SUR LA COMPENSATION

L'article 1347 du Code civil dispose que "la compensation est l'extinction simultanée d'obligations réciproques entre deux personnes".

En l'espèce, {{client.nom}} détient sur {{adversaire.nom}} une créance de {{montant_creance}} euros.

Par ailleurs, {{adversaire.nom}} prétend détenir sur {{client.nom}} une créance de {{montant_dette}} euros.

La compensation légale s'opère de plein droit.`,
    tags: ['article-1347', 'compensation', 'moyens'],
    displayOrder: 32,
  },

  {
    category: 'MOYENS',
    title: 'Prescription Acquisitive Immobilière',
    content: `SUR LA PRESCRIPTION ACQUISITIVE

Aux termes de l'article 2258 du Code civil, "la prescription acquisitive est un moyen d'acquérir un bien ou un droit par l'effet de la possession sans que celui qui l'allègue soit obligé d'en rapporter un titre".

{{client.nom}} possède le bien litigieux de manière continue, paisible, publique, non équivoque et à titre de propriétaire depuis plus de {{duree}} ans.

Les conditions de la prescription acquisitive sont donc réunies.`,
    tags: ['prescription', 'acquisitive', 'immobilier', 'moyens'],
    displayOrder: 33,
  },

  {
    category: 'MOYENS',
    title: 'Article 2224 Code Civil - Prescription Extinctive',
    content: `SUR LA PRESCRIPTION

L'article 2224 du Code civil dispose que "les actions personnelles ou mobilières se prescrivent par cinq ans à compter du jour où le titulaire d'un droit a connu ou aurait dû connaître les faits lui permettant de l'exercer".

En l'espèce, l'action de {{adversaire.nom}} est prescrite dès lors que {{argumentation_prescription}}.

L'action doit donc être déclarée irrecevable comme prescrite.`,
    tags: ['article-2224', 'prescription', 'extinctive', 'moyens'],
    displayOrder: 34,
  },

  {
    category: 'MOYENS',
    title: 'Force Majeure',
    content: `SUR LA FORCE MAJEURE

L'article 1218 du Code civil dispose qu'"il y a force majeure en matière contractuelle lorsqu'un événement échappant au contrôle du débiteur, qui ne pouvait être raisonnablement prévu lors de la conclusion du contrat et dont les effets ne peuvent être évités par des mesures appropriées, empêche l'exécution de son obligation par le débiteur".

En l'espèce, {{evenement}} constitue un cas de force majeure car :
- Il était imprévisible : {{demonstration_imprevisibilite}}
- Il était irrésistible : {{demonstration_irresistibilite}}
- Il était extérieur : {{demonstration_exteriorite}}`,
    tags: ['force-majeure', 'exoneration', 'moyens'],
    displayOrder: 35,
  },

  {
    category: 'MOYENS',
    title: 'Exception Inexécution',
    content: `SUR L'EXCEPTION D'INEXÉCUTION

L'article 1219 du Code civil dispose qu'"une partie peut refuser d'exécuter son obligation, alors même que celle-ci est exigible, si l'autre n'exécute pas la sienne et si cette inexécution est suffisamment grave".

En l'espèce, {{adversaire.nom}} n'a pas exécuté son obligation de {{obligation_adverse}}.

Cette inexécution est suffisamment grave pour justifier que {{client.nom}} suspende l'exécution de sa propre obligation.`,
    tags: ['exception-inexecution', 'moyens'],
    displayOrder: 36,
  },

  {
    category: 'MOYENS',
    title: 'Défaut Qualité Agir',
    content: `SUR LE DÉFAUT DE QUALITÉ À AGIR

L'article 31 du Code de procédure civile dispose que "l'action est ouverte à tous ceux qui ont un intérêt légitime au succès ou au rejet d'une prétention, sous réserve des cas dans lesquels la loi attribue le droit d'agir aux seules personnes qu'elle qualifie pour élever ou combattre une prétention".

En l'espèce, {{adversaire.nom}} n'a pas qualité à agir car {{argumentation}}.

L'action doit être déclarée irrecevable.`,
    tags: ['qualite', 'recevabilite', 'moyens'],
    displayOrder: 37,
  },

  {
    category: 'MOYENS',
    title: 'Défaut Intérêt Agir',
    content: `SUR LE DÉFAUT D'INTÉRÊT À AGIR

L'article 31 du Code de procédure civile subordonne la recevabilité de l'action à l'existence d'un "intérêt légitime au succès ou au rejet d'une prétention".

L'intérêt à agir doit être né, actuel, direct et personnel.

En l'espèce, {{adversaire.nom}} ne justifie d'aucun intérêt à agir car {{argumentation}}.`,
    tags: ['interet', 'recevabilite', 'moyens'],
    displayOrder: 38,
  },

  {
    category: 'MOYENS',
    title: 'Chose Jugée',
    content: `SUR L'AUTORITÉ DE LA CHOSE JUGÉE

L'article 1355 du Code civil dispose que "l'autorité de la chose jugée n'a lieu qu'à l'égard de ce qui a fait l'objet du jugement".

Il faut identité de parties, de cause et d'objet.

En l'espèce, le litige a déjà été tranché par {{decision_anterieure}} rendue le {{date_decision}}.

Les demandes de {{adversaire.nom}} se heurtent donc à l'autorité de la chose jugée.`,
    tags: ['chose-jugee', 'recevabilite', 'moyens'],
    displayOrder: 39,
  },

  {
    category: 'MOYENS',
    title: 'Incompétence Territoriale',
    content: `SUR L'INCOMPÉTENCE TERRITORIALE

L'article 42 du Code de procédure civile dispose que "la juridiction territorialement compétente est, sauf disposition contraire, celle du lieu où demeure le défendeur".

En l'espèce, {{adversaire.nom}} a saisi le Tribunal Judiciaire de {{juridiction_saisie}} alors que le Tribunal compétent est celui de {{juridiction_competente}}.

Le Tribunal devra se déclarer incompétent.`,
    tags: ['competence', 'territoriale', 'moyens'],
    displayOrder: 40,
  },

  // ========================================
  // CATÉGORIE DISPOSITIF (25 blocs)
  // ========================================

  {
    category: 'DISPOSITIF',
    title: 'Condamnation Paiement Somme',
    content: `PAR CES MOTIFS

Le Tribunal est prié de :

CONDAMNER {{adversaire.nom}} à payer à {{client.nom}} la somme de {{montant_principal}} € au titre de {{nature_creance}},

ASSORTIE des intérêts au taux légal à compter du {{date_interets}},

CONDAMNER {{adversaire.nom}} aux dépens de l'instance,

CONDAMNER {{adversaire.nom}} à payer à {{client.nom}} la somme de {{montant_451}} € au titre de l'article 700 du Code de procédure civile.`,
    tags: ['condamnation', 'paiement', 'dispositif'],
    displayOrder: 1,
  },

  {
    category: 'DISPOSITIF',
    title: 'Résolution Contrat + Dommages-Intérêts',
    content: `PAR CES MOTIFS

Le Tribunal est prié de :

PRONONCER la résolution du contrat conclu le {{date_contrat}} entre les parties aux torts exclusifs de {{adversaire.nom}},

CONDAMNER {{adversaire.nom}} à restituer à {{client.nom}} toutes les sommes perçues, soit {{montant_restitution}} €,

CONDAMNER {{adversaire.nom}} à payer à {{client.nom}} la somme de {{montant_di}} € à titre de dommages-intérêts,

CONDAMNER {{adversaire.nom}} aux dépens et à payer {{montant_451}} € au titre de l'article 700 CPC.`,
    tags: ['resolution', 'dommages', 'dispositif'],
    displayOrder: 2,
  },

  {
    category: 'DISPOSITIF',
    title: 'Nullité Contrat',
    content: `PAR CES MOTIFS

Le Tribunal est prié de :

PRONONCER la nullité du contrat conclu le {{date_contrat}} entre {{client.nom}} et {{adversaire.nom}},

ORDONNER les restitutions réciproques,

CONDAMNER {{adversaire.nom}} à payer à {{client.nom}} la somme de {{montant_di}} € à titre de dommages-intérêts,

CONDAMNER {{adversaire.nom}} aux dépens et aux frais irrépétibles.`,
    tags: ['nullite', 'dispositif'],
    displayOrder: 3,
  },

  {
    category: 'DISPOSITIF',
    title: 'Exécution Forcée Obligation',
    content: `PAR CES MOTIFS

Le Tribunal est prié de :

CONDAMNER {{adversaire.nom}} à exécuter son obligation de {{obligation}} sous astreinte de {{montant_astreinte}} € par jour de retard à compter de la signification de la décision,

Se réserver la liquidation de l'astreinte,

CONDAMNER {{adversaire.nom}} aux dépens et à payer {{montant_451}} € au titre de l'article 700 CPC.`,
    tags: ['execution-forcee', 'astreinte', 'dispositif'],
    displayOrder: 4,
  },

  {
    category: 'DISPOSITIF',
    title: 'Référé Provision',
    content: `PAR CES MOTIFS

Le Président est prié de :

CONDAMNER {{adversaire.nom}} à payer à {{client.nom}} une provision de {{montant_provision}} € à valoir sur l'indemnisation de son préjudice,

DIRE n'y avoir lieu à référé pour le surplus,

CONDAMNER {{adversaire.nom}} aux dépens et à payer {{montant_451}} € au titre de l'article 700 CPC,

DIRE la présente ordonnance exécutoire de droit à titre provisoire.`,
    tags: ['refere', 'provision', 'dispositif'],
    displayOrder: 5,
  },

  {
    category: 'DISPOSITIF',
    title: 'Référé Injonction',
    content: `PAR CES MOTIFS

Le Président est prié de :

ORDONNER à {{adversaire.nom}} de {{injonction}} sous astreinte de {{montant_astreinte}} € par jour de retard,

DIRE que l'astreinte commencera à courir à l'expiration d'un délai de {{delai}} jours à compter de la signification de la présente ordonnance,

Se réserver la liquidation de l'astreinte,

CONDAMNER {{adversaire.nom}} aux dépens et à payer {{montant_451}} € au titre de l'article 700 CPC.`,
    tags: ['refere', 'injonction', 'dispositif'],
    displayOrder: 6,
  },

  {
    category: 'DISPOSITIF',
    title: 'Expulsion + Arriérés',
    content: `PAR CES MOTIFS

Le Tribunal est prié de :

CONSTATER l'acquisition de la clause résolutoire,

ORDONNER l'expulsion de {{locataire}} et de tous occupants de son chef des locaux situés {{adresse}} avec le concours de la force publique si nécessaire,

CONDAMNER {{locataire}} au paiement des arriérés de loyers et charges, soit {{montant_arrieres}} €,

CONDAMNER {{locataire}} à une indemnité d'occupation égale au montant du loyer et des charges jusqu'à libération effective des lieux,

CONDAMNER {{locataire}} aux dépens et à payer {{montant_451}} € au titre de l'article 700 CPC.`,
    tags: ['expulsion', 'bail', 'dispositif'],
    displayOrder: 7,
  },

  {
    category: 'DISPOSITIF',
    title: 'Licenciement Sans Cause',
    content: `PAR CES MOTIFS

Le Conseil de prud'hommes est prié de :

DIRE ET JUGER le licenciement de {{client.nom}} sans cause réelle et sérieuse,

CONDAMNER {{employeur}} à verser à {{client.nom}} les sommes suivantes :
- {{montant_indemnite}} € à titre d'indemnité pour licenciement sans cause réelle et sérieuse,
- {{montant_preavis}} € à titre d'indemnité compensatrice de préavis, outre {{montant_cp_preavis}} € au titre des congés payés afférents,
- {{montant_licenciement}} € à titre d'indemnité légale/conventionnelle de licenciement,

ORDONNER la remise des documents de fin de contrat rectifiés sous astreinte,

CONDAMNER {{employeur}} aux dépens et à payer {{montant_451}} € au titre de l'article 700 CPC.`,
    tags: ['licenciement', 'prudhommes', 'dispositif'],
    displayOrder: 8,
  },

  {
    category: 'DISPOSITIF',
    title: 'Contrefaçon Marque',
    content: `PAR CES MOTIFS

Le Tribunal est prié de :

DIRE ET JUGER que {{adversaire.nom}} s'est rendu coupable de contrefaçon de la marque {{marque}},

INTERDIRE à {{adversaire.nom}} de fabriquer, importer, exporter, commercialiser tout produit portant cette marque, sous astreinte de {{montant_astreinte}} € par infraction constatée,

CONDAMNER {{adversaire.nom}} à payer à {{client.nom}} la somme de {{montant_di}} € à titre de dommages-intérêts,

ORDONNER la publication de la décision dans {{publications}} aux frais de {{adversaire.nom}},

CONDAMNER {{adversaire.nom}} aux dépens.`,
    tags: ['contrefacon', 'marque', 'dispositif'],
    displayOrder: 9,
  },

  {
    category: 'DISPOSITIF',
    title: 'Vice Caché Rédhibitoire',
    content: `PAR CES MOTIFS

Le Tribunal est prié de :

À titre principal :
PRONONCER la résolution de la vente intervenue le {{date_vente}},
CONDAMNER {{vendeur}} à restituer le prix de vente de {{prix}} €,

À titre subsidiaire :
CONDAMNER {{vendeur}} à verser une réduction de prix de {{montant_reduction}} €,

En tout état de cause :
CONDAMNER {{vendeur}} à payer {{montant_di}} € de dommages-intérêts,
CONDAMNER {{vendeur}} aux dépens et à payer {{montant_451}} € au titre de l'article 700 CPC.`,
    tags: ['vice-cache', 'vente', 'dispositif'],
    displayOrder: 10,
  },

  {
    category: 'DISPOSITIF',
    title: 'Responsabilité Décennale',
    content: `PAR CES MOTIFS

Le Tribunal est prié de :

DÉCLARER {{constructeur}} responsable des désordres affectant l'ouvrage sur le fondement de l'article 1792 du Code civil,

CONDAMNER {{constructeur}} et son assureur {{assureur}} in solidum à payer à {{client.nom}} :
- {{montant_travaux}} € au titre des travaux de reprise,
- {{montant_prejudice}} € au titre du préjudice de jouissance,

CONDAMNER {{constructeur}} aux dépens incluant les frais d'expertise.`,
    tags: ['decennale', 'construction', 'dispositif'],
    displayOrder: 11,
  },

  {
    category: 'DISPOSITIF',
    title: 'Troubles Voisinage',
    content: `PAR CES MOTIFS

Le Tribunal est prié de :

CONSTATER l'existence de troubles anormaux de voisinage,

CONDAMNER {{adversaire.nom}} à faire cesser les troubles sous astreinte de {{montant_astreinte}} € par jour de retard,

CONDAMNER {{adversaire.nom}} à payer à {{client.nom}} la somme de {{montant_di}} € en réparation du préjudice subi,

CONDAMNER {{adversaire.nom}} aux dépens et à payer {{montant_451}} € au titre de l'article 700 CPC.`,
    tags: ['voisinage', 'troubles', 'dispositif'],
    displayOrder: 12,
  },

  {
    category: 'DISPOSITIF',
    title: 'Divorce Consentement Mutuel',
    content: `PAR CES MOTIFS

Le Juge aux affaires familiales est prié de :

HOMOLOGUER la convention de divorce réglant les conséquences du divorce,

PRONONCER le divorce aux torts partagés / pour altération définitive du lien conjugal,

CONSTATER l'accord des époux sur {{points_accord}},

DIRE que chaque partie conservera la charge de ses propres dépens.`,
    tags: ['divorce', 'famille', 'dispositif'],
    displayOrder: 13,
  },

  {
    category: 'DISPOSITIF',
    title: 'Garde Enfants',
    content: `PAR CES MOTIFS

Le Juge aux affaires familiales est prié de :

FIXER la résidence habituelle de l'enfant {{enfant.nom}} au domicile de {{parent_gardien}},

FIXER le droit de visite et d'hébergement de {{autre_parent}} comme suit : {{modalites_dvh}},

FIXER la contribution à l'entretien et à l'éducation de l'enfant à la somme de {{montant_pension}} € par mois,

DIRE que cette contribution sera indexée sur l'indice des prix à la consommation.`,
    tags: ['garde', 'enfants', 'famille', 'dispositif'],
    displayOrder: 14,
  },

  {
    category: 'DISPOSITIF',
    title: 'Rupture Brutale Relations Commerciales',
    content: `PAR CES MOTIFS

Le Tribunal de commerce est prié de :

DIRE ET JUGER que {{adversaire.nom}} a rompu brutalement les relations commerciales établies avec {{client.nom}},

CONDAMNER {{adversaire.nom}} à payer à {{client.nom}} :
- {{montant_marge}} € au titre de la perte de marge brute sur la durée du préavis insuffisant,
- {{montant_frais}} € au titre des frais de reconversion,

CONDAMNER {{adversaire.nom}} aux dépens et à payer {{montant_451}} € au titre de l'article 700 CPC.`,
    tags: ['rupture-brutale', 'commercial', 'dispositif'],
    displayOrder: 15,
  },

  {
    category: 'DISPOSITIF',
    title: 'Mesures Conservatoires',
    content: `PAR CES MOTIFS

Le Juge de l'exécution est prié de :

AUTORISER {{client.nom}} à pratiquer une saisie conservatoire sur les comptes bancaires de {{adversaire.nom}}, jusqu'à concurrence de {{montant}} €,

DIRE que la présente ordonnance sera caduque si l'assignation au fond n'est pas délivrée dans le mois de son exécution,

DISPENSER le requérant de la signification préalable de la présente ordonnance.`,
    tags: ['saisie', 'conservatoire', 'dispositif'],
    displayOrder: 16,
  },

  {
    category: 'DISPOSITIF',
    title: 'Mesure Expertise',
    content: `PAR CES MOTIFS

Le Président / Le Tribunal est prié de :

ORDONNER une mesure d'expertise judiciaire,

DÉSIGNER tel expert qu'il plaira avec mission de :
{{missions_expert}}

FIXER la provision à consigner à la somme de {{provision}} €,

DIRE que l'expert déposera son rapport dans un délai de {{delai}} mois.`,
    tags: ['expertise', 'judiciaire', 'dispositif'],
    displayOrder: 17,
  },

  {
    category: 'DISPOSITIF',
    title: 'Concurrence Déloyale',
    content: `PAR CES MOTIFS

Le Tribunal de commerce est prié de :

DIRE ET JUGER que {{adversaire.nom}} a commis des actes de concurrence déloyale au préjudice de {{client.nom}},

CONDAMNER {{adversaire.nom}} à cesser ses agissements sous astreinte,

CONDAMNER {{adversaire.nom}} à payer à {{client.nom}} la somme de {{montant_di}} € à titre de dommages-intérêts,

ORDONNER la publication de la décision aux frais de {{adversaire.nom}}.`,
    tags: ['concurrence', 'deloyale', 'dispositif'],
    displayOrder: 18,
  },

  {
    category: 'DISPOSITIF',
    title: 'Débouté',
    content: `PAR CES MOTIFS

Le Tribunal est prié de :

DÉCLARER {{adversaire.nom}} mal fondé en l'ensemble de ses demandes,

L'EN DÉBOUTER purement et simplement,

CONDAMNER {{adversaire.nom}} aux dépens de l'instance,

CONDAMNER {{adversaire.nom}} à payer à {{client.nom}} la somme de {{montant_451}} € au titre de l'article 700 du Code de procédure civile.`,
    tags: ['debout', 'defense', 'dispositif'],
    displayOrder: 19,
  },

  {
    category: 'DISPOSITIF',
    title: 'Sursis à Statuer',
    content: `PAR CES MOTIFS

Le Tribunal est prié de :

ORDONNER le sursis à statuer dans l'attente de {{evenement_attendu}},

RENVOYER l'affaire à une audience de mise en état ultérieure,

RÉSERVER les dépens.`,
    tags: ['sursis', 'procedure', 'dispositif'],
    displayOrder: 20,
  },

  {
    category: 'DISPOSITIF',
    title: 'Jonction Instances',
    content: `PAR CES MOTIFS

Le Juge de la mise en état est prié de :

ORDONNER la jonction des instances RG nº {{rg_1}} et RG nº {{rg_2}},

DIRE que l'affaire se poursuivra sous le numéro RG {{rg_principal}}.`,
    tags: ['jonction', 'procedure', 'dispositif'],
    displayOrder: 21,
  },

  {
    category: 'DISPOSITIF',
    title: 'Irrecevabilité',
    content: `PAR CES MOTIFS

Le Tribunal est prié de :

DÉCLARER l'action de {{adversaire.nom}} irrecevable pour {{motif_irrecevabilite}},

CONDAMNER {{adversaire.nom}} aux dépens de l'instance,

CONDAMNER {{adversaire.nom}} à payer à {{client.nom}} la somme de {{montant_451}} € au titre de l'article 700 du Code de procédure civile.`,
    tags: ['irrecevabilite', 'fin-non-recevoir', 'dispositif'],
    displayOrder: 22,
  },

  {
    category: 'DISPOSITIF',
    title: 'Radiation',
    content: `PAR CES MOTIFS

Le Juge de la mise en état est prié de :

CONSTATER que {{partie_defaillante}} n'a pas accompli les diligences mises à sa charge,

ORDONNER la radiation de l'affaire du rôle,

RÉSERVER les dépens.`,
    tags: ['radiation', 'procedure', 'dispositif'],
    displayOrder: 23,
  },

  {
    category: 'DISPOSITIF',
    title: 'Caducité Citation',
    content: `PAR CES MOTIFS

Le Tribunal est prié de :

CONSTATER la caducité de la citation délivrée le {{date_citation}},

CONSTATER en conséquence l'extinction de l'instance,

CONDAMNER {{demandeur}} aux dépens.`,
    tags: ['caducite', 'procedure', 'dispositif'],
    displayOrder: 24,
  },

  {
    category: 'DISPOSITIF',
    title: 'Désistement',
    content: `PAR CES MOTIFS

Le Tribunal est prié de :

DONNER ACTE à {{client.nom}} de son désistement d'instance et d'action,

CONSTATER l'extinction de l'instance,

DIRE que chaque partie conservera la charge de ses propres dépens.`,
    tags: ['desistement', 'procedure', 'dispositif'],
    displayOrder: 25,
  },

  // ========================================
  // CATÉGORIE CLAUSE (35 blocs)
  // ========================================

  {
    category: 'CLAUSE',
    title: 'Clause Résolutoire Standard',
    content: `CLAUSE RÉSOLUTOIRE

Le présent contrat sera résilié de plein droit, un mois après mise en demeure restée sans effet, en cas de manquement par l'une des parties à l'une quelconque de ses obligations.

La résiliation prendra effet à la date indiquée dans la mise en demeure.

Cette résiliation s'effectuera sans préjudice de tous dommages et intérêts auxquels la partie lésée pourrait prétendre.`,
    tags: ['clause', 'resolutoire', 'contrat'],
    displayOrder: 1,
  },

  {
    category: 'CLAUSE',
    title: 'Clause Attributive de Juridiction',
    content: `ATTRIBUTION DE JURIDICTION

Tout litige relatif à la formation, l'exécution ou l'interprétation du présent contrat sera soumis à la compétence exclusive du Tribunal de Commerce / Tribunal Judiciaire de {{ville}}.

Cette clause s'applique même en cas de référé, de pluralité de défendeurs ou d'appel en garantie.`,
    tags: ['clause', 'competence', 'juridiction'],
    displayOrder: 2,
  },

  {
    category: 'CLAUSE',
    title: 'Clause Compromissoire Arbitrage',
    content: `CLAUSE COMPROMISSOIRE

Tous les litiges auxquels le présent contrat pourrait donner lieu, concernant tant sa validité, son interprétation, son exécution, sa résolution, leurs conséquences et leurs suites, seront soumis à arbitrage conformément au Règlement d'arbitrage de {{organisme_arbitrage}}.

L'arbitrage sera conduit par {{nombre}} arbitre(s) désigné(s) conformément au Règlement.

Le siège de l'arbitrage sera fixé à {{ville}}.

La langue de l'arbitrage sera le français.`,
    tags: ['clause', 'arbitrage', 'compromissoire'],
    displayOrder: 3,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Confidentialité',
    content: `CONFIDENTIALITÉ

Les parties s'engagent à considérer comme strictement confidentielles et à ne pas divulguer à des tiers, pendant la durée du contrat et pendant une période de {{duree}} ans après son terme, les informations de toute nature, commerciales, industrielles, techniques, financières, nominatives, dont elles pourraient avoir connaissance dans le cadre du présent contrat.

Cette obligation de confidentialité ne s'applique pas aux informations qui :
- sont ou deviennent publiques sans faute de la partie réceptrice ;
- sont reçues licitement d'un tiers autorisé à les divulguer ;
- doivent être divulguées en vertu de la loi ou d'une décision de justice.`,
    tags: ['clause', 'confidentialite', 'contrat'],
    displayOrder: 4,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Non-Concurrence',
    content: `NON-CONCURRENCE

{{partie_obligee}} s'engage à ne pas exercer, directement ou indirectement, une activité concurrente de celle de {{beneficiaire}} pendant une durée de {{duree}} à compter de la fin du présent contrat.

Cette interdiction s'applique dans le secteur géographique suivant : {{zone_geographique}}.

En contrepartie de cette obligation, {{beneficiaire}} versera à {{partie_obligee}} une indemnité de {{montant}} €.

Toute violation de cette clause entraînera le versement d'une indemnité forfaitaire de {{penalite}} € par infraction constatée, sans préjudice de tous dommages et intérêts.`,
    tags: ['clause', 'non-concurrence', 'contrat'],
    displayOrder: 5,
  },

  {
    category: 'CLAUSE',
    title: 'Clause Pénale',
    content: `CLAUSE PÉNALE

En cas d'inexécution par l'une des parties de l'une quelconque de ses obligations au titre du présent contrat, cette partie sera redevable de plein droit, après mise en demeure restée infructueuse pendant {{delai}} jours, d'une pénalité forfaitaire de {{montant}} €, sans préjudice de tous dommages et intérêts complémentaires que pourrait réclamer la partie lésée.

Cette pénalité est due sans qu'il soit nécessaire de prouver l'existence ou l'étendue d'un quelconque préjudice.`,
    tags: ['clause', 'penale', 'contrat'],
    displayOrder: 6,
  },

  {
    category: 'CLAUSE',
    title: 'Clause Limitative Responsabilité',
    content: `LIMITATION DE RESPONSABILITÉ

La responsabilité de {{partie}} au titre du présent contrat ne pourra excéder {{montant_ou_pourcentage}}.

Cette limitation de responsabilité ne s'applique pas :
- en cas de faute lourde ou dolosive ;
- en cas de décès ou de dommage corporel ;
- aux obligations essentielles du contrat.

En aucun cas {{partie}} ne pourra être tenu responsable des dommages indirects, tels que perte de données, perte d'exploitation, manque à gagner ou atteinte à l'image.`,
    tags: ['clause', 'responsabilite', 'limitation'],
    displayOrder: 7,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Force Majeure',
    content: `FORCE MAJEURE

Aucune partie ne sera responsable d'un retard ou d'une inexécution de ses obligations résultant d'un cas de force majeure au sens de l'article 1218 du Code civil.

Sont notamment considérés comme cas de force majeure : les catastrophes naturelles, les guerres, les grèves, les pannes d'électricité ou de télécommunications, les épidémies, les décisions gouvernementales.

La partie affectée devra notifier l'autre partie dans un délai de {{delai}} jours et prendre toutes mesures pour limiter les effets de la force majeure.

Si la force majeure persiste au-delà de {{duree}}, chaque partie pourra résilier le contrat sans indemnité.`,
    tags: ['clause', 'force-majeure', 'contrat'],
    displayOrder: 8,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Propriété Intellectuelle',
    content: `PROPRIÉTÉ INTELLECTUELLE

Sauf stipulation expresse contraire, les droits de propriété intellectuelle relatifs aux {{creations}} créés dans le cadre du présent contrat sont et demeurent la propriété exclusive de {{titulaire}}.

{{autre_partie}} ne pourra utiliser ces créations que dans le cadre strict de l'exécution du présent contrat.

Toute utilisation non autorisée constituerait une contrefaçon engageant la responsabilité de {{autre_partie}}.`,
    tags: ['clause', 'propriete-intellectuelle', 'contrat'],
    displayOrder: 9,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Cession Droits Auteur',
    content: `CESSION DE DROITS D'AUTEUR

{{cedant}} cède à {{cessionnaire}}, à titre {{exclusif_non_exclusif}}, l'ensemble des droits patrimoniaux d'auteur portant sur {{oeuvre}}, à savoir :

- le droit de reproduction sur tout support connu ou inconnu à ce jour ;
- le droit de représentation par tout moyen connu ou inconnu à ce jour ;
- le droit de modification, adaptation, traduction ;
- le droit de commercialisation et d'exploitation.

Cette cession est consentie pour le monde entier et pour la durée légale de protection du droit d'auteur.

En contrepartie de cette cession, {{cessionnaire}} versera à {{cedant}} la somme de {{montant}} €.`,
    tags: ['clause', 'droit-auteur', 'cession'],
    displayOrder: 10,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Prix',
    content: `PRIX ET MODALITÉS DE PAIEMENT

Le prix de {{prestation_bien}} est fixé à {{montant}} € HT, soit {{montant_ttc}} € TTC au taux de TVA de {{taux_tva}}%.

Ce prix sera payable selon les modalités suivantes : {{modalites_paiement}}.

Tout retard de paiement entraînera de plein droit :
- l'exigibilité d'intérêts de retard au taux de {{taux}}% ;
- une indemnité forfaitaire pour frais de recouvrement de {{indemnite}} €.`,
    tags: ['clause', 'prix', 'paiement'],
    displayOrder: 11,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Révision Prix',
    content: `RÉVISION DE PRIX

Le prix sera révisé annuellement à la date anniversaire du contrat selon la formule suivante :

P1 = P0 x (I1/I0)

Où :
- P0 est le prix initial
- P1 est le prix révisé
- I0 est l'indice {{indice}} publié à la date de signature
- I1 est le dernier indice {{indice}} connu à la date de révision

En cas de disparition de l'indice de référence, les parties conviendront d'un nouvel indice de remplacement.`,
    tags: ['clause', 'revision', 'prix'],
    displayOrder: 12,
  },

  {
    category: 'CLAUSE',
    title: 'Clause Réserve Propriété',
    content: `RÉSERVE DE PROPRIÉTÉ

{{vendeur}} se réserve la propriété des biens vendus jusqu'au paiement intégral du prix, en principal et accessoires.

À défaut de paiement à l'échéance, {{vendeur}} pourra revendiquer les biens vendus et en reprendre possession.

{{acheteur}} s'engage à :
- assurer les biens contre tous risques ;
- permettre l'accès à ses locaux pour la reprise des biens ;
- ne pas céder ou nantir les biens.`,
    tags: ['clause', 'reserve-propriete', 'vente'],
    displayOrder: 13,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Garantie',
    content: `GARANTIE

{{garant}} garantit {{beneficiaire}} contre tout défaut de {{objet_garantie}} pendant une durée de {{duree}} à compter de {{point_depart}}.

Cette garantie couvre {{etendue_garantie}}.

Pour bénéficier de cette garantie, {{beneficiaire}} devra notifier le défaut par écrit dans un délai de {{delai}} jours suivant sa découverte.

{{garant}} s'engage à remédier au défaut par {{modalites_reparation}} dans un délai de {{delai_reparation}}.`,
    tags: ['clause', 'garantie', 'contrat'],
    displayOrder: 14,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Non-Sollicitation',
    content: `NON-SOLLICITATION

Pendant la durée du contrat et pendant une période de {{duree}} suivant son terme, chaque partie s'interdit de solliciter, embaucher ou faire travailler, directement ou indirectement, tout collaborateur de l'autre partie ayant participé à l'exécution du présent contrat.

En cas de manquement à cette obligation, la partie défaillante sera redevable d'une indemnité forfaitaire de {{montant}} €.`,
    tags: ['clause', 'non-sollicitation', 'personnel'],
    displayOrder: 15,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Médiation Préalable',
    content: `MÉDIATION PRÉALABLE

En cas de différend relatif au présent contrat, les parties s'engagent à tenter de résoudre leur litige à l'amiable par voie de médiation avant toute action judiciaire.

La médiation sera confiée à {{mediateur_ou_organisme}}.

Le processus de médiation ne pourra excéder {{duree}}.

Les frais de médiation seront partagés par moitié entre les parties.

À défaut d'accord dans ce délai, les parties retrouveront leur liberté de saisir les tribunaux compétents.`,
    tags: ['clause', 'mediation', 'reglement-litiges'],
    displayOrder: 16,
  },

  {
    category: 'CLAUSE',
    title: 'Clause d\'Intuitu Personae',
    content: `INTUITU PERSONAE

Le présent contrat est conclu en considération de la personne de {{partie}}, en raison de {{qualites}}.

En conséquence, {{partie}} ne pourra céder ou transférer le bénéfice du présent contrat à un tiers sans l'accord préalable et écrit de {{autre_partie}}.

Tout changement de contrôle de {{partie}} devra être notifié à {{autre_partie}} qui pourra résilier le contrat de plein droit dans un délai de {{delai}} jours suivant cette notification.`,
    tags: ['clause', 'intuitu-personae', 'contrat'],
    displayOrder: 17,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Divisibilité',
    content: `DIVISIBILITÉ

Si l'une quelconque des dispositions du présent contrat était déclarée nulle ou inapplicable, cette nullité ou inapplicabilité n'affecterait pas les autres dispositions qui demeureront en vigueur.

Les parties s'efforceront, dans la mesure du possible, de remplacer la disposition nulle ou inapplicable par une disposition valide et applicable ayant un effet économique aussi proche que possible de la disposition initiale.`,
    tags: ['clause', 'divisibilite', 'nullite'],
    displayOrder: 18,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Renonciation',
    content: `RENONCIATION

Le fait pour l'une des parties de ne pas se prévaloir d'un manquement par l'autre partie à l'une quelconque des obligations visées dans le présent contrat ne saurait être interprété comme une renonciation à l'obligation en cause.

Une telle tolérance ne pourra en aucun cas créer un droit acquis au profit de la partie défaillante.`,
    tags: ['clause', 'renonciation', 'tolerance'],
    displayOrder: 19,
  },

  {
    category: 'CLAUSE',
    title: 'Clause Entire Agreement',
    content: `INTÉGRALITÉ DE L'ACCORD

Le présent contrat constitue l'intégralité de l'accord entre les parties et annule et remplace tous accords, propositions ou déclarations antérieurs, écrits ou verbaux, relatifs à son objet.

Aucune modification du présent contrat ne sera valable si elle n'est pas établie par écrit et signée par les deux parties.`,
    tags: ['clause', 'integralite', 'accord'],
    displayOrder: 20,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Durée et Reconduction',
    content: `DURÉE - RECONDUCTION

Le présent contrat est conclu pour une durée de {{duree_initiale}} à compter de sa signature.

À l'issue de cette période initiale, le contrat sera reconduit tacitement pour des périodes successives de {{duree_reconduction}}, sauf dénonciation par l'une des parties notifiée par lettre recommandée avec accusé de réception {{delai_preavis}} avant le terme de la période en cours.`,
    tags: ['clause', 'duree', 'reconduction'],
    displayOrder: 21,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Résiliation pour Convenance',
    content: `RÉSILIATION POUR CONVENANCE

Chaque partie pourra résilier le présent contrat à tout moment et sans avoir à justifier d'aucun motif, moyennant un préavis de {{duree_preavis}} notifié par lettre recommandée avec accusé de réception.

En cas de résiliation, {{prestataire}} aura droit au paiement des prestations déjà réalisées et des frais engagés.`,
    tags: ['clause', 'resiliation', 'convenance'],
    displayOrder: 22,
  },

  {
    category: 'CLAUSE',
    title: 'Clause d\'Assurance',
    content: `ASSURANCE

{{partie}} s'engage à souscrire et à maintenir en vigueur pendant toute la durée du contrat une assurance responsabilité civile professionnelle auprès d'une compagnie notoirement solvable couvrant les conséquences de sa responsabilité civile pour un montant minimum de {{montant}} € par sinistre.

{{partie}} s'engage à fournir à première demande une attestation d'assurance justifiant de cette couverture.`,
    tags: ['clause', 'assurance', 'rc-pro'],
    displayOrder: 23,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Données Personnelles RGPD',
    content: `DONNÉES PERSONNELLES

Les parties s'engagent à respecter la réglementation applicable en matière de protection des données personnelles, notamment le Règlement (UE) 2016/679 (RGPD).

{{responsable_traitement}} agit en qualité de responsable du traitement pour les données collectées dans le cadre du présent contrat.

{{sous_traitant}} s'engage à :
- ne traiter les données que sur instruction documentée ;
- garantir la confidentialité des données ;
- assister {{responsable_traitement}} pour répondre aux demandes d'exercice des droits ;
- notifier toute violation de données dans un délai de 72 heures ;
- supprimer ou restituer les données au terme du contrat.`,
    tags: ['clause', 'rgpd', 'donnees-personnelles'],
    displayOrder: 24,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Sous-Traitance',
    content: `SOUS-TRAITANCE

{{prestataire}} pourra faire appel à des sous-traitants pour l'exécution du présent contrat.

{{prestataire}} restera seul responsable de la bonne exécution du contrat vis-à-vis de {{client}}.

{{prestataire}} s'engage à ce que ses sous-traitants respectent les mêmes obligations que celles auxquelles il est lui-même soumis.

{{mention_eventuelle_autorisation}}.`,
    tags: ['clause', 'sous-traitance', 'prestation'],
    displayOrder: 25,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Notification',
    content: `NOTIFICATIONS

Toute notification entre les parties devra être faite par écrit et sera considérée comme valablement effectuée :
- si elle est remise en main propre, à la date de remise ;
- si elle est envoyée par lettre recommandée avec accusé de réception, à la date de première présentation ;
- si elle est envoyée par email, à la date d'envoi avec confirmation de réception.

Les notifications seront adressées aux coordonnées suivantes :
{{coordonnees_parties}}`,
    tags: ['clause', 'notification', 'formalisme'],
    displayOrder: 26,
  },

  {
    category: 'CLAUSE',
    title: 'Clause d\'Audit',
    content: `DROIT D'AUDIT

{{beneficiaire}} aura le droit, à ses frais et moyennant un préavis de {{delai}} jours ouvrables, de procéder ou de faire procéder par un tiers de son choix à un audit des registres, documents et systèmes de {{partie_auditee}} relatifs à l'exécution du présent contrat.

{{partie_auditee}} s'engage à coopérer pleinement à tout audit et à fournir toutes les informations nécessaires.

L'audit sera réalisé pendant les heures ouvrables et dans le respect de la confidentialité.`,
    tags: ['clause', 'audit', 'controle'],
    displayOrder: 27,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Compliance',
    content: `CONFORMITÉ RÉGLEMENTAIRE

Chaque partie s'engage à respecter l'ensemble des dispositions légales et réglementaires applicables à son activité, notamment en matière de :
- lutte contre la corruption (Loi Sapin II) ;
- devoir de vigilance ;
- droit de la concurrence ;
- réglementation environnementale.

Chaque partie garantit l'autre contre toute réclamation qui pourrait résulter d'un manquement à ces obligations.`,
    tags: ['clause', 'compliance', 'conformite'],
    displayOrder: 28,
  },

  {
    category: 'CLAUSE',
    title: 'Clause Anti-Corruption',
    content: `ANTI-CORRUPTION

Les parties déclarent avoir pris connaissance de et s'engagent à respecter la réglementation anti-corruption applicable, notamment la loi nº 2016-1691 du 9 décembre 2016 dite "Sapin II".

Chaque partie s'interdit de proposer, promettre, accorder ou solliciter, directement ou indirectement, tout avantage indu à un agent public ou à toute personne privée en vue d'obtenir ou conserver un marché ou tout autre avantage.

Tout manquement à cette obligation constituera une cause de résiliation immédiate du contrat aux torts exclusifs de la partie défaillante.`,
    tags: ['clause', 'anti-corruption', 'sapin-2'],
    displayOrder: 29,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Non-Débauchage',
    content: `NON-DÉBAUCHAGE

Pendant la durée du contrat et pendant une période de {{duree}} ans suivant son terme, chaque partie s'interdit de :

- débaucher tout salarié de l'autre partie ayant participé à l'exécution du présent contrat ;
- embaucher un tel salarié dans un délai de {{delai}} mois suivant son départ de l'autre partie.

En cas de manquement, la partie défaillante versera à l'autre une indemnité forfaitaire égale à {{mois}} mois de la rémunération brute du salarié concerné.`,
    tags: ['clause', 'non-debauchage', 'personnel'],
    displayOrder: 30,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Sortie Associé',
    content: `CLAUSE DE SORTIE

En cas de désaccord persistant entre les associés sur {{sujets}}, chaque associé pourra proposer d'acquérir les parts de l'autre associé ou de lui céder les siennes.

L'associé destinataire de l'offre disposera d'un délai de {{delai}} pour accepter soit de vendre ses parts, soit d'acquérir les parts de l'autre aux mêmes conditions.

À défaut de réponse dans ce délai, l'offre sera caduque.`,
    tags: ['clause', 'sortie', 'associes'],
    displayOrder: 31,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Drag-Along',
    content: `CLAUSE D'ENTRAÎNEMENT (DRAG-ALONG)

En cas de cession par les Associés Majoritaires (détenant au moins {{pourcentage}}% du capital) de l'intégralité de leurs parts à un tiers, les Associés Minoritaires s'engagent irrévocablement à céder l'intégralité de leurs parts au même cessionnaire, dans les mêmes conditions de prix et de modalités.

Les Associés Majoritaires notifieront leur intention aux Associés Minoritaires au moins {{delai}} jours avant la cession envisagée.`,
    tags: ['clause', 'drag-along', 'cession'],
    displayOrder: 32,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Tag-Along',
    content: `CLAUSE DE SORTIE CONJOINTE (TAG-ALONG)

En cas de cession par un Associé de ses parts à un tiers, les autres Associés auront la faculté de céder au même cessionnaire tout ou partie de leurs parts, au même prix et aux mêmes conditions.

L'Associé cédant devra notifier aux autres Associés les conditions de la cession envisagée.

Les autres Associés disposeront d'un délai de {{delai}} jours pour exercer leur droit de sortie conjointe.`,
    tags: ['clause', 'tag-along', 'cession'],
    displayOrder: 33,
  },

  {
    category: 'CLAUSE',
    title: 'Clause d\'Agrément',
    content: `CLAUSE D'AGRÉMENT

Toute cession de parts sociales à un tiers non associé est soumise à l'agrément préalable de la collectivité des associés statuant à la majorité de {{majorite}}.

Le projet de cession devra être notifié à la société et aux associés par lettre recommandée avec accusé de réception.

La décision d'agrément devra intervenir dans un délai de {{delai}} jours à compter de la notification. À défaut de réponse dans ce délai, l'agrément sera réputé acquis.`,
    tags: ['clause', 'agrement', 'cession'],
    displayOrder: 34,
  },

  {
    category: 'CLAUSE',
    title: 'Clause de Préemption',
    content: `DROIT DE PRÉEMPTION

En cas de projet de cession de parts par un associé, les autres associés bénéficieront d'un droit de préemption.

L'associé cédant devra notifier aux autres associés les conditions de la cession envisagée, notamment l'identité de l'acquéreur, le nombre de parts, le prix et les modalités de paiement.

Les associés disposeront d'un délai de {{delai}} jours pour exercer leur droit de préemption, au prorata de leur participation.`,
    tags: ['clause', 'preemption', 'cession'],
    displayOrder: 35,
  },

  // ========================================
  // CATÉGORIE SIGNATURE (10 blocs)
  // ========================================

  {
    category: 'SIGNATURE',
    title: 'Signature Standard Avocat',
    content: `Fait à {{ville}}, le {{date_jour}}

Pour {{client.nom}},
Son conseil,

Maître {{avocat.nom}} {{avocat.prenom}}
Avocat au Barreau de {{avocat.barreau}}
{{cabinet.adresse}}
{{cabinet.telephone}}
{{cabinet.email}}`,
    tags: ['signature', 'avocat'],
    displayOrder: 1,
  },

  {
    category: 'SIGNATURE',
    title: 'Signature Assignation Huissier',
    content: `DONT ACTE

Coût de l'acte : {{cout_acte}} €

{{huissier.nom}} {{huissier.prenom}}
Huissier de Justice
SCP {{huissier.scp}}
{{huissier.adresse}}`,
    tags: ['signature', 'huissier', 'assignation'],
    displayOrder: 2,
  },

  {
    category: 'SIGNATURE',
    title: 'Signature Conclusions Avocat Postulant',
    content: `Sous toutes réserves,

Pour {{client.nom}},
Maître {{avocat_postulant.nom}}, avocat postulant
Maître {{avocat_plaidant.nom}}, avocat plaidant

Le {{date_jour}}`,
    tags: ['signature', 'avocat', 'postulant'],
    displayOrder: 3,
  },

  {
    category: 'SIGNATURE',
    title: 'Signature Contrat Deux Parties',
    content: `Fait en deux exemplaires originaux,
à {{ville}}, le {{date_jour}}

Pour {{partie_1.nom}}                     Pour {{partie_2.nom}}
Représenté par : {{partie_1.representant}}   Représenté par : {{partie_2.representant}}
Fonction : {{partie_1.fonction}}            Fonction : {{partie_2.fonction}}


_____________________                    _____________________
(Signature précédée de la mention       (Signature précédée de la mention
"Lu et approuvé")                       "Lu et approuvé")`,
    tags: ['signature', 'contrat', 'deux-parties'],
    displayOrder: 4,
  },

  {
    category: 'SIGNATURE',
    title: 'Signature Contrat Trois Parties',
    content: `Fait en trois exemplaires originaux,
à {{ville}}, le {{date_jour}}

Pour {{partie_1.nom}}          Pour {{partie_2.nom}}          Pour {{partie_3.nom}}



_________________              _________________              _________________`,
    tags: ['signature', 'contrat', 'trois-parties'],
    displayOrder: 5,
  },

  {
    category: 'SIGNATURE',
    title: 'Signature avec Paraphes',
    content: `Le présent contrat, composé de {{nombre_pages}} pages, a été paraphé par les parties.

Fait à {{ville}}, le {{date_jour}}
En {{nombre_exemplaires}} exemplaires originaux

{{partie_1.nom}}                              {{partie_2.nom}}


Signature :                                   Signature :
_________________________                     _________________________
Paraphe sur chaque page : ___                Paraphe sur chaque page : ___`,
    tags: ['signature', 'paraphes', 'contrat'],
    displayOrder: 6,
  },

  {
    category: 'SIGNATURE',
    title: 'Signature Protocole Accord',
    content: `Ainsi convenu entre les parties,

Fait à {{ville}}, le {{date_jour}}

En {{nombre}} exemplaires, un pour chaque partie

Les Parties déclarent avoir lu et approuvé l'ensemble du présent protocole d'accord.


Pour {{partie_1}} :                           Pour {{partie_2}} :


_____________________                         _____________________`,
    tags: ['signature', 'protocole', 'accord'],
    displayOrder: 7,
  },

  {
    category: 'SIGNATURE',
    title: 'Signature Procès-Verbal AG',
    content: `De tout ce que dessus, il a été dressé le présent procès-verbal qui a été signé, après lecture, par les membres du bureau.

Fait à {{ville}}, le {{date_jour}}

Le Président de séance :                      Le Secrétaire de séance :


_____________________                         _____________________
{{president.nom}}                             {{secretaire.nom}}`,
    tags: ['signature', 'pv', 'ag'],
    displayOrder: 8,
  },

  {
    category: 'SIGNATURE',
    title: 'Signature Rapport Expert',
    content: `En foi de quoi, j'ai établi le présent rapport.

Fait à {{ville}}, le {{date_jour}}

{{expert.titre}} {{expert.nom}}
Expert {{expert.specialite}}
Agréé par la Cour d'appel de {{expert.cour}}


_____________________`,
    tags: ['signature', 'expert', 'rapport'],
    displayOrder: 9,
  },

  {
    category: 'SIGNATURE',
    title: 'Signature Courrier Avocat',
    content: `Je vous prie d'agréer, {{formule_politesse}}, l'expression de mes salutations distinguées.

Maître {{avocat.nom}} {{avocat.prenom}}
Avocat au Barreau de {{avocat.barreau}}

P.J. : {{pieces_jointes}}`,
    tags: ['signature', 'courrier', 'avocat'],
    displayOrder: 10,
  },
];

// ============================================================================
// FONCTION DE SEED
// ============================================================================

async function seed150Blocks() {
  console.log('🌱 Seeding 150 blocs juridiques système...');

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

  // Supprimer les anciens blocs système
  const deleted = await prisma.builderBlock.deleteMany({
    where: {
      tenantId: systemTenant.id,
      isSystem: true,
    },
  });
  console.log(`🗑️  ${deleted.count} anciens blocs système supprimés`);

  let created = 0;

  for (const block of SYSTEM_BLOCKS) {
    try {
      await prisma.builderBlock.create({
        data: {
          ...block,
          tenantId: systemTenant.id,
          isSystem: true,
          variables: {},
        },
      });
      created++;

      if (created % 25 === 0) {
        console.log(`   ${created} blocs créés...`);
      }
    } catch (error) {
      console.error(`❌ Erreur création bloc "${block.title}":`, error.message);
    }
  }

  console.log(`\n✅ ${created} blocs système créés avec succès !`);
  console.log(`\n📊 Répartition par catégorie :`);

  const categories = await prisma.builderBlock.groupBy({
    by: ['category'],
    where: { tenantId: systemTenant.id, isSystem: true },
    _count: true,
  });

  categories.forEach(cat => {
    console.log(`   - ${cat.category}: ${cat._count} blocs`);
  });

  const total = categories.reduce((acc, cat) => acc + cat._count, 0);
  console.log(`\n   TOTAL: ${total} blocs`);
}

seed150Blocks()
  .catch((error) => {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
