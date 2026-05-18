import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const PERSON_ROLES = [
  { value: 'PARTIE_ADVERSE', label: 'Partie adverse' },
  { value: 'AVOCAT_ADVERSE', label: 'Avocat adverse' },
  { value: 'TEMOIN', label: 'Témoin' },
  { value: 'EXPERT', label: 'Expert' },
  { value: 'NOTAIRE', label: 'Notaire' },
  { value: 'HUISSIER', label: 'Huissier' },
  { value: 'MEDIATEUR', label: 'Médiateur' },
  { value: 'CO_DEBITEUR', label: 'Co-débiteur' },
  { value: 'AUTRE', label: 'Autre' },
];

const PERSON_TYPES = [
  { value: 'PHYSIQUE', label: 'Personne physique' },
  { value: 'MORALE', label: 'Personne morale' },
];

const roleColors = {
  PARTIE_ADVERSE: 'bg-red-100 text-red-700',
  AVOCAT_ADVERSE: 'bg-orange-100 text-orange-700',
  TEMOIN: 'bg-blue-100 text-blue-700',
  EXPERT: 'bg-purple-100 text-purple-700',
  NOTAIRE: 'bg-green-100 text-green-700',
  HUISSIER: 'bg-yellow-100 text-yellow-700',
  MEDIATEUR: 'bg-teal-100 text-teal-700',
  CO_DEBITEUR: 'bg-pink-100 text-pink-700',
  AUTRE: 'bg-gray-100 text-gray-700',
};

export default function FolderPersons({ folderId }) {
  const { token } = useContext(AuthContext);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const emptyForm = {
    type: 'PHYSIQUE',
    role: '',
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (folderId) {
      fetchPersons();
    }
  }, [folderId]);

  const fetchPersons = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/folders/${folderId}/persons?pageSize=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPersons(data.data || []);
    } catch (err) {
      console.error('Error fetching persons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (person = null) => {
    if (person) {
      setEditingPerson(person);
      setForm({
        type: person.type,
        role: person.role,
        firstName: person.firstName || '',
        lastName: person.lastName || '',
        company: person.company || '',
        email: person.email || '',
        phone: person.phone || '',
        address: person.address || '',
        notes: person.notes || '',
      });
    } else {
      setEditingPerson(null);
      setForm(emptyForm);
    }
    setError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPerson(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingPerson
        ? `${API_URL}/folders/${folderId}/persons/${editingPerson.id}`
        : `${API_URL}/folders/${folderId}/persons`;

      const res = await fetch(url, {
        method: editingPerson ? 'PUT' : 'POST',
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
      fetchPersons();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (personId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette personne ?')) return;

    try {
      const res = await fetch(`${API_URL}/folders/${folderId}/persons/${personId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchPersons();
      }
    } catch (err) {
      console.error('Error deleting person:', err);
    }
  };

  const getDisplayName = (person) => {
    if (person.type === 'MORALE') {
      return person.company || person.lastName;
    }
    return `${person.firstName || ''} ${person.lastName}`.trim();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Personnes liées</h3>
          <p className="text-sm text-gray-500">
            Parties adverses, avocats, témoins, experts...
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          + Ajouter une personne
        </button>
      </div>

      {/* Empty state */}
      {persons.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-200">
          <div className="text-3xl mb-3">👤</div>
          <h4 className="text-gray-900 font-medium">Aucune personne liée</h4>
          <p className="text-gray-500 text-sm mt-1">
            Ajoutez les parties adverses, avocats ou autres intervenants
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Ajouter une personne
          </button>
        </div>
      ) : (
        /* Persons list */
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {persons.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {getDisplayName(person)}
                    </div>
                    {person.type === 'MORALE' && person.lastName && (
                      <div className="text-sm text-gray-500">
                        Contact: {person.firstName} {person.lastName}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        roleColors[person.role] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {person.roleLabel || person.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {person.type === 'PHYSIQUE' ? 'Physique' : 'Morale'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {person.email || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {person.phone || '-'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(person)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(person.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingPerson ? 'Modifier la personne' : 'Ajouter une personne'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type and Role */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de personne *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {PERSON_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rôle *
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionnez un rôle</option>
                    {PERSON_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Company (for MORALE) */}
              {form.type === 'MORALE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raison sociale *
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom de la société"
                    required={form.type === 'MORALE'}
                  />
                </div>
              )}

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom {form.type === 'PHYSIQUE' ? '*' : '(contact)'}
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Prénom"
                    required={form.type === 'PHYSIQUE'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom"
                    required
                  />
                </div>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="01 23 45 67 89"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Adresse complète"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Informations complémentaires..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : editingPerson ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
