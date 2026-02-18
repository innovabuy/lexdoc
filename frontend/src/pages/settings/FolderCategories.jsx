import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const DEFAULT_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

const ICONS = [
  { value: 'FileText', label: 'Document' },
  { value: 'Folder', label: 'Dossier' },
  { value: 'Scale', label: 'Balance' },
  { value: 'Building', label: 'Entreprise' },
  { value: 'Users', label: 'Personnes' },
  { value: 'Briefcase', label: 'Mallette' },
  { value: 'Home', label: 'Maison' },
  { value: 'Shield', label: 'Bouclier' },
  { value: 'FileSignature', label: 'Signature' },
  { value: 'Gavel', label: 'Marteau' },
  { value: 'Upload', label: 'Upload' },
  { value: 'Paperclip', label: 'Pièce jointe' },
];

function CategoryTree({ categories, level = 0, onEdit, onDelete, onAddChild }) {
  return (
    <div className={level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}>
      {categories.map((category) => (
        <div key={category.id} className="mb-2">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-sm group">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-white text-sm"
                style={{ backgroundColor: category.color || '#3B82F6' }}
              >
                {category.icon?.[0] || 'F'}
              </div>
              <div>
                <span className="font-medium text-gray-900">{category.name}</span>
                {category.description && (
                  <p className="text-sm text-gray-500 truncate max-w-md">
                    {category.description}
                  </p>
                )}
              </div>
              {category._count?.documents > 0 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {category._count.documents} doc{category._count.documents > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onAddChild(category)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Ajouter sous-catégorie"
              >
                +
              </button>
              <button
                onClick={() => onEdit(category)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Modifier"
              >
                ✎
              </button>
              <button
                onClick={() => onDelete(category)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          </div>
          {category.children?.length > 0 && (
            <CategoryTree
              categories={category.children}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function FolderCategories() {
  const { token } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [parentCategory, setParentCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const emptyForm = {
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'FileText',
    parentId: null,
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/folder-categories?format=tree`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategories(data.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null, parent = null) => {
    if (category) {
      setEditingCategory(category);
      setParentCategory(null);
      setForm({
        name: category.name,
        description: category.description || '',
        color: category.color || '#3B82F6',
        icon: category.icon || 'FileText',
        parentId: category.parentId || null,
      });
    } else if (parent) {
      setEditingCategory(null);
      setParentCategory(parent);
      setForm({
        ...emptyForm,
        parentId: parent.id,
      });
    } else {
      setEditingCategory(null);
      setParentCategory(null);
      setForm(emptyForm);
    }
    setError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setParentCategory(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingCategory
        ? `${API_URL}/folder-categories/${editingCategory.id}`
        : `${API_URL}/folder-categories`;

      const res = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }

      handleCloseModal();
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const hasChildren = category.children?.length > 0;
    const hasDocuments = category._count?.documents > 0;

    let message = `Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`;
    if (hasChildren) {
      message += '\n\nAttention: Les sous-catégories seront également supprimées.';
    }
    if (hasDocuments) {
      message += `\n\nLes ${category._count.documents} document(s) de cette catégorie seront décatégorisés.`;
    }

    if (!confirm(message)) return;

    try {
      const res = await fetch(`${API_URL}/folder-categories/${category.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchCategories();
      }
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Catégories de documents</h1>
            <p className="text-gray-500 mt-1">
              Organisez vos documents avec une structure hiérarchique de catégories
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span>+</span>
            Nouvelle catégorie
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Chargement...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📁</div>
              <h3 className="font-medium text-gray-900 mb-2">Aucune catégorie</h3>
              <p className="text-gray-500 mb-4">
                Créez des catégories pour organiser vos documents
              </p>
              <button
                onClick={() => handleOpenModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Créer une catégorie
              </button>
            </div>
          ) : (
            <CategoryTree
              categories={categories}
              onEdit={handleOpenModal}
              onDelete={handleDelete}
              onAddChild={(parent) => handleOpenModal(null, parent)}
            />
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory
                  ? 'Modifier la catégorie'
                  : parentCategory
                  ? `Nouvelle sous-catégorie de "${parentCategory.name}"`
                  : 'Nouvelle catégorie'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        form.color === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icône
                </label>
                <select
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {ICONS.map((icon) => (
                    <option key={icon.value} value={icon.value}>
                      {icon.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : editingCategory ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
