import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  X,
  FileText,
  AlertTriangle,
  Layers,
  Settings,
  Scale,
  Hash,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/Spinner';
import {
  useBuilderTemplate,
  useCreateBuilderTemplate,
  useUpdateBuilderTemplate,
  useDocumentBlocks,
} from '@/hooks/useDocumentBuilder';
import {
  DOCUMENT_TYPE_LABELS,
  JURIDICTION_LABELS,
  type DocumentBlock,
  type BlockVariable,
  type BlockReference,
  type WorkflowConfig as WorkflowConfigType,
  type LegalMentions,
  type BuilderDocumentType,
  type Juridiction,
} from '@/lib/types/documentBuilder';

import BlockSelector from './components/BlockSelector';
import BlockDragDrop, { SelectedBlock } from './components/BlockDragDrop';
import WorkflowConfig from './components/WorkflowConfig';
import LegalMentionsConfig, {
  LegalMentionsConfigData,
  DEFAULT_LEGAL_MENTIONS_CONFIG,
} from './components/LegalMentionsConfig';
import VariableMapper, { VariableMapping } from './components/VariableMapper';

// Form validation schema
const templateFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
  description: z.string().max(1000, 'La description est trop longue').optional(),
  documentType: z.string().min(1, 'Le type de document est requis'),
  juridiction: z.string().optional(),
  outputFormat: z.enum(['DOCX', 'PDF']).default('DOCX'),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

// Tab type
type TabId = 'composition' | 'variables' | 'legal' | 'workflow';

export const TemplateBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';

  // State
  const [selectedBlocks, setSelectedBlocks] = useState<SelectedBlock[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('composition');
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfigType>({
    signature: { enabled: false },
    lrar: { enabled: false },
    autoStore: { enabled: true },
  });
  const [legalMentionsConfig, setLegalMentionsConfig] = useState<LegalMentionsConfigData>(
    DEFAULT_LEGAL_MENTIONS_CONFIG
  );
  const [variableMappings, setVariableMappings] = useState<VariableMapping[]>([]);

  // Hooks
  const { data: existingTemplate, isLoading: isLoadingTemplate } = useBuilderTemplate(
    isEditing ? id : undefined
  );
  const { data: blocksData } = useDocumentBlocks({ limit: 200 });
  const createTemplateMutation = useCreateBuilderTemplate();
  const updateTemplateMutation = useUpdateBuilderTemplate();

  const allBlocks = blocksData?.data || [];

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: '',
      description: '',
      documentType: '',
      juridiction: '',
      outputFormat: 'DOCX',
    },
  });

  // Load existing template data
  useEffect(() => {
    if (existingTemplate) {
      setValue('name', existingTemplate.name);
      setValue('description', existingTemplate.description || '');
      setValue('documentType', existingTemplate.documentType);
      setValue('juridiction', existingTemplate.juridiction || '');
      setValue('outputFormat', existingTemplate.outputFormat);

      // Load workflow config
      if (existingTemplate.workflowConfig) {
        setWorkflowConfig(existingTemplate.workflowConfig);
      }

      // Load blocks
      if (existingTemplate.blocksStructure && allBlocks.length > 0) {
        const loadedBlocks: SelectedBlock[] = existingTemplate.blocksStructure
          .map((ref: BlockReference) => {
            const block = allBlocks.find((b) => b.id === ref.blockId);
            if (!block) return null;
            return {
              id: uuidv4(),
              blockId: ref.blockId,
              order: ref.order,
              isOptional: ref.isOptional || false,
              block,
            };
          })
          .filter((b): b is SelectedBlock => b !== null)
          .sort((a, b) => a.order - b.order);
        setSelectedBlocks(loadedBlocks);
      }
    }
  }, [existingTemplate, allBlocks, setValue]);

  // Calculate all required variables from selected blocks
  const allVariables = useMemo(() => {
    const varsMap = new Map<string, BlockVariable>();
    selectedBlocks.forEach((sb) => {
      (sb.block.variables || []).forEach((v) => {
        if (!varsMap.has(v.name)) {
          varsMap.set(v.name, v);
        }
      });
    });
    return Array.from(varsMap.values());
  }, [selectedBlocks]);

  // Handle adding block
  const handleAddBlock = (block: DocumentBlock) => {
    const newBlock: SelectedBlock = {
      id: uuidv4(),
      blockId: block.id,
      order: selectedBlocks.length,
      isOptional: false,
      block,
    };
    setSelectedBlocks([...selectedBlocks, newBlock]);
  };

  // Handle reordering blocks
  const handleReorderBlocks = (blocks: SelectedBlock[]) => {
    setSelectedBlocks(blocks);
  };

  // Handle removing block
  const handleRemoveBlock = (id: string) => {
    setSelectedBlocks((prev) =>
      prev.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i }))
    );
  };

  // Handle toggle optional
  const handleToggleOptional = (id: string) => {
    setSelectedBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isOptional: !b.isOptional } : b))
    );
  };

  // Validate template
  const validateTemplate = (): string[] => {
    const errors: string[] = [];

    if (selectedBlocks.length === 0) {
      errors.push('Le template doit contenir au moins un bloc');
    }

    // Check if SIGNATURE block is at the end
    const signatureBlock = selectedBlocks.find((b) => b.block.category === 'SIGNATURE');
    if (signatureBlock) {
      const lastBlock = selectedBlocks[selectedBlocks.length - 1];
      if (signatureBlock.id !== lastBlock.id) {
        errors.push('Le bloc Signature doit etre place en dernier');
      }
    }

    return errors;
  };

  // Handle form submission
  const onSubmit = async (data: TemplateFormData) => {
    const validationErrors = validateTemplate();
    if (validationErrors.length > 0) {
      alert(validationErrors.join('\n'));
      return;
    }

    const blocksStructure: BlockReference[] = selectedBlocks.map((b, index) => ({
      blockId: b.blockId,
      order: index,
      isOptional: b.isOptional,
    }));

    const legalMentions: LegalMentions = {
      header: legalMentionsConfig.position === 'header' || legalMentionsConfig.position === 'both'
        ? legalMentionsConfig.customTemplate || ''
        : '',
      footer: legalMentionsConfig.position === 'footer' || legalMentionsConfig.position === 'both'
        ? legalMentionsConfig.customTemplate || ''
        : '',
      confidentiality: legalMentionsConfig.legalMentions.confidentiality,
    };

    const payload = {
      name: data.name,
      description: data.description,
      documentType: data.documentType as BuilderDocumentType,
      juridiction: data.juridiction ? (data.juridiction as Juridiction) : undefined,
      blocksStructure,
      requiredVariables: allVariables,
      outputFormat: data.outputFormat as 'DOCX' | 'PDF',
      workflowConfig,
      legalMentions,
    };

    if (isEditing) {
      await updateTemplateMutation.mutateAsync({
        id: id!,
        input: payload,
      });
    } else {
      await createTemplateMutation.mutateAsync(payload);
    }

    navigate('/document-templates');
  };

  // Tabs configuration
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'composition', label: 'Composition', icon: <Layers className="h-4 w-4" /> },
    { id: 'variables', label: 'Variables', icon: <Hash className="h-4 w-4" /> },
    { id: 'legal', label: 'Mentions', icon: <Scale className="h-4 w-4" /> },
    { id: 'workflow', label: 'Workflow', icon: <Settings className="h-4 w-4" /> },
  ];

  if (isEditing && isLoadingTemplate) {
    return (
      <div className="p-6">
        <LoadingState message="Chargement du template..." />
      </div>
    );
  }

  if (isEditing && existingTemplate?.isSystemTemplate) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Template systeme non modifiable
          </h2>
          <p className="text-gray-600 mb-4">
            Les templates systeme ne peuvent pas etre modifies. Vous pouvez les dupliquer.
          </p>
          <Button onClick={() => navigate('/document-templates')}>Retour a la liste</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/document-templates"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Modifier le template' : 'Nouveau template'}
              </h1>
              <p className="text-sm text-gray-500">
                Composez votre template en assemblant des blocs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/document-templates')}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Enregistrer' : 'Creer le template'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Block Selector */}
        <div className="w-72 flex-shrink-0 overflow-hidden">
          <BlockSelector
            selectedBlockIds={selectedBlocks.map((b) => b.blockId)}
            onAddBlock={handleAddBlock}
          />
        </div>

        {/* Center Column - Composition Area */}
        <div className="flex-1 flex flex-col overflow-hidden border-x border-gray-200 bg-gray-100">
          {/* Tabs */}
          <div className="bg-white border-b border-gray-200 px-4">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'composition' && (
              <BlockDragDrop
                blocks={selectedBlocks}
                onReorder={handleReorderBlocks}
                onRemove={handleRemoveBlock}
                onToggleOptional={handleToggleOptional}
              />
            )}

            {activeTab === 'variables' && (
              <Card className="p-6">
                <VariableMapper
                  variables={allVariables}
                  mappings={variableMappings}
                  onMappingChange={setVariableMappings}
                />
              </Card>
            )}

            {activeTab === 'legal' && (
              <LegalMentionsConfig
                config={legalMentionsConfig}
                onChange={setLegalMentionsConfig}
              />
            )}

            {activeTab === 'workflow' && (
              <WorkflowConfig config={workflowConfig} onChange={setWorkflowConfig} />
            )}
          </div>
        </div>

        {/* Right Column - Properties Panel */}
        <div className="w-80 flex-shrink-0 bg-white overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Proprietes
            </h2>
          </div>

          <form className="p-4 space-y-4">
            <Input
              label="Nom du template"
              placeholder="Ex: Assignation TJ standard"
              error={errors.name?.message}
              required
              {...register('name')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                placeholder="Description du template..."
                className="w-full h-20 p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <Controller
              name="documentType"
              control={control}
              render={({ field }) => (
                <Select
                  label="Type de document"
                  options={[
                    { value: '', label: 'Selectionner un type' },
                    ...Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    })),
                  ]}
                  error={errors.documentType?.message}
                  required
                  {...field}
                />
              )}
            />

            <Controller
              name="juridiction"
              control={control}
              render={({ field }) => (
                <Select
                  label="Juridiction"
                  options={[
                    { value: '', label: 'Aucune' },
                    ...Object.entries(JURIDICTION_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    })),
                  ]}
                  {...field}
                />
              )}
            />

            <Controller
              name="outputFormat"
              control={control}
              render={({ field }) => (
                <Select
                  label="Format de sortie"
                  options={[
                    { value: 'DOCX', label: 'Word (.docx)' },
                    { value: 'PDF', label: 'PDF (.pdf)' },
                  ]}
                  {...field}
                />
              )}
            />

            {/* Stats */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Resume</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Blocs</span>
                  <span className="font-medium">{selectedBlocks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Variables</span>
                  <span className="font-medium">{allVariables.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Variables requises</span>
                  <span className="font-medium text-red-600">
                    {allVariables.filter((v) => v.required).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Workflow Summary */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Workflow</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={workflowConfig.signature?.enabled || false}
                    onChange={(e) =>
                      setWorkflowConfig({
                        ...workflowConfig,
                        signature: { ...workflowConfig.signature, enabled: e.target.checked },
                      })
                    }
                    className="rounded border-gray-300 text-primary-600"
                  />
                  <span className="text-sm text-gray-700">Signature electronique</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={workflowConfig.lrar?.enabled || false}
                    onChange={(e) =>
                      setWorkflowConfig({
                        ...workflowConfig,
                        lrar: { ...workflowConfig.lrar, enabled: e.target.checked },
                      })
                    }
                    className="rounded border-gray-300 text-primary-600"
                  />
                  <span className="text-sm text-gray-700">Envoi LRAR</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={workflowConfig.autoStore?.enabled || false}
                    onChange={(e) =>
                      setWorkflowConfig({
                        ...workflowConfig,
                        autoStore: { ...workflowConfig.autoStore, enabled: e.target.checked },
                      })
                    }
                    className="rounded border-gray-300 text-primary-600"
                  />
                  <span className="text-sm text-gray-700">Stockage automatique</span>
                </label>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilderPage;
