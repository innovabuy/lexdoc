# Document Builder - Guide technique

## Vue d'ensemble

Le Document Builder est un systeme de generation de documents juridiques base sur des blocs reutilisables et des templates. Il permet aux avocats de creer rapidement des documents standardises tout en personnalisant le contenu specifique a chaque dossier.

## Architecture

### Blocs de document (`DocumentBlock`)

Les blocs sont les unites de base du contenu. Chaque bloc contient:
- Un contenu Handlebars avec des variables (`{{variable_name}}`)
- Une categorie (INTRO, FAITS, MOYENS, DISPOSITIF, SIGNATURE, CLAUSE, MENTION_LEGALE, CUSTOM, NOTE_LIBRE)
- Des tags pour la recherche
- Une liste de variables extraites automatiquement

### Templates (`BuilderTemplate`)

Les templates assemblent plusieurs blocs dans un ordre specifique:
- Structure de blocs avec ordre et optionalite
- Configuration du workflow (signature, LRAR, archivage)
- Mentions legales en-tete/pied de page

### Documents generes (`GeneratedDocument`)

Les documents generes sont crees a partir d'un template avec:
- Les variables remplies par l'utilisateur
- Le contenu rendu via Handlebars
- Un statut (DRAFT, FINALIZED, SENT, SIGNED)

## Notes libres (NOTE_LIBRE)

### Concept

Les notes libres permettent aux avocats d'ajouter du contenu personnalise specifique a un dossier, sans creer un bloc reutilisable. Elles sont ideales pour:

- Contexte particulier d'une affaire
- Faits supplementaires non couverts par les blocs standard
- Clauses negociees specifiquement avec la partie adverse
- Strategie particuliere a adopter

### API

#### Creer une note libre
```bash
POST /api/folders/:folderId/free-notes
{
  "title": "Contexte specifique",
  "content": "Le client {{client.nom}} a engage...",
  "linkedCategory": "FAITS"
}
```

#### Lister les notes d'un dossier
```bash
GET /api/folders/:folderId/free-notes?linkedCategory=FAITS&search=contexte
```

#### Lister toutes les notes du cabinet
```bash
GET /api/free-notes?search=texte
```

#### Mettre a jour une note
```bash
PUT /api/free-notes/:noteId
{
  "title": "Nouveau titre",
  "content": "Nouveau contenu..."
}
```

#### Supprimer une note
```bash
DELETE /api/free-notes/:noteId
```

#### Convertir en bloc reutilisable
```bash
POST /api/free-notes/:noteId/convert-to-block
{
  "title": "Titre du bloc",
  "category": "FAITS",
  "tags": ["cession", "personnalise"]
}
```

### Integration dans la generation de documents

Lors de la generation d'un document, l'utilisateur peut:
1. Selectionner des notes libres existantes du dossier
2. Creer de nouvelles notes a la volee
3. Les notes sont inserees dans le document selon leur `linkedCategory`

#### Structure du workflow

```
Step 1: Selection du template et du dossier
Step 2: Remplissage des variables + selection des notes libres
Step 3: Apercu du document genere
Step 4: Actions (telecharger, signer, envoyer)
```

### Extraction des variables

Les notes libres supportent la syntaxe Handlebars:
- `{{variable}}` - Variable simple
- `{{#if condition}}...{{/if}}` - Conditions
- `{{#each liste}}...{{/each}}` - Boucles

Les variables sont extraites automatiquement lors de la creation/modification de la note.

## Composants frontend

### FreeNoteBlock

Composant principal pour afficher et editer les notes libres.

```tsx
import { FreeNoteBlock, FreeNoteEditor, AddFreeNoteButton } from '@/components/FreeNoteBlock';

// Afficher une note existante
<FreeNoteBlock
  folderId={folderId}
  note={note}
  onNoteUpdated={handleUpdate}
  onNoteDeleted={handleDelete}
/>

// Creer une nouvelle note
<FreeNoteEditor
  folderId={folderId}
  onCancel={() => setIsCreating(false)}
  onSuccess={(note) => handleCreated(note)}
/>

// Bouton d'ajout
<AddFreeNoteButton onClick={() => setIsCreating(true)} />
```

### Hooks React Query

```tsx
import {
  useFolderFreeNotes,
  useAllFreeNotes,
  useFreeNote,
  useCreateFreeNote,
  useUpdateFreeNote,
  useDeleteFreeNote,
  useConvertToBlock,
} from '@/hooks/useFreeNotes';

// Lister les notes d'un dossier
const { data: notes } = useFolderFreeNotes(folderId);

// Creer une note
const createMutation = useCreateFreeNote();
await createMutation.mutateAsync({
  folderId,
  input: { title, content, linkedCategory }
});
```

## Schema de base de donnees

### DocumentBlock (Prisma)

```prisma
model DocumentBlock {
  id            String        @id @default(uuid())
  cabinetId     String
  category      BlockCategory
  title         String
  content       String        @db.Text
  variables     Json          @default("[]")
  tags          String[]
  isMandatory   Boolean       @default(false)
  isSystemBlock Boolean       @default(false)
  displayOrder  Int           @default(0)
  usageCount    Int           @default(0)
  metadata      Json?         @default("{}")
  folderId      String?       // Pour les notes libres
  createdById   String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  deletedAt     DateTime?
}

enum BlockCategory {
  INTRO
  FAITS
  MOYENS
  DISPOSITIF
  SIGNATURE
  CLAUSE
  MENTION_LEGALE
  CUSTOM
  NOTE_LIBRE    // Bloc de saisie libre specifique a un dossier
}
```

### Metadata pour NOTE_LIBRE

```json
{
  "linkedCategory": "FAITS",
  "createdInFolder": "M. Durand - Divorce",
  "convertedFrom": "uuid-note-originale",
  "originalFolderId": "uuid-dossier"
}
```

## Bonnes pratiques

1. **Utiliser les notes libres pour le contenu specifique** - Ne pas creer de blocs reutilisables pour du contenu unique a un dossier

2. **Lier les notes a une categorie** - Permet un positionnement intelligent dans le document genere

3. **Extraire les variables communes** - Si une variable est utilisee dans plusieurs notes, elle sera demandee une seule fois

4. **Convertir les patterns recurrents** - Si une note libre est reutilisee, la convertir en bloc reutilisable

## Tests

### Backend (Jest)

```typescript
describe('FreeNotesService', () => {
  it('should create a free note with variables', async () => {
    const note = await service.create(folderId, cabinetId, userId, {
      title: 'Test note',
      content: 'Hello {{client.nom}}',
      linkedCategory: 'FAITS'
    });

    expect(note.category).toBe('NOTE_LIBRE');
    expect(note.variables).toContainEqual({
      name: 'client.nom',
      type: 'string',
      required: true
    });
  });
});
```

### Frontend (Cypress)

```typescript
describe('Free Notes', () => {
  it('should add free note during document generation', () => {
    cy.visit('/document-generation/new');
    cy.get('[data-testid="select-template"]').click();
    cy.get('[data-testid="add-free-note"]').click();
    cy.get('[name="content"]').type('Note specifique...');
    cy.get('[data-testid="save-note"]').click();
    cy.get('[data-testid="note-list"]').should('contain', 'Note specifique');
  });
});
```
