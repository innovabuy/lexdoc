import { useState, useEffect } from'react';
import api from'../services/api';
import { useToast } from'../contexts/ToastContext';
import TemplateTreeView from'../components/templates/TemplateTreeView';

export default function Templates() {
  const { success: showSuccess, error: showError } = useToast();
  const [templates, setTemplates] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [variables, setVariables] = useState({});
  const [preview, setPreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); //'grid' ou'tree'

  // Builder state
  const [builderTemplate, setBuilderTemplate] = useState({
    name:'',
    description:'',
    documentType:'CONCLUSIONS',
    juridiction:'',
    category:'Procédure civile',
    blocksStructure: [],
  });
  const [builderBlockCategory, setBuilderBlockCategory] = useState('all');
  const [builderBlockSearch, setBuilderBlockSearch] = useState('');
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
    fetchClients();
    fetchFolders();
  }, []);

  const fetchData = async () => {
    try {
      const [templatesRes, blocksRes] = await Promise.all([
        api.get('/builder/templates?pageSize=200'),
        api.get('/builder/blocks?pageSize=500'),
      ]);

      setTemplates(templatesRes.data.data || []);
      setBlocks(blocksRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients?pageSize=100');
      setClients(data.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchFolders = async () => {
    try {
      const { data } = await api.get('/folders?pageSize=200');
      setFolders(data.data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const fetchTemplateVariables = async (templateId) => {
    try {
      const { data } = await api.get(`/builder/templates/${templateId}/variables`);
      return data.data?.variables || data.data?.allVariables || [];
    } catch (error) {
      console.error('Error fetching variables:', error);
      return [];
    }
  };

  const openGenerator = async (template) => {
    setSelectedTemplate(template);
    setShowGenerator(true);
    setPreview(null);
    setVariables({});

    const templateVars = await fetchTemplateVariables(template.id);
    const initialVars = {};
    templateVars.forEach(v => {
      initialVars[v] ='';
    });
    setVariables(initialVars);
  };

  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
      setVariables(prev => ({
        ...prev,
        'client.nom': client.companyName || `${client.firstName} ${client.lastName}`,
        'client.adresse': client.address ||'',
        'client.code_postal': client.postalCode ||'',
        'client.ville': client.city ||'',
        'client.email': client.email ||'',
        'client.siret': client.siret ||'',
      }));
    }
  };

  const generatePreview = async () => {
    if (!selectedTemplate) return;

    setGenerating(true);
    try {
      const { data } = await api.post('/builder/preview', {
        templateId: selectedTemplate.id,
        variables,
      });
      if (data.success) {
        setPreview(data.data);
      } else {
        showError('Erreur:' + data.error?.message);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      showError('Erreur lors de la generation');
    } finally {
      setGenerating(false);
    }
  };

  const generateDocument = async () => {
    if (!selectedTemplate) return;

    setGenerating(true);
    try {
      const body = {
        templateId: selectedTemplate.id,
        variables,
      };
      if (selectedFolderId) body.folderId = selectedFolderId;

      const { data } = await api.post('/builder/generate', body);
      if (data.success) {
        showSuccess('Document genere avec succes!');
        setShowGenerator(false);
      } else {
        showError('Erreur:' + data.error?.message);
      }
    } catch (error) {
      console.error('Error generating document:', error);
      showError('Erreur lors de la generation');
    } finally {
      setGenerating(false);
    }
  };

  const generatePdf = async () => {
    if (!selectedTemplate) return;

    setGenerating(true);
    try {
      const body = {
        templateId: selectedTemplate.id,
        variables,
      };
      if (selectedFolderId) body.folderId = selectedFolderId;

      const { data } = await api.post('/builder/generate-pdf', body);
      if (data.success && data.data?.pdf) {
        // Convert base64 to blob and trigger download
        const byteCharacters = atob(data.data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type:'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url,'_blank');
        showSuccess('PDF genere avec succes!');
      } else {
        showError('Erreur:' + (data.error?.message ||'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      showError('Erreur lors de la generation du PDF');
    } finally {
      setGenerating(false);
    }
  };

  // ========================
  // TEMPLATE BUILDER FUNCTIONS
  // ========================

  const openBuilder = (template = null) => {
    if (template) {
      // Edit existing template
      setBuilderTemplate({
        id: template.id,
        name: template.name,
        description: template.description ||'',
        documentType: template.documentType ||'CONCLUSIONS',
        juridiction: template.juridiction ||'',
        category: template.category ||'Procédure civile',
        blocksStructure: template.blocksStructure || [],
      });
    } else {
      // New template
      setBuilderTemplate({
        name:'',
        description:'',
        documentType:'CONCLUSIONS',
        juridiction:'',
        category:'Procédure civile',
        blocksStructure: [],
      });
    }
    setShowBuilder(true);
  };

  const handleDragStart = (e, block) => {
    setDraggedBlock(block);
    e.dataTransfer.effectAllowed ='copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect ='copy';
  };

  const handleDrop = (e, index = null) => {
    e.preventDefault();
    if (!draggedBlock) return;

    const newBlock = {
      blockId: draggedBlock.id,
      blockTitle: draggedBlock.title,
      category: draggedBlock.category,
      order: index !== null ? index : builderTemplate.blocksStructure.length,
      mandatory: draggedBlock.isMandatory || false,
    };

    setBuilderTemplate(prev => {
      const newStructure = [...prev.blocksStructure];
      if (index !== null) {
        newStructure.splice(index, 0, newBlock);
      } else {
        newStructure.push(newBlock);
      }
      // Recalculate order
      return {
        ...prev,
        blocksStructure: newStructure.map((b, i) => ({ ...b, order: i + 1 })),
      };
    });

    setDraggedBlock(null);
  };

  const handleDropOnBlock = (e, targetIndex) => {
    e.preventDefault();
    handleDrop(e, targetIndex);
  };

  const removeBlockFromTemplate = (index) => {
    setBuilderTemplate(prev => ({
      ...prev,
      blocksStructure: prev.blocksStructure
        .filter((_, i) => i !== index)
        .map((b, i) => ({ ...b, order: i + 1 })),
    }));
  };

  const moveBlockUp = (index) => {
    if (index === 0) return;
    setBuilderTemplate(prev => {
      const newStructure = [...prev.blocksStructure];
      [newStructure[index - 1], newStructure[index]] = [newStructure[index], newStructure[index - 1]];
      return {
        ...prev,
        blocksStructure: newStructure.map((b, i) => ({ ...b, order: i + 1 })),
      };
    });
  };

  const moveBlockDown = (index) => {
    if (index === builderTemplate.blocksStructure.length - 1) return;
    setBuilderTemplate(prev => {
      const newStructure = [...prev.blocksStructure];
      [newStructure[index], newStructure[index + 1]] = [newStructure[index + 1], newStructure[index]];
      return {
        ...prev,
        blocksStructure: newStructure.map((b, i) => ({ ...b, order: i + 1 })),
      };
    });
  };

  const saveTemplate = async () => {
    if (!builderTemplate.name.trim()) {
      showError('Veuillez saisir un nom pour le template');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: builderTemplate.name,
        description: builderTemplate.description,
        documentType: builderTemplate.documentType,
        juridiction: builderTemplate.juridiction,
        category: builderTemplate.category,
        blocksStructure: builderTemplate.blocksStructure,
        outputFormat:'DOCX',
      };

      const { data } = builderTemplate.id
        ? await api.put(`/builder/templates/${builderTemplate.id}`, payload)
        : await api.post('/builder/templates', payload);

      if (data.success) {
        showSuccess(builderTemplate.id ?'Template mis a jour!' :'Template cree avec succes!');
        setShowBuilder(false);
        fetchData();
      } else {
        showError('Erreur:' + data.error?.message);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      showError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const duplicateTemplate = async (template) => {
    try {
      const { data } = await api.post('/builder/templates', {
        name: `${template.name} (copie)`,
        description: template.description,
        documentType: template.documentType,
        juridiction: template.juridiction,
        category: template.category,
        blocksStructure: template.blocksStructure || [],
        outputFormat: template.outputFormat ||'DOCX',
      });

      if (data.success) {
        showSuccess('Template duplique!');
        fetchData();
      } else {
        showError('Erreur:' + data.error?.message);
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      showError('Erreur lors de la duplication');
    }
  };

  const deleteTemplate = (template) => {
    if (template.isSystem) {
      showError('Les templates systeme ne peuvent pas etre supprimes');
      return;
    }
    setTemplateToDelete(template);
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    try {
      const { data } = await api.delete(`/builder/templates/${templateToDelete.id}`);
      if (data.success) {
        showSuccess('Template supprime');
        fetchData();
      } else {
        showError('Erreur:' + data.error?.message);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      showError('Erreur lors de la suppression');
    } finally {
      setTemplateToDelete(null);
    }
  };

  // Filter functions
  const categories = [...new Set(templates.map((t) => t.category).filter(Boolean))];
  const blockCategories = [...new Set(blocks.map((b) => b.category).filter(Boolean))];

  const filteredTemplates = templates.filter(t => {
    const matchesCategory = selectedCategory ==='all' || t.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredBlocks = blocks.filter(b => {
    const matchesCategory = selectedCategory ==='all' || b.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Builder filtered blocks
  const builderFilteredBlocks = blocks.filter(b => {
    const matchesCategory = builderBlockCategory ==='all' || b.category === builderBlockCategory;
    const matchesSearch = !builderBlockSearch ||
      b.title.toLowerCase().includes(builderBlockSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category) => {
    const icons = {
      'Procédure civile':'⚖️',
      'Procédure commerciale':'🏛️',
      'Droit des affaires':'💼',
      'Droit des sociétés':'🏢',
      'Droit du travail':'👷',
      'Droit de la famille':'👨‍👩‍👧',
      'Construction':'🏗️',
      'Immobilier':'🏠',
      'Propriété intellectuelle':'💡',
      'Procédures collectives':'📉',
      'M&A':'🤝',
      'Distribution':'🛒',
      'Contrats commerciaux':'📜',
      Courriers:'✉️',
      INTRO:'📝',
      FAITS:'📋',
      MOYENS:'⚖️',
      DISPOSITIF:'🎯',
      SIGNATURE:'✍️',
      CLAUSE:'📑',
    };
    return icons[category] ||'📄';
  };

  const documentTypes = [
    'ASSIGNATION','CONCLUSIONS','REQUETE','MISE_EN_DEMEURE',
    'CONTRAT','PROTOCOLE','STATUTS','PV','PACTE','LETTRE',
    'SAISINE','OPPOSITION','DECLARATION','CGV','GARANTIE'
  ];

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Builder</h1>
            <p className="text-gray-500 mt-1">
              {templates.length} templates - {blocks.length} blocs
            </p>
          </div>
          <div className="flex gap-3">
            {/* Toggle Vue */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${
 viewMode ==='grid'
 ?'bg-white text-blue-600 shadow-sm'
 :'text-gray-600 hover:text-gray-900'
 }`}
              >
                <span>📊</span> Grille
              </button>
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${
 viewMode ==='tree'
 ?'bg-white text-blue-600 shadow-sm'
 :'text-gray-600 hover:text-gray-900'
 }`}
              >
                <span>🌳</span> Arborescence
              </button>
            </div>
            <button
              onClick={() => openBuilder()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau template
            </button>
          </div>
        </div>

        {/* Vue Arborescence */}
        {viewMode ==='tree' ? (
          <div className="h-[calc(100vh-200px)]">
            <TemplateTreeView
              onSelect={(template) => {
                setSelectedTemplate(template);
                setShowGenerator(true);
              }}
              selectedTemplateId={selectedTemplate?.id}
            />
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('templates');
                setSelectedCategory('all');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
 activeTab ==='templates'
 ?'border-blue-600 text-blue-600'
 :'border-transparent text-gray-500 hover:text-gray-700'
 }`}
            >
              Templates ({templates.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('blocks');
                setSelectedCategory('all');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
 activeTab ==='blocks'
 ?'border-blue-600 text-blue-600'
 :'border-transparent text-gray-500 hover:text-gray-700'
 }`}
            >
              Blocs ({blocks.length})
            </button>
          </nav>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-sm ${
 selectedCategory ==='all'
 ?'bg-blue-600 text-white'
 :'bg-gray-100 text-gray-600 hover:bg-gray-200'
 }`}
          >
            Tous
          </button>
          {(activeTab ==='templates' ? categories : blockCategories).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
 selectedCategory === cat
 ?'bg-blue-600 text-white'
 :'bg-gray-100 text-gray-600 hover:bg-gray-200'
 }`}
            >
              {getCategoryIcon(cat)} {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab ==='templates' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500">{template.documentType}</p>
                    </div>
                  </div>
                  {template.isSystem && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      Systeme
                    </span>
                  )}
                </div>
                {template.description && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">{template.description}</p>
                )}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {template.blocksStructure?.length || 0} blocs
                    {template.usageCount > 0 && (
                      <span className="ml-2" title="Utilisations">· {template.usageCount} utilisation{template.usageCount !== 1 ?'s' :''}</span>
                    )}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openGenerator(template)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Utiliser
                    </button>
                    <div className="relative group">
                      <button className="px-2 py-1 text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      <div className="absolute right-0 mt-1 w-40 bg-white border rounded-lg shadow-lg hidden group-hover:block z-10">
                        {!template.isSystem && (
                          <button
                            onClick={() => openBuilder(template)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                          >
                            Modifier
                          </button>
                        )}
                        <button
                          onClick={() => duplicateTemplate(template)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                        >
                          Dupliquer
                        </button>
                        {!template.isSystem && (
                          <button
                            onClick={() => deleteTemplate(template)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBlocks.map((block) => (
              <div
                key={block.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getCategoryIcon(block.category)}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{block.title}</h3>
                      <span className="text-xs text-gray-500">{block.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {block.isSystem && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        Systeme
                      </span>
                    )}
                    {block.isMandatory && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        Obligatoire
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600 line-clamp-3 font-mono bg-gray-50 p-2 rounded">
                  {block.content?.substring(0, 200)}...
                </p>
                {block.tags?.length > 0 && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {block.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {(activeTab ==='templates' ? filteredTemplates : filteredBlocks).length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun element trouve dans cette categorie
          </div>
        )}
          </>
        )}
      </div>

      {/* Document Generator Modal */}
      {showGenerator && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Generer un document
                </h2>
                <p className="text-sm text-gray-500">{selectedTemplate.name}</p>
              </div>
              <button
                onClick={() => setShowGenerator(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Variables Panel */}
              <div className="w-1/2 border-r overflow-y-auto p-6 space-y-6">
                {/* Folder Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dossier de destination
                  </label>
                  <select
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Choisir un dossier --</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.title} ({folder.reference})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Client Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selectionner un client
                  </label>
                  <select
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Choisir un client --</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.companyName || `${client.firstName} ${client.lastName}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Variable Inputs */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Variables du document</h3>
                  <div className="space-y-3">
                    {Object.keys(variables).map((key) => {
                      const keyLower = key.toLowerCase();
                      const isTextarea = keyLower.includes('contenu') || keyLower.includes('description');
                      const isDate = keyLower.includes('date');
                      const isNumber = keyLower.includes('montant') || keyLower.includes('prix') || keyLower.includes('nombre');
                      const inputType = isDate ?'date' : isNumber ?'number' :'text';

                      return (
                        <div key={key}>
                          <label className="block text-xs text-gray-500 mb-1">
                            {key.replace(/\./g,' >')}
                          </label>
                          {isTextarea ? (
                            <textarea
                              value={variables[key]}
                              onChange={(e) => setVariables(prev => ({ ...prev, [key]: e.target.value }))}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              rows={3}
                            />
                          ) : (
                            <input
                              type={inputType}
                              value={variables[key]}
                              onChange={(e) => setVariables(prev => ({ ...prev, [key]: e.target.value }))}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              step={isNumber ?'0.01' : undefined}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Common Variables */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Variables communes</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Date du jour</label>
                      <input
                        type="date"
                        value={variables.date || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setVariables(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Reference</label>
                      <input
                        type="text"
                        value={variables.reference ||''}
                        onChange={(e) => setVariables(prev => ({ ...prev, reference: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="REF-2024-001"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="w-1/2 overflow-y-auto p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Apercu du document</h3>
                  <button
                    onClick={generatePreview}
                    disabled={generating}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    {generating ?'Generation...' :'Actualiser'}
                  </button>
                </div>

                {preview ? (
                  <div className="bg-white border rounded-lg p-6 shadow-inner min-h-[400px]">
                    <div
                      className="prose prose-sm max-w-none whitespace-pre-wrap font-serif"
                      dangerouslySetInnerHTML={{ __html: preview.content?.replace(/\n/g,'<br/>') }}
                    />
                  </div>
                ) : (
                  <div className="bg-white border rounded-lg p-6 shadow-inner min-h-[400px] flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>Cliquez sur"Actualiser" pour voir l'apercu</p>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Modal Footer */}
 <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
 <button
 onClick={() => setShowGenerator(false)}
 className="px-4 py-2 text-gray-600 hover:text-gray-800"
 >
 Annuler
 </button>
 <div className="flex gap-3">
 <button
 onClick={generatePreview}
 disabled={generating}
 className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
 >
 Previsualiser
 </button>
 <button
 onClick={generatePdf}
 disabled={generating}
 className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
 >
 Exporter PDF
 </button>
 <button
 onClick={generateDocument}
 disabled={generating}
 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
 >
 {generating ?'Generation...' :'Generer le document'}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Template Builder Modal */}
 {showBuilder && (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
 {/* Builder Header */}
 <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white">
 <div>
 <h2 className="text-xl font-semibold">
 {builderTemplate.id ?'Modifier le template' :'Creer un nouveau template'}
 </h2>
 <p className="text-sm text-blue-100">Glissez-deposez les blocs pour composer votre document</p>
 </div>
 <button
 onClick={() => setShowBuilder(false)}
 className="text-white hover:text-blue-200"
 >
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>

 {/* Builder Content */}
 <div className="flex-1 overflow-hidden flex">
 {/* Block Library Sidebar */}
 <div className="w-80 border-r bg-gray-50 flex flex-col">
 <div className="p-4 border-b bg-white">
 <h3 className="font-medium text-gray-900 mb-3">Bibliotheque de blocs</h3>
 <input
 type="text"
 placeholder="Rechercher un bloc..."
 value={builderBlockSearch}
 onChange={(e) => setBuilderBlockSearch(e.target.value)}
 className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 />
 <div className="mt-3 flex flex-wrap gap-1">
 <button
 onClick={() => setBuilderBlockCategory('all')}
 className={`px-2 py-1 rounded text-xs ${
 builderBlockCategory ==='all' ?'bg-blue-600 text-white' :'bg-gray-200 text-gray-600'
 }`}
 >
 Tous
 </button>
 {blockCategories.map(cat => (
 <button
 key={cat}
 onClick={() => setBuilderBlockCategory(cat)}
 className={`px-2 py-1 rounded text-xs ${
 builderBlockCategory === cat ?'bg-blue-600 text-white' :'bg-gray-200 text-gray-600'
 }`}
 >
 {cat}
 </button>
 ))}
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-4 space-y-2">
 {builderFilteredBlocks.map(block => (
 <div
 key={block.id}
 draggable
 onDragStart={(e) => handleDragStart(e, block)}
 className="bg-white p-3 rounded-lg border border-gray-200 cursor-move hover:border-blue-400 hover:shadow-sm transition-all"
 >
 <div className="flex items-center gap-2">
 <span className="text-gray-400">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
 </svg>
 </span>
 <span className="text-lg">{getCategoryIcon(block.category)}</span>
 <div className="flex-1 min-w-0">
 <p className="font-medium text-sm text-gray-900 truncate">{block.title}</p>
 <p className="text-xs text-gray-500">{block.category}</p>
 </div>
 </div>
 </div>
 ))}
 {builderFilteredBlocks.length === 0 && (
 <p className="text-center text-gray-500 text-sm py-4">Aucun bloc trouve</p>
 )}
 </div>
 </div>

 {/* Composition Area */}
 <div className="flex-1 flex flex-col">
 {/* Template Info */}
 <div className="p-4 border-b bg-white">
 <div className="grid grid-cols-3 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Nom du template *</label>
 <input
 type="text"
 value={builderTemplate.name}
 onChange={(e) => setBuilderTemplate(prev => ({ ...prev, name: e.target.value }))}
 className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
 placeholder="Ex: Assignation en reference"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Type de document</label>
 <select
 value={builderTemplate.documentType}
 onChange={(e) => setBuilderTemplate(prev => ({ ...prev, documentType: e.target.value }))}
 className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
 >
 {documentTypes.map(type => (
 <option key={type} value={type}>{type}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
 <select
 value={builderTemplate.category}
 onChange={(e) => setBuilderTemplate(prev => ({ ...prev, category: e.target.value }))}
 className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
 >
 {categories.map(cat => (
 <option key={cat} value={cat}>{cat}</option>
 ))}
 <option value="Custom">Custom</option>
 </select>
 </div>
 </div>
 <div className="mt-3">
 <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
 <input
 type="text"
 value={builderTemplate.description}
 onChange={(e) => setBuilderTemplate(prev => ({ ...prev, description: e.target.value }))}
 className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
 placeholder="Description du template..."
 />
 </div>
 </div>

 {/* Drop Zone */}
 <div
 className="flex-1 overflow-y-auto p-6 bg-gray-100"
 onDragOver={handleDragOver}
 onDrop={(e) => handleDrop(e)}
 >
 <div className="max-w-3xl mx-auto">
 <h3 className="text-sm font-medium text-gray-700 mb-4">
 Structure du document ({builderTemplate.blocksStructure.length} blocs)
 </h3>

 {builderTemplate.blocksStructure.length === 0 ? (
 <div
 className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-white"
 onDragOver={handleDragOver}
 onDrop={(e) => handleDrop(e)}
 >
 <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
 </svg>
 <p className="text-gray-500 text-lg">Glissez des blocs ici pour construire votre template</p>
 <p className="text-gray-400 text-sm mt-2">Les blocs seront assembles dans l'ordre pour generer le document final</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {builderTemplate.blocksStructure.map((item, index) => (
                          <div
                            key={`${item.blockId}-${index}`}
                            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm group hover:border-blue-400 transition-colors"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDropOnBlock(e, index)}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-gray-400 font-mono text-sm w-6">{item.order}</span>
                              <span className="text-xl">{getCategoryIcon(item.category)}</span>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{item.blockTitle}</p>
                                <p className="text-xs text-gray-500">{item.category}</p>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => moveBlockUp(index)}
                                  disabled={index === 0}
                                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                                  title="Monter"
                                >
                                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => moveBlockDown(index)}
                                  disabled={index === builderTemplate.blocksStructure.length - 1}
                                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                                  title="Descendre"
                                >
                                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => removeBlockFromTemplate(index)}
                                  className="p-1 hover:bg-red-100 rounded text-red-500"
                                  title="Supprimer"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {/* Drop zone at end */}
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-400 text-sm"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e)}
                        >
                          Deposer ici pour ajouter a la fin
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Builder Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => setShowBuilder(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <div className="flex gap-3">
                <span className="text-sm text-gray-500 self-center">
                  {builderTemplate.blocksStructure.length} bloc(s) dans le template
                </span>
                <button
                  onClick={saveTemplate}
                  disabled={saving || !builderTemplate.name.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Sauvegarder
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {templateToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Supprimer le template ?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Le template"{templateToDelete.name}" sera supprime definitivement.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTemplateToDelete(null)}
                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteTemplate}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
