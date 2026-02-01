import React, { useState, ChangeEvent } from 'react';
import { Hash, ChevronDown, ChevronRight, Info, Pencil, Check, X } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { BlockVariable, VariableType } from '@/lib/types/documentBuilder';
import { VARIABLE_TYPE_LABELS } from '@/lib/types/documentBuilder';

// Variable type colors
const VARIABLE_TYPE_COLORS: Record<VariableType, string> = {
  string: 'bg-blue-100 text-blue-700',
  number: 'bg-green-100 text-green-700',
  date: 'bg-purple-100 text-purple-700',
  boolean: 'bg-orange-100 text-orange-700',
  text: 'bg-cyan-100 text-cyan-700',
  array: 'bg-pink-100 text-pink-700',
};

// Variable mapping interface
export interface VariableMapping {
  originalName: string;
  mappedName?: string;
  expression?: string;
  description?: string;
}

interface VariableMapperProps {
  variables: BlockVariable[];
  mappings: VariableMapping[];
  onMappingChange: (mappings: VariableMapping[]) => void;
  readOnly?: boolean;
}

export const VariableMapper: React.FC<VariableMapperProps> = ({
  variables,
  mappings,
  onMappingChange,
  readOnly = false,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['required', 'optional']));
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Group variables by required/optional
  const requiredVariables = variables.filter((v) => v.required);
  const optionalVariables = variables.filter((v) => !v.required);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  const getMapping = (varName: string): VariableMapping | undefined => {
    return mappings.find((m) => m.originalName === varName);
  };

  const startEditing = (varName: string) => {
    const mapping = getMapping(varName);
    setEditingVariable(varName);
    setEditValue(mapping?.mappedName || mapping?.expression || '');
  };

  const saveMapping = (varName: string) => {
    const existingMappings = mappings.filter((m) => m.originalName !== varName);
    const newMapping: VariableMapping = {
      originalName: varName,
      mappedName: editValue || undefined,
    };
    onMappingChange([...existingMappings, newMapping]);
    setEditingVariable(null);
    setEditValue('');
  };

  const cancelEditing = () => {
    setEditingVariable(null);
    setEditValue('');
  };

  const removeMapping = (varName: string) => {
    onMappingChange(mappings.filter((m) => m.originalName !== varName));
  };

  const renderVariableGroup = (
    title: string,
    groupKey: string,
    vars: BlockVariable[],
    isRequired: boolean
  ) => {
    const isExpanded = expandedGroups.has(groupKey);

    if (vars.length === 0) return null;

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Group Header */}
        <button
          onClick={() => toggleGroup(groupKey)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
            <Hash className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700">{title}</span>
            <Badge variant={isRequired ? 'error' : 'default'} className="text-xs">
              {vars.length}
            </Badge>
          </div>
        </button>

        {/* Variables List */}
        {isExpanded && (
          <div className="divide-y divide-gray-100">
            {vars.map((variable) => (
              <VariableRow
                key={variable.name}
                variable={variable}
                mapping={getMapping(variable.name)}
                isEditing={editingVariable === variable.name}
                editValue={editValue}
                onEditValueChange={setEditValue}
                onStartEdit={() => startEditing(variable.name)}
                onSave={() => saveMapping(variable.name)}
                onCancel={cancelEditing}
                onRemoveMapping={() => removeMapping(variable.name)}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Mapping des variables</p>
          <p className="mt-1">
            Vous pouvez renommer ou combiner des variables pour les adapter a votre contexte.
            Ex: <code className="bg-blue-100 px-1 rounded">client.nom_complet</code> peut etre
            mappe vers <code className="bg-blue-100 px-1 rounded">client.prenom + " " + client.nom</code>
          </p>
        </div>
      </div>

      {/* Required Variables */}
      {renderVariableGroup('Variables requises', 'required', requiredVariables, true)}

      {/* Optional Variables */}
      {renderVariableGroup('Variables optionnelles', 'optional', optionalVariables, false)}

      {/* Empty State */}
      {variables.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Hash className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Aucune variable detectee</p>
          <p className="text-sm mt-1">Ajoutez des blocs pour voir leurs variables</p>
        </div>
      )}
    </div>
  );
};

// Variable Row Component
interface VariableRowProps {
  variable: BlockVariable;
  mapping?: VariableMapping;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onRemoveMapping: () => void;
  readOnly: boolean;
}

const VariableRow: React.FC<VariableRowProps> = ({
  variable,
  mapping,
  isEditing,
  editValue,
  onEditValueChange,
  onStartEdit,
  onSave,
  onCancel,
  onRemoveMapping,
  readOnly,
}) => {
  return (
    <div className="p-3 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
            {variable.name}
          </code>
          <Badge className={`text-xs ${VARIABLE_TYPE_COLORS[variable.type]}`}>
            {VARIABLE_TYPE_LABELS[variable.type]}
          </Badge>
          {variable.required && (
            <span className="text-red-500 text-xs">*</span>
          )}
        </div>

        {!readOnly && !isEditing && (
          <Button variant="ghost" size="sm" onClick={onStartEdit}>
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Description */}
      {variable.description && (
        <p className="text-xs text-gray-500 mt-1 pl-2">{variable.description}</p>
      )}

      {/* Mapping Display */}
      {mapping?.mappedName && !isEditing && (
        <div className="flex items-center gap-2 mt-2 pl-2">
          <span className="text-xs text-gray-500">Mappe vers:</span>
          <code className="text-xs font-mono bg-green-50 text-green-700 px-2 py-0.5 rounded">
            {mapping.mappedName}
          </code>
          {!readOnly && (
            <button
              onClick={onRemoveMapping}
              className="text-gray-400 hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Editing Mode */}
      {isEditing && (
        <div className="flex items-center gap-2 mt-2">
          <Input
            value={editValue}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onEditValueChange(e.target.value)}
            placeholder="Nom ou expression de mapping"
            className="flex-1 text-sm"
          />
          <Button variant="ghost" size="sm" onClick={onSave}>
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default VariableMapper;
