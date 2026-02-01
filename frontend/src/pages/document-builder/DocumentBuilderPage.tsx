import React, { useState } from 'react';
import { Layers, FileText, FolderOpen } from 'lucide-react';
import { BlockList } from '@/components/document-builder/BlockList';
import { TemplateList } from '@/components/document-builder/TemplateList';
import { GeneratedDocumentList } from '@/components/document-builder/GeneratedDocumentList';

type Tab = 'templates' | 'blocks' | 'documents';

export const DocumentBuilderPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('templates');

  const tabs = [
    { id: 'templates' as Tab, label: 'Modeles', icon: Layers },
    { id: 'blocks' as Tab, label: 'Blocs', icon: FileText },
    { id: 'documents' as Tab, label: 'Documents generes', icon: FolderOpen },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Document Builder</h1>
        <p className="text-gray-500 mt-1">
          Creez et gerez vos modeles de documents juridiques
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'templates' && <TemplateList />}
        {activeTab === 'blocks' && <BlockList />}
        {activeTab === 'documents' && <GeneratedDocumentList />}
      </div>
    </div>
  );
};

export default DocumentBuilderPage;
