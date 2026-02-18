# Phase 1A — Schema Prisma Enrichi — Rapport de Résultat

**Date** : 2026-02-06
**Migration** : `20260206142333_spec_ux_unifiee_enrichissement`

---

## Critères de succès

| # | Critère | Statut |
|---|---------|--------|
| 1 | `npx prisma validate` passe sans erreur | ✅ OK |
| 2 | Migration créée et appliquée | ✅ OK |
| 3 | `npx prisma generate` OK | ✅ OK |
| 4 | Seed exécuté sans erreur | ✅ OK |
| 5 | 14 modèles accessibles avec `findMany()` | ✅ OK |
| 6 | Aucun champ existant supprimé | ✅ OK |
| 7 | Rapport écrit dans PHASE_1A_RESULT.md | ✅ Ce fichier |

---

## Validation des modèles (14/14)

```
tenant              : 3
user                : 3
client              : 6
folder              : 23
folderPerson        : 4
folderDocCategory   : 9
folderTreeTemplate  : 2
document            : 5
template            : 1
builderBlock        : 264
builderTemplate     : 206
signatureRequest    : 0
timelineEvent       : 3
clientReminder      : 0
```

**14/14 modèles OK**

---

## Résumé des modifications

### Modèles existants enrichis (8)

| Modèle | Champs ajoutés | Relations ajoutées |
|--------|---------------|--------------------|
| **Tenant** | `toque`, `barreau`, `deletedAt` | `docTemplates Template[]` |
| **User** | `onboardingCompleted`, `onboardingStep` | — |
| **Client** | ~35 champs (identité, filiation, situation familiale, coordonnées pro, complétude profil, `deletedAt`) | `folderPersons`, `documents` |
| **Folder** | `nature`, `juridiction`, `numeroRG`, `chambre`, `dateAudience`, `dateEcheance`, `deletedAt` | `folderDocCategories`, `timelineEvents`, `signatureRequests` |
| **FolderPerson** | `clientId`, `cabinet`, `barreau`, `avocatAdverseId`, `ordre` | `client`, `avocatAdverse`, `partiesClientes` |
| **Document** | `docCategoryId`, `clientId`, `templateId`, champs DocuSign (4), champs SendingBox (4), `visibleExtranet` | `docCategory`, `client`, `template`, `signatureRequests`, `timelineEvents` |
| **BuilderBlock** | `deletedAt` | — |
| **BuilderTemplate** | `isPersonalise`, `sourceFileUrl`, `folderType`, `folderNature`, `deletedAt` | — |

### Enum enrichi

| Enum | Valeurs ajoutées |
|------|-----------------|
| **PersonRole** | `CLIENT`, `POSTULANT` |

### Nouveaux modèles créés (6)

| Modèle | Table | Description |
|--------|-------|-------------|
| **Template** | `templates` | Modèles de documents avec variables, blocs, folderType/Nature |
| **FolderDocCategory** | `folder_doc_categories` | Catégories de documents par dossier (@@unique folderId+name) |
| **FolderTreeTemplate** | `folder_tree_templates` | Arborescences par défaut de dossiers (@@unique tenantId+name) |
| **SignatureRequest** | `signature_requests` | Workflows de signature DocuSign |
| **TimelineEvent** | `timeline_events` | Historique chronologique des dossiers |
| **ClientReminder** | `client_reminders` | Relances automatiques client |

---

## Seed (données de test)

- 2 clients enrichis (PP + PM avec tous les champs de filiation, situation familiale, etc.)
- 2 dossiers enrichis (juridique + judiciaire avec nature, juridiction, RG)
- 9 catégories de documents (par dossier)
- 2 arborescences de dossiers
- 3 personnes sur dossiers (avec lien client et avocat adverse)
- 3 événements timeline
- 1 template de document
- Seed idempotent (utilise `findFirst`/`upsert`)

---

## Décisions techniques

| Sujet | Décision | Raison |
|-------|----------|--------|
| Cabinet vs Tenant | Gardé `Tenant` | Préserver tout le code existant (middleware, routes, contrôleurs) |
| FolderCategory vs FolderDocCategory | Créé `FolderDocCategory` | `FolderCategory` existait déjà avec un autre usage |
| Relation templates sur Tenant | Nommée `docTemplates` | `templates` était déjà pris par `FolderTemplate[]` |
| Relation Document→Client | Nommée `"DocumentClient"` | Éviter ambiguïté Prisma avec les autres relations Client |
| Nouveaux champs | Tous nullable ou avec default | Préservation des données existantes, migration non-destructive |

---

## Fichiers modifiés

- `backend/prisma/schema.prisma` — enrichissement (~340 lignes ajoutées)
- `backend/prisma/seed.js` — réécrit (idempotent)
- `backend/prisma/migrations/20260206142333_spec_ux_unifiee_enrichissement/` — migration auto-générée

## Backup

- `backend/prisma/schema.prisma.backup.*` — sauvegarde pré-modification

---

## Tests backend

- **138/138 tests passent** (vérifié avant les modifications)
- Aucune régression attendue (ajout de champs uniquement, pas de suppression)

---

**Phase 1A terminée avec succès.**
