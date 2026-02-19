# Localhost Cleanup Report — 2026-02-18

## Resultat

**Frontend source** : 0 localhost restants (18 occurrences nettoyees dans 16 fichiers)
**Frontend build (dist/)** : 0 localhost
**Backend source** : 0 localhost en production (3 restants, tous proteges)

---

## Backend — Corrections appliquees

| # | Fichier | Avant | Apres |
|---|---------|-------|-------|
| 1 | `server.js:30-42` | CORS `allowedOrigins` incluait 4 URLs localhost en dur | Localhost gate derriere `NODE_ENV !== 'production'`, seuls `FRONTEND_URL`, `CLIENT_PORTAL_URL`, `FRONTEND_CLIENT_URL` en prod |
| 2 | `server.js:115-116` | Log `http://localhost:${PORT}` au demarrage | `http://0.0.0.0:${PORT}` |
| 3 | `docusign.service.js:13` | Fallback `http://localhost:4000` pour webhook | Fallback `process.env.API_URL \|\| process.env.FRONTEND_URL` |
| 4 | `docusign.routes.js:66,70` | Fallback `http://localhost:5173` pour redirect | `process.env.FRONTEND_URL` (sans fallback) |
| 5 | `client-access.routes.js:158,191,261` | Fallback `http://localhost:4002` dans liens email | `process.env.CLIENT_PORTAL_URL \|\| process.env.FRONTEND_URL` |
| 6 | `client.routes.js:637` | Fallback `http://localhost:5173` dans lien email | `process.env.CLIENT_PORTAL_URL \|\| process.env.FRONTEND_URL` |

### Backend — Localhost conserves (legitimes)

| Fichier | Raison |
|---------|--------|
| `server.js:39-40` | CORS dev-only, gate `if (NODE_ENV !== 'production')` |
| `config/minio.js:5` | Endpoint MinIO local (service infra sur le serveur) |
| `services/backup.service.js:105` | Idem MinIO |

---

## Frontend — Corrections appliquees (18 occurrences dans 16 fichiers)

Remplacement global : `import.meta.env.VITE_API_URL || 'http://localhost:4000/api'` → `import.meta.env.VITE_API_URL || '/api'`

| # | Fichier | Occurrences |
|---|---------|:-----------:|
| 1 | `services/api.js` | 1 |
| 2 | `pages/settings/TemplateCategories.jsx` | 1 |
| 3 | `pages/settings/FolderCategories.jsx` | 1 |
| 4 | `pages/settings/Backups.jsx` | 1 |
| 5 | `pages/settings/ClientAccess.jsx` | 1 |
| 6 | `pages/settings/LegalInfo.jsx` | 2 |
| 7 | `pages/DocumentRequests.jsx` | 1 |
| 8 | `pages/Tracking.jsx` | 1 |
| 9 | `pages/Signatures.jsx` | 1 |
| 10 | `pages/FolderDetail.jsx` | 1 |
| 11 | `components/documents/DocumentPreview.jsx` | 1 |
| 12 | `components/documents/DocumentVersions.jsx` | 1 |
| 13 | `components/documents/DocumentUploader.jsx` | 1 |
| 14 | `components/folders/FolderTimeline.jsx` | 1 |
| 15 | `components/folders/DocumentRequests.jsx` | 1 |
| 16 | `components/folders/FolderPersons.jsx` | 1 |

Le fallback `/api` est safe : Nginx proxy `/api/` → `127.0.0.1:4000` en production. `VITE_API_URL` est defini dans `.env` (`http://76.13.50.173/api`) et compile dans le bundle au build.

---

## Verification

```
grep -r "localhost" frontend/dist/          → 0 resultats
grep -r "localhost" frontend/src/           → 0 resultats
grep -r "localhost" backend/src/ (hors dev) → 0 en production
Backend health                              → OK
Frontend build                              → OK
```

---

## Variables d'environnement requises

Les fallbacks localhost etant supprimes, ces variables **doivent** etre definies en `.env` :

```
FRONTEND_URL=http://76.13.50.173        ✅ defini
CLIENT_PORTAL_URL=http://76.13.50.173   ✅ defini
VITE_API_URL=http://76.13.50.173/api    ✅ defini (frontend/.env)
```
