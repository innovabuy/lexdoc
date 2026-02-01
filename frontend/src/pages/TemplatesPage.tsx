import React from 'react';
import { TemplateLibrary } from '@/components/templates';

const TemplatesPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Modeles</h1>
        <p className="text-gray-500 mt-1">
          Gerez vos modeles de documents et generez des documents personnalises
        </p>
      </div>

      {/* Template library */}
      <TemplateLibrary />
    </div>
  );
};

export default TemplatesPage;
