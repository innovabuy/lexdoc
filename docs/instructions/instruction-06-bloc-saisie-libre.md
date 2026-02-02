# Instruction #6 - Bloc de Saisie Libre

## Objectif
Permettre la création de notes et blocs de contenu libres associés à un dossier spécifique, convertibles en blocs réutilisables.

## Fonctionnalités

### Notes Libres par Dossier
- Création de notes textuelles liées à un dossier
- Éditeur riche (formatage, listes, tableaux)
- Historique des modifications
- Tags pour organisation

### Conversion en Bloc Réutilisable
Une note libre peut être convertie en bloc standard:
1. Sélectionner la note à convertir
2. Choisir la catégorie cible
3. Identifier les variables à paramétrer
4. Enregistrer comme nouveau bloc

## Modèle de Données

```prisma
model DocumentBlock {
  // ... champs existants
  folderId    String?  // Lien vers dossier pour notes libres
  metadata    Json?    // {folderId, linkedCategory, convertedFrom}
}
```

Catégorie spéciale: `NOTE_LIBRE`

## API Endpoints

- `GET /api/folders/:id/notes` - Notes d'un dossier
- `POST /api/folders/:id/notes` - Créer une note
- `PUT /api/document-blocks/:id` - Modifier une note
- `POST /api/document-blocks/:id/convert` - Convertir en bloc

## Interface Utilisateur

### Panneau Notes dans le Dossier
- Liste des notes existantes
- Création rapide
- Recherche dans les notes
- Tri par date/titre

### Éditeur de Note
- Barre d'outils formatage
- Sauvegarde automatique
- Prévisualisation
- Option de conversion

### Wizard de Conversion
1. Étape 1: Sélection de la catégorie
2. Étape 2: Identification des variables
3. Étape 3: Nommage et tags
4. Étape 4: Confirmation

## Cas d'Usage

1. **Pendant une audience**: Prise de notes rapide
2. **Recherche juridique**: Notes de doctrine
3. **Stratégie**: Notes internes sur le dossier
4. **Réutilisation**: Conversion d'une argumentation efficace en bloc

## Statut
✅ Complété
