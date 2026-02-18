# PHASE 3 — BIBLIOTHÈQUE TEMPLATES + ÉDITEUR DE BLOCS

## Statut : TERMINÉ

## Résumé

Phase 3 implémente la bibliothèque de templates avec gestion arborescente, l'éditeur de blocs en deux panneaux avec drag-and-drop (@dnd-kit), et l'intégration dans les pages existantes.

---

## Backend

### Routes Template enrichies (`/api/templates`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/tree` | Arborescence par catégories (personnalisés en premier) |
| GET | `/:id` | Détail d'un template |
| POST | `/` | Création (isPersonalise: true par défaut) |
| PUT | `/:id` | Mise à jour des champs |
| DELETE | `/:id` | Soft delete (bloque les system) |
| POST | `/:id/duplicate` | Duplication avec suffixe "(Copie)" |
| PUT | `/:id/blocks` | Sauvegarde composition de blocs |
| POST | `/:id/upload-source` | Upload .docx source vers MinIO |

### Routes Block (`/api/blocks`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste avec filtrage, retourne grouped: {system, standard, custom} |
| POST | `/` | Création bloc personnalisé |
| PUT | `/:id` | Modification (blocs non-système uniquement) |
| DELETE | `/:id` | Soft delete (blocs non-système uniquement) |

### Seed blocks (`scripts/seed-blocks.js`)
- 3 blocs système : En-tête cabinet (INTRO), Pied de page (SIGNATURE), Signature + Date (SIGNATURE)
- 6 blocs standard : Identification des parties, Objet de la mission, Conditions d'honoraires, Clause de confidentialité, Clause d'élection de domicile, Clause de juridiction

---

## Frontend

### Service API (`services/templateApi.js`)
- Templates : getTemplatesTree, getTemplate, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate, saveTemplateBlocks, uploadTemplateSource
- Blocks : getBlocks, createBlock, updateBlock, deleteBlock

### Bibliothèque (`pages/parametres/TemplatesSettings.jsx`)
- Vue arborescente par catégories avec expand/collapse
- Section "Personnalisés" distincte (bordure violette)
- Recherche temps réel
- Actions : modifier (ouvre l'éditeur), dupliquer, supprimer (avec confirmation)
- Modal de création avec choix mode (blocs / upload .docx)

### Éditeur de blocs (`components/templates/TemplateEditor.jsx`)
- **Panneau gauche** (280px) : Bibliothèque de blocs avec :
  - 3 sections (Système/Standard/Personnalisé) avec dots colorés
  - Recherche et filtres par type
  - Blocs draggables avec aperçu du contenu
  - Tags de variables affichés comme badges
  - Bouton "+" pour créer un bloc personnalisé inline
- **Panneau droit** : Zone de composition avec :
  - Blocs triables par drag-and-drop (@dnd-kit)
  - Numérotation automatique
  - Expand/collapse du contenu de chaque bloc
  - Bouton retirer (×)
  - Couleurs par catégorie (bleu=INTRO, jaune=FAITS, violet=MOYENS, vert=DISPOSITIF, gris=SIGNATURE, rose=CLAUSE, pourpre=CUSTOM)
- **DragOverlay** pour retour visuel pendant le glisser
- Sauvegarde via PUT /api/templates/:id/blocks
- Indicateur "Modifications non sauvegardées"

### Intégration FolderDetailPage
- Bouton "Composer un document" ajouté dans la toolbar Documents → navigue vers `/parametres/templates`
- Le bouton "Créer depuis un template" (Phase 2C) reste en place

---

## Fichiers créés/modifiés

### Backend
- `src/routes/template.routes.js` — 8 nouveaux endpoints ajoutés
- `src/routes/block.routes.js` — NOUVEAU : 4 endpoints CRUD
- `src/routes/index.js` — Import et registration /api/blocks
- `scripts/seed-blocks.js` — NOUVEAU : seed 9 blocs (3 system + 6 standard)

### Frontend
- `src/services/templateApi.js` — NOUVEAU : service API templates + blocks
- `src/pages/parametres/TemplatesSettings.jsx` — RÉÉCRIT : bibliothèque complète
- `src/pages/parametres/TemplatesSettings.css` — NOUVEAU : styles bibliothèque
- `src/components/templates/TemplateEditor.jsx` — NOUVEAU : éditeur deux panneaux
- `src/components/templates/TemplateEditor.css` — NOUVEAU : styles éditeur
- `src/pages/folders/FolderDetailPage.jsx` — Bouton "Composer un document" ajouté

---

## Tests

- **Backend** : 138/138 tests passent (9 suites)
- **Build frontend** : 1866 modules, 0 erreurs
- **API vérifiée** :
  - GET /api/templates/tree → 3 catégories, 5 templates
  - GET /api/blocks → 273 blocs (267 system, 6 standard, 0 custom)

---

## Dépendances ajoutées (Phase 3)
- `@dnd-kit/core` — Framework drag-and-drop
- `@dnd-kit/sortable` — Plugin tri par glisser
- `@dnd-kit/utilities` — Utilitaires CSS Transform
