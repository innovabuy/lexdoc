const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Standalone variable extractor (same logic as DocumentGeneratorService.extractVariablesFull)
function extractVariablesFull(content) {
  if (!content) return [];
  const regex = /\{\{([^}]+)\}\}/g;
  const variables = new Set();
  let match;
  while ((match = regex.exec(content)) !== null) {
    const varName = match[1].trim();
    if (!varName.startsWith('#') && !varName.startsWith('/') && varName !== 'else') {
      const cleanName = varName.split(' ')[0];
      if (!cleanName.startsWith('@') && cleanName !== 'this') {
        variables.add(cleanName);
      }
    }
  }
  return Array.from(variables);
}

async function main() {
  console.log('🌱 Seeding Document Builder data...');

  // Process all tenants
  const tenants = await prisma.tenant.findMany();
  if (tenants.length === 0) {
    console.error('❌ No tenant found. Run the main seed first.');
    process.exit(1);
  }

  for (const tenant of tenants) {
  console.log(`\n📋 Processing tenant: ${tenant.name} (${tenant.id})`);

  // System blocks
  const systemBlocks = [
    // INTRO blocks
    { category: 'INTRO', title: 'En-tête assignation TJ', content: 'ASSIGNATION\n\nDevant le Tribunal Judiciaire de {{juridiction}}\n\nL\'an deux mille {{annee}}, le {{date_acte}},\n\nÀ la requête de : {{demandeur.nom}}, {{demandeur.qualite}}, demeurant {{demandeur.adresse}},\n\nAyant pour avocat constitué : Maître {{avocat.nom}}, avocat au barreau de {{avocat.barreau}}, Toque n°{{avocat.toque}}', tags: ['assignation', 'TJ', 'tribunal judiciaire'], isSystem: true, isMandatory: true },
    { category: 'INTRO', title: 'En-tête assignation TC', content: 'ASSIGNATION\n\nDevant le Tribunal de Commerce de {{juridiction}}\n\nL\'an deux mille {{annee}}, le {{date_acte}},\n\nÀ la requête de : {{demandeur.nom}}, {{demandeur.forme_juridique}}, au capital de {{demandeur.capital}} euros, immatriculée au RCS de {{demandeur.rcs}} sous le numéro {{demandeur.siret}}, dont le siège social est situé {{demandeur.siege}}', tags: ['assignation', 'TC', 'tribunal commerce'], isSystem: true, isMandatory: true },
    { category: 'INTRO', title: 'En-tête conclusions', content: 'CONCLUSIONS\n\nPOUR :\n{{partie.nom}}, {{partie.qualite}}\nDemeurant {{partie.adresse}}\n\nAyant pour avocat constitué : Maître {{avocat.nom}}\nAvocat au Barreau de {{avocat.barreau}}\n{{avocat.adresse}}\nTél : {{avocat.telephone}} - Fax : {{avocat.fax}}\nToque n°{{avocat.toque}}', tags: ['conclusions', 'en-tête'], isSystem: true },
    { category: 'INTRO', title: 'En-tête mise en demeure', content: '{{cabinet.nom}}\n{{cabinet.adresse}}\n{{cabinet.cp}} {{cabinet.ville}}\n\nLettre recommandée avec AR n°{{lrar.numero}}\n\n{{lieu}}, le {{date}}\n\nObjet : Mise en demeure\nRéf : {{reference_dossier}}\n\nMadame, Monsieur,', tags: ['mise en demeure', 'LRAR', 'courrier'], isSystem: true },
    { category: 'INTRO', title: 'En-tête convocation audience', content: 'CONVOCATION À L\'AUDIENCE\n\nVeuillez vous présenter ou vous faire représenter le :\n\n{{date_audience}} à {{heure_audience}}\n\nDevant le {{juridiction}}\nSitué : {{adresse_juridiction}}\nSalle : {{salle_audience}}\n\nPour l\'affaire :\n{{demandeur.nom}} c/ {{defendeur.nom}}\nRG n°{{numero_rg}}', tags: ['convocation', 'audience'], isSystem: true },

    // FAITS blocks
    { category: 'FAITS', title: 'Exposé des faits - Cession entreprise', content: 'I. EXPOSÉ DES FAITS\n\nLa société {{cedant.nom}}, {{cedant.forme}}, a été constituée le {{cedant.date_constitution}}.\n\nSon capital social s\'élève à {{cedant.capital}} euros, divisé en {{cedant.nombre_parts}} parts sociales de {{cedant.valeur_nominale}} euros chacune.\n\nPar acte sous seing privé en date du {{date_promesse}}, {{cedant.dirigeant}} a consenti à {{cessionnaire.nom}} une promesse de cession portant sur {{nombre_parts_cedees}} parts sociales, représentant {{pourcentage_cession}}% du capital social.', tags: ['faits', 'cession', 'entreprise', 'parts sociales'], isSystem: true },
    { category: 'FAITS', title: 'Exposé des faits - Inexécution contrat', content: 'I. EXPOSÉ DES FAITS\n\nPar contrat en date du {{date_contrat}}, {{demandeur.nom}} et {{defendeur.nom}} ont conclu un accord portant sur {{objet_contrat}}.\n\nAux termes de ce contrat, {{defendeur.nom}} s\'engageait à :\n{{#each obligations}}\n- {{this}}\n{{/each}}\n\nOr, force est de constater que {{defendeur.nom}} n\'a pas respecté ses engagements contractuels.', tags: ['faits', 'inexécution', 'contrat'], isSystem: true },
    { category: 'FAITS', title: 'Exposé des faits - Litige commercial', content: 'I. EXPOSÉ DES FAITS\n\n{{demandeur.nom}} exerce une activité de {{demandeur.activite}} depuis {{demandeur.date_creation}}.\n\nDans le cadre de son activité, {{demandeur.nom}} a passé commande auprès de {{defendeur.nom}} le {{date_commande}} pour un montant de {{montant_commande}} euros HT.\n\nMalgré le paiement intégral de la commande le {{date_paiement}}, {{defendeur.nom}} n\'a toujours pas procédé à la livraison des marchandises commandées.', tags: ['faits', 'litige', 'commercial'], isSystem: true },

    // MOYENS blocks
    { category: 'MOYENS', title: 'Moyen - Article 1103 Code Civil', content: 'II. DISCUSSION EN DROIT\n\nA. Sur la force obligatoire du contrat\n\nAux termes de l\'article 1103 du Code civil :\n« Les contrats légalement formés tiennent lieu de loi à ceux qui les ont faits. »\n\nEn l\'espèce, le contrat conclu entre les parties est parfaitement valable et doit donc recevoir pleine et entière application.\n\n{{defendeur.nom}} ne saurait s\'exonérer de ses obligations contractuelles sans engager sa responsabilité.', tags: ['moyens', 'droit', 'contrat', '1103'], isSystem: true },
    { category: 'MOYENS', title: 'Moyen - Article 1217 Code Civil', content: 'B. Sur les remèdes à l\'inexécution\n\nL\'article 1217 du Code civil dispose :\n« La partie envers laquelle l\'engagement n\'a pas été exécuté, ou l\'a été imparfaitement, peut :\n- refuser d\'exécuter ou suspendre l\'exécution de sa propre obligation ;\n- poursuivre l\'exécution forcée en nature de l\'obligation ;\n- obtenir une réduction du prix ;\n- provoquer la résolution du contrat ;\n- demander réparation des conséquences de l\'inexécution. »\n\nEn l\'espèce, {{demandeur.nom}} est fondé à solliciter {{remede_choisi}}.', tags: ['moyens', 'droit', 'inexécution', '1217'], isSystem: true },
    { category: 'MOYENS', title: 'Moyen - Responsabilité contractuelle', content: 'C. Sur la responsabilité contractuelle\n\nLa responsabilité contractuelle de {{defendeur.nom}} est engagée dès lors que :\n\n1. Un contrat valable a été conclu entre les parties ;\n2. {{defendeur.nom}} n\'a pas exécuté ses obligations contractuelles ;\n3. Cette inexécution a causé un préjudice à {{demandeur.nom}}.\n\nCes trois conditions sont réunies en l\'espèce :\n- Le contrat du {{date_contrat}} est parfaitement valable ;\n- L\'inexécution est caractérisée par {{description_inexecution}} ;\n- Le préjudice s\'élève à la somme de {{montant_prejudice}} euros.', tags: ['moyens', 'responsabilité', 'contractuelle'], isSystem: true },

    // DISPOSITIF blocks
    { category: 'DISPOSITIF', title: 'Dispositif - Condamnation pécuniaire', content: 'PAR CES MOTIFS\n\nPlaise au Tribunal de :\n\n- DÉCLARER {{demandeur.nom}} recevable et bien fondé en ses demandes ;\n\n- CONDAMNER {{defendeur.nom}} à payer à {{demandeur.nom}} la somme de {{montant_principal}} euros à titre de dommages et intérêts ;\n\n- CONDAMNER {{defendeur.nom}} à payer à {{demandeur.nom}} la somme de {{montant_article_700}} euros au titre de l\'article 700 du Code de procédure civile ;\n\n- CONDAMNER {{defendeur.nom}} aux entiers dépens ;', tags: ['dispositif', 'condamnation', 'dommages-intérêts'], isSystem: true, isMandatory: true },
    { category: 'DISPOSITIF', title: 'Dispositif - Exécution forcée', content: 'PAR CES MOTIFS\n\nPlaise au Tribunal de :\n\n- ORDONNER l\'exécution forcée du contrat conclu le {{date_contrat}} ;\n\n- CONDAMNER {{defendeur.nom}} à exécuter son obligation de {{obligation}} sous astreinte de {{montant_astreinte}} euros par jour de retard à compter de la signification du présent jugement ;\n\n- CONDAMNER {{defendeur.nom}} aux dépens ainsi qu\'à payer à {{demandeur.nom}} la somme de {{montant_article_700}} euros sur le fondement de l\'article 700 du CPC ;', tags: ['dispositif', 'exécution forcée', 'astreinte'], isSystem: true },
    { category: 'DISPOSITIF', title: 'Dispositif - Résolution contrat', content: 'PAR CES MOTIFS\n\nPlaise au Tribunal de :\n\n- PRONONCER la résolution du contrat conclu le {{date_contrat}} aux torts exclusifs de {{defendeur.nom}} ;\n\n- CONDAMNER {{defendeur.nom}} à restituer à {{demandeur.nom}} la somme de {{montant_restitution}} euros versée en exécution du contrat ;\n\n- CONDAMNER {{defendeur.nom}} à payer à {{demandeur.nom}} la somme de {{montant_prejudice}} euros à titre de dommages et intérêts ;', tags: ['dispositif', 'résolution', 'contrat'], isSystem: true },

    // SIGNATURE blocks
    { category: 'SIGNATURE', title: 'Formule signature avocat', content: 'Sous toutes réserves et ce ne sera que justice.\n\nFait à {{lieu}}, le {{date}}\n\nMaître {{avocat.nom}}\nAvocat au Barreau de {{avocat.barreau}}', tags: ['signature', 'avocat'], isSystem: true, isMandatory: true },
    { category: 'SIGNATURE', title: 'Bordereau de pièces', content: 'BORDEREAU DE COMMUNICATION DE PIÈCES\n\n{{#each pieces}}\nPièce n°{{@index}} : {{this.titre}}\n{{/each}}', tags: ['bordereau', 'pièces'], isSystem: true },

    // CLAUSE blocks (droit des affaires)
    { category: 'CLAUSE', title: 'Clause de non-concurrence', content: 'ARTICLE {{numero}} - NON-CONCURRENCE\n\nLe Cédant s\'engage à ne pas exercer, directement ou indirectement, une activité concurrente de celle de la Société pendant une durée de {{duree}} ans à compter de la Date de Réalisation, sur le territoire de {{territoire}}.\n\nEn cas de violation de cette obligation, le Cédant sera redevable envers le Cessionnaire d\'une indemnité forfaitaire de {{montant_penalite}} euros, sans préjudice du droit du Cessionnaire de demander l\'indemnisation de son préjudice réel.', tags: ['clause', 'non-concurrence', 'cession'], isSystem: true },
    { category: 'CLAUSE', title: 'Clause de garantie d\'actif et passif', content: 'ARTICLE {{numero}} - GARANTIE D\'ACTIF ET DE PASSIF\n\n{{numero}}.1 - Le Cédant garantit le Cessionnaire contre toute diminution d\'actif ou augmentation de passif de la Société qui résulterait :\n- d\'événements, faits ou circonstances antérieurs à la Date de Réalisation ;\n- de la non-conformité des déclarations figurant à l\'Annexe {{annexe_declarations}}.\n\n{{numero}}.2 - Cette garantie est consentie pour une durée de {{duree_garantie}} mois à compter de la Date de Réalisation.\n\n{{numero}}.3 - La garantie ne pourra être mise en œuvre que si le montant unitaire d\'une Réclamation excède {{seuil_declenchement}} euros et si le montant cumulé des Réclamations excède {{franchise}} euros.', tags: ['clause', 'GAP', 'garantie', 'cession'], isSystem: true },
    { category: 'CLAUSE', title: 'Clause d\'earn-out', content: 'ARTICLE {{numero}} - COMPLÉMENT DE PRIX (EARN-OUT)\n\n{{numero}}.1 - En sus du Prix de Cession, le Cessionnaire versera au Cédant un complément de prix calculé comme suit :\n\n- Si l\'EBITDA de l\'exercice {{exercice_reference}} est supérieur à {{seuil_ebitda}} euros, le Cessionnaire versera au Cédant {{pourcentage_earnout}}% de l\'excédent.\n\n{{numero}}.2 - Le complément de prix sera plafonné à {{plafond_earnout}} euros.\n\n{{numero}}.3 - Le paiement interviendra dans les {{delai_paiement}} jours suivant l\'approbation des comptes de l\'exercice {{exercice_reference}}.', tags: ['clause', 'earn-out', 'complément prix', 'cession'], isSystem: true },
    { category: 'CLAUSE', title: 'Clause de confidentialité', content: 'ARTICLE {{numero}} - CONFIDENTIALITÉ\n\nLes Parties s\'engagent à considérer comme strictement confidentielles et à ne pas divulguer les informations échangées dans le cadre de la présente opération.\n\nCette obligation de confidentialité restera en vigueur pendant une durée de {{duree}} ans à compter de la signature des présentes.\n\nLa violation de cette obligation pourra donner lieu à l\'allocation de dommages et intérêts.', tags: ['clause', 'confidentialité'], isSystem: true },
    { category: 'CLAUSE', title: 'Clause de sortie conjointe (tag-along)', content: 'ARTICLE {{numero}} - DROIT DE SORTIE CONJOINTE (TAG-ALONG)\n\nEn cas de projet de cession par un Associé Majoritaire de tout ou partie de ses parts sociales à un tiers, les Associés Minoritaires bénéficieront d\'un droit de sortie conjointe leur permettant de céder leurs parts au même prix et aux mêmes conditions.\n\nL\'Associé Majoritaire devra notifier son projet de cession aux Associés Minoritaires par lettre recommandée avec accusé de réception {{delai_notification}} jours avant la date envisagée de cession.', tags: ['clause', 'tag-along', 'sortie conjointe', 'pacte associés'], isSystem: true },
    { category: 'CLAUSE', title: 'Clause d\'entraînement (drag-along)', content: 'ARTICLE {{numero}} - OBLIGATION DE SORTIE CONJOINTE (DRAG-ALONG)\n\nEn cas de projet de cession par les Associés Majoritaires représentant au moins {{seuil_majoritaires}}% du capital social à un tiers acquéreur offrant d\'acquérir 100% du capital, les Associés Minoritaires seront tenus de céder leurs parts au même prix et aux mêmes conditions.\n\nLe droit d\'entraînement ne pourra être exercé que si le prix de cession est au moins égal à {{prix_minimum}} euros par part sociale.', tags: ['clause', 'drag-along', 'entraînement', 'pacte associés'], isSystem: true },

    // ========== NOUVEAUX BLOCS (30) ==========

    // INTRO blocks (5) - Lettres simples, requêtes, référés, sommations, protocoles
    { category: 'INTRO', title: 'En-tête lettre simple', content: '{{cabinet.nom}}\n{{cabinet.adresse}}\n{{cabinet.cp}} {{cabinet.ville}}\nTél : {{cabinet.telephone}}\nEmail : {{cabinet.email}}\n\n{{lieu}}, le {{date}}\n\n{{destinataire.civilite}} {{destinataire.nom}}\n{{destinataire.adresse}}\n{{destinataire.cp}} {{destinataire.ville}}\n\nObjet : {{objet_lettre}}\nRéf. dossier : {{reference_dossier}}\n\n{{destinataire.civilite}},', tags: ['lettre', 'courrier', 'simple', 'en-tête'], isSystem: true },
    { category: 'INTRO', title: 'En-tête requête', content: 'REQUÊTE\n\nPrésentée à {{juridiction}}\n\nPAR :\n{{requerant.nom}}, {{requerant.qualite}}\nDemeurant : {{requerant.adresse}}\n\nAyant pour avocat : Maître {{avocat.nom}}\nAvocat au Barreau de {{avocat.barreau}}\nToque n°{{avocat.toque}}\n\nTendant à voir ordonner {{objet_requete}}', tags: ['requête', 'en-tête', 'ordonnance'], isSystem: true },
    { category: 'INTRO', title: 'En-tête assignation en référé', content: 'ASSIGNATION EN RÉFÉRÉ\n\nDevant {{juridiction}}, statuant en référé\n\nL\'an deux mille {{annee}}, le {{date_acte}},\n\nÀ la requête de : {{demandeur.nom}}, {{demandeur.qualite}}, demeurant {{demandeur.adresse}},\n\nAyant pour avocat constitué : Maître {{avocat.nom}}, avocat au barreau de {{avocat.barreau}}, Toque n°{{avocat.toque}},\n\nJ\'ai, {{huissier.nom}}, Huissier de Justice associé près le Tribunal Judiciaire de {{huissier.ressort}},\n\nDONNÉ ASSIGNATION À :\n\n{{defendeur.nom}}, demeurant {{defendeur.adresse}},\n\nD\'avoir à comparaître le {{date_audience}} à {{heure_audience}}\nDevant {{juridiction}}, statuant en référé,\nSis {{adresse_juridiction}}', tags: ['assignation', 'référé', 'urgence', 'en-tête'], isSystem: true },
    { category: 'INTRO', title: 'En-tête sommation interpellative', content: 'SOMMATION INTERPELLATIVE\n\nL\'an deux mille {{annee}}, le {{date_acte}},\n\nÀ la requête de : {{requerant.nom}}, {{requerant.qualite}}, demeurant {{requerant.adresse}},\n\nJ\'ai, {{huissier.nom}}, Huissier de Justice,\n\nSOMMÉ {{somme.nom}}, demeurant {{somme.adresse}},\n\nDE RÉPONDRE AUX QUESTIONS SUIVANTES :\n\n{{#each questions}}\n{{@index}}. {{this}}\n{{/each}}\n\nEt lui ai déclaré que ses réponses seront consignées dans le présent acte et pourront être utilisées en justice.', tags: ['sommation', 'interpellative', 'huissier', 'preuve'], isSystem: true },
    { category: 'INTRO', title: 'En-tête protocole d\'accord', content: 'PROTOCOLE D\'ACCORD TRANSACTIONNEL\n\nENTRE LES SOUSSIGNÉS :\n\n{{partie1.nom}}, {{partie1.forme_juridique}}, au capital de {{partie1.capital}} euros,\nimmatriculée au RCS de {{partie1.rcs}} sous le numéro {{partie1.siret}},\ndont le siège social est situé {{partie1.siege}},\nreprésentée par {{partie1.representant}}, en sa qualité de {{partie1.qualite_representant}},\n\nCi-après dénommée « {{partie1.denomination}} »,\n\nD\'UNE PART,\n\nET :\n\n{{partie2.nom}}, {{partie2.forme_juridique}}, au capital de {{partie2.capital}} euros,\nimmatriculée au RCS de {{partie2.rcs}} sous le numéro {{partie2.siret}},\ndont le siège social est situé {{partie2.siege}},\nreprésentée par {{partie2.representant}}, en sa qualité de {{partie2.qualite_representant}},\n\nCi-après dénommée « {{partie2.denomination}} »,\n\nD\'AUTRE PART,\n\nEnsemble désignées « les Parties »,\n\nIL A ÉTÉ PRÉALABLEMENT EXPOSÉ CE QUI SUIT :', tags: ['protocole', 'accord', 'transaction', 'en-tête'], isSystem: true },

    // FAITS blocks (5) - Rupture contrat travail, vice caché, concurrence déloyale, impayés, responsabilité
    { category: 'FAITS', title: 'Exposé des faits - Rupture contrat de travail', content: 'I. EXPOSÉ DES FAITS\n\n{{salarie.nom}} a été embauché par la société {{employeur.nom}} le {{date_embauche}} en qualité de {{poste}} selon contrat de travail à durée {{type_contrat}}.\n\nSa rémunération mensuelle brute s\'élevait à {{salaire_brut}} euros.\n\nLe {{date_rupture}}, {{employeur.nom}} a procédé à {{type_rupture}} du contrat de travail de {{salarie.nom}} dans les circonstances suivantes :\n\n{{circonstances_rupture}}\n\nCette rupture est intervenue sans que {{motifs_contestation}}.', tags: ['faits', 'travail', 'rupture', 'licenciement', 'contrat travail'], isSystem: true },
    { category: 'FAITS', title: 'Exposé des faits - Vice caché', content: 'I. EXPOSÉ DES FAITS\n\nPar acte {{type_acte}} en date du {{date_vente}}, {{vendeur.nom}} a vendu à {{acheteur.nom}} {{bien_vendu}} moyennant le prix de {{prix_vente}} euros.\n\nPostérieurement à la vente, {{acheteur.nom}} a découvert l\'existence des vices suivants :\n\n{{#each vices}}\n- {{this.description}} (constaté le {{this.date_decouverte}})\n{{/each}}\n\nCes vices, antérieurs à la vente et cachés lors de celle-ci, rendent le bien impropre à l\'usage auquel il était destiné, à savoir {{usage_prevu}}.\n\nUne expertise {{type_expertise}} réalisée par {{expert.nom}} le {{date_expertise}} a confirmé l\'existence et la gravité de ces vices.', tags: ['faits', 'vice caché', 'vente', 'garantie'], isSystem: true },
    { category: 'FAITS', title: 'Exposé des faits - Concurrence déloyale', content: 'I. EXPOSÉ DES FAITS\n\n{{demandeur.nom}} exerce une activité de {{activite}} depuis {{date_creation}} et jouit d\'une notoriété établie dans ce secteur.\n\n{{defendeur.nom}}, ancien {{relation_anterieure}} de {{demandeur.nom}} jusqu\'au {{date_fin_relation}}, a créé la société {{societe_concurrente.nom}} le {{date_creation_concurrent}}.\n\nDepuis lors, {{defendeur.nom}} se livre à des actes de concurrence déloyale caractérisés par :\n\n{{#each actes_deloyaux}}\n- {{this.description}}\n{{/each}}\n\nCes agissements ont causé à {{demandeur.nom}} un préjudice commercial considérable, se traduisant par {{description_prejudice}}.', tags: ['faits', 'concurrence déloyale', 'commercial', 'préjudice'], isSystem: true },
    { category: 'FAITS', title: 'Exposé des faits - Recouvrement impayés', content: 'I. EXPOSÉ DES FAITS\n\n{{creancier.nom}} a fourni à {{debiteur.nom}} les prestations/marchandises suivantes :\n\n{{#each factures}}\n- Facture n°{{this.numero}} du {{this.date}} d\'un montant de {{this.montant}} euros HT (échéance : {{this.echeance}})\n{{/each}}\n\nLe montant total des sommes dues s\'élève à {{montant_total}} euros TTC.\n\nMalgré plusieurs relances amiables en date des {{dates_relances}}, {{debiteur.nom}} n\'a procédé à aucun règlement.\n\nUne mise en demeure lui a été adressée par lettre recommandée avec accusé de réception le {{date_mise_en_demeure}}, restée sans effet à ce jour.', tags: ['faits', 'impayés', 'recouvrement', 'créance', 'facture'], isSystem: true },
    { category: 'FAITS', title: 'Exposé des faits - Responsabilité civile', content: 'I. EXPOSÉ DES FAITS\n\nLe {{date_fait_dommageable}}, {{victime.nom}} a subi un dommage dans les circonstances suivantes :\n\n{{description_circonstances}}\n\nCe dommage est directement imputable à {{responsable.nom}} qui {{description_fait_generateur}}.\n\n{{victime.nom}} a subi les préjudices suivants :\n\n{{#each prejudices}}\n- {{this.nature}} : {{this.description}} (évaluation provisoire : {{this.montant}} euros)\n{{/each}}\n\nUn rapport d\'expertise établi par {{expert.nom}} le {{date_expertise}} confirme l\'imputabilité du dommage et évalue le préjudice définitif à {{montant_total_prejudice}} euros.', tags: ['faits', 'responsabilité', 'dommage', 'préjudice', 'indemnisation'], isSystem: true },

    // MOYENS blocks (10) - Articles Code Civil et jurisprudence
    { category: 'MOYENS', title: 'Moyen - Article 1231-1 Code Civil (Dommages-intérêts)', content: 'II. DISCUSSION EN DROIT\n\nA. Sur les dommages-intérêts pour inexécution\n\nL\'article 1231-1 du Code civil dispose :\n« Le débiteur est condamné, s\'il y a lieu, au paiement de dommages et intérêts soit à raison de l\'inexécution de l\'obligation, soit à raison du retard dans l\'exécution, s\'il ne justifie pas que l\'exécution a été empêchée par la force majeure. »\n\nEn l\'espèce, {{defendeur.nom}} n\'a pas exécuté son obligation de {{obligation_inexecutee}}.\n\nCette inexécution a causé à {{demandeur.nom}} un préjudice direct et certain s\'élevant à {{montant_prejudice}} euros, correspondant à {{nature_prejudice}}.', tags: ['moyens', 'droit', 'dommages-intérêts', '1231-1', 'inexécution'], isSystem: true },
    { category: 'MOYENS', title: 'Moyen - Article 1240 Code Civil (Responsabilité délictuelle)', content: 'II. DISCUSSION EN DROIT\n\nA. Sur la responsabilité délictuelle\n\nL\'article 1240 du Code civil dispose :\n« Tout fait quelconque de l\'homme, qui cause à autrui un dommage, oblige celui par la faute duquel il est arrivé à le réparer. »\n\nTrois conditions doivent être réunies :\n1. Une faute : {{defendeur.nom}} a commis une faute en {{description_faute}} ;\n2. Un dommage : {{demandeur.nom}} a subi un préjudice de {{montant_prejudice}} euros ;\n3. Un lien de causalité : le dommage est la conséquence directe et certaine de la faute commise.\n\nLa responsabilité de {{defendeur.nom}} est donc engagée sur le fondement de l\'article 1240 du Code civil.', tags: ['moyens', 'droit', 'responsabilité délictuelle', '1240', 'faute'], isSystem: true },
    { category: 'MOYENS', title: 'Moyen - Article 1641 Code Civil (Garantie des vices cachés)', content: 'II. DISCUSSION EN DROIT\n\nA. Sur la garantie des vices cachés\n\nL\'article 1641 du Code civil dispose :\n« Le vendeur est tenu de la garantie à raison des défauts cachés de la chose vendue qui la rendent impropre à l\'usage auquel on la destine, ou qui diminuent tellement cet usage que l\'acheteur ne l\'aurait pas acquise, ou n\'en aurait donné qu\'un moindre prix, s\'il les avait connus. »\n\nLe vice est caractérisé lorsque :\n- Il est antérieur à la vente : en l\'espèce, {{preuve_anteriorite}} ;\n- Il est caché : {{demandeur.nom}} ne pouvait le déceler lors de la vente ;\n- Il est grave : le bien est impropre à {{usage_prevu}}.\n\n{{demandeur.nom}} est donc fondé à exercer l\'action rédhibitoire ou estimatoire prévue à l\'article 1644 du Code civil.', tags: ['moyens', 'droit', 'vice caché', '1641', 'vente', 'garantie'], isSystem: true },
    { category: 'MOYENS', title: 'Moyen - Article 1792 Code Civil (Responsabilité décennale)', content: 'II. DISCUSSION EN DROIT\n\nA. Sur la responsabilité décennale des constructeurs\n\nL\'article 1792 du Code civil dispose :\n« Tout constructeur d\'un ouvrage est responsable de plein droit, envers le maître ou l\'acquéreur de l\'ouvrage, des dommages, même résultant d\'un vice du sol, qui compromettent la solidité de l\'ouvrage ou qui, l\'affectant dans l\'un de ses éléments constitutifs ou l\'un de ses éléments d\'équipement, le rendent impropre à sa destination. »\n\nEn l\'espèce :\n- La réception des travaux est intervenue le {{date_reception}} ;\n- Les désordres sont apparus le {{date_apparition_desordres}}, soit dans le délai décennal ;\n- Ces désordres {{nature_desordres}} compromettent la solidité de l\'ouvrage / rendent l\'ouvrage impropre à sa destination.\n\nLa responsabilité de {{constructeur.nom}} est donc engagée de plein droit.', tags: ['moyens', 'droit', 'construction', '1792', 'décennale', 'constructeur'], isSystem: true },
    { category: 'MOYENS', title: 'Moyen - Article L.442-1 Code de Commerce (Pratiques restrictives)', content: 'II. DISCUSSION EN DROIT\n\nA. Sur les pratiques restrictives de concurrence\n\nL\'article L.442-1 du Code de commerce dispose :\n« I. - Engage la responsabilité de son auteur et l\'oblige à réparer le préjudice causé le fait, dans le cadre de la négociation commerciale, de la conclusion ou de l\'exécution d\'un contrat, par toute personne exerçant des activités de production, de distribution ou de services :\n1° D\'obtenir ou de tenter d\'obtenir de l\'autre partie un avantage ne correspondant à aucune contrepartie ou manifestement disproportionné au regard de la valeur de la contrepartie consentie ;\n2° De soumettre ou de tenter de soumettre l\'autre partie à des obligations créant un déséquilibre significatif dans les droits et obligations des parties. »\n\nEn l\'espèce, {{defendeur.nom}} a {{description_pratique_restrictive}}.', tags: ['moyens', 'droit', 'commerce', 'L442-1', 'pratiques restrictives', 'déséquilibre'], isSystem: true },
    { category: 'MOYENS', title: 'Moyen - Article L.1235-1 Code du Travail (Licenciement sans cause)', content: 'II. DISCUSSION EN DROIT\n\nA. Sur le licenciement sans cause réelle et sérieuse\n\nL\'article L.1235-1 du Code du travail dispose :\n« En cas de litige, le juge, à qui il appartient d\'apprécier la régularité de la procédure suivie et le caractère réel et sérieux des motifs invoqués par l\'employeur, forme sa conviction au vu des éléments fournis par les parties après avoir ordonné, au besoin, toutes les mesures d\'instruction qu\'il estime utiles. »\n\nLe licenciement de {{salarie.nom}} est dépourvu de cause réelle et sérieuse car :\n\n{{#each motifs_contestation}}\n- {{this}}\n{{/each}}\n\n{{salarie.nom}} est donc fondé à solliciter les indemnités prévues à l\'article L.1235-3 du Code du travail.', tags: ['moyens', 'droit', 'travail', 'L1235-1', 'licenciement', 'cause réelle sérieuse'], isSystem: true },
    { category: 'MOYENS', title: 'Moyen - Jurisprudence concurrence déloyale', content: 'B. Sur la concurrence déloyale - Jurisprudence constante\n\nIl est de jurisprudence constante que constitue un acte de concurrence déloyale le fait de :\n\n- Détourner la clientèle d\'un concurrent par des moyens déloyaux (Com., 12 février 2020, n°18-17.731) ;\n- Débaucher massivement les salariés d\'un concurrent (Com., 24 janvier 2018, n°16-22.325) ;\n- Créer une confusion dans l\'esprit de la clientèle (Com., 10 septembre 2013, n°12-19.588) ;\n- Dénigrer les produits ou services d\'un concurrent (Com., 24 septembre 2013, n°12-19.790).\n\nEn l\'espèce, {{defendeur.nom}} s\'est rendu coupable de {{actes_concurrence_deloyale}}.\n\nLa jurisprudence admet que le préjudice résultant d\'actes de concurrence déloyale peut être évalué en fonction du trouble commercial subi (Com., 12 février 2020, n°18-17.731).', tags: ['moyens', 'jurisprudence', 'concurrence déloyale', 'cassation'], isSystem: true },
    { category: 'MOYENS', title: 'Moyen - Jurisprudence responsabilité contractuelle', content: 'B. Sur la responsabilité contractuelle - Rappel jurisprudentiel\n\nLa Cour de cassation rappelle de manière constante que :\n\n« Le créancier d\'une obligation contractuelle inexécutée a le choix de poursuivre l\'exécution forcée de l\'obligation ou la résolution du contrat avec dommages et intérêts » (Civ. 1ère, 2 avril 2014, n°13-14.287).\n\n« L\'inexécution d\'une obligation contractuelle est en elle-même constitutive d\'une faute, sans qu\'il soit nécessaire de caractériser un comportement fautif distinct » (Civ. 3ème, 6 juillet 2017, n°16-17.151).\n\n« Le préjudice né de l\'inexécution d\'un contrat consiste dans la perte éprouvée et le gain manqué » (Com., 14 juin 2016, n°15-12.576).\n\nEn l\'espèce, l\'inexécution contractuelle de {{defendeur.nom}} justifie {{remede_sollicite}}.', tags: ['moyens', 'jurisprudence', 'responsabilité contractuelle', 'cassation', 'inexécution'], isSystem: true },
    { category: 'MOYENS', title: 'Moyen - Article 700 CPC et dépens', content: 'C. Sur l\'article 700 du Code de procédure civile et les dépens\n\nL\'article 700 du Code de procédure civile dispose :\n« Le juge condamne la partie tenue aux dépens ou qui perd son procès à payer à l\'autre partie la somme qu\'il détermine, au titre des frais exposés et non compris dans les dépens. »\n\nIl serait particulièrement inéquitable de laisser à la charge de {{demandeur.nom}} les frais irrépétibles engagés pour la défense de ses droits.\n\nEn conséquence, {{defendeur.nom}} devra être condamné à verser à {{demandeur.nom}} la somme de {{montant_article_700}} euros au titre de l\'article 700 du CPC.\n\n{{defendeur.nom}} supportera en outre les entiers dépens de l\'instance, en application de l\'article 696 du Code de procédure civile.', tags: ['moyens', 'droit', 'article 700', 'dépens', 'frais'], isSystem: true },
    { category: 'MOYENS', title: 'Moyen - Exécution provisoire', content: 'D. Sur l\'exécution provisoire\n\nConformément aux articles 514 et suivants du Code de procédure civile, l\'exécution provisoire est de droit pour les décisions de première instance.\n\nEn tout état de cause, la situation justifie que l\'exécution provisoire soit ordonnée :\n\n- L\'ancienneté de la créance ({{anciennete_creance}}) ;\n- L\'urgence de la situation ({{description_urgence}}) ;\n- L\'absence de risque de conséquences manifestement excessives.\n\nIl est en effet de jurisprudence constante que « l\'exécution provisoire peut être ordonnée lorsque le juge l\'estime nécessaire et compatible avec la nature de l\'affaire » (Civ. 2ème, 10 mars 2016, n°15-12.876).\n\nEn conséquence, il est demandé au Tribunal d\'ordonner l\'exécution provisoire du jugement à intervenir.', tags: ['moyens', 'exécution provisoire', 'procédure', 'urgence'], isSystem: true },

    // CLAUSE blocks (10) - Clauses contractuelles avancées
    // Missing blocks referenced by templates
    { category: 'INTRO', title: 'Corps mise en demeure', content: 'Par la présente, je vous mets en demeure de {{objet_mise_en_demeure}} dans un délai de {{delai}} jours à compter de la réception de la présente.\n\nEn effet, {{description_manquement}}.\n\nJe vous rappelle que {{fondement_juridique}}.\n\nÀ défaut de régularisation dans le délai imparti, je me verrai contraint de saisir les juridictions compétentes afin de faire valoir les droits de mon client, {{demandeur.nom}}, et d\'obtenir réparation de l\'intégralité du préjudice subi, estimé à ce jour à {{montant_prejudice}} euros.\n\nJe vous prie de croire, Madame, Monsieur, en l\'assurance de ma considération distinguée.', tags: ['mise en demeure', 'corps', 'courrier'], isSystem: true },
    { category: 'INTRO', title: 'Préambule cession', content: 'IL A ÉTÉ PRÉALABLEMENT EXPOSÉ CE QUI SUIT :\n\nLa société {{societe.nom}}, {{societe.forme}}, au capital de {{societe.capital}} euros, immatriculée au RCS de {{societe.rcs}} sous le numéro {{societe.siret}}, dont le siège social est situé {{societe.siege}} (ci-après la « Société »),\n\na été constituée le {{societe.date_constitution}}.\n\nLe capital social est divisé en {{societe.nombre_parts}} parts sociales de {{societe.valeur_nominale}} euros chacune, entièrement souscrites et libérées.\n\n{{cedant.nom}} (ci-après le « Cédant ») est propriétaire de {{nombre_parts_cedees}} parts sociales, représentant {{pourcentage_cession}}% du capital social.\n\nLe Cédant souhaite céder lesdites parts à {{cessionnaire.nom}} (ci-après le « Cessionnaire »), qui souhaite les acquérir.\n\nCECI EXPOSÉ, IL A ÉTÉ CONVENU CE QUI SUIT :', tags: ['préambule', 'cession', 'parts sociales'], isSystem: true },
    { category: 'INTRO', title: 'Préambule pacte', content: 'PRÉAMBULE\n\nLes soussignés sont associés de la société {{societe.nom}}, {{societe.forme}}, au capital de {{societe.capital}} euros, immatriculée au RCS de {{societe.rcs}}, dont le siège social est situé {{societe.siege}} (ci-après la « Société »).\n\nLes Associés souhaitent organiser leurs relations et définir les règles de gouvernance de la Société, conformément aux dispositions de l\'article L.227-1 du Code de commerce.\n\nLe présent pacte a pour objet de déterminer :\n- Les modalités de prise de décision collective ;\n- Les droits et obligations de chaque Associé ;\n- Les conditions de cession des actions ;\n- Les mécanismes de sortie.\n\nIL A ÉTÉ CONVENU CE QUI SUIT :', tags: ['préambule', 'pacte', 'associés', 'SAS'], isSystem: true },
    { category: 'INTRO', title: 'Préambule GAP', content: 'CONVENTION DE GARANTIE D\'ACTIF ET DE PASSIF\n\nENTRE LES SOUSSIGNÉS :\n\n{{garant.nom}}, en sa qualité de cédant des parts sociales de la société {{societe.nom}} (ci-après le « Garant »),\n\nD\'UNE PART,\n\nET :\n\n{{beneficiaire.nom}}, en sa qualité de cessionnaire desdites parts sociales (ci-après le « Bénéficiaire »),\n\nD\'AUTRE PART,\n\nPRÉAMBULE :\n\nPar acte en date du {{date_cession}}, le Garant a cédé au Bénéficiaire {{nombre_parts_cedees}} parts sociales de la Société, représentant {{pourcentage_cession}}% du capital social, moyennant le prix de {{prix_cession}} euros.\n\nDans le cadre de cette cession, le Garant consent au Bénéficiaire la présente garantie d\'actif et de passif.\n\nIL A ÉTÉ CONVENU CE QUI SUIT :', tags: ['préambule', 'GAP', 'garantie', 'cession'], isSystem: true },

    { category: 'CLAUSE', title: 'Clause pénale', content: 'ARTICLE {{numero}} - CLAUSE PÉNALE\n\n{{numero}}.1 - En cas de manquement par l\'une des Parties à l\'une quelconque de ses obligations au titre du présent contrat, la Partie défaillante sera redevable de plein droit, après mise en demeure restée infructueuse pendant un délai de {{delai_mise_en_demeure}} jours, d\'une indemnité forfaitaire de {{montant_penalite}} euros, sans préjudice de tous dommages et intérêts complémentaires.\n\n{{numero}}.2 - Cette clause pénale est stipulée à titre de dommages et intérêts forfaitaires et définitifs, les Parties renonçant expressément à solliciter du juge la révision de son montant en application de l\'article 1231-5 du Code civil.\n\n{{numero}}.3 - Le paiement de cette indemnité n\'aura pas pour effet de libérer la Partie défaillante de son obligation d\'exécuter le contrat.', tags: ['clause', 'pénale', 'sanction', 'indemnité forfaitaire'], isSystem: true },
    { category: 'CLAUSE', title: 'Clause résolutoire', content: 'ARTICLE {{numero}} - CLAUSE RÉSOLUTOIRE\n\n{{numero}}.1 - En cas de manquement grave par l\'une des Parties à ses obligations essentielles au titre du présent contrat, et notamment :\n{{#each obligations_essentielles}}\n- {{this}}\n{{/each}}\n\nle contrat sera résolu de plein droit {{delai_resolution}} jours après l\'envoi d\'une mise en demeure par lettre recommandée avec accusé de réception restée sans effet, sans qu\'il soit besoin d\'aucune formalité judiciaire.\n\n{{numero}}.2 - La résolution sera acquise sans préjudice de tous dommages et intérêts que pourrait réclamer la Partie non défaillante.\n\n{{numero}}.3 - La présente clause résolutoire ne fait pas obstacle à la faculté pour la Partie non défaillante de solliciter l\'exécution forcée du contrat plutôt que sa résolution.', tags: ['clause', 'résolutoire', 'résolution', 'contrat'], isSystem: true },
    { category: 'CLAUSE', title: 'Clause de réserve de propriété', content: 'ARTICLE {{numero}} - RÉSERVE DE PROPRIÉTÉ\n\n{{numero}}.1 - Le transfert de propriété des {{biens_vises}} est suspendu jusqu\'au paiement intégral du prix, en principal et accessoires. Le défaut de paiement pourra entraîner la revendication des biens.\n\n{{numero}}.2 - Toutefois, les risques de perte et de détérioration des biens seront transférés à l\'Acheteur dès la livraison.\n\n{{numero}}.3 - L\'Acheteur s\'engage à :\n- Conserver les biens sous réserve de propriété dans des conditions propres à en assurer l\'identification ;\n- Les assurer contre tous risques, la police devant mentionner l\'existence de la clause de réserve de propriété ;\n- Informer immédiatement le Vendeur de toute saisie pratiquée par un tiers.\n\n{{numero}}.4 - En cas de revente des biens avant complet paiement du prix, l\'Acheteur s\'engage à mentionner la présente clause au sous-acquéreur et à informer le Vendeur de cette revente.', tags: ['clause', 'réserve de propriété', 'transfert', 'paiement'], isSystem: true },
    { category: 'CLAUSE', title: 'Clause attributive de juridiction', content: 'ARTICLE {{numero}} - ATTRIBUTION DE JURIDICTION\n\n{{numero}}.1 - TOUS LES LITIGES AUXQUELS LE PRÉSENT CONTRAT POURRAIT DONNER LIEU, CONCERNANT TANT SA VALIDITÉ, SON INTERPRÉTATION, SON EXÉCUTION, SA RÉSOLUTION, LEURS CONSÉQUENCES ET LEURS SUITES, SERONT SOUMIS AU {{juridiction_competente}}.\n\n{{numero}}.2 - Cette clause attributive de juridiction s\'applique même en cas de pluralité de défendeurs, d\'appel en garantie ou de référé.\n\n{{numero}}.3 - Les Parties déclarent avoir la qualité de commerçants et reconnaissent que le présent contrat a été conclu pour les besoins de leur activité professionnelle.', tags: ['clause', 'attributive', 'juridiction', 'compétence', 'tribunal'], isSystem: true },
    { category: 'CLAUSE', title: 'Clause compromissoire', content: 'ARTICLE {{numero}} - CLAUSE COMPROMISSOIRE\n\n{{numero}}.1 - Tous différends découlant du présent contrat ou en relation avec celui-ci seront tranchés définitivement suivant le Règlement d\'arbitrage de {{institution_arbitrage}}, par {{nombre_arbitres}} arbitre(s) nommé(s) conformément à ce Règlement.\n\n{{numero}}.2 - Le siège de l\'arbitrage sera {{siege_arbitrage}}.\n\n{{numero}}.3 - La langue de l\'arbitrage sera {{langue_arbitrage}}.\n\n{{numero}}.4 - Le droit applicable au fond du litige sera {{droit_applicable}}.\n\n{{numero}}.5 - La sentence arbitrale sera définitive et s\'imposera aux Parties, qui s\'engagent à l\'exécuter de bonne foi. Les Parties renoncent expressément à tout recours en annulation, sauf pour les motifs prévus par les articles 1520 et suivants du Code de procédure civile.', tags: ['clause', 'compromissoire', 'arbitrage', 'litige'], isSystem: true },
    { category: 'CLAUSE', title: 'Clause de médiation préalable', content: 'ARTICLE {{numero}} - MÉDIATION PRÉALABLE OBLIGATOIRE\n\n{{numero}}.1 - Préalablement à toute action judiciaire ou arbitrale, les Parties s\'engagent à soumettre tout différend relatif à la validité, l\'interprétation ou l\'exécution du présent contrat à une procédure de médiation.\n\n{{numero}}.2 - La médiation sera conduite selon le règlement de {{organisme_mediation}}, par un médiateur choisi d\'un commun accord ou, à défaut, désigné par cet organisme.\n\n{{numero}}.3 - La médiation se déroulera à {{lieu_mediation}} en langue {{langue_mediation}}.\n\n{{numero}}.4 - Les Parties s\'engagent à participer de bonne foi à la médiation pendant une durée minimale de {{duree_mediation}} avant de pouvoir saisir toute juridiction.\n\n{{numero}}.5 - Les frais de médiation seront partagés par moitié entre les Parties, sauf accord contraire. Les communications intervenues lors de la médiation resteront confidentielles.', tags: ['clause', 'médiation', 'préalable', 'amiable', 'MARD'], isSystem: true },
    { category: 'CLAUSE', title: 'Clause de hardship (Imprévision)', content: 'ARTICLE {{numero}} - CLAUSE DE HARDSHIP (IMPRÉVISION)\n\n{{numero}}.1 - Si, postérieurement à la conclusion du présent contrat, survient un changement de circonstances imprévisible lors de la conclusion du contrat et rendant l\'exécution excessivement onéreuse pour une Partie, celle-ci peut demander une renégociation du contrat à l\'autre Partie.\n\n{{numero}}.2 - Les circonstances visées incluent notamment :\n- Les modifications substantielles des conditions économiques ;\n- Les évolutions législatives ou réglementaires ;\n- Les événements affectant significativement l\'équilibre contractuel.\n\n{{numero}}.3 - La Partie invoquant la clause doit notifier à l\'autre Partie, par lettre recommandée avec accusé de réception :\n- La nature du changement de circonstances ;\n- Son impact sur l\'équilibre du contrat ;\n- Les modifications qu\'elle propose.\n\n{{numero}}.4 - Les Parties s\'engagent à négocier de bonne foi pendant {{duree_negociation}} jours. À défaut d\'accord, les Parties pourront saisir {{instance_competente}} aux fins de révision ou de résiliation du contrat.', tags: ['clause', 'hardship', 'imprévision', 'renégociation', '1195'], isSystem: true },
    { category: 'CLAUSE', title: 'Clause MAC (Material Adverse Change)', content: 'ARTICLE {{numero}} - CLAUSE MAC (CHANGEMENT DÉFAVORABLE SIGNIFICATIF)\n\n{{numero}}.1 - Un « Changement Défavorable Significatif » (« MAC ») désigne tout événement, circonstance ou changement qui, individuellement ou conjointement avec d\'autres, a ou est raisonnablement susceptible d\'avoir un effet défavorable significatif sur :\n- L\'activité, les actifs, la situation financière ou les résultats de la Société ;\n- La capacité du Vendeur à exécuter ses obligations au titre du présent contrat.\n\n{{numero}}.2 - Ne constituent pas un MAC :\n- Les changements affectant l\'économie ou les marchés financiers en général ;\n- Les changements affectant le secteur d\'activité de la Société dans son ensemble ;\n- Les changements résultant de l\'annonce ou de la réalisation de l\'Opération.\n\n{{numero}}.3 - En cas de survenance d\'un MAC entre la date de signature et la Date de Réalisation, le Cessionnaire pourra :\n- Soit renoncer à l\'Opération sans indemnité ;\n- Soit demander une réduction du Prix de Cession proportionnelle à l\'impact du MAC.', tags: ['clause', 'MAC', 'changement défavorable', 'cession', 'M&A'], isSystem: true },
    { category: 'CLAUSE', title: 'Clause de représentations et garanties', content: 'ARTICLE {{numero}} - REPRÉSENTATIONS ET GARANTIES DU CÉDANT\n\n{{numero}}.1 - Le Cédant déclare et garantit au Cessionnaire que les déclarations suivantes sont exactes et complètes à la date des présentes et le resteront à la Date de Réalisation :\n\na) Capacité et pouvoirs : Le Cédant a la pleine capacité et tous les pouvoirs nécessaires pour conclure et exécuter le présent contrat.\n\nb) Propriété des titres : Le Cédant est propriétaire des Parts cédées, libres de tout nantissement, gage ou sûreté.\n\nc) Comptes sociaux : Les comptes annuels de la Société pour l\'exercice clos le {{date_cloture}} donnent une image fidèle du patrimoine, de la situation financière et des résultats de la Société.\n\nd) Litiges : Il n\'existe aucun litige, procédure ou enquête en cours ou, à la connaissance du Cédant, menaçant, susceptible d\'avoir un effet défavorable significatif sur la Société.\n\ne) Conformité : La Société exerce ses activités en conformité avec toutes les lois et réglementations applicables.', tags: ['clause', 'représentations', 'garanties', 'déclarations', 'cession', 'M&A'], isSystem: true },
    { category: 'CLAUSE', title: 'Clause d\'ajustement de prix', content: 'ARTICLE {{numero}} - AJUSTEMENT DU PRIX DE CESSION\n\n{{numero}}.1 - Le Prix de Cession sera ajusté à la hausse ou à la baisse en fonction de la variation de la Situation Nette Comptable de la Société entre la Date de Référence ({{date_reference}}) et la Date de Réalisation.\n\n{{numero}}.2 - Définitions :\n- « Situation Nette de Référence » : {{montant_snr}} euros, telle qu\'elle ressort du bilan au {{date_reference}}.\n- « Situation Nette de Réalisation » : la situation nette comptable de la Société à la Date de Réalisation, déterminée selon les mêmes méthodes comptables.\n\n{{numero}}.3 - Modalités d\'ajustement :\n- Si la Situation Nette de Réalisation est supérieure à la Situation Nette de Référence, le Prix de Cession sera majoré de la différence ;\n- Si la Situation Nette de Réalisation est inférieure à la Situation Nette de Référence, le Prix de Cession sera réduit de la différence.\n\n{{numero}}.4 - Les comptes de Réalisation seront établis par {{expert_comptable}} dans les {{delai_etablissement}} jours suivant la Date de Réalisation et soumis à l\'approbation des Parties.', tags: ['clause', 'ajustement prix', 'locked box', 'completion accounts', 'cession', 'M&A'], isSystem: true },
  ];

  let blocksCreated = 0;
  for (const block of systemBlocks) {
    const extractedVars = extractVariablesFull(block.content);
    const vars = extractedVars.length > 0 ? extractedVars : null;

    const existing = await prisma.builderBlock.findFirst({
      where: { tenantId: tenant.id, title: block.title },
    });

    if (!existing) {
      await prisma.builderBlock.create({
        data: { ...block, tenantId: tenant.id, variables: vars },
      });
      blocksCreated++;
    } else if (!existing.variables || existing.variables.length === 0) {
      // Backfill variables on existing blocks that have variables: null
      await prisma.builderBlock.update({
        where: { id: existing.id },
        data: { variables: vars },
      });
    }
  }
  console.log(`✅ Created ${blocksCreated} builder blocks`);

  // Build title → ID mapping for resolving blockTitle in templates
  const allBlocks = await prisma.builderBlock.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, title: true, content: true },
  });
  const titleToId = {};
  allBlocks.forEach(b => { titleToId[b.title] = b.id; });

  // System templates
  const systemTemplates = [
    {
      name: 'Assignation devant le Tribunal Judiciaire',
      description: 'Modèle d\'assignation pour les litiges civils devant le Tribunal Judiciaire',
      documentType: 'ASSIGNATION',
      juridiction: 'Tribunal Judiciaire',
      category: 'Procédure civile',
      blocksStructure: [
        { order: 1, blockTitle: 'En-tête assignation TJ', mandatory: true },
        { order: 2, blockTitle: 'Exposé des faits - Inexécution contrat', mandatory: true },
        { order: 3, blockTitle: 'Moyen - Article 1103 Code Civil', mandatory: true },
        { order: 4, blockTitle: 'Dispositif - Condamnation pécuniaire', mandatory: true },
        { order: 5, blockTitle: 'Formule signature avocat', mandatory: true },
      ],
      isSystem: true,
    },
    {
      name: 'Assignation devant le Tribunal de Commerce',
      description: 'Modèle d\'assignation pour les litiges commerciaux',
      documentType: 'ASSIGNATION',
      juridiction: 'Tribunal de Commerce',
      category: 'Procédure commerciale',
      blocksStructure: [
        { order: 1, blockTitle: 'En-tête assignation TC', mandatory: true },
        { order: 2, blockTitle: 'Exposé des faits - Litige commercial', mandatory: true },
        { order: 3, blockTitle: 'Moyen - Article 1103 Code Civil', mandatory: true },
        { order: 4, blockTitle: 'Dispositif - Condamnation pécuniaire', mandatory: true },
        { order: 5, blockTitle: 'Formule signature avocat', mandatory: true },
      ],
      isSystem: true,
    },
    {
      name: 'Conclusions en défense',
      description: 'Modèle de conclusions pour la partie défenderesse',
      documentType: 'CONCLUSIONS',
      category: 'Procédure civile',
      blocksStructure: [
        { order: 1, blockTitle: 'En-tête conclusions', mandatory: true },
        { order: 2, blockTitle: 'Exposé des faits - Inexécution contrat', mandatory: true },
        { order: 3, blockTitle: 'Moyen - Responsabilité contractuelle', mandatory: true },
        { order: 4, blockTitle: 'Dispositif - Condamnation pécuniaire', mandatory: true },
        { order: 5, blockTitle: 'Formule signature avocat', mandatory: true },
      ],
      isSystem: true,
    },
    {
      name: 'Mise en demeure simple',
      description: 'Modèle de mise en demeure pour inexécution contractuelle',
      documentType: 'MISE_EN_DEMEURE',
      category: 'Courriers',
      blocksStructure: [
        { order: 1, blockTitle: 'En-tête mise en demeure', mandatory: true },
        { order: 2, blockTitle: 'Corps mise en demeure', mandatory: true },
        { order: 3, blockTitle: 'Formule signature avocat', mandatory: true },
      ],
      isSystem: true,
    },
    {
      name: 'Protocole de cession de parts sociales',
      description: 'Modèle complet pour cession de parts sociales SARL/SAS',
      documentType: 'PROTOCOLE',
      category: 'Droit des affaires',
      blocksStructure: [
        { order: 1, blockTitle: 'Préambule cession', mandatory: true },
        { order: 2, blockTitle: 'Clause de garantie d\'actif et passif', mandatory: true },
        { order: 3, blockTitle: 'Clause de non-concurrence', mandatory: true },
        { order: 4, blockTitle: 'Formule signature avocat', mandatory: true },
      ],
      isSystem: true,
    },
    {
      name: 'Pacte d\'associés SAS',
      description: 'Modèle de pacte d\'associés pour SAS',
      documentType: 'PACTE',
      category: 'Droit des affaires',
      blocksStructure: [
        { order: 1, blockTitle: 'Préambule pacte', mandatory: true },
        { order: 2, blockTitle: 'Clause de sortie conjointe (tag-along)', mandatory: true },
        { order: 3, blockTitle: 'Clause d\'entraînement (drag-along)', mandatory: true },
        { order: 4, blockTitle: 'Clause de confidentialité', mandatory: true },
        { order: 5, blockTitle: 'Formule signature avocat', mandatory: true },
      ],
      isSystem: true,
    },
    {
      name: 'Garantie d\'actif et passif (GAP)',
      description: 'Convention de garantie d\'actif et passif autonome',
      documentType: 'GARANTIE',
      category: 'Droit des affaires',
      blocksStructure: [
        { order: 1, blockTitle: 'Préambule GAP', mandatory: true },
        { order: 2, blockTitle: 'Clause de garantie d\'actif et passif', mandatory: true },
        { order: 3, blockTitle: 'Formule signature avocat', mandatory: true },
      ],
      isSystem: true,
    },
  ];

  let templatesCreated = 0;
  for (const template of systemTemplates) {
    const existing = await prisma.builderTemplate.findFirst({
      where: { tenantId: tenant.id, name: template.name },
    });

    // Resolve blockTitle → blockId in blocksStructure
    const resolvedStructure = (template.blocksStructure || []).map(item => ({
      blockId: titleToId[item.blockTitle] || null,
      blockTitle: item.blockTitle,
      order: item.order,
      mandatory: item.mandatory,
    }));

    // Compute requiredVariables from resolved block content
    const allVars = new Set();
    for (const item of resolvedStructure) {
      if (item.blockId) {
        const block = allBlocks.find(b => b.id === item.blockId);
        if (block) extractVariablesFull(block.content).forEach(v => allVars.add(v));
      }
    }
    const reqVars = Array.from(allVars);

    if (!existing) {
      await prisma.builderTemplate.create({
        data: {
          ...template,
          tenantId: tenant.id,
          outputFormat: 'DOCX',
          blocksStructure: resolvedStructure,
          requiredVariables: reqVars.length > 0 ? reqVars : null,
        },
      });
      templatesCreated++;
    } else {
      // Backfill existing templates with resolved blockIds and requiredVariables
      await prisma.builderTemplate.update({
        where: { id: existing.id },
        data: {
          blocksStructure: resolvedStructure,
          requiredVariables: reqVars.length > 0 ? reqVars : null,
        },
      });
    }
  }
  console.log(`✅ Created ${templatesCreated} builder templates`);

  // Update legal info
  const existingLegalInfo = await prisma.avocatLegalInfo.findUnique({
    where: { tenantId: tenant.id },
  });

  if (existingLegalInfo && !existingLegalInfo.barreau) {
    await prisma.avocatLegalInfo.update({
      where: { tenantId: tenant.id },
      data: {
        numeroToque: 'P0245',
        barreau: 'Angers',
        specialites: ['Droit des affaires', 'Droit des sociétés', 'Fusions-Acquisitions'],
        rcs: 'Angers B 123 456 789',
        tvaIntra: 'FR12345678901',
        assuranceRC: 'AXA Assurances',
        numeroPolice: 'RC-2026-00123456',
        mentionsLegales: {
          denomination: 'Cabinet Pragmavox',
          forme_juridique: 'SELARL',
          capital: 10000,
          siege: '123 Rue de la Paix, 49000 Angers',
          rcs: 'Angers B 123 456 789',
          ordre: 'Ordre des Avocats du Barreau d\'Angers',
        },
      },
    });
    console.log('✅ Updated legal info');
  }

  console.log(`  → ${blocksCreated} blocks created, ${templatesCreated} templates created`);
  } // end for (const tenant of tenants)

  console.log('');
  console.log('🎉 Document Builder seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
