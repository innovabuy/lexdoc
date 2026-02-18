# Phase 2A — Wizard Création de Dossier — Rapport de Résultat

**Date** : 2026-02-06

---

## Critères de succès

| # | Critère | Statut |
|---|---------|--------|
| 1 | API POST /api/folders/wizard crée dossier + client + catégories + personnes + documents en une transaction | OK |
| 2 | Wizard 4 étapes navigable sans erreur | OK |
| 3 | Autocomplete client fonctionnel | OK |
| 4 | Champs conditionnels juridique/judiciaire | OK |
| 5 | Section parties prenantes (judiciaire) avec ajout/suppression | OK |
| 6 | Suggestion auto du titre | OK |
| 7 | Templates recommandés listés et cochables | OK |
| 8 | Création atomique + redirect vers vue dossier | OK |
| 9 | Build sans erreur | OK |
| 10 | Rapport PHASE_2A_RESULT.md | Ce fichier |

---

## Partie 1 — API Backend

### Nouvelles routes

| Méthode | Route | Description | Testé |
|---------|-------|-------------|-------|
| POST | `/api/folders/wizard` | Création atomique (transaction Prisma) | OK |
| PATCH | `/api/folders/:id/status` | Changement statut (OPEN, IN_PROGRESS, PENDING, CLOSED, ARCHIVED) | OK |
| GET | `/api/folders/next-reference` | Génère la prochaine référence (DOS-2026-XXXX) | OK |
| GET | `/api/templates/suggestions` | Templates suggérés selon type/nature (avec flag `recommended`) | OK |

### Création atomique (POST /api/folders/wizard)

La transaction Prisma exécute 9 opérations en une seule requête :

1. **Client** : récupère un client existant (par id) ou en crée un nouveau
2. **Référence** : génère `DOS-{année}-{compteur}` unique par tenant
3. **Dossier** : crée le folder avec mapping type (juridique→CONTRACT, judiciaire→LITIGATION)
4. **Catégories** : crée les FolderDocCategory depuis le FolderTreeTemplate par défaut
5. **Client FolderPerson** : ajoute le client comme personne liée (rôle CLIENT)
6. **Parties** : crée les PARTIE_ADVERSE, AVOCAT_ADVERSE, POSTULANT avec liaison avocat→partie
7. **Documents** : crée des documents placeholder (status DRAFT, fichier pending)
8. **Extranet** : active l'accès extranet client si demandé
9. **Timeline** : crée l'événement "dossier_cree"

### Tests API

```
NEXT-REFERENCE: DOS-2026-0024
TEMPLATE SUGGESTIONS: 1 template trouvé (Acte de cession, recommended=true)
WIZARD JURIDIQUE: DOS-2026-0024 → "Test Wizard Cession 2026" (CONTRACT, nature=cession)
WIZARD JUDICIAIRE: DOS-2026-0025 → "TechCorp c/ Durand 2026" (LITIGATION, juridiction=TJ)
  → 4 persons: CLIENT, PARTIE_ADVERSE, AVOCAT_ADVERSE, POSTULANT
  → 1 document placeholder
WIZARD NEW CLIENT: DOS-2026-0026 → "AGOA WizardTest2 2026" (CONTRACT, nature=agoa)
  → Client créé automatiquement + extranet activé
PATCH STATUS: OPEN → IN_PROGRESS → OPEN (OK)
```

---

## Partie 2 — Frontend

### Fichiers créés (3)

| Fichier | Description |
|---------|-------------|
| `frontend/src/services/foldersApi.js` | Service API (5 fonctions : createFolderWizard, getNextReference, getTemplateSuggestions, searchClients, patchFolderStatus) |
| `frontend/src/pages/folders/FolderCreateWizard.jsx` | Wizard 4 étapes (Client, Type, Informations, Récapitulatif) |
| `frontend/src/pages/folders/FolderCreateWizard.css` | Styles wizard (progress bar, cards, form, parties, templates, responsive) |

### Fichiers créés backend (1)

| Fichier | Description |
|---------|-------------|
| `backend/src/routes/template.routes.js` | Route GET /api/templates/suggestions |

### Fichiers modifiés (5)

| Fichier | Modification |
|---------|-------------|
| `backend/src/controllers/folder.controller.js` | +3 méthodes : createWizard, patchStatus, nextReference |
| `backend/src/routes/folder.routes.js` | +3 routes : POST /wizard, GET /next-reference, PATCH /:id/status |
| `backend/src/routes/index.js` | Enregistrement route /templates |
| `frontend/src/App.jsx` | Import FolderCreateWizard + route /dossiers/nouveau |
| `frontend/src/pages/Folders.jsx` | Bouton "Nouveau dossier" → navigate('/dossiers/nouveau') |
| `frontend/src/pages/Dashboard.jsx` | Quick action "Nouveau dossier" → /dossiers/nouveau |

### Wizard — Étape 1 : Client

- Champ de recherche avec autocomplete (debounce 300ms)
- Résultats : nom, email, type (PP/PM/Asso), complétude (%)
- Clic → sélection du client
- Avertissement si complétude < 50% (rouge, avec options "Compléter d'abord" / "Continuer")
- Création rapide inline (toggle PP/PM + nom + email)
- Bouton "Changer" pour désélectionner

### Wizard — Étape 2 : Type

- 2 grandes cartes cliquables : Juridique (Briefcase icon) / Judiciaire (Scale icon)
- Carte sélectionnée : bordure bleue + fond bleu clair
- Si judiciaire : radio group pour type de procédure (TJ, CA, TC, Référé, Recouvrement, Autre)

### Wizard — Étape 3 : Informations

- **Champs communs** : Titre (auto-suggéré), Description, Date ouverture (défaut: aujourd'hui), Date échéance
- **Juridique** : select Nature (7 options)
- **Judiciaire** : Juridiction (pré-rempli étape 2), N° RG, Chambre, Date audience
- **Parties prenantes** (judiciaire) :
  - Blocs répétables (ajout/suppression)
  - Select rôle (Partie adverse, Postulant, Témoin, Expert)
  - Champs : nom, prénom, email, adresse
  - Ajout avocat adverse optionnel (nom, cabinet, barreau, email)

### Wizard — Étape 4 : Récapitulatif

- **Templates recommandés** : liste cochable, pré-cochés si `recommended=true`
- **Option extranet** : checkbox pour activer l'accès client
- **Récapitulatif** : Client, Type, Titre, Ouverture, Juridiction, Parties, Documents, Extranet
- **Bouton "Créer le dossier"** : spinner + appel API + redirect vers /dossiers/:id

### Suggestion auto du titre

| Type | Nature | Suggestion |
|------|--------|-----------|
| Juridique | cession | "{Client} — Cession {année}" |
| Juridique | agoa | "AGOA {Client} {année}" |
| Juridique | création société | "Création société {Client} {année}" |
| Judiciaire | — | "{Client} c/ {Partie adverse} {année}" |

---

## Build

```
 1853 modules transformed
dist/index.html                   2.46 kB
dist/assets/index-C8wAKjVg.css   83.51 kB
dist/assets/index-BPMAxtDQ.js   571.88 kB
 built in 3.87s — 0 errors
```

## Tests backend

```
Test Suites: 9 passed, 9 total
Tests:       138 passed, 138 total — 0 regressions
```

---

**Phase 2A terminée avec succès.**
