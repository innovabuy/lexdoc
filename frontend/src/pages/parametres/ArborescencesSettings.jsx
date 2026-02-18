import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
import {
  Plus, Pencil, Trash2, Star, GripVertical, X, FolderTree, Check,
} from 'lucide-react';
import './ArborescencesSettings.css';

export default function ArborescencesSettings() {
  const { success, error: showError } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', folderType: 'juridique', isDefault: false });
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Inline add category
  const [addingCatFor, setAddingCatFor] = useState(null);
  const [newCatName, setNewCatName] = useState('');

  const fetchTemplates = useCallback(async () => {
    try {
      const { data } = await api.get('/tree-templates');
      setTemplates(data.data || []);
    } catch (e) {
      showError('Erreur lors du chargement des arborescences');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // Create / Edit
  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', folderType: 'juridique', isDefault: false });
    setModalOpen(true);
  };

  const openEdit = (tpl) => {
    setEditing(tpl);
    setForm({ name: tpl.name, folderType: tpl.folderType, isDefault: tpl.isDefault });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return showError('Le nom est requis');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/tree-templates/${editing.id}`, form);
        success('Arborescence modifiée');
      } else {
        await api.post('/tree-templates', { ...form, categories: [] });
        success('Arborescence créée');
      }
      setModalOpen(false);
      fetchTemplates();
    } catch (e) {
      showError(e.response?.data?.error?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/tree-templates/${deleteTarget.id}`);
      success('Arborescence supprimée');
      setDeleteTarget(null);
      fetchTemplates();
    } catch (e) {
      showError('Erreur lors de la suppression');
    }
  };

  // Set default
  const handleSetDefault = async (tpl) => {
    try {
      await api.post(`/tree-templates/${tpl.id}/set-default`);
      success(`"${tpl.name}" définie par défaut`);
      fetchTemplates();
    } catch (e) {
      showError('Erreur');
    }
  };

  // Add category
  const handleAddCategory = async (tpl) => {
    if (!newCatName.trim()) return;
    const cats = [...(tpl.categories || [])];
    cats.push({ name: newCatName.trim(), ordre: cats.length });
    try {
      await api.put(`/tree-templates/${tpl.id}/categories`, { categories: cats });
      setAddingCatFor(null);
      setNewCatName('');
      fetchTemplates();
    } catch (e) {
      showError('Erreur');
    }
  };

  // Remove category
  const handleRemoveCategory = async (tpl, idx) => {
    const cats = [...(tpl.categories || [])];
    cats.splice(idx, 1);
    // Reindex ordre
    cats.forEach((c, i) => { c.ordre = i; });
    try {
      await api.put(`/tree-templates/${tpl.id}/categories`, { categories: cats });
      fetchTemplates();
    } catch (e) {
      showError('Erreur');
    }
  };

  // Move category up/down
  const handleMoveCategory = async (tpl, idx, direction) => {
    const cats = [...(tpl.categories || [])];
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= cats.length) return;
    [cats[idx], cats[newIdx]] = [cats[newIdx], cats[idx]];
    cats.forEach((c, i) => { c.ordre = i; });
    try {
      await api.put(`/tree-templates/${tpl.id}/categories`, { categories: cats });
      fetchTemplates();
    } catch (e) {
      showError('Erreur');
    }
  };

  if (loading) {
    return <div className="arb-loading"><div className="arb-spinner" /></div>;
  }

  return (
    <div className="arb-container">
      {/* Header */}
      <div className="arb-header">
        <div>
          <h1 className="arb-title">Arborescences</h1>
          <p className="arb-subtitle">
            Gérez les modèles d'arborescence de dossiers par type (juridique, judiciaire).
          </p>
        </div>
        <button className="arb-btn arb-btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nouvelle arborescence
        </button>
      </div>

      {/* Template cards */}
      {templates.length === 0 ? (
        <div className="arb-empty">
          <FolderTree size={40} style={{ margin: '0 auto 0.5rem', display: 'block', opacity: 0.3 }} />
          <p>Aucune arborescence configurée</p>
          <button className="arb-btn arb-btn-primary" onClick={openCreate}>
            <Plus size={16} /> Créer une arborescence
          </button>
        </div>
      ) : (
        <div className="arb-grid">
          {templates.map((tpl) => (
            <div key={tpl.id} className="arb-card">
              <div className="arb-card-header">
                <div className="arb-card-title-row">
                  <span className="arb-card-name">{tpl.name}</span>
                  <span className={`arb-card-type arb-type-${tpl.folderType}`}>
                    {tpl.folderType}
                  </span>
                  {tpl.isDefault && (
                    <span className="arb-badge-default">
                      <Star size={12} /> Par défaut
                    </span>
                  )}
                </div>
                <div className="arb-card-actions">
                  {!tpl.isDefault && (
                    <button
                      className="arb-icon-btn"
                      title="Définir par défaut"
                      onClick={() => handleSetDefault(tpl)}
                    >
                      <Star size={16} />
                    </button>
                  )}
                  <button className="arb-icon-btn" title="Modifier" onClick={() => openEdit(tpl)}>
                    <Pencil size={16} />
                  </button>
                  <button
                    className="arb-icon-btn arb-icon-btn-danger"
                    title="Supprimer"
                    onClick={() => setDeleteTarget(tpl)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Categories */}
              <div className="arb-cat-list">
                {(!tpl.categories || tpl.categories.length === 0) ? (
                  <div className="arb-cat-empty">Aucune catégorie</div>
                ) : (
                  tpl.categories
                    .sort((a, b) => a.ordre - b.ordre)
                    .map((cat, idx) => (
                      <div key={idx} className="arb-cat-item">
                        <span className="arb-cat-order">{idx + 1}</span>
                        <span className="arb-cat-name">{cat.name}</span>
                        <div className="arb-cat-actions">
                          <button
                            className="arb-btn-ghost arb-icon-btn"
                            onClick={() => handleMoveCategory(tpl, idx, -1)}
                            disabled={idx === 0}
                            title="Monter"
                          >
                            ↑
                          </button>
                          <button
                            className="arb-btn-ghost arb-icon-btn"
                            onClick={() => handleMoveCategory(tpl, idx, 1)}
                            disabled={idx === tpl.categories.length - 1}
                            title="Descendre"
                          >
                            ↓
                          </button>
                          <button
                            className="arb-icon-btn arb-icon-btn-danger"
                            onClick={() => handleRemoveCategory(tpl, idx)}
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Add category */}
              <div className="arb-add-cat">
                {addingCatFor === tpl.id ? (
                  <>
                    <input
                      className="arb-add-cat-input"
                      placeholder="Nom de la catégorie..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory(tpl)}
                      autoFocus
                    />
                    <button className="arb-icon-btn" onClick={() => handleAddCategory(tpl)} title="Ajouter">
                      <Check size={16} />
                    </button>
                    <button className="arb-icon-btn" onClick={() => { setAddingCatFor(null); setNewCatName(''); }} title="Annuler">
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    className="arb-btn arb-btn-ghost"
                    onClick={() => { setAddingCatFor(tpl.id); setNewCatName(''); }}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Plus size={14} /> Ajouter une catégorie
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="arb-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="arb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="arb-modal-header">
              <h2>{editing ? 'Modifier l\'arborescence' : 'Nouvelle arborescence'}</h2>
              <button className="arb-modal-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="arb-modal-body">
              <div className="arb-field">
                <label>Nom</label>
                <input
                  className="arb-input"
                  placeholder="Ex: Arborescence conseil"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="arb-field">
                <label>Type de dossier</label>
                <select
                  className="arb-select"
                  value={form.folderType}
                  onChange={(e) => setForm({ ...form, folderType: e.target.value })}
                >
                  <option value="juridique">Juridique</option>
                  <option value="judiciaire">Judiciaire</option>
                </select>
              </div>
              <div className="arb-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  />
                  Définir comme arborescence par défaut pour ce type
                </label>
              </div>
            </div>
            <div className="arb-modal-footer">
              <button className="arb-btn arb-btn-secondary" onClick={() => setModalOpen(false)}>
                Annuler
              </button>
              <button className="arb-btn arb-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="arb-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="arb-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="arb-modal-header">
              <h2>Supprimer l'arborescence</h2>
              <button className="arb-modal-close" onClick={() => setDeleteTarget(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="arb-modal-body">
              <p className="arb-confirm-text">
                Voulez-vous vraiment supprimer l'arborescence <strong>{deleteTarget.name}</strong> ?
                Cette action est irréversible.
              </p>
            </div>
            <div className="arb-modal-footer">
              <button className="arb-btn arb-btn-secondary" onClick={() => setDeleteTarget(null)}>
                Annuler
              </button>
              <button className="arb-btn arb-btn-danger" onClick={handleDelete}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
