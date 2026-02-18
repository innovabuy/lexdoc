# DIAGNOSTIC_REPORT.md — LexDoc (lexdoc-dev)

**Date**: 2026-02-06
**Chemin**: `/home/lexdoc-dev/`
**Branche Git**: HEAD (pas de branche nommee)
**Dernier commit**: `e7d9180` — fix: add safe data unwrapping to Breadcrumb component

---

## 1. STRUCTURE DU PROJET

```
/home/lexdoc-dev/
├── backend/                    # Express + Prisma (JavaScript)
│   ├── src/
│   │   ├── config/             # Constants, environment
│   │   ├── controllers/        # 12 controllers (3,234 lignes)
│   │   ├── jobs/               # Cron jobs (reminders)
│   │   ├── middleware/         # auth, tenant, rateLimiter, errorHandler
│   │   ├── routes/             # 26 fichiers routes (~6,050 lignes)
│   │   ├── services/           # 10 services (2,444 lignes)
│   │   ├── templates/          # Email templates Handlebars
│   │   └── utils/              # Helpers, errors
│   ├── prisma/
│   │   ├── schema.prisma       # 1,339 lignes, 30+ modeles
│   │   └── migrations/         # 7 migrations (up to date)
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── e2e/
│   │   └── fixtures/
│   ├── logs/
│   ├── package.json
│   └── .env
├── frontend/                   # Admin portal (React + Vite)
│   ├── src/
│   │   ├── pages/              # 21 pages (~10,212 lignes)
│   │   ├── components/         # 15 composants (~4,579 lignes)
│   │   ├── contexts/           # AuthContext, ThemeContext, ToastContext
│   │   ├── hooks/              # usePWA
│   │   ├── services/           # api.js (axios)
│   │   ├── assets/
│   │   └── test/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .env
├── frontend-client/            # Extranet client (React + Vite)
│   ├── src/
│   │   ├── pages/              # 8 pages
│   │   ├── components/         # Layout, InstallPrompt
│   │   ├── contexts/           # AuthContext, ToastContext
│   │   └── services/           # pushNotifications, serviceWorker
│   ├── public/
│   └── package.json
├── data/                       # Docker volumes
│   ├── postgres/
│   ├── minio/
│   └── uploads/
├── backups/                    # Backup storage
├── scripts/                    # Utility scripts
├── docs/                       # Documentation
├── docker-compose.dev.yml      # Infrastructure Docker
└── VALIDATION-CHECKLIST.md
```

---

## 2. DEPENDANCES

### Backend (`backend/package.json`)

| Package | Version | Role |
|---------|---------|------|
| express | 4.18.x | Framework HTTP |
| prisma | 5.8.x | ORM + migrations |
| @prisma/client | 5.8.x | Client Prisma |
| bcrypt | 5.x | Hachage mots de passe |
| jsonwebtoken | 9.x | JWT auth |
| zod | 3.x | Validation schemas |
| minio | 8.x | Client S3 MinIO |
| multer | 1.x | Upload fichiers |
| pdfkit | 0.15.x | Generation PDF |
| nodemailer | 6.x | Envoi emails |
| handlebars | 4.x | Templates email |
| web-push | 3.x | Push notifications |
| winston | 3.x | Logging structure |
| express-rate-limit | 7.x | Rate limiting |
| @sentry/node | 8.x | Error monitoring |
| node-cron | 3.x | Scheduled jobs |
| cors | 2.x | CORS middleware |
| helmet | 8.x | Security headers |
| morgan | 1.x | HTTP request logging |

**Dev deps**: jest, supertest, @faker-js/faker, nodemon

### Frontend Admin (`frontend/package.json`)

| Package | Version | Role |
|---------|---------|------|
| react | 19.2.x | UI framework |
| react-dom | 19.2.x | DOM rendering |
| react-router-dom | 6.x | Routing |
| @tanstack/react-query | 5.x | Data fetching/cache |
| axios | 1.x | HTTP client |
| tailwindcss | 3.4.x | CSS utility |
| vite | 7.2.x | Bundler |
| vitest | 4.x | Test framework |

### Frontend Client (`frontend-client/package.json`)

| Package | Version | Role |
|---------|---------|------|
| react | 19.x | UI framework |
| react-router-dom | 6.x | Routing |
| tailwindcss | 3.x | CSS utility |
| vite | 7.x | Bundler |

**Note**: Le portail client utilise `fetch()` natif, pas axios. Pas de react-query.

---

## 3. SCHEMA PRISMA (30+ modeles)

### Modeles principaux

| Modele | Relations cles | Champs notables |
|--------|----------------|-----------------|
| **Tenant** | hasMany: User, Client, Folder, Document | name, slug, plan |
| **AvocatLegalInfo** | belongsTo: Tenant | barreauName, siret, tvaNumber |
| **User** | belongsTo: Tenant | email, role (ADMIN/USER), isActive |
| **Client** | belongsTo: Tenant, Folder | type (INDIVIDUAL/COMPANY/ASSOCIATION), email, siret |
| **ClientConsent** | belongsTo: Client | consentType, consentDate |
| **Folder** | belongsTo: Tenant, Client, Parent | title, reference, status, type, color, parentId |
| **FolderPerson** | belongsTo: Folder | role, type (INDIVIDUAL/COMPANY) |
| **Document** | belongsTo: Folder, Tenant | name, mimeType, size, status, encryptionIV, encryptionTag |
| **DocumentTracking** | belongsTo: Document | signatureStatus, lrarStatus, sentAt, deliveredAt |
| **ReminderLog** | belongsTo: Document | type, level, sentAt |
| **Signature** | belongsTo: Document | signerEmail, status, transactionId, signedAt |
| **SignatureReminder** | belongsTo: Signature | sentAt, reminderType |
| **RegisteredMail** | belongsTo: Document | recipientAddress, sendingBoxId, trackingNumber, status |
| **BuilderBlock** | belongsTo: Tenant | title, content, type, category |
| **BuilderTemplate** | belongsTo: Tenant | title, content, blocks (Json), usageCount |
| **ClientAccess** | belongsTo: Client, Folder | token, expiresAt, isActive |
| **ClientAccessLog** | belongsTo: ClientAccess | action, ipAddress |
| **PushSubscription** | belongsTo: User/Client | endpoint, keys |
| **BackupLog** | belongsTo: Tenant | type, status, filePath, fileSize |
| **TenantSettings** | belongsTo: Tenant | key, value |
| **FolderCategory** | belongsTo: Tenant, Parent | name, color, icon, order |
| **TemplateCategory** | belongsTo: Tenant, Parent | name, order |
| **DocumentRequest** | belongsTo: Folder, Client | title, status, priority, dueDate |
| **AuditLog** | belongsTo: Tenant | action, entityType, entityId, metadata |
| **Notification** | belongsTo: User | type, title, message, isRead |
| **NotificationPreference** | belongsTo: User | emailSignatures, emailDocuments, etc. |
| **EmailLog** | belongsTo: Tenant | to, subject, status, sentAt |
| **Deadline** | belongsTo: Folder, Tenant | title, type, priority, status, dueDate |
| **Conversation** | manyToMany: User via Participant | title, lastMessageAt |
| **ConversationParticipant** | belongsTo: Conversation, User | unreadCount, lastReadAt |
| **Message** | belongsTo: Conversation, User | content, isEdited, isDeleted |

### Enums

| Enum | Valeurs |
|------|---------|
| Role | ADMIN, USER |
| FolderStatus | OPEN, IN_PROGRESS, PENDING, CLOSED, ARCHIVED |
| FolderType | LITIGATION, CONTRACT, BUSINESS, FAMILY, REAL_ESTATE, LABOR, INTELLECTUAL, ADMINISTRATIVE, CRIMINAL, OTHER |
| DocumentStatus | DRAFT, PENDING_SIGNATURE, SIGNED, SENT, ARCHIVED, DELETED |
| SignatureStatus | PENDING, SENT, SIGNED, REFUSED, EXPIRED, CANCELLED |
| RegisteredMailStatus | PREPARING, SENT, IN_TRANSIT, DELIVERED, RETURNED, ERROR |
| ClientType | INDIVIDUAL, COMPANY, ASSOCIATION |
| DeadlineType | DEADLINE, HEARING, MEETING, REMINDER, TASK, OTHER |
| DeadlinePriority | LOW, NORMAL, HIGH, URGENT |
| DeadlineStatus | PENDING, IN_PROGRESS, COMPLETED, CANCELLED, OVERDUE |
| RequestStatus | PENDING, IN_PROGRESS, COMPLETED, CANCELLED, EXPIRED |
| RequestPriority | LOW, NORMAL, HIGH, URGENT |

### Etat des migrations

7 migrations appliquees, toutes up to date. Aucune migration en attente.

---

## 4. INVENTAIRE DES ROUTES API

### Recapitulatif

| Prefixe | Fichier route | Endpoints | Auth | Tenant |
|---------|---------------|-----------|------|--------|
| `/api/health` | health.routes.js | 3 (GET) | Non | Non |
| `/api/auth` | auth.routes.js | 3 (POST/GET) | Partiel | Non |
| `/api/documents` | document.routes.js | 13 | Oui | Oui |
| `/api/clients` | client.routes.js | 5 | Oui | Oui |
| `/api/folders` | folder.routes.js | 9 | Oui | Oui |
| `/api/signatures` | signature.routes.js | 9 | Oui | Oui |
| `/api/lrar` | lrar.routes.js | 7 | Oui | Oui |
| `/api/webhooks` | webhook.routes.js | 4 | Non | Non |
| `/api/legal-info` | legal-info.routes.js | 8 | Oui | Oui |
| `/api/builder` | builder.routes.js | 17 | Oui | Oui |
| `/api/tracking` | tracking.routes.js | 8 | Oui | Oui |
| `/api/client-access` | client-access.routes.js | 7 | Oui | Oui |
| `/api/extranet` | extranet.routes.js | 16 | Client JWT | Oui |
| `/api/backups` | backup.routes.js | 4 | Oui+Admin | Oui |
| `/api/folder-categories` | folder-category.routes.js | 6 | Oui | Oui |
| `/api/template-categories` | template-category.routes.js | 6 | Oui | Oui |
| `/api/document-requests` | document-request.routes.js | 10 | Oui | Oui |
| `/api/notifications` | notification.routes.js | 7 | Oui | Non |
| `/api/export` | export.routes.js | 3 | Oui | Oui |
| `/api/search` | search.routes.js | 2 | Oui | Oui |
| `/api/deadlines` | deadline.routes.js | 9 | Oui | Oui |
| `/api/statistics` | statistics.routes.js | 5 | Oui | Oui |
| `/api/chat` | chat.routes.js | 9 | Oui | Oui |
| `/api/debug` | debug.routes.js | 6 | Non (dev) | Non |
| `/api/` | folder-person.routes.js | 7 | Oui | Oui |

**Total: 26 fichiers routes, ~187 endpoints**

### Middleware appliques

| Middleware | Role | Fichier |
|-----------|------|---------|
| `authenticate` | JWT verification + user injection | auth.js |
| `enforceTenant` | Tenant isolation (req.tenantFilter) | tenant.js |
| `generalLimiter` | Rate limit global | rateLimiter.js |
| `authLimiter` | Rate limit login (5 req/15min) | rateLimiter.js |
| `uploadLimiter` | Rate limit upload (50/h) | rateLimiter.js |
| `errorHandler` | Gestion centralisee erreurs + Sentry | errorHandler.js |
| `notFoundHandler` | 404 handler | errorHandler.js |
| multer | Upload fichiers multipart | document.routes.js |

---

## 5. INVENTAIRE PAGES FRONTEND

### Admin Portal (21 pages)

| Route | Composant | Fichier | Lignes | API consommee |
|-------|-----------|---------|--------|---------------|
| `/` | Dashboard | Dashboard.jsx | 411 | documents, signatures, clients, folders, document-requests |
| `/login` | Login | Login.jsx | 93 | auth/login |
| `/documents` | Documents | Documents.jsx | 630 | documents, folders, breadcrumb |
| `/documents/all` | DocumentsGlobal | DocumentsGlobal.jsx | 607 | documents (global) |
| `/documents/tree` | DocumentsTreePage | DocumentsTreePage.jsx | 287 | documents, folders (tree) |
| `/folders` | Folders | Folders.jsx | 439 | folders, clients |
| `/folders/:id` | FolderDetail | FolderDetail.jsx | 427 | folders/:id, documents |
| `/clients` | Clients | Clients.jsx | 636 | clients |
| `/signatures` | Signatures | Signatures.jsx | 765 | signatures, lrar, documents |
| `/templates` | Templates | Templates.jsx | 1184 | builder/templates, builder/blocks, clients, folders |
| `/templates/tree` | TemplatesTreePage | TemplatesTreePage.jsx | 217 | builder/templates |
| `/tracking` | Tracking | Tracking.jsx | 226 | tracking |
| `/calendar` | Calendar | Calendar.jsx | 470 | deadlines, folders |
| `/statistics` | Statistics | Statistics.jsx | 402 | statistics/* |
| `/chat` | Chat | Chat.jsx | 446 | chat/* |
| `/document-requests` | DocumentRequestsPage | DocumentRequests.jsx | 250 | document-requests |
| `/settings/legal-info` | LegalInfo | LegalInfo.jsx | 520 | legal-info |
| `/settings/client-access` | ClientAccess | ClientAccess.jsx | 302 | client-access |
| `/settings/backups` | Backups | Backups.jsx | 273 | backups |
| `/settings/folder-categories` | FolderCategories | FolderCategories.jsx | 382 | folder-categories |
| `/settings/template-categories` | TemplateCategories | TemplateCategories.jsx | 404 | template-categories |
| `/settings/notifications` | NotificationSettings | NotificationSettings.jsx | 224 | notifications |

### Admin Components (15 composants)

| Composant | Fichier | Lignes | Role |
|-----------|---------|--------|------|
| Layout | Layout.jsx | 250 | Sidebar, header, navigation, mobile bar |
| NotificationCenter | NotificationCenter.jsx | 214 | Bell icon + dropdown notifications |
| GlobalSearch | GlobalSearch.jsx | 261 | Recherche globale header |
| ReminderIndicator | ReminderIndicator.jsx | 208 | Badges rappels deadlines |
| OfflineIndicator | OfflineIndicator.jsx | 18 | Indicateur hors-ligne |
| PWAInstallPrompt | PWAInstallPrompt.jsx | 37 | Prompt installation PWA |
| DocumentUploader | DocumentUploader.jsx | 395 | Modal upload documents |
| DocumentVersions | DocumentVersions.jsx | 430 | Modal versions documents |
| DocumentPreview | DocumentPreview.jsx | 275 | Previsualiseur documents |
| FolderTree | FolderTree.jsx | 277 | Arborescence dossiers |
| Breadcrumb | Breadcrumb.jsx | 45 | Fil d'Ariane dossiers |
| DocumentRequests | DocumentRequests.jsx | 430 | Demandes documents (folder) |
| FolderPersons | FolderPersons.jsx | 463 | Personnes liees au dossier |
| FolderTimeline | FolderTimeline.jsx | 337 | Timeline activite dossier |
| TemplateTreeView | TemplateTreeView.jsx | 262 | Arborescence templates |

### Client Portal (8 pages)

| Route | Composant | Fichier | Lignes | API consommee |
|-------|-----------|---------|--------|---------------|
| `/login` | Login | Login.jsx | 91 | extranet/login |
| `/activate/:token` | Activate | Activate.jsx | 203 | extranet/verify-token, extranet/activate |
| `/` | Dashboard | Dashboard.jsx | 235 | extranet/dashboard |
| `/documents` | Documents | Documents.jsx | 478 | extranet/documents |
| `/documents/:id` | DocumentDetail | DocumentDetail.jsx | 339 | extranet/documents/:id |
| `/requests` | DocumentRequests | DocumentRequests.jsx | 421 | extranet/document-requests |
| `/activity` | Activity | Activity.jsx | 180 | extranet/activity |
| `/settings` | Settings | Settings.jsx | 283 | extranet/change-password |

### Client Components (2 composants)

| Composant | Fichier | Lignes | Role |
|-----------|---------|--------|------|
| Layout | Layout.jsx | 157 | Header, bottom nav, install prompt |
| InstallPrompt | InstallPrompt.jsx | 172 | Prompt installation PWA |

---

## 6. DESCRIPTION DE LA NAVIGATION

### Admin Portal — Sidebar (Layout.jsx)

```
NAVIGATION PRINCIPALE:
  Dashboard           → /
  Dossiers            → /folders
  Documents           → /documents
  Arborescence        → /documents/tree
  Tous les docs       → /documents/all
  Calendrier          → /calendar
  Statistiques        → /statistics
  Messages            → /chat
  Demandes            → /document-requests
  Clients             → /clients
  Signatures          → /signatures
  Suivi               → /tracking
  Templates           → /templates

PARAMETRES (sous-menu depliable):
  Profil legal        → /settings/legal-info
  Acces clients       → /settings/client-access
  Notifications       → /settings/notifications
  Categories dossiers → /settings/folder-categories
  Categories templates→ /settings/template-categories
  Sauvegardes         → /settings/backups

HEADER:
  [Tenant name] | GlobalSearch | Theme toggle | NotificationCenter | User info | Logout

MOBILE BOTTOM BAR:
  Home | Dossiers | Docs | Chat | More
```

### Client Portal — Bottom Navigation (Layout.jsx)

```
BOTTOM NAV (mobile-first):
  Accueil             → /
  Documents           → /documents
  Demandes            → /requests (avec badge pending count)
  Compte              → /settings

HEADER:
  [Logo + Tenant name + "Espace Client"] | Logout
```

---

## 7. INFRASTRUCTURE

### Services Docker (docker-compose.dev.yml)

| Service | Image | Port(s) | Status |
|---------|-------|---------|--------|
| lexdoc-dev-postgres | postgres:16 | 5434:5432 | Up (healthy) |
| lexdoc-dev-minio | minio/minio | 9003:9000, 9004:9002 | Up (healthy) |
| lexdoc-dev-mailhog | mailhog/mailhog | 1026:1025, 8026:8025 | Up |

### Processus PM2

| ID | Nom | Mode | PID | Status | Mem |
|----|-----|------|-----|--------|-----|
| 2 | lexdoc-backend | fork | 3933612 | online | 118.6mb |

### Frontends

- **Admin**: `npm run dev` (Vite) sur port 4001
- **Client**: `npm run dev` (Vite) sur port 4002

### Variables d'environnement

**Backend (.env)**:
- PORT=4000
- DATABASE_URL=postgresql://lexdoc_user:...@localhost:5434/lexdoc_dev
- JWT_SECRET= (configure)
- JWT_EXPIRES_IN=7d
- MINIO_ENDPOINT=localhost, MINIO_PORT=9003
- SMTP_HOST=localhost, SMTP_PORT=1026 (MailHog)
- SENTRY_DSN= (configure)
- ENCRYPTION_KEY= (configure)
- UNIVERSIGN_* / SENDINGBOX_* = (configure)

**Frontend (.env)**:
- VITE_API_URL=http://31.97.57.103:4000/api

### Donnees en base

| Table | Count |
|-------|-------|
| Tenants | 3 |
| Users | 3 |
| Clients | 4 |
| Folders | 21 |
| Documents | 5 |
| BuilderTemplates | 206 |
| BuilderBlocks | 264 |
| Signatures | 0 |
| RegisteredMails | 0 |
| Deadlines | 0 |
| Conversations | 0 |
| DocumentRequests | 0 |

### Tests

| Suite | Resultat |
|-------|---------|
| Backend (Jest) | 138/138 PASS |
| Frontend (Vitest) | 66/78 (12 fails dans Layout.test.jsx - bug jsdom/undici, pas logique metier) |

---

## 8. ECARTS VS SPEC (00-MASTER-PLAN.md)

### Fonctionnalites implementees (OK)

| Spec | Status | Commentaire |
|------|--------|-------------|
| Multi-tenancy (isolation par cabinet) | OK | enforceTenant middleware + tenantFilter sur toutes les queries |
| Gestion utilisateurs (auth JWT) | OK | Login/logout, roles ADMIN/USER |
| Gestion clients (CRUD) | OK | Types INDIVIDUAL/COMPANY/ASSOCIATION, filtres, pagination |
| Gestion dossiers (CRUD + hierarchie) | OK | Arborescence, breadcrumb, move, categories, timeline, persons |
| Upload documents (chiffrement AES-256-GCM) | OK | Multer + MinIO + encryption IV/AuthTag |
| Gestion versions documents | OK | Version parent-child, upload nouvelle version |
| Recherche/filtres documents | OK | Recherche globale, avancee, filtres status/type/date |
| Preview documents | OK | PDF, images, texte |
| Signature Universign | OK (structure) | Service + webhook + statuts, mais UNIVERSIGN_API_KEY non configuree |
| Envoi LRAR SendingBox | OK (structure) | Service + webhook + tracking, mais SENDINGBOX_API_KEY non configuree |
| Relances automatiques | OK | node-cron job, niveaux progressifs, email templates |
| Extranet client securise | OK | Auth client separee, dashboard, documents, demandes, activite |
| Templates documents (builder) | OK | Builder blocks, templates, generation document, variables Handlebars |
| Calendrier/deadlines | OK | Vue mois, types, priorites, upcoming, overdue |
| Chat interne | OK | Conversations, messages, polling 10s, unread count |
| Statistiques | OK | Dashboard, documents, folders, activity, clients |
| Notifications | OK | In-app, email, push (web-push), preferences |
| Export PDF | OK | Dossier, documents, activite |
| Backups | OK | pg_dump + MinIO, logs, cleanup, Google Drive (optionnel) |
| PWA | OK | Service worker, install prompt, offline indicator |
| Dark mode | OK | ThemeContext toggle |
| Rate limiting | OK | General, auth (5/15min), upload (50/h) |
| Audit trail | OK | AuditLog model, actions tracees |
| RGPD (consentement, soft delete) | OK | ClientConsent, soft delete documents |

### Ecarts identifies

| Domaine | Ecart | Severite | Detail |
|---------|-------|----------|--------|
| **Folder.name vs Folder.title** | Le schema Prisma utilise `title`, mais certains composants frontend attendent `name` | CORRIGE | Fix applique: transform `name: f.title` dans folder.controller.js |
| **API response wrapping** | Backend wraps en `{ success, data, pagination }` mais certains composants ne unwrappaient pas correctement | CORRIGE | Fix applique dans DocumentsTreePage.jsx et Breadcrumb.jsx |
| **Universign/SendingBox** | API keys non configurees — integration non testable en dev | MINEUR | Structure code OK, fonctionnel quand les cles seront configurees |
| **Tests E2E (Playwright)** | Mentionne dans spec 13-TESTS-SUITE.md, pas implemente | MOYEN | Seuls Jest (backend) et Vitest (frontend) existent |
| **Tests de charge (k6)** | Mentionne dans spec 13-TESTS-SUITE.md, pas implemente | MINEUR | Pas critique pour phase dev |
| **Documentation OpenAPI** | Mentionne dans spec (API.md), pas generee | MOYEN | Routes existent mais pas de swagger/openapi |
| **docker-compose.prod.yml** | Mentionne dans spec 15-PROD-DEPLOYMENT, absent | MINEUR | Seulement docker-compose.dev.yml present |
| **Dockerfile frontend/backend** | Mentionne dans spec, absents | MINEUR | Dev mode seulement (npm run dev, PM2) |
| **Security headers (Helmet)** | Package installe, mais configuration potentiellement basique | A VERIFIER | Necessite audit specifique |
| **RLS PostgreSQL** | Spec mentionne RLS, mais isolation faite au niveau middleware (enforceTenant) pas au niveau DB | DESIGN | L'approche middleware est valide et plus simple, RLS en option |
| **Frontend Layout.test.jsx** | 12 tests en echec | MINEUR | Bug jsdom/undici, pas logique metier |
| **Folders tous au meme niveau** | Les 21 dossiers en base sont tous root (parentId=null), pas de sous-dossiers | DONNEES | La hierarchie fonctionne (parentId existe), simplement pas de donnees imbriquees |
| **Pas de gestion multi-utilisateurs** | Un seul user par tenant dans les donnees | DONNEES | Le schema supporte multi-users, c'est juste les seeds |
| **Pas de CRON relances actif** | Le job est code mais potentiellement pas schedule en production | A VERIFIER | Necessite verification du point d'entree cron |

### Pages manquantes vs spec

| Page/Feature spec | Etat |
|-------------------|------|
| Toutes les pages du master plan | PRESENTES |
| Extranet client complet | PRESENT (8 pages) |
| Settings complet | PRESENT (6 sous-pages) |

**Conclusion**: Toutes les pages prevues dans le master plan sont implementees. Il n'y a pas de page manquante.

---

## 9. RECOMMANDATIONS

### A conserver tel quel

- **Architecture backend**: Express + Prisma + middleware tenant bien structure
- **Schema Prisma**: Complet, 30+ modeles couvrent tous les besoins
- **API REST**: 187 endpoints couvrent tous les cas d'usage
- **Frontend Admin**: 21 pages, 15 composants, navigation complete
- **Frontend Client (Extranet)**: 8 pages, fonctionnel et autonome
- **Tests backend**: 138/138, bonne couverture
- **Services integrations**: Universign, SendingBox, MinIO, email, push, backup
- **Audit trail + notifications**: Systeme complet et fonctionnel

### A modifier/ameliorer

1. **Homogeneite API responses**: Standardiser le unwrapping `data?.data || data` dans tous les composants frontend (risque de regression sur les composants non encore testes)
2. **Tests frontend**: Corriger les 12 tests Layout.test.jsx en echec (jsdom/undici compatibility)
3. **Tests E2E**: Ajouter Playwright pour les scenarios critiques (login, upload, signature flow)
4. **Documentation API**: Generer OpenAPI/Swagger depuis les routes existantes
5. **Docker production**: Creer docker-compose.prod.yml + Dockerfiles

### A creer from scratch

- **Rien de majeur**. Le projet est fonctionnellement complet par rapport au master plan. Les ajouts concernent principalement:
  - Tests E2E (Playwright)
  - Tests de charge (k6)
  - Documentation OpenAPI
  - Configuration production (Dockerfiles, docker-compose.prod.yml)
  - Scripts de migration dev -> prod

---

## RESUME CHIFFRE

| Metrique | Valeur |
|----------|--------|
| Fichiers backend (src/) | ~52 fichiers JS |
| Fichiers frontend admin (src/) | ~47 fichiers JSX |
| Fichiers frontend client (src/) | ~14 fichiers JSX |
| Lignes schema Prisma | 1,339 |
| Lignes controllers | 3,234 |
| Lignes services | 2,444 |
| Lignes routes | 6,050 |
| Lignes pages frontend | ~10,212 |
| Lignes composants frontend | ~4,579 |
| Modeles Prisma | 30+ |
| Endpoints API | ~187 |
| Tests backend | 138/138 pass |
| Tests frontend | 66/78 pass (12 fails jsdom) |
| Migrations Prisma | 7 (toutes appliquees) |
| Commits recents | 10+ (derniers 5 cette session) |
