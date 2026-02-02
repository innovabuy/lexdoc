import React from 'react';
import { FileText, Tag, Variable, Lock } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { DocumentBlock, BlockCategory } from '@/lib/types/documentBuilder';
import {
  BLOCK_CATEGORY_LABELS,
  VARIABLE_TYPE_LABELS,
} from '@/lib/types/documentBuilder';

interface BlockModalProps {
  block: DocumentBlock | null;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<BlockCategory, string> = {
  INTRO: 'bg-blue-100 text-blue-800',
  FAITS: 'bg-green-100 text-green-800',
  MOYENS: 'bg-purple-100 text-purple-800',
  DISPOSITIF: 'bg-orange-100 text-orange-800',
  SIGNATURE: 'bg-pink-100 text-pink-800',
  CLAUSE: 'bg-yellow-100 text-yellow-800',
  MENTION_LEGALE: 'bg-gray-100 text-gray-800',
  CUSTOM: 'bg-indigo-100 text-indigo-800',
  NOTE_LIBRE: 'bg-cyan-100 text-cyan-800',
};

export const BlockModal: React.FC<BlockModalProps> = ({ block, onClose }) => {
  if (!block) return null;

  return (
    <Modal isOpen={!!block} onClose={onClose} title={block.title} size="lg">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={CATEGORY_COLORS[block.category]}>
            {BLOCK_CATEGORY_LABELS[block.category]}
          </Badge>
          {block.isSystemBlock && (
            <Badge className="bg-gray-100 text-gray-700">
              <Lock className="h-3 w-3 mr-1" />
              Bloc systeme
            </Badge>
          )}
          {block.isMandatory && (
            <Badge className="bg-red-100 text-red-800">Obligatoire</Badge>
          )}
        </div>

        {/* Content */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contenu du bloc
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {block.content}
            </pre>
          </div>
        </div>

        {/* Variables */}
        {block.variables.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Variable className="h-4 w-4" />
              Variables ({block.variables.length})
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {block.variables.map((variable) => (
                  <div
                    key={variable.name}
                    className="flex items-center justify-between bg-white rounded px-3 py-2 border border-gray-200"
                  >
                    <div>
                      <span className="font-mono text-sm text-primary-600">
                        {`{{${variable.name}}}`}
                      </span>
                      {variable.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {variable.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {VARIABLE_TYPE_LABELS[variable.type]}
                      </span>
                      {variable.required && (
                        <span className="text-xs text-red-600">*</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {block.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {block.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t pt-4 text-sm text-gray-500 space-y-1">
          <p>
            Cree par:{' '}
            <span className="text-gray-700">
              {block.createdBy
                ? `${block.createdBy.firstName} ${block.createdBy.lastName}`
                : 'Systeme'}
            </span>
          </p>
          <p>
            Utilisations: <span className="text-gray-700">{block.usageCount}</span>
          </p>
          <p>
            Cree le:{' '}
            <span className="text-gray-700">
              {new Date(block.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </p>
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Fermer
        </Button>
      </ModalFooter>
    </Modal>
  );
};
