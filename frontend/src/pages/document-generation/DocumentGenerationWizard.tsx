import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Edit3,
  Eye,
  Send,
  Check,
  ArrowLeft,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useCreateGeneratedDocument, useFinalizeDocument } from '@/hooks/useDocumentBuilder';
import type { BuilderTemplate, OutputFormat, CreateGeneratedDocumentInput } from '@/lib/types/documentBuilder';

import Step1TemplateSelector from './components/Step1TemplateSelector';
import Step2VariablesFiller from './components/Step2VariablesFiller';
import Step3Preview from './components/Step3Preview';
import Step4Workflow from './components/Step4Workflow';

// Wizard Step Definition
interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    title: 'Modele',
    description: 'Choisir un modele et un dossier',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: 2,
    title: 'Variables',
    description: 'Remplir les champs du document',
    icon: <Edit3 className="h-5 w-5" />,
  },
  {
    id: 3,
    title: 'Apercu',
    description: 'Verifier le document genere',
    icon: <Eye className="h-5 w-5" />,
  },
  {
    id: 4,
    title: 'Actions',
    description: 'Telecharger ou envoyer',
    icon: <Send className="h-5 w-5" />,
  },
];

// Wizard State
interface WizardState {
  selectedTemplate: BuilderTemplate | null;
  selectedFolderId: string | null;
  filledVariables: Record<string, any>;
  generatedDocumentId: string | null;
  selectedFreeNoteIds: string[];
}

const INITIAL_STATE: WizardState = {
  selectedTemplate: null,
  selectedFolderId: null,
  filledVariables: {},
  generatedDocumentId: null,
  selectedFreeNoteIds: [],
};

export const DocumentGenerationWizard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get initial folder from URL params if provided
  const initialFolderId = searchParams.get('folderId');

  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<WizardState>({
    ...INITIAL_STATE,
    selectedFolderId: initialFolderId,
  });

  // Mutations
  const createDocumentMutation = useCreateGeneratedDocument();
  const finalizeDocumentMutation = useFinalizeDocument();

  // Step navigation
  const goToStep = (step: number) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => goToStep(currentStep + 1);
  const prevStep = () => goToStep(currentStep - 1);

  // State update handlers
  const handleSelectTemplate = useCallback((template: BuilderTemplate) => {
    setState((prev) => ({
      ...prev,
      selectedTemplate: template,
    }));
  }, []);

  const handleSelectFolder = useCallback((folderId: string) => {
    setState((prev) => ({
      ...prev,
      selectedFolderId: folderId,
    }));
  }, []);

  const handleUpdateVariables = useCallback((variables: Record<string, any>) => {
    setState((prev) => ({
      ...prev,
      filledVariables: variables,
    }));
  }, []);

  const handleUpdateFreeNotes = useCallback((noteIds: string[]) => {
    setState((prev) => ({
      ...prev,
      selectedFreeNoteIds: noteIds,
    }));
  }, []);

  // Create document when moving from step 2 to step 3
  const handleStep2Next = async () => {
    if (!state.selectedTemplate || !state.selectedFolderId) return;

    // Create draft document if not already created
    if (!state.generatedDocumentId) {
      try {
        const input: CreateGeneratedDocumentInput = {
          templateId: state.selectedTemplate.id,
          folderId: state.selectedFolderId,
          title: `${state.selectedTemplate.name} - ${new Date().toLocaleDateString('fr-FR')}`,
          filledVariables: state.filledVariables,
          freeNoteIds: state.selectedFreeNoteIds.length > 0 ? state.selectedFreeNoteIds : undefined,
        };

        const doc = await createDocumentMutation.mutateAsync(input);
        setState((prev) => ({
          ...prev,
          generatedDocumentId: doc.id,
        }));
      } catch {
        // Error is handled by the mutation
        return;
      }
    }

    nextStep();
  };

  // Finalize document
  const handleFinalize = async (options: { outputFormat: OutputFormat }) => {
    if (!state.generatedDocumentId) return;

    await finalizeDocumentMutation.mutateAsync({
      id: state.generatedDocumentId,
      input: { outputFormat: options.outputFormat },
    });
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {WIZARD_STEPS.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const isClickable = isCompleted || step.id === currentStep;

        return (
          <React.Fragment key={step.id}>
            <button
              type="button"
              onClick={() => isClickable && goToStep(step.id)}
              disabled={!isClickable}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary-50 border-2 border-primary-500'
                  : isCompleted
                  ? 'bg-green-50 border-2 border-green-500 hover:bg-green-100 cursor-pointer'
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <div
                className={`p-2 rounded-full ${
                  isActive
                    ? 'bg-primary-100 text-primary-600'
                    : isCompleted
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : step.icon}
              </div>
              <div className="text-left hidden md:block">
                <p
                  className={`text-sm font-medium ${
                    isActive
                      ? 'text-primary-700'
                      : isCompleted
                      ? 'text-green-700'
                      : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </button>
            {index < WIZARD_STEPS.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1TemplateSelector
            selectedTemplateId={state.selectedTemplate?.id}
            selectedFolderId={state.selectedFolderId || undefined}
            onSelectTemplate={handleSelectTemplate}
            onSelectFolder={handleSelectFolder}
            onNext={nextStep}
          />
        );

      case 2:
        if (!state.selectedTemplate) {
          goToStep(1);
          return null;
        }
        return (
          <Step2VariablesFiller
            templateId={state.selectedTemplate.id}
            templateName={state.selectedTemplate.name}
            filledVariables={state.filledVariables}
            onUpdateVariables={handleUpdateVariables}
            onNext={handleStep2Next}
            onBack={prevStep}
            folderId={state.selectedFolderId || undefined}
            selectedFreeNoteIds={state.selectedFreeNoteIds}
            onUpdateFreeNotes={handleUpdateFreeNotes}
          />
        );

      case 3:
        if (!state.selectedTemplate) {
          goToStep(1);
          return null;
        }
        return (
          <Step3Preview
            templateId={state.selectedTemplate.id}
            templateName={state.selectedTemplate.name}
            variables={state.filledVariables}
            onNext={nextStep}
            onBack={prevStep}
            onEditVariables={() => goToStep(2)}
          />
        );

      case 4:
        if (!state.selectedTemplate) {
          goToStep(1);
          return null;
        }
        return (
          <Step4Workflow
            documentId={state.generatedDocumentId || undefined}
            templateName={state.selectedTemplate.name}
            workflowConfig={state.selectedTemplate.workflowConfig}
            onBack={prevStep}
            onFinalize={handleFinalize}
            isLoading={finalizeDocumentMutation.isPending}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/document-generation')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Generer un document</h1>
            <p className="text-gray-500 mt-1">
              Suivez les etapes pour creer votre document juridique
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <Card className="p-6">
        {renderStepContent()}
      </Card>
    </div>
  );
};

export default DocumentGenerationWizard;
