import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
import {
  Plus, Pencil, UserX, UserCheck, KeyRound, X, Users, Copy,
} from 'lucide-react';
import './UtilisateursSettings.css';

const ROLE_LABELS = {
  ADMIN: 'Administrateur',
  LAWYER: 'Avocat',
  ASSISTANT: 'Assistant(e)',
  USER: 'Utilisateur',
};

const ROLE_CLASSES = {
  ADMIN: 'usr-role-admin',
  LAWYER: 'usr-role-lawyer',
  ASSISTANT: 'usr-role-assistant',
  USER: 'usr-role-user',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function UtilisateursSettings() {
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', phone: '', role: 'USER', password: '' });
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);

  // Confirm actions
  const [confirmAction, setConfirmAction] = useState(null); // { type, user }

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.data || []);
    } catch (e) {
      showError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Create / Edit
  const openCreate = () => {
    setEditing(null);
    setForm({ email: '', firstName: '', lastName: '', phone: '', role: 'USER', password: '' });
    setTempPassword(null);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      role: user.role,
      password: '',
    });
    setTempPassword(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.email.trim() || !form.firstName.trim() || !form.lastName.trim()) {
      return showError('Email, prénom et nom sont requis');
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/users/${editing.id}`, {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || null,
          role: form.role,
        });
        success('Utilisateur modifié');
        setModalOpen(false);
      } else {
        const payload = {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || null,
          role: form.role,
        };
        if (form.password) payload.password = form.password;
        const { data } = await api.post('/users', payload);
        if (data.data?.temporaryPassword) {
          setTempPassword(data.data.temporaryPassword);
          success('Utilisateur créé');
        } else {
          success('Utilisateur créé');
          setModalOpen(false);
        }
      }
      fetchUsers();
    } catch (e) {
      showError(e.response?.data?.error?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  // Deactivate / Activate
  const handleToggleActive = async () => {
    if (!confirmAction?.user) return;
    const { user, type } = confirmAction;
    try {
      if (type === 'deactivate') {
        await api.post(`/users/${user.id}/deactivate`);
        success(`${user.firstName} ${user.lastName} désactivé`);
      } else {
        await api.post(`/users/${user.id}/activate`);
        success(`${user.firstName} ${user.lastName} réactivé`);
      }
      setConfirmAction(null);
      fetchUsers();
    } catch (e) {
      showError(e.response?.data?.error?.message || 'Erreur');
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!confirmAction?.user) return;
    try {
      const { data } = await api.post(`/users/${confirmAction.user.id}/reset-password`);
      setConfirmAction(null);
      if (data.data?.temporaryPassword) {
        setTempPassword(data.data.temporaryPassword);
        setEditing(confirmAction.user);
        setModalOpen(true);
        setForm({
          email: confirmAction.user.email,
          firstName: confirmAction.user.firstName,
          lastName: confirmAction.user.lastName,
          phone: confirmAction.user.phone || '',
          role: confirmAction.user.role,
          password: '',
        });
      }
      success('Mot de passe réinitialisé');
    } catch (e) {
      showError('Erreur');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => success('Copié'));
  };

  if (loading) {
    return <div className="usr-loading"><div className="usr-spinner" /></div>;
  }

  return (
    <div className="usr-container">
      {/* Header */}
      <div className="usr-header">
        <div>
          <h1 className="usr-title">Utilisateurs</h1>
          <p className="usr-subtitle">
            Gérez les membres de votre cabinet et leurs rôles.
          </p>
        </div>
        <button className="usr-btn usr-btn-primary" onClick={openCreate}>
          <Plus size={16} /> Inviter un utilisateur
        </button>
      </div>

      {/* Table */}
      <div className="usr-table-wrap">
        <table className="usr-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Dernière connexion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const initials = `${(u.firstName || '')[0] || ''}${(u.lastName || '')[0] || ''}`.toUpperCase();
              return (
                <tr key={u.id}>
                  <td>
                    <div className="usr-name-cell">
                      <div className={`usr-avatar ${!u.isActive ? 'usr-avatar-inactive' : ''}`}>
                        {initials}
                      </div>
                      <div>
                        <div className="usr-name">{u.firstName} {u.lastName}</div>
                        <div className="usr-email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`usr-role ${ROLE_CLASSES[u.role] || 'usr-role-user'}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`usr-status ${u.isActive ? 'usr-status-active' : 'usr-status-inactive'}`}>
                      <span className="usr-status-dot" />
                      {u.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <span className="usr-date">{formatDate(u.lastLoginAt)}</span>
                  </td>
                  <td>
                    <div className="usr-actions">
                      <button className="usr-icon-btn" title="Modifier" onClick={() => openEdit(u)}>
                        <Pencil size={16} />
                      </button>
                      <button
                        className="usr-icon-btn"
                        title="Réinitialiser le mot de passe"
                        onClick={() => setConfirmAction({ type: 'reset', user: u })}
                      >
                        <KeyRound size={16} />
                      </button>
                      {u.isActive ? (
                        <button
                          className="usr-icon-btn usr-icon-btn-danger"
                          title="Désactiver"
                          onClick={() => setConfirmAction({ type: 'deactivate', user: u })}
                        >
                          <UserX size={16} />
                        </button>
                      ) : (
                        <button
                          className="usr-icon-btn"
                          title="Réactiver"
                          onClick={() => setConfirmAction({ type: 'activate', user: u })}
                          style={{ color: '#10B981' }}
                        >
                          <UserCheck size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="usr-modal-overlay" onClick={() => { setModalOpen(false); setTempPassword(null); }}>
          <div className="usr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="usr-modal-header">
              <h2>{editing ? 'Modifier l\'utilisateur' : 'Inviter un utilisateur'}</h2>
              <button className="usr-modal-close" onClick={() => { setModalOpen(false); setTempPassword(null); }}>
                <X size={18} />
              </button>
            </div>
            <div className="usr-modal-body">
              {tempPassword && (
                <div className="usr-temp-pwd">
                  <div className="usr-temp-pwd-label">Mot de passe temporaire :</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="usr-temp-pwd-value">{tempPassword}</span>
                    <button
                      className="usr-icon-btn"
                      onClick={() => copyToClipboard(tempPassword)}
                      title="Copier"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              )}

              {!tempPassword && (
                <>
                  <div className="usr-row">
                    <div className="usr-field">
                      <label>Prénom *</label>
                      <input
                        className="usr-input"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        placeholder="Jean"
                      />
                    </div>
                    <div className="usr-field">
                      <label>Nom *</label>
                      <input
                        className="usr-input"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        placeholder="Dupont"
                      />
                    </div>
                  </div>
                  <div className="usr-field">
                    <label>Email *</label>
                    <input
                      className="usr-input"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jean.dupont@cabinet.fr"
                      disabled={!!editing}
                    />
                  </div>
                  <div className="usr-row">
                    <div className="usr-field">
                      <label>Téléphone</label>
                      <input
                        className="usr-input"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                    <div className="usr-field">
                      <label>Rôle</label>
                      <select
                        className="usr-select"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                      >
                        <option value="ADMIN">Administrateur</option>
                        <option value="LAWYER">Avocat</option>
                        <option value="ASSISTANT">Assistant(e)</option>
                        <option value="USER">Utilisateur</option>
                      </select>
                    </div>
                  </div>
                  {!editing && (
                    <div className="usr-field">
                      <label>Mot de passe (optionnel, sinon généré automatiquement)</label>
                      <input
                        className="usr-input"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Laisser vide pour un mot de passe auto"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            {!tempPassword && (
              <div className="usr-modal-footer">
                <button className="usr-btn usr-btn-secondary" onClick={() => setModalOpen(false)}>
                  Annuler
                </button>
                <button className="usr-btn usr-btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Inviter'}
                </button>
              </div>
            )}
            {tempPassword && (
              <div className="usr-modal-footer">
                <button className="usr-btn usr-btn-primary" onClick={() => { setModalOpen(false); setTempPassword(null); }}>
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm action modal */}
      {confirmAction && (
        <div className="usr-modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="usr-modal usr-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="usr-modal-header">
              <h2>
                {confirmAction.type === 'deactivate' && 'Désactiver l\'utilisateur'}
                {confirmAction.type === 'activate' && 'Réactiver l\'utilisateur'}
                {confirmAction.type === 'reset' && 'Réinitialiser le mot de passe'}
              </h2>
              <button className="usr-modal-close" onClick={() => setConfirmAction(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="usr-modal-body">
              <p className="usr-confirm-text">
                {confirmAction.type === 'deactivate' && (
                  <>Voulez-vous vraiment désactiver <strong>{confirmAction.user.firstName} {confirmAction.user.lastName}</strong> ? L'utilisateur ne pourra plus se connecter.</>
                )}
                {confirmAction.type === 'activate' && (
                  <>Voulez-vous réactiver <strong>{confirmAction.user.firstName} {confirmAction.user.lastName}</strong> ?</>
                )}
                {confirmAction.type === 'reset' && (
                  <>Réinitialiser le mot de passe de <strong>{confirmAction.user.firstName} {confirmAction.user.lastName}</strong> ? Un nouveau mot de passe temporaire sera généré.</>
                )}
              </p>
            </div>
            <div className="usr-modal-footer">
              <button className="usr-btn usr-btn-secondary" onClick={() => setConfirmAction(null)}>
                Annuler
              </button>
              {confirmAction.type === 'reset' ? (
                <button className="usr-btn usr-btn-warning" onClick={handleResetPassword}>
                  Réinitialiser
                </button>
              ) : (
                <button
                  className={`usr-btn ${confirmAction.type === 'deactivate' ? 'usr-btn-danger' : 'usr-btn-success'}`}
                  onClick={handleToggleActive}
                >
                  {confirmAction.type === 'deactivate' ? 'Désactiver' : 'Réactiver'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
