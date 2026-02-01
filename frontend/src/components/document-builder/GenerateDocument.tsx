import React, { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
  Eye,
  AlertCircle,
  Save,
  Download,
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
  { id: 1, name: 'Variables', icon: FileText },
  { id: 2, name: 'Apercu', icon: Eye },
  { id: 3, name: 'Enregistrement', icon: Save },
];

export const GenerateDocument: React.FC = () => {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();

  const [currentStep, setCurrentStep] = useState(1);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState('');
  const [preview, setPreview] = useState('');
  const [missingVariables, setMissingVariables] = useState<string[]>([]);

  const { data: template, isLoading: loadingTemplate } = useBuilderTemplate(templateId);
  const { data: templateVariables, isLoading: loadingVariables } = useBuilderTemplateVariables(templateId);
  const { data: folders } = useFolders();
  const createDocumentMutation = useCreateGeneratedDocument();
  const finalizeMutation = useFinalizeDocument();

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
  };

  const renderVariableInput = (variable: BlockVariable) => {
    const value = variables[variable.name] || '';

    switch (variable.type) {
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleVariableChange(variable.name, e.target.value)}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleVariableChange(variable.name, e.target.value)}
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
          />
        );
      case 'text':
        return (
          <textarea
            value={value}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleVariableChange(variable.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
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
        return requiredVariables.every((v) => variables[v.name]);
      case 2:
        return missingVariables.length === 0;
      case 3:
        return title && folderId;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
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
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Remplir les variables</h2>

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

        {currentStep === 2 && (
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

        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Enregistrer le document</h2>

            <div className="space-y-4">
              <Input
                label="Titre du document"
                value={title}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder="Ex: Assignation - Affaire Dupont"
              />

              <Select
                label="Dossier de destination"
                value={folderId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFolderId(e.target.value)}
                options={[
                  { value: '', label: 'Selectionner un dossier...' },
                  ...(folders?.data?.map((f) => ({
                    value: f.id,
                    label: f.name,
                  })) || []),
                ]}
              />
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
