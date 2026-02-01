import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, FileText, Hash, ToggleLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { DocumentBlock, BlockCategory, BlockVariable } from '@/lib/types/documentBuilder';
import { BLOCK_CATEGORY_LABELS } from '@/lib/types/documentBuilder';

// Category color mapping
const CATEGORY_COLORS: Record<BlockCategory, string> = {
  INTRO: 'bg-blue-100 text-blue-800',
  FAITS: 'bg-green-100 text-green-800',
  MOYENS: 'bg-purple-100 text-purple-800',
  DISPOSITIF: 'bg-orange-100 text-orange-800',
  SIGNATURE: 'bg-pink-100 text-pink-800',
  CLAUSE: 'bg-yellow-100 text-yellow-800',
  MENTION_LEGALE: 'bg-gray-100 text-gray-800',
  CUSTOM: 'bg-indigo-100 text-indigo-800',
};

export interface SelectedBlock {
  id: string;
  blockId: string;
  order: number;
  isOptional: boolean;
  block: DocumentBlock;
}

interface BlockDragDropProps {
  blocks: SelectedBlock[];
  onReorder: (blocks: SelectedBlock[]) => void;
  onRemove: (id: string) => void;
  onToggleOptional: (id: string) => void;
}

export const BlockDragDrop: React.FC<BlockDragDropProps> = ({
  blocks,
  onReorder,
  onRemove,
  onToggleOptional,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);

      const reordered = arrayMove(blocks, oldIndex, newIndex).map((block, index) => ({
        ...block,
        order: index,
      }));

      onReorder(reordered);
    }
  };

  // Calculate total variables
  const allVariables = blocks.reduce((acc, b) => {
    const vars = b.block.variables || [];
    vars.forEach((v) => {
      if (!acc.find((existing) => existing.name === v.name)) {
        acc.push(v);
      }
    });
    return acc;
  }, [] as BlockVariable[]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">
          Composition du template
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Glissez-deposez pour reorganiser les blocs
        </p>
      </div>

      {/* Blocks List */}
      <div className="flex-1 overflow-y-auto p-4">
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <FileText className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500 text-center">
              Ajoutez des blocs depuis la bibliotheque
              <br />
              <span className="text-sm">pour composer votre template</span>
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {blocks.map((block, index) => (
                  <SortableBlockItem
                    key={block.id}
                    block={block}
                    index={index}
                    onRemove={() => onRemove(block.id)}
                    onToggleOptional={() => onToggleOptional(block.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Variables Summary */}
      {blocks.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700">
              Variables requises ({allVariables.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {allVariables.map((v) => (
              <span
                key={v.name}
                className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded"
                title={v.description || v.name}
              >
                {v.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Sortable Block Item
interface SortableBlockItemProps {
  block: SelectedBlock;
  index: number;
  onRemove: () => void;
  onToggleOptional: () => void;
}

const SortableBlockItem: React.FC<SortableBlockItemProps> = ({
  block,
  index,
  onRemove,
  onToggleOptional,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 p-3 bg-white border rounded-lg shadow-sm ${
        isDragging ? 'shadow-lg' : ''
      } ${block.isOptional ? 'border-dashed border-gray-300' : 'border-gray-200'}`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5 text-gray-400" />
      </button>

      {/* Order Number */}
      <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
        <span className="text-sm font-medium text-gray-600">{index + 1}</span>
      </div>

      {/* Block Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{block.block.title}</span>
          {block.isOptional && (
            <Badge className="text-xs border border-gray-300 bg-white text-gray-700">Optionnel</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge className={`text-xs ${CATEGORY_COLORS[block.block.category]}`}>
            {BLOCK_CATEGORY_LABELS[block.block.category]}
          </Badge>
          <span className="text-xs text-gray-500">
            {block.block.variables?.length || 0} variables
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleOptional}
          title={block.isOptional ? 'Rendre obligatoire' : 'Rendre optionnel'}
          className={block.isOptional ? 'text-orange-600' : 'text-gray-400'}
        >
          <ToggleLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default BlockDragDrop;
