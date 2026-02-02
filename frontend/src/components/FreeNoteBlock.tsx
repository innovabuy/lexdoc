import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Pencil,
  Trash2,
  Check,
  X,
  RefreshCw,
  FilePlus,
} from 'lucide-react';
import { useCreateFreeNote, useUpdateFreeNote, useDeleteFreeNote, useConvertToBlock } from '@/hooks/useFreeNotes';
import type { FreeNote } from '@/lib/api/freeNotes';

// ============================================
// Types & Schemas
// ============================================

const createNoteSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(200),
  content: z.string().min(1, 'Contenu requis').max(50000),
  linkedCategory: z.string().optional(),
});

const convertToBlockSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(200),
  category: z.string().min(1, 'Catégorie requise'),
  tags: z.string().optional(),
});

type CreateNoteForm = z.infer<typeof createNoteSchema>;
type ConvertToBlockForm = z.infer<typeof convertToBlockSchema>;

const CATEGORIES = [
  { value: 'INTRO', label: 'Introduction' },
  { value: 'FAITS', label: 'Faits' },
  { value: 'MOYENS', label: 'Moyens' },
  { value: 'DISPOSITIF', label: 'Dispositif' },
  { value: 'CLAUSE', label: 'Clause' },
  { value: 'SIGNATURE', label: 'Signature' },
  { value: 'MENTION_LEGALE', label: 'Mention légale' },
  { value: 'CUSTOM', label: 'Personnalisé' },
];

// ============================================
// FreeNoteEditor Component
// ============================================

interface FreeNoteEditorProps {
  folderId: string;
  onCancel: () => void;
  onSuccess?: (note: FreeNote) => void;
  initialData?: FreeNote;
}

export function FreeNoteEditor({ folderId, onCancel, onSuccess, initialData }: FreeNoteEditorProps) {
  const createMutation = useCreateFreeNote();
  const updateMutation = useUpdateFreeNote();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateNoteForm>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: initialData?.title || 'Note personnalisée',
      content: initialData?.content || '',
      linkedCategory: (initialData?.metadata?.linkedCategory as string) || '',
    },
  });

  const onSubmit = async (data: CreateNoteForm) => {
    try {
      if (initialData) {
        const note = await updateMutation.mutateAsync({
          noteId: initialData.id,
          input: {
            title: data.title,
            content: data.content,
            linkedCategory: data.linkedCategory || undefined,
          },
        });
        onSuccess?.(note);
      } else {
        const note = await createMutation.mutateAsync({
          folderId,
          input: {
            title: data.title,
            content: data.content,
            linkedCategory: data.linkedCategory || undefined,
          },
        });
        onSuccess?.(note);
      }
      onCancel();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-blue-700 flex items-center gap-2">
            <span className="text-lg">📝</span>
            {initialData ? 'Modifier la note libre' : 'Nouvelle note libre'}
          </h4>
          <span className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded">
            Spécifique à ce dossier
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre
          </label>
          <input
            type="text"
            {...register('title')}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            placeholder="Ex: Contexte particulier de l'affaire"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catégorie liée (optionnel)
          </label>
          <select
            {...register('linkedCategory')}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="">-- Aucune --</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Aide à positionner la note dans le document
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contenu
          </label>
          <textarea
            {...register('content')}
            rows={10}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm font-mono"
            placeholder={`Saisissez du contenu libre spécifique à ce dossier...

Exemples :
- Contexte particulier de l'affaire
- Faits supplémentaires non couverts par les blocs standard
- Clause négociée spécifiquement avec la partie adverse
- Stratégie particulière à adopter

Vous pouvez utiliser des variables comme {{client.nom}} ou {{date_jour}}`}
          />
          {errors.content && (
            <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <X className="h-4 w-4 mr-1" />
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4 mr-1" />
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================
// FreeNoteDisplay Component
// ============================================

interface FreeNoteDisplayProps {
  note: FreeNote;
  onEdit?: () => void;
  onDelete?: () => void;
  onConvertToBlock?: () => void;
  showActions?: boolean;
}

export function FreeNoteDisplay({
  note,
  onEdit,
  onDelete,
  onConvertToBlock,
  showActions = true,
}: FreeNoteDisplayProps) {
  const linkedCategory = CATEGORIES.find(
    (c) => c.value === note.metadata?.linkedCategory
  );

  return (
    <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-blue-700 flex items-center gap-2">
            <span className="text-lg">📝</span>
            {note.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded">
              Note libre
            </span>
            {linkedCategory && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {linkedCategory.label}
              </span>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded"
                title="Modifier"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onConvertToBlock && (
              <button
                onClick={onConvertToBlock}
                className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-100 rounded"
                title="Convertir en bloc réutilisable"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
        {note.content}
      </div>

      {note.variables && note.variables.length > 0 && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-blue-600 font-medium mb-1">
            Variables détectées :
          </p>
          <div className="flex flex-wrap gap-1">
            {note.variables.map((v) => (
              <span
                key={v.name}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono"
              >
                {`{{${v.name}}}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// ConvertToBlockModal Component
// ============================================

interface ConvertToBlockModalProps {
  note: FreeNote;
  isOpen: boolean;
  onClose: () => void;
}

export function ConvertToBlockModal({ note, isOpen, onClose }: ConvertToBlockModalProps) {
  const convertMutation = useConvertToBlock();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConvertToBlockForm>({
    resolver: zodResolver(convertToBlockSchema),
    defaultValues: {
      title: note.title,
      category: note.metadata?.linkedCategory || 'CUSTOM',
      tags: '',
    },
  });

  const onSubmit = async (data: ConvertToBlockForm) => {
    try {
      await convertMutation.mutateAsync({
        noteId: note.id,
        input: {
          title: data.title,
          category: data.category,
          tags: data.tags ? data.tags.split(',').map((t) => t.trim()) : [],
        },
      });
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Convertir en bloc réutilisable
          </h3>

          <p className="text-sm text-gray-600 mb-4">
            Cette note sera copiée comme un nouveau bloc réutilisable dans votre bibliothèque.
            La note originale sera conservée.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre du bloc
              </label>
              <input
                type="text"
                {...register('title')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                {...register('category')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (séparés par des virgules)
              </label>
              <input
                type="text"
                {...register('tags')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                placeholder="cession, clause, personnalisé"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Conversion...' : 'Convertir'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FreeNoteBlock Component (main export)
// ============================================

interface FreeNoteBlockProps {
  folderId: string;
  note?: FreeNote;
  onNoteCreated?: (note: FreeNote) => void;
  onNoteUpdated?: (note: FreeNote) => void;
  onNoteDeleted?: (noteId: string) => void;
  isCreating?: boolean;
  onCancelCreate?: () => void;
}

export function FreeNoteBlock({
  folderId,
  note,
  onNoteCreated,
  onNoteUpdated,
  onNoteDeleted,
  isCreating = false,
  onCancelCreate,
}: FreeNoteBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const deleteMutation = useDeleteFreeNote();

  const handleDelete = async () => {
    if (!note) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) return;

    try {
      await deleteMutation.mutateAsync(note.id);
      onNoteDeleted?.(note.id);
    } catch {
      // Error handled by mutation
    }
  };

  // Creating new note
  if (isCreating) {
    return (
      <FreeNoteEditor
        folderId={folderId}
        onCancel={() => onCancelCreate?.()}
        onSuccess={onNoteCreated}
      />
    );
  }

  // Editing existing note
  if (isEditing && note) {
    return (
      <FreeNoteEditor
        folderId={folderId}
        initialData={note}
        onCancel={() => setIsEditing(false)}
        onSuccess={(updatedNote) => {
          setIsEditing(false);
          onNoteUpdated?.(updatedNote);
        }}
      />
    );
  }

  // Display note
  if (note) {
    return (
      <>
        <FreeNoteDisplay
          note={note}
          onEdit={() => setIsEditing(true)}
          onDelete={handleDelete}
          onConvertToBlock={() => setShowConvertModal(true)}
        />
        {showConvertModal && (
          <ConvertToBlockModal
            note={note}
            isOpen={showConvertModal}
            onClose={() => setShowConvertModal(false)}
          />
        )}
      </>
    );
  }

  return null;
}

// ============================================
// AddFreeNoteButton Component
// ============================================

interface AddFreeNoteButtonProps {
  onClick: () => void;
  className?: string;
}

export function AddFreeNoteButton({ onClick, className = '' }: AddFreeNoteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full py-3 px-4 border-2 border-dashed border-blue-300 rounded-lg
        text-blue-600 hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50
        transition-colors flex items-center justify-center gap-2 ${className}`}
    >
      <FilePlus className="h-5 w-5" />
      <span className="font-medium">+ Ajouter une note libre</span>
      <span className="text-sm text-blue-400">(contenu spécifique au dossier)</span>
    </button>
  );
}

export default FreeNoteBlock;
