import React, { useState, ChangeEvent } from 'react';
import { Search, Plus, FileText, Lock, ChevronDown, ChevronRight } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useDocumentBlocks, useBlockCategories } from '@/hooks/useDocumentBuilder';
import type { DocumentBlock, BlockCategory } from '@/lib/types/documentBuilder';
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

interface BlockSelectorProps {
  selectedBlockIds: string[];
  onAddBlock: (block: DocumentBlock) => void;
}

export const BlockSelector: React.FC<BlockSelectorProps> = ({
  selectedBlockIds,
  onAddBlock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<BlockCategory>>(
    new Set(['INTRO', 'FAITS', 'MOYENS', 'DISPOSITIF', 'SIGNATURE'])
  );

  const { data: blocksData } = useDocumentBlocks({
    search: searchQuery || undefined,
    limit: 100,
    sortBy: 'displayOrder',
    sortOrder: 'asc',
  });
  const { data: categories } = useBlockCategories();

  const blocks = blocksData?.data || [];

  // Group blocks by category
  const blocksByCategory = blocks.reduce((acc, block) => {
    if (!acc[block.category]) {
      acc[block.category] = [];
    }
    acc[block.category].push(block);
    return acc;
  }, {} as Record<BlockCategory, DocumentBlock[]>);

  const toggleCategory = (category: BlockCategory) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const isBlockSelected = (blockId: string) => selectedBlockIds.includes(blockId);

  // Order categories logically
  const categoryOrder: BlockCategory[] = [
    'INTRO',
    'FAITS',
    'MOYENS',
    'DISPOSITIF',
    'CLAUSE',
    'MENTION_LEGALE',
    'SIGNATURE',
    'CUSTOM',
  ];

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Bibliotheque de blocs</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher un bloc..."
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories and Blocks */}
      <div className="flex-1 overflow-y-auto">
        {categoryOrder.map((category) => {
          const categoryBlocks = blocksByCategory[category] || [];
          const categoryCount = categories?.find((c) => c.category === category)?.count || categoryBlocks.length;
          const isExpanded = expandedCategories.has(category);

          if (categoryBlocks.length === 0 && !searchQuery) return null;

          return (
            <div key={category} className="border-b border-gray-100">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <Badge className={CATEGORY_COLORS[category]}>
                    {BLOCK_CATEGORY_LABELS[category]}
                  </Badge>
                </div>
                <span className="text-sm text-gray-500">
                  ({categoryCount})
                </span>
              </button>

              {/* Blocks List */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-2">
                  {categoryBlocks.length === 0 ? (
                    <p className="text-sm text-gray-400 py-2 pl-6">Aucun bloc</p>
                  ) : (
                    categoryBlocks.map((block) => (
                      <BlockItem
                        key={block.id}
                        block={block}
                        isSelected={isBlockSelected(block.id)}
                        onAdd={() => onAddBlock(block)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Block Item Component
interface BlockItemProps {
  block: DocumentBlock;
  isSelected: boolean;
  onAdd: () => void;
}

const BlockItem: React.FC<BlockItemProps> = ({ block, isSelected, onAdd }) => {
  return (
    <div
      className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
        isSelected
          ? 'bg-primary-50 border-primary-200'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <span className="text-sm text-gray-900 truncate">{block.title}</span>
        {block.isSystemBlock && (
          <Lock className="h-3 w-3 text-gray-400 flex-shrink-0" />
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onAdd}
        disabled={isSelected}
        className={isSelected ? 'opacity-50' : ''}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default BlockSelector;
