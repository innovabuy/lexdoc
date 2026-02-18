import { useState, useEffect } from 'react';
import api from '../../services/api';

// Configuration des categories par documentType
const CATEGORY_CONFIG = {
  CONTRAT: { icon: '📋', color: '#3B82F6', label: 'Contrats', bg: 'bg-blue-50' },
  AVENANT: { icon: '📝', color: '#8B5CF6', label: 'Avenants', bg: 'bg-purple-50' },
  COURRIER: { icon: '✉️', color: '#10B981', label: 'Courriers', bg: 'bg-green-50' },
  ASSIGNATION: { icon: '⚖️', color: '#EF4444', label: 'Assignations', bg: 'bg-red-50' },
  CONCLUSIONS: { icon: '📄', color: '#F59E0B', label: 'Conclusions', bg: 'bg-yellow-50' },
  PROTOCOLE: { icon: '🤝', color: '#06B6D4', label: 'Protocoles', bg: 'bg-cyan-50' },
  STATUTS: { icon: '🏢', color: '#EC4899', label: 'Statuts', bg: 'bg-pink-50' },
  ACTE: { icon: '📜', color: '#14B8A6', label: 'Actes', bg: 'bg-teal-50' },
  PROCEDURE: { icon: '⚡', color: '#F97316', label: 'Procedures', bg: 'bg-orange-50' },
  REQUETE: { icon: '📨', color: '#6366F1', label: 'Requetes', bg: 'bg-indigo-50' },
  AUTRE: { icon: '📁', color: '#6B7280', label: 'Autres', bg: 'bg-gray-50' },
};

export default function TemplateTreeView({ onSelect, selectedTemplateId }) {
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les templates via l'API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data } = await api.get('/builder/templates?pageSize=200');
        setTemplates(data.data || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // Grouper par documentType
  const groupByDocType = (templates) => {
    const groups = {};
    templates.forEach(t => {
      const type = t.documentType || 'AUTRE';
      if (!groups[type]) groups[type] = [];
      groups[type].push(t);
    });
    return groups;
  };

  // Filtrer par recherche
  const filteredTemplates = templates.filter(t =>
    !searchQuery ||
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = groupByDocType(filteredTemplates);

  // Trier par nombre de templates (decroissant)
  const sortedGroups = Object.entries(grouped)
    .sort((a, b) => b[1].length - a[1].length);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Stats
  const totalTemplates = templates.length;
  const systemTemplates = templates.filter(t => t.isSystem).length;
  const totalBlocs = templates.reduce((sum, t) => sum + (t.blocksStructure?.length || 0), 0);

  if (isLoading) {
    return (
      <div className="bg-white border rounded-lg shadow-sm h-full">
        <div className="p-4 border-b">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm h-full flex flex-col">
      {/* Header avec stats */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <span>📚</span> Bibliotheque Templates
          </h3>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {systemTemplates} systeme
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              {totalTemplates - systemTemplates} perso
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher un template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto p-2">
        {sortedGroups.map(([docType, categoryTemplates]) => {
          const config = CATEGORY_CONFIG[docType] || CATEGORY_CONFIG.AUTRE;
          const isExpanded = expandedCategories.has(docType);
          const catBlocs = categoryTemplates.reduce((sum, t) => sum + (t.blocksStructure?.length || 0), 0);

          return (
            <div key={docType} className="mb-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(docType)}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors ${config.bg}`}
                style={{ borderLeft: `4px solid ${config.color}` }}
              >
                <span
                  className="text-gray-400 transition-transform duration-200"
                  style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                >
                  ▶
                </span>
                <span className="text-xl">{config.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">{config.label}</div>
                  <div className="text-xs text-gray-500">
                    {categoryTemplates.length} template{categoryTemplates.length > 1 ? 's' : ''} • {catBlocs} bloc{catBlocs > 1 ? 's' : ''}
                  </div>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-sm font-bold"
                  style={{ backgroundColor: `${config.color}20`, color: config.color }}
                >
                  {categoryTemplates.length}
                </span>
              </button>

              {/* Templates List */}
              {isExpanded && (
                <div className="ml-4 mt-1 border-l-2 border-gray-200">
                  {categoryTemplates
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((template) => {
                      const isSelected = selectedTemplateId === template.id;
                      const blocCount = template.blocksStructure?.length || 0;

                      return (
                        <div
                          key={template.id}
                          onClick={() => onSelect(template)}
                          className={`ml-4 py-2 px-3 cursor-pointer rounded-lg transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'bg-blue-50 border-l-4 border-blue-600 -ml-0.5'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm truncate font-medium">{template.name}</span>
                              {template.isSystem && (
                                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded flex-shrink-0">
                                  🔒
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              🧱 {blocCount} bloc{blocCount > 1 ? 's' : ''}
                              {template.usageCount > 0 && (
                                <span className="ml-2">📄 {template.usageCount} utilisations</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect(template);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex-shrink-0"
                          >
                            Utiliser
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500">Aucun template trouve</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-600 text-sm mt-2 hover:underline"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t bg-gray-50">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xl font-bold text-blue-600">{totalTemplates}</div>
            <div className="text-xs text-gray-500">Templates</div>
          </div>
          <div>
            <div className="text-xl font-bold text-indigo-600">{sortedGroups.length}</div>
            <div className="text-xs text-gray-500">Categories</div>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-600">{totalBlocs}</div>
            <div className="text-xs text-gray-500">Blocs</div>
          </div>
        </div>
      </div>
    </div>
  );
}
