# Instruction #3 - Profil Légal Avocat

## Objectif
Permettre aux avocats de saisir et gérer leurs informations professionnelles légales pour la génération automatique de documents.

## Modèle de Données

### AvocatLegalInfo
```prisma
model AvocatLegalInfo {
  id                    String   @id
  userId                String   @unique
  cabinetId             String
  civilite              Civilite
  nom                   String
  prenom                String
  barreau               String   // Ex: "Barreau du Mans"
  numeroToque           String?
  adresseCabinet        String
  codePostal            String
  ville                 String
  telephone             String
  fax                   String?
  email                 String
  siteWeb               String?
  mentionsLegalesDefaut Json
  signatureImage        String?  // Path vers image
  cachetCabinet         String?  // Path vers logo
}
```

## Fonctionnalités

### Informations Requises
- Civilité (Maître, Monsieur, Madame)
- Nom et prénom
- Barreau d'inscription
- Numéro de toque
- Adresse complète du cabinet
- Coordonnées (téléphone, fax, email)
- Site web (optionnel)

### Éléments Visuels
- Upload de la signature scannée
- Upload du cachet/logo du cabinet
- Prévisualisation dans les documents

### Mentions Légales par Défaut
Configuration des mentions légales types:
- Honoraires
- Secret professionnel
- Assurance RCP
- Médiation

## API Endpoints

- `GET /api/users/:id/legal-info` - Récupérer les infos légales
- `PUT /api/users/:id/legal-info` - Mettre à jour les infos
- `POST /api/users/:id/legal-info/signature` - Upload signature
- `POST /api/users/:id/legal-info/cachet` - Upload cachet

## Composants Frontend

- `AvocatLegalInfoPage` - Page de gestion du profil légal
- Formulaire avec validation
- Upload d'images avec prévisualisation
- Intégration dans la génération de documents

## Variables Disponibles

Dans les templates, les variables suivantes sont auto-remplies:
- `{{avocat.civilite}}`
- `{{avocat.nom}}`
- `{{avocat.prenom}}`
- `{{avocat.barreau}}`
- `{{avocat.numeroToque}}`
- `{{avocat.adresse}}`
- `{{avocat.telephone}}`
- `{{avocat.email}}`

## Statut
✅ Complété
