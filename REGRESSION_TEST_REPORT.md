# Rapport de tests de non-regression

**Date :** 2026-02-19 (v2 — re-exécution complète)
**Statut :** PASS (11/11)

---

## Bugs corrigés

### 1. BigInt serialize — `/api/settings/subscription`
**Problème :** `TypeError: Do not know how to serialize a BigInt` — les champs `maxStorage`, `maxUsers`, `maxClients` du tenant et l'agrégat `_sum.size` retournent des BigInt que `JSON.stringify` ne sait pas sérialiser.

**Corrections :**
- `backend/src/server.js` : Ajout global `BigInt.prototype.toJSON = function() { return Number(this) }` comme filet de sécurité
- `backend/src/routes/settings.routes.js` : Wrapping explicite `Number()` sur `maxUsers`, `maxClients`, `maxStorage`, `_sum.size`

**Résultat :** HTTP 200, JSON valide avec `storageUsed: 62999556, subscriptionTier: PRO`

### 2. Unknown argument `category` — `POST /api/documents` + `PUT /api/documents/:id`
**Problème :** Le champ `category` n'existe pas dans le schema Prisma `Document`. Il était destructuré dans le handler CREATE (ligne 91) et passé dans `prisma.document.create()`, provoquant `Unknown argument category`. Également présent dans le handler UPDATE (ligne 367) et l'audit log (ligne 418).

**Corrections :**
- `backend/src/controllers/document.controller.js:91` : Retiré `category` de la destructuration CREATE
- `backend/src/controllers/document.controller.js:367` : Retiré `category` de la destructuration UPDATE
- `backend/src/controllers/document.controller.js:418` : Retiré `category` de l'objet `changes` dans l'audit log

### 3. Emails `send-form` — jamais envoyé
**Problème :** Le handler `POST /clients/:id/send-form` créait un token d'invitation et un événement timeline, mais **n'envoyait aucun email**. Il retournait `success: true` sans envoyer.

**Corrections :**
- `backend/src/services/email.service.js` : Ajout méthode `sendFormCompletionEmail()` avec template HTML inline (même style que `sendClientInvitation`)
- `backend/src/routes/client.routes.js` : Ajout appel `emailService.sendFormCompletionEmail()` dans le handler `send-form`, avec gestion d'erreur try/catch (l'envoi email ne bloque pas la réponse API)

### 4. Emails `invite-extranet` — déjà fonctionnel
**Vérification :** Le handler appelait correctement `emailService.sendClientInvitation()` (ligne 694). L'email part bien — confirmé par test avec jean.dupont@techcorp.fr.

### 5. pg_dump manquant
**Problème :** Le job de backup quotidien échouait : `/bin/sh: 1: pg_dump: not found`

**Correction :** `apt-get install -y postgresql-client-16` — pg_dump v16.11 installé.

---

## Résultats des tests de non-régression

| # | Test | Méthode | Résultat | Détail |
|---|------|---------|----------|--------|
| 1 | Login admin | `POST /api/auth/login` | **PASS** | HTTP 200, token JWT reçu |
| 2 | Liste clients | `GET /api/clients` | **PASS** | HTTP 200 |
| 3 | Liste dossiers | `GET /api/folders` | **PASS** | HTTP 200 |
| 4 | Subscription (BigInt) | `GET /api/settings/subscription` | **PASS** | HTTP 200, JSON valide, storageUsed=62999556, tier=PRO |
| 5 | Health | `GET /api/health` | **PASS** | HTTP 200 |
| 6 | Dashboard stats | `GET /api/dashboard/stats` | **PASS** | HTTP 200 |
| 7 | includeFolders | `GET /api/clients?includeFolders=true` | **PASS** | HTTP 200, folders[] présent, 18 clients |
| 8 | Extranet login (endpoint) | `POST /api/extranet/login` | **PASS** | HTTP 401 (credentials incorrects — endpoint fonctionne) |
| 9 | SMTP direct | nodemailer sendMail | **PASS** | messageId reçu, email envoyé via smtp.gmail.com:587 |
| 10 | invite-extranet | `POST /api/clients/:id/invite-extranet` | **PASS** | HTTP 200, activationUrl générée, email envoyé à jean.dupont@techcorp.fr |
| 11 | send-form | `POST /api/clients/:id/send-form` | **PASS** | HTTP 200, token généré + email envoyé |

**Score : 11/11 — Aucune régression détectée.**

---

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `backend/src/server.js` | Ajout `BigInt.prototype.toJSON` global |
| `backend/src/routes/settings.routes.js` | Wrapping `Number()` sur champs tenant potentiellement BigInt |
| `backend/src/controllers/document.controller.js` | Retiré `category` de la destructuration CREATE (l.91), UPDATE (l.367) et audit log (l.418) |
| `backend/src/services/email.service.js` | Ajout `sendFormCompletionEmail()` |
| `backend/src/routes/client.routes.js` | Ajout envoi email dans handler `send-form` |

## Installation système

| Package | Version |
|---------|---------|
| `postgresql-client-16` | 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1) |

## Build

- Frontend : `npm run build` — OK (8.72s, 0 erreur)
- Backend : PM2 restart — OK (PID 83503, online)

## Règles appliquées

- Tests de non-régression systématiques après chaque batch de corrections
- Migrations séquentielles (jamais en parallèle)
- Tests avec `--runInBand`
- Agents parallèles ne touchent jamais les mêmes fichiers
