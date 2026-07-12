/**
 * Complete catalog of template variables available for document generation.
 * Each variable has: key, label (FR), category, description, example value.
 */

const TEMPLATE_VARIABLES = [
  // ── Cabinet ──
  { key: 'cabinet.nom', label: 'Nom du cabinet', category: 'cabinet', description: 'Nom commercial du cabinet', example: 'Cabinet Pragmavox Avocat' },
  { key: 'cabinet.raison_sociale', label: 'Raison sociale', category: 'cabinet', description: 'Denomination legale', example: 'SELARL Cabinet Pragmavox Avocat' },
  { key: 'cabinet.adresse', label: 'Adresse complete', category: 'cabinet', description: 'Adresse, CP, Ville', example: '1 Place du Ralliement, 49100, Angers' },
  { key: 'cabinet.cp', label: 'Code postal', category: 'cabinet', description: 'Code postal du cabinet', example: '49100' },
  { key: 'cabinet.ville', label: 'Ville', category: 'cabinet', description: 'Ville du cabinet', example: 'Angers' },
  { key: 'cabinet.telephone', label: 'Telephone', category: 'cabinet', description: 'Numero de telephone', example: '02 41 87 00 00' },
  { key: 'cabinet.email', label: 'Email', category: 'cabinet', description: 'Email du cabinet', example: 'contact@pragmavox.fr' },
  { key: 'cabinet.siret', label: 'SIRET', category: 'cabinet', description: 'Numero SIRET', example: '123 456 789 00001' },
  { key: 'cabinet.toque', label: 'Toque', category: 'cabinet', description: 'Numero de toque', example: 'T-123' },
  { key: 'cabinet.barreau', label: 'Barreau', category: 'cabinet', description: 'Barreau de rattachement', example: 'Angers' },
  { key: 'cabinet.site', label: 'Site web', category: 'cabinet', description: 'URL du site web', example: 'https://www.pragmavox.fr' },
  { key: 'cabinet.logo', label: 'Logo', category: 'cabinet', description: 'Chemin du logo (pour en-tete)', example: '/uploads/logo.png' },

  // ── Avocat ──
  { key: 'avocat.nom', label: 'Nom', category: 'avocat', description: "Nom de famille de l'avocat", example: 'Bienaime' },
  { key: 'avocat.prenom', label: 'Prenom', category: 'avocat', description: "Prenom de l'avocat", example: 'Yves-Marie' },
  { key: 'avocat.nom_complet', label: 'Nom complet', category: 'avocat', description: 'Prenom + Nom', example: 'Yves-Marie Bienaime' },
  { key: 'avocat.signature', label: 'Signature', category: 'avocat', description: 'Me Prenom Nom', example: 'Me Yves-Marie Bienaime' },
  { key: 'avocat.email', label: 'Email', category: 'avocat', description: "Email de l'avocat", example: 'ym.bienaime@pragmavox.fr' },
  { key: 'avocat.toque', label: 'Toque', category: 'avocat', description: "Toque de l'avocat", example: 'T-123' },
  { key: 'avocat.barreau', label: 'Barreau', category: 'avocat', description: "Barreau de l'avocat", example: 'Angers' },
  { key: 'avocat.adresse', label: 'Adresse', category: 'avocat', description: 'Adresse professionnelle', example: '1 Place du Ralliement, 49100, Angers' },
  { key: 'avocat.telephone', label: 'Telephone', category: 'avocat', description: 'Telephone professionnel', example: '02 41 87 00 00' },

  // ── Client PP ──
  { key: 'client.civilite', label: 'Civilite', category: 'client_pp', description: 'M. ou Mme', example: 'M.' },
  { key: 'client.nom', label: 'Nom', category: 'client_pp', description: 'Nom de famille', example: 'Dupont' },
  { key: 'client.prenom', label: 'Prenom', category: 'client_pp', description: 'Prenom', example: 'Jean' },
  { key: 'client.nom_complet', label: 'Nom complet', category: 'client_pp', description: 'Civilite + Prenom + Nom', example: 'M. Jean Dupont' },
  { key: 'client.adresse', label: 'Adresse', category: 'client_pp', description: 'Adresse complete', example: '15 rue de la Paix, 75002, Paris' },
  { key: 'client.email', label: 'Email', category: 'client_pp', description: 'Adresse email', example: 'jean.dupont@email.com' },
  { key: 'client.telephone', label: 'Telephone', category: 'client_pp', description: 'Telephone principal', example: '06 12 34 56 78' },
  { key: 'client.nationalite', label: 'Nationalite', category: 'client_pp', description: 'Nationalite', example: 'Francaise' },
  { key: 'client.date_naissance', label: 'Date de naissance', category: 'client_pp', description: 'Date format FR', example: '15/03/1980' },
  { key: 'client.lieu_naissance', label: 'Lieu de naissance', category: 'client_pp', description: 'Ville de naissance', example: 'Angers' },
  { key: 'client.profession', label: 'Profession', category: 'client_pp', description: 'Profession exercee', example: 'Ingenieur' },
  { key: 'client.secu', label: 'N° Securite sociale', category: 'client_pp', description: 'Numero de securite sociale', example: '1 80 03 49 007 123 45' },
  { key: 'client.situation_familiale', label: 'Situation familiale', category: 'client_pp', description: 'Marie, Celibataire, etc.', example: 'Marie' },
  { key: 'client.conjoint_nom', label: 'Nom du conjoint', category: 'client_pp', description: 'Nom de famille du conjoint', example: 'Dupont' },
  { key: 'client.conjoint_prenom', label: 'Prenom du conjoint', category: 'client_pp', description: 'Prenom du conjoint', example: 'Marie' },
  { key: 'client.regime_matrimonial', label: 'Regime matrimonial', category: 'client_pp', description: 'Regime applicable', example: 'Communaute legale' },

  // ── Client PM ──
  { key: 'client.raison_sociale', label: 'Raison sociale', category: 'client_pm', description: "Denomination de l'entreprise", example: 'Tech Corp SAS' },
  { key: 'client.forme_sociale', label: 'Forme juridique', category: 'client_pm', description: 'SAS, SARL, SA, etc.', example: 'SAS' },
  { key: 'client.siret', label: 'SIRET', category: 'client_pm', description: 'Numero SIRET', example: '987 654 321 00001' },
  { key: 'client.rcs', label: 'RCS', category: 'client_pm', description: 'Numero RCS', example: 'Angers B 987 654 321' },
  { key: 'client.capital', label: 'Capital social', category: 'client_pm', description: 'Montant du capital', example: '10 000 euros' },
  { key: 'client.ville_immatriculation', label: 'Ville immatriculation client', category: 'client_pm', description: 'Greffe RCS (GO-LIVE-1.C.1)', example: 'Angers' },
  { key: 'client.numero_immatriculation', label: 'N° immatriculation client', category: 'client_pm', description: 'RCS/SIREN (GO-LIVE-1.C.1)', example: '123 456 789' },
  { key: 'client.est_morale', label: 'Client est une personne morale', category: 'client_pm', description: 'Booléen — condition {#client_est_morale}', example: 'true' },
  { key: 'client.est_physique', label: 'Client est une personne physique', category: 'client_pm', description: 'Booléen — condition {#client_est_physique}', example: 'false' },
  { key: 'client.siege', label: 'Siege social', category: 'client_pm', description: 'Adresse du siege', example: '10 avenue des Champs, 75008 Paris' },
  { key: 'client.objet_social', label: 'Objet social', category: 'client_pm', description: "Objet social de l'entreprise", example: 'Conseil en informatique' },

  // ── Dossier ──
  { key: 'dossier.titre', label: 'Titre', category: 'dossier', description: 'Titre du dossier', example: 'Cession parts Tech Corp' },
  { key: 'dossier.reference', label: 'Reference', category: 'dossier', description: 'Reference interne', example: 'DOS-2026-0042' },
  { key: 'dossier.date_ouverture', label: "Date d'ouverture", category: 'dossier', description: "Date d'ouverture du dossier", example: '15/01/2026' },
  { key: 'dossier.type', label: 'Type', category: 'dossier', description: 'Juridique ou Judiciaire', example: 'CONTRACT' },
  { key: 'dossier.nature', label: 'Nature', category: 'dossier', description: 'Nature du dossier', example: 'Cession' },
  { key: 'dossier.juridiction', label: 'Juridiction', category: 'dossier', description: 'TJ, CA, TC, etc.', example: 'Tribunal Judiciaire' },
  { key: 'dossier.rg', label: 'Numero RG', category: 'dossier', description: 'Numero de Repertoire General', example: '26/01234' },
  { key: 'dossier.chambre', label: 'Chambre', category: 'dossier', description: 'Chambre du tribunal', example: '1ere chambre civile' },
  { key: 'dossier.date_audience', label: "Date d'audience", category: 'dossier', description: "Date de la prochaine audience", example: '15/03/2026' },
  { key: 'dossier.date_echeance', label: 'Date echeance', category: 'dossier', description: 'Date limite / echeance', example: '01/04/2026' },
  // GO-LIVE-1.B — assignation : audience en lettres (calculé) + champs ponctuels (additionalData)
  { key: 'dossier.date_audience_lettres', label: "Date d'audience en lettres", category: 'dossier', description: 'Calcule depuis date_audience', example: 'le quinze mars deux mille vingt-six' },
  { key: 'dossier.heure_audience', label: "Heure d'audience en lettres", category: 'dossier', description: 'Calcule depuis date_audience', example: 'quatorze heures trente' },
  { key: 'dossier.tribunal_ville', label: 'Ville du tribunal', category: 'dossier', description: 'Ponctuel (additionalData)', example: 'Angers' },
  { key: 'dossier.tribunal_adresse', label: 'Adresse du tribunal', category: 'dossier', description: 'Ponctuel (additionalData)', example: '1 rue Waldeck-Rousseau, 49000 Angers' },
  { key: 'dossier.montant_article_700', label: 'Montant article 700', category: 'dossier', description: 'Ponctuel (additionalData)', example: '2 500 €' },
  { key: 'dossier.montant_provisionnel', label: 'Montant provisionnel (référé)', category: 'dossier', description: 'Provision demandée au juge (≠ créance MED). Ponctuel (additionalData)', example: '15 000 € TTC' },
  { key: 'dossier.date_mise_en_demeure', label: 'Date de la mise en demeure', category: 'dossier', description: 'Ponctuel (additionalData)', example: '01/02/2026' },

  // ── Parties adverses ──
  { key: 'parties_adverses', label: 'Liste des parties adverses', category: 'parties', description: 'Boucle {#parties_adverses}...{/parties_adverses} (Docxtemplater)', example: '[tableau]' },
  { key: 'parties_adverses.[].nom', label: 'Nom partie adverse', category: 'parties', description: 'Dans boucle: {nom}', example: 'Martin' },
  { key: 'parties_adverses.[].prenom', label: 'Prenom partie adverse', category: 'parties', description: 'Dans boucle: {prenom}', example: 'Pierre' },
  { key: 'parties_adverses.[].adresse', label: 'Adresse partie adverse', category: 'parties', description: 'Dans boucle: {adresse}', example: '5 rue de Rivoli, Paris' },
  { key: 'parties_adverses.[].avocat_nom', label: 'Avocat adverse', category: 'parties', description: 'Dans boucle: {avocat_nom}', example: 'Me Durand' },
  { key: 'parties_adverses.[].avocat_barreau', label: 'Barreau avocat adverse', category: 'parties', description: 'Dans boucle: {avocat_barreau}', example: 'Paris' },
  // GO-LIVE-1.B — adversaire personne morale (vides si physique)
  { key: 'parties_adverses.[].type', label: 'Type partie adverse', category: 'parties', description: 'Dans boucle: {type} (PHYSIQUE|MORALE)', example: 'MORALE' },
  { key: 'parties_adverses.[].raison_sociale', label: 'Raison sociale partie adverse', category: 'parties', description: 'Dans boucle: {raison_sociale} (personne morale)', example: 'Démo SARL' },
  { key: 'parties_adverses.[].forme_sociale', label: 'Forme sociale partie adverse', category: 'parties', description: 'Dans boucle: {forme_sociale} (personne morale)', example: 'SARL' },
  { key: 'parties_adverses.[].capital', label: 'Capital partie adverse', category: 'parties', description: 'Dans boucle: {capital} (formaté €, personne morale)', example: '10 000,00 €' },
  { key: 'parties_adverses.[].ville_immatriculation', label: 'Ville immatriculation partie adverse', category: 'parties', description: 'Dans boucle: {ville_immatriculation} (greffe RCS)', example: 'Angers' },
  { key: 'parties_adverses.[].numero_immatriculation', label: 'N° immatriculation partie adverse', category: 'parties', description: 'Dans boucle: {numero_immatriculation} (RCS/SIREN)', example: '987 654 321' },

  // GO-LIVE-1.C.1 — adversaire SINGULIER (1er PARTIE_ADVERSE), hors boucle
  { key: 'adversaire.denomination', label: 'Dénomination adversaire', category: 'adversaire', description: 'Raison sociale (PM) ou nom complet (PP)', example: 'Démo SARL' },
  { key: 'adversaire.raison_sociale', label: 'Raison sociale adversaire', category: 'adversaire', description: 'Personne morale', example: 'Démo SARL' },
  { key: 'adversaire.forme_sociale', label: 'Forme sociale adversaire', category: 'adversaire', description: 'Personne morale', example: 'SARL' },
  { key: 'adversaire.capital', label: 'Capital adversaire', category: 'adversaire', description: 'Formaté € (personne morale)', example: '10 000,00 €' },
  { key: 'adversaire.adresse', label: 'Adresse adversaire', category: 'adversaire', description: 'Adresse / siège', example: '10 rue du Commerce, Angers' },
  { key: 'adversaire.adresse_mail', label: 'Email adversaire', category: 'adversaire', description: 'Adresse mail', example: 'contact@demo.fr' },
  { key: 'adversaire.ville_immatriculation', label: 'Ville immatriculation adversaire', category: 'adversaire', description: 'Greffe RCS (personne morale)', example: 'Angers' },
  { key: 'adversaire.numero_immatriculation', label: 'N° immatriculation adversaire', category: 'adversaire', description: 'RCS/SIREN (personne morale)', example: '987 654 321' },
  { key: 'adversaire.est_morale', label: 'Adversaire est une personne morale', category: 'adversaire', description: 'Booléen — condition {#adversaire_est_morale}', example: 'true' },
  { key: 'adversaire.est_physique', label: 'Adversaire est une personne physique', category: 'adversaire', description: 'Booléen — condition {#adversaire_est_physique}', example: 'false' },

  // ── Co-débiteurs (B2 Phase 3) ──
  { key: 'co_debiteurs', label: 'Liste des co-débiteurs', category: 'co_debiteurs', description: 'Boucle {#co_debiteurs}...{/co_debiteurs} (Docxtemplater)', example: '[tableau]' },
  { key: 'co_debiteurs.[].nom', label: 'Nom co-débiteur', category: 'co_debiteurs', description: 'Dans boucle: {nom}', example: 'Dupont' },
  { key: 'co_debiteurs.[].prenom', label: 'Prénom co-débiteur', category: 'co_debiteurs', description: 'Dans boucle: {prenom}', example: 'Jean' },
  { key: 'co_debiteurs.[].raison_sociale', label: 'Raison sociale (si morale)', category: 'co_debiteurs', description: 'Dans boucle: {raison_sociale}', example: 'Tech Corp SAS' },
  { key: 'co_debiteurs.[].adresse', label: 'Adresse co-débiteur', category: 'co_debiteurs', description: 'Dans boucle: {adresse}', example: '1 rue de la Paix' },
  { key: 'co_debiteurs.[].code_postal', label: 'Code postal', category: 'co_debiteurs', description: 'Dans boucle: {code_postal}', example: '49000' },
  { key: 'co_debiteurs.[].ville', label: 'Ville', category: 'co_debiteurs', description: 'Dans boucle: {ville}', example: 'Angers' },
  { key: 'co_debiteurs.[].email', label: 'Email', category: 'co_debiteurs', description: 'Dans boucle: {email}', example: 'jean.dupont@example.fr' },
  { key: 'co_debiteurs.[].telephone', label: 'Téléphone', category: 'co_debiteurs', description: 'Dans boucle: {telephone}', example: '0612345678' },

  // ── Societe (si client PM) ──
  { key: 'societe.nom', label: 'Nom societe', category: 'societe', description: 'Raison sociale (si PM)', example: 'Tech Corp SAS' },
  { key: 'societe.forme', label: 'Forme juridique', category: 'societe', description: 'SAS, SARL, etc.', example: 'SAS' },
  { key: 'societe.objet_social', label: 'Objet social', category: 'societe', description: 'Objet social', example: 'Conseil en informatique' },
  { key: 'societe.capital', label: 'Capital', category: 'societe', description: 'Capital social', example: '10 000 euros' },
  { key: 'societe.siege', label: 'Siege social', category: 'societe', description: 'Adresse du siege', example: '10 avenue des Champs, 75008 Paris' },
  { key: 'societe.rcs', label: 'RCS', category: 'societe', description: 'Numero RCS', example: 'Paris B 987 654 321' },

  // ── Dates ──
  { key: 'date', label: 'Date du jour', category: 'dates', description: 'Date format court', example: '18/02/2026' },
  { key: 'date_jour_long', label: 'Date longue', category: 'dates', description: 'Date en toutes lettres', example: '18 fevrier 2026' },
  { key: 'date_annee', label: 'Annee', category: 'dates', description: 'Annee en cours', example: '2026' },
  { key: 'date_annee_lettres', label: 'Annee en lettres', category: 'dates', description: 'Annee en cours en toutes lettres', example: 'deux mille vingt-six' },

  // ── Postulant ──
  { key: 'postulant.nom', label: 'Nom postulant', category: 'postulant', description: 'Nom du postulant', example: 'Martin' },
  { key: 'postulant.prenom', label: 'Prenom postulant', category: 'postulant', description: 'Prenom du postulant', example: 'Sophie' },
  { key: 'postulant.nom_complet', label: 'Nom complet postulant', category: 'postulant', description: 'Prenom + Nom', example: 'Sophie Martin' },
  { key: 'postulant.cabinet', label: 'Cabinet postulant', category: 'postulant', description: 'Cabinet du postulant', example: 'Cabinet Martin' },
  { key: 'postulant.barreau', label: 'Barreau postulant', category: 'postulant', description: 'Barreau du postulant', example: 'Paris' },
  { key: 'postulant.adresse', label: 'Adresse postulant', category: 'postulant', description: 'Adresse du postulant', example: '1 rue de la Paix, 49000 Angers' },
];

const CATEGORIES = {
  cabinet: { label: 'Cabinet', icon: '🏛️', order: 0 },
  avocat: { label: 'Avocat', icon: '⚖️', order: 1 },
  client_pp: { label: 'Client (Personne physique)', icon: '👤', order: 2 },
  client_pm: { label: 'Client (Personne morale)', icon: '🏢', order: 3 },
  dossier: { label: 'Dossier', icon: '📁', order: 4 },
  parties: { label: 'Parties adverses', icon: '⚔️', order: 5 },
  co_debiteurs: { label: 'Co-débiteurs', icon: '🔗', order: 5.5 },
  societe: { label: 'Societe', icon: '🏭', order: 6 },
  dates: { label: 'Dates', icon: '📅', order: 7 },
  postulant: { label: 'Postulant', icon: '📋', order: 8 },
};

/**
 * Return variables grouped by category, sorted by category order.
 */
function getGroupedVariables() {
  const groups = {};
  for (const cat of Object.keys(CATEGORIES)) {
    groups[cat] = {
      ...CATEGORIES[cat],
      variables: TEMPLATE_VARIABLES.filter(v => v.category === cat),
    };
  }
  return Object.entries(groups)
    .sort(([, a], [, b]) => a.order - b.order)
    .reduce((acc, [key, val]) => {
      if (val.variables.length > 0) acc[key] = val;
      return acc;
    }, {});
}

module.exports = { TEMPLATE_VARIABLES, CATEGORIES, getGroupedVariables };
