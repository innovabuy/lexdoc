import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface AutoFillData {
  folder: {
    id: string;
    name: string;
    folderType: string;
    metadata: Record<string, any>;
  };
  client: {
    id: string;
    type: string;
    civilite?: string;
    nom: string;
    prenom?: string;
    denomination?: string;
    email?: string;
    telephone?: string;
    mobile?: string;
    adresse?: string;
    codePostal?: string;
    ville?: string;
    siret?: string;
    rcs?: string;
    formeJuridique?: string;
    capital?: number;
    representant?: string;
  } | null;
  avocatInfo: {
    civilite: string;
    nom: string;
    prenom: string;
    barreau: string;
    numeroToque?: string;
    adresseCabinet: string;
    codePostal: string;
    ville: string;
    telephone: string;
    fax?: string;
    email: string;
    siteWeb?: string;
  } | null;
}

async function fetchAutoFillData(folderId: string): Promise<AutoFillData> {
  const response = await apiClient.get<{ success: boolean; data: AutoFillData }>(
    `/folders/${folderId}/auto-fill`
  );
  return response.data.data;
}

/**
 * Fetch auto-fill data for a folder
 */
export function useAutoFillData(folderId: string | undefined) {
  return useQuery({
    queryKey: ['auto-fill', folderId],
    queryFn: () => fetchAutoFillData(folderId!),
    enabled: !!folderId,
    staleTime: 30 * 1000,
  });
}

/**
 * Transform auto-fill data into variable values for document generation
 */
export function useAutoFilledVariables(folderId: string | undefined) {
  const { data, isLoading, error } = useAutoFillData(folderId);

  const autoFilledVariables = useMemo(() => {
    if (!data) return {};

    const values: Record<string, any> = {};
    const { client, folder, avocatInfo } = data;

    // ============================================
    // CLIENT VARIABLES
    // ============================================
    if (client) {
      values['client.type'] = client.type;
      values['client.civilite'] = client.civilite;
      values['client.nom'] = client.nom;
      values['client.prenom'] = client.prenom;
      values['client.denomination'] = client.denomination;
      values['client.nom_complet'] = client.denomination ||
        (client.prenom ? `${client.prenom} ${client.nom}` : client.nom);
      values['client.email'] = client.email;
      values['client.telephone'] = client.telephone || client.mobile;
      values['client.mobile'] = client.mobile;
      values['client.adresse'] = client.adresse;
      values['client.code_postal'] = client.codePostal;
      values['client.ville'] = client.ville;
      values['client.adresse_complete'] = [
        client.adresse,
        [client.codePostal, client.ville].filter(Boolean).join(' '),
      ].filter(Boolean).join('\n');
      values['client.siret'] = client.siret;
      values['client.rcs'] = client.rcs;
      values['client.forme_juridique'] = client.formeJuridique;
      values['client.capital'] = client.capital;
      values['client.representant'] = client.representant;
    }

    // ============================================
    // AVOCAT VARIABLES
    // ============================================
    if (avocatInfo) {
      values['avocat.civilite'] = avocatInfo.civilite;
      values['avocat.nom'] = avocatInfo.nom;
      values['avocat.prenom'] = avocatInfo.prenom;
      values['avocat.nom_complet'] = `${avocatInfo.civilite} ${avocatInfo.prenom} ${avocatInfo.nom}`;
      values['avocat.barreau'] = avocatInfo.barreau;
      values['avocat.toque'] = avocatInfo.numeroToque;
      values['avocat.adresse_cabinet'] = avocatInfo.adresseCabinet;
      values['avocat.code_postal'] = avocatInfo.codePostal;
      values['avocat.ville'] = avocatInfo.ville;
      values['avocat.telephone'] = avocatInfo.telephone;
      values['avocat.fax'] = avocatInfo.fax;
      values['avocat.email'] = avocatInfo.email;
      values['avocat.site_web'] = avocatInfo.siteWeb;
      values['avocat.adresse_complete'] = [
        avocatInfo.adresseCabinet,
        [avocatInfo.codePostal, avocatInfo.ville].filter(Boolean).join(' '),
      ].filter(Boolean).join('\n');
    }

    // ============================================
    // FOLDER METADATA VARIABLES
    // ============================================
    const meta = folder.metadata || {};

    // Affaire generale
    if (meta.intitule) values['affaire.intitule'] = meta.intitule;
    if (meta.numeroRG) values['affaire.numero_rg'] = meta.numeroRG;
    if (meta.juridiction) values['affaire.juridiction'] = meta.juridiction;
    if (meta.typeAffaire) values['affaire.type'] = meta.typeAffaire;
    if (meta.dateOuverture) values['affaire.date_ouverture'] = meta.dateOuverture;
    if (meta.dateAudience) values['date_audience'] = meta.dateAudience;
    if (meta.dateCloture) values['affaire.date_cloture'] = meta.dateCloture;
    if (meta.montantLitige) values['affaire.montant_litige'] = meta.montantLitige;
    if (meta.montantProvision) values['affaire.montant_provision'] = meta.montantProvision;

    // Partie adverse (from affaire metadata)
    if (meta.partieAdverse) {
      values['partie_adverse.nom'] = meta.partieAdverse.nom;
      values['partie_adverse.adresse'] = meta.partieAdverse.adresse;
      values['partie_adverse.representant'] = meta.partieAdverse.representant;
    }

    // Cession entreprise
    if (folder.folderType === 'CESSION_ENTREPRISE') {
      // Societe cible
      if (meta.societeCible_denomination) values['societe_cible.denomination'] = meta.societeCible_denomination;
      if (meta.societeCible_siret) values['societe_cible.siret'] = meta.societeCible_siret;
      if (meta.societeCible_rcs) values['societe_cible.rcs'] = meta.societeCible_rcs;
      if (meta.societeCible_capital) values['societe_cible.capital'] = meta.societeCible_capital;
      if (meta.societeCible_formeJuridique) values['societe_cible.forme_juridique'] = meta.societeCible_formeJuridique;

      // Acquereur
      if (meta.acquereur_denomination) values['acquereur.denomination'] = meta.acquereur_denomination;
      if (meta.acquereur_siret) values['acquereur.siret'] = meta.acquereur_siret;
      if (meta.acquereur_representant) values['acquereur.representant'] = meta.acquereur_representant;

      // Cedant
      if (meta.cedant_nom) values['cedant.nom'] = meta.cedant_nom;
      if (meta.cedant_nombreParts) values['cedant.nombre_parts'] = meta.cedant_nombreParts;
      if (meta.cedant_pourcentageCapital) values['cedant.pourcentage_capital'] = meta.cedant_pourcentageCapital;

      // Transaction
      if (meta.prixEstime) values['prix_estime'] = meta.prixEstime;
      if (meta.prixFinal) values['prix_final'] = meta.prixFinal;
      if (meta.dateLOI) values['date_loi'] = meta.dateLOI;
      if (meta.dateSignatureProtocole) values['date_signature_protocole'] = meta.dateSignatureProtocole;
      if (meta.dateCession) values['date_cession'] = meta.dateCession;

      // GAP
      if (meta.gap_plafond) values['gap.plafond'] = meta.gap_plafond;
      if (meta.gap_franchise) values['gap.franchise'] = meta.gap_franchise;
      if (meta.gap_dureeAns) values['gap.duree_ans'] = meta.gap_dureeAns;

      // Earn-out
      if (meta.earnout_montant) values['earnout.montant'] = meta.earnout_montant;
      if (meta.earnout_conditions) values['earnout.conditions'] = meta.earnout_conditions;
    }

    // Contentieux
    if (folder.folderType.startsWith('CONTENTIEUX')) {
      if (meta.numeroRG) values['numero_rg'] = meta.numeroRG;
      if (meta.juridiction) values['juridiction'] = meta.juridiction;
      if (meta.typeContentieux) values['type_contentieux'] = meta.typeContentieux;
      if (meta.chambre) values['chambre'] = meta.chambre;

      // Demandeur
      if (meta.demandeur_nom) values['demandeur.nom'] = meta.demandeur_nom;
      if (meta.demandeur_qualite) values['demandeur.qualite'] = meta.demandeur_qualite;

      // Defendeur
      if (meta.defendeur_nom) values['defendeur.nom'] = meta.defendeur_nom;
      if (meta.defendeur_adresse) values['defendeur.adresse'] = meta.defendeur_adresse;
      if (meta.defendeur_avocat) values['defendeur.avocat'] = meta.defendeur_avocat;

      // Montants
      if (meta.montantDemande) values['montant_demande'] = meta.montantDemande;
      if (meta.montantObtenu) values['montant_obtenu'] = meta.montantObtenu;

      // Dates
      if (meta.dateAssignation) values['date_assignation'] = meta.dateAssignation;
      if (meta.dateMiseEnEtat) values['date_mise_en_etat'] = meta.dateMiseEnEtat;
      if (meta.dateCloture) values['date_cloture'] = meta.dateCloture;
      if (meta.dateAudience) values['date_audience'] = meta.dateAudience;
      if (meta.dateJugement) values['date_jugement'] = meta.dateJugement;
    }

    // Immobilier
    if (folder.folderType.startsWith('IMMOBILIER')) {
      if (meta.adresseBien) values['bien.adresse'] = meta.adresseBien;
      if (meta.typeBien) values['bien.type'] = meta.typeBien;
      if (meta.surfaceM2) values['bien.surface_m2'] = meta.surfaceM2;

      // Bail
      if (meta.typeBail) values['bail.type'] = meta.typeBail;
      if (meta.montantLoyer) values['bail.loyer'] = meta.montantLoyer;
      if (meta.dateDebutBail) values['bail.date_debut'] = meta.dateDebutBail;
      if (meta.dateFinBail) values['bail.date_fin'] = meta.dateFinBail;

      // Locataire
      if (meta.locataire_nom) values['locataire.nom'] = meta.locataire_nom;
      if (meta.locataire_adresse) values['locataire.adresse'] = meta.locataire_adresse;

      // Bailleur
      if (meta.bailleur_nom) values['bailleur.nom'] = meta.bailleur_nom;
      if (meta.bailleur_adresse) values['bailleur.adresse'] = meta.bailleur_adresse;

      // Contentieux
      if (meta.arriereLoyers) values['arrieres_loyers'] = meta.arriereLoyers;
      if (meta.montantDegats) values['montant_degats'] = meta.montantDegats;
    }

    // ============================================
    // SYSTEM VARIABLES (always available)
    // ============================================
    const now = new Date();
    values['date_jour'] = now.toISOString().split('T')[0];
    values['date_jour_long'] = new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
    }).format(now);
    values['annee'] = now.getFullYear().toString();

    return values;
  }, [data]);

  // Count auto-filled variables
  const autoFilledCount = Object.keys(autoFilledVariables).length;

  return {
    autoFilledVariables,
    autoFilledCount,
    rawData: data,
    isLoading,
    error,
  };
}
