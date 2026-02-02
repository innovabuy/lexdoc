# Instructions #1-2 - Blocs de Contenu et Templates

## Objectif
Implémenter le système de blocs de contenu réutilisables et de templates pour la génération de documents juridiques.

## Fonctionnalités

### Blocs de Contenu (DocumentBlock)

Les blocs sont des fragments de texte réutilisables avec des variables Handlebars.

**Catégories:**
- INTRO - Introduction du document
- FAITS - Exposé des faits
- MOYENS - Moyens de droit
- DISPOSITIF - Demandes/conclusions
- SIGNATURE - Bloc de signature
- CLAUSE - Clauses contractuelles
- MENTION_LEGALE - Mentions obligatoires
- CUSTOM - Blocs personnalisés
- NOTE_LIBRE - Notes spécifiques à un dossier

**Structure:**
```typescript
interface DocumentBlock {
  id: string;
  cabinetId: string;
  category: BlockCategory;
  title: string;
  content: string;        // Template Handlebars
  variables: Variable[];  // Variables à remplir
  tags: string[];
  isMandatory: boolean;
  isSystemBlock: boolean;
}
```

### Templates (BuilderTemplate)

Les templates assemblent des blocs pour créer des documents complets.

**Types de documents:**
- Actes de procédure (assignations, conclusions, requêtes)
- Correspondance (mises en demeure, convocations)
- Actes contractuels (statuts, cessions, contrats)
- Documents administratifs (procurations, attestations)

**Structure:**
```typescript
interface BuilderTemplate {
  id: string;
  name: string;
  documentType: BuilderDocumentType;
  juridiction: Juridiction;
  blocksStructure: BlockRef[];
  requiredVariables: Variable[];
  outputFormat: 'DOCX' | 'PDF';
  workflowConfig: WorkflowConfig;
}
```

## API Endpoints

### Blocs
- `GET /api/document-blocks` - Liste des blocs
- `POST /api/document-blocks` - Créer un bloc
- `GET /api/document-blocks/:id` - Détail d'un bloc
- `PUT /api/document-blocks/:id` - Modifier un bloc
- `DELETE /api/document-blocks/:id` - Supprimer un bloc

### Templates
- `GET /api/builder-templates` - Liste des templates
- `POST /api/builder-templates` - Créer un template
- `GET /api/builder-templates/:id` - Détail d'un template
- `PUT /api/builder-templates/:id` - Modifier un template
- `DELETE /api/builder-templates/:id` - Supprimer un template

## Composants Frontend

- `DocumentBlocksListPage` - Liste des blocs avec filtres
- `DocumentBlockFormPage` - Éditeur de bloc
- `TemplateBuilderPage` - Constructeur de template visuel
- `DocumentTemplatesListPage` - Liste des templates

## Statut
✅ Complété
