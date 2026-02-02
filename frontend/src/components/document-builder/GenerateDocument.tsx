import React, { useState, useEffect, ChangeEvent, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
  Eye,
  AlertCircle,
  Save,
  Download,
  FolderOpen,
  Sparkles,
  Info,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { LoadingState } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import {
  useBuilderTemplate,
  useBuilderTemplateVariables,
  useCreateGeneratedDocument,
  useFinalizeDocument,
} from '@/hooks/useDocumentBuilder';
import { useFolders } from '@/hooks/useFolders';
import { useAutoFilledVariables } from '@/hooks/useAutoFill';
import type { BlockVariable } from '@/lib/types/documentBuilder';
import {
  DOCUMENT_TYPE_LABELS,
  VARIABLE_TYPE_LABELS,
} from '@/lib/types/documentBuilder';

interface Step {
  id: number;
  name: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  { id: 1, name: 'Dossier', icon: FolderOpen },
  { id: 2, name: 'Variables', icon: FileText },
  { id: 3, name: 'Apercu', icon: Eye },
  { id: 4, name: 'Enregistrement', icon: Save },
];

export const GenerateDocument: React.FC = () => {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const [searchParams] = useSearchParams();
  const initialFolderId = searchParams.get('folderId') || '';

  const [currentStep, setCurrentStep] = useState(initialFolderId ? 2 : 1);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [manuallyEditedFields, setManuallyEditedFields] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState(initialFolderId);
  const [preview, setPreview] = useState('');
  const [missingVariables, setMissingVariables] = useState<string[]>([]);

  const { data: template, isLoading: loadingTemplate } = useBuilderTemplate(templateId);
  const { data: templateVariables, isLoading: loadingVariables } = useBuilderTemplateVariables(templateId);
  const { data: folders } = useFolders();
  const createDocumentMutation = useCreateGeneratedDocument();
  const finalizeMutation = useFinalizeDocument();

  // Auto-fill data from folder, client, and avocat
  const {
    autoFilledVariables,
    autoFilledCount,
    isLoading: loadingAutoFill,
  } = useAutoFilledVariables(folderId || undefined);

  // Track which variables are auto-filled vs manually edited
  const autoFilledFieldNames = useMemo(() => {
    return new Set(Object.keys(autoFilledVariables).filter(key => autoFilledVariables[key] != null));
  }, [autoFilledVariables]);

  // Merge auto-filled values with user input (user input takes precedence)
  useEffect(() => {
    if (autoFilledVariables && Object.keys(autoFilledVariables).length > 0) {
      setVariables(prev => {
        const merged = { ...autoFilledVariables };
        // Preserve manually edited values
        manuallyEditedFields.forEach(field => {
          if (prev[field] !== undefined) {
            merged[field] = prev[field];
          }
        });
        return merged;
      });
    }
  }, [autoFilledVariables, manuallyEditedFields]);

  // Initialize title when template loads
  useEffect(() => {
    if (template) {
      setTitle(`${template.name} - ${new Date().toLocaleDateString('fr-FR')}`);
    }
  }, [template]);

  // Group variables by required/optional
  const requiredVariables = templateVariables?.filter((v) => v.required) || [];
  const optionalVariables = templateVariables?.filter((v) => !v.required) || [];

  const handleVariableChange = (name: string, value: any) => {
    setVariables((prev) => ({ ...prev, [name]: value }));
    // Mark field as manually edited
    setManuallyEditedFields((prev) => new Set([...prev, name]));
  };

  // Get field status for visual indicators
  const getFieldStatus = (fieldName: string): 'auto-filled' | 'manual' | 'missing' | 'empty' => {
    const value = variables[fieldName];
    const isAutoFilled = autoFilledFieldNames.has(fieldName) && !manuallyEditedFields.has(fieldName);
    const hasValue = value !== undefined && value !== null && value !== '';

    if (hasValue && isAutoFilled) return 'auto-filled';
    if (hasValue) return 'manual';
    const isRequired = requiredVariables.some(v => v.name === fieldName);
    if (isRequired) return 'missing';
    return 'empty';
  };

  const getFieldClassName = (fieldName: string) => {
    const status = getFieldStatus(fieldName);
    switch (status) {
      case 'auto-filled':
        return 'ring-2 ring-green-500 bg-green-50';
      case 'missing':
        return 'ring-2 ring-amber-500 bg-amber-50';
      default:
        return '';
    }
  };

  const renderVariableInput = (variable: BlockVariable) => {
    const value = variables[variable.name] || '';
    const fieldClass = getFieldClassName(variable.name);

    switch (variable.type) {
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleVariableChange(variable.name, e.target.value)}
            className={fieldClass}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleVariableChange(variable.name, e.target.value)}
            className={fieldClass}
          />
        );
      case 'boolean':
        return (
          <Select
            value={value === true ? 'true' : value === false ? 'false' : ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              handleVariableChange(variable.name, e.target.value === 'true')
            }
            options={[
              { value: '', label: 'Selectionner...' },
              { value: 'true', label: 'Oui' },
              { value: 'false', label: 'Non' },
            ]}
            className={fieldClass}
          />
        );
      case 'text':
        return (
          <textarea
            value={value}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleVariableChange(variable.name, e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] ${fieldClass}`}
            placeholder={variable.description || `Entrez ${variable.name}...`}
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleVariableChange(variable.name, e.target.value)}
            placeholder={variable.description || `Entrez ${variable.name}...`}
            className={fieldClass}
          />
        );
    }
  };

  const generatePreview = () => {
    // Simple client-side preview generation
    let content = '';
    const missing: string[] = [];

    if (template?.expandedBlocks) {
      template.expandedBlocks.forEach((ref) => {
        if (ref.block) {
          let blockContent = ref.block.content;

          // Replace variables
          Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            blockContent = blockContent.replace(regex, String(value || `[${key}]`));
          });

          // Find missing required variables
          const variableMatches = blockContent.match(/\{\{([^}]+)\}\}/g) || [];
          variableMatches.forEach((match) => {
            const varName = match.replace(/\{\{|\}\}/g, '');
            const isRequired = requiredVariables.some((v) => v.name === varName);
            if (isRequired && !missing.includes(varName)) {
              missing.push(varName);
            }
          });

          content += blockContent + '\n\n';
        }
      });
    }

    setPreview(content);
    setMissingVariables(missing);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!folderId;
      case 2:
        return requiredVariables.every((v) => variables[v.name]);
      case 3:
        return missingVariables.length === 0;
      case 4:
        return title && folderId;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 2) {
      generatePreview();
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSave = async (finalize: boolean) => {
    if (!templateId || !folderId) return;

    const document = await createDocumentMutation.mutateAsync({
      templateId,
      folderId,
      title,
      filledVariables: variables,
    });

    if (finalize) {
      await finalizeMutation.mutateAsync({ id: document.id });
    }

    navigate('/document-builder/documents');
  };

  if (loadingTemplate || loadingVariables) {
    return <LoadingState message="Chargement du modele..." />;
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Modele non trouve</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Generer un document</h1>
        <p className="text-gray-500 mt-1">
          {template.name} - {DOCUMENT_TYPE_LABELS[template.documentType]}
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <Card className="p-6">
        {/* Step 1: Folder Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Selectionner le dossier</h2>
            <p className="text-sm text-gray-600">
              Choisissez le dossier pour lequel vous souhaitez generer ce document.
              Les informations du dossier et du client seront utilisees pour pre-remplir les variables.
            </p>

            <Select
              label="Dossier"
              value={folderId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                setFolderId(e.target.value);
                // Reset manually edited fields when folder changes
                setManuallyEditedFields(new Set());
              }}
              options={[
                { value: '', label: 'Selectionner un dossier...' },
                ...(folders?.data?.map((f) => ({
                  value: f.id,
                  label: f.name,
                })) || []),
              ]}
            />

            {folderId && loadingAutoFill && (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full" />
                <span className="text-sm">Chargement des donnees...</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Variables */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Remplir les variables</h2>

            {/* Auto-fill alert */}
            {autoFilledCount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Auto-remplissage active
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      {autoFilledCount} variable(s) ont ete pre-remplies automatiquement
                      a partir des informations du dossier et du client.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded ring-2 ring-green-500 bg-green-50" />
                <span>Pre-rempli automatiquement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded ring-2 ring-amber-500 bg-amber-50" />
                <span>Obligatoire non rempli</span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-400" />
                <span>Vous pouvez modifier les valeurs pre-remplies</span>
              </div>
            </div>

            {requiredVariables.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="text-red-500">*</span>
                  Variables obligatoires
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requiredVariables.map((variable) => (
                    <div key={variable.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {variable.name}
                        <span className="text-xs text-gray-500 ml-2">
                          ({VARIABLE_TYPE_LABELS[variable.type]})
                        </span>
                        {getFieldStatus(variable.name) === 'auto-filled' && (
                          <span className="text-xs text-green-600 ml-2">
                            (auto)
                          </span>
                        )}
                      </label>
                      {renderVariableInput(variable)}
                      {variable.description && (
                        <p className="mt-1 text-xs text-gray-500">{variable.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {optionalVariables.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Variables optionnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {optionalVariables.map((variable) => (
                    <div key={variable.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {variable.name}
                        <span className="text-xs text-gray-500 ml-2">
                          ({VARIABLE_TYPE_LABELS[variable.type]})
                        </span>
                        {getFieldStatus(variable.name) === 'auto-filled' && (
                          <span className="text-xs text-green-600 ml-2">
                            (auto)
                          </span>
                        )}
                      </label>
                      {renderVariableInput(variable)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {templateVariables?.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                Ce modele ne contient pas de variables a remplir.
              </p>
            )}
          </div>
        )}

        {/* Step 3: Preview */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Apercu du document</h2>
              {missingVariables.length > 0 && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {missingVariables.length} variable(s) non remplie(s)
                  </span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-6 max-h-[500px] overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-serif leading-relaxed">
                {preview || 'Aucun apercu disponible'}
              </pre>
            </div>
          </div>
        )}

        {/* Step 4: Save */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Enregistrer le document</h2>

            <div className="space-y-4">
              <Input
                label="Titre du document"
                value={title}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder="Ex: Assignation - Affaire Dupont"
              />

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Dossier de destination:</span>{' '}
                  {folders?.data?.find((f) => f.id === folderId)?.name || 'Non selectionne'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Precedent
        </Button>

        <div className="flex items-center gap-3">
          {currentStep === steps.length ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                isLoading={createDocumentMutation.isPending}
                disabled={!canProceed()}
              >
                <Save className="h-4 w-4 mr-2" />
                Enregistrer comme brouillon
              </Button>
              <Button
                onClick={() => handleSave(true)}
                isLoading={createDocumentMutation.isPending || finalizeMutation.isPending}
                disabled={!canProceed()}
              >
                <Download className="h-4 w-4 mr-2" />
                Finaliser et enregistrer
              </Button>
            </>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
