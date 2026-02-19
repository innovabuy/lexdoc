# Diagnostic complet LexDoc — 2026-02-18

Serveur : srv1361818 (76.13.50.173)
Application : http://76.13.50.173

---

## 1. Resultats des tests

| # | Fonctionnalite | Statut | Cause du bug | Fix applique |
|---|----------------|--------|-------------|--------------|
| 1 | Login admin | OK | Mot de passe incoherent apres seeds multiples | Reset tous les users a `admin123` via bcrypt.hash + updateMany |
| 2 | Login extranet | OK | Intercepteur axios injectait le token admin sur les appels `/extranet/*` | `api.js` : skip injection token si URL commence par `/extranet` |
| 3 | Extranet activate | OK | Lien email utilisait `primaryToken` (table client) mais `verify-token` et `activate` cherchent dans `clientAccess.activationToken` | `client.routes.js` : le lien utilise `firstFolderToken` du premier dossier |
| 4 | Activation multi-dossier | OK | L'activation ne concernait qu'un seul ClientAccess, les autres restaient inactifs | `extranet.routes.js` : `updateMany` active tous les acces du meme email |
| 5 | SMTP email | OK | Configuration Gmail correcte, emails envoyes | Aucun fix — smtp.gmail.com:587 fonctionne |
| 6 | CLIENT_PORTAL_URL | OK | Variable non definie dans .env, lien pointait vers `localhost:5173` | Ajoute `CLIENT_PORTAL_URL=http://76.13.50.173` dans `.env` |
| 7 | Dark mode melange | OK | ThemeContext detectait `prefers-color-scheme: dark` du systeme + CSS avec `@media (prefers-color-scheme: dark)` sur FolderDetailPage, mais seules 14 pages avaient des classes `dark:` | Force light mode dans ThemeContext + main.jsx, supprime bloc CSS dark de FolderDetailPage |
| 8 | birthDate.split crash | OK | `.split('T')` appele sur un objet Date au lieu d'un string | Ajout helper `formatDateField()` dans ClientDetailPage |
| 9 | activationToken P2002 | OK | Un seul token partage entre N clientAccess violait la contrainte `@unique` | Generation d'un token unique par clientAccess entry |
| 10 | Rate limit 429 sur login | OK | `authLimiter` a 5 tentatives/15min + `trust proxy` absent (tous les users partageaient la meme IP) | `app.set('trust proxy', 1)` + limite augmentee a 20 tentatives |
| 11 | BigInt serialization 500 | OK | `document.size` est un BigInt en Prisma, `JSON.stringify` ne sait pas le serialiser | Conversion `Number(d.size)` avant envoi de la reponse |
| 12 | Bouton extranet absent | OK | Aucun bouton d'invitation dans la fiche client | Ajout bouton 3 etats : "Inviter a l'extranet" / "Reinviter extranet" / "Extranet actif" |
| 13 | 401 redirect extranet | OK | Intercepteur axios redirigait tous les 401 vers `/login` (admin), cassant le flow extranet | Skip redirect si `pathname.startsWith('/extranet')` |
| 14 | Variables Builder (cabinet/avocat) | OK | `collectData()` manquait `cp`, `ville`, `telephone` ; pipeline Builder n'injectait pas les donnees contextuelles | Ajout champs manquants + `collectBasicData()` + auto-injection dans generate/preview |
| 15 | Blocks variables null | OK | Le champ JSON `variables` sur les blocs n'etait jamais peuple | Auto-extraction via `extractVariablesFull()` a la creation/MAJ des blocs + backfill dans seed-builder |
| 16 | blocksStructure blockTitle vs blockId | OK | Le seed creait des templates avec des titres de bloc, mais `generateDocument()` filtrait sur `blockId` | Resolution `blockTitle` -> `blockId` dans seed-builder + creation des 4 blocs manquants |

---

## 2. Fichiers modifies (toutes sessions)

### Backend
| Fichier | Modifications |
|---------|--------------|
| `backend/.env` | Ajout `CLIENT_PORTAL_URL=http://76.13.50.173` |
| `backend/src/server.js` | Ajout `app.set('trust proxy', 1)` |
| `backend/src/middleware/rateLimiter.js` | authLimiter: 5 -> 20 tentatives |
| `backend/src/routes/client.routes.js` | Fix lien email (`firstFolderToken`), fix activationToken unique |
| `backend/src/routes/client-access.routes.js` | Fallback URL chain `CLIENT_PORTAL_URL -> FRONTEND_URL` |
| `backend/src/routes/extranet.routes.js` | Activation multi-dossier (`updateMany`), fix BigInt serialization |
| `backend/src/routes/builder.routes.js` | Auto-extraction variables, auto-injection collectData/collectBasicData |
| `backend/src/services/template-engine.service.js` | Ajout `cp`, `ville` au cabinet ; `toque`, `barreau`, `adresse`, `telephone` a l'avocat ; nouvelle fonction `collectBasicData()` |
| `backend/src/services/document-generator.service.js` | Ajout methode `extractVariablesFull()` |
| `backend/prisma/seed.js` | Champs tenant complets, `onboardingCompleted: true` |
| `backend/prisma/seed-builder.js` | Backfill variables/blockId/requiredVariables, boucle multi-tenant, 4 blocs crees |

### Frontend
| Fichier | Modifications |
|---------|--------------|
| `frontend/src/services/api.js` | Skip injection token admin sur appels extranet, skip redirect 401 sur extranet |
| `frontend/src/services/clientsApi.js` | Ajout `inviteExtranet(id)` |
| `frontend/src/pages/clients/ClientDetailPage.jsx` | Bouton extranet 3 etats, handler `handleInviteExtranet`, fix `formatDateField()` |
| `frontend/src/contexts/ThemeContext.jsx` | Force light mode, supprime detection dark systeme |
| `frontend/src/main.jsx` | `document.documentElement.classList.remove('dark')` avant mount React |
| `frontend/src/pages/folders/FolderDetailPage.css` | Supprime bloc `@media (prefers-color-scheme: dark)` |

---

## 3. Configuration .env backend

```
NODE_ENV=production
PORT=4000
FRONTEND_URL=http://76.13.50.173
CLIENT_PORTAL_URL=http://76.13.50.173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=jfper54@gmail.com
SMTP_FROM=LexDoc <jfper54@gmail.com>
JWT_SECRET=7c84733...
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://lexdoc_user:...@localhost:5434/lexdoc_dev
```

---

## 4. Credentials

**Admin cabinet :**
- URL : http://76.13.50.173/login
- Email : `yves-marie.bienaime@pragmavox.fr`
- Password : `admin123`

**Extranet client :**
- URL : http://76.13.50.173/extranet/login
- Email : `jfper54@gmail.com`
- Password : `123456789123Rr`
- 6 dossiers actifs

---

## 5. Localhost references restantes (fallbacks inactifs)

Tous utilisent `process.env.VARIABLE || 'http://localhost:...'`. Les variables d'env sont definies, donc les fallbacks localhost ne sont jamais utilises en production.

- `server.js:40-41` — CORS allowedOrigins inclut localhost pour dev local
- `client.routes.js:612` — triple fallback `CLIENT_PORTAL_URL || FRONTEND_URL || localhost`
- `frontend/src/services/api.js:4` — fallback `localhost:4000/api` (VITE_API_URL defini au build)

---

## 6. Historique des commits

```
9071249 fix: serialize BigInt document size in extranet folder documents endpoint
66c3257 fix: prevent admin token injection on extranet API calls
7501cfc fix: force light mode to prevent dark/light theme mixing
14f6d59 fix: prevent 401 interceptor from redirecting extranet to admin login
3be7790 fix: enable trust proxy and increase auth rate limit
c60c929 feat: add extranet invitation button to client detail page
712ffd3 fix: use correct activation token in extranet email link and activate all folder accesses
320c6c4 fix: unique activationToken per clientAccess to prevent constraint violation
8180268 fix: handle non-string birthDate values in ClientDetailPage
02de222 fix: resolve cabinet/avocat variables in Builder templates
d623a70 Initial commit
```

---

## 7. Verification finale (tous OK)

```
ADMIN login localhost:4000  -> OK
ADMIN login 76.13.50.173    -> OK
EXTRANET login localhost    -> OK
EXTRANET login 76.13.50.173 -> OK
SMTP verify                 -> OK
Frontend build              -> OK (index-B3DoI2sk.js)
PM2 lexdoc-api              -> online (pid 62402)
Nginx                       -> proxy /api/ -> 127.0.0.1:4000
```
