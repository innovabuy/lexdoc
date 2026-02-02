# Document Builder - Guide d'utilisation

## Introduction

Le module Document Builder permet de créer des documents juridiques professionnels à partir de templates personnalisables. Il utilise un système de blocs réutilisables et de variables Handlebars pour générer automatiquement des documents DOCX ou PDF.

## Architecture

### Composants principaux

- **Document Blocks** : Blocs de contenu réutilisables (en-têtes, corps, signatures, etc.)
- **Builder Templates** : Templates composés de plusieurs blocs avec leurs variables
- **Document Generation** : Moteur de génération DOCX/PDF avec injection de mentions légales

### Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/document-blocks` | Liste tous les blocs |
| GET | `/api/document-blocks/:id` | Détails d'un bloc |
| POST | `/api/document-blocks` | Créer un bloc |
| PUT | `/api/document-blocks/:id` | Modifier un bloc |
| DELETE | `/api/document-blocks/:id` | Supprimer un bloc |
| GET | `/api/builder-templates` | Liste tous les templates |
| GET | `/api/builder-templates/:id` | Détails d'un template |
| GET | `/api/builder-templates/:id/variables` | Variables requises |
| POST | `/api/builder-templates` | Créer un template |
| PUT | `/api/builder-templates/:id` | Modifier un template |
| DELETE | `/api/builder-templates/:id` | Supprimer un template |
| POST | `/api/document-generation/preview` | Prévisualisation HTML |
| POST | `/api/document-generation/generate` | Générer le document |
| GET | `/api/document-generation/:id/download` | Télécharger le document |

## Types de documents supportés

| Type | Description | Juridiction |
|------|-------------|-------------|
| `ASSIGNATION_FOND` | Assignation au fond | Tribunal Judiciaire |
| `ASSIGNATION_REFERE` | Assignation en référé | Tribunal Judiciaire |
| `CONCLUSIONS_DEFENSE` | Conclusions en défense | Toutes juridictions |
| `CONCLUSIONS_RECAPITULATIVES` | Conclusions récapitulatives | Toutes juridictions |
| `CONVOCATION_AUDIENCE` | Convocation à une audience | Toutes juridictions |
| `MISE_EN_DEMEURE` | Mise en demeure | Aucune (courrier) |
| `REQUETE` | Requête | Tribunal Judiciaire |
| `COURRIER_SIMPLE` | Courrier simple | Aucune |

## Syntaxe des variables Handlebars

### Variables simples

```handlebars
{{client.nom}}
{{date_audience}}
{{montant_total}}
```

### Variables avec formatage de date

```handlebars
{{formatDate date_audience "DD MMMM YYYY"}}
{{formatDate date_courrier "DD/MM/YYYY"}}
```

### Variables avec formatage de montant

```handlebars
{{formatMoney montant_total}}  <!-- Résultat: 1 234,56 € -->
{{formatMoney montant_total "EUR"}}
```

### Conditions

```handlebars
{{#if presence_obligatoire}}
Votre présence est OBLIGATOIRE.
{{else}}
Votre présence est souhaitée.
{{/if}}
```

### Boucles

```handlebars
{{#each pieces}}
- Pièce {{@index}}: {{this.nom}} ({{this.description}})
{{/each}}
```

### Variables optionnelles avec valeur par défaut

```handlebars
{{default avocat.toque "Non renseigné"}}
```

## Structure d'un template

```json
{
  "name": "Convocation audience",
  "documentType": "CONVOCATION_AUDIENCE",
  "juridiction": "TRIBUNAL_JUDICIAIRE",
  "blocksStructure": [
    {
      "order": 1,
      "blockId": "uuid-du-bloc-entete",
      "isOptional": false
    },
    {
      "order": 2,
      "blockId": "uuid-du-bloc-corps",
      "isOptional": false
    },
    {
      "order": 3,
      "blockId": "uuid-du-bloc-signature",
      "isOptional": false
    }
  ],
  "requiredVariables": [
    {
      "name": "client.nom",
      "type": "string",
      "required": true
    },
    {
      "name": "date_audience",
      "type": "date",
      "required": true
    }
  ],
  "outputFormat": "DOCX",
  "workflowConfig": {
    "lrar": true,
    "autoStore": true,
    "signature": false
  }
}
```

## Types de variables

| Type | Description | Exemple |
|------|-------------|---------|
| `string` | Texte simple | `"Jean DUPONT"` |
| `text` | Texte multiligne | `"Ligne 1\nLigne 2"` |
| `number` | Nombre | `1234.56` |
| `date` | Date ISO | `"2026-03-01"` |
| `boolean` | Vrai/Faux | `true` |
| `array` | Liste d'objets | `[{"nom": "Pièce 1"}]` |

## Exemples d'utilisation

### Générer un document

```bash
# 1. S'authentifier
TOKEN=$(curl -s -X POST http://localhost:3005/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@cabinet-demo.fr","password":"Admin123!"}' \
  | jq -r '.data.accessToken')

# 2. Lister les templates disponibles
curl -s http://localhost:3005/api/builder-templates \
  -H "Authorization: Bearer $TOKEN" | jq '.data[].name'

# 3. Voir les variables requises
curl -s http://localhost:3005/api/builder-templates/{templateId}/variables \
  -H "Authorization: Bearer $TOKEN"

# 4. Générer le document
curl -X POST http://localhost:3005/api/document-generation/generate \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "templateId": "uuid-du-template",
    "folderId": "uuid-du-dossier",
    "title": "Mon document",
    "filledVariables": {
      "client.nom": "DUPONT",
      "client.prenom": "Jean",
      "date_audience": "2026-03-01"
    }
  }'
```

### Créer un bloc personnalisé

```bash
curl -X POST http://localhost:3005/api/document-blocks \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "En-tête personnalisé",
    "type": "HEADER",
    "content": "{{client.civilite}} {{client.prenom}} {{client.nom}}\n{{client.adresse}}\n{{client.codePostal}} {{client.ville}}",
    "variables": [
      {"name": "client.civilite", "type": "string", "required": true},
      {"name": "client.prenom", "type": "string", "required": true},
      {"name": "client.nom", "type": "string", "required": true},
      {"name": "client.adresse", "type": "string", "required": true},
      {"name": "client.codePostal", "type": "string", "required": true},
      {"name": "client.ville", "type": "string", "required": true}
    ],
    "isSystemBlock": false
  }'
```

## Interface utilisateur

### Accès aux pages

- **Liste des blocs** : `http://localhost:8081/document-blocks`
- **Builder de templates** : `http://localhost:8081/templates/builder`
- **Génération de documents** : `http://localhost:8081/documents/generate`

### Workflow de création

1. **Créer des blocs** : Définir les blocs de contenu réutilisables
2. **Assembler un template** : Combiner les blocs dans l'ordre souhaité
3. **Définir les variables** : Spécifier les champs à remplir
4. **Tester avec prévisualisation** : Vérifier le rendu avant génération
5. **Générer le document** : Créer le fichier DOCX/PDF final

## Configuration du workflow

### Options disponibles

- **autoStore** : Stockage automatique dans MinIO
- **lrar** : Envoi par lettre recommandée (SendingBox)
- **signature** : Signature électronique (Universign)

### Mentions légales

```json
{
  "legalMentions": {
    "afficherToque": true,
    "afficherBarreau": true,
    "positionMentions": "FOOTER"
  }
}
```

## Templates système inclus

1. **Convocation audience Tribunal Judiciaire** - Convocation client à une audience
2. **Mise en demeure paiement** - Lettre de mise en demeure
3. **Conclusions récapitulatives fond** - Conclusions pour procédure au fond
4. **Assignation en référé provision** - Assignation devant le juge des référés
5. **Assignation expulsion locataire** - Assignation pour expulsion

## Blocs système inclus

20 blocs prédéfinis couvrant :
- En-têtes de documents juridiques
- Corps de texte pour différentes procédures
- Exposé des faits et moyens
- Demandes et chefs de demande
- Bordereau de pièces
- Signatures et mentions légales

## Stockage des documents

Les documents générés sont stockés dans MinIO avec la structure suivante :

```
lexdoc-documents/
└── {cabinetId}/
    └── {folderId}/
        └── generated/
            └── {titre}_{timestamp}.docx
```

## Dépannage

### Le document ne se génère pas

1. Vérifier que toutes les variables requises sont fournies
2. Vérifier les logs du backend : `docker logs lexdoc-backend`
3. Tester avec la prévisualisation d'abord

### Variables non remplacées

1. Vérifier la syntaxe Handlebars (double accolades)
2. Vérifier que le nom de variable correspond exactement
3. Utiliser `{{default variable "valeur"}}` pour les optionnels

### Problème de formatage

1. Utiliser les helpers de formatage (`formatDate`, `formatMoney`)
2. Vérifier le type de variable dans la définition du bloc
