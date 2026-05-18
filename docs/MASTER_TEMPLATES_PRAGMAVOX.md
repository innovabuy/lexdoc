# MASTER — Templates Pragmavox pour LexDoc

**Document de référence projet — version 1.2 — 2026-04-30**

> Ce document est la **source unique de vérité** pour l'intégration des templates du Cabinet Pragmavox dans LexDoc. Il consolide la convention de templating, le mapping des variables, l'audit des documents livrés, la liste des anomalies à corriger, et le plan d'attaque.
>
> **À mettre à jour à chaque livraison de nouveau template par Me Bienaime ou à chaque session de développement structurante.**
>
> **Changelog** :
> - v1.0 (2026-04-29 matin) : version initiale après Mission A.bis
> - v1.1 (2026-04-29 après-midi) : ajout Q7 (RGPD), Q8 (Backup), Q9 (Métadonnées typées) suite à inspection du legacy `legacy-typescript-feb-2026`
> - **v1.2 (2026-04-30) : Mission B Phase 1 livrée. Lettre de mission constitution intégrée end-to-end (template converti, pipeline opérationnel, document généré avec succès). Découverte et correction de 5 bugs structurels pré-existants. Ajout Q10-Q20 et section "Learnings Mission B Phase 1".**

---

## 1. Identité Cabinet Pragmavox (données de référence)

Données stables du cabinet, à injecter automatiquement dans tous les documents générés. Source : en-têtes des 3 templates livrés.

| Donnée | Valeur | Stockage LexDoc |
|---|---|---|
| Forme juridique | SELARL D'AVOCAT | `Tenant.formeJuridique` (existant) |
| Dénomination commerciale | PRAGMA VOX AVOCAT | `Tenant.nom` (existant) |
| Avocat plaidant | Maître Yves-Marie BIENAIME | `User` lié au tenant |
| Spécialités | Droit des sociétés, droit commercial, droit immobilier | `Tenant.specialites` ou métadonnée |
| Adresse | 11, rue Paul LANGEVIN | **`Tenant.addressLine1`** (à ajouter — migration draft) |
| Code postal / Ville | 49240 AVRILLE | `Tenant.codePostal` / `Tenant.ville` (existant) |
| Téléphone | 06.14.84.38.38 | `Tenant.telephone` (existant) |
| Email principal | ym.bienaime@pragmavox-avocat.fr | `Tenant.email` (existant) |
| Email secondaire | pragmavox.avocat@gmail.com | métadonnée |
| SIRET | 98260027200016 | `Tenant.siret` (existant) |
| N° TVA | FR25982600272 | **`Tenant.tva`** (à ajouter — migration draft) |
| Barreau | ANGERS | `User.barreau` ou `Tenant.barreau` |

**Médiateur de la consommation** (mentions obligatoires lettre de mission) :

- À renseigner par Me Bienaime : nom + prénom + barreau du médiateur
- Adresse postale fixe : `180 boulevard Haussmann, 75008 Paris`
- Email : `mediateur@mediateur-consommation-avocat.fr`
- Site : `https://mediateur-consommation-avocat.fr`

---

## 2. Convention de templating LexDoc

**Source de vérité** : `docs/TEMPLATING_CONVENTION.md` (Mission A, déjà commité).

Rappel des règles essentielles :

| Règle | Choix retenu | Justification |
|---|---|---|
| Moteur | `docxtemplater` + `PizZip` (pour `.docx`) ; Handlebars (pour HTML builder, hors scope Pragmavox) | Système 1 du legacy, 51 templates en prod |
| Syntaxe variables | `{namespace_variable}` aplatie underscore | 51 templates existants utilisent ce format ; `flattenObject()` permet aussi `{namespace.variable}` mais on garde l'underscore par cohérence |
| Boucles | `{#liste}...{/liste}` (paragraphLoop) | Engine docxtemplater supporte nativement |
| Helpers | Pas de helpers inline — pré-formatage côté données | Décision Mission A : dates, montants, civilités formatés AVANT injection |

**Convention de stockage des variables** (décidée pendant la revue Mission A.bis) :

| Catégorie | Critère | Stockage | Exemples |
|---|---|---|---|
| Cabinet / structurelle | Stable, mono-valeur, ≥3 templates | Modèle Prisma (`Tenant`, `User`) | `cabinet_tva`, `cabinet_siret`, `cabinet_adresse_ligne1` |
| Dossier-spécifique | Propre à un type de document | `Folder.additionalData` (JSON) | `dossier_forme_societe` |
| Volatile / ponctuelle | Saisie au moment de la génération | Body de requête | `dossier_date_signature`, `dossier_lieu_signature` |
| Composée | Dérivée de plusieurs champs | Calculée côté `collectData()` | `avocat_plaidant_civilite_nom` = "Maître " + User.nom |

---

## 3. État de chaque template livré

### 3.1 Lettre de mission — Constitution de société

| Attribut | Valeur |
|---|---|
| Fichier source | `lettre_de_mission_constitution_société.docx` |
| Catégorie | Contrats |
| Statut audit | ✅ Audité, mappé (cf. `docs/TEMPLATE_MAPPING.md`) |
| Statut conversion | ❌ Non converti |
| Variables identifiées | 30 (16 réutilisables + 14 nouvelles) |
| Anomalies bloquantes | 5 |
| Priorité | **PILOTE — à convertir en premier** |
| Use case | Création SAS / SARL / SCI — devis, honoraires, mandat |

**Variables principales** (mapping complet dans `TEMPLATE_MAPPING.md`) :

```
Cabinet (stable, depuis Tenant) :
  cabinet_nom, cabinet_forme_juridique, cabinet_siret, cabinet_tva
  cabinet_adresse_ligne1 ⚠ migration requise
  cabinet_code_postal, cabinet_ville, cabinet_telephone, cabinet_email
  cabinet_email_secondaire

Avocat plaidant (composé depuis User) :
  avocat_plaidant_civilite_nom, avocat_plaidant_barreau

Client (depuis Client) :
  client_civilite, client_nom_complet, client_adresse_complete

Dossier (mixte) :
  dossier_forme_societe ⚠ additionalData
  dossier_date_signature ⚠ body
  dossier_lieu_signature ⚠ body (default = cabinet_ville)

Honoraires (body de requête) :
  honoraires_montant_ht, honoraires_montant_tva, honoraires_montant_ttc
  honoraires_provision_ht, honoraires_provision_ttc

Médiateur (additionalData ou body) :
  mediateur_nom_complet, mediateur_barreau
```

### 3.2 Mise en demeure — Personne morale

| Attribut | Valeur |
|---|---|
| Fichier source | `MODELE_Mise_en_demeure_PERSONNE_MORALE.docx` |
| Catégorie | Courriers / Pré-contentieux |
| Statut audit | ⚠ Audit superficiel uniquement |
| Statut conversion | ❌ Non converti |
| Variables identifiées | ~25 (à mapper exhaustivement) |
| Anomalies bloquantes | 3 confirmées + collision client/adversaire |
| Priorité | **2 — après validation pilote** |
| Use case | Recouvrement de créance B2B sous 8 jours |

**Variables principales** (mapping à formaliser) :

```
Cabinet : idem lettre de mission
Avocat : idem
Dossier :
  dossier_reference_interne (mention "N/Réf"), dossier_reference_adverse ("V/Réf")

Client (mandant — créancier) :
  client_denomination, client_forme_juridique, client_capital_social
  client_siege_social, client_siren, client_rcs_ville

Adversaire (débiteur — destinataire) :
  adversaire_denomination, adversaire_adresse, adversaire_email

Litige :
  devis_numero, devis_date
  contrat_objet
  facture_numero, facture_date, facture_montant_ttc
  somme_due_ttc
```

**⚠ Particularité** : ce template a une variable **`{contrat_objet}`** très libre — texte multi-lignes décrivant la nature de la prestation. À typer comme `text` long dans la fixture.

### 3.3 Assignation en référé — Tribunal de Commerce

| Attribut | Valeur |
|---|---|
| Fichier source | `modele_Assignation_référé_COMMERCE.docm` (à convertir en .docx) |
| Catégorie | Actes de procédure |
| Statut audit | ⚠ Audit superficiel uniquement |
| Statut conversion | ❌ Non converti |
| Variables identifiées | ~30 (à mapper exhaustivement) |
| Anomalies bloquantes | 4 (dont .docm avec macros potentielles) |
| Priorité | **3 — chantier suivant** |
| Use case | Action en référé devant Tribunal Commerce avec représentation obligatoire |

**Variables principales** (mapping à formaliser) :

```
Cabinet et avocat plaidant : idem

Avocat postulant (NOUVEAU namespace) :
  avocat_postulant_societe, avocat_postulant_civilite_nom
  avocat_postulant_barreau, avocat_postulant_adresse

Client (demanderesse) :
  client_denomination, client_forme_juridique, client_capital_social
  client_siege_social, client_siren, client_rcs_ville

Adversaire (défenderesse) :
  adversaire_denomination, adversaire_forme_juridique
  adversaire_capital_social, adversaire_siege_social
  adversaire_siren, adversaire_rcs_ville

Procédure (NOUVEAU namespace) :
  procedure_tribunal_ville, procedure_tribunal_adresse
  procedure_audience_date_lettres, procedure_audience_date_chiffres
  procedure_audience_heure_lettres, procedure_audience_heure_chiffres
  procedure_an_lettres (année en lettres dans l'acte introductif)

Contenu juridique (saisi à la rédaction) :
  rappel_faits, discussion_droit, discussion_fait
  somme_provisionnelle_ttc, mise_en_demeure_date
  article_700_montant

Pièces (bordereau) :
  pieces[] = [{ numero, libelle }] ⚠ boucle, array non encore exposé côté collectData()
```

**⚠ Particularités** :
- Format `.docm` → contient potentiellement des macros VBA. **À convertir en `.docx` propre avant intégration**, pas d'audit de sécurité macros nécessaire si conversion bien faite.
- Le **bordereau de pièces** `pieces[]` n'est PAS exposé dans le `collectData()` actuel (cf. audit éditeur de blocs). Pour le pilote initial, on hardcode 2 pièces ; un sous-projet ultérieur exposera l'array correctement avec UI de sélection des `Document` taggés "pièce".

---

## 4. Anomalies du document source — par template

### 4.1 Anomalies communes aux 3 templates

| # | Anomalie | Sévérité | Action |
|---|---|---|---|
| A1 | Placeholders en parenthèses libres `(dénomination)` non parsables | 🔴 Bloquant | Réécriture en `{namespace_variable}` lors de la conversion |
| A2 | Collisions de noms (client vs adversaire — même variable `(dénomination)` pour les deux) | 🔴 Bloquant | Préfixage strict `client_` / `adversaire_` |
| A3 | Zones tabulées vides ou suites d'espaces sans nom | 🔴 Bloquant | Identification + nommage explicite |

### 4.2 Anomalies spécifiques

**Lettre de mission :**
- A4 — **Doublon bloc SELARL d'Avocat** dans l'en-tête : un bloc renseigné (SIRET 98260027200016, TVA FR25982600272) suivi d'un bloc vide (`SIRET :` / `TVA n° :`). À supprimer le bloc vide lors de la conversion.

**Mise en demeure :**
- A5 — **Trous tabulés multiples** dans la phrase "facture ____ du ____ pour un montant de ____ € TTC" — au moins 4 placeholders implicites à expliciter.

**Assignation référé :**
- A6 — **Format `.docm` avec macros potentielles** — à convertir en `.docx` clean via `soffice --headless --convert-to docx` puis vérification de l'absence de macro résiduelle.
- A7 — **Bordereau de pièces hardcodé** (`Pièce n°1`, `Pièce n°2`) — à transformer en boucle `{#pieces}...{/pieces}` à terme.

---

## 5. Convention de saisie pour Me Bienaime (futurs templates)

> **Document à fournir à Me Bienaime avant la livraison de nouveaux templates.**
> À glisser dans un mémo séparé d'1 page une fois le pilote validé.

### Trois règles

1. **Variables entre accolades simples avec underscore** : `{client_denomination}` au lieu de `(dénomination)`
2. **Préfixe systématique** selon le contexte :
   - `cabinet_` (données du cabinet — auto-injectées)
   - `avocat_plaidant_` / `avocat_postulant_`
   - `client_` (mandant)
   - `adversaire_` (partie adverse)
   - `dossier_` (référence dossier)
   - `procedure_` (acte judiciaire — tribunal, audience)
   - `honoraires_` (lettre de mission, devis)
   - `mediateur_` (mentions médiation conso)
3. **Aucune zone vide** : tout placeholder a un nom (pas de `____`, pas de tabulations sans variable nommée).

### Exemples avant/après

| ❌ Avant | ✅ Après |
|---|---|
| `Société (dénomination)` | `Société {client_denomination}` |
| `Facture _____ du _____ pour _____ € TTC` | `Facture {facture_numero} du {facture_date} pour {facture_montant_ttc} € TTC` |
| `Maître (nom prénom du médiateur)` | `Maître {mediateur_nom_complet}` |

### Liste de variables réutilisables

Avant de créer une nouvelle variable, vérifier qu'elle n'existe pas déjà dans `docs/TEMPLATE_MAPPING.md`. Liste maintenue à jour à chaque template ajouté.

### Validation automatique côté LexDoc

À l'upload d'un nouveau template par le cabinet (route `POST /api/templates/:id/upload-source`), un script `validateTemplate(file.docx)` doit vérifier :

- ✅ Toutes les variables sont au format `{namespace_variable}` (regex stricte)
- ❌ Aucune parenthèse suspecte `(...)` non échappée dans le corps du document
- ❌ Aucune suite de tabulations ou espaces ≥4 entre deux variables (placeholder vide probable)
- ✅ Toutes les variables utilisées sont déclarées dans le mapping autorisé

Si le template ne passe pas la validation → refus avec rapport d'erreur clair pointant les lignes/zones problématiques.

---

## 6. Plan d'attaque

### Phase 1 — Pilote lettre de mission (Mission B)

**Objectif** : valider la chaîne complète de conversion + génération + signature visuelle pour 1 template.

**Pré-requis** :
- ✅ Convention de templating (Mission A) — fait
- ✅ Mapping (Mission A) — fait
- 🔄 Migration `Tenant.tva` + `Tenant.addressLine1` — draft, non appliquée

**Livrables attendus** :
1. `backend/templates/pragmavox/lettre_mission_constitution.docx` — template converti et nettoyé
2. Fixture de test `__fixtures__/lettre_mission_test_data.json`
3. Service `templateRenderer.js` (réutilisable pour tous les templates)
4. Route `POST /api/templates/lettre-mission/preview`
5. Tests : variables résolues à 100%, doublon SELARL absent, formatage dates/montants correct
6. PDF de validation visuelle envoyé à Me Bienaime

**Critère de succès** : Me Bienaime valide le rendu et confirme que le document est utilisable en production.

### Phase 2 — Mise en demeure

**Démarrage** : après validation Me Bienaime du pilote.

**Spécificités** :
- Audit complet du source (mapping exhaustif, identification des trous tabulés)
- Réutilisation maximale des variables Phase 1 (cabinet, avocat, client si personne morale)
- Nouveau modèle ou structure pour `adversaire_*` et `litige_*` (à décider lors du mapping)

### Phase 3 — Assignation référé

**Démarrage** : après Phase 2 stable.

**Spécificités** :
- Conversion `.docm` → `.docx` avec audit anti-macro
- Nouveau namespace `procedure_*`
- Décision à trancher : `pieces[]` exposé en boucle dès le départ, ou hardcodé pour le pilote ?
- Si exposé : extension de `collectData()` (sous-projet) + UI de sélection des `Document` taggés "pièce"

### Phase 4 — Industrialisation

**Pré-requis** : 3 templates en production, validés par Me Bienaime.

**Actions** :
1. Rédaction du **mémo de convention de saisie** pour Me Bienaime (1 page, à partir de la section 5 ci-dessus)
2. Implémentation du `validateTemplate()` côté backend
3. Documentation utilisateur cabinet : "Comment ajouter un nouveau template à LexDoc"
4. Démarrage de la livraison incrémentale par Me Bienaime des templates suivants

---

## 7. Décisions à prendre / Questions ouvertes

| # | Sujet | Question | Décision attendue de | Statut |
|---|---|---|---|---|
| Q1 | Migration draft `_DRAFT_template_fields` | Appliquer maintenant ou attendre la fin de la conversion pilote ? | Jeff | ✅ **RÉSOLUE Mission B** : appliquée le 2026-04-29 (migration `202604291435_add_tenant_template_fields`), 4 champs Tenant ajoutés (`tva`, `addressLine1`, `mediateurNomComplet`, `mediateurBarreau`) en convention camelCase pure |
| Q2 | Système 2 (Builder HTML/Handlebars) | 214 templates en BD, 0 cabinet utilisateur — vivant ou mort ? | Jeff | Ouverte |
| Q3 | Système 3 (Editor blocs DOCX) | 0/51 templates utilisent `Template.blocks` — câbler ou retirer ? | Jeff | Ouverte |
| Q4 | `pieces[]` dans `collectData()` | Exposer dès la Phase 3 ou laisser hardcodé pour le pilote ? | Jeff (après Phase 2) | Reportée |
| Q5 | Combien de templates Me Bienaime fournira-t-il au total ? | 5 / 20 / 50+ ? Détermine la stratégie de validation. | Me Bienaime | À demander |
| Q6 | DocuSign vs reluctance Me Bienaime | Faut-il revenir à la charge sur l'intégration signature ? | Jeff (après pilote) | Reportée |
| Q7 | **Conformité RGPD** | Modèles RGPD complets (RgpdConsent / RgpdDataRequest art. 15-16-17-20-21 / RgpdDataRetention) absents du VPS. Inspiration : `instruction-10-rgpd.md` du legacy. **Risque légal majeur** pour un cabinet d'avocats. À mettre en place AVANT que Me Bienaime ne traite des dossiers de vrais clients. | Jeff | **Backlog P0 (avant go-live réel)** |
| Q8 | **Backup automatique** | Aucun backup automatique externe en place actuellement (snapshot tar local manuel uniquement). Inspiration : `instruction-13-backup-google-drive.md` du legacy (Google Drive OAuth2 + cron quotidien/hebdo/mensuel). **Risque ops critique** : perte de données = perte de cabinet. À mettre en place AVANT confiance données réelles. **Aggravation découverte Mission B** : le cron PG existant (`pg_dump`) est cassé (bug `?schema=public` mal échappé), donc même les snapshots locaux ne se font pas correctement. | Jeff | **Backlog P0 (avant go-live réel)** |
| Q9 | Métadonnées dossier typées par type | Aujourd'hui : `Folder.additionalData` en JSON brut. Inspiration : `instruction-07-metadata-autofill.md` du legacy = schéma typé Zod par `FolderType`. **Décision pour Mission B : on reste en JSON brut**, refacto envisagée post-pilote si nombre de types de dossiers ≥5. | Jeff (post-pilote) | Reportée |
| **Q10** | **Variabilisation cabinet pour multi-tenant** | Le template Pragmavox a l'identité cabinet (Yves-Marie BIENAIME, 11 rue Paul LANGEVIN, etc.) **codée en dur dans le header**, pas via `{cabinet_*}`. Inutilisable tel quel pour un autre cabinet. À industrialiser quand un 2e cabinet rejoint LexDoc. | Jeff (post-pilote) | Backlog P3 |
| **Q11** | **Activer `folderNature`** | Aujourd'hui NULL pour les 54 templates. Permettrait du filtrage UI (ex : "templates pour dossiers de constitution"). À activer quand ≥3 templates par nature de dossier. | Jeff | Backlog P3 |
| **Q12** | **Identité du médiateur national consommation avocats** | Champs `Tenant.mediateurNomComplet` et `Tenant.mediateurBarreau` actuellement NULL pour Pragmavox. Mention obligatoire (art. L. 612-1 Code conso). Apparaît en `[A COMPLETER]` dans les documents générés tant que non renseigné. | Me Bienaime | **À demander avant go-live réel** |
| **Q13** | **Ordre `enrichComputedFields` / `findMissingFields`** | Actuellement `findMissingFields` est appelé AVANT `enrichComputedFields`. Conséquence : impossible de déclarer un champ calculé comme `required` (il n'existe pas encore au moment du check). Sémantiquement correct serait l'inverse. À refacto post-pilote, mais risque de régression sur les 53 templates existants. | Jeff (post-pilote) | Backlog P3 |
| **Q14** | **`mentionsLegales` JSONB vs string** | `Tenant.avocat_legal_info.mentionsLegales` est stocké en JSONB (objet structuré), mais `applyBranding()` le consomme comme string → bug pré-existant. Helper `formatMentionsLegales()` ajouté en Mission B comme palliatif. Refacto schéma propre = colonne dérivée `mentionsLegalesText` ou serializer Prisma custom. | Jeff (post-pilote) | Backlog P3 |
| **Q15** | **Templates Pragmavox absents de MinIO** | Les templates Pragmavox déposés en filesystem (`backend/templates/pragmavox/`) ne sont pas dans le bucket MinIO `lexdoc-dev`. Le pipeline retombe sur le fallback filesystem (logge un warn). Choix : (a) synchroniser MinIO, (b) bypasser MinIO pour les templates système, (c) status quo. | Jeff (post-pilote) | Backlog P2 |
| **Q16** | **Monitoring d'erreurs (Sentry)** | `SENTRY_DSN not configured` dans les logs. Aucune alerte sur incidents. Conséquence visible Mission B : l'API a été down ~2 mois (PM2 sur mauvais entry point) sans que personne ne le sache. À mettre en place avec un seuil d'alerte minimal (5xx, crashloop). | Jeff | **Backlog P1** |
| **Q17** | **Trust proxy Express** | Warnings `X-Forwarded-For` / `trust proxy` dans les logs PM2 — Express ne sait pas qu'il est derrière nginx, donc le rate limiter compte les requêtes par IP nginx au lieu de l'IP cliente. Pas critique tant qu'il n'y a pas d'attaque, mais devrait être configuré. | Jeff (post-pilote) | Backlog P3 |
| **Q18** | **Format `additionalData` à documenter pour API consumers** | La route `POST /api/templates/generate` attend `additionalData` en **dot-notation littérale** : `{"dossier.forme_societe": "SAS"}`, **PAS** d'objet imbriqué (`{"dossier": {...}}` était silencieusement ignoré jusqu'à fix Mission B Q19). À documenter pour le frontend et toute API consumer. | Jeff | **Backlog P1** (à documenter avant que le frontend tape dedans) |
| **Q19** | **`mergeAdditionalData` auto-create section** | Bug DX pré-existant : `mergeAdditionalData` skippait silencieusement les sections non déclarées dans `collectData`. Fix Mission B : auto-création + `console.warn` traçable. À surveiller : si le warn devient bruyant, c'est qu'on a oublié de déclarer une section dans `collectData`. | — | ✅ **Fixé Mission B** |
| **Q20** | **Industrialisation conversion XML** | La conversion XML d'un template `.docx` Word → template LexDoc est aujourd'hui artisanale (script Python ad-hoc, identification manuelle des paraIds à supprimer, etc.). À chaque nouveau template Pragmavox il faut refaire le travail. Pour ≥5 templates, créer un script générique `convert_template.py` paramétrable. | Jeff (Mission B Phase 2+) | Reportée |

---

## 8. Pieds de page utiles

**Fichiers de référence projet** :
- `docs/TEMPLATING_CONVENTION.md` (203 lignes, v1.0)
- `docs/TEMPLATE_MAPPING.md` (299 lignes, v1.0)
- `backend/prisma/migrations/202604291435_add_tenant_template_fields/migration.sql` (✅ appliquée Mission B)
- `backend/prisma/seeds/pragmavox_template.sql` (✅ seed du Template Pragmavox, idempotent)
- `backend/templates/pragmavox/lettre_mission_constitution.template.docx` (✅ template converti, SHA-256 `194c0a9f...67de77`)
- `backend/templates/pragmavox/lettre_mission_constitution.docx` (source intacte, SHA-256 `bc29eb49...0601e9`)
- `MASTER_TEMPLATES_PRAGMAVOX.md` (ce document, v1.2)

**Légende** :
- ✅ Fait
- ⚠ Partiel ou à vérifier
- ❌ Non fait
- 🔴 Bloquant
- 🔄 En cours

---

## 9. Learnings Mission B Phase 1 (session 2026-04-30)

Cette section documente les apprentissages structurants de la session de livraison Mission B Phase 1. À conserver pour comprendre les choix faits, et pour informer les futures sessions de Mission B Phase 2 et 3.

### 9.1 — Bilan factuel

**Livré** :
- 1 template Pragmavox (lettre de mission constitution) intégré end-to-end dans le pipeline LexDoc
- 4 commits propres sur master (C1 tenant, C2 engine, C3 artefacts, C-bis gitignore) + tag `v0.2.0-mission-b-phase-1` à venir
- Migration Prisma `202604291435_add_tenant_template_fields` (4 champs Tenant)
- Premier `.docx` généré par le pipeline avec valeurs réelles, validé visuellement

**Tests** : 138/138 passants à chaque étape, 0 régression introduite.

**Effort** : ~10h de session continue, structurée en 7 sous-stages avec STOPs intermédiaires.

### 9.2 — Bugs structurels pré-existants découverts (et corrigés)

Mission B a servi de révélateur. **5 bugs vivaient dans le code sans être détectés** :

| Bug | Origine | Détection | Fix |
|---|---|---|---|
| PM2 sur mauvais entry point (`src/app.js` au lieu de `src/server.js`) | ~6 février 2026 (date des derniers logs error) | Stage 2.4.D au moment d'appeler l'API pour la première fois | `pm2 delete && pm2 start ecosystem.config.js` |
| `applyBranding()` plante sur `mentionsLegales` (objet vs string) | Schéma JSONB introduit après le code consommateur | Première génération de document (HTTP 500) | Helper `formatMentionsLegales()` |
| `mergeAdditionalData` skip silencieux des sections non déclarées | Pré-existant, jamais documenté | Premier appel `/generate` avec sections non pré-déclarées | Auto-création + `console.warn` |
| `collectData` ne pré-initialise pas les sections introduites par les nouveaux templates | Architecture trop rigide | Premier `.docx` généré avec `[A COMPLETER]` au lieu des montants | Pré-init explicite `data.honoraires = {}; data.provision = {};` |
| Cron PG backup cassé (`?schema=public` mal échappé dans URL DATABASE_URL) | Antérieur à février 2026 | Logs PM2 au moment du fix entry point | À corriger en P1 (cf. Q8) |

**Conclusion structurelle** : ces 5 bugs prouvent que l'API n'a pas servi à générer un seul document depuis février 2026. La stack était techniquement en bon état (code propre, BDD intègre, infra stable), mais **personne ne l'utilisait vraiment**. C'est une remise en perspective importante du statut "en production" du projet.

### 9.3 — Méthode opérationnelle qui a marché

Le pattern qui a permis de boucler proprement Mission B Phase 1 sans régression :

1. **STOPs intermédiaires systématiques** entre chaque sous-stage. Pas de "tout enchaîner d'un coup". À chaque STOP, validation humaine avant de continuer.
2. **Non-régression mesurée** à chaque modification structurante : `npm test` après chaque patch, baseline 138/138 préservée.
3. **Backups préventifs** systématiques : `pg_dump` avant migration, copies `.bak-*` avant patch fichier, snapshots /tmp avant commit.
4. **Vérification 3 couches** (BDD / ORM / code applicatif) avant toute proposition de schéma. Évite les erreurs de convention (cf. snake_case vs camelCase).
5. **Distinction "sur" / "probable" / "hypothèse"** dans les affirmations. Quand le coût de vérification est faible (30 sec), on vérifie plutôt que présumer.
6. **Validation visuelle finale** : ne pas se contenter de "HTTP 201" comme preuve de succès. Télécharger le `.docx` et inspecter le contenu réel a révélé les bugs structurels (sections non substituées) qu'aucun statut HTTP n'aurait montrés.

### 9.4 — Patterns à appliquer en Phase 2 et 3

Pour la conversion des 2 templates restants (mise en demeure, assignation référé) :

1. **Réutiliser le script `convert_lettre_mission.py`** (archivé en `/tmp/` snapshot) en l'adaptant aux nouveaux paraIds vides à supprimer et aux nouveaux mappings de placeholders. Cf. Q20 pour industrialisation à terme.
2. **Pré-déclarer dans `collectData`** toute nouvelle section métier introduite (ex: `data.facture = {}` pour mise en demeure). Le warn `Auto-creating section` du fix Q19 indique qu'on a oublié de le faire.
3. **Tester end-to-end** dès la fin de la conversion XML (ne pas attendre Phase 3 pour découvrir un bug Phase 2). Une commande `curl` + un `python-docx` inspection = 5 minutes de validation supplémentaires qui économisent des heures de débug.
4. **Documenter les variables additionnelles** dans le master (section 4 Convention de saisie pour Me Bienaime) au moment où on les ajoute, pas après.
5. **Tag git après chaque Phase** validée (`v0.2.0-mission-b-phase-1`, `v0.3.0-mission-b-phase-2`, etc.) pour rollback aisé.

### 9.5 — État du pilote au 2026-04-30

| Élément | Statut |
|---|---|
| API LexDoc (port 4000) | ✅ Online, 0 crash |
| Migration Tenant Mission B | ✅ Appliquée |
| Tenant Pragmavox | ✅ tva + addressLine1 peuplés ; mediateur* NULL (cf. Q12) |
| Template Pragmavox lettre de mission | ✅ Converti, déposé filesystem, seedé en BDD (`cml-pragmavox-lm-constitution-v1`) |
| Pipeline `/api/templates/generate` | ✅ Fonctionnel end-to-end avec données réelles |
| Tests | ✅ 138/138 passants |
| Master doc | ✅ v1.2 |
| Backup PG | ⚠ Manuel ; cron auto cassé (Q8) |
| Monitoring d'erreurs | ❌ Sentry non configuré (Q16) |
| Templates Phase 2 (mise en demeure) | ❌ Source déposé, conversion à faire |
| Templates Phase 3 (assignation référé) | ❌ Source déposé, conversion à faire |
| Médiateur (mention légale obligatoire) | ❌ NULL — bloquant pour go-live réel (Q12) |
| RGPD | ❌ Modèles absents (Q7) — bloquant pour go-live réel |

**Lecture** : Phase 1 livrée techniquement, mais **3 prérequis P0 restent à traiter avant un go-live réel avec Me Bienaime sur de vrais clients** : Q7 (RGPD), Q8 (backup auto), Q12 (médiateur). Plus deux Phases techniques à compléter (mise en demeure, assignation).

---

## 10. Syntaxe loops (collections itérables)

*Ajouté 2026-05-18 — Mission B Phase 3 B1.B*

Le moteur de templates LexDoc utilise **Docxtemplater 3.67.x** avec `paragraphLoop: true`. La syntaxe des boucles n'est **pas** Handlebars (`{{#each}}`) — elle est spécifique à Docxtemplater.

### Syntaxe correcte

```
{#parties_adverses}
Partie : {prenom} {nom}, demeurant {adresse}.
{/parties_adverses}
```

- Ouverture : `{#nom_collection}` (un dièse)
- Fermeture : `{/nom_collection}`
- Accès aux propriétés dans la boucle : directement par nom de champ — `{prenom}`, **pas** `{this.prenom}` ni `{{prenom}}`
- `paragraphLoop: true` (activé par défaut côté service) fait que chaque itération produit un paragraphe Word complet

### Collections actuellement disponibles

| Variable | Source | Champs |
|---|---|---|
| `parties_adverses` | `folder.persons` filtré sur role `PARTIE_ADVERSE` | `nom`, `prenom`, `adresse`, `email`, `telephone`, `avocat_nom`, `avocat_cabinet`, `avocat_barreau`, `avocat_email` |
| `co_debiteurs` | `folder.persons` filtré sur role `CO_DEBITEUR` | `nom`, `prenom`, `raison_sociale`, `adresse`, `code_postal`, `ville`, `email`, `telephone` |

(à compléter au fur et à mesure que de nouvelles collections sont câblées dans `collectData()` — voir `backend/src/services/template-engine.service.js` L145)

### Pièges courants

- **Ne pas mélanger les délimiteurs** : Docxtemplater utilise `{}` simple-brace pour les variables et `{#}{/}` pour les loops. Ne **jamais** écrire `{{var}}` (Handlebars/Jinja syntax) — ça ne sera pas interpolé.
- **`paragraphLoop: true`** : entre les marqueurs `{#parties_adverses}` et `{/parties_adverses}`, mettre les délimiteurs sur des paragraphes Word distincts du contenu, sinon Word peut introduire des artefacts XML.
- **Si la collection est vide** : tout le bloc loop est omis silencieusement, aucun paragraphe résiduel. Comportement souhaité dans la plupart des cas.

### Exemple de référence

Voir `backend/tests/fixtures/template-loops-example.docx` (généré par `backend/scripts/generate-template-loops-example.js`) et les 3 tests unitaires dans `backend/tests/unit/template-engine-loops.test.js` :
- `parties_adverses: []` → bloc loop omis
- `parties_adverses: [{...}, {...}]` → 2 paragraphes rendus
- `parties_adverses: [{...}]` (1 entrée) → 1 paragraphe rendu, pas de crash

---

*Fin du master v1.2 — 2026-04-30.*
