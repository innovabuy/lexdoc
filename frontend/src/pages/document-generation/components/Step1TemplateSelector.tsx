import React, { useState } from 'react';
import { Search, FileText, ChevronRight, FolderOpen, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/Spinner';
import { useBuilderTemplates, useDocumentTypes, useJuridictions } from '@/hooks/useDocumentBuilder';
import { useFolderTree } from '@/hooks/useFolders';
import type { BuilderTemplate, BuilderDocumentType, Juridiction } from '@/lib/types/documentBuilder';
import type { FolderTreeNode } from '@/lib/types';
import { DOCUMENT_TYPE_LABELS, JURIDICTION_LABELS } from '@/lib/types/documentBuilder';

interface Step1TemplateSelectorProps {
  selectedTemplateId?: string;
  selectedFolderId?: string;
  onSelectTemplate: (template: BuilderTemplate) => void;
  onSelectFolder: (folderId: string) => void;
  onNext: () => void;
}

export const Step1TemplateSelector: React.FC<Step1TemplateSelectorProps> = ({
  selectedTemplateId,
  selectedFolderId,
  onSelectTemplate,
  onSelectFolder,
  onNext,
}) => {
  const [search, setSearch] = useState('');
  const [documentType, setDocumentType] = useState<BuilderDocumentType | ''>('');
  const [juridiction, setJuridiction] = useState<Juridiction | ''>('');
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  // Fetch templates
  const { data: templatesData, isLoading: templatesLoading } = useBuilderTemplates({
    search: search || undefined,
    documentType: documentType || undefined,
    juridiction: juridiction || undefined,
    limit: 50,
  });

  // Fetch filter options
  const { data: documentTypesData } = useDocumentTypes();
  const { data: juridictionsData } = useJuridictions();

  // Fetch folder tree
  const { data: folderTree, isLoading: foldersLoading } = useFolderTree(5);

  const templates = templatesData?.data || [];
  const documentTypes = documentTypesData || [];
  const juridictions = juridictionsData || [];

  const documentTypeOptions = [
    { value: '', label: 'Tous les types' },
    ...documentTypes.map((dt) => ({
      value: dt.documentType,
      label: `${DOCUMENT_TYPE_LABELS[dt.documentType]} (${dt.count})`,
    })),
  ];

  const juridictionOptions = [
    { value: '', label: 'Toutes les juridictions' },
    ...juridictions.map((j) => ({
      value: j.juridiction,
      label: `${JURIDICTION_LABELS[j.juridiction]} (${j.count})`,
    })),
  ];

  const canProceed = selectedTemplateId && selectedFolderId;

  const renderFolderTree = (nodes: FolderTreeNode[], depth = 0): React.ReactNode => {
    return nodes.map((node) => (
      <div key={node.id}>
        <button
          type="button"
          onClick={() => onSelectFolder(node.id)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-lg transition-colors ${
            selectedFolderId === node.id ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <FolderOpen className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 truncate">{node.name}</span>
          {selectedFolderId === node.id && (
            <Check className="h-4 w-4 text-primary-600" />
          )}
        </button>
        {node.children && node.children.length > 0 && (
          <div>{renderFolderTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Folder Selection */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">Dossier de destination</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFolderPicker(!showFolderPicker)}
          >
            <FolderOpen className="h-4 w-4 mr-1" />
            {showFolderPicker ? 'Masquer' : 'Choisir'}
          </Button>
        </div>

        {selectedFolderId ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Check className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-800">Dossier selectionne</span>
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Veuillez selectionner un dossier de destination pour le document genere.
            </p>
          </div>
        )}

        {showFolderPicker && (
          <div className="mt-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            {foldersLoading ? (
              <div className="p-4">
                <LoadingState message="Chargement des dossiers..." />
              </div>
            ) : folderTree && folderTree.length > 0 ? (
              <div className="p-2">{renderFolderTree(folderTree)}</div>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                Aucun dossier disponible
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Template Selection */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Choisir un modele</h3>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un modele..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as BuilderDocumentType | '')}
            options={documentTypeOptions}
          />
          <Select
            value={juridiction}
            onChange={(e) => setJuridiction(e.target.value as Juridiction | '')}
            options={juridictionOptions}
          />
        </div>

        {/* Templates Grid */}
        {templatesLoading ? (
          <LoadingState message="Chargement des modeles..." />
        ) : templates.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun modele trouve</p>
            <p className="text-sm text-gray-400 mt-1">
              Essayez de modifier vos filtres de recherche
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelectTemplate(template)}
                className={`p-4 text-left border rounded-lg transition-all hover:shadow-md ${
                  selectedTemplateId === template.id
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <FileText className={`h-5 w-5 ${
                    selectedTemplateId === template.id ? 'text-primary-600' : 'text-gray-400'
                  }`} />
                  {selectedTemplateId === template.id && (
                    <Check className="h-5 w-5 text-primary-600" />
                  )}
                </div>
                <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">
                  {template.name}
                </h4>
                {template.description && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                    {template.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  <Badge variant="gray" className="text-xs">
                    {DOCUMENT_TYPE_LABELS[template.documentType]}
                  </Badge>
                  {template.juridiction && (
                    <Badge className="text-xs bg-blue-100 text-blue-700">
                      {JURIDICTION_LABELS[template.juridiction]}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canProceed}>
          Continuer
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default Step1TemplateSelector;
