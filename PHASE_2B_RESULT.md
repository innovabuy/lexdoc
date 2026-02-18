# Phase 2B — Vue Dossier Individuel (5 onglets) — Rapport de Resultat

**Date** : 2026-02-06

---

## Criteres de succes

| # | Critere | Statut |
|---|---------|--------|
| 1 | API GET /folders/:id/documents (groupes par categorie) | OK |
| 2 | API GET /folders/:id/signatures | OK |
| 3 | API GET /folders/:id/timeline | OK |
| 4 | API POST /folders/:id/doc-categories | OK |
| 5 | API PATCH /documents/:id/extranet (toggle visibleExtranet) | OK |
| 6 | FolderDetailPage 5 onglets (Info, Personnes, Documents, Signatures, Timeline) | OK |
| 7 | Onglet Info avec edition inline | OK |
| 8 | Onglet Documents : arborescence par categorie, badges, extranet toggle | OK |
| 9 | Modal upload drag-and-drop | OK |
| 10 | Changement de statut inline (dropdown) | OK |
| 11 | Navigation /dossiers/:id coherente | OK |
| 12 | Build sans erreur | OK |
| 13 | Tests backend 138/138 sans regression | OK |
| 14 | Rapport PHASE_2B_RESULT.md | Ce fichier |

---

## Partie 1 — API Backend

### Nouvelles routes

| Methode | Route | Description | Teste |
|---------|-------|-------------|-------|
| GET | `/api/folders/:id/documents` | Documents groupes par FolderDocCategory + non-classes | OK |
| GET | `/api/folders/:id/signatures` | Demandes de signature (SignatureRequest) liees au dossier | OK |
| GET | `/api/folders/:id/timeline` | Evenements TimelineEvent du dossier | OK |
| POST | `/api/folders/:id/doc-categories` | Ajouter une FolderDocCategory au dossier | OK |
| PATCH | `/api/documents/:id/extranet` | Toggle visibleExtranet (true/false) | OK |

### GET /folders/:id/documents (groupes)

Retourne les documents organises en arborescence :

```json
{
  "categories": [
    {
      "id": "...",
      "name": "Actes de procedure",
      "ordre": 1,
      "documents": [
        {
          "id": "...",
          "name": "Acte de cession",
          "status": "DRAFT",
          "size": 0,
          "visibleExtranet": false,
          "createdBy": { "firstName": "...", "lastName": "..." }
        }
      ]
    }
  ],
  "uncategorized": []
}
```

- BigInt `size` converti en Number pour la serialisation JSON
- Documents tries par `createdAt` desc
- Include `createdBy`, `_count.versions`, `_count.signatures`

### PATCH /documents/:id/extranet

- Toggle `visibleExtranet` sur un document
- Body : `{ "visible": true }` ou `{ "visible": false }`
- Si `visible` non fourni, inverse la valeur actuelle
- Cree un audit log DOCUMENT_UPDATED

### Tests API

```
DOCUMENTS GROUPED: 5 categories
  - Actes de procedure: 1 doc
  - Conclusions: 0
  - Correspondances: 0
  - Pieces: 0
  - Decisions: 0
EXTRANET TOGGLE: true → false (200 OK)
TIMELINE: 1 event (dossier_cree)
SIGNATURES: 0 (pas encore de SignatureRequest)
ADD CATEGORY: "Test Phase2B" cree (201)
```

---

## Partie 2 — Frontend

### Fichiers crees (2)

| Fichier | Description |
|---------|-------------|
| `frontend/src/pages/folders/FolderDetailPage.jsx` | Page detail dossier 5 onglets (~750 lignes) |
| `frontend/src/pages/folders/FolderDetailPage.css` | Styles complets (prefixe `fdp-`, responsive, dark mode) |

### Fichiers modifies (4)

| Fichier | Modification |
|---------|-------------|
| `frontend/src/services/foldersApi.js` | +7 fonctions API (getFolderDocuments, getFolderSignatures, getFolderTimeline, uploadFolderDocument, toggleDocExtranet, updateFolder, addDocCategory) |
| `frontend/src/App.jsx` | Import FolderDetailPage + route dossiers/:id pointe vers FolderDetailPage |
| `frontend/src/pages/Folders.jsx` | Navigation vers /dossiers/:id (au lieu de /folders/:id) |
| `frontend/src/pages/Dashboard.jsx` | Liens recents → /dossiers/:id |

### Backend modifies (3)

| Fichier | Modification |
|---------|-------------|
| `backend/src/controllers/folder.controller.js` | +4 methodes (getDocumentsGrouped, getSignatures, getTimeline, addDocCategory) |
| `backend/src/routes/folder.routes.js` | +4 routes (GET /:id/documents, GET /:id/signatures, GET /:id/timeline, POST /:id/doc-categories) |
| `backend/src/controllers/document.controller.js` | +1 methode (toggleExtranet) |
| `backend/src/routes/document.routes.js` | +1 route (PATCH /:id/extranet) |

### Onglet 1 : Informations

- **Header** : icone dossier (couleur), titre, reference, badge statut (cliquable pour changer), type, lien client
- **Changement statut** : dropdown inline avec les 5 statuts (OPEN, IN_PROGRESS, PENDING, CLOSED, ARCHIVED)
- **Edition inline** : clic sur un champ → input/textarea, Enter pour valider, Escape pour annuler
- **Champs editables** : titre, description, juridiction, numero RG, chambre
- **Sections** : Informations dossier, Informations judiciaires (si LITIGATION), Informations juridiques (si CONTRACT + nature), Client (lien), Creation
- **Breadcrumb** : Dossiers / {reference}

### Onglet 2 : Personnes

- Reutilise le composant `FolderPersons` existant (CRUD complet)
- Compteur dans l'onglet

### Onglet 3 : Documents (LE PLUS IMPORTANT)

- **Arborescence** : categories FolderDocCategory avec chevron expand/collapse
- **Icones** : dossier jaune pour categories, icones colorees par type (PDF rouge, Word bleu, Excel vert, Image violet)
- **Badges** : statut du document + badge "Extranet" si visibleExtranet
- **Actions par document** :
  - Previsualiser (icone oeil → DocumentPreview modal)
  - Telecharger (icone fleche bas → blob download)
  - Toggle extranet (icone globe → PATCH /extranet)
- **Boutons toolbar** :
  - "+ Categorie" → formulaire inline pour ajouter une FolderDocCategory
  - "Telecharger un document" → modal upload
- **Etat vide** : message + bouton telecharger

### Modal Upload

- **Drag-and-drop** : zone de depot avec feedback visuel (bordure bleue/verte)
- **Clic pour selectionner** : input file multiple
- **Options** : nom du document (optionnel), categorie (select parmi FolderDocCategory)
- **Multi-fichiers** : liste des fichiers selectionnes avec taille
- **Upload** : POST /documents avec FormData (folderId, file, name, category)

### Onglet 4 : Signatures

- Liste des SignatureRequest liees au dossier
- **Carte par signature** : document, statut (badge colore), ordre, expiration, dates
- **Signataires** : avatars ronds avec initiale + check vert si signe
- **Statuts** : brouillon, envoye, partiellement_signe, signe, expire, annule
- **Etat vide** : message informatif

### Onglet 5 : Historique (Timeline)

- **TimelineEvent** : evenements groupes par date
- **Dot colore** : couleur selon le type d'evenement (vert=creation, bleu=modification, etc.)
- **Format relatif** : "A l'instant", "Il y a 5 min", "Il y a 2j"
- **Bouton Actualiser**
- **Etat vide** : message informatif

---

## Build

```
 1855 modules transformed
dist/index.html                   2.46 kB
dist/assets/index-BKkPbXZi.css   96.76 kB
dist/assets/index-BDqC7dlh.js   602.98 kB
 built in 3.98s — 0 errors
```

## Tests backend

```
Test Suites: 9 passed, 9 total
Tests:       138 passed, 138 total — 0 regressions
```

---

**Phase 2B terminee avec succes.**
