import React from 'react';
import { Input, Select } from '@/components/ui';
import type { TemplateVariable, VariableType } from '@/lib/types';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface TemplateFormBuilderProps {
  variables: TemplateVariable[];
  register: UseFormRegister<Record<string, unknown>>;
  errors: FieldErrors<Record<string, unknown>>;
}

const TemplateFormBuilder: React.FC<TemplateFormBuilderProps> = ({
  variables,
  register,
  errors,
}) => {
  const getInputType = (type: VariableType): string => {
    switch (type) {
      case 'date':
        return 'date';
      case 'email':
        return 'email';
      case 'phone':
        return 'tel';
      case 'number':
      case 'currency':
        return 'number';
      default:
        return 'text';
    }
  };

  const getPlaceholder = (variable: TemplateVariable): string => {
    switch (variable.type) {
      case 'date':
        return 'JJ/MM/AAAA';
      case 'email':
        return 'exemple@email.fr';
      case 'phone':
        return '06 12 34 56 78';
      case 'currency':
        return '0.00';
      case 'number':
        return '0';
      case 'boolean':
        return '';
      default:
        return variable.label;
    }
  };

  const renderField = (variable: TemplateVariable) => {
    const { name, type, label, required } = variable;
    const error = errors[name]?.message as string | undefined;

    if (type === 'boolean') {
      return (
        <Select
          key={name}
          {...register(name, { required: required ? 'Ce champ est requis' : false })}
          label={label}
          error={error}
          options={[
            { value: '', label: 'Selectionner...' },
            { value: 'true', label: 'Oui' },
            { value: 'false', label: 'Non' },
          ]}
        />
      );
    }

    const inputProps = {
      key: name,
      ...register(name, {
        required: required ? 'Ce champ est requis' : false,
        ...(type === 'email' && {
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Email invalide',
          },
        }),
      }),
      type: getInputType(type),
      label: `${label}${required ? '' : ' (optionnel)'}`,
      placeholder: getPlaceholder(variable),
      error,
      ...(type === 'currency' && {
        step: '0.01',
        min: '0',
      }),
    };

    return <Input {...inputProps} />;
  };

  // Group variables by type for better layout
  const groupedVariables = variables.reduce(
    (acc, variable) => {
      const group = variable.type === 'boolean' ? 'boolean' : 'other';
      acc[group].push(variable);
      return acc;
    },
    { boolean: [] as TemplateVariable[], other: [] as TemplateVariable[] }
  );

  return (
    <div className="space-y-4">
      {/* Regular fields in a grid */}
      {groupedVariables.other.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupedVariables.other.map(renderField)}
        </div>
      )}

      {/* Boolean fields */}
      {groupedVariables.boolean.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupedVariables.boolean.map(renderField)}
        </div>
      )}

      {variables.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Ce modele ne contient pas de variables.
        </p>
      )}
    </div>
  );
};

export default TemplateFormBuilder;
