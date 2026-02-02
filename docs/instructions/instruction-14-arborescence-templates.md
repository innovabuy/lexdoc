# Instruction #14 - Arborescence des Templates

## Objectif
Organiser les templates de documents dans une arborescence hiérarchique par catégorie et sous-catégorie.

## Structure des Catégories

### Procédures
```
PROCEDURE_CIVILE/
├── Assignations
├── Conclusions
├── Requêtes
└── Référés

PROCEDURE_COMMERCIALE/
├── Assignations TC
├── Déclarations de créance
└── Requêtes

PROCEDURE_PRUDHOMALE/
├── Saisine CPH
├── Conclusions
└── Demandes reconventionnelles

PROCEDURE_ADMINISTRATIVE/
├── Requêtes TA
├── Mémoires
└── QPC
```

### Contrats
```
CONTRATS_AFFAIRES/
├── Cessions
├── Prestations de services
├── Partenariats
└── NDA

CONTRATS_TRAVAIL/
├── CDI
├── CDD
├── Ruptures conventionnelles
└── Transactions

DROIT_SOCIETES/
├── Statuts
├── PV Assemblées
├── Pactes d'associés
└── Délégations
```

### Correspondance
```
COURRIERS_CLIENTS/
├── Compte-rendus
├── Notes d'honoraires
└── Informations

COURRIERS_ADVERSAIRES/
├── Mises en demeure
├── Propositions
└── Réponses

COURRIERS_JURIDICTIONS/
├── Demandes de renvoi
├── Communications de pièces
└── Observations
```

## Modèle de Données

```prisma
model BuilderTemplate {
  // ... champs existants
  category          BuilderTemplateCategory
  subcategory       String?
  icon              String?    // Nom icône heroicons
  color             String?    // Couleur hex
  tags              String[]
  isFavorite        Boolean
  lastUsedAt        DateTime?
  basedOnTemplateId String?    // Template parent
}
```

## Interface Utilisateur

### Vue Arborescence
- Navigation par catégories
- Expansion/collapse
- Compteur de templates
- Icônes par catégorie

### Recherche
- Recherche full-text
- Filtres par catégorie
- Tags
- Favoris uniquement

### Actions Rapides
- Marquer en favori
- Dupliquer template
- Créer variante
- Exporter/Importer

## Composants

- `TemplatesTree.tsx` - Arborescence principale
- `CategoryNode.tsx` - Noeud de catégorie
- `TemplateCard.tsx` - Carte de template
- `TemplateSearch.tsx` - Barre de recherche

## Fonctionnalités

### Favoris
- Marquage rapide (étoile)
- Section favoris en haut
- Accès rapide

### Templates Récents
- 10 derniers utilisés
- Accès direct
- Fréquence d'utilisation

### Templates Système
- Non modifiables
- Base pour variantes
- Mises à jour automatiques

## Statut
✅ Complété
