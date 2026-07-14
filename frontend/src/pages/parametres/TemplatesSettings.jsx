import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import {
  getTemplatesTree,
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  uploadTemplateSource,
} from '../../services/templateApi';
import TemplateEditor from '../../components/templates/TemplateEditor';
import './TemplatesSettings.css';

const categoryIcons = {
  'file-text': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  mail: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  building: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="2"/><line x1="15" y1="22" x2="15" y2="2"/></svg>,
  sparkles: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M19 14l.9 2.7L22.6 18l-2.7.9L19 21.6l-.9-2.7L15.4 18l2.7-.9L19 14z"/></svg>,
  folder: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  file: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
};

export default function TemplatesSettings() {
  const { success, error: showError } = useToast();
  const [tree, setTree] = useState({ categories: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedCats, setExpandedCats] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchTree = useCallback(async () => {
    try {
      const data = await getTemplatesTree();
      setTree(data || { categories: [] });
      // Expand all categories by default
      const exp = {};
      (data?.categories || []).forEach(c => { exp[c.key] = true; });
      setExpandedCats(exp);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  const handleDelete = async (id) => {
    try {
      await deleteTemplate(id);
      success('Template supprime');
      setConfirmDelete(null);
      fetchTree();
    } catch (e) {
      showError(e.response?.data?.error?.message || 'Erreur');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await duplicateTemplate(id);
      success('Template duplique');
      fetchTree();
    } catch (e) {
      showError(e.response?.data?.error?.message || 'Erreur');
    }
  };

  const toggleCat = (key) => {
    setExpandedCats(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter templates
  const filteredTree = search
    ? {
        categories: tree.categories
          .map(c => ({
            ...c,
            templates: c.templates.filter(t =>
              t.name.toLowerCase().includes(search.toLowerCase()) ||
              (t.description || '').toLowerCase().includes(search.toLowerCase())
            ),
          }))
          .filter(c => c.templates.length > 0),
      }
    : tree;

  // If editing a template, show the editor full-screen
  if (editingTemplate) {
    return (
      <TemplateEditor
        templateId={editingTemplate}
        onClose={() => { setEditingTemplate(null); fetchTree(); }}
        onSaved={() => { success('Template sauvegarde'); }}
      />
    );
  }

  return (
    <div className="ts-container">
      {/* Header */}
      <div className="ts-header">
        <div>
          <h1 className="ts-title">Bibliotheque de templates</h1>
          <p className="ts-subtitle">{tree.categories.reduce((s, c) => s + c.templates.length, 0)} templates disponibles</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="ts-btn ts-btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouveau template
        </button>
      </div>

      {/* Search */}
      <div className="ts-search-bar">
        <div className="ts-search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className="ts-search-icon">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un template..."
            className="ts-search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="ts-loading"><div className="ts-spinner" /></div>
      ) : filteredTree.categories.length === 0 ? (
        <div className="ts-empty">
          <p>Aucun template trouve</p>
        </div>
      ) : (
        <div className="ts-tree">
          {filteredTree.categories.map(cat => (
            <div key={cat.key} className={`ts-category ${cat.key === 'personnalises' ? 'ts-cat-perso' : ''}`}>
              {/* Category Header */}
              <button className="ts-cat-header" onClick={() => toggleCat(cat.key)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ transform: expandedCats[cat.key] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                <span className="ts-cat-icon">{categoryIcons[cat.icon] || categoryIcons.folder}</span>
                <span className="ts-cat-name">{cat.name}</span>
                <span className="ts-cat-count">{cat.templates.length}</span>
              </button>

              {/* Templates */}
              {expandedCats[cat.key] && (
                <div className="ts-tpl-list">
                  {cat.templates.map(tpl => (
                    <div key={tpl.id} className="ts-tpl-row">
                      <div className="ts-tpl-icon">
                        {categoryIcons['file-text']}
                      </div>
                      <div className="ts-tpl-info">
                        <span className="ts-tpl-name">{tpl.name}</span>
                        {tpl.description && <span className="ts-tpl-desc">{tpl.description}</span>}
                      </div>
                      <div className="ts-tpl-meta">
                        {tpl.isSystem && <span className="ts-badge ts-badge-blue">Systeme</span>}
                        {tpl.isPersonalise && <span className="ts-badge ts-badge-purple">Perso</span>}
                        {tpl.usageCount > 0 && (
                          <span className="ts-usage">{tpl.usageCount} utilisation{tpl.usageCount > 1 ? 's' : ''}</span>
                        )}
                      </div>
                      <div className="ts-tpl-actions">
                        <button
                          onClick={() => setEditingTemplate(tpl.id)}
                          className="ts-icon-btn"
                          title="Modifier"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          onClick={() => handleDuplicate(tpl.id)}
                          className="ts-icon-btn"
                          title="Dupliquer"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        </button>
                        {!tpl.isSystem && (
                          <button
                            onClick={() => setConfirmDelete(tpl)}
                            className="ts-icon-btn ts-icon-btn-danger"
                            title="Supprimer"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add button in Personnalises section */}
                  {cat.key === 'personnalises' && (
                    <button onClick={() => setShowCreate(true)} className="ts-tpl-add">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Creer un nouveau template
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateTemplateModal
          onClose={() => setShowCreate(false)}
          onCreate={async (data) => {
            try {
              const tpl = await createTemplate(data);
              success('Template cree');
              setShowCreate(false);
              fetchTree();
              if (data.openEditor) {
                setEditingTemplate(tpl.id);
              }
            } catch (e) {
              showError(e.response?.data?.error?.message || 'Erreur');
            }
          }}
          onUpload={async (id, file) => {
            try {
              await uploadTemplateSource(id, file);
              success('Fichier source televerse');
            } catch (e) {
              showError(e.response?.data?.error?.message || 'Erreur');
            }
          }}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="ts-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="ts-modal ts-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="ts-modal-header">
              <h2>Supprimer le template</h2>
              <button onClick={() => setConfirmDelete(null)} className="ts-modal-close">&times;</button>
            </div>
            <div className="ts-modal-body">
              <p>Etes-vous sur de vouloir supprimer <strong>{confirmDelete.name}</strong> ?</p>
              <p className="ts-text-muted">Cette action est irreversible.</p>
            </div>
            <div className="ts-modal-footer">
              <button onClick={() => setConfirmDelete(null)} className="ts-btn ts-btn-secondary">Annuler</button>
              <button onClick={() => handleDelete(confirmDelete.id)} className="ts-btn ts-btn-danger">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Create Template Modal ── */
function CreateTemplateModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('divers');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('blocks'); // 'blocks' or 'upload'
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      category,
      description: description.trim(),
      openEditor: mode === 'blocks',
    });
  };

  return (
    <div className="ts-modal-overlay" onClick={onClose}>
      <div className="ts-modal" onClick={e => e.stopPropagation()}>
        <div className="ts-modal-header">
          <h2>Nouveau template</h2>
          <button onClick={onClose} className="ts-modal-close">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="ts-modal-body">
            <div className="ts-field">
              <label>Nom du template *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Convention d'honoraires personnalisee"
                className="ts-input"
                autoFocus
                required
              />
            </div>
            <div className="ts-field">
              <label>Categorie</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="ts-input">
                <option value="contrats">Contrats</option>
                <option value="courriers">Courriers</option>
                <option value="actes_procedure">Actes de procédure</option>
                <option value="conclusions">Conclusions</option>
                <option value="droit_societes">Droit des societes</option>
                <option value="divers">Divers</option>
              </select>
            </div>
            <div className="ts-field">
              <label>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description optionnelle..."
                className="ts-input"
                rows={2}
              />
            </div>

            <div className="ts-field">
              <label>Mode de creation</label>
              <div className="ts-mode-options">
                <label className={`ts-mode-option ${mode === 'blocks' ? 'active' : ''}`}>
                  <input type="radio" name="mode" value="blocks" checked={mode === 'blocks'} onChange={() => setMode('blocks')} />
                  <div className="ts-mode-content">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                    <span className="ts-mode-title">Composer avec les blocs</span>
                    <span className="ts-mode-desc">Glissez-deposez des blocs pour creer votre document</span>
                  </div>
                </label>
                <label className={`ts-mode-option ${mode === 'upload' ? 'active' : ''}`}>
                  <input type="radio" name="mode" value="upload" checked={mode === 'upload'} onChange={() => setMode('upload')} />
                  <div className="ts-mode-content">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span className="ts-mode-title">Importer un .docx</span>
                    <span className="ts-mode-desc">Utiliser un fichier Word existant comme source</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
          <div className="ts-modal-footer">
            <button type="button" onClick={onClose} className="ts-btn ts-btn-secondary">Annuler</button>
            <button type="submit" className="ts-btn ts-btn-primary" disabled={!name.trim()}>
              {mode === 'blocks' ? 'Creer et ouvrir l\'editeur' : 'Creer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
