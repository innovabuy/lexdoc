# MASTER — Templates Pragmavox pour LexDoc

**Document de référence projet — version 1.1 — 2026-04-29**

> Ce document est la **source unique de vérité** pour l'intégration des templates du Cabinet Pragmavox dans LexDoc. Il consolide la convention de templating, le mapping des variables, l'audit des documents livrés, la liste des anomalies à corriger, et le plan d'attaque.
>
> **À mettre à jour à chaque livraison de nouveau template par Me Bienaime.**
>
> **Changelog** :
> - v1.0 (2026-04-29 matin) : version initiale après Mission A.bis
> - v1.1 (2026-04-29 après-midi) : ajout Q7 (RGPD), Q8 (Backup), Q9 (Métadonnées typées) suite à inspection du legacy `legacy-typescript-feb-2026`

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
| Q1 | Migration draft `_DRAFT_template_fields` | Appliquer maintenant ou attendre la fin de la conversion pilote ? | Jeff | Ouverte |
| Q2 | Système 2 (Builder HTML/Handlebars) | 214 templates en BD, 0 cabinet utilisateur — vivant ou mort ? | Jeff | Ouverte |
| Q3 | Système 3 (Editor blocs DOCX) | 0/51 templates utilisent `Template.blocks` — câbler ou retirer ? | Jeff | Ouverte |
| Q4 | `pieces[]` dans `collectData()` | Exposer dès la Phase 3 ou laisser hardcodé pour le pilote ? | Jeff (après Phase 2) | Reportée |
| Q5 | Combien de templates Me Bienaime fournira-t-il au total ? | 5 / 20 / 50+ ? Détermine la stratégie de validation. | Me Bienaime | À demander |
| Q6 | DocuSign vs reluctance Me Bienaime | Faut-il revenir à la charge sur l'intégration signature ? | Jeff (après pilote) | Reportée |
| Q7 | **Conformité RGPD** | Modèles RGPD complets (RgpdConsent / RgpdDataRequest art. 15-16-17-20-21 / RgpdDataRetention) absents du VPS. Inspiration : `instruction-10-rgpd.md` du legacy. **Risque légal majeur** pour un cabinet d'avocats. À mettre en place AVANT que Me Bienaime ne traite des dossiers de vrais clients. | Jeff | **Backlog P0 (avant go-live réel)** |
| Q8 | **Backup automatique** | Aucun backup automatique externe en place actuellement (snapshot tar local manuel uniquement). Inspiration : `instruction-13-backup-google-drive.md` du legacy (Google Drive OAuth2 + cron quotidien/hebdo/mensuel). **Risque ops critique** : perte de données = perte de cabinet. À mettre en place AVANT confiance données réelles. | Jeff | **Backlog P0 (avant go-live réel)** |
| Q9 | Métadonnées dossier typées par type | Aujourd'hui : `Folder.additionalData` en JSON brut. Inspiration : `instruction-07-metadata-autofill.md` du legacy = schéma typé Zod par `FolderType`. **Décision pour Mission B : on reste en JSON brut**, refacto envisagée post-pilote si nombre de types de dossiers ≥5. | Jeff (post-pilote) | Reportée |

---

## 8. Pieds de page utiles

**Fichiers de référence projet** :
- `docs/TEMPLATING_CONVENTION.md` (203 lignes, v1.0)
- `docs/TEMPLATE_MAPPING.md` (299 lignes, v1.0)
- `backend/prisma/migrations/_DRAFT_template_fields/migration.sql` (draft, non appliqué)
- `backend/prisma/schema.prisma.draft` (draft, non appliqué)
- `MASTER_TEMPLATES_PRAGMAVOX.md` (ce document)

**Légende** :
- ✅ Fait
- ⚠ Partiel ou à vérifier
- ❌ Non fait
- 🔴 Bloquant
- 🔄 En cours

---

*Fin du master.*
