# Template Mapping — Lettre de Mission Constitution de Société (Pragmavox)

> Version 1.0 — 2026-04-24
> Source : `lettre_de_mission_constitution_société.docx` (Pragmavox)
> Cible : `backend/templates/pragmavox/lettre_mission_constitution.docx`

## 1. Résumé du document

La lettre de mission de constitution de société est un document contractuel entre un cabinet d'avocats (SELARL) et un client, définissant :
- L'identité des parties (cabinet + client)
- L'objet de la mission (constitution d'une société)
- Les honoraires et modalités de paiement
- Les obligations déontologiques
- Les informations RGPD
- Le médiateur de la consommation

## 2. Mapping des placeholders

### 2.1 Bloc En-tête Cabinet

| Placeholder source | Variable LexDoc | Namespace | Existe déjà | Exemple |
|-------------------|-----------------|-----------|-------------|---------|
| SELARL d'Avocat PRAGMA VOX AVOCAT | `{cabinet_raison_sociale}` | cabinet | **oui** | SELARL PRAGMA VOX AVOCAT |
| SIRET : 98260027200016 | `{cabinet_siret}` | cabinet | **oui** | 98260027200016 |
| TVA : FR25982600272 | `{cabinet_tva}` | cabinet | **NON** | FR25982600272 |
| 11, rue Paul LANGEVIN | `{cabinet_adresse_ligne1}` | cabinet | **NON** | 11, rue Paul LANGEVIN |
| 49240 AVRILLE | `{cabinet_cp}` `{cabinet_ville}` | cabinet | **oui** | 49240 / AVRILLE |
| 06.14.84.38.38 | `{cabinet_telephone}` | cabinet | **oui** | 06.14.84.38.38 |
| ym.bienaime@pragmavox-avocat.fr | `{cabinet_email}` | cabinet | **oui** | ym.bienaime@pragmavox-avocat.fr |

### 2.2 Bloc Avocat

| Placeholder source | Variable LexDoc | Namespace | Existe déjà | Exemple |
|-------------------|-----------------|-----------|-------------|---------|
| Maître Yves-Marie BIENAIME | `{avocat_plaidant_civilite_nom}` | avocat_plaidant | **NON** | Maître Yves-Marie BIENAIME |
| Avocat au Barreau d'ANGERS | `{avocat_plaidant_barreau}` | avocat_plaidant | **NON** | ANGERS |

> **Note** : On crée un namespace `avocat_plaidant` distinct de `avocat` car dans la lettre de mission, l'avocat est présenté avec le titre "Maître" et son barreau peut différer du barreau du cabinet.

### 2.3 Bloc Client

| Placeholder source | Variable LexDoc | Namespace | Existe déjà | Exemple |
|-------------------|-----------------|-----------|-------------|---------|
| (civilité) | `{client_civilite}` | client | **oui** | Monsieur |
| (nom complet) | `{client_nom_complet}` | client | **oui** | Jean DURAND |
| (adresse complète) | `{client_adresse}` | client | **oui** | 25 rue de la République, 49100 ANGERS |
| Type de client | `{client_type}` | client | **oui** | personne_physique |

### 2.4 Bloc Objet de la Mission

| Placeholder source | Variable LexDoc | Namespace | Existe déjà | Exemple |
|-------------------|-----------------|-----------|-------------|---------|
| (forme de société) | `{dossier_forme_societe}` | dossier | **NON** | SAS |

> **Note** : `dossier_forme_societe` est distinct de `client_forme_sociale` car il s'agit de la société **à constituer**, pas du client existant.

### 2.5 Bloc Honoraires (tableau)

| Placeholder source | Variable LexDoc | Namespace | Existe déjà | Exemple brut | Exemple formaté |
|-------------------|-----------------|-----------|-------------|-------------|-----------------|
| Montant HT | `{honoraires_montant_ht}` | honoraires | **NON** | 2500 | 2 500,00 € |
| TVA (20%) | `{honoraires_montant_tva}` | honoraires | **NON** | 500 | 500,00 € |
| Montant TTC | `{honoraires_montant_ttc}` | honoraires | **NON** | 3000 | 3 000,00 € |
| Provision HT | `{honoraires_provision_ht}` | honoraires | **NON** | 1250 | 1 250,00 € |
| Provision TTC | `{honoraires_provision_ttc}` | honoraires | **NON** | 1500 | 1 500,00 € |

**Format d'affichage** : Les montants doivent être formatés en euros français (`X XXX,XX €`) par le service de rendu avant injection.

### 2.6 Bloc Médiateur

| Placeholder source | Variable LexDoc | Namespace | Existe déjà | Exemple |
|-------------------|-----------------|-----------|-------------|---------|
| Nom du médiateur | `{mediateur_nom_complet}` | mediateur | **NON** | Jean MARTIN |
| Barreau du médiateur | `{mediateur_barreau}` | mediateur | **NON** | PARIS |

### 2.7 Bloc Signature

| Placeholder source | Variable LexDoc | Namespace | Existe déjà | Exemple |
|-------------------|-----------------|-----------|-------------|---------|
| Date de signature | `{dossier_date_signature}` | dossier | **NON** | 24 avril 2026 |
| Lieu de signature | `{dossier_lieu_signature}` | dossier | **NON** | AVRILLE |

### 2.8 Bloc RGPD

Le bloc RGPD est **statique** (texte réglementaire du cabinet). Aucune variable à injecter. Le contenu est conservé tel quel dans le template.

## 3. Nouvelles variables à créer (14 au total)

### 3.1 Classification définitive avec stockage décidé

| # | Variable template (.docx) | Clé catalogue | Stockage décidé | Migration ? |
|---|--------------------------|---------------|-----------------|-------------|
| | **Honoraires** | | | |
| 1 | `{honoraires_montant_ht}` | `honoraires.montant_ht` | Body requête / `additionalData` | NON |
| 2 | `{honoraires_montant_tva}` | `honoraires.montant_tva` | Body requête / `additionalData` | NON |
| 3 | `{honoraires_montant_ttc}` | `honoraires.montant_ttc` | Body requête / `additionalData` | NON |
| 4 | `{honoraires_provision_ht}` | `honoraires.provision_ht` | Body requête / `additionalData` | NON |
| 5 | `{honoraires_provision_ttc}` | `honoraires.provision_ttc` | Body requête / `additionalData` | NON |
| | **Médiateur** | | | |
| 6 | `{mediateur_nom_complet}` | `mediateur.nom_complet` | Body requête / `additionalData` | NON |
| 7 | `{mediateur_barreau}` | `mediateur.barreau` | Body requête / `additionalData` | NON |
| | **Avocat plaidant** | | | |
| 8 | `{avocat_plaidant_civilite_nom}` | `avocat_plaidant.civilite_nom` | Dérivé de `User` existant (`"Maître " + firstName + " " + lastName`) | NON |
| 9 | `{avocat_plaidant_barreau}` | `avocat_plaidant.barreau` | Dérivé de `Tenant.barreau` existant | NON |
| | **Cabinet (ajouts)** | | | |
| 10 | `{cabinet_tva}` | `cabinet.tva` | Colonne `Tenant.tva` (nouvelle) | **OUI** |
| 11 | `{cabinet_adresse_ligne1}` | `cabinet.adresse_ligne1` | Colonne `Tenant.addressLine1` (nouvelle) | **OUI** |
| | **Dossier (ajouts)** | | | |
| 12 | `{dossier_forme_societe}` | `dossier.forme_societe` | `Folder.additionalData` (JSON) | NON |
| 13 | `{dossier_date_signature}` | `dossier.date_signature` | Body requête (volatile) | NON |
| 14 | `{dossier_lieu_signature}` | `dossier.lieu_signature` | Body requête (volatile) | NON |

**Résumé migrations** : 2 colonnes à ajouter au modèle `Tenant` (`tva`, `addressLine1`). Migration draft dans `prisma/migrations/_DRAFT_template_fields/migration.sql` — ne sera appliquée qu'après validation humaine.

### 3.2 Ajouts au catalogue `template-variables.js` (Mission B)

```javascript
// ── Honoraires ──
{ key: 'honoraires.montant_ht',    label: 'Honoraires HT',    category: 'honoraires', description: 'Montant HT',           example: '2 500,00 €' },
{ key: 'honoraires.montant_tva',   label: 'Honoraires TVA',   category: 'honoraires', description: 'Montant TVA',           example: '500,00 €' },
{ key: 'honoraires.montant_ttc',   label: 'Honoraires TTC',   category: 'honoraires', description: 'Montant TTC',           example: '3 000,00 €' },
{ key: 'honoraires.provision_ht',  label: 'Provision HT',     category: 'honoraires', description: 'Provision demandée HT', example: '1 250,00 €' },
{ key: 'honoraires.provision_ttc', label: 'Provision TTC',     category: 'honoraires', description: 'Provision demandée TTC',example: '1 500,00 €' },

// ── Médiateur ──
{ key: 'mediateur.nom_complet', label: 'Nom du médiateur',  category: 'mediateur', description: 'Médiateur de la consommation', example: 'Jean MARTIN' },
{ key: 'mediateur.barreau',     label: 'Barreau médiateur', category: 'mediateur', description: 'Barreau du médiateur',         example: 'PARIS' },

// ── Avocat plaidant ──
{ key: 'avocat_plaidant.civilite_nom', label: 'Titre et nom', category: 'avocat_plaidant', description: 'Maître Prénom NOM',          example: 'Maître Yves-Marie BIENAIME' },
{ key: 'avocat_plaidant.barreau',      label: 'Barreau',      category: 'avocat_plaidant', description: 'Barreau de l\'avocat plaidant', example: 'ANGERS' },

// ── Ajouts cabinet ──
{ key: 'cabinet.tva',            label: 'N° TVA',          category: 'cabinet', description: 'N° TVA intracommunautaire', example: 'FR25982600272' },
{ key: 'cabinet.adresse_ligne1', label: 'Adresse ligne 1', category: 'cabinet', description: 'Première ligne adresse',    example: '11, rue Paul LANGEVIN' },

// ── Ajouts dossier ──
{ key: 'dossier.forme_societe',  label: 'Forme de société',  category: 'dossier', description: 'Forme juridique à constituer', example: 'SAS' },
{ key: 'dossier.date_signature', label: 'Date de signature', category: 'dossier', description: 'Date de signature',            example: '24 avril 2026' },
{ key: 'dossier.lieu_signature', label: 'Lieu de signature', category: 'dossier', description: 'Lieu de signature',             example: 'AVRILLE' },
```

### 3.3 Nouvelles catégories à ajouter dans `CATEGORIES`

```javascript
honoraires:      { label: 'Honoraires',       icon: '💰', order: 9 },
mediateur:       { label: 'Médiateur',         icon: '🤝', order: 10 },
avocat_plaidant: { label: 'Avocat plaidant',   icon: '⚖️', order: 11 },
```

## 4. Anomalies identifiées dans le document source

Ces anomalies devront être corrigées lors de la conversion en template (Mission B, Étape 3) :

| # | Anomalie | Action |
|---|----------|--------|
| A1 | **Doublon bloc SELARL** : le document contient deux blocs d'en-tête cabinet, dont un vide (sans données) | Supprimer intégralement le bloc vide, conserver uniquement le bloc renseigné |
| A2 | **Variable `(dénomination)` ambiguë** : utilisée sans contexte clair | Mapper vers `{cabinet_raison_sociale}` pour l'en-tête et `{client_raison_sociale}` pour le client PM |
| A3 | **Zones tabulées vides** dans le tableau honoraires | Remplacer chaque cellule vide par la variable correspondante (`{honoraires_montant_ht}`, etc.) |
| A4 | **Espaces/tabs pour alignement** dans le bloc signature | Conserver la structure Word (pas de remplacement par des variables) |
| A5 | **Typographie à préserver** : gras sur les titres de section, italiques sur les mentions légales | Ne pas modifier le formatage XML Word — uniquement remplacer le texte entre les balises `<w:t>` |

## 5. Structure du template final (syntaxe underscore aplatie)

```
┌───────────────────────────────────────────────────┐
│ EN-TÊTE CABINET (1 seul bloc — doublon supprimé)  │
│   {cabinet_raison_sociale}                        │
│   SIRET : {cabinet_siret} — TVA : {cabinet_tva}  │
│   {cabinet_adresse_ligne1}                        │
│   {cabinet_cp} {cabinet_ville}                    │
│   Tél : {cabinet_telephone}                       │
│   Email : {cabinet_email}                         │
├───────────────────────────────────────────────────┤
│ IDENTIFICATION AVOCAT                             │
│   {avocat_plaidant_civilite_nom}                  │
│   Avocat au Barreau de {avocat_plaidant_barreau}  │
├───────────────────────────────────────────────────┤
│ IDENTIFICATION CLIENT                             │
│   {client_civilite} {client_nom_complet}          │
│   {client_adresse}                                │
├───────────────────────────────────────────────────┤
│ OBJET DE LA MISSION                               │
│   Constitution d'une {dossier_forme_societe}      │
├───────────────────────────────────────────────────┤
│ TABLEAU HONORAIRES                                │
│   HT :          {honoraires_montant_ht}           │
│   TVA 20% :     {honoraires_montant_tva}          │
│   TTC :         {honoraires_montant_ttc}          │
│   Provision HT :  {honoraires_provision_ht}       │
│   Provision TTC : {honoraires_provision_ttc}      │
├───────────────────────────────────────────────────┤
│ OBLIGATIONS DÉONTOLOGIQUES (texte statique)       │
├───────────────────────────────────────────────────┤
│ MÉDIATEUR DE LA CONSOMMATION                      │
│   {mediateur_nom_complet}                         │
│   Barreau de {mediateur_barreau}                  │
├───────────────────────────────────────────────────┤
│ BLOC RGPD (texte statique intégral)               │
├───────────────────────────────────────────────────┤
│ SIGNATURE                                         │
│   Fait à {dossier_lieu_signature},                │
│   le {dossier_date_signature}                     │
│                                                   │
│   L'Avocat                    Le Client           │
│   {avocat_plaidant_civilite_nom}                  │
└───────────────────────────────────────────────────┘
```

> Toutes les variables ci-dessus sont en notation **underscore aplatie**, conformément à la convention (cf. `TEMPLATING_CONVENTION.md` §2.1).

## 6. Données de test (fixture)

Le fichier `backend/templates/pragmavox/__fixtures__/lettre_mission_test_data.json` contient les données au format **imbriqué** (entrée du service). Le service appelle `flattenObject()` qui produit automatiquement les clés aplaties (`cabinet_raison_sociale`, `honoraires_montant_ht`, etc.) pour le rendu docxtemplater.

### Format imbriqué (entrée du service → aplati automatiquement)

```json
{
  "cabinet": {
    "raison_sociale": "SELARL PRAGMA VOX AVOCAT",
    "siret": "98260027200016",
    "tva": "FR25982600272",
    "adresse_ligne1": "11, rue Paul LANGEVIN",
    "cp": "49240",
    "ville": "AVRILLE",
    "telephone": "06.14.84.38.38",
    "email": "ym.bienaime@pragmavox-avocat.fr"
  },
  "avocat_plaidant": {
    "civilite_nom": "Maître Yves-Marie BIENAIME",
    "barreau": "ANGERS"
  },
  "client": {
    "type": "personne_physique",
    "civilite": "Monsieur",
    "nom_complet": "Jean DURAND",
    "adresse": "25 rue de la République, 49100 ANGERS"
  },
  "dossier": {
    "forme_societe": "SAS",
    "date_signature": "24 avril 2026",
    "lieu_signature": "AVRILLE"
  },
  "honoraires": {
    "montant_ht": "2 500,00 €",
    "montant_tva": "500,00 €",
    "montant_ttc": "3 000,00 €",
    "provision_ht": "1 250,00 €",
    "provision_ttc": "1 500,00 €"
  },
  "mediateur": {
    "nom_complet": "Jean MARTIN",
    "barreau": "PARIS"
  }
}
```

> **Important** : Les montants sont pré-formatés en chaîne (pas en nombre) car docxtemplater ne supporte pas les helpers de formatage inline. Le formatage est effectué par `templateRenderer.js` avant l'appel à `flattenObject()` + rendu.
>
> **Correspondance** : `cabinet.raison_sociale` dans le JSON → `cabinet_raison_sociale` dans le .docx (via `flattenObject()`).

## 7. Variables requises vs optionnelles

### Requises (erreur si absentes)

- `cabinet_raison_sociale`
- `cabinet_siret`
- `avocat_plaidant_civilite_nom`
- `avocat_plaidant_barreau`
- `client_civilite`
- `client_nom_complet`
- `client_adresse`
- `dossier_forme_societe`
- `honoraires_montant_ht`
- `honoraires_montant_ttc`
- `dossier_date_signature`
- `dossier_lieu_signature`

### Optionnelles (remplacées par `[A COMPLETER]` si absentes)

- `cabinet_tva`
- `cabinet_adresse_ligne1`
- `cabinet_telephone`
- `cabinet_email`
- `honoraires_montant_tva`
- `honoraires_provision_ht`
- `honoraires_provision_ttc`
- `mediateur_nom_complet`
- `mediateur_barreau`

## 8. Compatibilité avec l'existant

Cette extension est **additive uniquement** :
- Aucune variable existante n'est renommée ou supprimée
- Aucun comportement existant de `collectData()` n'est modifié
- Les nouvelles variables sont ajoutées dans des namespaces séparés (`honoraires`, `mediateur`, `avocat_plaidant`)
- Le template Pragmavox utilise son propre sous-répertoire (`templates/pragmavox/`)
- Les routes de preview sont ajoutées sous un nouveau préfixe (`/api/templates/lettre-mission/`)
