# Instruction #11 - Wizards et Onboarding

## Objectif
Implémenter des assistants guidés (wizards) pour accompagner les utilisateurs dans les tâches complexes et l'onboarding initial.

## Types de Wizards

### Onboarding Nouvel Utilisateur
Étapes:
1. Bienvenue et présentation
2. Configuration du profil
3. Informations légales avocat
4. Paramètres du cabinet
5. Import des premiers documents
6. Création du premier dossier

### Création de Dossier
Étapes:
1. Type de dossier
2. Informations client
3. Métadonnées spécifiques
4. Documents initiaux
5. Paramètres de partage
6. Confirmation

### Génération de Document
Étapes:
1. Sélection du template
2. Choix du dossier
3. Remplissage des variables
4. Prévisualisation
5. Options de sortie (PDF/DOCX)
6. Actions post-génération

### Création de Client
Étapes:
1. Type (particulier/entreprise)
2. Informations de base
3. Coordonnées
4. Consentement RGPD
5. Association dossier
6. Invitation extranet

## Modèle de Données

```prisma
model WizardProgress {
  id          String
  userId      String
  wizardType  WizardType
  currentStep Int
  totalSteps  Int
  data        Json        // Données collectées
  completed   Boolean
  completedAt DateTime?
  abandonedAt DateTime?
}

enum WizardType {
  ONBOARDING
  FOLDER_CREATION
  DOCUMENT_GENERATION
  CLIENT_CREATION
}
```

## Composants Frontend

### WizardContainer
- Gestion des étapes
- Navigation (suivant/précédent)
- Sauvegarde automatique
- Indicateur de progression

### WizardStep
- Contenu de l'étape
- Validation avant passage
- Animation de transition

### WizardSidebar
- Résumé des étapes
- Accès direct aux étapes
- État de complétion

## Fonctionnalités

### Sauvegarde Automatique
- Progression sauvée à chaque étape
- Reprise possible après interruption
- Données conservées 7 jours

### Skip et Rappel
- Possibilité de passer certaines étapes
- Rappel pour compléter plus tard
- Notification de wizards incomplets

### Personnalisation
- Étapes conditionnelles selon le rôle
- Contenu adapté au contexte
- Option "Ne plus afficher"

## Statut
✅ Complété
