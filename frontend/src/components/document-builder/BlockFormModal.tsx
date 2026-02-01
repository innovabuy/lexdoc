import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle, Variable } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import {
  useCreateDocumentBlock,
  useUpdateDocumentBlock,
  useExtractVariables,
} from '@/hooks/useDocumentBuilder';
import type {
  DocumentBlock,
  BlockCategory,
  CreateDocumentBlockInput,
  BlockVariable,
} from '@/lib/types/documentBuilder';
import { BLOCK_CATEGORY_LABELS, VARIABLE_TYPE_LABELS } from '@/lib/types/documentBuilder';

const blockSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(255),
  category: z.string().min(1, 'La categorie est requise'),
  content: z.string().min(1, 'Le contenu est requis'),
  tags: z.string().optional(),
  isMandatory: z.boolean().optional(),
  displayOrder: z.number().optional(),
});

type BlockFormData = z.infer<typeof blockSchema>;

interface BlockFormModalProps {
  block?: DocumentBlock | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BlockFormModal: React.FC<BlockFormModalProps> = ({
  block,
  isOpen,
  onClose,
}) => {
  const [extractedVariables, setExtractedVariables] = useState<BlockVariable[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidSyntax, setIsValidSyntax] = useState(true);

  const createMutation = useCreateDocumentBlock();
  const updateMutation = useUpdateDocumentBlock();
  const extractMutation = useExtractVariables();

  const isEditing = !!block;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<BlockFormData>({
    resolver: zodResolver(blockSchema),
    defaultValues: {
      title: '',
      category: 'INTRO',
      content: '',
      tags: '',
      isMandatory: false,
      displayOrder: 0,
    },
  });

  const content = watch('content');

  // Reset form when block changes
  useEffect(() => {
    if (block) {
      reset({
        title: block.title,
        category: block.category,
        content: block.content,
        tags: block.tags.join(', '),
        isMandatory: block.isMandatory,
        displayOrder: block.displayOrder,
      });
      setExtractedVariables(block.variables);
      setIsValidSyntax(true);
      setValidationErrors([]);
    } else {
      reset({
        title: '',
        category: 'INTRO',
        content: '',
        tags: '',
        isMandatory: false,
        displayOrder: 0,
      });
      setExtractedVariables([]);
      setIsValidSyntax(true);
      setValidationErrors([]);
    }
  }, [block, reset]);

  // Extract variables when content changes
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (content && content.length > 0) {
        try {
          const result = await extractMutation.mutateAsync(content);
          setExtractedVariables(result.variables);
          setIsValidSyntax(result.validation.valid);
          setValidationErrors(result.validation.errors);
        } catch (error) {
          // Handle error silently
        }
      } else {
        setExtractedVariables([]);
        setIsValidSyntax(true);
        setValidationErrors([]);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [content]);

  const onSubmit = async (data: BlockFormData) => {
    const input: CreateDocumentBlockInput = {
      title: data.title,
      category: data.category as BlockCategory,
      content: data.content,
      tags: data.tags
        ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      isMandatory: data.isMandatory,
      displayOrder: data.displayOrder,
      variables: extractedVariables,
    };

    if (isEditing && block) {
      await updateMutation.mutateAsync({ id: block.id, input });
    } else {
      await createMutation.mutateAsync(input);
    }
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Modifier le bloc' : 'Nouveau bloc'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Titre"
            {...register('title')}
            error={errors.title?.message}
            placeholder="Ex: Introduction assignation"
          />
          <Select
            label="Categorie"
            {...register('category')}
            error={errors.category?.message}
            options={Object.entries(BLOCK_CATEGORY_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contenu
          </label>
          <textarea
            {...register('content')}
            className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[200px] ${
              !isValidSyntax
                ? 'border-red-300 bg-red-50'
                : errors.content
                ? 'border-red-300'
                : 'border-gray-300'
            }`}
            placeholder="Entrez le contenu du bloc avec des variables {{variable}}..."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Utilisez la syntaxe Handlebars: {`{{variable}}`}, {`{{#if condition}}...{{/if}}`},{' '}
            {`{{#each items}}...{{/each}}`}
          </p>
        </div>

        {/* Validation Status */}
        {content && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg ${
              isValidSyntax ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            {isValidSyntax ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-700">Syntaxe valide</span>
              </>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-red-700">
                    Erreurs de syntaxe
                  </span>
                </div>
                <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Extracted Variables */}
        {extractedVariables.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Variable className="h-4 w-4" />
              Variables detectees ({extractedVariables.length})
            </h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex flex-wrap gap-2">
                {extractedVariables.map((variable) => (
                  <span
                    key={variable.name}
                    className="px-2 py-1 bg-white border border-gray-200 rounded text-sm font-mono"
                  >
                    {variable.name}{' '}
                    <span className="text-gray-400 text-xs">
                      ({VARIABLE_TYPE_LABELS[variable.type]})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Tags (separes par des virgules)"
            {...register('tags')}
            placeholder="Ex: civil, procedure, tribunal"
          />
          <Input
            label="Ordre d'affichage"
            type="number"
            {...register('displayOrder', { valueAsNumber: true })}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isMandatory"
            {...register('isMandatory')}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="isMandatory" className="text-sm text-gray-700">
            Bloc obligatoire dans les modeles
          </label>
        </div>
      </form>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isPending}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          isLoading={isPending}
          disabled={!isValidSyntax}
        >
          {isEditing ? 'Mettre a jour' : 'Creer le bloc'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
