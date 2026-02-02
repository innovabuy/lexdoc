import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ChevronLeft, ChevronRight, AlertCircle, User, Calendar, Hash, FileText, ToggleLeft, List, FilePlus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/Spinner';
import { useBuilderTemplateVariables } from '@/hooks/useDocumentBuilder';
import { useFolderFreeNotes } from '@/hooks/useFreeNotes';
import { FreeNoteEditor, AddFreeNoteButton } from '@/components/FreeNoteBlock';
import type { FreeNote } from '@/lib/api/freeNotes';
import type { BlockVariable, VariableType } from '@/lib/types/documentBuilder';
import { VARIABLE_TYPE_LABELS } from '@/lib/types/documentBuilder';

interface Step2VariablesFillerProps {
  templateId: string;
  templateName: string;
  filledVariables: Record<string, any>;
  onUpdateVariables: (variables: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  folderId?: string;
  selectedFreeNoteIds?: string[];
  onUpdateFreeNotes?: (noteIds: string[]) => void;
}

// Variable type icons
const VARIABLE_TYPE_ICONS: Record<VariableType, React.ReactNode> = {
  string: <User className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  boolean: <ToggleLeft className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  array: <List className="h-4 w-4" />,
};

// Group variables by category based on naming convention
function groupVariables(variables: BlockVariable[]): Record<string, BlockVariable[]> {
  const groups: Record<string, BlockVariable[]> = {};

  variables.forEach((v) => {
    const parts = v.name.split('_');
    const category = parts[0].toLowerCase();

    // Map common prefixes to French labels
    const categoryMap: Record<string, string> = {
      client: 'Client',
      adversaire: 'Partie adverse',
      avocat: 'Avocat',
      affaire: 'Affaire',
      date: 'Dates',
      montant: 'Montants',
      tribunal: 'Tribunal',
      juge: 'Juge',
      general: 'General',
    };

    const groupName = categoryMap[category] || 'Autres';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(v);
  });

  return groups;
}

// Format variable name for display
function formatVariableName(name: string): string {
  return name
    .split('_')
    .slice(1) // Remove prefix
    .join(' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/\b\w/g, (l) => l.toUpperCase()) || name;
}

export const Step2VariablesFiller: React.FC<Step2VariablesFillerProps> = ({
  templateId,
  templateName,
  filledVariables,
  onUpdateVariables,
  onNext,
  onBack,
  folderId,
  selectedFreeNoteIds = [],
  onUpdateFreeNotes,
}) => {
  // State for free notes
  const [isAddingFreeNote, setIsAddingFreeNote] = useState(false);
  const [localSelectedNoteIds, setLocalSelectedNoteIds] = useState<string[]>(selectedFreeNoteIds);

  // Fetch template variables
  const { data: variables, isLoading, error } = useBuilderTemplateVariables(templateId);

  // Fetch folder free notes
  const { data: freeNotes = [], isLoading: isLoadingNotes } = useFolderFreeNotes(folderId);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: filledVariables,
  });

  // Update form values when filledVariables changes
  useEffect(() => {
    Object.entries(filledVariables).forEach(([key, value]) => {
      setValue(key, value);
    });
  }, [filledVariables, setValue]);

  // Watch all values and update parent
  const watchedValues = watch();
  useEffect(() => {
    onUpdateVariables(watchedValues);
  }, [watchedValues, onUpdateVariables]);

  const onSubmit = (data: Record<string, any>) => {
    onUpdateVariables(data);
    onNext();
  };

  if (isLoading) {
    return <LoadingState message="Chargement des variables..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-500">
          Impossible de charger les variables du modele.
        </p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
      </div>
    );
  }

  const variablesList = variables || [];
  const groupedVariables = groupVariables(variablesList);
  const requiredVariables = variablesList.filter((v) => v.required);
  const filledCount = Object.values(watchedValues).filter((v) => v !== '' && v !== null && v !== undefined).length;

  const renderVariableInput = (variable: BlockVariable) => {
    const { name, type, required, description } = variable;

    return (
      <Controller
        key={name}
        name={name}
        control={control}
        rules={{ required: required ? 'Ce champ est requis' : false }}
        render={({ field }) => {
          switch (type) {
            case 'text':
              return (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formatVariableName(name)}
                    {required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <textarea
                    {...field}
                    rows={4}
                    placeholder={description || `Saisir ${formatVariableName(name).toLowerCase()}...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {errors[name] && (
                    <p className="text-sm text-red-600 mt-1">{errors[name]?.message as string}</p>
                  )}
                </div>
              );

            case 'number':
              return (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formatVariableName(name)}
                    {required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <Input
                    {...field}
                    type="number"
                    placeholder={description || '0'}
                    error={errors[name]?.message as string}
                  />
                </div>
              );

            case 'date':
              return (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formatVariableName(name)}
                    {required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <Input
                    {...field}
                    type="date"
                    error={errors[name]?.message as string}
                  />
                </div>
              );

            case 'boolean':
              return (
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value || false}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {formatVariableName(name)}
                      {required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                  </label>
                  {description && (
                    <p className="text-xs text-gray-500 mt-1 ml-8">{description}</p>
                  )}
                </div>
              );

            case 'array':
              return (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formatVariableName(name)}
                    {required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <textarea
                    {...field}
                    value={Array.isArray(field.value) ? field.value.join('\n') : field.value || ''}
                    onChange={(e) => field.onChange(e.target.value.split('\n').filter(Boolean))}
                    rows={3}
                    placeholder={description || 'Une valeur par ligne...'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Une valeur par ligne</p>
                  {errors[name] && (
                    <p className="text-sm text-red-600 mt-1">{errors[name]?.message as string}</p>
                  )}
                </div>
              );

            default: // string
              return (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formatVariableName(name)}
                    {required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <Input
                    {...field}
                    placeholder={description || `Saisir ${formatVariableName(name).toLowerCase()}...`}
                    error={errors[name]?.message as string}
                  />
                </div>
              );
          }
        }}
      />
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{templateName}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {variablesList.length} variable{variablesList.length > 1 ? 's' : ''} a remplir
              {requiredVariables.length > 0 && (
                <span className="text-red-600 ml-2">
                  ({requiredVariables.length} obligatoire{requiredVariables.length > 1 ? 's' : ''})
                </span>
              )}
            </p>
          </div>
          <Badge variant={filledCount === variablesList.length ? 'success' : 'warning'}>
            {filledCount}/{variablesList.length} remplie{filledCount > 1 ? 's' : ''}
          </Badge>
        </div>
      </Card>

      {/* Variables by Group */}
      {Object.entries(groupedVariables).map(([groupName, groupVars]) => (
        <Card key={groupName} className="p-4">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <div className="p-2 bg-gray-100 rounded-lg">
              {VARIABLE_TYPE_ICONS[groupVars[0]?.type || 'string']}
            </div>
            <h4 className="font-medium text-gray-900">{groupName}</h4>
            <Badge variant="gray" className="ml-auto">
              {groupVars.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupVars.map(renderVariableInput)}
          </div>
        </Card>
      ))}

      {variablesList.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Ce modele n'a aucune variable a remplir.</p>
          <p className="text-sm text-gray-400 mt-1">
            Vous pouvez passer directement a l'apercu.
          </p>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        {Object.entries(VARIABLE_TYPE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1">
            {VARIABLE_TYPE_ICONS[type as VariableType]}
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Free Notes Section */}
      {folderId && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FilePlus className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Notes libres</h4>
              <p className="text-xs text-gray-500">
                Contenu personnalise specifique a ce dossier
              </p>
            </div>
            {freeNotes.length > 0 && (
              <Badge variant="primary">
                {localSelectedNoteIds.length}/{freeNotes.length} selectionnee{localSelectedNoteIds.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {isLoadingNotes ? (
            <div className="py-4 text-center text-gray-500 text-sm">
              Chargement des notes...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Existing Free Notes */}
              {freeNotes.length > 0 ? (
                <div className="space-y-3">
                  {freeNotes.map((note: FreeNote) => {
                    const isSelected = localSelectedNoteIds.includes(note.id);
                    return (
                      <div
                        key={note.id}
                        className={`border-2 rounded-lg p-3 transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          const newIds = isSelected
                            ? localSelectedNoteIds.filter((id) => id !== note.id)
                            : [...localSelectedNoteIds, note.id];
                          setLocalSelectedNoteIds(newIds);
                          onUpdateFreeNotes?.(newIds);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <h5 className="font-medium text-gray-900 text-sm">{note.title}</h5>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                {note.content.substring(0, 150)}
                                {note.content.length > 150 ? '...' : ''}
                              </p>
                            </div>
                          </div>
                          {note.metadata?.linkedCategory && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                              {note.metadata.linkedCategory}
                            </span>
                          )}
                        </div>
                        {note.variables && note.variables.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {note.variables.map((v) => (
                              <span
                                key={v.name}
                                className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono"
                              >
                                {`{{${v.name}}}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Aucune note libre pour ce dossier.
                </div>
              )}

              {/* Add New Free Note */}
              {isAddingFreeNote ? (
                <FreeNoteEditor
                  folderId={folderId}
                  onCancel={() => setIsAddingFreeNote(false)}
                  onSuccess={(note) => {
                    setIsAddingFreeNote(false);
                    // Auto-select the new note
                    const newIds = [...localSelectedNoteIds, note.id];
                    setLocalSelectedNoteIds(newIds);
                    onUpdateFreeNotes?.(newIds);
                  }}
                />
              ) : (
                <AddFreeNoteButton onClick={() => setIsAddingFreeNote(true)} />
              )}
            </div>
          )}
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        <Button type="submit">
          Apercu
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </form>
  );
};

export default Step2VariablesFiller;
