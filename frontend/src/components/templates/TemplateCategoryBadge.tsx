import React from 'react';
import type { TemplateCategory } from '@/lib/types';
import { cn } from '@/lib/utils/helpers';

interface TemplateCategoryBadgeProps {
  category: TemplateCategory;
  size?: 'sm' | 'md';
}

const CATEGORY_CONFIG: Record<TemplateCategory, { label: string; className: string }> = {
  CONTRAT: {
    label: 'Contrat',
    className: 'bg-blue-100 text-blue-800',
  },
  ACTE: {
    label: 'Acte',
    className: 'bg-purple-100 text-purple-800',
  },
  COURRIER: {
    label: 'Courrier',
    className: 'bg-green-100 text-green-800',
  },
  PROCEDURE: {
    label: 'Procedure',
    className: 'bg-orange-100 text-orange-800',
  },
  OTHER: {
    label: 'Autre',
    className: 'bg-gray-100 text-gray-800',
  },
};

const TemplateCategoryBadge: React.FC<TemplateCategoryBadgeProps> = ({
  category,
  size = 'md',
}) => {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.OTHER;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        config.className,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-sm'
      )}
    >
      {config.label}
    </span>
  );
};

export default TemplateCategoryBadge;
