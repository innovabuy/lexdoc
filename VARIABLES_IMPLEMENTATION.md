# Implementation Report: Variables System & Template Builder

## Summary

Complete overhaul of the template variable system, fixing 5 critical issues that prevented `{{cabinet.*}}` and `{{avocat.*}}` variables from resolving in generated documents.

---

## Issues Fixed

### 1. Tenant Data Incomplete
**Before:** Only `name` and `email` were populated on the tenant record.
**After:** All branding fields are now populated:
- `address`: 1 Place du Ralliement
- `postalCode`: 49100
- `city`: Angers
- `phone`: 02 41 00 00 00
- `barreau`: Angers
- `toque`: T-123
- `legalName`: SELARL Cabinet Pragmavox Avocat

**Files:** `backend/prisma/seed.js`

### 2. Block Variables Always Null
**Before:** The `variables` JSON field on `BuilderBlock` was never populated, so the TemplateEditor couldn't display variable tags.
**After:** Variables are auto-extracted from block content using `extractVariablesFull()` and stored on creation/update. 373 existing blocks backfilled.

**Files:** `backend/src/routes/builder.routes.js` (POST/PUT blocks), `backend/prisma/seed-builder.js`

### 3. Template requiredVariables Always Null
**Before:** No validation was possible before document generation.
**After:** `requiredVariables` computed from all blocks in the template's `blocksStructure` and stored on the template.

**Files:** `backend/prisma/seed-builder.js`

### 4. Builder Pipeline Missing Context Data
**Before:** The Builder pipeline (`POST /builder/generate`, `POST /builder/preview`) passed raw user variables without auto-injecting cabinet/avocat data. Only the Docx pipeline had `collectData()`.
**After:** Both generate and preview endpoints now auto-call `collectBasicData(tenantId, userId)` (or `collectData(folderId, tenantId)` if a folder is specified), then merge user variables on top.

**Files:** `backend/src/routes/builder.routes.js`, `backend/src/services/template-engine.service.js`

### 5. blocksStructure Used blockTitle Instead of blockId
**Before:** The seed created templates with `blockTitle` references, but `generateDocument()` filtered on `item.blockId`, so no blocks were found.
**After:** Seed-builder resolves `blockTitle` to `blockId` using a title-to-ID mapping. Existing templates backfilled.

**Files:** `backend/prisma/seed-builder.js`

---

## New Features

### Variable Catalog (`GET /api/builder/variables`)
Complete catalog of ~74 template variables organized in 9 categories:

| Category | Count | Examples |
|----------|-------|---------|
| Cabinet | 12 | `cabinet.nom`, `cabinet.adresse`, `cabinet.cp`, `cabinet.ville` |
| Avocat | 9 | `avocat.nom_complet`, `avocat.barreau`, `avocat.toque` |
| Client PP | 16 | `client.nom_complet`, `client.adresse`, `client.profession` |
| Client PM | 7 | `client.raison_sociale`, `client.rcs`, `client.siret` |
| Dossier | 10 | `dossier.reference`, `dossier.juridiction`, `dossier.rg` |
| Parties | 6 | `parties_adverses.nom`, `parties_adverses.avocat_nom` |
| Societe | 6 | `societe.nom`, `societe.capital`, `societe.siege` |
| Dates | 3 | `date`, `date_jour_long`, `date_annee` |
| Postulant | 5 | `postulant.nom_complet`, `postulant.barreau` |

**File:** `backend/src/config/template-variables.js`

### collectBasicData() Function
New function that collects cabinet/avocat/date data without requiring a folder ID. Used by the Builder pipeline when no folder context is available.

**File:** `backend/src/services/template-engine.service.js`

### extractVariablesFull() Method
New extraction method that preserves full dot-notation paths (e.g., `cabinet.nom` instead of just `cabinet`). Used for variable display in the frontend and requiredVariables computation.

**File:** `backend/src/services/document-generator.service.js`

### Handlebars Helpers
Four helpers registered globally:
- `{{formatDate date}}` - French long date (e.g., "18 fevrier 2026")
- `{{formatMoney amount}}` - French currency format (e.g., "1 234,56 EUR")
- `{{uppercase text}}` - Uppercase
- `{{lowercase text}}` - Lowercase

**File:** `backend/src/services/document-generator.service.js`

### Auto-Extract Variables on Block CRUD
When creating or updating a block, if `variables` is not explicitly provided, the system automatically extracts them from the content using `extractVariablesFull()`.

**File:** `backend/src/routes/builder.routes.js`

### TemplateEditor Variable Panel
New right sidebar in the TemplateEditor with:
- Categorized variable browser (collapsible groups)
- Search/filter across all variables
- Click-to-insert at cursor position in free block textareas
- Variable tags displayed on library blocks

### Free Block (Bloc Libre) Support
New "Ajouter un bloc libre" button in the composition panel:
- Inline editable textarea for custom content
- Editable title
- "Save as custom block" to persist in the block library
- Variable insertion from the right panel

**Files:** `frontend/src/components/templates/TemplateEditor.jsx`, `frontend/src/components/templates/TemplateEditor.css`

---

## Files Modified

### Backend
| File | Changes |
|------|---------|
| `prisma/seed.js` | Updated tenant address to 1 Place du Ralliement, 49100 Angers |
| `prisma/seed-builder.js` | Added `extractVariablesFull()`, backfill variables on blocks, resolve `blockTitle` to `blockId`, compute `requiredVariables` |
| `src/config/template-variables.js` | **NEW** - Variable catalog with 74 variables in 9 categories |
| `src/services/template-engine.service.js` | Added `collectBasicData()`, `date_jour_long`, `date_annee` fields |
| `src/services/document-generator.service.js` | Added Handlebars helpers, `extractVariablesFull()` method |
| `src/routes/builder.routes.js` | Auto-extract variables on block CRUD, auto-inject context data in generate/preview, `GET /variables` endpoint |

### Frontend
| File | Changes |
|------|---------|
| `src/services/templateApi.js` | Added `getTemplateVariables()` |
| `src/components/templates/TemplateEditor.jsx` | Rewritten with variable panel + free block support |
| `src/components/templates/TemplateEditor.css` | Added styles for variable panel, free blocks, variable tags |

---

## Test Results

```
GET /api/builder/variables → 9 categories, 74 variables
POST /api/builder/preview  → Cabinet data auto-resolved:
  - Maître Bienaimé Yves-Marie
  - Barreau de Angers
  - 1 Place du Ralliement, 49100, Angers
  - 02 41 00 00 00

Blocks with extracted variables: 373/390 blocks backfilled
Templates with resolved blockIds: 7/7 (100%)
Templates with requiredVariables: 7/7 (100%)
```
