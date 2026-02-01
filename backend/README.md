# LexDoc Backend API

API Backend pour la gestion électronique de documents (GED) destinée aux cabinets d'avocats.

## Technologies

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma avec PostgreSQL
- **Authentication**: JWT + 2FA (TOTP)
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI
- **Tests**: Jest + Supertest

## Architecture

```
src/
├── config/           # Configuration (database, minio, env)
├── middlewares/      # Express middlewares (auth, validation, rate-limit)
├── modules/          # Feature modules
│   ├── auth/         # Authentication (login, register, 2FA)
│   ├── cabinets/     # Cabinet management
│   ├── users/        # User management
│   └── health/       # Health checks
├── types/            # TypeScript types
├── utils/            # Utilities (logger, crypto, jwt, errors)
├── app.ts            # Express app configuration
└── server.ts         # Server bootstrap
```

## Démarrage rapide

### Prérequis

- Node.js 20+
- PostgreSQL 15+
- MinIO (optionnel en développement)

### Installation

```bash
# Cloner et installer les dépendances
cd backend
npm install

# Copier et configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Générer le client Prisma
npm run prisma:generate

# Appliquer les migrations
npm run prisma:migrate

# (Optionnel) Initialiser les données de demo
npm run prisma:seed
```

### Développement

```bash
# Démarrer en mode développement (hot reload)
npm run dev

# L'API est disponible sur http://localhost:3000
# Documentation Swagger: http://localhost:3000/api/docs
```

### Production

```bash
# Build TypeScript
npm run build

# Démarrer en production
npm start
```

## Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarre en mode développement avec hot-reload |
| `npm run build` | Compile TypeScript vers JavaScript |
| `npm start` | Démarre l'application compilée |
| `npm test` | Lance les tests |
| `npm run test:watch` | Tests en mode watch |
| `npm run test:coverage` | Tests avec rapport de couverture |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm run lint:fix` | Corrige automatiquement les erreurs ESLint |
| `npm run format` | Formate le code avec Prettier |
| `npm run prisma:generate` | Génère le client Prisma |
| `npm run prisma:migrate` | Applique les migrations en production |
| `npm run prisma:migrate:dev` | Crée et applique les migrations en dev |
| `npm run prisma:seed` | Initialise les données de démo |
| `npm run prisma:studio` | Ouvre Prisma Studio |

## API Endpoints

### Authentication (`/api/auth`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/register` | Inscription cabinet + admin |
| POST | `/login` | Connexion utilisateur |
| POST | `/refresh` | Rafraîchir les tokens |
| POST | `/logout` | Déconnexion |
| POST | `/2fa/setup` | Configuration 2FA |
| POST | `/2fa/enable` | Activer 2FA |
| POST | `/2fa/disable` | Désactiver 2FA |

### Cabinets (`/api/cabinets`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/current` | Obtenir le cabinet courant |
| PATCH | `/current` | Mettre à jour le cabinet (Admin) |
| GET | `/current/stats` | Statistiques du cabinet (Admin/Avocat) |

### Users (`/api/users`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/me` | Profil utilisateur courant |
| PATCH | `/me` | Mettre à jour son profil |
| PATCH | `/me/password` | Changer son mot de passe |
| GET | `/` | Liste des utilisateurs (Admin/Avocat) |
| POST | `/` | Créer un utilisateur (Admin) |
| GET | `/:id` | Obtenir un utilisateur (Admin/Avocat) |
| PATCH | `/:id` | Mettre à jour un utilisateur (Admin) |
| PATCH | `/:id/role` | Modifier le rôle (Admin) |
| PATCH | `/:id/status` | Modifier le statut (Admin) |
| DELETE | `/:id` | Supprimer un utilisateur (Admin) |

### Health (`/api/health`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Status général |
| GET | `/db` | Status base de données |
| GET | `/minio` | Status MinIO |

## Sécurité

### Multi-tenant avec RLS

L'application utilise Row Level Security (RLS) au niveau PostgreSQL pour garantir l'isolation des données entre cabinets :

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY cabinet_isolation_users ON users
  FOR ALL
  USING (cabinet_id = current_setting('app.current_cabinet_id', true));
```

### Authentification JWT

- Access Token: 15 minutes (configurable)
- Refresh Token: 7 jours (configurable)
- Tokens signés avec HS256

### 2FA (Two-Factor Authentication)

Support TOTP compatible avec:
- Google Authenticator
- Microsoft Authenticator
- Authy
- Tout client TOTP standard

### Chiffrement

- Mots de passe: bcrypt (12 rounds)
- Données sensibles: AES-256-GCM
- Secrets 2FA: chiffrés en base

## Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NODE_ENV` | Environnement (development/production/test) | development |
| `PORT` | Port du serveur | 3000 |
| `DATABASE_URL` | URL de connexion PostgreSQL | - |
| `JWT_SECRET` | Clé secrète pour JWT (min 32 chars) | - |
| `JWT_ACCESS_EXPIRES_IN` | Durée access token | 15m |
| `JWT_REFRESH_EXPIRES_IN` | Durée refresh token | 7d |
| `ENCRYPTION_KEY` | Clé de chiffrement AES (32 chars) | - |
| `CORS_ORIGINS` | Origines autorisées (comma-separated) | - |
| `MINIO_*` | Configuration MinIO | - |

## Tests

```bash
# Lancer tous les tests
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

### Structure des tests

```
tests/
├── setup.ts              # Configuration Jest globale
├── helpers.ts            # Helpers pour les tests
└── integration/          # Tests d'intégration
    ├── auth.test.ts
    ├── cabinets.test.ts
    └── users.test.ts
```

## Docker

### Build

```bash
docker build -t lexdoc-backend .
```

### Run

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  lexdoc-backend
```

## Licence

Propriétaire - Tous droits réservés
