# Instruction #17 - Extranet Client Sécurisé

## Objectif
Implémenter un portail client sécurisé permettant aux clients d'accéder à leurs documents, de signer électroniquement et de consulter l'état de leurs dossiers.

## Fonctionnalités

### Gestion des Accès
- Invitation par email
- Token d'activation temporaire
- Création de mot de passe
- Réinitialisation mot de passe

### Authentification Client
- Login email/mot de passe
- JWT séparé (CLIENT_JWT_SECRET)
- Session 7 jours
- Déconnexion

### Accès aux Documents
- Filtrage par dossiers autorisés
- Consultation en ligne
- Téléchargement (si autorisé)
- Signature électronique

### Indicateurs Visuels
- Statut des documents
- Nombre de relances reçues
- Documents en attente d'action

## Modèle ClientAccess

```prisma
model ClientAccess {
  id                String
  email             String    @unique
  firstName         String?
  lastName          String?
  companyName       String?

  // Auth
  passwordHash      String?
  isActivated       Boolean   @default(false)
  activationToken   String?   @unique
  activationExpires DateTime?
  resetToken        String?   @unique
  resetExpires      DateTime?

  // Liens
  cabinetId         String
  folderId          String?
  clientId          String?

  // Permissions
  allowedFolders    String[]
  permissions       Json      // {canSign, canDownload, canComment}

  // Tracking
  lastLoginAt       DateTime?
  loginCount        Int       @default(0)
}
```

## Modèle ClientAccessLog

```prisma
model ClientAccessLog {
  id              String
  clientAccessId  String
  action          ClientAccessAction
  documentId      String?
  folderId        String?
  ipAddress       String?
  userAgent       String?
  timestamp       DateTime
}

enum ClientAccessAction {
  LOGIN
  LOGOUT
  VIEW_DOCUMENT
  DOWNLOAD_DOCUMENT
  SIGN_DOCUMENT
  VIEW_FOLDER
  PASSWORD_RESET
}
```

## Flux d'Invitation

```
1. Avocat invite client (email)
2. Email avec lien d'activation envoyé
3. Client clique sur le lien
4. Validation du token
5. Création du mot de passe
6. Compte activé
7. Redirection vers dashboard
```

## API Endpoints

### Publics (sans auth)
- `GET /api/extranet/auth/activate/:token` - Valider token
- `POST /api/extranet/auth/activate/:token` - Activer compte
- `POST /api/extranet/auth/login` - Connexion
- `POST /api/extranet/auth/forgot-password` - Mot de passe oublié
- `POST /api/extranet/auth/reset-password/:token` - Reset

### Protégés (auth client)
- `GET /api/extranet/dashboard` - Dashboard
- `GET /api/extranet/documents` - Liste documents
- `GET /api/extranet/documents/:id` - Détail document
- `GET /api/extranet/documents/:id/download` - Télécharger
- `POST /api/extranet/auth/logout` - Déconnexion

## Middleware Client Auth

```typescript
// Vérifie le JWT client
// Charge les permissions
// Attache clientAccess à req
```

## Pages Frontend Client

- `LoginPage` - Connexion
- `ActivationPage` - Activation compte
- `ForgotPasswordPage` - Mot de passe oublié
- `ResetPasswordPage` - Nouveau mot de passe
- `DashboardPage` - Tableau de bord
- `DocumentsPage` - Liste documents

## Sécurité

- Tokens à durée limitée
- Rate limiting sur login
- Logs d'audit complets
- Permissions granulaires
- Isolation par cabinet

## Statut
✅ Complété
