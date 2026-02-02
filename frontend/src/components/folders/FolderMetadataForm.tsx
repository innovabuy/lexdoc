import React, { ChangeEvent } from 'react';
import Input from '@/components/ui/Input';
import type { FolderType } from '@/lib/types/folder';

interface FolderMetadataFormProps {
  folderType: FolderType;
  metadata: Record<string, any>;
  onChange: (metadata: Record<string, any>) => void;
}

export const FolderMetadataForm: React.FC<FolderMetadataFormProps> = ({
  folderType,
  metadata,
  onChange,
}) => {
  const handleChange = (field: string, value: any) => {
    onChange({ ...metadata, [field]: value });
  };

  const handleNestedChange = (prefix: string, field: string, value: any) => {
    onChange({
      ...metadata,
      [`${prefix}_${field}`]: value,
    });
  };

  switch (folderType) {
    case 'CESSION_ENTREPRISE':
      return <CessionMetadataForm metadata={metadata} onChange={handleChange} onNestedChange={handleNestedChange} />;
    case 'CONTENTIEUX_CIVIL':
    case 'CONTENTIEUX_COMMERCIAL':
    case 'CONTENTIEUX_PRUDHOMMES':
      return <ContentieuxMetadataForm metadata={metadata} onChange={handleChange} onNestedChange={handleNestedChange} />;
    case 'IMMOBILIER_LOCATIF':
    case 'IMMOBILIER_VENTE':
      return <ImmobilierMetadataForm metadata={metadata} onChange={handleChange} onNestedChange={handleNestedChange} />;
    case 'AFFAIRE_GENERALE':
    case 'DROIT_FAMILLE':
    case 'DROIT_SOCIETES':
      return <AffaireMetadataForm metadata={metadata} onChange={handleChange} onNestedChange={handleNestedChange} />;
    default:
      return null;
  }
};

// ============================================
// CESSION ENTREPRISE METADATA FORM
// ============================================
interface MetadataFormProps {
  metadata: Record<string, any>;
  onChange: (field: string, value: any) => void;
  onNestedChange: (prefix: string, field: string, value: any) => void;
}

const CessionMetadataForm: React.FC<MetadataFormProps> = ({ metadata, onChange, onNestedChange }) => {
  return (
    <div className="space-y-6">
      {/* Societe Cible */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Societe cible</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Denomination"
            value={metadata.societeCible_denomination || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('societeCible', 'denomination', e.target.value)}
          />
          <Input
            label="Forme juridique"
            value={metadata.societeCible_formeJuridique || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('societeCible', 'formeJuridique', e.target.value)}
          />
          <Input
            label="SIRET"
            value={metadata.societeCible_siret || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('societeCible', 'siret', e.target.value)}
          />
          <Input
            label="RCS"
            value={metadata.societeCible_rcs || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('societeCible', 'rcs', e.target.value)}
          />
          <Input
            label="Capital (EUR)"
            type="number"
            value={metadata.societeCible_capital || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('societeCible', 'capital', e.target.value ? parseFloat(e.target.value) : null)}
          />
        </div>
      </fieldset>

      {/* Cedant */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Cedant</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nom"
            value={metadata.cedant_nom || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('cedant', 'nom', e.target.value)}
          />
          <Input
            label="Nombre de parts"
            type="number"
            value={metadata.cedant_nombreParts || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('cedant', 'nombreParts', e.target.value ? parseInt(e.target.value) : null)}
          />
          <Input
            label="Pourcentage capital (%)"
            type="number"
            value={metadata.cedant_pourcentageCapital || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('cedant', 'pourcentageCapital', e.target.value ? parseFloat(e.target.value) : null)}
          />
        </div>
      </fieldset>

      {/* Acquereur */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Acquereur</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Denomination"
            value={metadata.acquereur_denomination || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('acquereur', 'denomination', e.target.value)}
          />
          <Input
            label="SIRET"
            value={metadata.acquereur_siret || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('acquereur', 'siret', e.target.value)}
          />
          <Input
            label="Representant"
            value={metadata.acquereur_representant || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('acquereur', 'representant', e.target.value)}
          />
        </div>
      </fieldset>

      {/* Transaction */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Transaction</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Prix estime (EUR)"
            type="number"
            value={metadata.prixEstime || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('prixEstime', e.target.value ? parseFloat(e.target.value) : null)}
          />
          <Input
            label="Prix final (EUR)"
            type="number"
            value={metadata.prixFinal || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('prixFinal', e.target.value ? parseFloat(e.target.value) : null)}
          />
          <Input
            label="Date LOI"
            type="date"
            value={metadata.dateLOI || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('dateLOI', e.target.value)}
          />
          <Input
            label="Date signature protocole"
            type="date"
            value={metadata.dateSignatureProtocole || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('dateSignatureProtocole', e.target.value)}
          />
          <Input
            label="Date cession"
            type="date"
            value={metadata.dateCession || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('dateCession', e.target.value)}
          />
        </div>
      </fieldset>

      {/* Garantie d'actif et passif */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Garantie d'actif et passif (GAP)</legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Plafond (EUR)"
            type="number"
            value={metadata.gap_plafond || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('gap', 'plafond', e.target.value ? parseFloat(e.target.value) : null)}
          />
          <Input
            label="Franchise (EUR)"
            type="number"
            value={metadata.gap_franchise || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('gap', 'franchise', e.target.value ? parseFloat(e.target.value) : null)}
          />
          <Input
            label="Duree (ans)"
            type="number"
            value={metadata.gap_dureeAns || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('gap', 'dureeAns', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
      </fieldset>

      {/* Earn-out */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Earn-out (complement de prix)</legend>
        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Montant (EUR)"
            type="number"
            value={metadata.earnout_montant || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('earnout', 'montant', e.target.value ? parseFloat(e.target.value) : null)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conditions</label>
            <textarea
              value={metadata.earnout_conditions || ''}
              onChange={(e) => onNestedChange('earnout', 'conditions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
              placeholder="Conditions de declenchement de l'earn-out..."
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
};

// ============================================
// CONTENTIEUX METADATA FORM
// ============================================
const ContentieuxMetadataForm: React.FC<MetadataFormProps> = ({ metadata, onChange, onNestedChange }) => {
  return (
    <div className="space-y-6">
      {/* Affaire */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Affaire</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Intitule"
            value={metadata.intitule || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('intitule', e.target.value)}
          />
          <Input
            label="Numero RG"
            value={metadata.numeroRG || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('numeroRG', e.target.value)}
          />
          <Input
            label="Juridiction"
            value={metadata.juridiction || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('juridiction', e.target.value)}
          />
          <Input
            label="Chambre"
            value={metadata.chambre || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('chambre', e.target.value)}
          />
          <Input
            label="Type de contentieux"
            value={metadata.typeContentieux || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('typeContentieux', e.target.value)}
          />
        </div>
      </fieldset>

      {/* Demandeur */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Demandeur</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nom"
            value={metadata.demandeur_nom || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('demandeur', 'nom', e.target.value)}
          />
          <Input
            label="Qualite"
            value={metadata.demandeur_qualite || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('demandeur', 'qualite', e.target.value)}
          />
        </div>
      </fieldset>

      {/* Defendeur */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Defendeur</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nom"
            value={metadata.defendeur_nom || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('defendeur', 'nom', e.target.value)}
          />
          <Input
            label="Adresse"
            value={metadata.defendeur_adresse || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('defendeur', 'adresse', e.target.value)}
          />
          <Input
            label="Avocat"
            value={metadata.defendeur_avocat || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('defendeur', 'avocat', e.target.value)}
          />
        </div>
      </fieldset>

      {/* Montants */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Montants</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Montant demande (EUR)"
            type="number"
            value={metadata.montantDemande || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('montantDemande', e.target.value ? parseFloat(e.target.value) : null)}
          />
          <Input
            label="Montant obtenu (EUR)"
            type="number"
            value={metadata.montantObtenu || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('montantObtenu', e.target.value ? parseFloat(e.target.value) : null)}
          />
          <Input
            label="Montant provision (EUR)"
            type="number"
            value={metadata.montantProvision || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('montantProvision', e.target.value ? parseFloat(e.target.value) : null)}
          />
        </div>
      </fieldset>

      {/* Dates */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Dates cles</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Date assignation"
            type="date"
            value={metadata.dateAssignation || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('dateAssignation', e.target.value)}
          />
          <Input
            label="Date mise en etat"
            type="date"
            value={metadata.dateMiseEnEtat || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('dateMiseEnEtat', e.target.value)}
          />
          <Input
            label="Date cloture"
            type="date"
            value={metadata.dateCloture || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('dateCloture', e.target.value)}
          />
          <Input
            label="Date audience"
            type="date"
            value={metadata.dateAudience || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('dateAudience', e.target.value)}
          />
          <Input
            label="Date jugement"
            type="date"
            value={metadata.dateJugement || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('dateJugement', e.target.value)}
          />
        </div>
      </fieldset>
    </div>
  );
};

// ============================================
// IMMOBILIER METADATA FORM
// ============================================
const ImmobilierMetadataForm: React.FC<MetadataFormProps> = ({ metadata, onChange, onNestedChange }) => {
  return (
    <div className="space-y-6">
      {/* Bien */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Bien immobilier</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Adresse du bien"
              value={metadata.adresseBien || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('adresseBien', e.target.value)}
            />
          </div>
          <Input
            label="Type de bien"
            value={metadata.typeBien || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('typeBien', e.target.value)}
            placeholder="Ex: Appartement, Local commercial..."
          />
          <Input
            label="Surface (m2)"
            type="number"
            value={metadata.surfaceM2 || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('surfaceM2', e.target.value ? parseFloat(e.target.value) : null)}
          />
        </div>
      </fieldset>

      {/* Bail */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Bail</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Type de bail"
            value={metadata.typeBail || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('typeBail', e.target.value)}
            placeholder="Ex: Bail commercial, Bail d'habitation..."
          />
          <Input
            label="Loyer mensuel (EUR)"
            type="number"
            value={metadata.montantLoyer || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('montantLoyer', e.target.value ? parseFloat(e.target.value) : null)}
          />
          <Input
            label="Date debut bail"
            type="date"
            value={metadata.dateDebutBail || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('dateDebutBail', e.target.value)}
          />
          <Input
            label="Date fin bail"
            type="date"
            value={metadata.dateFinBail || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('dateFinBail', e.target.value)}
          />
        </div>
      </fieldset>

      {/* Locataire */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Locataire</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nom"
            value={metadata.locataire_nom || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('locataire', 'nom', e.target.value)}
          />
          <Input
            label="Adresse"
            value={metadata.locataire_adresse || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('locataire', 'adresse', e.target.value)}
          />
        </div>
      </fieldset>

      {/* Bailleur */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Bailleur</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nom"
            value={metadata.bailleur_nom || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('bailleur', 'nom', e.target.value)}
          />
          <Input
            label="Adresse"
            value={metadata.bailleur_adresse || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNestedChange('bailleur', 'adresse', e.target.value)}
          />
        </div>
      </fieldset>

      {/* Contentieux immobilier */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Contentieux (si applicable)</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Arrieres de loyers (EUR)"
            type="number"
            value={metadata.arriereLoyers || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('arriereLoyers', e.target.value ? parseFloat(e.target.value) : null)}
          />
          <Input
            label="Montant degats (EUR)"
            type="number"
            value={metadata.montantDegats || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('montantDegats', e.target.value ? parseFloat(e.target.value) : null)}
          />
        </div>
      </fieldset>
    </div>
  );
};

// ============================================
// AFFAIRE GENERALE METADATA FORM
// ============================================
const AffaireMetadataForm: React.FC<MetadataFormProps> = ({ metadata, onChange }) => {
  return (
    <div className="space-y-6">
      {/* Affaire */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Affaire</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Intitule"
            value={metadata.intitule || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('intitule', e.target.value)}
          />
          <Input
            label="Numero RG"
            value={metadata.numeroRG || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('numeroRG', e.target.value)}
          />
          <Input
            label="Juridiction"
            value={metadata.juridiction || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('juridiction', e.target.value)}
          />
          <Input
            label="Type d'affaire"
            value={metadata.typeAffaire || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('typeAffaire', e.target.value)}
          />
        </div>
      </fieldset>

      {/* Dates */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Dates</legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Date ouverture"
            type="date"
            value={metadata.dateOuverture || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('dateOuverture', e.target.value)}
          />
          <Input
            label="Date audience"
            type="date"
            value={metadata.dateAudience || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('dateAudience', e.target.value)}
          />
          <Input
            label="Date cloture"
            type="date"
            value={metadata.dateCloture || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('dateCloture', e.target.value)}
          />
        </div>
      </fieldset>

      {/* Montants */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Montants</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Montant litige (EUR)"
            type="number"
            value={metadata.montantLitige || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('montantLitige', e.target.value ? parseFloat(e.target.value) : null)}
          />
          <Input
            label="Montant provision (EUR)"
            type="number"
            value={metadata.montantProvision || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('montantProvision', e.target.value ? parseFloat(e.target.value) : null)}
          />
        </div>
      </fieldset>

      {/* Partie adverse */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Partie adverse</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nom"
            value={metadata.partieAdverse?.nom || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('partieAdverse', {
              ...metadata.partieAdverse,
              nom: e.target.value,
            })}
          />
          <Input
            label="Adresse"
            value={metadata.partieAdverse?.adresse || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('partieAdverse', {
              ...metadata.partieAdverse,
              adresse: e.target.value,
            })}
          />
          <Input
            label="Representant"
            value={metadata.partieAdverse?.representant || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('partieAdverse', {
              ...metadata.partieAdverse,
              representant: e.target.value,
            })}
          />
        </div>
      </fieldset>
    </div>
  );
};

export default FolderMetadataForm;
