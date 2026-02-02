# Instruction #7 - Métadonnées et Auto-fill

## Objectif
Implémenter le système de métadonnées structurées par type de dossier avec remplissage automatique des variables dans les documents.

## Métadonnées par Type de Dossier

### CESSION_ENTREPRISE
```typescript
interface MetadataCession {
  cedant: {
    type: 'particulier' | 'societe';
    nom: string;
    prenom?: string;
    denomination?: string;
    siret?: string;
    adresse: string;
  };
  cessionnaire: {
    type: 'particulier' | 'societe';
    nom: string;
    // ...
  };
  societe: {
    denomination: string;
    formeJuridique: string;
    siret: string;
    capital: number;
    siege: string;
  };
  cession: {
    typeActe: 'parts' | 'actions' | 'fonds';
    prix: number;
    modalitesPaiement: string;
    dateSignature?: Date;
    dateRealisation?: Date;
    conditionsSuspensives: string[];
  };
  garantie?: {
    plafond: number;
    seuil: number;
    duree: string;
  };
}
```

### CONTENTIEUX_CIVIL
```typescript
interface MetadataContentieux {
  parties: {
    demandeur: Partie;
    defendeur: Partie;
  };
  juridiction: {
    type: string;
    ville: string;
    chambre?: string;
  };
  procedure: {
    numeroRG?: string;
    dateAssignation?: Date;
    prochaineDateAudience?: Date;
  };
  enjeu: {
    montant?: number;
    nature: string;
  };
}
```

## Système Auto-fill

### Fonctionnement
1. L'utilisateur sélectionne un template
2. Le système identifie les variables requises
3. Les métadonnées du dossier sont lues
4. Les variables correspondantes sont pré-remplies
5. L'utilisateur complète les champs manquants

### Mapping Variables → Métadonnées
```typescript
const variableMapping = {
  '{{cedant.nom}}': 'metadata.cedant.nom',
  '{{prix}}': 'metadata.cession.prix',
  '{{societe.denomination}}': 'metadata.societe.denomination',
  // ...
};
```

### Formatage Automatique
- Montants: formatage monétaire (1 000 000 €)
- Dates: format français (1er janvier 2025)
- Adresses: mise en forme multi-lignes

## API

- `GET /api/folders/:id/metadata` - Récupérer les métadonnées
- `PUT /api/folders/:id/metadata` - Mettre à jour
- `GET /api/folders/:id/autofill/:templateId` - Variables pré-remplies

## Interface

### Formulaire Métadonnées
- Formulaire dynamique selon le type de dossier
- Validation des champs obligatoires
- Auto-complétion (SIRET → infos société)

### Prévisualisation Auto-fill
- Affichage des variables remplies
- Indication des champs manquants
- Possibilité d'édition manuelle

## Statut
✅ Complété
