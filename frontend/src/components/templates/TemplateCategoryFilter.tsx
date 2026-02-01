import React from 'react';
import { Select } from '@/components/ui';
import { useTemplateCategories } from '@/hooks/useTemplates';
import type { TemplateCategory } from '@/lib/types';

interface TemplateCategoryFilterProps {
  value: TemplateCategory | '';
  onChange: (value: TemplateCategory | '') => void;
}

const TemplateCategoryFilter: React.FC<TemplateCategoryFilterProps> = ({ value, onChange }) => {
  const { data: categories, isLoading } = useTemplateCategories();

  const options = [
    { value: '', label: 'Toutes les categories' },
    ...(categories?.map((cat) => ({ value: cat.value, label: cat.label })) || []),
  ];

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as TemplateCategory | '')}
      options={options}
      disabled={isLoading}
      className="w-48"
    />
  );
};

export default TemplateCategoryFilter;
