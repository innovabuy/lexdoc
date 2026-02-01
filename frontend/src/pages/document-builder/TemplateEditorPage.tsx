import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Search,
} from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { LoadingState } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import {
  useBuilderTemplate,
  useDocumentBlocks,
  useDocumentTypes,
  useJuridictions,
  useCreateBuilderTemplate,
  useUpdateBuilderTemplate,
} from '@/hooks/useDocumentBuilder';
import type {
  DocumentBlock,
  BuilderDocumentType,
  Juridiction,
  TemplateBlockReference,
} from '@/lib/types/documentBuilder';
import {
  DOCUMENT_TYPE_LABELS,
  JURIDICTION_LABELS,
  BLOCK_CATEGORY_LABELS,
} from '@/lib/types/documentBuilder';

interface SortableBlockProps {
  block: TemplateBlockReference;
  blockData: DocumentBlock | undefined;
  onRemove: () => void;
}

const SortableBlock: React.FC<SortableBlockProps> = ({ block, blockData, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id || block.blockId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {blockData?.title || 'Bloc inconnu'}
        </p>
        {blockData && (
          <p className="text-sm text-gray-500">
            {BLOCK_CATEGORY_LABELS[blockData.category]}
          </p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

export const TemplateEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const isEditing = templateId && templateId !== 'new';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState<BuilderDocumentType>('ASSIGNATION_FOND');
  const [juridiction, setJuridiction] = useState<Juridiction | undefined>(undefined);
  const [blocks, setBlocks] = useState<TemplateBlockReference[]>([]);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [blockSearch, setBlockSearch] = useState('');

  const { data: template, isLoading: loadingTemplate } = useBuilderTemplate(
    isEditing ? templateId : undefined
  );
  const { data: documentTypes } = useDocumentTypes();
  const { data: juridictions } = useJuridictions();
  const { data: availableBlocks } = useDocumentBlocks({ limit: 100 });
  const createMutation = useCreateBuilderTemplate();
  const updateMutation = useUpdateBuilderTemplate();

  // Initialize form when editing
  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setDocumentType(template.documentType);
      setJuridiction(template.juridiction);
      const templateBlocks = template.blocksStructure || template.blocks || [];
      setBlocks(
        templateBlocks.map((b, index) => ({
          id: `${b.blockId}-${index}`,
          blockId: b.blockId,
          order: b.order,
          isOptional: b.isOptional,
        }))
      );
    }
  }, [template]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => (item.id || item.blockId) === active.id);
        const newIndex = items.findIndex((item) => (item.id || item.blockId) === over.id);
        return arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          order: index,
        }));
      });
    }
  };

  const handleAddBlock = (block: DocumentBlock) => {
    const newRef: TemplateBlockReference = {
      id: `${block.id}-${Date.now()}`,
      blockId: block.id,
      order: blocks.length,
      isOptional: false,
    };
    setBlocks([...blocks, newRef]);
    setShowBlockPicker(false);
    setBlockSearch('');
  };

  const handleRemoveBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index).map((b, i) => ({ ...b, order: i })));
  };

  const handleSave = async () => {
    const data = {
      name,
      description: description || undefined,
      documentType,
      juridiction,
      blocks: blocks.map((b, index) => ({
        blockId: b.blockId,
        order: index,
        isOptional: b.isOptional || false,
      })),
    };

    if (isEditing) {
      await updateMutation.mutateAsync({ id: templateId!, input: data });
    } else {
      await createMutation.mutateAsync(data);
    }

    navigate('/document-builder');
  };

  const filteredBlocks = availableBlocks?.data.filter(
    (block) =>
      !blocks.some((b) => b.blockId === block.id) &&
      (block.title.toLowerCase().includes(blockSearch.toLowerCase()) ||
        block.category.toLowerCase().includes(blockSearch.toLowerCase()))
  );

  const getBlockData = (blockId: string) =>
    availableBlocks?.data.find((b) => b.id === blockId);

  if (isEditing && loadingTemplate) {
    return <LoadingState message="Chargement du modele..." />;
  }

  const canSave = name.trim() && blocks.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Modifier le modele' : 'Nouveau modele'}
          </h1>
        </div>
        <Button
          onClick={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
          disabled={!canSave}
        >
          <Save className="h-4 w-4 mr-2" />
          Enregistrer
        </Button>
      </div>

      {/* Form */}
      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nom du modele"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Assignation en paiement"
            required
          />
          <Select
            label="Type de document"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as BuilderDocumentType)}
            options={
              documentTypes?.map((dt) => ({
                value: dt.documentType,
                label: DOCUMENT_TYPE_LABELS[dt.documentType],
              })) || Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
              }))
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Juridiction"
            value={juridiction}
            onChange={(e) => setJuridiction(e.target.value as Juridiction)}
            options={
              juridictions?.map((j) => ({
                value: j.juridiction,
                label: JURIDICTION_LABELS[j.juridiction],
              })) || Object.entries(JURIDICTION_LABELS).map(([value, label]) => ({
                value,
                label,
              }))
            }
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description optionnelle..."
          />
        </div>
      </Card>

      {/* Blocks */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Blocs du modele</h2>
          <Button variant="outline" onClick={() => setShowBlockPicker(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un bloc
          </Button>
        </div>

        {blocks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Aucun bloc ajoute</p>
            <p className="text-sm mt-1">
              Ajoutez des blocs pour construire votre modele
            </p>
          </div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={blocks.map((b) => b.id || b.blockId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {blocks.map((block, index) => (
                  <SortableBlock
                    key={block.id || block.blockId}
                    block={block}
                    blockData={getBlockData(block.blockId)}
                    onRemove={() => handleRemoveBlock(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </Card>

      {/* Block Picker Modal */}
      <Modal
        isOpen={showBlockPicker}
        onClose={() => {
          setShowBlockPicker(false);
          setBlockSearch('');
        }}
        title="Ajouter un bloc"
        size="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un bloc..."
              value={blockSearch}
              onChange={(e) => setBlockSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredBlocks?.map((block) => (
              <button
                key={block.id}
                onClick={() => handleAddBlock(block)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{block.title}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {block.description || 'Pas de description'}
                    </p>
                  </div>
                  <Badge>{BLOCK_CATEGORY_LABELS[block.category]}</Badge>
                </div>
                {block.tags && block.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {block.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
            {filteredBlocks?.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Aucun bloc disponible
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TemplateEditorPage;
