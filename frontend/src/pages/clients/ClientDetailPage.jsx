import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Send, Edit3, ChevronDown, ChevronRight,
  Save, FolderOpen, Clock, User, Phone, Heart, Users as UsersIcon,
  Globe, CheckCircle, RefreshCw, Archive, Trash2, RotateCcw, Building2,
} from 'lucide-react';
import { getClient, updateClient, sendClientForm, inviteExtranet, archiveClient, deleteClient } from '../../services/clientsApi';
import CompletenessAlert from '../../components/clients/CompletenessAlert';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
import './ClientDetailPage.css';

const formatDateField = (d) => {
  if (!d) return '';
  if (typeof d === 'string') return d.split('T')[0];
  if (d instanceof Date) return d.toISOString().split('T')[0];
  return '';
};

const STATUS_LABELS = { OPEN: 'Ouvert', IN_PROGRESS: 'En cours', PENDING: 'En attente', CLOSED: 'Fermé', ARCHIVED: 'Archivé' };
const STATUS_COLORS = { OPEN: 'badge--green', IN_PROGRESS: 'badge--blue', PENDING: 'badge--yellow', CLOSED: 'badge--gray', ARCHIVED: 'badge--purple' };
const TYPE_LABELS = { JURIDIQUE: 'Juridique', JUDICIAIRE: 'Judiciaire' };

// ============================================================
// Accordion section
// ============================================================
function Section({ title, icon, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const Icon = icon;
  return (
    <div className="detail-section">
      <button className="detail-section-header" onClick={() => setOpen(!open)}>
        <div className="detail-section-title">
          <Icon size={18} />
          <span>{title}</span>
        </div>
        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      {open && <div className="detail-section-body">{children}</div>}
    </div>
  );
}

// ============================================================
// Inline field
// ============================================================
function FieldRow({ label, value, fieldKey, editMode, onChange }) {
  const displayVal = value || '';
  return (
    <div className="detail-field">
      <span className="detail-field-label">{label}</span>
      {editMode ? (
        <input
          className="detail-field-input"
          value={displayVal}
          onChange={(e) => onChange(fieldKey, e.target.value)}
        />
      ) : (
        <span className={`detail-field-value ${!value ? 'detail-field-value--empty' : ''}`}>
          {value || 'Non renseigné'}
        </span>
      )}
    </div>
  );
}

// ============================================================
// Tab: Informations
// ============================================================
function TabInformations({ client, onSave, saving }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm({ ...client });
    setDirty(false);
    setEditMode(false);
  }, [client]);

  const handleChange = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
  };

  const handleSave = async () => {
    await onSave(form);
    setDirty(false);
    setEditMode(false);
  };

  const isMarried = form.situationFamiliale &&
    ['marie', 'marié', 'pacse', 'pacsé'].includes(form.situationFamiliale.toLowerCase());

  return (
    <div className="detail-tab-content">
      <div className="detail-tab-toolbar">
        <button
          className={`detail-edit-toggle ${editMode ? 'detail-edit-toggle--active' : ''}`}
          onClick={() => setEditMode(!editMode)}
        >
          <Edit3 size={16} />
          {editMode ? 'Annuler' : 'Modifier'}
        </button>
      </div>

      {/* GO-LIVE-1.C.1 — Identité société (personne morale : COMPANY / ASSOCIATION) */}
      {client.type !== 'INDIVIDUAL' && (
        <Section title="Identité société" icon={Building2} defaultOpen>
          <div className="detail-fields-grid">
            <FieldRow label="Raison sociale" value={form.companyName} fieldKey="companyName" editMode={editMode} onChange={handleChange} />
            <FieldRow label="Forme sociale" value={form.formeSociale} fieldKey="formeSociale" editMode={editMode} onChange={handleChange} />
            <FieldRow label="Capital social" value={form.capital} fieldKey="capital" editMode={editMode} onChange={handleChange} />
            <FieldRow label="SIRET" value={form.siret} fieldKey="siret" editMode={editMode} onChange={handleChange} />
            <FieldRow label="Siège social" value={form.siege} fieldKey="siege" editMode={editMode} onChange={handleChange} />
            <FieldRow label="RCS" value={form.rcs} fieldKey="rcs" editMode={editMode} onChange={handleChange} />
            <FieldRow label="Ville d'immatriculation" value={form.villeImmatriculation} fieldKey="villeImmatriculation" editMode={editMode} onChange={handleChange} />
            <FieldRow label="N° immatriculation (RCS/SIREN)" value={form.numeroImmatriculation} fieldKey="numeroImmatriculation" editMode={editMode} onChange={handleChange} />
            <FieldRow label="Objet social" value={form.objetSocial} fieldKey="objetSocial" editMode={editMode} onChange={handleChange} />
          </div>
        </Section>
      )}

      <Section title="Identité" icon={User} defaultOpen>
        <div className="detail-fields-grid">
          <FieldRow label="Civilité" value={form.civilite} fieldKey="civilite" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Nom" value={form.lastName} fieldKey="lastName" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Prénom" value={form.firstName} fieldKey="firstName" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Nom d'usage" value={form.nomUsage} fieldKey="nomUsage" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Date de naissance" value={formatDateField(form.birthDate)} fieldKey="birthDate" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Lieu de naissance" value={form.lieuNaissance} fieldKey="lieuNaissance" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Département" value={form.departementNaissance} fieldKey="departementNaissance" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Pays de naissance" value={form.paysNaissance} fieldKey="paysNaissance" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Nationalité" value={form.nationalite} fieldKey="nationalite" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Profession" value={form.profession} fieldKey="profession" editMode={editMode} onChange={handleChange} />
          <FieldRow label="N° Sécu" value={form.secu} fieldKey="secu" editMode={editMode} onChange={handleChange} />
        </div>
      </Section>

      <Section title="Coordonnées" icon={Phone}>
        <div className="detail-fields-grid">
          <FieldRow label="Adresse" value={form.address} fieldKey="address" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Complément" value={form.complementAdressePerso} fieldKey="complementAdressePerso" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Code postal" value={form.postalCode} fieldKey="postalCode" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Ville" value={form.city} fieldKey="city" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Téléphone" value={form.phone} fieldKey="phone" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Mobile" value={form.mobile} fieldKey="mobile" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Email" value={form.email} fieldKey="email" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Email secondaire" value={form.emailSecondaire} fieldKey="emailSecondaire" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Adresse pro" value={form.adressePro} fieldKey="adressePro" editMode={editMode} onChange={handleChange} />
          <FieldRow label="CP pro" value={form.cpPro} fieldKey="cpPro" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Ville pro" value={form.villePro} fieldKey="villePro" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Tél pro" value={form.telPro} fieldKey="telPro" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Fax" value={form.fax} fieldKey="fax" editMode={editMode} onChange={handleChange} />
        </div>
      </Section>

      <Section title="Situation familiale" icon={Heart}>
        <div className="detail-fields-grid">
          <FieldRow label="Situation" value={form.situationFamiliale} fieldKey="situationFamiliale" editMode={editMode} onChange={handleChange} />
          {isMarried && (
            <>
              <FieldRow label="Conjoint — Nom" value={form.conjointNom} fieldKey="conjointNom" editMode={editMode} onChange={handleChange} />
              <FieldRow label="Conjoint — Prénom" value={form.conjointPrenom} fieldKey="conjointPrenom" editMode={editMode} onChange={handleChange} />
              <FieldRow label="Conjoint — Date naiss." value={formatDateField(form.conjointDateNaissance)} fieldKey="conjointDateNaissance" editMode={editMode} onChange={handleChange} />
              <FieldRow label="Conjoint — Nationalité" value={form.conjointNationalite} fieldKey="conjointNationalite" editMode={editMode} onChange={handleChange} />
              <FieldRow label="Conjoint — Profession" value={form.conjointProfession} fieldKey="conjointProfession" editMode={editMode} onChange={handleChange} />
              <FieldRow label="Régime matrimonial" value={form.regimeMatrimonial} fieldKey="regimeMatrimonial" editMode={editMode} onChange={handleChange} />
              <FieldRow label="Date contrat mariage" value={formatDateField(form.dateContratMariage)} fieldKey="dateContratMariage" editMode={editMode} onChange={handleChange} />
              <FieldRow label="Notaire mariage" value={form.notaireMariage} fieldKey="notaireMariage" editMode={editMode} onChange={handleChange} />
            </>
          )}
          <FieldRow label="Enfants mineurs" value={form.nbEnfantsMineurs != null ? String(form.nbEnfantsMineurs) : ''} fieldKey="nbEnfantsMineurs" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Enfants majeurs" value={form.nbEnfantsMajeurs != null ? String(form.nbEnfantsMajeurs) : ''} fieldKey="nbEnfantsMajeurs" editMode={editMode} onChange={handleChange} />
        </div>
      </Section>

      <Section title="Filiation" icon={UsersIcon}>
        <div className="detail-fields-grid">
          <FieldRow label="Père — Nom" value={form.pereNom} fieldKey="pereNom" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Père — Prénom" value={form.perePrenom} fieldKey="perePrenom" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Mère — Nom de jeune fille" value={form.mereNomJeuneFille} fieldKey="mereNomJeuneFille" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Mère — Prénom" value={form.merePrenom} fieldKey="merePrenom" editMode={editMode} onChange={handleChange} />
        </div>
      </Section>

      {editMode && dirty && (
        <div className="detail-save-bar">
          <button className="detail-save-btn" onClick={handleSave} disabled={saving}>
            <Save size={16} />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tab: Dossiers
// ============================================================
function TabDossiers({ folders }) {
  const navigate = useNavigate();

  if (!folders || folders.length === 0) {
    return (
      <div className="detail-tab-content detail-tab-empty">
        <FolderOpen size={32} style={{ color: '#cbd5e1' }} />
        <p>Aucun dossier lié à ce client</p>
      </div>
    );
  }

  return (
    <div className="detail-tab-content">
      <table className="clients-table">
        <thead>
          <tr>
            <th className="clients-th">Référence</th>
            <th className="clients-th">Titre</th>
            <th className="clients-th">Type</th>
            <th className="clients-th">Statut</th>
            <th className="clients-th">Date ouverture</th>
          </tr>
        </thead>
        <tbody>
          {folders.map((f) => (
            <tr key={f.id} className="clients-row" onClick={() => navigate(`/dossiers/${f.id}`)}>
              <td className="clients-td" style={{ fontWeight: 600 }}>{f.reference}</td>
              <td className="clients-td">{f.title}</td>
              <td className="clients-td">
                <span className="badge badge--blue">{TYPE_LABELS[f.type] || f.type}</span>
              </td>
              <td className="clients-td">
                <span className={`badge ${STATUS_COLORS[f.status] || ''}`}>
                  {STATUS_LABELS[f.status] || f.status}
                </span>
              </td>
              <td className="clients-td">
                {f.openedAt ? new Date(f.openedAt).toLocaleDateString('fr-FR') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// Tab: Timeline
// ============================================================
const typeColors = {
  dossier_cree: '#10B981', dossier_modifie: '#059669', dossier_statut: '#F59E0B',
  dossier_cloture: '#6B7280', dossier_archive: '#6B7280', dossier_reouvert: '#10B981',
  document_cree: '#3B82F6', document_modifie: '#6366F1', document_supprime: '#EF4444',
  document_signe: '#10B981', document_genere: '#8B5CF6',
  personne_ajoutee: '#8B5CF6', personne_supprimee: '#EF4444',
  echeance_creee: '#F59E0B', echeance_terminee: '#10B981',
  email_envoye: '#F59E0B', signature_demandee: '#3B82F6',
  lrar_envoye: '#EF4444', ar_recu: '#10B981',
  extranet_invitation: '#06B6D4', extranet_relance: '#06B6D4',
  formulaire_envoye: '#F59E0B',
};

function relativeTime(d) {
  if (!d) return '';
  const now = new Date();
  const date = new Date(d);
  const mins = Math.floor((now - date) / 60000);
  if (mins < 1) return "A l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(d).toLocaleDateString('fr-FR');
}

function TabTimeline({ clientId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/clients/${clientId}/timeline`);
      setEvents(data.data || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  if (loading) {
    return (
      <div className="detail-tab-content detail-tab-empty">
        <div style={{ width: 24, height: 24, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="detail-tab-content detail-tab-empty">
        <Clock size={32} style={{ color: '#cbd5e1' }} />
        <p>Aucun evenement dans la timeline</p>
      </div>
    );
  }

  const uniqueTypes = [...new Set(events.map(e => e.type))];
  const filtered = typeFilter ? events.filter(e => e.type === typeFilter) : events;

  // Group by date
  const grouped = {};
  filtered.forEach(evt => {
    const key = new Date(evt.createdAt).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(evt);
  });

  return (
    <div className="detail-tab-content" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1e293b' }}>Historique client</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}
          >
            <option value="">Tous ({events.length})</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{t} ({events.filter(e => e.type === t).length})</option>
            ))}
          </select>
          <button onClick={fetchTimeline} style={{ fontSize: '0.8rem', padding: '4px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>
            Actualiser
          </button>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        {Object.entries(grouped).map(([date, evts]) => (
          <div key={date} style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'capitalize', marginBottom: '0.5rem', paddingLeft: 28 }}>
              {date}
            </div>
            {evts.map(evt => (
              <div key={evt.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8, paddingLeft: 4 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  backgroundColor: typeColors[evt.type] || '#9CA3AF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fff' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.8125rem', color: '#1e293b', margin: 0, lineHeight: 1.4 }}>{evt.description}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                    {evt.folderTitle && (
                      <Link to={`/dossiers/${evt.folderId}`} style={{ fontSize: '0.6875rem', color: '#3b82f6', textDecoration: 'none' }}>
                        {evt.folderTitle}
                      </Link>
                    )}
                    {evt.userName && <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{evt.userName}</span>}
                    <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{relativeTime(evt.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================
export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [activeTab, setActiveTab] = useState('informations');

  const fetchClient = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClient(id);
      setClient(data);
    } catch {
      toast.error('Impossible de charger le client');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      await updateClient(id, formData);
      await fetchClient();
      toast.success('Client mis à jour');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleSendForm = async () => {
    try {
      const result = await sendClientForm(id);
      toast.success(result.message || 'Formulaire envoyé');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Erreur lors de l'envoi");
    }
  };

  const handleInviteExtranet = async () => {
    setInviting(true);
    try {
      const result = await inviteExtranet(id);
      toast.success(`Invitation envoyée à ${result.email} (${result.foldersCount} dossier${result.foldersCount > 1 ? 's' : ''})`);
      await fetchClient();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Erreur lors de l'invitation extranet");
    } finally {
      setInviting(false);
    }
  };

  const handleArchive = async () => {
    const isActive = client.isActive !== false;
    const action = isActive ? 'archiver' : 'restaurer';
    if (!window.confirm(`Voulez-vous ${action} ce client ?`)) return;
    try {
      await archiveClient(id);
      toast.success(isActive ? 'Client archivé' : 'Client restauré');
      await fetchClient();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Erreur lors de l'archivage");
    }
  };

  // GO-LIVE-6 (post-contre-recette) — la suppression d'un client LIÉ était un cul-de-sac :
  // le back renvoie 400 (« a N dossier(s)… »), l'UI affichait juste une erreur sans issue, et
  // le double window.confirm natif pouvait être bloqué par le navigateur (perçu comme « figé »).
  // → un seul dialogue, puis proposition de CASCADE explicite (force=true) comme pour les dossiers.
  const handleDelete = async (force = false) => {
    if (!force && !window.confirm('Supprimer ce client ? Cette action est irréversible.')) return;
    try {
      await deleteClient(id, force);
      toast.success('Client supprimé');
      navigate('/clients');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || 'Erreur lors de la suppression';
      if (status === 400 && /dossier|force=true/i.test(msg)) {
        if (window.confirm(`${msg}\n\nSupprimer le client ET tous ses dossiers et documents ? Action irréversible.`)) {
          return handleDelete(true);
        }
        return;
      }
      toast.error(msg);
    }
  };

  if (loading) {
    return <div className="detail-loading">Chargement...</div>;
  }

  if (!client) {
    return <div className="detail-loading">Client introuvable</div>;
  }

  const clientName =
    client.type === 'INDIVIDUAL'
      ? `${client.firstName || ''} ${client.lastName || ''}`.trim()
      : client.companyName || '—';

  const completeness = client.completeness || { percent: 0, level: 'critique', criticalMissing: [] };
  const complColor =
    completeness.level === 'complet' ? '#10b981' : completeness.level === 'incomplet' ? '#f59e0b' : '#ef4444';

  return (
    <div className="client-detail">
      {/* Header */}
      <div className="detail-header">
        <Link to="/clients" className="detail-back">
          <ArrowLeft size={18} />
          Clients
        </Link>

        <div className="detail-header-main">
          <div className="detail-header-info">
            <h1 className="detail-header-name">{clientName}</h1>
            <span className="detail-header-meta">
              {client.type === 'INDIVIDUAL' ? 'PP' : 'PM'}
              {client.email && <> · {client.email}</>}
            </span>
          </div>

          <div className="detail-header-completeness">
            <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Complétude</span>
            <div className="detail-completeness-bar">
              <div className="detail-completeness-bar-fill" style={{ width: `${completeness.percent}%`, background: complColor }} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: complColor }}>
              {completeness.percent}%
            </span>
            {completeness.missing && completeness.missing.length > 0 && (
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {completeness.missing.length} champ{completeness.missing.length > 1 ? 's' : ''} manquant{completeness.missing.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="detail-header-actions">
            {client.email && (
              client.profileSubmittedAt ? (
                <span className="detail-action-btn detail-action-btn--success" style={{ cursor: 'default', opacity: 0.85, background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>
                  <CheckCircle size={16} />
                  Extranet actif
                </span>
              ) : client.hasExternet ? (
                <button className="detail-action-btn detail-action-btn--outline" onClick={handleInviteExtranet} disabled={inviting}>
                  <RefreshCw size={16} className={inviting ? 'spin' : ''} />
                  {inviting ? 'Envoi...' : 'Reinviter extranet'}
                </button>
              ) : (
                <button className="detail-action-btn detail-action-btn--primary" onClick={handleInviteExtranet} disabled={inviting} style={{ background: '#0066ff', color: '#fff', border: 'none' }}>
                  <Globe size={16} />
                  {inviting ? 'Envoi...' : 'Inviter a l\'extranet'}
                </button>
              )
            )}
            <button className="detail-action-btn detail-action-btn--outline" onClick={handleSendForm}>
              <Send size={16} />
              Envoyer le formulaire
            </button>
            <button className="detail-action-btn detail-action-btn--outline" onClick={handleArchive}>
              {client.isActive !== false ? <Archive size={16} /> : <RotateCcw size={16} />}
              {client.isActive !== false ? 'Archiver' : 'Restaurer'}
            </button>
            <button className="detail-action-btn detail-action-btn--danger" onClick={handleDelete}>
              <Trash2 size={16} />
              Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Completeness alert */}
      <CompletenessAlert
        percent={completeness.percent}
        level={completeness.level}
        criticalMissing={completeness.criticalMissing}
        clientName={clientName}
        onSendForm={handleSendForm}
        onComplete={() => setActiveTab('informations')}
      />

      {/* Tabs */}
      <div className="detail-tabs">
        <button
          className={`detail-tab ${activeTab === 'informations' ? 'detail-tab--active' : ''}`}
          onClick={() => setActiveTab('informations')}
        >
          Informations
        </button>
        <button
          className={`detail-tab ${activeTab === 'dossiers' ? 'detail-tab--active' : ''}`}
          onClick={() => setActiveTab('dossiers')}
        >
          Dossiers
          {client.folders && <span className="detail-tab-count">{client.folders.length}</span>}
        </button>
        <button
          className={`detail-tab ${activeTab === 'timeline' ? 'detail-tab--active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'informations' && (
        <TabInformations client={client} onSave={handleSave} saving={saving} />
      )}
      {activeTab === 'dossiers' && <TabDossiers folders={client.folders} />}
      {activeTab === 'timeline' && <TabTimeline clientId={id} />}
    </div>
  );
}
