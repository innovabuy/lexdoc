# Convention de Templating LexDoc

> Version 1.0 — 2026-04-24

## 1. Moteurs de rendu

| Pipeline | Moteur | Syntaxe variables | Fichier service |
|----------|--------|-------------------|-----------------|
| **Templates .docx** | docxtemplater 3.x + PizZip | `{variable}` | `src/services/template-engine.service.js` |
| **Builder HTML** | Handlebars 4.x | `{{variable}}` | `src/services/document-generator.service.js` |
| **HTML → PDF** | Puppeteer (headless Chrome) | N/A | `src/services/html-to-pdf.service.js` |

La suite de ce document concerne exclusivement le pipeline **Templates .docx** (docxtemplater), qui est celui utilisé pour les lettres de mission et documents juridiques à mise en forme complexe.

## 2. Syntaxe des variables dans les .docx

### 2.1 Notation aplatie avec underscore (OBLIGATOIRE)

Les templates .docx utilisent **exclusivement** la **notation aplatie avec underscore** :

```
{cabinet_nom}           ← pas {cabinet.nom}
{client_nom_complet}    ← pas {client.nom_complet}
{dossier_reference}     ← pas {dossier.reference}
```

**Choix retenu et justification** :

Bien que docxtemplater supporte nativement la notation pointée (`{cabinet.nom}`), le projet LexDoc utilise la notation aplatie pour les raisons suivantes :

1. **Cohérence** : les 51 templates .docx existants dans `backend/templates/` utilisent tous la notation underscore (0 utilise la notation pointée — vérifié par audit exhaustif le 2026-04-24).
2. **Production active** : ces templates sont servis par la route `POST /api/templates/generate` avec fallback MinIO → filesystem local. Ils ne sont pas legacy.
3. **Mécanique** : `flattenObject()` dans `template-engine.service.js` injecte les deux formes (aplatie + imbriquée) dans les données de rendu. La notation aplatie est celle qui est garantie de fonctionner dans tous les cas, y compris si un namespace contient lui-même un underscore (ex: `avocat_plaidant_barreau`).

Tout nouveau template (y compris Pragmavox) DOIT suivre cette convention.

### 2.2 Boucles (listes)

Pour itérer sur des tableaux (ex: parties adverses) :

```
{#parties_adverses}
  Nom : {nom} — Avocat : {avocat_nom}
{/parties_adverses}
```

### 2.3 Sections conditionnelles

```
{#client_type}          ← affiché si la valeur est truthy
  Type : {client_type}
{/client_type}
```

### 2.4 Valeurs manquantes

Les variables non résolues sont remplacées par `[A COMPLETER]` (cf. `nullGetter` dans le service). Ce comportement est voulu pour permettre la complétion manuelle.

## 3. Espaces de noms (namespaces)

Le catalogue complet est défini dans `src/config/template-variables.js`.

### 3.1 Namespaces existants

| Namespace | Préfixe aplati | Source Prisma | Description |
|-----------|---------------|---------------|-------------|
| `cabinet` | `cabinet_` | `Tenant` | Identité du cabinet |
| `avocat` | `avocat_` | `User` (créateur) | Avocat en charge |
| `client` | `client_` | `Client` | Client (PP ou PM) |
| `dossier` | `dossier_` | `Folder` | Dossier juridique |
| `societe` | `societe_` | `Client` (si PM) | Info société cliente |
| `postulant` | `postulant_` | `FolderPerson` (role POSTULANT) | Avocat postulant |
| `parties_adverses` | — (tableau) | `FolderPerson` (role PARTIE_ADVERSE) | Parties adverses |
| *(racine)* | `date`, `date_jour_long`, `date_annee` | Calculé | Dates du jour |

### 3.2 Namespaces à ajouter (Mission B)

| Namespace | Préfixe aplati | Source | Description |
|-----------|---------------|--------|-------------|
| `honoraires` | `honoraires_` | Données saisies / dossier | Montants HT, TVA, TTC, provision |
| `mediateur` | `mediateur_` | Données saisies | Médiateur de la consommation |
| `avocat_plaidant` | `avocat_plaidant_` | User + Tenant | Avocat plaidant (civilité + barreau) |

## 4. Convention de nommage des variables

### 4.1 Règles

1. **snake_case** partout : `nom_complet`, pas `nomComplet`
2. **Préfixe = namespace** : `cabinet_siret`, `client_email`
3. **Pas d'abréviation ambiguë** : `telephone` (pas `tel`), `adresse` (pas `adr`)
4. **Suffixe `_ht`, `_ttc`, `_tva`** pour les montants fiscaux
5. **Suffixe `_fr`** réservé pour les valeurs déjà formatées en français

### 4.2 Exemples de nommage

```
cabinet_nom              ← Nom commercial
cabinet_raison_sociale   ← Dénomination légale complète
cabinet_siret            ← N° SIRET
cabinet_tva              ← N° TVA intracommunautaire (nouveau)
cabinet_adresse          ← Adresse complète (ligne unique)
cabinet_adresse_ligne1   ← Première ligne d'adresse (nouveau)
cabinet_cp               ← Code postal
cabinet_ville            ← Ville

honoraires_montant_ht    ← Montant HT (nombre)
honoraires_montant_tva   ← Montant TVA (nombre)
honoraires_montant_ttc   ← Montant TTC (nombre)
honoraires_provision_ht  ← Provision demandée HT
honoraires_provision_ttc ← Provision demandée TTC
```

## 5. Helpers de formatage

### 5.1 Helpers Handlebars (Builder HTML uniquement)

Définis dans `document-generator.service.js` :

| Helper | Usage | Entrée | Sortie |
|--------|-------|--------|--------|
| `formatDate` | `{{formatDate date}}` | `2026-04-24` | `24 avril 2026` |
| `formatMoney` | `{{formatMoney montant}}` | `2500` | `2 500,00 €` |
| `uppercase` | `{{uppercase texte}}` | `dupont` | `DUPONT` |
| `lowercase` | `{{lowercase texte}}` | `DUPONT` | `dupont` |

### 5.2 Formatage dans les templates .docx

Docxtemplater **ne supporte pas les helpers inline** comme Handlebars. Le formatage doit être fait **côté données** avant le rendu :

1. **Dates** : Convertir en format français dans `collectData()` via `toLocaleDateString('fr-FR')` ou la fonction `date_jour_long`
2. **Montants** : Formater dans le service de rendu avant injection (ex: `2500` → `"2 500,00 €"`)
3. **Majuscules** : Appliquer côté données si nécessaire

**Convention pour la Mission B** : Le service `templateRenderer.js` devra pré-formater les données avant injection dans docxtemplater. Les fonctions de formatage à implémenter :

```javascript
// Helpers à créer dans templateRenderer.js
function formatDateFr(dateStr)    // "2026-04-24" → "24 avril 2026"
function formatMontantEur(amount) // 2500 → "2 500,00 €"
function formatUpper(str)         // "dupont" → "DUPONT"
```

## 6. Règles de stockage des variables

Chaque variable de template doit être classée dans l'une des 3 catégories suivantes. Cette classification détermine où la donnée est stockée et comment elle est alimentée lors du rendu.

| Catégorie | Critère | Stockage | Exemples |
|---|---|---|---|
| **Cabinet / structurelle** | Stable, mono-valeur, utilisée par ≥3 templates | Colonne dédiée dans un modèle Prisma (`Tenant`, `User`) | `cabinet_tva`, `cabinet_siret`, `cabinet_adresse_ligne1` |
| **Dossier-spécifique** | Propre à un type de document, variable entre dossiers | `Folder.additionalData` (champ JSON existant) | `dossier_forme_societe` |
| **Volatile / ponctuelle** | Saisie au moment de la génération, ne persiste pas d'un rendu à l'autre | Body de la requête POST (champ `additionalData`) | `dossier_date_signature`, `dossier_lieu_signature`, `honoraires_*`, `mediateur_*` |

### Règles de décision

1. **Migration Prisma** uniquement si la donnée est stable ET réutilisée par ≥3 templates. Toute migration requiert validation humaine explicite avant application.
2. **`Folder.additionalData`** pour les données propres au dossier mais pas assez génériques pour justifier une colonne. Clé JSON au format `namespace.variable` (ex: `"forme_societe": "SAS"`).
3. **Body requête** pour tout ce qui est calculé ou saisi à la volée (dates de signature, montants d'honoraires). Ces données ne sont pas persistées — elles sont injectées uniquement pour le rendu en cours.
4. **Dérivé** : certaines variables sont composées à partir de champs existants (ex: `avocat_plaidant_civilite_nom` = `"Maître " + User.firstName + " " + User.lastName`). Aucun stockage supplémentaire requis.

## 7. Structure des fichiers templates

```
backend/
  templates/
    *.docx                          ← Templates système (existants)
    pragmavox/                      ← Templates spécifiques Pragmavox (Mission B)
      lettre_mission_constitution.docx
      __fixtures__/
        lettre_mission_test_data.json
```

## 8. Cycle de vie d'un template

1. **Création** : Le fichier .docx source est créé/converti avec les placeholders `{variable}`
2. **Upload** : Via `POST /api/templates/:id/upload-source` → stocké dans MinIO
3. **Fallback local** : Si MinIO échoue, le système cherche dans `backend/templates/`
4. **Rendu** :
   - `collectData(folderId, tenantId)` → rassemble les données depuis Prisma
   - `generateDocument(templateBuffer, data)` → remplace les variables dans le .docx
   - `applyBranding(buffer, data)` → injecte logo header + mentions légales footer
5. **Stockage** : Le document généré est stocké dans MinIO + enregistré en base (model `Document`)

## 9. Gestion des erreurs

| Situation | Comportement |
|-----------|-------------|
| Variable manquante dans les données | Remplacée par `[A COMPLETER]` |
| Variable requise manquante | Retour `{ status: 'missing_fields', fields: [...] }` avant génération |
| Fichier template introuvable | Erreur `BadRequestError('Template source file not found')` |
| Données supplémentaires fournies | Fusionnées via `mergeAdditionalData()` |

## 10. Règles de non-régression

- Tout nouveau template doit être accompagné de tests
- Les tests doivent vérifier : rendu sans erreur, aucune variable non résolue, formatage correct
- L'ajout de nouvelles variables dans `template-variables.js` ne doit jamais modifier le comportement des variables existantes
- L'ajout d'un nouveau namespace dans `collectData()` ne doit jamais casser les namespaces existants (ajout uniquement)

## 11. Référence : Catalogue des variables

Voir `src/config/template-variables.js` pour le catalogue complet et à jour.

Voir `docs/TEMPLATE_MAPPING.md` pour le mapping spécifique du template Pragmavox "Lettre de mission — Constitution de société".
