import React, { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Code,
  Eye,
  Hash,
  HelpCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/Spinner';
import {
  useDocumentBlock,
  useCreateDocumentBlock,
  useUpdateDocumentBlock,
  useExtractVariables,
} from '@/hooks/useDocumentBuilder';
import {
  BLOCK_CATEGORY_LABELS,
  VARIABLE_TYPE_LABELS,
  type BlockCategory,
  type VariableType,
  type BlockVariable,
} from '@/lib/types/documentBuilder';

// Form validation schema
const blockFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(255, 'Le titre est trop long'),
  category: z.string().min(1, 'La catégorie est requise'),
  content: z.string().min(1, 'Le contenu est requis').max(50000, 'Le contenu est trop long'),
  tags: z.string().optional(),
  isMandatory: z.boolean().optional().default(false),
  displayOrder: z.number().optional().default(0),
});

type BlockFormData = z.infer<typeof blockFormSchema>;

// Common variable suggestions
const VARIABLE_SUGGESTIONS = [
  { name: 'client.nom', type: 'string' as VariableType },
  { name: 'client.prenom', type: 'string' as VariableType },
  { name: 'client.adresse', type: 'text' as VariableType },
  { name: 'affaire.numero_rg', type: 'string' as VariableType },
  { name: 'affaire.juridiction', type: 'string' as VariableType },
  { name: 'date_assignation', type: 'date' as VariableType },
  { name: 'montant', type: 'number' as VariableType },
  { name: 'avocat.nom', type: 'string' as VariableType },
];

export const DocumentBlockFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';

  const [variables, setVariables] = useState<BlockVariable[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const { data: existingBlock, isLoading: isLoadingBlock } = useDocumentBlock(
    isEditing ? id : undefined
  );

  const createBlockMutation = useCreateDocumentBlock();
  const updateBlockMutation = useUpdateDocumentBlock();
  const { mutateAsync: extractVariables } = useExtractVariables();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BlockFormData>({
    resolver: zodResolver(blockFormSchema),
    defaultValues: {
      title: '',
      category: '',
      content: '',
      tags: '',
      isMandatory: false,
      displayOrder: 0,
    },
  });

  const contentValue = watch('content');

  // Load existing block data
  useEffect(() => {
    if (existingBlock) {
      setValue('title', existingBlock.title);
      setValue('category', existingBlock.category);
      setValue('content', existingBlock.content);
      setValue('isMandatory', existingBlock.isMandatory);
      setValue('displayOrder', existingBlock.displayOrder || 0);
      setTags(existingBlock.tags || []);
      setVariables(existingBlock.variables || []);
    }
  }, [existingBlock, setValue]);

  // Extract variables from content (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (contentValue && contentValue.length > 0) {
        try {
          const result = await extractVariables(contentValue);
          if (result.validation?.valid) {
            setSyntaxError(null);
            // Merge extracted variables with existing ones (preserve user customizations)
            const extractedVars = result.variables || [];
            setVariables((prev) => {
              const merged: BlockVariable[] = [];
              const existingNames = new Set(prev.map((v) => v.name));

              // Keep existing variables
              merged.push(...prev);

              // Add new variables from extraction
              for (const v of extractedVars) {
                if (!existingNames.has(v.name)) {
                  merged.push({
                    name: v.name,
                    type: v.type as VariableType,
                    required: v.required || false,
                    description: v.description,
                  });
                }
              }

              return merged;
            });
          } else {
            setSyntaxError(result.validation?.errors?.[0] || 'Erreur de syntaxe');
          }
        } catch {
          // Ignore extraction errors
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [contentValue, extractVariables]);

  // Handle form submission
  const onSubmit = async (data: BlockFormData) => {
    const payload = {
      title: data.title,
      category: data.category as BlockCategory,
      content: data.content,
      variables,
      tags,
      isMandatory: data.isMandatory,
      displayOrder: data.displayOrder,
    };

    if (isEditing) {
      await updateBlockMutation.mutateAsync({
        id: id!,
        input: payload,
      });
    } else {
      await createBlockMutation.mutateAsync(payload);
    }

    navigate('/document-blocks');
  };

  // Handle tag management
  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Handle variable management
  const updateVariable = (index: number, field: keyof BlockVariable, value: unknown) => {
    setVariables((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeVariable = (index: number) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  };

  const addVariable = () => {
    setVariables((prev) => [
      ...prev,
      { name: '', type: 'string', required: false },
    ]);
  };

  // Insert variable at cursor position
  const insertVariable = (varName: string) => {
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = contentValue || '';
      const newContent =
        currentContent.substring(0, start) +
        `{{${varName}}}` +
        currentContent.substring(end);
      setValue('content', newContent, { shouldDirty: true });

      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        const newPos = start + varName.length + 4;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    }
  };

  // Render content preview
  const renderPreview = () => {
    let preview = contentValue || '';
    // Highlight variables
    preview = preview.replace(
      /\{\{([^}]+)\}\}/g,
      '<mark class="bg-yellow-200 px-1 rounded">[$1]</mark>'
    );
    // Convert newlines to <br>
    preview = preview.replace(/\n/g, '<br>');
    return preview;
  };

  if (isEditing && isLoadingBlock) {
    return (
      <div className="p-6">
        <LoadingState message="Chargement du bloc..." />
      </div>
    );
  }

  if (isEditing && existingBlock?.isSystemBlock) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Bloc système non modifiable
          </h2>
          <p className="text-gray-600 mb-4">
            Les blocs système ne peuvent pas être modifiés. Vous pouvez les dupliquer pour créer
            votre propre version.
          </p>
          <Button onClick={() => navigate('/document-blocks')}>Retour à la liste</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/document-blocks"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Modifier le bloc' : 'Nouveau bloc de document'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditing
                ? 'Modifiez le contenu et les variables du bloc'
                : 'Créez un nouveau bloc de contenu réutilisable'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/document-blocks')}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || !!syntaxError}
            isLoading={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? 'Enregistrer' : 'Créer le bloc'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h2>

              <div className="space-y-4">
                <Input
                  label="Titre du bloc"
                  placeholder="Ex: Introduction assignation TJ"
                  error={errors.title?.message}
                  required
                  {...register('title')}
                />

                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Catégorie"
                      options={[
                        { value: '', label: 'Sélectionner une catégorie' },
                        ...Object.entries(BLOCK_CATEGORY_LABELS).map(([value, label]) => ({
                          value,
                          label,
                        })),
                      ]}
                      error={errors.category?.message}
                      required
                      {...field}
                    />
                  )}
                />

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag) => (
                      <Badge key={tag} className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ajouter un tag..."
                      value={tagInput}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Content Editor */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Contenu du bloc
                </h2>
                <div className="flex items-center gap-2">
                  {syntaxError ? (
                    <span className="flex items-center text-red-600 text-sm">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {syntaxError}
                    </span>
                  ) : contentValue ? (
                    <span className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Syntaxe valide
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {showPreview ? 'Éditeur' : 'Aperçu'}
                  </Button>
                </div>
              </div>

              {/* Variable Insertion Toolbar */}
              <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">Insérer:</span>
                {VARIABLE_SUGGESTIONS.map((v) => (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => insertVariable(v.name)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded whitespace-nowrap"
                  >
                    {`{{${v.name}}}`}
                  </button>
                ))}
              </div>

              {showPreview ? (
                <div
                  className="min-h-[300px] p-4 bg-gray-50 rounded-lg border prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderPreview() }}
                />
              ) : (
                <textarea
                  {...register('content')}
                  className={`w-full h-[300px] p-4 font-mono text-sm border rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.content ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Entrez le contenu du bloc avec des variables {{variable}}..."
                />
              )}
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}

              <p className="mt-2 text-sm text-gray-500">
                Utilisez la syntaxe Handlebars pour les variables: {`{{variable}}`},
                conditionnels: {`{{#if condition}}...{{/if}}`},
                boucles: {`{{#each items}}...{{/each}}`}
              </p>
            </Card>

            {/* Variables */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Variables détectées ({variables.length})
                </h2>
                <Button type="button" variant="outline" size="sm" onClick={addVariable}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter manuellement
                </Button>
              </div>

              {variables.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Aucune variable détectée. Ajoutez des variables au format {`{{nom_variable}}`} dans
                  le contenu.
                </p>
              ) : (
                <div className="space-y-3">
                  {variables.map((variable, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <Input
                        value={variable.name}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          updateVariable(index, 'name', e.target.value)
                        }
                        placeholder="Nom de la variable"
                        className="flex-1"
                      />
                      <Select
                        value={variable.type}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          updateVariable(index, 'type', e.target.value)
                        }
                        options={Object.entries(VARIABLE_TYPE_LABELS).map(([value, label]) => ({
                          value,
                          label,
                        }))}
                        className="w-32"
                      />
                      <label className="flex items-center gap-2 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={variable.required}
                          onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600"
                        />
                        <span className="text-sm">Requis</span>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariable(index)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Options */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Options</h2>

              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    {...register('isMandatory')}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Bloc obligatoire</span>
                    <p className="text-sm text-gray-500">
                      Ce bloc sera inclus par défaut dans les templates
                    </p>
                  </div>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordre d'affichage
                  </label>
                  <Input
                    type="number"
                    min={0}
                    {...register('displayOrder', { valueAsNumber: true })}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Les blocs sont triés par ordre croissant
                  </p>
                </div>
              </div>
            </Card>

            {/* Help */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-medium text-blue-900 flex items-center gap-2 mb-2">
                <HelpCircle className="h-5 w-5" />
                Aide
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>
                  <strong>Variables:</strong> Utilisez {`{{nom}}`} pour insérer une variable
                </li>
                <li>
                  <strong>Conditions:</strong> {`{{#if condition}}...{{/if}}`}
                </li>
                <li>
                  <strong>Boucles:</strong> {`{{#each liste}}{{this}}{{/each}}`}
                </li>
                <li>
                  <strong>Formatage:</strong> Les balises HTML basiques sont supportées
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DocumentBlockFormPage;
