import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TemplateTreeView from '../../components/templates/TemplateTreeView';

export default function TemplatesTreePage() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const navigate = useNavigate();

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      navigate(`/builder?template=${selectedTemplate.id}`);
    }
  };

  const handleEditTemplate = () => {
    if (selectedTemplate) {
      navigate(`/builder/${selectedTemplate.id}`);
    }
  };

  const getBlockTypeLabel = (type) => {
    const labels = {
      'header': 'En-tete',
      'parties': 'Parties',
      'clause': 'Clause',
      'article': 'Article',
      'signature': 'Signature',
      'footer': 'Pied de page',
      'text': 'Texte libre',
      'table': 'Tableau',
      'list': 'Liste',
    };
    return labels[type] || type;
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar arborescence */}
      <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto flex-shrink-0">
        <TemplateTreeView
          onSelect={setSelectedTemplate}
          selectedTemplateId={selectedTemplate?.id}
        />
      </div>

      {/* Previsualisation */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedTemplate ? (
          <div className="max-w-4xl">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedTemplate.name}
                </h1>
                <div className="flex items-center gap-3">
                  {selectedTemplate.isSystem && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      Template systeme
                    </span>
                  )}
                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                    {selectedTemplate.documentType || 'Document'}
                  </span>
                  {selectedTemplate.juridiction && (
                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                      {selectedTemplate.juridiction}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {!selectedTemplate.isSystem && (
                  <button
                    onClick={handleEditTemplate}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Modifier
                  </button>
                )}
                <button
                  onClick={handleUseTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Utiliser ce template
                </button>
              </div>
            </div>

            {/* Description */}
            {selectedTemplate.description && (
              <div className="bg-gray-50 p-4 rounded-lg border mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 text-sm">{selectedTemplate.description}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-3">Informations</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Categorie</dt>
                    <dd className="font-medium">{selectedTemplate.category || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Type de document</dt>
                    <dd className="font-medium">{selectedTemplate.documentType || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Juridiction</dt>
                    <dd className="font-medium">{selectedTemplate.juridiction || 'Toutes'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Cree le</dt>
                    <dd className="font-medium">
                      {new Date(selectedTemplate.createdAt).toLocaleDateString('fr-FR')}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-3">Statistiques</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Nombre de blocs</dt>
                    <dd className="font-medium">
                      {selectedTemplate.blocksStructure?.length || 0}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Variables</dt>
                    <dd className="font-medium">
                      {selectedTemplate.variables?.length || 0}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Utilise</dt>
                    <dd className="font-medium">{selectedTemplate._count?.documents || 0} fois</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Blocs structure */}
            <div className="bg-white p-4 rounded-lg border mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Structure du document</h3>

              {selectedTemplate.blocksStructure?.length > 0 ? (
                <div className="space-y-2">
                  {selectedTemplate.blocksStructure.map((block, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {block.title || `Bloc ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getBlockTypeLabel(block.type || 'text')} - ID: {block.blockId?.substring(0, 8)}...
                        </p>
                      </div>
                      {block.required && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                          Requis
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  Aucun bloc defini
                </p>
              )}
            </div>

            {/* Variables */}
            {selectedTemplate.variables?.length > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-4">Variables a remplir</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedTemplate.variables.map((variable, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-yellow-50 rounded border border-yellow-200"
                    >
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="text-sm font-mono">{`{{${variable.name || variable}}}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">Selectionnez un template</p>
            <p className="text-sm mt-1">Choisissez un template dans l'arborescence pour voir ses details</p>
          </div>
        )}
      </div>
    </div>
  );
}
