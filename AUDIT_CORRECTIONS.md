# AUDIT COMPLET + CORRECTIONS — LexDoc Dev

**Date** : 2026-02-06
**Version** : Post-Phase 6 — Audit Complet

---

## 1. Audit API Endpoints (34 testés)

| # | Endpoint | Méthode | Statut | Notes |
|---|----------|---------|--------|-------|
| 1 | `/api/health` | GET | 200 OK | |
| 2 | `/api/auth/login` | POST | 200 OK | JWT retourné |
| 3 | `/api/auth/me` | GET | 200 OK | User + tenant |
| 4 | `/api/onboarding/status` | GET | 200 OK | |
| 5 | `/api/clients` | GET | 200 OK | 20 clients |
| 6 | `/api/folders` | GET | 200 OK | 42 dossiers |
| 7 | `/api/documents` | GET | 200 OK | 194 documents |
| 8 | `/api/signatures` | GET | 200 OK | |
| 9 | `/api/tracking` | GET | 200 OK | |
| 10 | `/api/document-requests` | GET | 200 OK | 29 demandes |
| 11 | `/api/notifications` | GET | 200 OK | |
| 12 | `/api/notifications/unread-count` | GET | 200 OK | |
| 13 | `/api/search?q=test` | GET | 200 OK | |
| 14 | `/api/deadlines` | GET | 200 OK | 30 deadlines |
| 15 | `/api/deadlines/upcoming` | GET | 200 OK | |
| 16 | `/api/statistics/dashboard` | GET | 200 OK | (corrigé commit 10bff0c) |
| 17 | `/api/statistics/documents` | GET | 200 OK | |
| 18 | `/api/statistics/folders` | GET | 200 OK | |
| 19 | `/api/statistics/activity` | GET | 200 OK | |
| 20 | `/api/statistics/clients` | GET | 200 OK | |
| 21 | `/api/templates/tree` | GET | 200 OK | 50 templates |
| 22 | `/api/blocks` | GET | 200 OK | 273 blocs |
| 23 | `/api/tree-templates` | GET | 200 OK | |
| 24 | `/api/users` | GET | 200 OK | |
| 25 | `/api/settings` | GET | 200 OK | |
| 26 | `/api/chat/conversations` | GET | 200 OK | 5 conversations |
| 27 | `/api/template-categories` | GET | 200 OK | |
| 28 | `/api/folder-categories` | GET | 200 OK | |
| 29 | `/api/lrar` | GET | 200 OK | |
| 30 | `/api/builder/templates` | GET | 200 OK | |
| 31 | `/api/export/documents/pdf` | GET | 200 OK | Retourne PDF |
| 32 | `/api/backups` | GET | 200 OK | |
| 33 | `/api/integrations/docusign/status` | GET | 200 OK | |
| 34 | `/api/integrations/sendingbox/status` | GET | 200 OK | |

**Résultat : 34/34 endpoints OK (100%)**

---

## 2. Corrections Appliquées

### 2.1 Bug critique : `document.storageKey` → `document.objectKey` (docusign.routes.js)

**Fichier** : `backend/src/routes/docusign.routes.js`
**Problème** : Le champ `storageKey` n'existe pas dans le modèle Prisma `Document`. Le champ correct est `objectKey`.
**Impact** : Les endpoints `/documents/:id/sign` et `/documents/:id/send-registered/confirm` échouaient avec une erreur undefined.
**Correction** : 3 occurrences remplacées (`document.storageKey` → `document.objectKey`, lignes 154, 364, 371).

### 2.2 Bug critique : `getPresignedUrl` → `generatePresignedUrl` (docusign.routes.js)

**Fichier** : `backend/src/routes/docusign.routes.js`, ligne 371
**Problème** : La méthode `getPresignedUrl` n'existe pas dans `storage.service.js`. La méthode correcte est `generatePresignedUrl`.
**Impact** : L'envoi recommandé (LRAR) via DocuSign échouait avec "method not found".
**Correction** : Méthode renommée.

### 2.3 Correction précédente : statistics.controller.js (commit 10bff0c)

**Fichier** : `backend/src/controllers/statistics.controller.js`
**Problème** : `prisma.signature.count({ where: { tenantId } })` — le modèle Signature n'a pas de champ `tenantId`.
**Correction** : Filtrage via relation document : `{ where: { document: { tenantId }, status: 'PENDING' } }`.

---

## 3. Audit Flow Signatures

### Frontend
| Composant | Status | Notes |
|-----------|--------|-------|
| `SignatureModal.jsx` | OK | Formulaire complet, pré-remplissage signataires |
| `Signatures.jsx` (page) | OK | Onglets Signatures/LRAR, stats, tableau, modals |
| Pré-remplissage signataires | OK | Filtre `folderPersons` avec email |
| API submission | OK | Appelle `POST /documents/:id/sign` (DocuSign) |

### Backend
| Route | Status | Notes |
|-------|--------|-------|
| `GET /api/signatures` | OK | Liste paginée avec filtres |
| `POST /api/signatures` | OK | Création directe (Universign) |
| `GET /api/signatures/:id` | OK | Détails |
| `POST /api/signatures/:id/resend` | OK | Renvoi invitation |
| `DELETE /api/signatures/:id` | OK | Annulation |
| `GET /api/signatures/stats/summary` | OK | Statistiques |
| `POST /documents/:id/sign` | OK | DocuSign OAuth2 flow |

### Remarques architecturales
- Deux systèmes de signature coexistent : Universign (`/api/signatures`) et DocuSign (`/documents/:id/sign`)
- Le frontend utilise les deux selon le contexte (page vs modal)
- Les deux fonctionnent correctement

---

## 4. Audit Flow Envois Recommandés (LRAR)

### Frontend
| Composant | Status | Notes |
|-----------|--------|-------|
| `RegisteredMailModal.jsx` | OK | Flow 2 étapes (estimation → confirmation) |
| Validation adresse | OK | Filtre destinataires avec adresse complète |
| `Tracking.jsx` (page) | OK | Liste suivi avec statuts |

### Backend
| Route | Status | Notes |
|-------|--------|-------|
| `POST /documents/:id/send-registered` | OK | Estimation coût |
| `POST /documents/:id/send-registered/confirm` | OK | **Corrigé** (objectKey + generatePresignedUrl) |
| `GET /api/lrar` | OK | Liste envois |
| `GET /api/lrar/:id/tracking` | OK | Suivi |
| `GET /api/lrar/:id/proof` | OK | Preuve de livraison |
| `GET /api/tracking` | OK | Suivi global documents |
| `GET /api/tracking/stats` | OK | Statistiques |

---

## 5. Audit Document Builder

### Frontend
| Composant | Status | Notes |
|-----------|--------|-------|
| `Templates.jsx` (page) | OK | Grille + arborescence, générateur |
| `TemplateEditor.jsx` | OK | @dnd-kit drag-drop, blocs |
| `TemplateTreeView.jsx` | OK | Vue arborescente catégories |

### Backend
| Route | Status | Notes |
|-------|--------|-------|
| `GET /api/builder/templates` | OK | Liste templates builder |
| `GET /api/builder/tree` | OK | Arborescence catégories |
| `POST /api/builder/generate` | OK | Génération document |
| `POST /api/builder/preview` | OK | Prévisualisation |
| `GET /api/templates/tree` | OK | 50 templates, 5 catégories |
| `GET /api/blocks` | OK | 273 blocs (267 système + 6 custom) |

---

## 6. Audit Pages Sidebar

| Page | Route | Fichier | Status | Implémentation |
|------|-------|---------|--------|----------------|
| Dashboard | `/dashboard` | `Dashboard.jsx` | OK | Stats + graphiques |
| Clients | `/clients` | `Clients.jsx` | OK | CRUD complet |
| Dossiers | `/dossiers` | `Folders.jsx` | OK | Liste + détails |
| Agenda | `/calendar` | `Calendar.jsx` | OK | Calendrier mensuel, CRUD deadlines |
| Signatures | `/signatures` | `Signatures.jsx` | OK | Onglets Signatures/LRAR |
| Envois recommandés | `/tracking` | `Tracking.jsx` | OK | Stats + suivi |
| Demandes documents | `/document-requests` | `DocumentRequests.jsx` | OK | Stats + liste |
| Messagerie | `/chat` | `Chat.jsx` | OK | Two-pane, polling 10s |
| Paramètres/Cabinet | `/parametres/cabinet` | `CabinetSettings.jsx` | OK | |
| Paramètres/Templates | `/parametres/templates` | `Templates.jsx` | OK | |
| Paramètres/Arborescences | `/parametres/arborescences` | `TreeTemplates.jsx` | OK | |
| Paramètres/Intégrations | `/parametres/integrations` | `Integrations.jsx` | OK | |
| Paramètres/Utilisateurs | `/parametres/utilisateurs` | `UserManagement.jsx` | OK | |

**Résultat : 13/13 pages OK — aucun placeholder**

---

## 7. Données Démo

Script : `prisma/seed-demo-data.js`

| Entité | Avant | Après | Ajoutés |
|--------|-------|-------|---------|
| Clients | 13 | 20 | +7 |
| Dossiers | 26 | 42 | +16 |
| Documents | 9 | 194 | +185 |
| Deadlines | 0 | 30 | +30 |
| Document Requests | 5 | 29 | +24 |
| Notifications | 1 | 31 | +30 |
| Conversations | 0 | 5 | +5 |
| Messages | 0 | 25 | +25 |
| Audit Logs | ~100 | 156 | +50 |
| Folder Persons | ? | +18 | +18 |

---

## 8. Build & Tests

### Frontend Build
```
vite v7.3.1 — 1890 modules
dist/assets/index-h-cQu4dC.css  155.20 kB (gzip: 24.51 kB)
dist/assets/index-B6FZKS9s.js   770.55 kB (gzip: 205.37 kB)
Résultat : OK, 0 erreurs
```

### Tests
| Suite | Tests | Résultat |
|-------|-------|----------|
| Tests unitaires (9 suites) | 138/138 | PASS |
| Tests live E2E (7 suites) | 45/45 | PASS |
| **Total** | **183/183** | **100%** |

### Backend
- PM2 `lexdoc-backend` : online, port 4000
- 23/23 endpoints critiques vérifiés post-restart

---

## 9. Résumé des Fichiers Modifiés

| Fichier | Modification |
|---------|-------------|
| `backend/src/routes/docusign.routes.js` | `storageKey` → `objectKey` (3 occurrences) + `getPresignedUrl` → `generatePresignedUrl` |
| `backend/prisma/seed-demo-data.js` | **Nouveau** — Script de données démo |

---

## 10. Conclusion

**Statut global : VALIDÉ**

- **34/34 endpoints** fonctionnent (100%)
- **183/183 tests** passent (100%)
- **13/13 pages** frontend implémentées (aucun placeholder)
- **3 bugs critiques** corrigés (storageKey, getPresignedUrl, statistics tenantId)
- **Données démo** réalistes créées pour toutes les features
- **Build frontend** : 0 erreur, 0 warning critique
- **Backend** : PM2 stable, toutes les routes répondent

### Issues connues (non bloquantes)
1. Deux systèmes de signature parallèles (Universign + DocuSign) — fonctionnent mais architecture à consolider
2. Deux systèmes de templates (Builder + Legacy) — coexistent sans conflit
3. `lrar.routes.js` partiellement orphelin (le frontend utilise `/documents/:id/send-registered` via DocuSign)
4. Certaines pages utilisent `fetch` direct au lieu du service `api` centralisé

---

## Configuration SMTP — 2026-02-07

### Gmail SMTP configuré et testé
- **SMTP** : `smtp.gmail.com:587` (STARTTLS)
- **Compte** : `jfper54@gmail.com` (mot de passe d'application)
- **From** : `LexDoc <jfper54@gmail.com>`
- **Fichiers modifiés** :
  - `backend/.env` — credentials Gmail SMTP
  - `backend/src/services/email.service.js` — ajout `secure: false`, `tls: { rejectUnauthorized: false }`
- **Test** : invitation extranet envoyée à `jfper54@gmail.com` via `POST /api/clients/:id/invite-extranet` — email reçu sans erreur
- **Note** : Brevo (`smtp-relay.brevo.com`) testé en premier mais échec auth 535. Gmail fonctionne pour les tests. Prévoir retour sur Brevo pour la production (limites Gmail : ~500 emails/jour).

---

## Vues hiérarchiques — 2026-02-07

### 1. Arborescence documents dans FolderDetailPage
- **Fichiers modifiés** :
  - `frontend/src/pages/folders/FolderDetailPage.jsx` — DocumentsTab reécrit avec vue arborescente
  - `frontend/src/pages/folders/FolderDetailPage.css` — styles tree lines, chevrons, drop zones, badge pulsant
- **Fonctionnalités** :
  - Lignes de connexion verticales/horizontales entre catégories et documents (border-left + connector)
  - Catégories avec documents dépliées par défaut, vides repliées
  - Bouton "+" par catégorie (apparaît au survol) pour ajouter un document
  - Catégories vides : zone drop dashed "Glissez des fichiers ici ou cliquez"
  - Badge orange pulsant pour PENDING_SIGNATURE
  - Chevrons animés (rotation 90deg)

### 2. Vue hiérarchique clients dans ClientsPage
- **Fichiers modifiés** :
  - `frontend/src/pages/clients/ClientsPage.jsx` — toggle Liste/Hiérarchique, lazy-load dossiers
  - `frontend/src/pages/clients/ClientsPage.css` — styles toggle, cards clients, arbre dossiers
  - `backend/src/routes/client.routes.js` — nouvel endpoint `GET /api/clients/:id/folders`
- **Fonctionnalités** :
  - Toggle vue Liste (table existante) / Hiérarchique (icônes List/GitBranch)
  - Chaque client : avatar initiales, nom cliquable, badge PP/PM, barre complétude, email, nb dossiers
  - Clic chevron → déplie le client et charge ses dossiers en lazy (GET /clients/:id/folders)
  - Dossiers : lignes de connexion, icône dossier, titre cliquable → /dossiers/:id, référence, type, statut, nb docs
  - Responsive : flex-wrap sur mobile

### Build
- `npm run build` : **0 erreur**, 0 warning bloquant (chunk size advisory only)
