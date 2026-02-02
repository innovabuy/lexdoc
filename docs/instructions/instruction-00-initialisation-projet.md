# Instruction #0 - Initialisation du Projet LexDoc

## Objectif
Initialiser le projet LexDoc avec une architecture complète pour une application de gestion documentaire destinée aux cabinets d'avocats.

## Structure du Projet

```
/opt/lexdoc/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── modules/        # Modules fonctionnels
│   │   ├── middlewares/    # Middlewares Express
│   │   ├── services/       # Services partagés
│   │   ├── utils/          # Utilitaires
│   │   └── server.ts       # Point d'entrée
│   ├── prisma/             # Schéma et migrations
│   └── tests/              # Tests unitaires et E2E
├── frontend/               # Application React (Avocat)
│   ├── src/
│   │   ├── pages/         # Pages de l'application
│   │   ├── components/    # Composants réutilisables
│   │   ├── lib/           # Utilitaires et API
│   │   └── store/         # État global (Zustand)
│   └── public/            # Assets statiques
├── frontend-client/        # PWA Extranet Client
│   ├── src/
│   │   ├── pages/         # Pages client
│   │   ├── components/    # Composants client
│   │   └── services/      # Services API
│   └── public/            # Assets et PWA
├── docker-compose.yml      # Services Docker
└── .env.example           # Variables d'environnement
```

## Technologies

### Backend
- Node.js 20+
- Express.js
- Prisma ORM
- PostgreSQL
- MinIO (S3-compatible)
- Redis (cache)

### Frontend
- React 18
- TypeScript
- TailwindCSS
- React Query
- Zustand
- Vite

## Modèles de Base

### Cabinet
- Informations du cabinet d'avocats
- Limites de stockage et utilisateurs
- Statut (trial, active, suspended)

### User
- Utilisateurs du cabinet
- Rôles: ADMIN, AVOCAT, COLLABORATEUR, SECRETAIRE
- Authentification 2FA

### Client
- Clients du cabinet (particuliers, entreprises)
- Informations de contact

### Folder
- Dossiers/Affaires
- Hiérarchie parent/enfant
- Types de dossiers (cession, contentieux, etc.)

### Document
- Documents uploadés
- Versioning
- Chiffrement

## Installation

```bash
# Cloner le projet
cd /opt/lexdoc

# Installer les dépendances
cd backend && npm install
cd ../frontend && npm install
cd ../frontend-client && npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Démarrer les services Docker
docker-compose up -d

# Migrer la base de données
cd backend && npm run prisma:migrate

# Démarrer en développement
npm run dev
```

## Statut
✅ Complété
